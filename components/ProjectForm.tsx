"use client";

import { useState } from "react";
import { Save } from "lucide-react";

const statuses = ["Bidding", "In Progress", "Completed", "On Hold", "Delayed", "Cancelled"];

export default function ProjectForm({ initial, onSaved, readOnly = false }: { initial?: any; onSaved: (project: any) => void; readOnly?: boolean }) {
  const [form, setForm] = useState<any>({
    name: initial?.name || "",
    client_name: initial?.client_name || "",
    supplier_name: initial?.supplier_name || "",
    project_manager: initial?.project_manager || "",
    category: initial?.category || "",
    location: initial?.location || "",
    start_date: initial?.start_date || "",
    expected_completion_date: initial?.expected_completion_date || "",
    status: initial?.status || "Bidding",
    project_value: initial?.project_value || 0,
    notes: initial?.notes || "",
  });
  const [toast, setToast] = useState("");

  function update(key: string, value: string) {
    setForm((current: any) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch(initial ? `/api/projects/${initial.id}` : "/api/projects", {
      method: initial ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const body = await response.json();
    if (!response.ok) {
      setToast(body.error || "Unable to save");
      return;
    }
    setToast("Saved successfully");
    onSaved(body.project || body);
  }

  const field = (key: string, label: string, type = "text") => (
    <div className="field">
      <label>{label}</label>
      <input className="input" type={type} value={form[key] ?? ""} onChange={(event) => update(key, event.target.value)} readOnly={readOnly} />
    </div>
  );

  return (
    <form className="panel" onSubmit={submit}>
      <div className="form-grid">
        {field("name", "Project name")}
        {field("client_name", "Client name")}
        {field("supplier_name", "Supplier name")}
        {field("project_manager", "Project manager")}
        {field("category", "Category/type")}
        {field("location", "Location")}
        {field("start_date", "Expected Starting Date", "date")}
        {field("expected_completion_date", "Expected completion", "date")}
        <div className="field">
          <label>Status</label>
          <select value={form.status} onChange={(event) => update("status", event.target.value)} disabled={readOnly}>
            {statuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Project value</label>
          <input className="input" value={form.project_value ?? 0} readOnly />
          <div className="muted">Auto-filled from quote amount</div>
        </div>
        <div />
        <div className="field span-3">
          <label>Notes / remarks</label>
          <textarea value={form.notes} onChange={(event) => update("notes", event.target.value)} readOnly={readOnly} />
        </div>
      </div>
      <div className="toolbar" style={{ marginTop: 16 }}>
        {!readOnly ? <button className="btn"><Save size={18} />Save project</button> : null}
      </div>
      {toast ? <div className="toast">{toast}</div> : null}
    </form>
  );
}
