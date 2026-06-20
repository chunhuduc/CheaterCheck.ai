"use client";

import type { LookupResponse } from "@cheatercheck/types";

/**
 * Renders a scan report. When `unlocked` is false the match status, score, and
 * confidence are blurred behind the paywall; profile fields stay visible.
 */
export function ReportView({ report }: { report: LookupResponse }) {
  const unlocked = report.unlocked;
  return (
    <section className={`results ${unlocked ? "" : "blurred"}`}>
      <div className="result-header">
        <div>
          <h2>Scan report</h2>
          <p>
            {unlocked
              ? report.found
                ? "Potential overlap detected"
                : "No matching signals detected"
              : "Report generated. Unlock to view match status."}
          </p>
        </div>
        <span className="score-badge gated">{unlocked ? report.score : "--"}</span>
      </div>

      <div className="summary-grid">
        <div>
          <span>Profile name</span>
          <strong>{report.profile.fullName || "-"}</strong>
        </div>
        <div>
          <span>Location</span>
          <strong>{report.profile.location || "-"}</strong>
        </div>
        <div>
          <span>App</span>
          <strong>{report.profile.app || "-"}</strong>
        </div>
        <div>
          <span>Confidence</span>
          <strong className="gated">
            {unlocked ? report.confidence : "Hidden"}
          </strong>
        </div>
      </div>

      <div className="cards gated">
        {report.matches.map((m) => (
          <div className="signal-card" key={m.label}>
            <h3>{m.label}</h3>
            <p>{m.detail}</p>
            <span>{m.status}</span>
          </div>
        ))}
      </div>

      <div className="block" style={{ marginTop: 24 }}>
        <h3>Next steps</h3>
        <ul>
          {report.nextSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
