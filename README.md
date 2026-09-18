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
