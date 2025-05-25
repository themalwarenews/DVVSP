"use client";
import { useEffect, useState, FormEvent, ChangeEvent } from "react";
import styles from "./Dashboard.module.css"; // Import CSS module

const API_URL = "http://localhost:3001/api/videos";
const UPLOAD_URL = "http://localhost:3001/api/videos/upload";

interface Video {
  id: number;
  filename: string;
  title: string;
  description?: string;
  is_public: boolean;
  password_protected?: boolean; // True if private and has a password
  // Add other fields like user_id, created_at if needed by UI
}

export default function Dashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState<string>(""); // Specify type
  const [description, setDescription] = useState<string>(""); // Specify type
  const [isPublicUpload, setIsPublicUpload] = useState<boolean>(true);
  const [passwordUpload, setPasswordUpload] = useState<string>("");
  const [uploadResult, setUploadResult] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false); // For upload progress indicator

  const [playingVideo, setPlayingVideo] = useState<Video | null>(null);
  const [videoStreamUrl, setVideoStreamUrl] = useState<string | null>(null);

  const [showPasswordPrompt, setShowPasswordPrompt] = useState<boolean>(false); // Specify type
  const [passwordInput, setPasswordInput] = useState<string>(""); // Specify type

  const [showShareModal, setShowShareModal] = useState<boolean>(false); // Specify type
  const [shareableLink, setShareableLink] = useState<string>(""); // Specify type

  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false); // Specify type
  const [currentVideoPrivacy, setCurrentVideoPrivacy] = useState<Video | null>(null);
  const [privacyModalIsPublic, setPrivacyModalIsPublic] = useState<boolean>(true); // Specify type
  const [privacyModalPassword, setPrivacyModalPassword] = useState<string>(""); // Specify type
  
  const [activeSection, setActiveSection] = useState<string>("explore"); // For sidebar navigation

  const MOCK_USER_ID = 1; // Mock user ID for uploads

  function fetchVideos() {
    fetch(API_URL)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data: Video[]) => setVideos(data))
      .catch((error) => {
        setVideos([]);
        setUploadResult(`Failed to fetch videos: ${error.message}`);
      });
  }

  useEffect(() => {
    fetchVideos();
  }, []);

  async function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file || !title.trim()) {
      setUploadResult("File and a valid Title are required.");
      return;
    }
    setIsUploading(true); // Start uploading indicator
    setUploadResult(""); // Clear previous messages

    const formData = new FormData();
    formData.append("video", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("userId", MOCK_USER_ID.toString());
    formData.append("isPublic", String(isPublicUpload));
    if (!isPublicUpload && passwordUpload) {
      formData.append("password", passwordUpload);
    }

    try {
      const res = await fetch(UPLOAD_URL, { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setUploadResult(data.message || `Upload complete: ${data.filename || 'video'}`);
        fetchVideos();
        setFile(null);
        setTitle("");
        setDescription("");
        setIsPublicUpload(true);
        setPasswordUpload("");
        if (e.target instanceof HTMLFormElement) {
          e.target.reset();
        }
        setActiveSection("explore");
      } else {
        setUploadResult(data.error || "Upload failed. Please try again.");
      }
    } catch (err) {
      setUploadResult(`Upload error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsUploading(false); // Stop uploading indicator
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    // Client-side limit (50MB) - less than server's 100MB to demonstrate bypass
    const MAX_CLIENT_FILE_SIZE = 50 * 1024 * 1024; 

    // Client-side validation for file size.
    // This is for UX purposes and can be bypassed by an attacker.
    // The server-side limit in multer (100MB) is the actual enforcement point.
    if (selectedFile) {
      if (selectedFile.size > MAX_CLIENT_FILE_SIZE) {
        setUploadResult(`File "${selectedFile.name}" exceeds 50MB client-side limit. This can be bypassed.`);
        setFile(null);
        // Clear the file input value
        if (e.target) {
          e.target.value = "";
        }
        return;
      }
      setFile(selectedFile);
      setUploadResult(""); // Clear any previous error messages if a valid file is selected
    } else {
      setFile(null);
    }
  };

  function handlePlayVideo(video: Video) {
    setPlayingVideo(video);
    if (!video.is_public && video.password_protected) {
      setShowPasswordPrompt(true);
      setPasswordInput(""); // Clear previous password
    } else if (!video.is_public && !video.password_protected) {
      // This case should ideally be handled by backend sending 403 if not streamable
      // For now, we can prevent playback attempt or rely on backend.
      setUploadResult("This private video is not password protected and cannot be streamed directly.");
      setVideoStreamUrl(null);
    }
    else {
      setVideoStreamUrl(`/api/videos/stream/${video.filename}`);
    }
  }
  
  function handlePasswordSubmit() {
    if (!playingVideo) return;
    setVideoStreamUrl(`/api/videos/stream/${playingVideo.filename}?password=${encodeURIComponent(passwordInput)}`);
    setShowPasswordPrompt(false);
  }

  function handleClosePlayer() {
    setPlayingVideo(null);
    setVideoStreamUrl(null);
    setShowPasswordPrompt(false);
  }

  async function handleShare(video: Video) {
    try {
      const res = await fetch(`/api/videos/share/${video.id}`, { method: 'POST' });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `HTTP error ${res.status}` }));
        throw new Error(errorData.error || `Failed to get share link: ${res.statusText}`);
      }
      const data = await res.json();
      setShareableLink(window.location.origin + data.shareLink);
      setShowShareModal(true);
    } catch (error) {
      setUploadResult(error instanceof Error ? error.message : "Could not fetch share link.");
    }
  }

  function openPrivacyModal(video: Video) {
    setCurrentVideoPrivacy(video);
    setPrivacyModalIsPublic(video.is_public);
    setPrivacyModalPassword("");
    setShowPrivacyModal(true);
  }

  async function handlePrivacySettingsUpdate() {
    if (!currentVideoPrivacy) return;
    try {
      const res = await fetch(`/api/videos/privacy/${currentVideoPrivacy.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: privacyModalIsPublic, password: privacyModalPassword }),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `HTTP error ${res.status}` }));
        throw new Error(errorData.error || `Failed to update privacy: ${res.statusText}`);
      }
      const updatedVideo = await res.json();
      setUploadResult(updatedVideo.message || "Privacy updated successfully.");
      setShowPrivacyModal(false);
      fetchVideos();
    } catch (error) {
      setUploadResult(error instanceof Error ? error.message : "Could not update privacy settings.");
    }
  }

  const navLinkClass = (section: string) => {
    return activeSection === section ? `${styles.activeNavLink}` : "";
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2 className={styles.sidebarHeader}>VimeoLite</h2>
        <nav className={styles.sidebarNav}>
          <ul className="nav-list">
            <li><a href="#upload" className={navLinkClass("upload")} onClick={() => setActiveSection("upload")}>Upload Video</a></li>
            <li><a href="#explore" className={navLinkClass("explore")} onClick={() => setActiveSection("explore")}>Explore Videos</a></li>
            {/* Add other nav links here if needed, e.g., My Videos, Settings */}
          </ul>
        </nav>
      </aside>

      <main className={`main-content ${styles.mainContent}`}>
        {uploadResult && (
          <div className={`${styles.dashboardAlert} ${
            uploadResult.toLowerCase().includes("fail") || uploadResult.toLowerCase().includes("error") 
            ? styles.alertError 
            : styles.alertSuccess
          }`}>
            <p>{uploadResult}</p>
          </div>
        )}

        <section id="upload" className={`card ${styles.uploadSection}`}>
          <h3 className="card-title">Upload a New Video</h3>
          <form onSubmit={handleUpload} className={styles.uploadForm}>
            <div className="form-group">
              <label htmlFor="videoTitle">Title <span className="text-danger">*</span></label>
              <input id="videoTitle" type="text" placeholder="Enter video title" value={title} onChange={e => setTitle(e.target.value)} required className={`input-field ${styles.inputField}`} />
            </div>
            <div className="form-group">
              <label htmlFor="videoDescription">Description</label>
              <textarea id="videoDescription" placeholder="Enter video description" value={description} onChange={e => setDescription(e.target.value)} className={`input-field ${styles.inputField}`} />
            </div>
            <div className="form-group">
              <label htmlFor="videoFile">Video File <span className="text-danger">*</span></label>
              <input 
                id="videoFile" 
                type="file" 
                accept="video/mp4,video/quicktime,.mov,.avi,.mkv" 
                onChange={handleFileChange} 
                required 
                className={`input-field ${styles.inputField}`} 
              />
            </div>
            
            <div className={`form-group ${styles.uploadFormActions}`}>
              <label className={`checkbox-label ${styles.checkboxLabel}`}>
                <input type="checkbox" checked={isPublicUpload} onChange={e => setIsPublicUpload(e.target.checked)} /> Public
              </label>
              {!isPublicUpload && (
                <div className="form-group" style={{flexGrow: 1}}>
                  <input type="password" placeholder="Set Password (optional)" value={passwordUpload} onChange={e => setPasswordUpload(e.target.value)} className={`input-field mb-0 ${styles.inputField}`} />
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-primary" style={{alignSelf: "flex-start"}} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload Video"}
            </button>
            {isUploading && <p className={styles.uploadingIndicator}>Please wait, your video is being uploaded.</p>}
          </form>
        </section>
        
        <section id="explore" className={`card ${styles.exploreSection}`}>
          <h3 className="card-title">Explore Videos</h3>
          <div className={styles.videoGrid}>
            {videos.length === 0 && !uploadResult && <p>No videos found. Try uploading some!</p>}
            {videos.length === 0 && uploadResult.toLowerCase().includes("fail") && <p>Could not fetch videos. Please check the connection or try again later.</p>}
            {videos.map((video) => (
              <div key={video.id} className={styles.videoCard}>
                <div className={styles.videoThumbnail}>
                  <span role="img" aria-label="video play icon">▶️</span>
                </div>
                <h4 className={styles.videoTitle} title={video.title || video.filename}>{video.title || video.filename}</h4>
                <p className={styles.videoPrivacyStatus}>
                  {video.is_public ? "Public" : (video.password_protected ? "Private (Password)" : "Private (No Password)")}
                </p>
                <div className={styles.videoActions}>
                  <button onClick={() => handlePlayVideo(video)} className="btn btn-primary">View</button>
                  <button onClick={() => handleShare(video)} className="btn btn-secondary">Share</button>
                  <button onClick={() => openPrivacyModal(video)} className="btn btn-accent">Privacy</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {videoStreamUrl && playingVideo && (
          <div className="modal-overlay">
            <div className={`modal-content ${styles.playerModalContent}`}>
              <h4>{playingVideo.title}</h4>
              <p>{playingVideo.description || "No description available."}</p>
              <video
                key={videoStreamUrl} // Important to re-mount video element on URL change
                src={videoStreamUrl}
                controls
                autoPlay
                onError={(e) => {
                  console.error("Video error:", e, "URL:", videoStreamUrl);
                  const videoElement = e.target as HTMLVideoElement;
                  let errorMsg = `Error playing video. Code: ${videoElement.error?.code}`;
                  if (videoElement.error?.message) {
                    errorMsg += ` Message: ${videoElement.error.message}`;
                  }
                  setUploadResult(`${errorMsg}. It might be private, password-protected, or the file is missing/corrupted.`);
                  setVideoStreamUrl(null); // Stop trying to play
                }}
              />
              <div className="modal-actions" style={{marginTop: 'var(--space-md)'}}>
                <button onClick={handleClosePlayer} className="btn btn-primary">Close Player</button>
              </div>
            </div>
          </div>
        )}

        {showPasswordPrompt && playingVideo && (
          <div className="modal-overlay">
            <div className={`modal-content ${styles.formModalContent}`}>
              <h4>Enter Password for "{playingVideo.title}"</h4>
              <div className="form-group">
                <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className={`input-field ${styles.inputField}`} placeholder="Password" autoFocus/>
              </div>
              <div className="modal-actions">
                <button onClick={() => { setShowPasswordPrompt(false); setPlayingVideo(null); }} className="btn btn-secondary">Cancel</button>
                <button onClick={handlePasswordSubmit} className="btn btn-primary">Play</button>
              </div>
            </div>
          </div>
        )}

        {showShareModal && (
          <div className="modal-overlay">
            <div className={`modal-content ${styles.formModalContent}`}>
              <h4>Share Video</h4>
              <p>Share this link:</p>
              <input type="text" readOnly value={shareableLink} className={`${styles.shareLinkInput} ${styles.inputField}`} onClick={(e) => (e.target as HTMLInputElement).select()} />
              <div className="modal-actions">
                <button onClick={() => setShowShareModal(false)} className="btn btn-primary">Close</button>
              </div>
            </div>
          </div>
        )}

        {showPrivacyModal && currentVideoPrivacy && (
          <div className="modal-overlay">
            <div className={`modal-content ${styles.formModalContent}`}>
              <h4>Privacy Settings for "{currentVideoPrivacy.title}"</h4>
              <div className="form-group">
                <label className={`checkbox-label ${styles.checkboxLabel}`}>
                  <input type="checkbox" checked={privacyModalIsPublic} onChange={e => setPrivacyModalIsPublic(e.target.checked)} /> Public Video
                </label>
              </div>
              {!privacyModalIsPublic && (
                <div className="form-group">
                  <label htmlFor="privacyModalPasswordInput">Set/Change Password (optional):</label>
                  <input
                    id="privacyModalPasswordInput"
                    type="password"
                    placeholder="Leave blank to remove password"
                    value={privacyModalPassword}
                    onChange={e => setPrivacyModalPassword(e.target.value)}
                    className={`input-field ${styles.inputField}`}
                  />
                </div>
              )}
              <div className="modal-actions">
                <button onClick={() => setShowPrivacyModal(false)} className="btn btn-secondary">Cancel</button>
                <button onClick={handlePrivacySettingsUpdate} className="btn btn-primary">Save Settings</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
