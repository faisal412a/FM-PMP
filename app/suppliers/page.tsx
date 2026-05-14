"use client";

import { useEffect, useState } from "react";
import { Plus, Save } from "lucide-react";
import FileUploadButton from "@/components/FileUploadButton";
import { money } from "@/lib/format";

const emptySupplier = {
  name: "",
  arabic_name: "",
  contact_person: "",
  email: "",
  phone: "",
  secondary_phone: "",
  vat_number: "",
  cr_number: "",
  national_address: "",
  has_whatsapp: false,
  category: "",
  notes: ""
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [form, setForm] = useState<any>(emptySupplier);
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("");
  const [documents, setDocuments] = useState<Record<string, File[]>>({ CR: [], VAT: [], "National Address": [] });
  const readOnly = role === "Management";

  async function load() {
    const res = await fetch("/api/suppliers");
    if (res.status === 401) location.assign("/login");
    const body = await res.json();
    setSuppliers(body.suppliers || []);
  }
  useEffect(() => {
    load();
    fetch("/api/auth/me").then((res) => res.ok ? res.json() : null).then((body) => setRole(body?.user?.role || ""));
  }, []);

  async function uploadSupplierDocuments(supplierName: string) {
    for (const [documentType, files] of Object.entries(documents)) {
      if (!files.length) continue;
      const data = new FormData();
      data.append("supplier_name", supplierName);
      data.append("document_type", documentType);
      files.forEach((file) => data.append("files", file));
      const res = await fetch("/api/suppliers/documents", { method: "POST", body: data });
      if (!res.ok) throw new Error((await res.json()).error || "Unable to upload supplier document");
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/suppliers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) {
      alert((await res.json()).error);
      return;
    }
    try {
      await uploadSupplierDocuments(form.name);
    } catch (error: any) {
      alert(error.message);
      return;
    }
    setForm(emptySupplier);
    setDocuments({ CR: [], VAT: [], "National Address": [] });
    setOpen(false);
    load();
  }

  function edit(supplier: any) {
    setForm({
      name: supplier.name || "",
      arabic_name: supplier.arabic_name || "",
      contact_person: supplier.contact_person || "",
      email: supplier.email || "",
      phone: supplier.phone || "",
      secondary_phone: supplier.secondary_phone || "",
      vat_number: supplier.vat_number || "",
      cr_number: supplier.cr_number || "",
      national_address: supplier.national_address || "",
      has_whatsapp: Boolean(supplier.has_whatsapp),
      category: supplier.category || "",
      notes: supplier.notes || ""
    });
    setDocuments({ CR: [], VAT: [], "National Address": [] });
    setOpen(true);
  }

  const set = (key: string, value: any) => setForm((current: any) => ({ ...current, [key]: value }));
  const addDocs = (type: string, files: FileList) => setDocuments((current) => ({ ...current, [type]: [...(current[type] || []), ...Array.from(files)] }));

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <div className="muted">Manage supplier master data and review won projects, value, and evaluation.</div>
        </div>
        {!readOnly ? <button className="btn" onClick={() => setOpen(true)}><Plus size={18} />Add supplier</button> : null}
      </div>

      <section className="panel table-wrap">
        <table>
          <thead><tr><th>Supplier</th><th>Contact</th><th>Tax IDs</th><th>Projects Won</th><th>Total Value</th><th>Evaluation</th>{!readOnly ? <th>Actions</th> : null}</tr></thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id || supplier.name}>
                <td><strong>{supplier.name}</strong><br /><span className="muted">{supplier.arabic_name || supplier.category}</span></td>
                <td>{supplier.contact_person || "-"}<br /><span className="muted">{supplier.phone}</span></td>
                <td>VAT: {supplier.vat_number || "-"}<br />CR: {supplier.cr_number || "-"}</td>
                <td>{supplier.projects_won || 0}</td>
                <td>{money(supplier.total_value)}</td>
                <td>{Number(supplier.average_rating || 0).toFixed(2)} / 5</td>
                {!readOnly ? <td><button className="btn secondary" onClick={() => edit(supplier)}>Edit</button></td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {open && !readOnly ? (
        <div className="modal-backdrop">
          <form className="modal" onSubmit={save}>
            <div className="toolbar" style={{ justifyContent: "space-between" }}>
              <h3>Create New Contact</h3>
              <button type="button" className="btn secondary" onClick={() => setOpen(false)}>Close</button>
            </div>
            <h3>Corporate Identity</h3>
            <div className="form-grid">
              <div className="field"><label>Company Name (Arabic) Official for transactions</label><input className="input" value={form.arabic_name} onChange={(e) => set("arabic_name", e.target.value)} /></div>
              <div className="field"><label>Company Name (English) *</label><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
              <div className="field"><label>Category</label><input className="input" value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="code e.g. CON-001" /></div>
            </div>
            <h3>Contact Person</h3>
            <div className="form-grid">
              <div className="field span-3"><label>Contact Name *</label><input className="input" value={form.contact_person} onChange={(e) => set("contact_person", e.target.value)} required /></div>
              <div className="field"><label>Mobile *</label><input className="input" value={form.phone} onChange={(e) => set("phone", e.target.value)} required placeholder="(966) XX-XXXXXXX" /></div>
              <div className="field"><label>Secondary Phone</label><input className="input" value={form.secondary_phone} onChange={(e) => set("secondary_phone", e.target.value)} /></div>
              <div className="field"><label>Email Address</label><input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
              <label className="field"><input type="checkbox" checked={form.has_whatsapp} onChange={(e) => set("has_whatsapp", e.target.checked)} /> Has WhatsApp?</label>
            </div>
            <h3>Taxpayer Identification</h3>
            <div className="form-grid">
              <div className="field"><label>VAT Registry Number *</label><input className="input" value={form.vat_number} onChange={(e) => set("vat_number", e.target.value)} required placeholder="15-digit VAT" /></div>
              <div className="field"><label>National Address</label><input className="input" value={form.national_address} onChange={(e) => set("national_address", e.target.value)} /></div>
              <div className="field"><label>Commercial Registration *</label><input className="input" value={form.cr_number} onChange={(e) => set("cr_number", e.target.value)} required /></div>
              <div className="field span-3"><label>Notes</label><textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
            </div>
            <div className="toolbar">
              <FileUploadButton label="Upload CR" onFiles={(files) => addDocs("CR", files)} />
              <FileUploadButton label="Upload VAT" onFiles={(files) => addDocs("VAT", files)} />
              <FileUploadButton label="Upload National Address" onFiles={(files) => addDocs("National Address", files)} />
            </div>
            <p className="muted">Upload supplier CR, VAT & National Address before proceeding with PO.</p>
            <button className="btn" style={{ marginTop: 14 }}><Save size={18} />Save supplier</button>
          </form>
        </div>
      ) : null}
    </>
  );
}
