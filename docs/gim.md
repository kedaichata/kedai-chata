/docs/gim.md

# 🎮 gim.md: Menu Hamburger dan Game Arithmetics

> **Versi 1.0 (10 Nov 2026), hasil sesi strategi** (diwakili adik ketua; keputusan asli dari ketua). Bergantung pada `home.md` dan `desain.md` (bilah atas, variabel warna) dan `AGENTS.md`.
> **Status:** GM1 sampai GM14 disepakati ketua kecuali butir bertanda **(bawaan)** = pilihan penulis, boleh diubah sebelum dikerjakan. Belum ada yang dikerjakan.
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini + `desain.md`** (+ `home.md` bila menyentuh Home). Kerjakan langkah di bagian 5. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 9.
> **Berkas yang diminta AI di awal sesi:** `public/index.html` (utuh, sekitar 90 KB; satu giliran khusus untuknya), `public/style.css` (hanya dibaca untuk nama variabel warna, **tidak diubah**), `public/kerangka.js` (hanya dibaca), dan `public/sw.js`.
> **Tanpa kode.** **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Fitur ini Low-Risk (P2):** hanya tampilan dan permainan di HP, tanpa tabel, fungsi SQL, atau Edge Function. Pengecualian: langkah yang menyentuh `sw.js` butuh "OK" ketua.
> **Prefix sheet:** GIM. **Dikerjakan paling akhir di versi 1**, setelah inti order selesai.

---

## 1. Tujuan

Menambah **pemikat ringan** supaya ibu-ibu betah membuka aplikasi: satu tombol hamburger di bilah atas yang membuka game sederhana. Game tidak boleh mengganggu kerja order, tidak menyentuh server, dan mudah dicabut bila suatu hari tidak dipakai.

---

## 2. Keputusan

