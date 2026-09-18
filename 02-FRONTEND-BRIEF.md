# Frontend Brief

## Tujuan
UI anak harus tenang, mudah, mobile-first, Arabic-focused, tombol besar, dan tidak terasa seperti admin dashboard.

## Stack
- React
- TypeScript
- Refine Core 5 sebagai headless layer
- Custom UI
- Vercel

Refine untuk auth, data provider, query, mutation, access control. Jangan gunakan generic Refine admin UI untuk anak.

## Navigation Anak
- Beranda
- Hafalan
- Murajaah
- Doa
- Saya

## Home
Tampilkan lanjut hafalan, murajaah hari ini, learning path, dan doa yang sedang dipelajari. Tidak perlu chart.

## Learning Screen
Urutan:
1. judul
2. posisi/progress
3. Arabic
4. Latin sesuai reading level
5. arti bila ON
6. sumber ringkas
7. controls
8. CTA recall

Contoh:
```txt
Doa Sebelum Tidur
2 / 5

[ ARABIC BESAR ]

[ LATIN SESUAI LEVEL ]

Arti:
...

Sumber:
HR. ...

[Bantuan Baca] [Arti] [Warna]

[Coba Tanpa Melihat]
```

## Source UI
Setiap doa wajib menyediakan source. Jika panjang, tampilkan `Sumber >` dan buka detail sheet. Jangan membuat penilaian sanad sendiri.

## Tombol Anak
Primary 56–64px. Secondary minimal ±48px.

Gunakan label:
- Lanjut Hafalan
- Coba Tanpa Melihat
- Bantu Saya
- Lihat Arti
- Ulangi Lagi
- Saya Sudah Hafal

## Reading Level
Belum lancar: Latin lebih besar dari Arabic.
Sedang: Arabic lebih besar, Latin kecil.
Lancar: Arabic sangat besar, Latin hidden by default.

## Color Flow
Gunakan chunk, bukan warna per huruf. Arabic dan Latin pada chunk yang sama memakai visual group yang sama. Jangan mengandalkan warna sebagai satu-satunya indikator.

## Focus Mode
Sembunyikan bottom nav dan elemen sekunder. Sisakan konten hafalan dan akses ke sumber.

## Accessibility
- high contrast
- target tap besar
- Arabic tidak clipping
- RTL support
- screen reader labels
- keyboard accessible
- tidak hanya warna

## No Audio Components
Jangan membuat audio player, waveform, play button, repeat audio, atau media session.
