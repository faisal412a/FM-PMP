import { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";
import { logActivity, rows, run } from "@/lib/db";

export async function GET(request: NextRequest) {
  const auth = requireUser(request, "supplier:read");
  if ("error" in auth) return auth.error;
  const suppliers = rows<any>(`
    select
      suppliers.*,
      count(projects.id) as projects_won,
      coalesce(sum(projects.project_value), 0) as total_value,
      coalesce(avg(supplier_evaluations.average_rating), 0) as average_rating
    from suppliers
    left join projects on projects.supplier_name = suppliers.name
    left join supplier_evaluations on supplier_evaluations.project_id = projects.id
    group by suppliers.id
    order by suppliers.name
  `);
  const discovered = rows<any>(`
    select
      projects.supplier_name as name,
      '' as contact_person,
      '' as email,
      '' as phone,
      '' as category,
      '' as notes,
      null as created_at,
      count(projects.id) as projects_won,
      coalesce(sum(projects.project_value), 0) as total_value,
      coalesce(avg(supplier_evaluations.average_rating), 0) as average_rating
    from projects
    left join suppliers on suppliers.name = projects.supplier_name
    left join supplier_evaluations on supplier_evaluations.project_id = projects.id
    where projects.supplier_name != '' and suppliers.id is null
    group by projects.supplier_name
  `);
  return json({ suppliers: [...suppliers, ...discovered] });
}

export async function POST(request: NextRequest) {
  const auth = requireUser(request);
  if ("error" in auth) return auth.error;
  if (auth.user.role !== "Admin" && auth.user.role !== "Data Entry") return json({ error: "Forbidden" }, 403);
  const body = await request.json();
  if (!body.name) return json({ error: "Supplier name is required" }, 400);
  const result = run(
    `insert into suppliers (name, contact_person, email, phone, category, notes)
     values (?, ?, ?, ?, ?, ?)
     on conflict(name) do update set contact_person=excluded.contact_person, email=excluded.email,
       phone=excluded.phone, category=excluded.category, notes=excluded.notes`,
    [body.name, body.contact_person || "", body.email || "", body.phone || "", body.category || "", body.notes || ""]
  );
  logActivity({ userId: auth.user.id, action: "Supplier saved", module: "Suppliers", newValue: body });
  return json({ id: result.lastInsertRowid || null }, 201);
}
