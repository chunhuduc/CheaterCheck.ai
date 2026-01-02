import { harperdbQuery, safeSqlValue } from "../../lib/harperdb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { job_id } = req.query || {};
  if (!job_id) {
    res.status(400).json({ error: "Missing job_id parameter" });
    return;
  }

  if (!process.env.HARPERDB_URL) {
    res.status(500).json({ error: "HarperDB not configured" });
    return;
  }

  const schema = process.env.HARPERDB_SCHEMA || "cheatercheck";

  try {
    const safeJobId = safeSqlValue(job_id);
    const sql = `SELECT * FROM ${schema}.crawl_jobs WHERE id = '${safeJobId}' LIMIT 1`;

    const response = await harperdbQuery({ operation: "sql", sql });
    const rows = Array.isArray(response) ? response : response?.data || [];

    if (rows.length === 0) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    const job = rows[0];

    res.status(200).json({
      job_id: job.id,
      status: job.status || "pending",
      progress: job.progress || 0,
      current_step: job.current_step || "Queued",
      profiles_found: job.profiles_found || 0,
      signals_generated: job.signals_generated || 0,
      created_at: job.created_at,
      last_updated: job.last_updated,
      assigned_to: job.assigned_to,
      error_message: job.error_message,
    });
  } catch (error) {
    console.error("Crawl status error:", error);
    res.status(500).json({ error: error.message || "Failed to get crawl status" });
  }
}

