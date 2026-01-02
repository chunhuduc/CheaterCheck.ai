# CheaterCheck.ai

A HarperDB + Next.js website concept inspired by cheaterbuster-style dating risk checks.

## Setup

1. Install dependencies: `npm install`
2. Configure environment variables:

   Copy `.env.example` to `.env.local` (if exists) or set environment variables:
   ```
   HARPERDB_URL=http://localhost:9925
   HARPERDB_USERNAME=HDB_ADMIN
   HARPERDB_PASSWORD=changeme
   HARPERDB_SCHEMA=cheatercheck
   HARPERDB_TABLE=signals
   ```

3. Install Python dependencies for crawler (if using):
   ```bash
   cd crawler
   pip install -r requirements.txt
   ```

4. Start development: `npm run dev`

## Development Mode

Trong dev mode, tất cả nodes (app và crawler) đều dùng chung một HarperDB instance tại `http://localhost:9925`.

### Setup Environment Variables

Copy `.env.example` to `.env.local` và cấu hình:

```bash
cp .env.example .env.local
```

### Start Shared HarperDB

```bash
npm run dev:db:start     # Start HarperDB only
npm run dev:db           # Start HarperDB, wait for ready, and seed data
npm run dev:db:stop      # Stop HarperDB
```

### Start Tinder Crawler (Dev Mode)

Chạy crawler trực tiếp bằng Python (không qua Docker), kết nối vào HarperDB chung:

```bash
npm run dev:crawler       # Start crawler in continuous mode
npm run dev:crawler:once  # Run crawler once and exit
```

Crawler sẽ tự động:
- Kết nối vào `http://localhost:9925` (shared HarperDB)
- Tạo profiles table locally (nếu chưa có)
- Insert profiles vào profiles table (local)
- Generate signals vào signals table (shared)

**Lưu ý**: Đảm bảo đã cài đặt Python dependencies:
```bash
cd crawler
pip install -r requirements.txt
```

### Start Next.js App (Dev Mode)

App cũng kết nối vào cùng HarperDB chung:

```bash
npm run dev:app          # Start DB + Next.js app (same as 'npm run dev')
npm run dev              # Alternative: Start DB + Next.js app
```

### Start Everything Together

```bash
npm run dev:all          # Start DB, crawler, and app together
```

**Note**: `dev:all` chạy tất cả services trong background. Để chạy riêng lẻ, sử dụng các commands trên.

Tất cả nodes (app và crawler) đều coi HarperDB chung này là "local" của chúng.

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

## Multi-Node Cluster Deployment

For production deployments with high availability and automatic data synchronization, see [CLUSTER.md](CLUSTER.md) for instructions on deploying multiple self-contained nodes (Next.js app + HarperDB per node).

Quick start:
```bash
npm run cluster:up          # Start all nodes
npm run cluster:bootstrap   # Configure cluster
npm run cluster:seed        # Seed initial data
```

## HarperDB built-in Next.js (App Platform)

If you are deploying via HarperDB built-in Next.js:

1. Create a new app in HarperDB Studio and select Next.js.
2. Point it to this project directory.
3. Add the environment variables above in the app settings.
4. Deploy and use `/api/lookup` as the serverless endpoint.

Refer to HarperDB docs for the exact flow in your version.
