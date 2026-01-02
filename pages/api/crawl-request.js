import { harperdbQuery, safeSqlValue } from "../../lib/harperdb";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { fullName, location, app, imageData } = req.body || {};
  if (!fullName?.trim()) {
    res.status(400).json({ error: "Missing full name" });
    return;
  }

  if (!process.env.HARPERDB_URL) {
    res.status(500).json({ error: "HarperDB not configured" });
    return;
  }

  const schema = process.env.HARPERDB_SCHEMA || "cheatercheck";

  try {
    // Generate job ID
    const jobId = `job_${crypto.randomBytes(8).toString("hex")}`;
    const now = Math.floor(Date.now() / 1000);

    // Create search query object
    const searchQuery = {
      fullName: fullName.trim(),
      location: (location || "").trim(),
      app: (app || "tinder").trim(),
      imageData: imageData ? imageData.substring(0, 100) + "..." : null, // Store truncated for reference
    };

    // Create crawl job
    const job = {
      id: jobId,
      search_query: searchQuery,
      status: "pending",
      progress: 0,
      current_step: "Queued",
      profiles_found: 0,
      signals_generated: 0,
      created_at: now,
      created_by: req.headers["x-session-id"] || "anonymous",
      assigned_to: null,
      priority: 1,
      retry_count: 0,
      last_updated: now,
      error_message: null,
    };

    const insertResult = await harperdbQuery({
      operation: "insert",
      schema: schema,
      table: "crawl_jobs",
      records: [job],
    });

    res.status(200).json({
      job_id: jobId,
      status: "pending",
      message: "Crawl job created successfully",
      estimated_time: 60, // seconds
    });
  } catch (error) {
    console.error("Crawl request error:", error);
    res.status(500).json({ error: error.message || "Failed to create crawl job" });
  }
}

