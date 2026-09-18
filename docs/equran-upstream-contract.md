# eQuran Doa API — Observed Contract

Captured from `https://equran.id/api/doa` and `https://equran.id/api/doa/1` on 2026-09-18. The committed fixtures are sanitized response-shaped excerpts: they contain only the first observed record and no headers, request metadata, or credentials.

## Response envelopes

- List: `{ "status": "success", "total": 227, "data": Dua[] }`
- Detail: `{ "status": "success", "data": Dua }`

## Exact upstream record fields

| Internal meaning | Exact eQuran field | Observed type |
| --- | --- | --- |
| External ID | `id` | number |
| Title | `nama` | string |
| Group/category | `grup` | string |
| Tags | `tag` | string[] |
| Arabic | `ar` | string |
| Latin transliteration | `tr` | string |
| Indonesian translation | `idn` | string |
| Source/reference and upstream context | `tentang` | string |

`tentang` is the exact upstream field containing the hadith/source reference. It can also contain explanatory context and line breaks, so a later importer must preserve it verbatim as raw source content and must not synthesize a replacement.

## Scope of this inspection

The strict Zod schemas in `src/upstream/equran/schema.ts` validate only the observed upstream envelope and record shapes. This work intentionally does not fetch at runtime, map data to `ImportedDua`, calculate hashes, write a database record, or activate content. Those operations belong to later phases.
