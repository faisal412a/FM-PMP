import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const dataDir = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "pm.sqlite");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
if (fs.existsSync(dbPath)) fs.rmSync(dbPath);

const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

const hashPassword = (password, salt = "pm-local-salt") =>
  crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("hex");

db.exec(`
create table roles (
  id integer primary key autoincrement,
  name text not null unique,
  description text
);

create table users (
  id integer primary key autoincrement,
  name text not null,
  email text not null unique,
  password_hash text not null,
  role_id integer not null references roles(id),
  is_active integer not null default 1,
  created_at text not null default current_timestamp
);

create table projects (
  id integer primary key autoincrement,
  project_number text not null unique,
  name text not null,
  client_name text not null,
  supplier_name text,
  project_manager text,
  category text,
  location text,
  start_date text,
  expected_completion_date text,
  actual_completion_date text,
  status text not null default 'In Progress',
  project_value real not null default 0,
  notes text,
  created_by integer references users(id),
  created_at text not null default current_timestamp,
  updated_at text not null default current_timestamp,
  constraint status_allowed check (status in ('Bidding','In Progress','Completed','On Hold','Delayed','Cancelled')),
  constraint completion_after_start check (actual_completion_date is null or start_date is null or actual_completion_date >= start_date)
);

create table project_quotes (
  id integer primary key autoincrement,
  project_id integer not null references projects(id) on delete cascade,
  quote_number text,
  quote_date text,
  quote_amount real default 0,
  supplier_name text,
  quote_file text
);

create table project_pos (
  id integer primary key autoincrement,
  project_id integer not null references projects(id) on delete cascade,
  po_number text,
  po_date text,
  po_amount real default 0,
  po_file text
);

create table payment_terms (
  id integer primary key autoincrement,
  project_id integer not null references projects(id) on delete cascade,
  stage_name text not null,
  payment_percentage real not null default 0,
  payment_amount real not null default 0,
  due_date text,
  payment_date text,
  paid_amount real not null default 0,
  balance_amount real not null default 0,
  progress_trigger_percentage real not null default 0,
  status text not null default 'Pending',
  remarks text,
  created_at text not null default current_timestamp,
  constraint payment_status_allowed check (status in ('Pending','Partially Paid','Paid','Overdue'))
);

create table payment_transactions (
  id integer primary key autoincrement,
  payment_term_id integer not null references payment_terms(id) on delete cascade,
  paid_amount real not null default 0,
  payment_date text not null,
  remarks text,
  created_by integer references users(id),
  created_at text not null default current_timestamp
);

create table project_phases (
  id integer primary key autoincrement,
  project_id integer not null references projects(id) on delete cascade,
  phase_name text not null,
  planned_start_date text,
  planned_completion_date text,
  actual_start_date text,
  actual_completion_date text,
  responsible_person text,
  status text not null default 'Not Started',
  completion_percentage real not null default 0,
  delay_days integer not null default 0,
  remarks text,
  attachment_file text,
  constraint phase_status_allowed check (status in ('Not Started','In Progress','Completed','Delayed','On Hold'))
);

create table project_documents (
  id integer primary key autoincrement,
  project_id integer not null references projects(id) on delete cascade,
  document_type text not null,
  file_name text not null,
  file_path text,
  uploaded_by integer references users(id),
  uploaded_at text not null default current_timestamp
);

create table supplier_evaluations (
  id integer primary key autoincrement,
  project_id integer not null references projects(id) on delete cascade,
  delivery_quality integer not null default 3,
  timeline_commitment integer not null default 3,
  communication integer not null default 3,
  cost_control integer not null default 3,
  issue_resolution integer not null default 3,
  documentation integer not null default 3,
  overall_rating integer not null default 3,
  average_rating real not null default 3,
  success_score real not null default 0,
  remarks text,
  created_by integer references users(id),
  created_at text not null default current_timestamp,
  constraint rating_range check (
    delivery_quality between 1 and 5 and timeline_commitment between 1 and 5 and
    communication between 1 and 5 and cost_control between 1 and 5 and
    issue_resolution between 1 and 5 and documentation between 1 and 5 and overall_rating between 1 and 5
  )
);

create table activity_logs (
  id integer primary key autoincrement,
  created_at text not null default current_timestamp,
  user_id integer references users(id),
  action text not null,
  module text not null,
  old_value text,
  new_value text
);

create index idx_projects_status on projects(status);
create index idx_payments_due_status on payment_terms(due_date, status);
create index idx_phases_project on project_phases(project_id);
create index idx_logs_created_at on activity_logs(created_at);
`);

const role = db.prepare("insert into roles (name, description) values (?, ?)");
["Admin", "Data Entry", "Project Finance", "Management"].forEach((name) =>
  role.run(name, `${name} role`)
);

const roleId = (name) => db.prepare("select id from roles where name = ?").get(name).id;
const user = db.prepare("insert into users (name, email, password_hash, role_id) values (?, ?, ?, ?)");
user.run("Admin User", "admin@demo.com", hashPassword("password123"), roleId("Admin"));
user.run("Data Entry User", "data@demo.com", hashPassword("password123"), roleId("Data Entry"));
user.run("Finance User", "finance@demo.com", hashPassword("password123"), roleId("Project Finance"));
user.run("Management User", "management@demo.com", hashPassword("password123"), roleId("Management"));

