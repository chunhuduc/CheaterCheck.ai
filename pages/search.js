import { useState, useEffect, useRef } from "react";
import Layout from "../components/Layout";
import styles from "../styles/Search.module.css";

const DEFAULT_APP = "tinder";
const POLL_INTERVAL = 2000; // 2 seconds

export default function Search() {
  const [form, setForm] = useState({
    fullName: "",
    location: "",
    app: DEFAULT_APP,
    imagePreview: "",
    imageData: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [paid, setPaid] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [crawlProgress, setCrawlProgress] = useState(null);
  const pollIntervalRef = useRef(null);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setForm((prev) => ({ ...prev, imagePreview: "", imageData: "" }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const preview = typeof reader.result === "string" ? reader.result : "";
      setForm((prev) => ({
        ...prev,
        imagePreview: preview,
        imageData: preview
      }));
    };
    reader.readAsDataURL(file);
  };

  const pollCrawlStatus = async (jobId) => {
    try {
      const response = await fetch(`/api/crawl-status?job_id=${jobId}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to get crawl status");
      }
      
      setCrawlProgress(data);
      
      // If completed, refresh lookup results
      if (data.status === "completed") {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        
        // Refresh lookup
        const lookupResponse = await fetch("/api/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: form.fullName,
            location: form.location,
            app: form.app,
            imageData: form.imageData
          })
        });
        const lookupData = await lookupResponse.json();
        if (lookupResponse.ok) {
          setResult(lookupData);
          setCrawlProgress(null);
        }
      } else if (data.status === "failed") {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
        setError(data.error_message || "Crawl job failed");
        setCrawlProgress(null);
      }
    } catch (err) {
      console.error("Poll error:", err);
      // Continue polling on error
    }
  };

  useEffect(() => {
    // Cleanup polling on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setResult(null);
    setCrawlProgress(null);
    
    // Clear any existing polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (!form.imageData) {
      setError("Upload a clear face photo to run the scan.");
      return;
    }

    if (!form.fullName.trim()) {
      setError("Enter a name to search.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          location: form.location,
          app: form.app,
          imageData: form.imageData
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Lookup failed");
      }
      setResult(data);
      setPaid(false);
      
      // If job_id exists, start polling for progress
      if (data.job_id) {
        setCrawlProgress({
          status: "pending",
          progress: 0,
          current_step: "Queued"
        });
        
        // Start polling
        pollIntervalRef.current = setInterval(() => {
          pollCrawlStatus(data.job_id);
        }, POLL_INTERVAL);
        
        // Initial poll
        pollCrawlStatus(data.job_id);
      } else {
        setShowPaywall(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = () => {
    setPaid(true);
    setShowPaywall(false);
  };

  const handleDismiss = () => {
    setShowPaywall(false);
  };

  const hasResult = Boolean(result);
  const blurred = hasResult && !paid;

  return (
    <Layout title="CheaterCheck.ai | Search">
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroHeader}>
            <h1>Upload a photo to run a private scan</h1>
            <p>
              CheaterCheck.ai matches face signals, name, and location against
              HarperDB in seconds. Results stay private until you unlock them.
            </p>
          </div>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.uploadGrid}>
              <div className={styles.uploadCard}>
                <label className={styles.uploadArea}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {form.imagePreview ? (
                    <img
                      src={form.imagePreview}
                      alt="Uploaded preview"
                      className={styles.previewImage}
                    />
                  ) : (
                    <div className={styles.previewPlaceholder}>
                      <strong>Upload face photo</strong>
                      <span>Front-facing, well-lit, no filters.</span>
                    </div>
                  )}
                </label>
                <div className={styles.uploadNote}>
                  Photos are encrypted in transit and not stored without
                  purchase.
                </div>
              </div>
              <div className={styles.detailsCard}>
                <div className={styles.field}>
                  <label htmlFor="fullName">Name on profile</label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Alex Carter"
                    value={form.fullName}
                    onChange={handleChange("fullName")}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="location">Location</label>
                  <input
                    id="location"
                    type="text"
                    placeholder="Ho Chi Minh City"
                    value={form.location}
                    onChange={handleChange("location")}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="app">Dating app</label>
                  <select
                    id="app"
                    value={form.app}
                    onChange={handleChange("app")}
                  >
                    <option value="tinder">Tinder</option>
                    <option value="bumble">Bumble</option>
                    <option value="hinge">Hinge</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <button type="submit" className={styles.primaryButton} disabled={loading}>
                  {loading ? "Scanning..." : "Run scan"}
                </button>
                <p className={styles.disclaimer}>
                  We do not notify the person being searched.
                </p>
                {error && <p className={styles.error}>{error}</p>}
              </div>
            </div>
          </form>
        </section>

        {crawlProgress && (
          <section className={styles.crawlProgress}>
            <div className={styles.progressHeader}>
              <h3>Crawling in progress...</h3>
              <p>{crawlProgress.current_step || "Processing"}</p>
            </div>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill}
                style={{ width: `${crawlProgress.progress || 0}%` }}
              />
            </div>
            <div className={styles.progressStats}>
              <span>Progress: {crawlProgress.progress || 0}%</span>
              {crawlProgress.profiles_found !== undefined && (
                <span>Profiles: {crawlProgress.profiles_found}</span>
              )}
              {crawlProgress.signals_generated !== undefined && (
                <span>Signals: {crawlProgress.signals_generated}</span>
              )}
            </div>
          </section>
        )}

        {hasResult && (
          <section
            className={`${styles.results} ${blurred ? styles.blurred : ""}`}
            aria-hidden={blurred}
          >
            <div className={styles.resultHeader}>
              <div>
                <h2>Scan report</h2>
                <p>
                  {paid
                    ? result.found
                      ? "Potential overlap detected"
                      : "No matching signals detected"
                    : "Report generated. Unlock to view match status."}
                </p>
              </div>
              <span className={styles.score}>
                {paid ? result.score : "--"}
              </span>
            </div>
            <div className={styles.summaryGrid}>
              <div>
                <span>Profile name</span>
                <strong>{result.profile?.fullName || "-"}</strong>
              </div>
              <div>
                <span>Location</span>
                <strong>{result.profile?.location || "-"}</strong>
              </div>
              <div>
                <span>App</span>
                <strong>{result.profile?.app || "-"}</strong>
              </div>
              <div>
                <span>Confidence</span>
                <strong>{paid ? result.confidence : "Hidden"}</strong>
              </div>
            </div>
            <div className={styles.cards}>
              {result.matches.map((match) => (
                <div className={styles.card} key={match.label}>
                  <h3>{match.label}</h3>
                  <p>{match.detail}</p>
                  <span>{match.status}</span>
                </div>
              ))}
            </div>
            <div className={styles.nextSteps}>
              <h3>Next steps</h3>
              <ul>
                {result.nextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {hasResult && !paid && (
          <div className={styles.unlockRow}>
            <button className={styles.primaryButton} onClick={() => setShowPaywall(true)}>
              Unlock report
            </button>
            <button className={styles.secondaryButton} onClick={handleDismiss}>
              Maybe later
            </button>
          </div>
        )}

        {showPaywall && !paid && (
          <div className={styles.paywall} role="dialog" aria-modal="true">
            <div className={styles.paywallCard}>
              <h3>Unlock the full report</h3>
              <p>
                Your scan is ready. Unlock to see whether a match exists and
                view the confidence score.
              </p>
              <div className={styles.priceTag}>
                <span>One-time payment</span>
                <strong>$18</strong>
              </div>
              <button className={styles.primaryButton} onClick={handleUnlock}>
                Pay $18 and view results
              </button>
              <button className={styles.secondaryButton} onClick={handleDismiss}>
                Close
              </button>
              <p className={styles.disclaimer}>
                Demo only. Hook up Stripe or another provider here.
              </p>
            </div>
          </div>
        )}
      </main>
    </Layout>
  );
}
