import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Home.module.css";

export default function Layout({ children, title = "CheaterCheck.ai" }) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content="CheaterCheck.ai finds high-risk dating app signals in seconds."
        />
      </Head>
      <div className={styles.page}>
        <header className={styles.header}>
          <Link href="/" className={styles.logo}>
            CheaterCheck.ai
          </Link>
          <nav className={styles.nav}>
            <Link href="/search">Search</Link>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </nav>
          <Link href="/search" className={styles.ctaSmall}>
            Run a check
          </Link>
        </header>
        {children}
        <footer className={styles.footer}>
          <div>
            <strong>CheaterCheck.ai</strong>
            <p>Signals before surprises. Private, fast, and discreet.</p>
          </div>
          <div>
            <p>support@cheatercheck.ai</p>
            <p>Built on HarperDB + Next.js</p>
          </div>
        </footer>
      </div>
    </>
  );
}
