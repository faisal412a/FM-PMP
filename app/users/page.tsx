"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "password123", role: "Management" });
  async function load() {
    const res = await fetch("/api/users");
    if (res.status === 401) location.assign("/login");
    const body = await res.json();
    setUsers(body.users || []);
  }
  useEffect(() => { load(); }, []);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const res = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      setForm({ name: "", email: "", password: "password123", role: "Management" });
      load();
    } else alert((await res.json()).error);
  }
  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));
  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="page-title">User Management</h1>
          <div className="muted">Create users and assign roles.</div>
        </div>
      </div>
      <form className="panel" onSubmit={submit}>
        <div className="form-grid">
          <div className="field"><label>Name</label><input className="input" value={form.name} onChange={(e) => set("name", e.target.value)} required /></div>
          <div className="field"><label>Email</label><input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required /></div>
          <div className="field"><label>Password</label><input className="input" value={form.password} onChange={(e) => set("password", e.target.value)} /></div>
          <div className="field"><label>Role</label><select value={form.role} onChange={(e) => set("role", e.target.value)}>{["Admin","Data Entry","Project Finance","Management"].map((role) => <option key={role}>{role}</option>)}</select></div>
        </div>
        <button className="btn" style={{ marginTop: 14 }}><Plus size={18} />Create user</button>
      </form>
      <section className="panel table-wrap" style={{ marginTop: 16 }}>
        <table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Active</th><th>Created</th></tr></thead>
          <tbody>{users.map((user) => <tr key={user.id}><td>{user.name}</td><td>{user.email}</td><td>{user.role}</td><td>{user.is_active ? "Yes" : "No"}</td><td>{user.created_at}</td></tr>)}</tbody>
        </table>
      </section>
    </>
  );
}
