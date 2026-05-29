# CheaterCheck.ai: project supplement

Technical notes for this repository only. **Career copy** (role, dates, CV bullets, Upwork wording) lives in the maintainer's private **SA** workspace.

---

## Product (technical)

Web concept for dating-app risk lookup: user submits photo + name + location + app; `/api/lookup` queries HarperDB **signals** (or demo mode), returns match summary and signal cards; can enqueue **crawl_jobs** when no rows match. Roadmap items (payment unlock, face pipeline) are in [`PLAN.md`](../PLAN.md).

---

## Repository map

| Area | Path |
|------|------|
| Next.js UI | `pages/index.js`, `pages/search.js`, `components/` |
| Lookup API | `pages/api/lookup.js` |
| Crawl APIs | `pages/api/crawl-request.js`, `pages/api/crawl-status.js` |
| HarperDB client | `lib/harperdb.js` |
| Schema + seed | `harperdb/schema.sql`, `harperdb/seed.json` |
| Dev scripts | `scripts/wait-for-harperdb.js`, `harperdb-seed.js`, `dev-crawler.js`, `cluster-bootstrap.js` |
| Python crawler | `crawler/` (`main.py`, `job_processor.py`, `job_queue.py`, `signal_generator.py`, …) |
| Docker | `docker-compose.yml`, `Dockerfile`, `crawler/Dockerfile` |
| Cluster ops | [`CLUSTER.md`](../CLUSTER.md) |
| Crawler ops | [`CRAWLER.md`](../CRAWLER.md) |

---

## Runtime (dev)

- Shared HarperDB: `npm run dev:db:start` / `dev:db` (port **9925**)
- App: `npm run dev` or `dev:app`
- Crawler: `npm run dev:crawler` (Python, same HarperDB)
- Cluster: `npm run cluster:up`, `cluster:bootstrap`, `cluster:seed`

---

## Data model (starter)

- **`cheatercheck.signals`**: searchable risk signals (name, location, app, score, detail, …)
- **`cheatercheck.crawl_jobs`**: job queue for crawler polling (created from lookup when no match)
- **`cheatercheck.profiles`**: raw crawler profiles (local per crawler node per `CRAWLER.md`)

---

## Feature checklist (in repo)

- [x] Search UI + lookup API (demo mode without HarperDB env)
- [x] HarperDB SQL lookup by name/location/app
- [x] Crawl job creation when lookup misses
- [x] Python crawler + signal generation pipeline
- [x] Docker Compose: shared dev DB + multi-node cluster + crawler services
- [x] Cluster bootstrap and seed scripts
- [ ] Payment unlock (planned, `PLAN.md`)
- [ ] Face recognition / image_hash matching (planned, `PLAN.md`)

---

## Maintainer notes

Update **`README.md`** and this file when structure or ops change. Update career distill in **SA** (`docs/projects/cheatercheck-ai.md`) when public narrative changes.
