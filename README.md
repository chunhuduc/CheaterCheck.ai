# CheaterCheck.ai

A HarperDB + Next.js website concept inspired by cheaterbuster-style dating risk checks.

## Setup

1. Install dependencies: `npm install`
2. Configure HarperDB credentials:

```
HARPERDB_URL=http://localhost:9925
HARPERDB_USERNAME=HDB_ADMIN
HARPERDB_PASSWORD=yourpassword
HARPERDB_SCHEMA=cheatercheck
HARPERDB_TABLE=signals
```

3. Start development: `npm run dev`

## HarperDB schema suggestion

`harperdb/schema.sql` contains a starter schema with a single `signals` table
optimized for name + location searches. Example:

```
CREATE SCHEMA cheatercheck;
CREATE TABLE cheatercheck.signals (
  id STRING PRIMARY KEY,
  full_name STRING,
  location STRING,
  app STRING,
  signal_type STRING,
  status STRING,
  detail STRING,
  confidence STRING,
  score INT,
  image_hash STRING
);
```

## Seed data

Use `harperdb/seed.json` to insert sample rows for local testing.

## HarperDB built-in Next.js (App Platform)

If you are deploying via HarperDB built-in Next.js:

1. Create a new app in HarperDB Studio and select Next.js.
2. Point it to this project directory.
3. Add the environment variables above in the app settings.
4. Deploy and use `/api/lookup` as the serverless endpoint.

Refer to HarperDB docs for the exact flow in your version.
