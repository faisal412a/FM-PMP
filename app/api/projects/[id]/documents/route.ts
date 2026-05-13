import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";
import { logActivity, row, rows, run } from "@/lib/db";
import { safeFileName, uploadDir } from "@/lib/storage";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireUser(request, "document:write");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const projectId = Number(id);
  const form = await request.formData();
  const documentType = String(form.get("document_type") || "Project Document");
  const files = form.getAll("files").filter((file): file is File => {
    return typeof file === "object" && file !== null && "arrayBuffer" in file && "name" in file && "size" in file && Number((file as File).size) > 0;
  });

  if (!files.length) return json({ error: "Select at least one file" }, 400);

  const saved = [];
  for (const file of files) {
    const fileName = `${Date.now()}-${safeFileName(file.name)}`;
    const filePath = path.join(uploadDir(projectId), fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);
    const result = run(
      `insert into project_documents (project_id, document_type, file_name, file_path, uploaded_by)
       values (?, ?, ?, ?, ?)`,
      [projectId, documentType, file.name, filePath, auth.user.id]
    );
    saved.push({ id: result.lastInsertRowid, file_name: file.name, file_path: filePath });

    if (documentType === "Quote") {
      run("update project_quotes set quote_file = ? where project_id = ?", [file.name, projectId]);
    }
    if (documentType === "PO") {
      run("update project_pos set po_file = ? where project_id = ?", [file.name, projectId]);
    }
  }

  logActivity({ userId: auth.user.id, action: "Document uploaded", module: "Documents", newValue: { projectId, documentType, files: saved.map((file) => file.file_name) } });
  return json({ documents: rows("select * from project_documents where project_id = ? order by uploaded_at desc", [projectId]) }, 201);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireUser(request, "document:write");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const projectId = Number(id);
  const documentId = Number(request.nextUrl.searchParams.get("documentId"));
  const documentType = request.nextUrl.searchParams.get("documentType");
  const doc = documentId
    ? row<any>("select * from project_documents where id = ? and project_id = ?", [documentId, projectId])
    : row<any>("select * from project_documents where project_id = ? and document_type = ? order by uploaded_at desc", [projectId, documentType]);
  if (!doc) return json({ error: "Document not found" }, 404);

  if (doc.file_path && fs.existsSync(doc.file_path)) fs.rmSync(doc.file_path, { force: true });
  run("delete from project_documents where id = ? and project_id = ?", [doc.id, projectId]);
  if (doc.document_type === "Quote") run("update project_quotes set quote_file = '' where project_id = ?", [projectId]);
  if (doc.document_type === "PO") run("update project_pos set po_file = '' where project_id = ?", [projectId]);
  logActivity({ userId: auth.user.id, action: "Document deleted", module: "Documents", oldValue: doc, newValue: { projectId } });
  return json({ ok: true });
}
