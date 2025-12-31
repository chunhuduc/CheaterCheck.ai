const fs = require('fs');
const path = require('path');
const { request: httpRequest } = require('http');
const { request: httpsRequest } = require('https');

function loadDotEnv(filePath) {
  try {
    const src = fs.readFileSync(filePath, 'utf8');
    const lines = src.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      let val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch (err) {
    // no-op
  }
}

// Load .env.local if present to help local dev
loadDotEnv(path.resolve(__dirname, '..', '.env.local'));

const HARPERDB_URL = process.env.HARPERDB_URL || 'http://localhost:9925';
const USERNAME = process.env.HARPERDB_USERNAME;
const PASSWORD = process.env.HARPERDB_PASSWORD;
const seedPath = path.resolve(__dirname, '..', 'harperdb', 'seed.json');

if (!USERNAME || !PASSWORD) {
  console.error('HARPERDB_USERNAME or HARPERDB_PASSWORD not set. Set them in environment or .env.local');
  process.exit(1);
}

if (!fs.existsSync(seedPath)) {
  console.error(`Seed file not found: ${seedPath}`);
  process.exit(1);
}

const payload = fs.readFileSync(seedPath, 'utf8');
let parsedSeed;
try {
  // Strip UTF-8 BOM if present and trim whitespace
  const cleaned = payload.replace(/^\uFEFF/, '').trim();
  // Remove simple line/block comments if any (seed.json shouldn't have them, but be tolerant)
  const withoutComments = cleaned.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '').trim();
  parsedSeed = JSON.parse(withoutComments);
} catch (err) {
  console.error('Failed to parse seed.json. First 400 chars:');
  console.error(payload.slice(0, 400));
  console.error('Parse error:', err.message);
  process.exit(1);
}

const targetSchema = parsedSeed.schema || process.env.HARPERDB_SCHEMA || 'cheatercheck';
const targetTable = parsedSeed.table || process.env.HARPERDB_TABLE || 'signals';

function post(url, body, headers) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const opts = {
        method: 'POST',
        hostname: u.hostname,
        path: u.pathname || '/',
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
        headers: headers,
      };

      const req = (u.protocol === 'https:' ? httpsRequest : httpRequest)(opts, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const txt = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, body: txt });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${txt}`));
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.write(body);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

async function createOperation(bodyObj, headers, description) {
  try {
    const res = await post(HARPERDB_URL, JSON.stringify(bodyObj), headers);
    console.log(`${description} succeeded:`, res.status);
    return true;
  } catch (err) {
    const msg = String(err.message || '');
    // If already exists or conflict, ignore and continue
    if (
      msg.toLowerCase().includes('already exists') ||
      msg.toLowerCase().includes('exists') ||
      msg.toLowerCase().includes('conflict') ||
      msg.toLowerCase().includes('already_exists')
    ) {
      console.log(`${description} likely exists, continuing.`);
      return true;
    }
    console.error(`${description} failed:`, msg);
    return false;
  }
}

(async () => {
  console.log(`Ensuring schema/table and seeding HarperDB at ${HARPERDB_URL} using ${seedPath}`);

  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Basic ${auth}`,
  };

  // Create schema using HarperDB operation
  const okSchema = await createOperation({ operation: 'create_schema', schema: targetSchema }, headers, `Create schema ${targetSchema}`);
  if (!okSchema) process.exit(1);

  // Create table using HarperDB operation (set id as hash attribute)
  const okTable = await createOperation({ operation: 'create_table', schema: targetSchema, table: targetTable, hash_attribute: 'id' }, headers, `Create table ${targetSchema}.${targetTable}`);
  if (!okTable) process.exit(1);

  // Now insert seed payload
  try {
    const res = await post(HARPERDB_URL, payload, headers);
    console.log('Seed successful:', res.status);
    try {
      const json = JSON.parse(res.body);
      console.log(JSON.stringify(json, null, 2));
    } catch (_) {
      console.log(res.body);
    }
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
})();
