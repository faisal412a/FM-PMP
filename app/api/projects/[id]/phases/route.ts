import { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";
import { logActivity, row, run } from "@/lib/db";
import { refreshPhaseDelays } from "@/lib/calculations";

function maybeCompleteProject(projectId: number) {
  const handover = row<any>("select completion_percentage from project_phases where project_id = ? and phase_name = 'Handover'", [projectId]);
  if (Number(handover?.completion_percentage || 0) >= 100) {
    run("update projects set status = 'Completed', actual_completion_date = coalesce(actual_completion_date, date('now')), updated_at = current_timestamp where id = ?", [projectId]);
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireUser(request, "progress:write");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const projectId = Number(id);
  const body = await request.json();
  const result = run(
    `insert into project_phases
     (project_id, phase_name, planned_start_date, planned_completion_date, actual_start_date, actual_completion_date,
      responsible_person, status, completion_percentage, delay_days, remarks, attachment_file)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    [
      projectId,
      body.phase_name,
      body.planned_start_date || null,
      body.planned_completion_date || null,
      body.actual_start_date || null,
      body.actual_completion_date || null,
      body.responsible_person || "",
      body.status || "Not Started",
      Number(body.completion_percentage || 0),
      body.remarks || "",
      body.attachment_file || ""
    ]
  );
  refreshPhaseDelays(projectId);
  maybeCompleteProject(projectId);
  logActivity({ userId: auth.user.id, action: "Progress phase added", module: "Progress", newValue: { projectId, phaseId: result.lastInsertRowid } });
  return json({ id: result.lastInsertRowid }, 201);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireUser(request, "progress:write");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const projectId = Number(id);
  const body = await request.json();
  const before = row<any>("select * from project_phases where id = ? and project_id = ?", [body.id, projectId]);
  if (!before) return json({ error: "Phase not found" }, 404);
  run(
    `update project_phases set phase_name=?, planned_start_date=?, planned_completion_date=?,
     actual_start_date=?, actual_completion_date=?, responsible_person=?, status=?, completion_percentage=?,
     remarks=?, attachment_file=? where id=? and project_id=?`,
    [
      body.phase_name,
      body.planned_start_date || null,
      body.planned_completion_date || null,
      body.actual_start_date || null,
      body.actual_completion_date || null,
      body.responsible_person || "",
      body.status || "Not Started",
      Number(body.completion_percentage || 0),
      body.remarks || "",
      body.attachment_file || "",
      body.id,
      projectId
    ]
  );
  refreshPhaseDelays(projectId);
  maybeCompleteProject(projectId);
  logActivity({ userId: auth.user.id, action: "Progress phase updated", module: "Progress", oldValue: before, newValue: { projectId, ...body } });
  return json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireUser(request, "progress:write");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const projectId = Number(id);
  const phaseId = Number(request.nextUrl.searchParams.get("phaseId"));
  const before = row<any>("select * from project_phases where id = ? and project_id = ?", [phaseId, projectId]);
  if (!before) return json({ error: "Phase not found" }, 404);
  run("delete from project_phases where id = ? and project_id = ?", [phaseId, projectId]);
  logActivity({ userId: auth.user.id, action: "Progress phase deleted", module: "Progress", oldValue: before, newValue: { projectId } });
  return json({ ok: true });
}
