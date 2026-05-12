"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CreditCard, FolderKanban, Gauge, TimerReset } from "lucide-react";
import { money } from "@/lib/format";
import Badge from "@/components/Badge";

const colors = ["#126b8f", "#1b8a5a", "#bd3d35", "#b7791f", "#657087"];

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    fetch("/api/dashboard").then((res) => (res.status === 401 ? location.assign("/login") : res.json())).then(setData);
  }, []);
  if (!data) return <div className="panel">Loading dashboard...</div>;
  const cards = [
    ["Total Projects", data.cards.totalProjects, FolderKanban],
    ["In Progress", data.cards.inProgress, Gauge],
    ["Delayed", data.cards.delayed, TimerReset],
    ["Total Paid", money(data.cards.totalPaid), CreditCard],
    ["Total Balance", money(data.cards.totalBalance), CreditCard]
  ];

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="page-title">Management Dashboard</h1>
          <div className="muted">Projects, payments, progress, and supplier performance at a glance.</div>
        </div>
      </div>

      <div className="grid cards">
        {cards.map(([label, value, Icon]: any) => (
          <div className="card" key={label}>
            <Icon size={20} color="#126b8f" />
            <div className="kpi-label">{label}</div>
            <div className="kpi-value">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid two" style={{ marginTop: 16 }}>
        <section className="panel">
          <h3>Project Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.statusChart} dataKey="value" nameKey="name" outerRadius={90} label>
                {data.statusChart.map((_: any, index: number) => <Cell key={index} fill={colors[index % colors.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </section>
        <section className="panel">
          <h3>Monthly Project Value</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => money(Number(value))} />
              <Bar dataKey="value" fill="#126b8f" />
            </BarChart>
          </ResponsiveContainer>
        </section>
        <section className="panel">
          <h3>Payment Due vs Paid</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.paymentsChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => money(Number(value))} />
              <Bar dataKey="value" fill="#1b8a5a" />
            </BarChart>
          </ResponsiveContainer>
        </section>
        <section className="panel">
          <h3>Supplier Rating Comparison</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.supplierRatings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="supplier_name" />
              <YAxis domain={[0, 5]} />
              <Tooltip />
              <Bar dataKey="rating" fill="#b7791f" />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="grid two" style={{ marginTop: 16 }}>
        <section className="panel">
          <h3>Delayed Projects</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Project</th><th>Client</th><th>Status</th><th>Value</th></tr></thead>
              <tbody>{data.delayedProjects.map((p: any) => <tr key={p.id}><td>{p.name}</td><td>{p.client_name}</td><td><Badge status={p.status} /></td><td>{money(p.project_value)}</td></tr>)}</tbody>
            </table>
          </div>
        </section>
        <section className="panel">
          <h3>Upcoming Payment Due List</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Project</th><th>Stage</th><th>Due</th><th>Balance</th><th>Status</th></tr></thead>
              <tbody>{data.upcomingPayments.map((p: any) => <tr key={p.id}><td>{p.project_name}</td><td>{p.stage_name}</td><td>{p.due_date}</td><td>{money(p.balance_amount)}</td><td><Badge status={p.status} /></td></tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
