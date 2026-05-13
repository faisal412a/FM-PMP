import { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";
import { db, logActivity, row, rows, run } from "@/lib/db";
import { projectSummary } from "@/lib/calculations";

function getProject(id: number) {
  const project = row<any>("select * from projects where id = ?", [id]);
  if (!project) return null;
  return {
    ...project,
    quote: row<any>("select * from project_quotes where project_id = ?", [id]),
    po: row<any>("select * from project_pos where project_id = ?", [id]),
    supplierOptions: rows<any>("select distinct supplier_name from projects where supplier_name is not null and supplier_name != '' order by supplier_name").map((item) => item.supplier_name),
    payments: rows<any>("select * from payment_terms where project_id = ? order by due_date", [id]),
    phases: rows<any>("select * from project_phases where project_id = ? order by id", [id]),
    documents: rows<any>("select * from project_documents where project_id = ? order by uploaded_at desc", [id]),
    evaluation: row<any>("select * from supplier_evaluations where project_id = ?", [id]),
    activity: rows<any>(
      `select activity_logs.*, users.name as user_name
       from activity_logs left join users on users.id = activity_logs.user_id
       where new_value like ? or old_value like ? or module in ('Payments','Progress','Evaluation')
       order by activity_logs.created_at desc limit 50`,
      [`%"projectId":${id}%`, `%"projectId":${id}%`]
    ),
    summary: projectSummary(id)
  };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireUser(request, "project:read");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const project = getProject(Number(id));
  if (!project) return json({ error: "Project not found" }, 404);
  return json({ project });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireUser(request, "project:write");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const projectId = Number(id);
  const before = row<any>("select * from projects where id = ?", [projectId]);
  if (!before) return json({ error: "Project not found" }, 404);
  const body = await request.json();
  if (!body.name || !body.client_name) return json({ error: "Project name and client name are required" }, 400);
  if (body.actual_completion_date && body.start_date && body.actual_completion_date < body.start_date) {
    return json({ error: "Actual completion date cannot be before start date" }, 400);
  }
  if (Number(body.po_amount || 0) > Number(body.project_value || 0) && auth.user.role !== "Admin") {
    return json({ error: "PO amount cannot exceed project value without Admin confirmation" }, 400);
  }

  db.transaction(() => {
    run(
      `update projects set name=@name, client_name=@client_name, supplier_name=@supplier_name,
       project_manager=@project_manager, category=@category, location=@location, start_date=@start_date,
       expected_completion_date=@expected_completion_date, actual_completion_date=@actual_completion_date,
       status=@status, project_value=@project_value, notes=@notes, updated_at=current_timestamp where id=@id`,
      {
        id: projectId,
        name: body.name,
        client_name: body.client_name,
        supplier_name: body.supplier_name || "",
        project_manager: body.project_manager || "",
        category: body.category || "",
        location: body.location || "",
        start_date: body.start_date || null,
        expected_completion_date: body.expected_completion_date || null,
        actual_completion_date: body.actual_completion_date || before.actual_completion_date || null,
        status: body.status || "Bidding",
        project_value: Number(body.project_value || 0),
        notes: body.notes || ""
      }
    );
    logActivity({ userId: auth.user.id, action: "Project updated", module: "Projects", oldValue: before, newValue: { projectId, ...body } });
  })();

  return json({ project: getProject(projectId) });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireUser(request);
  if ("error" in auth) return auth.error;
  if (auth.user.role !== "Admin") return json({ error: "Only Admin can delete projects" }, 403);
  const { id } = await params;
  const before = row<any>("select * from projects where id = ?", [Number(id)]);
  if (!before) return json({ error: "Project not found" }, 404);
  run("delete from projects where id = ?", [Number(id)]);
  logActivity({ userId: auth.user.id, action: "Project deleted", module: "Projects", oldValue: before });
  return json({ ok: true });
}
