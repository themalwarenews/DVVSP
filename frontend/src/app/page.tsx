import Link from "next/link";

export default function Home() {
  return (
    <main style={{
      maxWidth: 420,
      margin: "3rem auto",
      textAlign: "center",
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 2px 16px #0002",
      padding: 36,
      border: "1px solid #eee"
    }}>
      <h1 style={{ fontSize: 32, marginBottom: 12 }}>Vulnerable Video Hosting</h1>
      <p style={{ color: "#444", marginBottom: 24 }}>
        Welcome! This is a deliberately insecure video platform for educational use only.
      </p>
      <div style={{ margin: "2rem 0", display: "flex", justifyContent: "center", gap: 24 }}>
        <Link href="/signup" style={{ padding: "10px 24px", background: "#222", color: "#fff", borderRadius: 6, textDecoration: "none" }}>Sign Up</Link>
        <Link href="/login" style={{ padding: "10px 24px", background: "#eee", color: "#222", borderRadius: 6, textDecoration: "none", border: "1px solid #ccc" }}>Log In</Link>
      </div>
      <p style={{ color: "#c00", fontWeight: 600 }}>
        Warning: This site is intentionally vulnerable. Do not use real credentials.
      </p>
    </main>
  );
}
