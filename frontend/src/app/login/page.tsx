"use client";
import { useState, FormEvent } from "react"; // Import FormEvent
import { useRouter, useSearchParams } from "next/navigation"; // Import useSearchParams
import Link from "next/link";
import styles from "../auth/Auth.module.css"; // Use shared Auth module styles

const API_URL = "http://localhost:3001/api/auth/login";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams(); // For reading query params like error

  // Display error from query params if present (e.g., from failed OAuth)
  useState(() => {
    const error = searchParams.get("error");
    if (error) {
      setResult(error);
    }
  });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) { // Type the event
    e.preventDefault();
    setResult("");
    setLoading(true);
    let data: any = {}; // Initialize data
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
      setResult("Login failed: Could not connect to the server.");
      return;
    }
    setLoading(false);
    if (res.ok && data.user) { // Check for data.user for successful login
      setResult("Login successful! Redirecting to dashboard...");
      // Store token and user info if needed (e.g., in localStorage or context)
      // For now, just redirect
      setTimeout(() => router.push("/dashboard"), 1200);
    } else {
      setResult(data.error || "Login failed. Please check your credentials.");
    }
  }

  return (
    <div className={styles.authPageContainer}>
      <div className={styles.authFormContainer}>
        <h1 className={styles.authTitle}>Log In to VimeoLite</h1>
        
        {result && !result.includes("successful") && (
          <p className={styles.errorMessage}>{result}</p>
        )}
        {result && result.includes("successful") && (
          <p className="alert-message success mb-2">{result}</p>
        )}

        <form onSubmit={handleSubmit} className={styles.authForm}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text" // Changed from placeholder only to actual type
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              placeholder="Enter your password"
              type="password" // Changed from text to password
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <button type="submit" className={`btn btn-primary ${styles.authSubmitButton}`} disabled={loading}>
            {loading ? "Logging In..." : "Log In"}
          </button>
        </form>
        <p className={styles.authLink}>
          Don&apos;t have an account? <Link href="/signup">Sign Up</Link>
        </p>
        {/* Basic OAuth options could be added here */}
        {/* <p className={styles.authLink} style={{marginTop: 'var(--space-lg)'}}>Or log in with:</p>
        <div className="d-flex gap-2 justify-content-center">
          <a href="/api/auth/google" className="btn btn-secondary">Google</a>
          <a href="/api/auth/github" className="btn btn-secondary">GitHub</a>
        </div> */}
      </div>
    </div>
  );
}
