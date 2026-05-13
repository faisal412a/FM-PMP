"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import FileUploadButton from "./FileUploadButton";
import { money } from "@/lib/format";

export default function QuotePoInvoiceEditor({ project, onRefresh }: { project: any; onRefresh: () => void }) {
  const [form, setForm] = useState({
    quote_number: project.quote?.quote_number || "",
    quote_date: project.quote?.quote_date || "",
    quote_amount: project.quote?.quote_amount || 0,
    supplier_name: project.quote?.supplier_name || project.supplier_name || "",
    quote_file: project.quote?.quote_file || "",
    po_number: project.po?.po_number || "",
    po_date: project.po?.po_date || "",
    po_amount: project.po?.po_amount || 0,
    po_file: project.po?.po_file || ""
  });
  const invoices = project.documents.filter((doc: any) => doc.document_type === "Invoice");

  function set(key: string, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function save(event?: React.FormEvent) {
    event?.preventDefault();
    const res = await fetch(`/api/projects/${project.id}/references`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    if (res.ok) onRefresh();
    else alert((await res.json()).error);
  }

  async function upload(documentType: "Quote" | "PO" | "Invoice", files: FileList) {
    const data = new FormData();
    data.append("document_type", documentType);
    Array.from(files).forEach((file) => data.append("files", file));
    const res = await fetch(`/api/projects/${project.id}/documents`, { method: "POST", body: data });
    if (!res.ok) {
      alert((await res.json()).error);
      return;
    }
    if (documentType === "Quote") setForm((current) => ({ ...current, quote_file: files[0].name }));
    if (documentType === "PO") setForm((current) => ({ ...current, po_file: files[0].name }));
    onRefresh();
  }

  return (
    <div className="grid three">
      <form className="panel" onSubmit={save}>
        <h3>Quote Reference</h3>
        <div className="grid">
          <div className="field"><label>Quote number</label><input className="input" value={form.quote_number} onChange={(e) => set("quote_number", e.target.value)} /></div>
          <div className="field"><label>Quote date</label><input className="input" type="date" value={form.quote_date || ""} onChange={(e) => set("quote_date", e.target.value)} /></div>
          <div className="field"><label>Supplier name</label><select value={form.supplier_name} onChange={(e) => set("supplier_name", e.target.value)}>{[...new Set([form.supplier_name, project.supplier_name, ...(project.supplierOptions || [])].filter(Boolean))].map((supplier: any) => <option key={supplier}>{supplier}</option>)}</select></div>
          <div className="field"><label>Quote amount</label><input className="input" type="number" value={form.quote_amount} onChange={(e) => set("quote_amount", e.target.value)} /></div>
          <div className="muted">Current file: {form.quote_file || "No file attached"}</div>
          <div className="toolbar">
            <FileUploadButton label="Attach quote" onFiles={(files) => upload("Quote", files)} />
            <button className="btn"><Save size={18} />Save</button>
          </div>
        </div>
      </form>

      <form className="panel" onSubmit={save}>
        <h3>PO Reference</h3>
        <div className="grid">
          <div className="field"><label>PO number</label><input className="input" value={form.po_number} onChange={(e) => set("po_number", e.target.value)} /></div>
          <div className="field"><label>PO date</label><input className="input" type="date" value={form.po_date || ""} onChange={(e) => set("po_date", e.target.value)} /></div>
          <div className="field"><label>PO amount</label><input className="input" type="number" value={form.po_amount} onChange={(e) => set("po_amount", e.target.value)} /></div>
          <div className="muted">Current file: {form.po_file || "No file attached"}</div>
          <div className="toolbar">
            <FileUploadButton label="Attach PO" onFiles={(files) => upload("PO", files)} />
            <button className="btn"><Save size={18} />Save</button>
          </div>
        </div>
      </form>

      <section className="panel">
        <h3>Invoices</h3>
        <p className="muted">Project value: {money(project.project_value)}</p>
        <FileUploadButton label="Upload invoice" multiple onFiles={(files) => upload("Invoice", files)} />
        <div className="upload-list">
          {invoices.length ? invoices.map((doc: any) => (
            <div className="upload-row" key={doc.id}><span>{doc.file_name}</span><span>{doc.uploaded_at}</span></div>
          )) : <div className="muted">No invoices uploaded yet.</div>}
        </div>
      </section>
    </div>
  );
}
