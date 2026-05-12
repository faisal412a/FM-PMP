import { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";
import { logActivity, row, run } from "@/lib/db";
import { projectSummary } from "@/lib/calculations";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireUser(request, "project:write");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const projectId = Number(id);
  const body = await request.json();
  const ratings = [
    "delivery_quality",
    "timeline_commitment",
    "communication",
    "cost_control",
    "issue_resolution",
    "documentation",
    "overall_rating"
  ].map((key) => Math.min(5, Math.max(1, Number(body[key] || 3))));
  const average = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
  const summary = projectSummary(projectId);
  const successScore = average * 12 + summary.progress * 0.25 + summary.paymentCompletion * 0.15 - summary.delayDays * 0.2;
  const before = row<any>("select * from supplier_evaluations where project_id = ?", [projectId]);
  if (before) run("delete from supplier_evaluations where project_id = ?", [projectId]);
  run(
    `insert into supplier_evaluations
     (project_id, delivery_quality, timeline_commitment, communication, cost_control, issue_resolution,
      documentation, overall_rating, average_rating, success_score, remarks, created_by)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [projectId, ...ratings, average, Math.max(0, Math.min(100, successScore)), body.remarks || "", auth.user.id]
  );
  logActivity({ userId: auth.user.id, action: "Supplier evaluation saved", module: "Evaluation", oldValue: before, newValue: { projectId, average } });
  return json({ ok: true });
}
