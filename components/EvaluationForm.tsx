"use client";

import { useState } from "react";
import { Save } from "lucide-react";

const criteria = ["delivery_quality", "timeline_commitment", "communication", "cost_control", "issue_resolution", "documentation", "overall_rating"];

export default function EvaluationForm({ project, onRefresh }: { project: any; onRefresh: () => void }) {
  const [form, setForm] = useState<any>(Object.fromEntries(criteria.map((key) => [key, project.evaluation?.[key] || 3])));
  const [remarks, setRemarks] = useState(project.evaluation?.remarks || "");
  async function save(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch(`/api/projects/${project.id}/evaluation`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, remarks }) });
    if (res.ok) onRefresh();
    else alert((await res.json()).error);
  }
  return (
    <form className="panel" onSubmit={save}>
      <div className="form-grid">
        {criteria.map((key) => (
          <div className="field" key={key}>
            <label>{key.replaceAll("_", " ")}</label>
            <select value={form[key]} onChange={(e) => setForm((f: any) => ({ ...f, [key]: Number(e.target.value) }))}>
              {[1,2,3,4,5].map((rating) => <option key={rating}>{rating}</option>)}
            </select>
          </div>
        ))}
        <div className="field span-3"><label>Remarks</label><textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} /></div>
      </div>
      {project.evaluation ? <p className="muted">Average rating: {project.evaluation.average_rating.toFixed(2)} | Success score: {Math.round(project.evaluation.success_score)}%</p> : null}
      <button className="btn"><Save size={18} />Save evaluation</button>
    </form>
  );
}
