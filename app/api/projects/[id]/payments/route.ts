import { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";
import { logActivity, row, rows, run } from "@/lib/db";
import { refreshPaymentStatuses } from "@/lib/calculations";

function dbPaymentStatus(status?: string) {
  if (status === "Due") return "Pending";
  if (status === "Partial Paid") return "Partially Paid";
  if (status === "Delayed") return "Overdue";
  return status || "Pending";
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireUser(request, "payment:write");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const projectId = Number(id);
  const project = row<any>("select project_value from projects where id = ?", [projectId]);
  if (!project) return json({ error: "Project not found" }, 404);
  const body = await request.json();
  const existing = rows<any>("select payment_percentage, payment_amount from payment_terms where project_id = ?", [projectId]);
  const totalPercentage = existing.reduce((sum, item) => sum + Number(item.payment_percentage || 0), 0) + Number(body.payment_percentage || 0);
  const totalAmount = existing.reduce((sum, item) => sum + Number(item.payment_amount || 0), 0) + Number(body.payment_amount || 0);
  if (totalPercentage > 100) return json({ error: "Payment percentage total should not exceed 100%" }, 400);
  if (totalAmount > Number(project.project_value || 0)) return json({ error: "Payment amount total should not exceed project value" }, 400);
  const paid = Number(body.paid_amount || 0);
  const amount = Number(body.payment_amount || 0);
  const balance = Math.max(0, amount - paid);
  const result = run(
    `insert into payment_terms
     (project_id, stage_name, payment_percentage, payment_amount, due_date, payment_date, paid_amount, balance_amount, status, remarks)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      projectId,
      body.stage_name,
      Number(body.payment_percentage || 0),
      amount,
      body.due_date || null,
      body.payment_date || null,
      paid,
      balance,
      dbPaymentStatus(body.status),
      body.remarks || ""
    ]
  );
  refreshPaymentStatuses(projectId);
  logActivity({ userId: auth.user.id, action: "Payment added", module: "Payments", newValue: { projectId, paymentId: result.lastInsertRowid } });
  return json({ id: result.lastInsertRowid }, 201);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireUser(request, "payment:write");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const projectId = Number(id);
  const body = await request.json();
  const before = row<any>("select * from payment_terms where id = ? and project_id = ?", [body.id, projectId]);
  if (!before) return json({ error: "Payment term not found" }, 404);
  const paid = Number(body.paid_amount || 0);
  const amount = Number(body.payment_amount || 0);
  run(
    `update payment_terms set stage_name=?, payment_percentage=?, payment_amount=?, due_date=?,
     payment_date=?, paid_amount=?, balance_amount=?, status=?, remarks=? where id=? and project_id=?`,
    [
      body.stage_name,
      Number(body.payment_percentage || 0),
      amount,
      body.due_date || null,
      body.payment_date || null,
      paid,
      Math.max(0, amount - paid),
      dbPaymentStatus(body.status),
      body.remarks || "",
      body.id,
      projectId
    ]
  );
  refreshPaymentStatuses(projectId);
  logActivity({ userId: auth.user.id, action: "Payment updated", module: "Payments", oldValue: before, newValue: { projectId, ...body } });
  return json({ ok: true });
}
