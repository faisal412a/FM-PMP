import { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";
import { logActivity, row, run } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireUser(request, "project:write");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const projectId = Number(id);
  const body = await request.json();
  const project = row<any>("select project_value from projects where id = ?", [projectId]);
  if (!project) return json({ error: "Project not found" }, 404);

  if (Number(body.po_amount || 0) > Number(project.project_value || 0) && auth.user.role !== "Admin") {
    return json({ error: "PO amount cannot exceed project value without Admin confirmation" }, 400);
  }

  run(
    `update project_quotes set quote_number=?, quote_date=?, quote_amount=?, supplier_name=?, quote_file=? where project_id=?`,
    [body.quote_number || "", body.quote_date || null, Number(body.quote_amount || 0), body.supplier_name || "", body.quote_file || "", projectId]
  );
  run("update project_pos set po_number=?, po_date=?, po_amount=?, po_file=? where project_id=?", [
    body.po_number || "",
    body.po_date || null,
    Number(body.po_amount || 0),
    body.po_file || "",
    projectId
  ]);
  logActivity({ userId: auth.user.id, action: "Quote and PO updated", module: "Projects", newValue: { projectId, ...body } });
  return json({ ok: true });
}
