# eQuran Adapter Contract

## Tujuan
Adapter mengisolasi aplikasi dari bentuk response upstream. Frontend/domain tidak boleh bergantung langsung pada nama field eQuran.

## Upstream
Base: `https://equran.id`

- `GET /api/doa`
- `GET /api/doa/{id}`
- optional filter: `grup`, `tag`

## Jangan Tebak Nama Field
Sebelum mapping production:
1. fetch `/api/doa`
2. simpan sample fixture
3. fetch `/api/doa/1`
4. catat exact field names
5. buat Zod upstream schema
6. baru map ke internal model

## Internal Model
```ts
type ImportedDua = {
  externalId: number | string;
  title: string;
  group: string | null;
  tags: string[];
  arabic: string;
  latin: string;
  translation: string;
  sourceReference: string;
  raw: unknown;
};
```

## Mandatory Validation
Reject jika Arabic, Latin, translation, atau sourceReference kosong.

Jangan fallback ke `sourceReference = "eQuran"`; kita membutuhkan referensi sumber/hadits yang disediakan upstream.

## Raw Preservation
Selalu simpan raw payload.

## Normalization
Boleh trim whitespace dan normalize array tags. Jangan rewrite Arabic, Latin, translation, atau source.

## Contract Test
Fixture test memastikan external id, Arabic, Latin, translation, source, dan tags terbaca tanpa silent field loss.

## Upstream Change
Jika schema berubah, adapter test gagal, import berhenti, ACTIVE data tidak berubah, lalu adapter diperbarui eksplisit.
