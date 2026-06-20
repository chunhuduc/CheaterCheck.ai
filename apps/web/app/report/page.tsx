"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { LookupResponse } from "@cheatercheck/types";
import { getReport, startCheckout } from "../../lib/api";
import { ReportView } from "../ReportView";

function ReportInner() {
  const params = useSearchParams();
  const id = params.get("id");
  const canceled = params.get("canceled");

  const [report, setReport] = useState<LookupResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("No report id provided.");
      return;
    }
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    // After Stripe redirect the webhook may land a beat later; poll briefly
    // until the report flips to unlocked.
    const load = async () => {
      try {
        const r = await getReport(id);
        setReport(r);
        if (!r.unlocked && tries < 5) {
          tries += 1;
          timer = setTimeout(load, 1500);
        }
      } catch (err) {
        setError((err as Error).message);
      }
    };
    load();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  const onUnlock = async () => {
    if (!report) return;
    try {
      const { url } = await startCheckout(report.reportId);
      window.location.href = url;
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!report) return <p>Loading report...</p>;

  return (
    <>
      {canceled && !report.unlocked && (
        <p className="error">Payment canceled. You can try again below.</p>
      )}
      <ReportView report={report} />
      {!report.unlocked && (
        <div className="unlock-row">
          <button className="btn-primary" onClick={onUnlock}>
            Unlock report ($18)
          </button>
        </div>
      )}
    </>
  );
}

export default function ReportPage() {
  return (
    <main>
      <h1>Your report</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <ReportInner />
      </Suspense>
    </main>
  );
}
