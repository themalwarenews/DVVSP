"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = "http://localhost:3001/api/auth/login";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: any) {
    e.preventDefault();
    setResult("");
    setLoading(true);
    let data = {};
    let res: Response;
    try {
      res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      data = await res.json();
    } catch (err) {
      setLoading(false);
      setResult("Login failed: Invalid server response");
      return;
    }
    setLoading(false);
    if (res.ok && (data as any).user) {
      setResult("Login successful! Redirecting to dashboard...");
      setTimeout(() => router.push("/dashboard"), 1200);
    } else {
      setResult((data as any).error || "Login failed");
    }
  }

  return (
    <main style={{ maxWidth: 420, minHeight: "100vh", background: "#181c22", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "100%", background: "#23272f", borderRadius: 16, boxShadow: "0 2px 16px #0003", padding: 36, margin: 32 }}>
        <h2 style={{ marginBottom: 20, fontSize: 26, color: "#1ab7ea" }}>Log In</h2>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <input
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={{ padding: 12, borderRadius: 6, border: "1px solid #444", fontSize: 16, background: "#181c22", color: "#fff" }}
          />
          <input
            placeholder="Password"
            type="text"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ padding: 12, borderRadius: 6, border: "1px solid #444", fontSize: 16, background: "#181c22", color: "#fff" }}
          />
          <button type="submit" style={{ padding: 12, borderRadius: 6, background: "#1ab7ea", color: "#fff", border: "none", fontSize: 16, cursor: "pointer", fontWeight: 600 }}>
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
        <div style={{ marginTop: 18, color: result.includes("success") ? "#1ab7ea" : "#c00", minHeight: 24, fontWeight: 500 }}>
          {result}
        </div>
        <div style={{ marginTop: 18, color: "#fff" }}>
          Don&apos;t have an account? <Link href="/signup" style={{ color: "#1ab7ea" }}>Sign Up</Link>
        </div>
      </div>
    </main>
  );
}
