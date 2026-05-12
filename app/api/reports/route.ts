import { NextRequest } from "next/server";
import { json, parseSearch, requireUser } from "@/lib/api";
import { logActivity, rows } from "@/lib/db";
import { projectSummary } from "@/lib/calculations";

export async function GET(request: NextRequest) {
  const auth = requireUser(request, "report:read");
  if ("error" in auth) return auth.error;
  const filters = parseSearch(request);
  const clauses: string[] = [];
  const params: unknown[] = [];
  if (filters.status) {
    clauses.push("projects.status = ?");
    params.push(filters.status);
  }
  if (filters.client) {
    clauses.push("projects.client_name like ?");
    params.push(`%${filters.client}%`);
  }
  if (filters.supplier) {
    clauses.push("projects.supplier_name like ?");
    params.push(`%${filters.supplier}%`);
  }
  if (filters.from) {
    clauses.push("projects.start_date >= ?");
    params.push(filters.from);
  }
  if (filters.to) {
    clauses.push("projects.start_date <= ?");
    params.push(filters.to);
  }
  const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
  const projects = rows<any>(`select * from projects ${where} order by start_date desc`, params).map((project) => ({
    ...project,
    summary: projectSummary(project.id)
  }));
  const payments = rows<any>(
    `select projects.project_number, projects.name as project_name, projects.client_name, payment_terms.*
     from payment_terms join projects on projects.id = payment_terms.project_id
     ${where.replaceAll("projects.", "projects.")}
     order by due_date`,
    params
  );
  const phases = rows<any>(
    `select projects.project_number, projects.name as project_name, project_phases.*
     from project_phases join projects on projects.id = project_phases.project_id
     ${where}
     order by projects.project_number, project_phases.id`,
    params
  );
  const evaluations = rows<any>(
    `select projects.project_number, projects.name as project_name, projects.supplier_name, supplier_evaluations.*
     from supplier_evaluations join projects on projects.id = supplier_evaluations.project_id ${where}`,
    params
  );

  if (filters.export) {
    logActivity({ userId: auth.user.id, action: "Report exported", module: "Reports", newValue: filters });
  }

  return json({ projects, payments, phases, evaluations });
}
