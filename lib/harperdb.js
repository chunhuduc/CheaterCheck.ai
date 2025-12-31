const baseUrl = process.env.HARPERDB_URL;
const username = process.env.HARPERDB_USERNAME;
const password = process.env.HARPERDB_PASSWORD;

export function safeSqlValue(value) {
  return String(value).replace(/'/g, "''");
}

export async function harperdbQuery(body) {
  if (!baseUrl || !username || !password) {
    throw new Error("HarperDB credentials missing");
  }

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString(
        "base64"
      )}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "HarperDB request failed");
  }

  return response.json();
}
