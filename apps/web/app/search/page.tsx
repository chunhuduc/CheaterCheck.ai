"use client";

import { useEffect, useState } from "react";
import type { DatingApp, LookupResponse } from "@cheatercheck/types";
import { runLookup, getReport, startCheckout } from "../../lib/api";
import { useJobProgress } from "../../lib/useJobProgress";
import { ReportView } from "../ReportView";

const APPS: DatingApp[] = ["tinder", "bumble", "hinge", "other"];

export default function SearchPage() {
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [app, setApp] = useState<DatingApp>("tinder");
  const [imageData, setImageData] = useState("");
  const [preview, setPreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<LookupResponse | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);

  const jobId = report?.jobId ?? null;
  const progress = useJobProgress(jobId);

  // When the crawl completes, re-fetch the report to pick up new signals.
  useEffect(() => {
    if (progress?.status === "completed" && report) {
      getReport(report.reportId).then(setReport).catch(() => {});
    }
    if (progress?.status === "failed") {
      setError(progress.errorMessage ?? "Crawl failed.");
    }
  }, [progress?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = typeof reader.result === "string" ? reader.result : "";
      setImageData(data);
      setPreview(data);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setReport(null);
    setShowPaywall(false);

    if (!imageData) return setError("Upload a clear face photo to run the scan.");
    if (!fullName.trim()) return setError("Enter a name to search.");

    setLoading(true);
    try {
      const res = await runLookup({ fullName, location, app, imageData });
      setReport(res);
      if (!res.jobId) setShowPaywall(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const onUnlock = async () => {
    if (!report) return;
    try {
      const { url } = await startCheckout(report.reportId);
      window.location.href = url;
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <main>
      <section>
        <h1>Upload a photo to run a private scan</h1>
        <p className="lede">
          CheaterCheck.ai matches face signals, name, and location in seconds.
          Results stay private until you unlock them.
        </p>

        <form onSubmit={onSubmit}>
          <div className="upload-grid">
            <div>
              <label className="upload-area">
                <input type="file" accept="image/*" onChange={onFile} />
                {preview ? (
                  <img src={preview} alt="preview" />
                ) : (
                  <div>
                    <strong>Upload face photo</strong>
                    <div>Front-facing, well-lit, no filters.</div>
                  </div>
                )}
              </label>
              <p className="disclaimer">
                Photos are sent over HTTPS and not stored without purchase.
              </p>
            </div>

            <div>
              <div className="field">
                <label htmlFor="fullName">Name on profile</label>
                <input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Carter"
                />
              </div>
              <div className="field">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ho Chi Minh City"
                />
              </div>
              <div className="field">
                <label htmlFor="app">Dating app</label>
                <select
                  id="app"
                  value={app}
                  onChange={(e) => setApp(e.target.value as DatingApp)}
                >
                  {APPS.map((a) => (
                    <option key={a} value={a}>
                      {a[0].toUpperCase() + a.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Scanning..." : "Run scan"}
              </button>
              <p className="disclaimer">
                We do not notify the person being searched.
              </p>
              {error && <p className="error">{error}</p>}
            </div>
          </div>
        </form>
      </section>

      {progress && progress.status !== "completed" && (
        <section className="progress">
          <h3>Crawling in progress...</h3>
          <p>{progress.currentStep}</p>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <div className="progress-stats">
            <span>Progress: {progress.progress}%</span>
            <span>Profiles: {progress.profilesFound}</span>
            <span>Signals: {progress.signalsGenerated}</span>
          </div>
        </section>
      )}

      {report && <ReportView report={report} />}

      {report && !report.unlocked && !report.jobId && (
        <div className="unlock-row">
          <button className="btn-primary" onClick={() => setShowPaywall(true)}>
            Unlock report
          </button>
        </div>
      )}

      {showPaywall && report && !report.unlocked && (
        <div className="paywall" role="dialog" aria-modal="true">
          <div className="paywall-card">
            <h3>Unlock the full report</h3>
            <p>
              Your scan is ready. Unlock to see whether a match exists and view
              the confidence score.
            </p>
            <div className="price-tag">
              <span>One-time payment</span>
              <strong>$18</strong>
            </div>
            <button className="btn-primary" onClick={onUnlock}>
              Pay $18 with Stripe
            </button>
            <div style={{ marginTop: 10 }}>
              <button
                className="btn-secondary"
                onClick={() => setShowPaywall(false)}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
