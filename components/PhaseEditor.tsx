"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import Badge from "./Badge";

const phaseTemplates = [
  { name: "Design Approval", startOffset: 0, endOffset: 7 },
  { name: "Material Procurement", startOffset: 8, endOffset: 21 },
  { name: "Production", startOffset: 22, endOffset: 45 },
  { name: "Installation", startOffset: 46, endOffset: 55 },
  { name: "Testing", startOffset: 56, endOffset: 60 },
  { name: "Handover", startOffset: 61, endOffset: 65 }
];

function addDays(date: string, days: number) {
  if (!date) return "";
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function delayDays(planned?: string, actual?: string) {
  if (!planned || !actual) return 0;
  return Math.max(0, Math.ceil((new Date(actual).getTime() - new Date(planned).getTime()) / 86400000));
}

export default function PhaseEditor({ project, onRefresh }: { project: any; onRefresh: () => void }) {
  const firstTemplate = phaseTemplates[0];
  const [form, setForm] = useState<any>({
    id: undefined,
    phase_name: firstTemplate.name,
    planned_start_date: addDays(project.start_date, firstTemplate.startOffset),
    planned_completion_date: addDays(project.start_date, firstTemplate.endOffset),
    actual_start_date: "",
    actual_completion_date: "",
    responsible_person: "",
    status: "Not Started",
    completion_percentage: 0,
    remarks: "",
    attachment_file: ""
  });

  function selectPhase(phaseName: string) {
    const existing = project.phases.find((phase: any) => phase.phase_name === phaseName);
    const template = phaseTemplates.find((phase) => phase.name === phaseName) || firstTemplate;
    setForm({
      id: existing?.id,
      phase_name: phaseName,
      planned_start_date: existing?.planned_start_date || addDays(project.start_date, template.startOffset),
      planned_completion_date: existing?.planned_completion_date || addDays(project.start_date, template.endOffset),
      actual_start_date: existing?.actual_start_date || "",
      actual_completion_date: existing?.actual_completion_date || "",
      responsible_person: existing?.responsible_person || "",
      status: existing?.status || "Not Started",
      completion_percentage: existing?.completion_percentage || 0,
      remarks: existing?.remarks || "",
      attachment_file: existing?.attachment_file || ""
    });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch(`/api/projects/${project.id}/phases`, { method: form.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      onRefresh();
    } else alert((await res.json()).error);
  }
  const set = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }));
  return (
    <div className="grid">
      <div className="grid three">
        <div className="card"><div className="kpi-label">Overall progress</div><div className="kpi-value">{Math.round(project.summary.progress)}%</div></div>
        <div className="card"><div className="kpi-label">Delayed phases</div><div className="kpi-value">{project.summary.delayedPhases}</div></div>
        <div className="card"><div className="kpi-label">Pending phases</div><div className="kpi-value">{project.summary.pendingPhases}</div></div>
      </div>
      <form className="panel" onSubmit={save}>
        <div className="form-grid">
          <div className="field"><label>Phase name</label><select value={form.phase_name} onChange={(e) => selectPhase(e.target.value)}>{phaseTemplates.map((phase) => <option key={phase.name}>{phase.name}</option>)}</select></div>
          <div className="field"><label>Planned start</label><input className="input" type="date" value={form.planned_start_date} readOnly /></div>
          <div className="field"><label>Planned completion</label><input className="input" type="date" value={form.planned_completion_date} readOnly /></div>
          <div className="field"><label>Actual start</label><input className="input" type="date" value={form.actual_start_date} onChange={(e) => set("actual_start_date", e.target.value)} /></div>
          <div className="field"><label>Actual completion</label><input className="input" type="date" value={form.actual_completion_date} onChange={(e) => set("actual_completion_date", e.target.value)} /></div>
          <div className="field"><label>Responsible</label><input className="input" value={form.responsible_person} onChange={(e) => set("responsible_person", e.target.value)} /></div>
          <div className="field"><label>Status</label><select value={form.status} onChange={(e) => set("status", e.target.value)}>{["Not Started","In Progress","Completed","Delayed","On Hold"].map((s) => <option key={s}>{s}</option>)}</select></div>
          <div className="field"><label>Completion %</label><input className="input" type="number" value={form.completion_percentage} onChange={(e) => set("completion_percentage", e.target.value)} /></div>
          <div className="field"><label>Delay days</label><input className="input" value={delayDays(form.planned_completion_date, form.actual_completion_date)} readOnly /></div>
          <div className="field"><label>Attachment</label><input className="input" value={form.attachment_file} onChange={(e) => set("attachment_file", e.target.value)} /></div>
          <div className="field span-3"><label>Remarks</label><input className="input" value={form.remarks} onChange={(e) => set("remarks", e.target.value)} /></div>
        </div>
        <button className="btn" style={{ marginTop: 14 }}><Save size={18} />Update progress</button>
      </form>
      <div className="panel table-wrap">
        <table><thead><tr><th>Phase</th><th>Planned</th><th>Actual</th><th>Responsible</th><th>Status</th><th>Completion</th><th>Delay days</th><th>Attachment</th></tr></thead>
          <tbody>{project.phases.map((p: any) => <tr key={p.id}><td>{p.phase_name}</td><td>{p.planned_start_date} to {p.planned_completion_date}</td><td>{p.actual_start_date || "-"} to {p.actual_completion_date || "-"}</td><td>{p.responsible_person}</td><td><Badge status={p.status} /></td><td><div className="progress"><span style={{ width: `${p.completion_percentage}%` }} /></div>{p.completion_percentage}%</td><td>{p.delay_days}</td><td>{p.attachment_file}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
