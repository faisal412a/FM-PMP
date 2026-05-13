"use client";

import { useMemo, useState } from "react";
import { Edit2, Plus, Save, Trash2, X } from "lucide-react";
import Badge from "./Badge";
import { money } from "@/lib/format";

const stageOptions = ["Down Payment", "Progressive Payment", "Final Payment", "Retention"];
const statusOptions = ["Due", "Paid", "Partial Paid", "Delayed"];

function uiStatus(status: string) {
  if (status === "Pending") return "Due";
  if (status === "Partially Paid") return "Partial Paid";
  if (status === "Overdue") return "Delayed";
  return status || "Due";
}

function emptyForm(projectValue: number) {
  return {
    id: undefined as number | undefined,
    stage_name: "Down Payment",
    status: "Due",
    payment_percentage: 0,
    payment_amount: 0,
    due_date: "",
    payment_date: "",
    paid_amount: 0,
    progress_trigger_percentage: 0,
    remarks: "",
    projectValue
  };
}

export default function PaymentEditor({ project, onRefresh }: { project: any; onRefresh: () => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm(Number(project.project_value || 0)));
  const projectProgress = Math.round(project.summary.progress || 0);
  const existingStages = useMemo(() => project.payments.map((payment: any) => payment.stage_name), [project.payments]);

  function set(key: string, value: any) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "payment_percentage") {
        next.payment_amount = Math.round((Number(project.project_value || 0) * Number(value || 0)) / 100);
      }
      return next;
    });
  }

  function addNew() {
    setForm(emptyForm(Number(project.project_value || 0)));
    setModalOpen(true);
  }

  function edit(payment: any) {
    setForm({
      ...emptyForm(Number(project.project_value || 0)),
      ...payment,
      status: uiStatus(payment.status),
      progress_trigger_percentage: payment.progress_trigger_percentage || 0
    });
    setModalOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch(`/api/projects/${project.id}/payments`, {
      method: form.id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (!res.ok) {
      alert((await res.json()).error);
      return;
    }
    setModalOpen(false);
    onRefresh();
  }

  async function remove(paymentId: number) {
    if (!confirm("Delete this payment schedule line?")) return;
    const res = await fetch(`/api/projects/${project.id}/payments?paymentId=${paymentId}`, { method: "DELETE" });
    if (res.ok) onRefresh();
    else alert((await res.json()).error);
  }

  return (
    <div className="grid">
      <div className="grid cards">
        <div className="card"><div className="kpi-label">Planned</div><div className="kpi-value">{money(project.summary.planned)}</div></div>
        <div className="card"><div className="kpi-label">Paid</div><div className="kpi-value">{money(project.summary.paid)}</div></div>
        <div className="card"><div className="kpi-label">Balance</div><div className="kpi-value">{money(project.summary.balance)}</div></div>
        <div className="card"><div className="kpi-label">Delayed</div><div className="kpi-value">{money(project.summary.overdue)}</div></div>
        <div className="card"><div className="kpi-label">Completion</div><div className="kpi-value">{Math.round(project.summary.paymentCompletion)}%</div></div>
      </div>

      <div className="panel table-wrap">
        <div className="toolbar">
          <h3>Payment Schedule</h3>
          <button className="btn" onClick={addNew}><Plus size={18} />Add payment schedule</button>
        </div>
        <table>
          <thead><tr><th>Stage</th><th>%</th><th>Amount</th><th>Progress Due</th><th>Due Date</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {project.payments.map((p: any) => {
              const waitingProgress = Number(p.progress_trigger_percentage || 0) > projectProgress && p.status === "Pending";
              return (
                <tr key={p.id}>
                  <td>{p.stage_name}</td>
                  <td>{p.payment_percentage}%</td>
                  <td>{money(p.payment_amount)}<br /><span className="muted">All Amounts Excl. VAT</span></td>
                  <td>{p.progress_trigger_percentage || 0}%</td>
                  <td>{p.due_date || "-"}</td>
                  <td>{money(p.paid_amount)}</td>
                  <td>{money(p.balance_amount)}</td>
                  <td>{waitingProgress ? <span className="badge gray">Waiting Progress</span> : <Badge status={p.status} />}</td>
                  <td><div className="toolbar"><button className="btn secondary" onClick={() => edit(p)}><Edit2 size={16} />Edit</button><button className="btn danger" onClick={() => remove(p.id)}><Trash2 size={16} />Delete</button></div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modalOpen ? (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={save}>
            <div className="toolbar" style={{ justifyContent: "space-between" }}>
              <h3>{form.id ? "Edit Payment Schedule" : "Add Payment Schedule"}</h3>
              <button type="button" className="btn secondary" onClick={() => setModalOpen(false)}><X size={18} />Close</button>
            </div>
            <div className="form-grid">
              <div className="field"><label>Stage</label><select value={form.stage_name} onChange={(e) => set("stage_name", e.target.value)}>{[...new Set([...stageOptions, ...existingStages])].map((stage) => <option key={stage}>{stage}</option>)}</select></div>
              <div className="field"><label>Percentage</label><input className="input" type="number" value={form.payment_percentage} onChange={(e) => set("payment_percentage", e.target.value)} /></div>
              <div className="field"><label>Amount</label><input className="input" type="number" value={form.payment_amount} onChange={(e) => set("payment_amount", e.target.value)} /></div>
              <div className="field"><label>Due when progress reaches %</label><input className="input" type="number" value={form.progress_trigger_percentage} onChange={(e) => set("progress_trigger_percentage", e.target.value)} /></div>
              <div className="field"><label>Due date</label><input className="input" type="date" value={form.due_date || ""} onChange={(e) => set("due_date", e.target.value)} /></div>
              <div className="field"><label>Payment date</label><input className="input" type="date" value={form.payment_date || ""} onChange={(e) => set("payment_date", e.target.value)} /></div>
              <div className="field"><label>Paid amount</label><input className="input" type="number" value={form.paid_amount} onChange={(e) => set("paid_amount", e.target.value)} /></div>
              <div className="field"><label>Payment status</label><select value={form.status} onChange={(e) => set("status", e.target.value)}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></div>
              <div className="field span-3"><label>Remarks</label><input className="input" value={form.remarks || ""} onChange={(e) => set("remarks", e.target.value)} /></div>
            </div>
            <button className="btn" style={{ marginTop: 14 }}><Save size={18} />Save schedule</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
