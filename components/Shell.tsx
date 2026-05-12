"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { BarChart3, Bell, FileSpreadsheet, FolderKanban, Globe2, LogOut, Maximize, Moon, PanelLeft, Users } from "lucide-react";
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
        <div className="brand"><Image src="/faden-logo.png" alt="Faden Media" width={124} height={58} priority /></div>
        <div className="sidebar-section">MENU</div>
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
      <section className="content-shell">
        <header className="app-header">
          <button className="icon-btn" aria-label="Toggle navigation"><PanelLeft size={21} /></button>
          <div className="header-actions">
            <Globe2 size={18} />
            <Maximize size={18} />
            <Moon size={18} />
            <span className="notification"><Bell size={18} /><b>0</b></span>
            <div className="header-user">{user.email}</div>
          </div>
        </header>
        <main className="main">{children}</main>
        <footer className="app-footer">
          <span>2026 © FadenMedia.</span>
          <span>Design & Develop by Operation Team</span>
        </footer>
      </section>
    </div>
  );
}
