# CheaterCheck.ai

Dating risk intelligence concept. Upload a profile photo plus name, location, and
app; the system checks a signals store, returns a gated risk report, and enqueues a
background crawl when no data exists. Pay to unlock the full report.

Concept / MVP project, not a live consumer product.

<!-- chunhuduc.com:showcase:start -->
```yaml
summary: "Turborepo monorepo (Next.js 15 + NestJS) with a Postgres-backed job queue on Neon/Prisma, Ably realtime progress, Stripe Checkout paywall with signature-verified webhooks, and Resend email."
tags: [Next.js, NestJS, Turborepo, Prisma, Stripe, Ably]
outcome: "Postgres job queue with realtime progress and a Stripe-gated report flow."
complexityScore: 6
motif: { from: "#0891b2", to: "#84cc16", icon: automation }
architecture:
  from: "#0891b2"
  to: "#84cc16"
  nodes:
    - { id: web, label: "Next.js web", x: 18, y: 14 }
    - { id: api, label: "NestJS API", x: 50, y: 14, kind: primary }
    - { id: db, label: "Postgres (Neon)", x: 50, y: 50, kind: store }
    - { id: worker, label: "Crawl worker", x: 82, y: 30 }
    - { id: ably, label: "Ably realtime", x: 18, y: 50 }
    - { id: stripe, label: "Stripe + Resend", x: 82, y: 58 }
  edges:
    - { from: web, to: api, flow: true }
    - { from: api, to: db, flow: true }
    - { from: db, to: worker, flow: true, curve: 4 }
    - { from: worker, to: ably, curve: -6 }
    - { from: ably, to: web, curve: -4 }
    - { from: api, to: stripe, flow: true }
```
<!-- chunhuduc.com:showcase:end -->

## Stack

| Layer      | Tech |
|------------|------|
| Web        | Next.js 15 (App Router), React 18, deploys to Vercel |
| API        | NestJS 10, deploys to Railway / Render / Fly |
| Database   | Postgres (Neon) via Prisma |
| Queue      | Postgres-backed job table, polled by an in-process worker |
| Realtime   | Ably (crawl progress); falls back to polling if unset |
| Payments   | Stripe Checkout + webhook unlock |
| Email      | Resend (report unlocked) |
| Monorepo   | Turborepo + pnpm workspaces |

## Layout

```
apps/
  web/    Next.js front end (landing, /search, /report)
  api/    NestJS API + crawl worker
packages/
  types/  shared request/response DTOs (single source of truth)
```

## Endpoints (API)

- `POST /lookup` run a scan; creates a Report, enqueues a CrawlJob on a miss
- `GET  /reports/:id` fetch a report (gated until unlocked)
- `GET  /jobs/:id` crawl progress (polling fallback)
- `GET  /realtime/token` Ably token request for the browser
- `POST /payments/checkout` start Stripe Checkout for a report
- `POST /payments/webhook` Stripe webhook; unlocks the report and emails the link
- `GET  /health`

## Local development

Requires Node 20+, pnpm 9, and a Postgres database (Neon recommended).

```bash
pnpm install

# 1. Configure env
cp .env.example apps/api/.env            # set DATABASE_URL + DIRECT_URL (Neon)
cp apps/web/.env.local.example apps/web/.env.local

# 2. Set up the database
pnpm db:generate
pnpm db:migrate          # creates tables
pnpm db:seed             # sample signals

# 3. Run everything
pnpm dev                 # turbo runs web (:3000) + api (:4000)
```

Then open http://localhost:3000.

### Neon connection strings

Prisma needs two URLs:

- `DATABASE_URL`: the **pooled** endpoint (host contains `-pooler`). Used at runtime.
- `DIRECT_URL`: the **direct** endpoint (same host without `-pooler`). Used for migrations.

### Optional integrations

The API degrades gracefully when these are unset, so you can develop without them:

- `ABLY_API_KEY` unset: realtime disabled, the web client polls `GET /jobs/:id`.
- `RESEND_API_KEY` unset: emails are logged, not sent.
- `STRIPE_SECRET_KEY` unset: checkout returns a 400.

To test Stripe locally, set `STRIPE_SECRET_KEY`, create a price and set
`STRIPE_PRICE_SINGLE` (or leave it unset to use an inline $18 line item), then run
`stripe listen --forward-to localhost:4000/payments/webhook` and put the printed
signing secret in `STRIPE_WEBHOOK_SECRET`.

## The crawl worker

`apps/api/src/jobs/crawl.worker.ts` polls `crawl_jobs` for `pending` rows, claims one
atomically with `FOR UPDATE SKIP LOCKED`, runs the crawl, writes any `Signal` rows, and
streams progress over Ably. The crawl itself (`runCrawl`) is a deterministic stub;
real scraping / face matching plugs in there. The queue, claim, progress, and
write-back machinery is real.

## Deploy

- **web** to Vercel: set `NEXT_PUBLIC_API_URL` to the deployed API origin.
- **api** to Railway / Render / Fly: set all env vars from `.env.example`, run
  `pnpm db:deploy` on release, and point `WEB_ORIGIN` at the Vercel domain.
