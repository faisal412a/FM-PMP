"use client";

import { useRouter } from "next/navigation";
import ProjectForm from "@/components/ProjectForm";

export default function NewProjectPage() {
  const router = useRouter();
  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="page-title">New Project</h1>
          <div className="muted">Create project master data with quote and PO references.</div>
        </div>
      </div>
      <ProjectForm onSaved={(body) => router.push(`/projects/${body.id}`)} />
    </>
  );
}
