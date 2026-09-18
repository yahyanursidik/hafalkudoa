# Doa & Dzikir Anak API

B0 backend foundation built with TypeScript, Vercel Functions, Neon PostgreSQL, and Zod.

## Setup

1. Copy `.env.example` to `.env` and set a Neon `DATABASE_URL`.
2. Install dependencies with `npm install`.
3. Apply foundation migrations with `npm run db:migrate`.
4. Run locally with `vercel dev`, then call `GET /api/v1/health`.

The health endpoint checks database reachability and returns `200` only if Neon responds. It uses the shared error response shape for request failures.

## Commands

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run db:migrate`

This foundation now includes the B1 content schema. It still intentionally has no audio support or audio endpoints.

## Frontend shell (F0)

The child-facing React shell lives in `web/`. It uses Refine Core 5 only as a headless application layer; routing and UI are custom rather than a Refine admin interface.

- `npm run dev:web` starts the Vite development server.
- `npm run build:web` creates the production frontend bundle.

F0 provides only the responsive app shell and routes for Beranda, Hafalan, Murajaah, Doa, and Saya. It contains no audio UI, API integration, or religious content fixtures.

## Public doa catalogue

The public API exposes only `ACTIVE` doa at `GET /api/v1/dua` and `GET /api/v1/dua/:id`. The React catalogue at `/doa` reads only those internal routes, shows 12 entries at a time, and validates every detail response for Arabic, Latin, translation, and source before rendering it.

The current production import has 225 public items. eQuran IDs 42 and 144 remain excluded because the observed upstream payload has mandatory fields empty: Latin and translation for 42; source/reference for 144.

`vercel.json` builds the Vite bundle into `dist/web` and rewrites only non-`/api` browser routes to the SPA entry. API requests continue to resolve through the serverless functions under `/api`.

## Content review workflow

`doa:sync` stores raw upstream data and creates only `REVIEW_REQUIRED` candidates. A reviewer must inspect a candidate through `doa:review <candidate-id>`, run `doa:approve <candidate-id>`, then explicitly run `doa:activate <candidate-id> --confirm`. Sync never activates content.

## Curation layer (kid path)

The catalogue is a clone of the upstream eQuran doa collection, which already
carries Hisnul Muslim and salafi takhrij in `source_reference`. Nothing in that
content is rewritten. Instead, `dua_curation` stores presentation metadata next
to each ACTIVE item:

- `audience` — `KIDS` (everyday doa a child can own), `FAMILY` (learn with a
  parent), `ADULT` (jenazah, hutang, musuh, pernikahan; kept for parents)
- `chapter` / `chapter_order` — the upstream group, ordered along a child's day
  (tidur → wudhu → adzan → shalat → makan → …)
- `difficulty` — 1–3, derived from the Arabic word count only
- `curation_rule` — which rule produced the decision, so a reviewer can audit it

`dua_chunks` stores memorisation chunks as offsets into the canonical Arabic
string plus the matching Latin words. The Arabic text is never re-spaced.

Both tables are fully derived and safe to rebuild:

- `npm run doa:curate` — dry run, prints the plan per chapter
- `npm run doa:curate-apply` — rebuild `dua_curation`
- `npm run doa:chunks` — rebuild `dua_chunks`
- `npm run doa:curation-report` — coverage per audience

Current plan: 131 KIDS, 43 FAMILY, 51 ADULT across 44 chapters, 848 chunks.

Rules are keyword-based and deterministic, so a re-run after a sync is a
reviewable diff. Manual reviewer overrides are not supported yet — an override
table must be added before a human decision can survive a rebuild.

## Read API

- `GET /api/v1/dua` — ACTIVE list, ordered by the curation path; optional
  `?audience=KIDS|FAMILY|ADULT|ALL` (an unknown value returns `400`)
- `GET /api/v1/dua/:id` — detail, including `curation` and `chunks`; a
  non-UUID id returns `404` instead of reaching the database
- `GET /api/v1/dua/chapters` — chapters with total and kid counts
- `GET /api/v1/dua/groups`, `GET /api/v1/dua/tags`, `GET /api/v1/health`

`vite --config web/vite.config.ts` serves these same handlers locally from an
explicit route table; any other `/api/` path returns `404` rather than the SPA
shell.

## Deploy (Vercel)

The `invalid_function_runtime` failure from the first deploy came from a
`functions` block in `vercel.json` pinning `"runtime": "nodejs22.x"`. Vercel
expects a versioned runtime package there, not a Node label, so the block was
removed (commit `53d3108`) and the project now uses the default Node runtime
that `engines.node` selects. The current `vercel.json` needs no `functions` key.

Before the first successful deploy, set the project environment variable:

- `DATABASE_URL` — the Neon pooled connection string, for Production, Preview,
  and Development

Without it every `/api/v1/*` route answers `500` and the function log reads
`Invalid environment configuration: DATABASE_URL`.

Deploy steps (the CLI login in this workspace has expired, so step 1 must run in
an interactive terminal):

```
vercel login
vercel link --yes
vercel env add DATABASE_URL production
vercel deploy --prod
```

Migrations do not run during the Vercel build. Apply them from a machine that
has `.env.local`:

```
npm run db:migrate
```
