"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Badge from "./Badge";

export default function PhaseEditor({ project, onRefresh }: { project: any; onRefresh: () => void }) {
  const [form, setForm] = useState({ phase_name: "", planned_start_date: "", planned_completion_date: "", actual_start_date: "", actual_completion_date: "", responsible_person: "", status: "Not Started", completion_percentage: 0, remarks: "", attachment_file: "" });
  async function add(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch(`/api/projects/${project.id}/phases`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      setForm({ phase_name: "", planned_start_date: "", planned_completion_date: "", actual_start_date: "", actual_completion_date: "", responsible_person: "", status: "Not Started", completion_percentage: 0, remarks: "", attachment_file: "" });
      onRefresh();
    } else alert((await res.json()).error);
  }
  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));
  return (
    <div className="grid">
      <div className="grid three">
        <div className="card"><div className="kpi-label">Overall progress</div><div className="kpi-value">{Math.round(project.summary.progress)}%</div></div>
        <div className="card"><div className="kpi-label">Delayed phases</div><div className="kpi-value">{project.summary.delayedPhases}</div></div>
        <div className="card"><div className="kpi-label">Pending phases</div><div className="kpi-value">{project.summary.pendingPhases}</div></div>
      </div>
      <form className="panel" onSubmit={add}>
        <div className="form-grid">
          <div className="field"><label>Phase name</label><input className="input" value={form.phase_name} onChange={(e) => set("phase_name", e.target.value)} required /></div>
          <div className="field"><label>Planned start</label><input className="input" type="date" value={form.planned_start_date} onChange={(e) => set("planned_start_date", e.target.value)} /></div>
          <div className="field"><label>Planned completion</label><input className="input" type="date" value={form.planned_completion_date} onChange={(e) => set("planned_completion_date", e.target.value)} /></div>
          <div className="field"><label>Actual start</label><input className="input" type="date" value={form.actual_start_date} onChange={(e) => set("actual_start_date", e.target.value)} /></div>
          <div className="field"><label>Actual completion</label><input className="input" type="date" value={form.actual_completion_date} onChange={(e) => set("actual_completion_date", e.target.value)} /></div>
          <div className="field"><label>Responsible</label><input className="input" value={form.responsible_person} onChange={(e) => set("responsible_person", e.target.value)} /></div>
          <div className="field"><label>Status</label><select value={form.status} onChange={(e) => set("status", e.target.value)}>{["Not Started","In Progress","Completed","Delayed","On Hold"].map((s) => <option key={s}>{s}</option>)}</select></div>
          <div className="field"><label>Completion %</label><input className="input" type="number" value={form.completion_percentage} onChange={(e) => set("completion_percentage", e.target.value)} /></div>
          <div className="field"><label>Attachment</label><input className="input" value={form.attachment_file} onChange={(e) => set("attachment_file", e.target.value)} /></div>
          <div className="field span-3"><label>Remarks</label><input className="input" value={form.remarks} onChange={(e) => set("remarks", e.target.value)} /></div>
        </div>
        <button className="btn" style={{ marginTop: 14 }}><Plus size={18} />Add phase</button>
      </form>
      <div className="panel table-wrap">
        <table><thead><tr><th>Phase</th><th>Planned</th><th>Actual</th><th>Responsible</th><th>Status</th><th>Completion</th><th>Delay days</th><th>Attachment</th></tr></thead>
          <tbody>{project.phases.map((p: any) => <tr key={p.id}><td>{p.phase_name}</td><td>{p.planned_start_date} to {p.planned_completion_date}</td><td>{p.actual_start_date || "-"} to {p.actual_completion_date || "-"}</td><td>{p.responsible_person}</td><td><Badge status={p.status} /></td><td><div className="progress"><span style={{ width: `${p.completion_percentage}%` }} /></div>{p.completion_percentage}%</td><td>{p.delay_days}</td><td>{p.attachment_file}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
