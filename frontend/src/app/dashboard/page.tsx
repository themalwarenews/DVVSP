"use client";
import { useEffect, useState } from "react";

const API_URL = "http://localhost:3001/api/videos";
const UPLOAD_URL = "http://localhost:3001/api/videos/upload";

export default function Dashboard() {
  const [videos, setVideos] = useState<any[]>([]);
  const [file, setFile] = useState<any>(null);
  const [uploadResult, setUploadResult] = useState("");

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setVideos(data))
      .catch(() => setVideos([]));
  }, [uploadResult]);

  async function handleUpload(e: any) {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append("video", file);
    try {
      const res = await fetch(UPLOAD_URL, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setUploadResult(data.message || "Upload complete");
    } catch {
      setUploadResult("Upload failed");
    }
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#181c22" }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: "#23272f", color: "#fff", padding: 32, display: "flex", flexDirection: "column", gap: 32, minHeight: "100vh" }}>
        <h2 style={{ fontSize: 28, marginBottom: 32, fontWeight: 700, letterSpacing: 1, color: "#1ab7ea" }}>VimeoLite</h2>
        <nav style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <a href="#upload" style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}>Upload</a>
          <a href="#myvideos" style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}>My Videos</a>
          <a href="#explore" style={{ color: "#fff", textDecoration: "none", fontWeight: 500 }}>Explore</a>
        </nav>
      </aside>
      {/* Main Content */}
      <main style={{ flex: 1, padding: "40px 5vw", maxWidth: 1200, margin: "0 auto" }}>
        {/* Upload Section */}
        <section id="upload" style={{ marginBottom: 40, background: "#23272f", borderRadius: 12, boxShadow: "0 2px 16px #0003", padding: 32 }}>
          <h3 style={{ fontSize: 22, marginBottom: 18, color: "#fff" }}>Upload a Video</h3>
          <form onSubmit={handleUpload} style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <input type="file" accept="video/*" onChange={e => setFile(e.target.files?.[0])} required style={{ flex: 1, background: "#181c22", color: "#fff", border: "1px solid #444", borderRadius: 6, padding: 8 }} />
            <button type="submit" style={{ padding: "10px 24px", borderRadius: 6, background: "#1ab7ea", color: "#fff", border: "none", fontSize: 16, fontWeight: 600, cursor: "pointer" }}>Upload</button>
          </form>
          <div style={{ color: uploadResult.includes("fail") ? "#c00" : "#1ab7ea", minHeight: 24, fontWeight: 500, marginTop: 12 }}>{uploadResult}</div>
        </section>
        {/* Video Grid Section */}
        <section id="explore">
          <h3 style={{ fontSize: 22, marginBottom: 18, color: "#fff" }}>All Videos</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 28 }}>
            {videos.map((v, i) => (
              <div key={i} style={{ background: "#23272f", borderRadius: 10, boxShadow: "0 2px 12px #0003", padding: 18, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: "100%", height: 140, background: "#181c22", borderRadius: 8, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#1ab7ea", fontSize: 32 }}>
                  <span role="img" aria-label="video">🎬</span>
                </div>
                <b style={{ fontSize: 17, marginBottom: 6, color: "#fff" }}>{v.title || v.filename}</b>
                <span style={{ fontSize: 13, color: "#1ab7ea", marginBottom: 8 }}>{v.is_public ? "Public" : "Private"}</span>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button style={{ padding: "6px 12px", borderRadius: 5, background: "#1ab7ea", color: "#fff", border: "none", fontWeight: 500, cursor: "pointer" }}>View</button>
                  <button style={{ padding: "6px 12px", borderRadius: 5, background: "#6c757d", color: "#fff", border: "none", fontWeight: 500, cursor: "pointer" }}>Share</button>
                  <button style={{ padding: "6px 12px", borderRadius: 5, background: "#e4572e", color: "#fff", border: "none", fontWeight: 500, cursor: "pointer" }}>Report</button>
                  <button style={{ padding: "6px 12px", borderRadius: 5, background: "#495057", color: "#fff", border: "none", fontWeight: 500, cursor: "pointer" }}>Privacy</button>
                  <button style={{ padding: "6px 12px", borderRadius: 5, background: "#adb5bd", color: "#222", border: "none", fontWeight: 500, cursor: "pointer" }}>Password</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
