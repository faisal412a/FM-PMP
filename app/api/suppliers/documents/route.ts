import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { json, requireUser } from "@/lib/api";
import { logActivity, row, rows, run } from "@/lib/db";
import { dataDir, safeFileName } from "@/lib/storage";

function supplierUploadDir(supplierName: string) {
  const dir = path.join(dataDir, "supplier-uploads", safeFileName(supplierName));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function POST(request: NextRequest) {
  const auth = requireUser(request, "document:write");
  if ("error" in auth) return auth.error;
  const form = await request.formData();
  const supplierName = String(form.get("supplier_name") || "");
  const documentType = String(form.get("document_type") || "Supplier Document");
  const files = form.getAll("files").filter((file): file is File => {
    return typeof file === "object" && file !== null && "arrayBuffer" in file && "name" in file && "size" in file && Number((file as File).size) > 0;
  });

  if (!supplierName) return json({ error: "Supplier name is required" }, 400);
  if (!files.length) return json({ error: "Select at least one file" }, 400);

  for (const file of files) {
    const fileName = `${Date.now()}-${safeFileName(file.name)}`;
    const filePath = path.join(supplierUploadDir(supplierName), fileName);
    fs.writeFileSync(filePath, Buffer.from(await file.arrayBuffer()));
    run(
      `insert into supplier_documents (supplier_name, document_type, file_name, file_path, uploaded_by)
       values (?, ?, ?, ?, ?)`,
      [supplierName, documentType, file.name, filePath, auth.user.id]
    );
  }

  logActivity({ userId: auth.user.id, action: "Supplier document uploaded", module: "Suppliers", newValue: { supplierName, documentType } });
  return json({ documents: rows("select * from supplier_documents where supplier_name = ? order by uploaded_at desc", [supplierName]) }, 201);
}

export async function GET(request: NextRequest) {
  const auth = requireUser(request, "supplier:read");
  if ("error" in auth) return auth.error;
  const documentId = Number(request.nextUrl.searchParams.get("documentId"));
  const doc = row<any>("select * from supplier_documents where id = ?", [documentId]);
  if (!doc || !doc.file_path || !fs.existsSync(doc.file_path)) return json({ error: "Document not found" }, 404);
  const file = fs.readFileSync(doc.file_path);
  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.file_name)}"`
    }
  });
}
