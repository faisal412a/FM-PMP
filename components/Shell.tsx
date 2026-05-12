"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, FileSpreadsheet, FolderKanban, LogOut, Users } from "lucide-react";
import type { SessionUser } from "@/lib/types";
import { navForRole } from "@/lib/permissions";

const icons: Record<string, any> = {
  Dashboard: BarChart3,
  Projects: FolderKanban,
  Reports: FileSpreadsheet,
  Users
};

export default function Shell({ user, children }: { user: SessionUser; children: React.ReactNode }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Project Management</div>
        <div>{user.name}</div>
        <div className="role-pill">{user.role}</div>
        <nav className="nav">
          {navForRole(user.role).map((item) => {
            const Icon = icons[item.label] || FolderKanban;
            return <Link key={item.href} href={item.href}><Icon size={18} />{item.label}</Link>;
          })}
          <button onClick={logout}><LogOut size={18} />Logout</button>
        </nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
