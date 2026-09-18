# Vibe Coding Instructions

## Prinsip
Jangan membangun seluruh aplikasi sekaligus. Satu fase = baca dokumen → inspect repo → plan → implement → lint → typecheck → tests → build → review scope.

## Prompt 0 — Read First
```txt
Read:
- 00-README.md
- 01-PRODUCT-BRIEF.md
- 06-CONTENT-INTEGRITY.md
- 07-DATABASE-AND-API-CONTRACT.md
- 08-EQURAN-ADAPTER.md
- 10-AGENTS.md
- 11-ANTI-SLOP-UI.md

Do not code yet.
Summarize product goal, learning model, mandatory content fields, source-reference rule, no-audio constraint, API architecture, and MVP boundaries.
```

## Prompt 1 — Backend Foundation
```txt
Implement B0 only.
Use TypeScript + Neon + Vercel API + Zod.
Create env validation, DB connection, migrations, error format, logger, /api/v1/health, tests.
No frontend, no audio, no eQuran integration yet.
Run lint/typecheck/tests/build.
```

## Prompt 2 — eQuran Contract Inspection
```txt
Work only on upstream contract inspection.
Read 08-EQURAN-ADAPTER.md.
Fetch https://equran.id/api/doa and https://equran.id/api/doa/1.
Do not guess field names.
Save sanitized fixtures.
Document exact upstream fields for id, title, group, tags, Arabic, Latin, Indonesian translation, and source/reference.
Create a typed/Zod upstream schema.
Do not persist to production DB yet.
```

## Prompt 3 — Content Schema
```txt
Implement B1 only.
Arabic, Latin, translation, and source_reference are mandatory for ACTIVE content.
Retain raw upstream payload.
No audio tables.
Add migrations and tests.
```

## Prompt 4 — eQuran Importer
```txt
Implement B2 only.
Create doa:sync, doa:validate, doa:diff, doa:activate.
Preserve raw payload, compute hash, never auto-activate, fail when source_reference/Arabic/Latin/translation is empty, report field-level diffs.
No AI transformations. No audio.
```

## Prompt 5 — Read API
```txt
Implement B4 only.
Create GET /api/v1/dua, /dua/:id, /dua/groups, /dua/tags.
Only ACTIVE content is public.
Detail MUST contain Arabic, Latin, translation, source, group, tags.
Add tests that fail if source is omitted.
```

## Prompt 6 — Frontend Foundation
```txt
Implement F0 only.
Use React + TypeScript + Refine Core 5 headless.
No generic Refine admin UI.
No audio player/waveform.
No decorative Islamic clichés.
Build shell and routing only.
Run lint/typecheck/tests/build.
```

## Prompt 7 — Static Child Prototype
```txt
Implement F1 only using local fixture doa with title, Arabic, Latin, translation, source, group, tags.
Build Home, Doa list, Detail, Learning screen, reading assistance states, translation toggle, color flow/chunks, source display.
Arabic always visible. No Latin-only. Source always accessible. No audio. Mobile first.
```

## Prompt 8 — Hafalan Interaction
```txt
Implement F2 only.
Add hide/reveal, progressive hiding, hint, manual repetition counter, recall state, self-assessment.
Do NOT add audio, speech recognition, AI pronunciation, gamification, teacher features.
```

## Prompt 9 — Backend Integration
```txt
Replace static fixtures with /api/v1/dua.
Never read eQuran directly from the browser.
Verify every detail item includes Arabic, Latin, translation, source.
If source is missing, render safe content error state rather than silently hiding it.
```

## Prompt 10 — Murajaah
```txt
Implement progress/review only.
Use deterministic backend scheduling.
Assessment: NEED_HELP, ALMOST, FLUENT.
Return next_review_at.
No AI. No audio. No streak. No leaderboard.
```

## Mandatory Review Prompt
```txt
Review the current active phase only.
Check scope creep, missing source/reference, missing translation, Latin-only possibility, direct eQuran browser calls, religious content rewrites, accidental audio, child UX, accessibility, anti-slop, security, test gaps.
Fix only concrete issues.
Then run lint/typecheck/tests/build and return a short Delivery Gate report.
```

## Definition of Done
Lint pass, typecheck pass, tests pass, build pass, no critical TODO, no audio, source-reference preserved, no scope creep.
