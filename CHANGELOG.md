# Catatan rilis Hafalku Doa

Versi aplikasi mengikuti Semantic Versioning (`MAJOR.MINOR.PATCH`) dan dicatat
di `package.json` serta `package-lock.json`. Setiap rilis diberi tag Git
`vMAJOR.MINOR.PATCH`. Selama versi `0.x`, fitur baru menaikkan versi minor;
perbaikan tanpa fitur baru menaikkan versi patch.

## 0.2.0 — 2026-10-08

### Ditambahkan

- Pencarian doa berdasarkan judul, kelompok, bab kurasi, dan tag.
- Jumlah hasil pencarian, pesan ketika doa belum ditemukan, dan tombol untuk
  menghapus pencarian.
- Dua test untuk memastikan Latin besar menjadi bawaan pembaca baru dan
  preferensi ukuran lama tetap tersimpan bersama kemajuan hafalan.

### Diperbarui

- Latin terlihat dan besar secara default untuk pengguna baru, baik saat membaca
  maupun latihan hafalan. Preferensi yang sudah tersimpan tidak ditimpa.
- Pengaturan baca dipisahkan menjadi bantuan membaca, ukuran tulisan Arab,
  dan mode fokus agar lebih mudah ditemukan.
- Warna teal, biru lembut, kuning, dan mint konsisten untuk navigasi serta kontrol.
- Tombol aktif memiliki tanda centang, selain perubahan warna.
- Label ukuran tulisan disederhanakan; daftar doa dan tombol tidak lagi terpotong
  pada layar kecil.
- Label sumber menjelaskan bahwa informasi tersebut dapat dibaca pendamping.

### Verifikasi

- Lint, typecheck, dan build lulus; 89 test dalam 18 file lulus.
- Pembaca diuji pada lebar 320, 375, 414, dan 768 piksel; pencarian dan pemulihan
  hasil kosong diperiksa langsung di browser.
- Build masih memberikan peringatan ukuran chunk JavaScript utama di atas 500 kB.

### Batas perubahan

- Tidak mengubah teks Arab, Latin, terjemahan, atau referensi doa.
- Tidak menambahkan audio, akun, atau penulisan ke database produksi.
- Kemajuan hafalan dan preferensi lama tetap berada di perangkat pengguna.
