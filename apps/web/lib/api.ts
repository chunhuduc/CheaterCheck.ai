import type {
  LookupRequest,
  LookupResponse,
  CheckoutResponse,
  JobProgress,
} from "@cheatercheck/types";

const BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function json<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (data as { message?: string | string[] }).message ?? res.statusText;
    throw new Error(Array.isArray(message) ? message[0] : message);
  }
  return data as T;
}

export async function runLookup(
  body: LookupRequest,
): Promise<LookupResponse> {
  const res = await fetch(`${BASE}/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return json<LookupResponse>(res);
}

export async function getReport(id: string): Promise<LookupResponse> {
  const res = await fetch(`${BASE}/reports/${id}`, { cache: "no-store" });
  return json<LookupResponse>(res);
}

export async function getJob(id: string): Promise<JobProgress> {
  const res = await fetch(`${BASE}/jobs/${id}`, { cache: "no-store" });
  return json<JobProgress>(res);
}

export async function startCheckout(
  reportId: string,
  email?: string,
): Promise<CheckoutResponse> {
  const res = await fetch(`${BASE}/payments/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reportId, email }),
  });
  return json<CheckoutResponse>(res);
}

export { BASE as API_BASE };
