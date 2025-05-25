"use client";
import { useState, FormEvent } from "react"; // Import FormEvent
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "../auth/Auth.module.css"; // Use shared Auth module styles

const API_URL = "http://localhost:3001/api/auth/register";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) { // Type the event
    e.preventDefault();
    setResult(""); // Clear previous results
    setLoading(true);
    let data: any = {}; // Initialize data
    let res: Response;
    try {
      res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      data = await res.json();
    } catch (err) {
      setLoading(false);
      setResult("Signup failed: Could not connect to the server.");
      return;
    }
    setLoading(false);
    if (res.ok && data.id) { // Check for data.id for successful registration
      setResult("Signup successful! Redirecting to dashboard...");
      // Potentially auto-login or redirect to login page with a success message
      // For now, redirect to dashboard (assuming backend auto-logs in or session is created)
      setTimeout(() => router.push("/dashboard"), 1200);
    } else {
      setResult(data.error || "Signup failed. Please try again.");
    }
  }

  return (
    <div className={styles.authPageContainer}>
      <div className={styles.authFormContainer}>
        <h1 className={styles.authTitle}>Create Your VimeoLite Account</h1>

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
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              placeholder="Create a password"
              type="password" // Changed from text to password
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <button type="submit" className={`btn btn-primary ${styles.authSubmitButton}`} disabled={loading}>
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>
        <p className={styles.authLink}>
          Already have an account? <Link href="/login">Log In</Link>
        </p>
      </div>
    </div>
  );
}
