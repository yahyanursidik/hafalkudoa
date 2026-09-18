# Doa & Dzikir Anak — Project Pack

## Ringkasan
Aplikasi web pendamping hafalan doa dan dzikir sesuai sunnah untuk anak dan keluarga.

Stack:
- React + TypeScript + Refine Core 5
- Neon PostgreSQL
- Vercel
- Upstream content: eQuran Doa API
- Audio: **belum digunakan pada versi sekarang**

## Sumber Konten
Upstream:
- `https://equran.id/api/doa`
- `https://equran.id/api/doa/{id}`

Dokumentasi eQuran menyebut konten doa memiliki:
- teks Arab berharakat;
- transliterasi Latin;
- terjemahan Bahasa Indonesia;
- referensi sumber hadits;
- grup/kategori;
- multiple tags.

## Prinsip Produk
**Baca → Ikuti → Ulangi → Kurangi Bantuan → Hafalkan → Murajaah → Amalkan**

## Non-Negotiable
1. Arabic selalu tersedia.
2. Tidak ada mode Latin-only.
3. Latin adalah bantuan sementara.
4. Arti dapat ditampilkan/disembunyikan.
5. Setiap doa wajib memiliki sumber/referensi dari API eQuran.
6. Doa tanpa `source_reference` tidak boleh `ACTIVE`.
7. Tidak ada audio pada fase sekarang.
8. Tidak ada AI pronunciation scoring.
9. Konten upstream tidak langsung ditampilkan tanpa import/sync + review.
10. UI child-first, bukan dashboard SaaS.

## Dokumen
- `01-PRODUCT-BRIEF.md`
- `02-FRONTEND-BRIEF.md`
- `03-FRONTEND-IMPLEMENTATION-PLAN.md`
- `04-BACKEND-BRIEF.md`
- `05-BACKEND-IMPLEMENTATION-PLAN.md`
- `06-CONTENT-INTEGRITY.md`
- `07-DATABASE-AND-API-CONTRACT.md`
- `08-EQURAN-ADAPTER.md`
- `09-VIBE-CODING-INSTRUCTIONS.md`
- `10-AGENTS.md`
- `11-ANTI-SLOP-UI.md`

## MVP
Mulai dari 15–25 doa inti anak. Jangan tampilkan 228 doa sekaligus kepada anak.
