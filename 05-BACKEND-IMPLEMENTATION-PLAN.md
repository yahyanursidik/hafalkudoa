# Backend Implementation Plan

## B0 — Foundation
Env, Neon, migrations, logger, errors, `/api/v1`, health, tests.

## B1 — Content Schema
Buat `dua_import_batches`, `dua_raw_imports`, `dua_items`, `dua_tags`, `dua_item_tags`, `dua_chunks`.

## B2 — eQuran Adapter
Fetch list/detail, map upstream → internal, preserve raw payload, hash, validate mandatory fields.

## B3 — Content Review
Diff, status, approve, activate.

## B4 — Read API
List, detail, groups, tags.

## B5 — Auth/Children
Parent auth, child profile, ownership.

## B6 — Progress
Plans, progress, sessions, attempts.

## B7 — Murajaah
Due, complete, schedule.

## B8 — Parent Summary
Current, due count, recently fluent, recommended next.

## B9 — Hardening
Authorization, rate limits, indexes, backup, restore test, observability.
