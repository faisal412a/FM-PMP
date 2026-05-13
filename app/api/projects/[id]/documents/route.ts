import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";
import { logActivity, rows, run } from "@/lib/db";
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
