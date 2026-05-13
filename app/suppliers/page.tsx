"use client";

import { useEffect, useState } from "react";
import { Plus, Save } from "lucide-react";
import { money } from "@/lib/format";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", contact_person: "", email: "", phone: "", category: "", notes: "" });
  const [open, setOpen] = useState(false);

  async function load() {
    const res = await fetch("/api/suppliers");
    if (res.status === 401) location.assign("/login");
    const body = await res.json();
    setSuppliers(body.suppliers || []);
  }
  useEffect(() => { load(); }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/suppliers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) {
      alert((await res.json()).error);
      return;
    }
    setForm({ name: "", contact_person: "", email: "", phone: "", category: "", notes: "" });
    setOpen(false);
    load();
  }

  function edit(supplier: any) {
    setForm({
      name: supplier.name || "",
      contact_person: supplier.contact_person || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      category: supplier.category || "",
      notes: supplier.notes || ""
    });
    setOpen(true);
  }

  const set = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <div className="muted">Manage supplier master data and review won projects, value, and evaluation.</div>
        </div>
        <button className="btn" onClick={() => setOpen(true)}><Plus size={18} />Add supplier</button>
      </div>

      <section className="panel table-wrap">
        <table>
          <thead><tr><th>Supplier</th><th>Contact</th><th>Category</th><th>Projects Won</th><th>Total Value</th><th>Evaluation</th><th>Actions</th></tr></thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id || supplier.name}>
                <td><strong>{supplier.name}</strong><br /><span className="muted">{supplier.email}</span></td>
                <td>{supplier.contact_person || "-"}<br /><span className="muted">{supplier.phone}</span></td>
                <td>{supplier.category || "-"}</td>
                <td>{supplier.projects_won || 0}</td>
                <td>{money(supplier.total_value)}</td>
                <td>{Number(supplier.average_rating || 0).toFixed(2)} / 5</td>
                <td><button className="btn secondary" onClick={() => edit(supplier)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {open ? (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={save}>
            <div className="toolbar" style={{ justifyContent: "space-between" }}>
              <h3>Supplier Details</h3>
              <button type="button" className="btn secondary" onClick={() => setOpen(false)}>Close</button>
            </div>
            <div className="form-grid">
              <div className="field"><label>Supplier name</label><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
              <div className="field"><label>Contact person</label><input className="input" value={form.contact_person} onChange={(e) => set("contact_person", e.target.value)} /></div>
              <div className="field"><label>Email</label><input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
              <div className="field"><label>Phone</label><input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
              <div className="field"><label>Category</label><input className="input" value={form.category} onChange={(e) => set("category", e.target.value)} /></div>
              <div className="field span-3"><label>Notes</label><textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
            </div>
            <button className="btn" style={{ marginTop: 14 }}><Save size={18} />Save supplier</button>
          </form>
        </div>
      ) : null}
    </>
  );
}
