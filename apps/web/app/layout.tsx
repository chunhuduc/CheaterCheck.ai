import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CheaterCheck.ai",
  description:
    "Dating risk intelligence. Cross-reference face signals, names, and locations to surface potential risk.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="brand">
            CheaterCheck<span>.ai</span>
          </Link>
          <nav>
            <Link href="/#how">How it works</Link>
            <Link href="/#pricing">Pricing</Link>
            <Link href="/search" className="nav-cta">
              Run a check
            </Link>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <p>
            CheaterCheck.ai is a concept project. Uses public data and signals
            you provide. We never notify the person being searched.
          </p>
        </footer>
      </body>
    </html>
  );
}
