"use client";

import FileUploadButton from "./FileUploadButton";
import { Trash2 } from "lucide-react";

export default function DocumentUploadPanel({ project, onRefresh, readOnly = false }: { project: any; onRefresh: () => void; readOnly?: boolean }) {
  async function upload(files: FileList) {
    const data = new FormData();
    data.append("document_type", "Project Document");
    Array.from(files).forEach((file) => data.append("files", file));
    const res = await fetch(`/api/projects/${project.id}/documents`, { method: "POST", body: data });
    if (res.ok) onRefresh();
    else alert((await res.json()).error);
  }
  async function remove(documentId: number) {
    if (!confirm("Delete this document?")) return;
    const res = await fetch(`/api/projects/${project.id}/documents?documentId=${documentId}`, { method: "DELETE" });
    if (res.ok) onRefresh();
    else alert((await res.json()).error);
  }

  return (
    <section className="panel table-wrap">
      <div className="toolbar">
        <h3>Project Documents</h3>
        {!readOnly ? <FileUploadButton label="Upload drawings / documents" multiple onFiles={upload} /> : null}
      </div>
      <table>
        <thead><tr><th>Type</th><th>File</th><th>Path</th><th>Uploaded</th>{!readOnly ? <th>Actions</th> : null}</tr></thead>
        <tbody>
          {project.documents.length ? project.documents.map((doc: any) => (
            <tr key={doc.id}><td>{doc.document_type}</td><td>{doc.file_name}</td><td>{doc.file_path}</td><td>{doc.uploaded_at}</td>{!readOnly ? <td><button className="btn danger" onClick={() => remove(doc.id)}><Trash2 size={16} />Delete</button></td> : null}</tr>
          )) : <tr><td colSpan={readOnly ? 4 : 5}>No files uploaded yet.</td></tr>}
        </tbody>
      </table>
      {project.supplierDocuments?.length ? (
        <>
          <h3 style={{ marginTop: 20 }}>Supplier Documents</h3>
          <table>
            <thead><tr><th>Supplier</th><th>Type</th><th>File</th><th>Uploaded</th></tr></thead>
            <tbody>{project.supplierDocuments.map((doc: any) => <tr key={`supplier-${doc.id}`}><td>{doc.supplier_name}</td><td>{doc.document_type}</td><td>{doc.file_name}</td><td>{doc.uploaded_at}</td></tr>)}</tbody>
          </table>
        </>
      ) : null}
    </section>
  );
}
