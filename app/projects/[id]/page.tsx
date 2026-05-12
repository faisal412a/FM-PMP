"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import Badge from "@/components/Badge";
import EvaluationForm from "@/components/EvaluationForm";
import PaymentEditor from "@/components/PaymentEditor";
import PhaseEditor from "@/components/PhaseEditor";
import ProjectForm from "@/components/ProjectForm";
import { money } from "@/lib/format";

const tabs = ["Overview", "Quote & PO", "Payment Schedule", "Progress Tracker", "Documents", "Supplier Evaluation", "Activity Log"];

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [tab, setTab] = useState(tabs[0]);
  async function load() {
    const res = await fetch(`/api/projects/${params.id}`);
    if (res.status === 401) location.assign("/login");
    const body = await res.json();
    setProject(body.project);
  }
  useEffect(() => { load(); }, [params.id]);
  async function remove() {
    if (!confirm("Delete this project and all related records?")) return;
    const res = await fetch(`/api/projects/${params.id}`, { method: "DELETE" });
    if (res.ok) router.push("/projects");
    else alert((await res.json()).error);
  }
  if (!project) return <div className="panel">Loading project...</div>;

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="page-title">{project.name}</h1>
          <div className="muted">{project.project_number} · {project.client_name} · <Badge status={project.status} /></div>
        </div>
        <button className="btn danger" onClick={remove}><Trash2 size={18} />Delete</button>
      </div>
      <div className="tabs">{tabs.map((item) => <button key={item} className={item === tab ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</div>

      {tab === "Overview" ? (
        <div className="grid">
          <div className="grid cards">
            <div className="card"><div className="kpi-label">Project value</div><div className="kpi-value">{money(project.project_value)}</div></div>
            <div className="card"><div className="kpi-label">Progress</div><div className="kpi-value">{Math.round(project.summary.progress)}%</div></div>
            <div className="card"><div className="kpi-label">Paid</div><div className="kpi-value">{money(project.summary.paid)}</div></div>
            <div className="card"><div className="kpi-label">Balance</div><div className="kpi-value">{money(project.summary.balance)}</div></div>
            <div className="card"><div className="kpi-label">Delay days</div><div className="kpi-value">{project.summary.delayDays}</div></div>
          </div>
          <ProjectForm initial={project} onSaved={load} />
        </div>
      ) : null}

      {tab === "Quote & PO" ? (
        <div className="grid two">
          <section className="panel"><h3>Quote Reference</h3><p><strong>Number:</strong> {project.quote?.quote_number}</p><p><strong>Date:</strong> {project.quote?.quote_date}</p><p><strong>Amount:</strong> {money(project.quote?.quote_amount)}</p><p><strong>File:</strong> {project.quote?.quote_file}</p></section>
          <section className="panel"><h3>PO Reference</h3><p><strong>Number:</strong> {project.po?.po_number}</p><p><strong>Date:</strong> {project.po?.po_date}</p><p><strong>Amount:</strong> {money(project.po?.po_amount)}</p><p><strong>File:</strong> {project.po?.po_file}</p></section>
        </div>
      ) : null}

      {tab === "Payment Schedule" ? <PaymentEditor project={project} onRefresh={load} /> : null}
      {tab === "Progress Tracker" ? <PhaseEditor project={project} onRefresh={load} /> : null}
      {tab === "Supplier Evaluation" ? <EvaluationForm project={project} onRefresh={load} /> : null}

      {tab === "Documents" ? (
        <section className="panel table-wrap">
          <table><thead><tr><th>Type</th><th>File</th><th>Path</th><th>Uploaded</th></tr></thead>
            <tbody>
              {project.documents.length ? project.documents.map((doc: any) => <tr key={doc.id}><td>{doc.document_type}</td><td>{doc.file_name}</td><td>{doc.file_path}</td><td>{doc.uploaded_at}</td></tr>) : <tr><td colSpan={4}>No documents uploaded yet. Quote, PO, and phase proof file references are stored on their module tabs.</td></tr>}
            </tbody>
          </table>
        </section>
      ) : null}

      {tab === "Activity Log" ? (
        <section className="panel table-wrap">
          <table><thead><tr><th>Date/time</th><th>User</th><th>Action</th><th>Module</th><th>Old value</th><th>New value</th></tr></thead>
            <tbody>{project.activity.map((log: any) => <tr key={log.id}><td>{log.created_at}</td><td>{log.user_name || "System"}</td><td>{log.action}</td><td>{log.module}</td><td>{log.old_value}</td><td>{log.new_value}</td></tr>)}</tbody>
          </table>
        </section>
      ) : null}
    </>
  );
}
