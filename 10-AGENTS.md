# AGENTS.md

## Mission
Build a calm, child-first web app for memorizing doa and dzikir sesuai sunnah.

## Stack
React, TypeScript, Refine Core 5 headless, Neon PostgreSQL, Vercel.

## Upstream
eQuran Doa API.

## Absolute Rules
1. Arabic always exists in learning UI.
2. Never create Latin-only mode.
3. Translation comes from imported upstream content.
4. Source/reference comes from imported upstream content.
5. Never invent hadith/source references.
6. Never paraphrase religious content with AI in production.
7. No ACTIVE item without source_reference.
8. Browser never calls eQuran directly.
9. No audio in current MVP.
10. No speech recognition.
11. No AI pronunciation scoring.
12. Mobile first.
13. Child UI is custom, not Refine admin UI.
14. Do not show 228 items at once to children.

## Before Coding
Read active `.md`, inspect repo, state phase, plan minimal changes.

## After Coding
Run lint, typecheck, tests, build.

## Priority
Content integrity → source traceability → child usability → accessibility → anti-slop → visual preference.
