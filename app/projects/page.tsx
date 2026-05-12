"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import Badge from "@/components/Badge";
import { money, pct } from "@/lib/format";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  async function load() {
    const res = await fetch(`/api/projects?search=${encodeURIComponent(search)}`);
    if (res.status === 401) location.assign("/login");
    const body = await res.json();
    setProjects(body.projects || []);
  }
  useEffect(() => { load(); }, []);

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="page-title">Projects</h1>
          <div className="muted">Master data, quote and PO references, progress, payments, and evaluations.</div>
        </div>
        <Link className="btn" href="/projects/new"><Plus size={18} />New project</Link>
      </div>
      <div className="panel">
        <div className="toolbar">
          <input className="input" style={{ maxWidth: 360 }} placeholder="Search project, number, or client" value={search} onChange={(event) => setSearch(event.target.value)} />
          <button className="btn secondary" onClick={load}><Search size={18} />Search</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Project</th><th>Client</th><th>Supplier</th><th>Status</th><th>Value</th><th>Progress</th><th>Paid</th><th>Balance</th></tr></thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id}>
                  <td><Link href={`/projects/${project.id}`}><strong>{project.project_number}</strong><br />{project.name}</Link></td>
                  <td>{project.client_name}</td>
                  <td>{project.supplier_name}</td>
                  <td><Badge status={project.status} /></td>
                  <td>{money(project.project_value)}</td>
                  <td><div className="progress"><span style={{ width: `${project.summary.progress}%` }} /></div>{pct(project.summary.progress)}</td>
                  <td>{money(project.summary.paid)}</td>
                  <td>{money(project.summary.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
