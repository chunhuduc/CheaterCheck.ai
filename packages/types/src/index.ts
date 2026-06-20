/**
 * Shared contract between apps/web and apps/api.
 * Keep this the single source of truth for request/response shapes.
 */

export type DatingApp = "tinder" | "bumble" | "hinge" | "other";

export type SignalStatus =
  | "Review"
  | "Active"
  | "Monitor"
  | "Clear"
  | "Crawling";

export type Confidence = "Low" | "Medium" | "High" | "Hidden";

export type JobStatus = "pending" | "running" | "completed" | "failed";

/** POST /lookup request body. */
export interface LookupRequest {
  fullName: string;
  location?: string;
  app: DatingApp;
  /** data: URL of the uploaded face photo. */
  imageData: string;
}

export interface SignalCard {
  label: string;
  detail: string;
  status: SignalStatus;
}

/** POST /lookup response. The report is created server-side; `reportId` keys the unlock. */
export interface LookupResponse {
  reportId: string;
  found: boolean;
  /** Present when no signals were found and a crawl job was enqueued. */
  jobId: string | null;
  confidence: Confidence;
  score: number;
  unlocked: boolean;
  profile: {
    fullName: string;
    location: string;
    app: DatingApp;
  };
  matches: SignalCard[];
  nextSteps: string[];
}

/** Realtime crawl progress, published to Ably channel `job:{jobId}` and readable via GET /jobs/:id. */
export interface JobProgress {
  jobId: string;
  status: JobStatus;
  progress: number;
  currentStep: string;
  profilesFound: number;
  signalsGenerated: number;
  errorMessage: string | null;
}

/** POST /payments/checkout request: unlock one report. */
export interface CheckoutRequest {
  reportId: string;
  email?: string;
}

export interface CheckoutResponse {
  /** Stripe Checkout redirect URL. */
  url: string;
}

/** GET /reports/:id response (full report once unlocked). */
export interface ReportResponse extends LookupResponse {}

export const ABLY_JOB_CHANNEL = (jobId: string) => `job:${jobId}`;
