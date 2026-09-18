# Product Brief — Doa & Dzikir Anak

## Product Statement
Aplikasi membantu anak menghafal doa dan dzikir sesuai sunnah dengan tampilan adaptif berdasarkan kemampuan membaca Arabic.

Core loop:
**Baca → Ikuti → Ulangi → Kurangi Bantuan → Recall → Murajaah → Amalkan**

## Target
- Anak ±5–12 tahun
- Orang tua
- Homeschooling
- Siswa sekolah Islam/TPQ

## Reading Assistance
### Level A — Belum Lancar Arabic
- Latin sangat besar
- Arabic tetap muncul di bawah
- arti opsional
- petunjuk warna ON

### Level B — Mulai Membaca
- Arabic besar
- Latin lebih kecil
- arti opsional

### Level C — Sudah Membaca
- Arabic sangat dominan
- Latin default OFF tetapi dapat diaktifkan
- arti opsional

## Aturan Latin
Tidak ada Latin-only mode. Latin adalah scaffolding.

## Color Reading Flow
Warna digunakan untuk visual chunking dan urutan baca, bukan klaim psikologi warna. Gunakan 3–5 visual groups yang tenang.

## Tampilan Wajib Setiap Doa
- judul
- Arabic
- Latin
- arti
- sumber/referensi
- grup/kategori
- tags jika tersedia

Sumber tetap tersedia pada child screen, minimal melalui label `Sumber` yang dapat dibuka.

## Mode Belajar
### Baca
Arabic/Latin sesuai level, arti toggle, sumber tersedia.

### Hafal
Progressive hiding, hint, pengulangan manual, recall.

### Murajaah
Daftar doa yang perlu diulang, satu per layar, self-assessment.

## Tanpa Audio — Fase Sekarang
Tidak ada audio player, waveform, repeat audio, speech recognition, atau pronunciation scoring. "Ulangi" berarti pengulangan baca/hafalan manual.

## Toggle
- Bantuan Baca: Besar / Kecil / Sembunyikan
- Arti: Tampilkan / Sembunyikan
- Petunjuk Warna: Aktif / Mati
- Mode Fokus: Aktif / Mati

## Progress States
- NOT_STARTED
- LEARNING
- MEMORIZING
- REVIEW
- FLUENT

## Self Assessment
- Masih perlu bantuan
- Sedikit lupa
- Lancar

## Murajaah MVP
Contoh interval: hari yang sama → besok → 3 hari → 7 hari → 14 hari → 30 hari.

## Learning Path
Anak tidak melihat seluruh katalog. Buat jalur seperti:
- Langkah Pertama
- Keseharianku
- Rumah
- Masjid
- Perjalanan
- Dzikir

## Out of Scope MVP
Audio, AI, teacher dashboard, leaderboard, social, streak agresif, full 228 item child browse.
