# Backend Brief

## Tujuan
Backend mengimpor konten eQuran, menyimpan snapshot internal, menjaga sumber/referensi, menyediakan API kita sendiri, menyimpan progress, dan menjalankan murajaah.

## Upstream
- `/api/doa`
- `/api/doa/{id}`

Internal model wajib memiliki Arabic, Latin, arti, sumber/referensi, grup, dan tags.

## Tidak Runtime-Dependent
Frontend tidak memanggil eQuran langsung.

```txt
eQuran → sync/import → validation → review → Neon → our API → frontend
```

## Critical Rule
Item tidak boleh ACTIVE jika Arabic, Latin, arti, atau `source_reference` kosong.

## Stack
TypeScript, Neon PostgreSQL, Vercel Functions/server routes, typed schema/query layer, Zod.

## Content State
- IMPORTED
- REVIEW_REQUIRED
- APPROVED
- ACTIVE
- REJECTED

## Sync Commands
- `doa:sync`
- `doa:validate`
- `doa:diff`
- `doa:activate`

Sync tidak boleh meng-overwrite ACTIVE content diam-diam.

## Child Data
Parent, display name child, age band, reading level, preferences, progress.

## Murajaah Engine
Server-side dan deterministic. Output utama: `next_review_at`.

## No Audio Schema Required
Tidak ada audio table atau endpoint audio pada MVP ini.