| No   | Keputusan                                                                                                                                                                                                                                                                                                                                                               | Dasar                                                                |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| GM1  | **Game masuk versi 1**, dikerjakan paling akhir. Alasan: pemikat ibu-ibu supaya betah di aplikasi.                                                                                                                                                                                                                                                                      | Keputusan ketua 9 Nov 2026.                                          |
| GM2  | **Hanya satu game: Arithmetics** (hitung cepat). Catch the Vibes dan game lain menjadi kandidat di `bonus.md`.                                                                                                                                                                                                                                                          | Keputusan ketua 9 Nov 2026.                                          |
| GM3  | **Tampil untuk semua peran** (customer, owner, penjaga), tanpa aturan khusus per peran. Hanya kemudahan tampilan; tidak ada hubungannya dengan akses server.                                                                                                                                                                                                            | Keputusan ketua 9 Nov 2026.                                          |
| GM4  | **Hamburger ada di bilah atas semua tab utama** (tab Home, Order Masuk, Pesan, Antrean, dst.), di **kiri judul**. Bilah atas hanya satu komponen bersama (`#layar-sementara`), jadi cukup ditambah satu kali. Alasan: di PWA lama menu terjangkau dari semua tab.                                                                                                       | Keputusan ketua 9 Nov 2026; dicek di `index.html` dan `kerangka.js`. |
| GM5  | **Hamburger tidak muncul di sub-layar** (Pengaturan akun, Buku alamat, Kelola grup pilihan, Masuk, Daftar, Lengkapi profil, Buat password baru). Sub-layar sudah punya tombol Kembali dan satu tujuan sendiri.                                                                                                                                                          | Keputusan ketua 10 Nov 2026.                                         |
| GM6  | **Isi menu hamburger: hanya satu item langsung "🎮 Arithmetics"**, tanpa kelompok Game yang bisa dilipat dan tanpa item lain (Bantuan tetap di Home). Kelompok Game baru dibuat bila game kedua datang. **(bawaan)** (tafsiran atas arahan ketua "yang gampang dibikin aja").                                                                                           | Arahan ketua 9 Nov 2026.                                             |
| GM7  | **Menimpa DS10 dan tabel "aturan yang paling sering terlanggar" di `desain.md`** yang menolak menu hamburger. Risiko ibu-ibu tidak menemukan menu kecil karena isinya hanya game, bukan navigasi kerja. Semua navigasi kerja tetap di bilah bawah.                                                                                                                      | Keputusan ketua; `desain.md` DS10.                                   |
| GM8  | **Game murni di HP, tanpa server.** Tidak memanggil Supabase, tidak mengirim apa pun ke luar, tidak ada leaderboard, tidak ada nama. **Kode leaderboard Firebase dari proyek lama (GL.09, GL.10) tidak dibawa.**                                                                                                                                                        | Keputusan ketua 9 Nov 2026; `AGENTS.md` bagian 3 dan 7.              |
| GM9  | **Satu-satunya data tersimpan: level tertinggi** (satu angka) di `localStorage`, kunci baru **`chata_game_arithmetics_best`** (bukan kunci proyek lama). Per HP dan browser, bukan per akun; hilang bila data browser dibersihkan. Boleh tetap ada setelah Keluar karena hanya angka tanpa data pribadi.                                                                | Keputusan ketua 9 Nov 2026.                                          |
| GM10 | **Aturan main** mengikuti game lama: tiap soal dua pilihan bulat, tap satu. Lima bintang naik level. Tiga nyawa; salah atau telat mengurangi satu. Level 1 tambah, 2 kurang, 3 kali, 4 bagi, level 5 ke atas campuran dua operasi dengan angka makin besar. Soal tidak berulang dalam 10 soal terakhir. Ada tombol jeda, dan jeda otomatis bila aplikasi disembunyikan. | Dibaca dari `game-aritmetics.js` proyek lama.                        |
| GM11 | **Timer dilonggarkan untuk ibu-ibu:** mulai sekitar **15 detik** per soal, turun pelan tiap level, minimal sekitar **8 detik** (lama: 10 turun ke 4). Angka pastinya ditetapkan di sesi kode. **Angka timer tetap di kode game, bukan di database** (pengecualian dari aturan "angka yang bisa berubah di database", karena game tanpa server).                         | Keputusan ketua 9 Nov 2026; pengecualian dicatat di sini.            |
| GM12 | **CSS game dipisah di `public/game.css`**, dimuat **setelah** `style.css` supaya memakai variabel warna `:root` (tema marun dan emas ikut otomatis). **Semua nama kelas awalan `gim-`.** `style.css` **tidak diubah**. Tombol hamburger juga bergaya di `game.css`. Ini **pengecualian khusus game** dari aturan "semua gaya di satu `style.css"`.                      | Kekhawatiran ketua 10 Nov 2026 (alasan rinci belum tercatat).        |
| GM13 | **Tanpa gaya inline di JS** (kode lama penuh `style.cssText`), tanpa CDN, tanpa pustaka luar. Layar game dibuat dari kelas `gim-`. Semua teks lewat `textContent`. Warna papan tulis hijau lama diganti tema marun dan emas. Layar game **di atas segalanya** (z-index sekitar 40; navigasi bawah 10, tombol keranjang 12, sheet menu 30).                              | `AGENTS.md` bagian 3 dan 7; `style.css`.                             |
| GM14 | **Kode game di berkas JS baru** (satu fitur satu berkas, di bawah sekitar 500 baris; boleh dua berkas: menu dan game). Tidak menyentuh `kerangka.js`. Saat **Keluar**, layar game dan menu hamburger ditutup (HP dipakai bergantian). **(bawaan)**                                                                                                                      | `AGENTS.md` bagian 6; `home.md` bagian 6.                            |

---

## 3. Prasyarat

Kerangka layar utama dan Home selesai (`home.md` sampai HOM.05). Inti order selesai (GM1: dikerjakan paling akhir).

---

## 4. Yang dibuat

| Komponen          | Isi                                                                                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tombol hamburger  | Di kiri judul bilah atas (`index.html`). Tinggi sentuh minimal 48 px, emas di marun gelap (DS4), `aria-label`, `aria-expanded`. Bilah atas dibungkus kecil supaya hamburger dan judul sejajar di kiri. |
| Menu hamburger    | Dropdown kecil berisi satu item "🎮 Arithmetics". Menutup saat item diketuk, saat mengetuk di luar, dan saat Keluar.                                                                                   |
| Layar game        | Lapisan penuh dengan bar waktu, bintang, soal, dua pilihan bulat, nyawa, level, tombol jeda dan tutup. Kartu Mulai, Dijeda, dan Selesai (bergaya marun dan emas).                                      |
| Level tertinggi   | Satu angka di `localStorage` (GM9), tampil di kartu Mulai dan Selesai ("Rekor baru!").                                                                                                                 |
| `public/game.css` | Semua gaya `gim-` (hamburger, menu, layar game). Didaftarkan di cache `sw.js`.                                                                                                                         |
| Berkas JS baru    | Logika hamburger dan game. Didaftarkan di cache `sw.js`.                                                                                                                                               |

---

## 5. Urutan pekerjaan (untuk TODO sheet, prefix GIM)

Langkah ⚠️ butuh penjelasan dampak dan "OK" ketua. `index.html` utuh ditempel di tiap giliran yang menyentuhnya.

1. **GIM.01** Hamburger dan menu: tombol di bilah atas, dropdown dengan item Arithmetics (belum membuka game, atau membuka layar "Segera"), `game.css` awal. Berkas: `index.html`, `public/game.css`, JS baru.
2. **GIM.02** Game Arithmetics: soal, timer longgar, nyawa, bintang, jeda, level tertinggi di localStorage, kartu Mulai dan Selesai. Berkas: JS game, `game.css`.
3. **GIM.03 ⚠️** Daftarkan `game.css` dan JS baru di `sw.js`, naikkan versi cache. Menyentuh `sw.js`, butuh "OK" ketua. **Kerjakan bersama atau tepat sebelum push GIM.01** agar aplikasi offline tidak tampil tanpa gaya.
4. **GIM.04** Tes di HP untuk tiga peran: hamburger terlihat di semua tab utama dan tidak di sub-layar, layar game di atas navigasi bawah dan tombol keranjang, jeda otomatis saat pindah aplikasi, Keluar menutup game, layar kecil, offline.
5. **GIM.05** Catat keputusan di dokumen terkait (blok susulan di `desain.md`, `bonus.md`, `AGENTS.md`; lihat bagian 7).

---

## 6. Aturan yang paling sering terlanggar

| Aturan                                                            | Akibat bila dilanggar                                                                         |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Membawa kode leaderboard Firebase atau memanggil server dari game | Melanggar GM8 dan stack (hanya Supabase); data keluar dari sistem.                            |
| Menaruh gaya game di `style.css` atau gaya inline di JS           | Melanggar GM12 dan GM13; game tidak lagi mudah dicabut dan `style.css` ikut berisiko.         |
| Nama kelas tanpa awalan `gim-`                                    | Bisa bertabrakan dengan kelas yang sudah ada dan merusak layar lain.                          |
| `game.css` atau JS baru tidak didaftarkan di `sw.js`              | Aplikasi offline tampil tanpa gaya atau game tidak terbuka (butuh "OK", naikkan versi cache). |
| Layar game kalah tumpuk dari navigasi bawah atau tombol keranjang | Tombol bawah menutupi layar game; z-index harus di atas 30 (GM13).                            |
| Hamburger dipasang per layar, atau muncul di sub-layar            | Melanggar GM4 dan GM5; layar baru kehilangan hamburger atau header jadi berantakan.           |
| Game tetap terbuka setelah Keluar                                 | HP dipakai bergantian; layar sebelumnya terlihat orang berikutnya (GM14).                     |
| Teks lewat `innerHTML`                                            | Melanggar aturan keamanan (SEC-18).                                                           |
| Timer dibuat terlalu cepat seperti game lama                      | Ibu-ibu panik dan malas membuka lagi; tujuan game (betah) gagal (GM11).                       |
| Mengubah `kerangka.js` atau `home.md` untuk fitur ini             | Tidak perlu (GM14); menambah risiko pada fitur yang sudah jalan.                              |

---

## 7. Dampak dan pembatalan

- **Perubahan tampilan saja:** tidak menyentuh database, fungsi SQL, atau Edge Function. Tidak ada data pelanggan terlibat.
- **Pembatalan sangat mudah:** hapus tombol hamburger dan dua tag (`<link>`, `<script>`) dari `index.html`, hapus `game.css` dan JS baru, serta cabut dari `sw.js`. Tidak ada tabel atau data yang ikut hilang. Level tertinggi di localStorage HP pemain bisa dibiarkan.
- **Dokumen lain yang perlu blok susulan (GIM.05):**
  - `desain.md`: DS10 dan tabel pelanggaran soal hamburger; pengecualian DS7 (CSS game terpisah).
  - `bonus.md`: Catch the Vibes dan game lain sebagai kandidat.
  - `AGENTS.md` bagian 5 dan 12: daftarkan `docs/gim.md` (prefix GIM), serta pengecualian CSS terpisah di bagian 3 dan 6 (daftar berkas).
- **Bila game mengganggu:** sembunyikan hamburger dengan satu baris di `index.html`; isi game tidak perlu disentuh.

---

## 8. Ditunda

- Catch the Vibes dan game lain (`bonus.md`); kelompok Game di menu hamburger bila game kedua datang.
- Leaderboard atau skor bersama (butuh database, keputusan terpisah yang berisiko).
- Hamburger berisi item lain (Bantuan, Keluar, dll.).
- Suara, getar yang bisa diatur, dan pilihan tingkat kesulitan.

**Tidak dikerjakan:** hamburger di sub-layar (GM5); kode Firebase (GM8).

---

## 9. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

_(belum ada blok)_
