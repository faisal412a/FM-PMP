"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const body = await response.json();
      setError(body.error || "Login failed");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="login-page">
      <form className="panel login-card" onSubmit={submit}>
        <h1 className="page-title">Project Management</h1>
        <p className="muted">Sign in with one of the seeded demo accounts.</p>
        <div className="grid">
          <div className="field">
            <label>Email</label>
            <input className="input" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          {error ? <div className="badge red">{error}</div> : null}
          <button className="btn"><LogIn size={18} />Sign in</button>
        </div>
      </form>
    </main>
  );
}
