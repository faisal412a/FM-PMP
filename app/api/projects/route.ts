import { NextRequest } from "next/server";
import { json, parseSearch, requireUser } from "@/lib/api";
import { db, logActivity, row, rows, run } from "@/lib/db";
import { projectSummary } from "@/lib/calculations";

function nextProjectNumber() {
  const year = new Date().getFullYear();
  const count = row<{ total: number }>("select count(*) as total from projects where project_number like ?", [`PRJ-${year}-%`])?.total ?? 0;
  return `PRJ-${year}-${String(count + 1).padStart(4, "0")}`;
}

function projectFilter(filters: Record<string, string>) {
  const clauses: string[] = [];
  const params: unknown[] = [];
  for (const [key, column] of Object.entries({
    client: "client_name",
    supplier: "supplier_name",
    status: "status",
    manager: "project_manager",
    category: "category"
  })) {
    if (filters[key]) {
      clauses.push(`${column} like ?`);
      params.push(`%${filters[key]}%`);
    }
  }
  if (filters.search) {
    clauses.push("(name like ? or project_number like ? or client_name like ?)");
    params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
  }
  return { where: clauses.length ? `where ${clauses.join(" and ")}` : "", params };
}

export async function GET(request: NextRequest) {
  const auth = requireUser(request, "project:read");
  if ("error" in auth) return auth.error;
  const { where, params } = projectFilter(parseSearch(request));
  const projects = rows<any>(`select * from projects ${where} order by created_at desc`, params).map((project) => ({
    ...project,
    summary: projectSummary(project.id)
  }));
  return json({ projects });
}

export async function POST(request: NextRequest) {
  const auth = requireUser(request, "project:write");
  if ("error" in auth) return auth.error;
  const body = await request.json();
  if (!body.name || !body.client_name) return json({ error: "Project name and client name are required" }, 400);
  if (body.actual_completion_date && body.start_date && body.actual_completion_date < body.start_date) {
    return json({ error: "Actual completion date cannot be before start date" }, 400);
  }
  if (Number(body.po_amount || 0) > Number(body.project_value || 0) && auth.user.role !== "Admin") {
    return json({ error: "PO amount cannot exceed project value without Admin confirmation" }, 400);
  }

  const insert = db.transaction(() => {
    const result = run(
      `insert into projects
       (project_number, name, client_name, supplier_name, project_manager, category, location, start_date,
        expected_completion_date, actual_completion_date, status, project_value, notes, created_by)
       values (@project_number, @name, @client_name, @supplier_name, @project_manager, @category, @location, @start_date,
        @expected_completion_date, @actual_completion_date, @status, @project_value, @notes, @created_by)`,
      {
        project_number: nextProjectNumber(),
        name: body.name,
        client_name: body.client_name,
        supplier_name: body.supplier_name || "",
        project_manager: body.project_manager || "",
        category: body.category || "",
        location: body.location || "",
        start_date: body.start_date || null,
        expected_completion_date: body.expected_completion_date || null,
        actual_completion_date: body.actual_completion_date || null,
        status: body.status || "In Progress",
        project_value: Number(body.project_value || 0),
        notes: body.notes || "",
        created_by: auth.user.id
      }
    );
    const projectId = Number(result.lastInsertRowid);
    run(
      "insert into project_quotes (project_id, quote_number, quote_date, quote_amount, quote_file) values (?, ?, ?, ?, ?)",
      [projectId, body.quote_number || "", body.quote_date || null, Number(body.quote_amount || 0), body.quote_file || ""]
    );
    run("insert into project_pos (project_id, po_number, po_date, po_amount, po_file) values (?, ?, ?, ?, ?)", [
      projectId,
      body.po_number || "",
      body.po_date || null,
      Number(body.po_amount || 0),
      body.po_file || ""
    ]);
    logActivity({ userId: auth.user.id, action: "Project created", module: "Projects", newValue: { projectId, name: body.name } });
    return projectId;
  });

  return json({ id: insert() }, 201);
}
