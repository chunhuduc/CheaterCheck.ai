import { harperdbQuery, safeSqlValue } from "../../lib/harperdb";

function demoResponse({ fullName, location, app }) {
  const seed = `${fullName}${location}${app}`.length;
  const found = seed % 2 === 1;
  return {
    demo: true,
    found,
    confidence: found ? "Medium" : "Low",
    score: found ? 48 : 12,
    profile: { fullName, location, app },
    matches: found
      ? [
          {
            label: "Photo overlap",
            detail: "Similar photo cluster appears in multiple profiles.",
            status: "Review"
          },
          {
            label: "Recent activity",
            detail: "Activity signal within the last 10 days.",
            status: "Active"
          },
          {
            label: "Alias pattern",
            detail: "Handle variant detected in another city.",
            status: "Monitor"
          }
        ]
      : [
          {
            label: "No signals found",
            detail: "No matching records in the current dataset.",
            status: "Clear"
          }
        ],
    nextSteps: found
      ? [
          "Verify with a second photo or handle.",
          "Review chat safety guidance before meeting.",
          "Save this report for your records."
        ]
      : [
          "Try another photo or spelling variation.",
          "Use the safety checklist before meeting."
        ]
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { fullName, location, app, imageData } = req.body || {};
  if (!imageData) {
    res.status(400).json({ error: "Missing image data" });
    return;
  }
  if (!fullName?.trim()) {
    res.status(400).json({ error: "Missing full name" });
    return;
  }

  if (!process.env.HARPERDB_URL) {
    res.status(200).json(demoResponse({ fullName, location, app }));
    return;
  }

  const schema = process.env.HARPERDB_SCHEMA || "cheatercheck";
  const table = process.env.HARPERDB_TABLE || "signals";

  try {
    const safeName = safeSqlValue(fullName.trim());
    const safeLocation = safeSqlValue((location || "").trim());
    const safeApp = safeSqlValue((app || "").trim());

    let sql = `SELECT * FROM ${schema}.${table} WHERE full_name = '${safeName}'`;
    if (safeLocation) {
      sql += ` AND location = '${safeLocation}'`;
    }
    if (safeApp) {
      sql += ` AND app = '${safeApp}'`;
    }
    sql += " LIMIT 5";

    const response = await harperdbQuery({ operation: "sql", sql });
    const rows = Array.isArray(response) ? response : response?.data || [];
    const found = rows.length > 0;
    const top = rows[0] || {};

    res.status(200).json({
      demo: false,
      found,
      confidence: top.confidence || (found ? "High" : "Low"),
      score: Number.isFinite(top.score)
        ? top.score
        : found
          ? Math.min(80, 30 + rows.length * 10)
          : 12,
      profile: {
        fullName,
        location,
        app
      },
      matches: found
        ? rows.map((row) => ({
            label: row.signal_type || "Signal",
            detail: row.detail || row.description || "Signal detected.",
            status: row.status || "Review"
          }))
        : [
            {
              label: "No signals found",
              detail: "No matching records in the current dataset.",
              status: "Clear"
            }
          ],
      nextSteps: found
        ? [
            "Verify with a second photo or handle.",
            "Use the safety checklist before meeting."
          ]
        : [
            "Try another photo or spelling variation.",
            "Use the safety checklist before meeting."
          ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message || "Lookup failed" });
  }
}
