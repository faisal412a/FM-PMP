"use client";

import FileUploadButton from "./FileUploadButton";
import { Trash2 } from "lucide-react";

export default function DocumentUploadPanel({ project, onRefresh }: { project: any; onRefresh: () => void }) {
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
        <FileUploadButton label="Upload drawings / documents" multiple onFiles={upload} />
      </div>
      <table>
        <thead><tr><th>Type</th><th>File</th><th>Path</th><th>Uploaded</th><th>Actions</th></tr></thead>
        <tbody>
          {project.documents.length ? project.documents.map((doc: any) => (
            <tr key={doc.id}><td>{doc.document_type}</td><td>{doc.file_name}</td><td>{doc.file_path}</td><td>{doc.uploaded_at}</td><td><button className="btn danger" onClick={() => remove(doc.id)}><Trash2 size={16} />Delete</button></td></tr>
          )) : <tr><td colSpan={5}>No files uploaded yet.</td></tr>}
        </tbody>
      </table>
    </section>
  );
}
