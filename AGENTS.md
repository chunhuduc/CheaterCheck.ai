# Agent notes (CheaterCheck.ai)

Brief pointer for humans and coding agents working in **this repository**.

## What this repo is

**CheaterCheck.ai**: HarperDB + **Next.js** lookup concept (cheaterbuster-style dating risk checks) with a **Python** crawler pipeline, job queue, and multi-node **Docker Compose** cluster docs. Public source: https://github.com/chunhuduc/CheaterCheck.ai

## Project docs (this repo)

| File | Purpose |
|------|---------|
| [`README.md`](README.md) | Dev setup, shared HarperDB, scripts |
| [`docs/PROJECT.md`](docs/PROJECT.md) | Repo map, conventions, feature checklist |
| [`PLAN.md`](PLAN.md) | Product roadmap (MVP, payment, face pipeline) |
| [`CRAWLER.md`](CRAWLER.md) | Crawler node architecture and ops |
| [`CLUSTER.md`](CLUSTER.md) | Multi-node HarperDB cluster |
| [`harperdb/schema.sql`](harperdb/schema.sql) | Starter schema (`signals`, etc.) |
| [`lib/harperdb.js`](lib/harperdb.js) | HarperDB HTTP client for Next.js API routes |

## Career / CV (outside this repo)

CV bullets, role, dates, Upwork copy, and public wording are maintained in the private **SA** career workspace (not committed here).

For agents with access to the local **BRAINSTORM** layout: see `../SA/docs/projects/cheatercheck-ai.md` and `../SA/docs/projects/SUMMARIES.md`.

## Dev commands

```bash
npm install
npm run dev              # shared HarperDB + Next.js
npm run dev:crawler      # Python crawler (local HarperDB)
npm run dev:all          # helper message for multi-terminal dev
npm run cluster:up       # multi-node Docker cluster
```

## Agent behavior

- Next.js **Pages Router** (`pages/`), not App Router.
- HarperDB access via `lib/harperdb.js` and env vars (`HARPERDB_URL`, schema `cheatercheck`).
- Crawler lives under `crawler/` (Python); job queue in HarperDB (`crawl_jobs`).
- Do not commit secrets or `.env.local`.
- Do not claim live payments, face recognition production, or verified consumer outcomes unless implemented and approved by the owner.
- In Markdown you add here: avoid Unicode em dash / en dash; use commas, colons, or `to` for ranges.
