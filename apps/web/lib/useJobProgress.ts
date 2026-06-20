"use client";

import { useEffect, useRef, useState } from "react";
import * as Ably from "ably";
import {
  ABLY_JOB_CHANNEL,
  type JobProgress,
} from "@cheatercheck/types";
import { API_BASE, getJob } from "./api";

/**
 * Subscribes to crawl progress for a job. Prefers Ably realtime (token auth via
 * the API). Falls back to polling GET /jobs/:id if Ably isn't configured.
 */
export function useJobProgress(jobId: string | null) {
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const clientRef = useRef<Ably.Realtime | null>(null);

  useEffect(() => {
    if (!jobId) {
      setProgress(null);
      return;
    }

    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      const poll = async () => {
        try {
          const p = await getJob(jobId);
          if (!cancelled) setProgress(p);
          if (p.status === "completed" || p.status === "failed") {
            if (pollTimer) clearInterval(pollTimer);
          }
        } catch {
          /* keep trying */
        }
      };
      poll();
      pollTimer = setInterval(poll, 1500);
    };

    const startRealtime = async () => {
      try {
        const client = new Ably.Realtime({
          authUrl: `${API_BASE}/realtime/token`,
        });
        clientRef.current = client;
        const channel = client.channels.get(ABLY_JOB_CHANNEL(jobId));
        channel.subscribe("progress", (msg) => {
          if (!cancelled) setProgress(msg.data as JobProgress);
        });
        // Seed current state immediately in case we connected mid-job.
        getJob(jobId)
          .then((p) => !cancelled && setProgress(p))
          .catch(() => {});
      } catch {
        startPolling();
      }
    };

    // Probe whether realtime is available; the token endpoint 500s if Ably is unset.
    fetch(`${API_BASE}/realtime/token`)
      .then((r) => (r.ok ? startRealtime() : startPolling()))
      .catch(() => startPolling());

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
      clientRef.current?.close();
      clientRef.current = null;
    };
  }, [jobId]);

  return progress;
}
