"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarChart3, FileSpreadsheet, FolderKanban, LogOut, PanelLeft, Users } from "lucide-react";
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
  const [collapsed, setCollapsed] = useState(false);
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, 30 * 60 * 1000);
    };
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((event) => window.addEventListener(event, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((event) => window.removeEventListener(event, reset));
    };
  }, []);
  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="brand-text">Faden PMS</div>
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
          <button className="icon-btn" aria-label="Toggle navigation" onClick={() => setCollapsed((value) => !value)}><PanelLeft size={21} /></button>
          <div className="header-actions">
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