const insertProject = db.prepare(`
insert into projects
(project_number, name, client_name, supplier_name, project_manager, category, location, start_date, expected_completion_date, actual_completion_date, status, project_value, notes, created_by)
values (@project_number, @name, @client_name, @supplier_name, @project_manager, @category, @location, @start_date, @expected_completion_date, @actual_completion_date, @status, @project_value, @notes, 1)
`);

const projects = [
  {
    project_number: "PRJ-2026-0001",
    name: "Riyadh HQ Fit-Out",
    client_name: "Noura Holdings",
    supplier_name: "Delta Interiors",
    project_manager: "Maha Saleh",
    category: "Fit-Out",
    location: "Riyadh",
    start_date: "2026-01-10",
    expected_completion_date: "2026-06-15",
    actual_completion_date: null,
    status: "In Progress",
    project_value: 850000,
    notes: "High priority executive floor package."
  },
  {
    project_number: "PRJ-2026-0002",
    name: "Jeddah Retail Kiosks",
    client_name: "Red Sea Retail",
    supplier_name: "Madar Fabrication",
    project_manager: "Omar Nasser",
    category: "Retail",
    location: "Jeddah",
    start_date: "2026-02-01",
    expected_completion_date: "2026-04-30",
    actual_completion_date: null,
    status: "Delayed",
    project_value: 420000,
    notes: "Production delay due to imported laminate approval."
  },
  {
    project_number: "PRJ-2025-0014",
    name: "Dammam Warehouse Signage",
    client_name: "Eastern Logistics",
    supplier_name: "Bright Signs",
    project_manager: "Lina Fahad",
    category: "Signage",
    location: "Dammam",
    start_date: "2025-11-05",
    expected_completion_date: "2026-01-20",
    actual_completion_date: "2026-01-18",
    status: "Completed",
    project_value: 190000,
    notes: "Completed two days ahead of planned handover."
  }
];

const quote = db.prepare("insert into project_quotes (project_id, quote_number, quote_date, quote_amount, supplier_name, quote_file) values (?, ?, ?, ?, ?, ?)");
const po = db.prepare("insert into project_pos (project_id, po_number, po_date, po_amount, po_file) values (?, ?, ?, ?, ?)");
const payment = db.prepare(`
insert into payment_terms (project_id, stage_name, payment_percentage, payment_amount, due_date, payment_date, paid_amount, balance_amount, status, remarks)
values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const phase = db.prepare(`
insert into project_phases (project_id, phase_name, planned_start_date, planned_completion_date, actual_start_date, actual_completion_date, responsible_person, status, completion_percentage, delay_days, remarks, attachment_file)
values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const evaluation = db.prepare(`
insert into supplier_evaluations (project_id, delivery_quality, timeline_commitment, communication, cost_control, issue_resolution, documentation, overall_rating, average_rating, success_score, remarks, created_by)
values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
`);

projects.forEach((project, index) => {
  const result = insertProject.run(project);
  const id = result.lastInsertRowid;
  quote.run(id, `Q-${project.project_number.slice(-4)}`, project.start_date, project.project_value * 0.98, project.supplier_name, "quote-sample.pdf");
  po.run(id, `PO-${project.project_number.slice(-4)}`, project.start_date, project.project_value, "po-sample.pdf");
  payment.run(id, "Down Payment", 30, project.project_value * 0.3, project.start_date, project.start_date, project.project_value * 0.3, 0, "Paid", "Advance received");
  payment.run(id, "Progressive Payment 1", 40, project.project_value * 0.4, "2026-04-20", index === 1 ? null : "2026-04-22", index === 1 ? project.project_value * 0.2 : project.project_value * 0.4, index === 1 ? project.project_value * 0.2 : 0, index === 1 ? "Partially Paid" : "Paid", "");
  payment.run(id, "Final Payment", 30, project.project_value * 0.3, "2026-06-20", null, 0, project.project_value * 0.3, project.status === "Completed" ? "Pending" : "Pending", "");
  ["Design Approval", "Material Procurement", "Production", "Installation", "Testing", "Handover"].forEach((name, phaseIndex) => {
    const completed = project.status === "Completed" || phaseIndex < (index === 1 ? 2 : 4);
    const delayed = index === 1 && phaseIndex === 2;
    phase.run(
      id,
      name,
      "2026-01-10",
      "2026-05-30",
      completed ? "2026-01-12" : null,
      completed ? "2026-03-20" : null,
      phaseIndex % 2 ? project.supplier_name : project.project_manager,
      delayed ? "Delayed" : completed ? "Completed" : "In Progress",
      completed ? 100 : delayed ? 45 : 20,
      delayed ? 18 : 0,
      "",
      ""
    );
  });
  if (project.status === "Completed") {
    evaluation.run(id, 5, 5, 4, 4, 4, 5, 5, 4.57, 94, "Strong delivery and clean documentation.");
  }
});

db.prepare("insert into activity_logs (user_id, action, module, new_value) values (1, 'Seed data created', 'System', ?)").run(
  JSON.stringify({ projects: projects.length })
);

console.log(`SQLite database created at ${dbPath}`);
