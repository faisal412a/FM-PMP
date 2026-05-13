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

  const quoteAmount = Number(body.quote_amount || 0);
  const effectiveProjectValue = quoteAmount || Number(project.project_value || 0);
  if (Number(body.po_amount || 0) > effectiveProjectValue && auth.user.role !== "Admin") {
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
  run("update projects set project_value = ?, supplier_name = coalesce(nullif(?, ''), supplier_name), updated_at = current_timestamp where id = ?", [
    effectiveProjectValue,
    body.supplier_name || "",
    projectId
  ]);
  if (body.po_number || body.po_date || Number(body.po_amount || 0) > 0) {
    run("update projects set status = 'In Progress', updated_at = current_timestamp where id = ? and status = 'Bidding'", [projectId]);
  }
  logActivity({ userId: auth.user.id, action: "Quote and PO updated", module: "Projects", newValue: { projectId, ...body } });
  return json({ ok: true });
}
