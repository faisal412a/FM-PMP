"use client";

import { useEffect, useState } from "react";
import { Download, Printer, Search } from "lucide-react";
import Badge from "@/components/Badge";
import { money } from "@/lib/format";

function toCsv(rows: any[]) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]).filter((key) => typeof rows[0][key] !== "object");
  return [keys.join(","), ...rows.map((row) => keys.map((key) => `"${String(row[key] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
}

export default function ReportsPage() {
  const [filters, setFilters] = useState({ from: "", to: "", client: "", supplier: "", status: "" });
  const [data, setData] = useState<any>({ projects: [], payments: [], phases: [], evaluations: [] });
  async function load(exported = false) {
    const params = new URLSearchParams(filters);
    if (exported) params.set("export", "true");
    const res = await fetch(`/api/reports?${params}`);
    if (res.status === 401) location.assign("/login");
    setData(await res.json());
  }
  useEffect(() => { load(); }, []);
  function update(key: string, value: string) {
    setFilters((current) => ({ ...current, [key]: value }));
  }
  async function exportExcel(report: "projects" | "payments" | "phases" | "evaluations") {
    const params = new URLSearchParams(filters);
    params.set("export", "true");
    const latest = await fetch(`/api/reports?${params}`).then((res) => res.json());
    setData(latest);
    const blob = new Blob([toCsv(latest[report])], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${report}-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="page-title">Reports & Export</h1>
          <div className="muted">Project-wise payment, progress, supplier evaluation, delayed, completed, and full summary reports.</div>
        </div>
        <button className="btn secondary" onClick={() => window.print()}><Printer size={18} />Print / PDF</button>
      </div>
      <section className="panel">
        <div className="toolbar">
          <input className="input" type="date" style={{ maxWidth: 170 }} value={filters.from} onChange={(e) => update("from", e.target.value)} />
          <input className="input" type="date" style={{ maxWidth: 170 }} value={filters.to} onChange={(e) => update("to", e.target.value)} />
          <input className="input" style={{ maxWidth: 190 }} placeholder="Client" value={filters.client} onChange={(e) => update("client", e.target.value)} />
          <input className="input" style={{ maxWidth: 190 }} placeholder="Supplier" value={filters.supplier} onChange={(e) => update("supplier", e.target.value)} />
          <select style={{ maxWidth: 190 }} value={filters.status} onChange={(e) => update("status", e.target.value)}>
            <option value="">All statuses</option>
            {["In Progress","Completed","On Hold","Delayed","Cancelled"].map((status) => <option key={status}>{status}</option>)}
          </select>
          <button className="btn" onClick={() => load()}><Search size={18} />Apply filters</button>
        </div>
      </section>

      <div className="grid" style={{ marginTop: 16 }}>
        <section className="panel table-wrap">
          <div className="toolbar"><h3>Full Project Summary</h3><button className="btn secondary" onClick={() => exportExcel("projects")}><Download size={18} />Excel</button></div>
          <table><thead><tr><th>Project</th><th>Client</th><th>Supplier</th><th>Status</th><th>Value</th><th>Paid</th><th>Balance</th><th>Progress</th><th>Delay</th></tr></thead>
            <tbody>{data.projects.map((p: any) => <tr key={p.id}><td>{p.project_number}<br />{p.name}</td><td>{p.client_name}</td><td>{p.supplier_name}</td><td><Badge status={p.status} /></td><td>{money(p.project_value)}</td><td>{money(p.summary.paid)}</td><td>{money(p.summary.balance)}</td><td>{Math.round(p.summary.progress)}%</td><td>{p.summary.delayDays}</td></tr>)}</tbody>
          </table>
        </section>

        <section className="panel table-wrap">
          <div className="toolbar"><h3>Project-wise Payment Report</h3><button className="btn secondary" onClick={() => exportExcel("payments")}><Download size={18} />Excel</button></div>
          <table><thead><tr><th>Project</th><th>Stage</th><th>Due</th><th>Amount</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead>
            <tbody>{data.payments.map((p: any) => <tr key={p.id}><td>{p.project_number}<br />{p.project_name}</td><td>{p.stage_name}</td><td>{p.due_date}</td><td>{money(p.payment_amount)}</td><td>{money(p.paid_amount)}</td><td>{money(p.balance_amount)}</td><td><Badge status={p.status} /></td></tr>)}</tbody>
          </table>
        </section>

        <section className="panel table-wrap">
          <div className="toolbar"><h3>Project-wise Progress Report</h3><button className="btn secondary" onClick={() => exportExcel("phases")}><Download size={18} />Excel</button></div>
          <table><thead><tr><th>Project</th><th>Phase</th><th>Status</th><th>Completion</th><th>Delay days</th><th>Responsible</th></tr></thead>
            <tbody>{data.phases.map((p: any) => <tr key={p.id}><td>{p.project_number}<br />{p.project_name}</td><td>{p.phase_name}</td><td><Badge status={p.status} /></td><td>{p.completion_percentage}%</td><td>{p.delay_days}</td><td>{p.responsible_person}</td></tr>)}</tbody>
          </table>
        </section>

        <section className="panel table-wrap">
          <div className="toolbar"><h3>Supplier Evaluation Report</h3><button className="btn secondary" onClick={() => exportExcel("evaluations")}><Download size={18} />Excel</button></div>
          <table><thead><tr><th>Project</th><th>Supplier</th><th>Average</th><th>Success score</th><th>Overall</th><th>Remarks</th></tr></thead>
            <tbody>{data.evaluations.map((e: any) => <tr key={e.id}><td>{e.project_number}<br />{e.project_name}</td><td>{e.supplier_name}</td><td>{Number(e.average_rating).toFixed(2)}</td><td>{Math.round(e.success_score)}%</td><td>{e.overall_rating}/5</td><td>{e.remarks}</td></tr>)}</tbody>
          </table>
        </section>
      </div>
    </>
  );
}
