"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Badge from "./Badge";
import { money } from "@/lib/format";

const stageOptions = ["Down Payment", "Progressive Payment", "Final Payment", "Retention"];
const statusOptions = ["Due", "Paid", "Partial Paid", "Delayed"];

export default function PaymentEditor({ project, onRefresh }: { project: any; onRefresh: () => void }) {
  const [form, setForm] = useState({ stage_name: "Down Payment", status: "Due", payment_percentage: 0, payment_amount: 0, due_date: "", payment_date: "", paid_amount: 0, remarks: "" });
  async function add(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch(`/api/projects/${project.id}/payments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      setForm({ stage_name: "Down Payment", status: "Due", payment_percentage: 0, payment_amount: 0, due_date: "", payment_date: "", paid_amount: 0, remarks: "" });
      onRefresh();
    } else alert((await res.json()).error);
  }
  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));
  return (
    <div className="grid">
      <div className="grid four"></div>
      <div className="grid cards">
        <div className="card"><div className="kpi-label">Planned</div><div className="kpi-value">{money(project.summary.planned)}</div></div>
        <div className="card"><div className="kpi-label">Paid</div><div className="kpi-value">{money(project.summary.paid)}</div></div>
        <div className="card"><div className="kpi-label">Balance</div><div className="kpi-value">{money(project.summary.balance)}</div></div>
        <div className="card"><div className="kpi-label">Overdue</div><div className="kpi-value">{money(project.summary.overdue)}</div></div>
        <div className="card"><div className="kpi-label">Completion</div><div className="kpi-value">{Math.round(project.summary.paymentCompletion)}%</div></div>
      </div>
      <form className="panel" onSubmit={add}>
        <div className="form-grid">
          <div className="field"><label>Stage</label><select value={form.stage_name} onChange={(e) => set("stage_name", e.target.value)}>{stageOptions.map((stage) => <option key={stage}>{stage}</option>)}</select></div>
          <div className="field"><label>Percentage</label><input className="input" type="number" value={form.payment_percentage} onChange={(e) => set("payment_percentage", e.target.value)} /></div>
          <div className="field"><label>Amount</label><input className="input" type="number" value={form.payment_amount} onChange={(e) => set("payment_amount", e.target.value)} /></div>
          <div className="field"><label>Due date</label><input className="input" type="date" value={form.due_date} onChange={(e) => set("due_date", e.target.value)} /></div>
          <div className="field"><label>Payment date</label><input className="input" type="date" value={form.payment_date} onChange={(e) => set("payment_date", e.target.value)} /></div>
          <div className="field"><label>Paid amount</label><input className="input" type="number" value={form.paid_amount} onChange={(e) => set("paid_amount", e.target.value)} /></div>
          <div className="field"><label>Payment status</label><select value={form.status} onChange={(e) => set("status", e.target.value)}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></div>
          <div className="field span-3"><label>Remarks</label><input className="input" value={form.remarks} onChange={(e) => set("remarks", e.target.value)} /></div>
        </div>
        <button className="btn" style={{ marginTop: 14 }}><Plus size={18} />Add payment stage</button>
      </form>
      <div className="panel table-wrap">
        <table><thead><tr><th>Stage</th><th>%</th><th>Amount</th><th>Due</th><th>Paid</th><th>Balance</th><th>Status</th><th>Remarks</th></tr></thead>
          <tbody>{project.payments.map((p: any) => <tr key={p.id}><td>{p.stage_name}</td><td>{p.payment_percentage}%</td><td>{money(p.payment_amount)}</td><td>{p.due_date}</td><td>{money(p.paid_amount)}</td><td>{money(p.balance_amount)}</td><td><Badge status={p.status} /></td><td>{p.remarks}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
