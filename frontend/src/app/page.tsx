import Link from "next/link";
import styles from "./Home.module.css"; // Import CSS module

export default function Home() {
  return (
    <div className={styles.pageContainer}>
      <main className={styles.heroSection}>
        <h1 className={styles.title}>VimeoLite: Share Your Moments</h1>
        <p className={styles.tagline}>
          Discover, upload, and share videos with the world... or keep them just for yourself.
          This platform is an educational tool to explore web application concepts.
        </p>
        <div className={styles.ctaContainer}>
          <Link href="/signup" className={`btn btn-primary ${styles.ctaButton}`}>
            Get Started - Sign Up
          </Link>
          <Link href="/login" className={`btn btn-secondary ${styles.ctaButton}`}>
            Already a User? Log In
          </Link>
        </div>
        <p className={styles.warningText}>
          <strong>Warning:</strong> This site is intentionally vulnerable for educational purposes. 
          Please do not use real credentials or upload sensitive information.
        </p>
      </main>
      <footer className={styles.footerText}>
        <p>&copy; {new Date().getFullYear()} VimeoLite Educational Project. All rights reserved (not really).</p>
        <p>
          Remember to explore responsibly and learn about web security!
        </p>
      </footer>
    </div>
  );
}
