/docs/home.md

# 🏠 home.md: Layar Home (Kartu Sampul, Sapaan, Bantuan, Pengaturan Akun)

> **Versi 1.1 (7 Nov 2026), hasil sesi strategi.** Bergantung pada `desain.md` (komponen, DS10, DS15), `akun.md` (layar Akun, Buku alamat, ganti password), dan kerangka layar utama (tab navigasi bawah per peran).
> **Status:** HM1 sampai HM12 disepakati ketua (7 Nov 2026) kecuali butir bertanda **(bawaan)** = pilihan penulis, boleh diubah sebelum dikerjakan. Belum ada yang dikerjakan.
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini + `desain.md`**. Kerjakan langkah di bagian 5. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 9.
> **Berkas yang diminta AI di awal sesi:** `public/kerangka.js`, `public/index.html`, `public/style.css`, `public/akun.js`, `public/akunmenu.js`, `public/alamat.js`, dan `public/sw.js`.
> **Tanpa kode.** **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Fitur ini Low-Risk (P2):** hanya tampilan, tanpa tabel, fungsi, atau Edge Function baru. Pengecualian: langkah yang menyentuh `akun.js` atau `sw.js` butuh "OK" ketua.
> **Prefix sheet:** HOM.

---

## 1. Tujuan

Setelah masuk, semua peran punya satu tempat yang jelas untuk "diri sendiri": logo warung, sapaan dan peran, bantuan, pengaturan akun, dan keluar. Tab **Home** menggantikan tab **Lainnya** (owner) dan **Akun** (customer, penjaga), supaya pengguna tidak tersesat dan fitur berikutnya tinggal mengisi tab yang sudah ada.

---

## 2. Keputusan

| No   | Keputusan                                                                                                                                                                                                                                                                                                                                                                                                                    | Dasar                                                         |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| HM1  | **Home menggantikan "Lainnya" dan "Akun"** di navigasi bawah. Owner: Order Masuk, Semua Order, Buat Order, Menu, **Home**. Customer: Pesan, Pesanan Saya, **Home**. Penjaga: Antrean, **Home**. Home di posisi paling kanan, tempat Lainnya dan Akun sebelumnya. **(bawaan untuk letaknya)**                                                                                                                                 | Keputusan ketua 7 Nov 2026. Menimpa DS10 dan DS15.            |
| HM2  | **Isi Home dari atas ke bawah:** kartu sampul, sapaan dan lencana peran, tombol Bantuan, daftar pengaturan akun, tombol Keluar. Satu tujuan per layar, tombol besar.                                                                                                                                                                                                                                                         | Keputusan ketua 7 Nov 2026; DS8, DS9.                         |
| HM3  | **Kartu sampul** (DS2, DS5): kartu marun gelap berisi logo ChATA. Komponen baru di `style.css`; dengan ini kartu sampul **dipakai**, jadi pertanyaan terbuka soal `.contoh-sampul` (Handoff desain.md) selesai. Penghapusan blok `.contoh-sampul` yang lama tetap butuh "OK" dan satu blok catatan.                                                                                                                          | Keputusan ketua 7 Nov 2026; `desain.md` Handoff #2 sampai #4. |
| HM4  | **Sapaan umum:** "Halo, {nama}, selamat datang di Kedai ChATA", dengan **lencana peran** (Owner, Penjaga, Customer) di sebelahnya. Lencana peran berpinggir marun, **bukan** warna lencana status (DS11). **Tanpa sapaan menurut jam** ("Selamat siang"): tidak dikerjakan, jadi tidak perlu waktu dari server. Jam HP tidak dipakai (`AGENTS.md` bagian 7). Hanya nama yang berasal dari server; kalimat sapaan teks tetap. | Keputusan ketua 7 Nov 2026; `AGENTS.md` bagian 7.             |
| HM5  | **Bantuan:** tombol di Home untuk semua peran. Layar Bantuan sendiri dikerjakan di `bantuan.md`; **sebelum itu selesai, tombol tampil sebagai "Segera"** (tidak bisa diketuk). Menggantikan letak Bantuan di DS15 (Akun dan Lainnya).                                                                                                                                                                                        | Keputusan ketua 7 Nov 2026; DS15.                             |
| HM6  | **Daftar pengaturan akun per peran:** Customer: Ganti nama, Ganti nomor WA, Ganti password, Buku alamat. Owner: Ringkasan order 7 hari (HM12), lalu Ganti password. Penjaga: Ganti password saja (server menolak ganti nama dan WA untuk staf, TMN.01). **Layar Akun dan Buku alamat yang sudah ada dipakai ulang**, tidak ditulis ulang.                                                                                    | Keputusan ketua 7 Nov 2026; `akun.md` AK7 sampai AK11.        |
| HM7  | **Owner: item Pelanggan** ("Pelanggan tanpa akun", dari `order.md`) pindah dari Lainnya ke Home, di bagian tersendiri sebelum pengaturan akun. Tampil "Segera" sampai `order.md` mengerjakannya. **(bawaan)**                                                                                                                                                                                                                | Akibat HM1 (Lainnya dihapus).                                 |
| HM8  | **Aktifkan Notifikasi:** tempatnya disiapkan di daftar pengaturan akun, tetapi item baru **ditampilkan setelah `notifikasi.md` selesai**. Tidak ada tombol palsu sebelum itu.                                                                                                                                                                                                                                                | Referensi tampilan ketua; `notifikasi.md`.                    |
| HM9  | **Teks sementara diganti:** kartu "Selamat datang... Anda berhasil masuk sebagai...", catatan profil lama, dan tombol "Pengaturan akun" tidak dipakai lagi di Home. Kata "selamat datang" kini hanya ada di sapaan baru (HM4).                                                                                                                                                                                               | Akibat HM2, HM4, dan HM6.                                     |
| HM10 | **Home tidak memanggil server baru.** Nama dan peran dari balasan `status` yang sudah dimuat. Semua teks dari server lewat `textContent`. Peran hanya menentukan item yang tampil; yang menolak akses sebenarnya server.                                                                                                                                                                                                     | `AGENTS.md` bagian 7; SEC-18.                                 |
| HM11 | **Tab yang terbuka setelah masuk** tetap tab kerja pertama (Order Masuk, Pesan, Antrean), bukan Home. Home dibuka lewat tabnya. **(bawaan)**                                                                                                                                                                                                                                                                                 | Kerja harian owner dan penjaga ada di tab pertama.            |
| HM12 | **Ringkasan order 7 hari (owner):** untuk sekarang hanya **tombol** di daftar pengaturan akun, **tepat di atas "Ganti password"**, hanya tampil untuk owner. Tampil sebagai **"Segera"** (tidak bisa diketuk) sampai layar ringkasannya dikerjakan di `bonus.md` B31. **(bawaan untuk status "Segera")**                                                                                                                     | Keputusan ketua 7 Nov 2026; `bonus.md` B31.                   |

Struktur tampilan referensi ketua dipakai sebagai **inspirasi susunan**; aset, teks, dan gamifikasinya tidak disalin (`desain.md` bagian "Referensi").

---

## 3. Prasyarat

Kerangka layar utama sudah terpasang (bilah atas, navigasi bawah per peran). `akun.md` selesai (layar Akun, Buku alamat, ganti password). Komponen dasar `desain.md` (kartu, tombol, daftar, lencana) tersedia di `style.css`.

---

## 4. Yang dibuat

| Komponen                 | Isi                                                                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tab Home (tiga peran)    | Pengganti Lainnya dan Akun di navigasi bawah (HM1).                                                                                                           |
| Kartu sampul             | Komponen logo di `style.css`, dipakai di Home (HM3).                                                                                                          |
| Sapaan dan lencana peran | "Halo, {nama}, selamat datang di Kedai ChATA"; nama dari `status`, lencana peran berpinggir marun (HM4).                                                      |
| Tombol Bantuan           | Tempat disiapkan, "Segera" sampai `bantuan.md` selesai (HM5).                                                                                                 |
| Daftar pengaturan akun   | Item per peran yang membuka layar Akun dan Buku alamat yang ada (HM6); tombol Ringkasan order 7 hari "Segera" untuk owner (HM12); item Pelanggan owner (HM7). |
| Tombol Keluar            | Di bagian paling bawah Home, berpinggir (sekunder) (DS9, DS12).                                                                                               |

---

## 5. Urutan pekerjaan (untuk TODO sheet, prefix HOM)

Langkah ⚠️ butuh penjelasan dampak dan "OK" ketua.

1. **HOM.01 ⚠️** Navigasi: ganti Lainnya dan Akun menjadi Home untuk tiga peran (HM1); panel Home masih sederhana. Menyentuh kerangka, dan `sw.js` bila ada berkas JS baru.
2. **HOM.02** Kartu sampul, sapaan umum "Halo, {nama}, selamat datang di Kedai ChATA", dan lencana peran (HM3, HM4).
3. **HOM.03** Tombol Bantuan sebagai tempat "Segera" (HM5).
4. **HOM.04** Daftar pengaturan akun per peran, tombol Ringkasan order 7 hari "Segera" untuk owner di atas Ganti password, item Pelanggan untuk owner, dan Keluar di bawah (HM6, HM7, HM12).
5. **HOM.05 ⚠️** Bersihkan sisa sementara: kartu "Selamat datang", catatan profil lama, tombol "Pengaturan akun", dan `.contoh-sampul` (HM9). Menyentuh `akun.js`; penghapusan kode butuh "OK" dan satu blok catatan.
6. **HOM.06** Cek tampilan Home di HP untuk tiga peran (owner, penjaga, customer), termasuk layar kecil dan keluar-masuk akun.
7. **HOM.07** Catat keputusan di dokumen terkait (blok susulan di `desain.md`, `akun.md`, `menu.md`, dan `bonus.md`; lihat bagian 7).

---

## 6. Aturan yang paling sering terlanggar

| Aturan                                                                                                     | Akibat bila dilanggar                                                                                  |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Sapaan "Selamat pagi/siang" dari jam HP                                                                    | Melanggar aturan waktu hanya dari server (`AGENTS.md` bagian 7). Sapaan Home memang dibuat umum (HM4). |
| Memasang nama pengguna lewat `innerHTML`                                                                   | Nama berisi tag bisa menjalankan skrip (SEC-18).                                                       |
| Item yang belum jalan (Bantuan, Pelanggan, Ringkasan order 7 hari, Notifikasi) tampil sebagai tombol aktif | Pengguna mengetuk dan tidak terjadi apa-apa; ibu-ibu bingung.                                          |
| Nama dan sapaan tersisa di layar setelah Keluar                                                            | HP dipakai bergantian; data pribadi terlihat orang berikutnya.                                         |
| Lencana peran memakai warna lencana status                                                                 | Tertukar dengan status order (DS11).                                                                   |
| Tombol Keluar dibuat isian marun atau di dekat tombol utama                                                | Salah pencet keluar (DS12).                                                                            |
| Menyembunyikan item untuk peran lain dianggap pengaman                                                     | Pengaman sebenarnya server; ini hanya kemudahan.                                                       |
| Tombol Ringkasan order 7 hari tampil untuk customer atau penjaga                                           | Peran salah melihat menu owner; hanya owner (HM12).                                                    |
| Berkas JS atau gambar baru tidak didaftarkan di `sw.js`                                                    | Aplikasi offline tampil tanpa bagian itu (butuh "OK", naikkan versi cache).                            |

---

## 7. Dampak dan pembatalan

- **Perubahan tampilan saja:** tidak menyentuh database, fungsi SQL, atau Edge Function. Dibatalkan dengan push ulang berkas lama.
- **Tab Akun dan Lainnya hilang dari navigasi;** layar Akun dan Buku alamat tetap ada dan dibuka dari Home.
- **Dokumen lain yang perlu blok susulan (HOM.07):**
  - `desain.md`: DS10 (Lainnya dan Akun menjadi Home) dan DS15 (pintu Bantuan pindah ke Home); kartu sampul dipakai (HM3).
  - `akun.md`: letak tombol Akun dan Buku alamat pindah ke Home.
  - `menu.md`: tab Menu owner sudah menempati posisi DS10; susunan owner kini Order Masuk, Semua Order, Buat Order, Menu, Home.
  - `bonus.md`: B31 (ringkasan order 7 hari) sebelumnya direncanakan di Lainnya; kini pintunya tombol di Home di atas Ganti password (HM12), isi layar tetap di B31.
  - `AGENTS.md` bagian 5 dan 12: daftarkan `docs/home.md` (prefix HOM) di peta dokumentasi.
- **Bila ada keluhan pengguna soal letak menu:** posisi Home dan tab pertama setelah masuk (HM1, HM11) mudah diubah tanpa menyentuh isi layar.

---

## 8. Ditunda

- Isi layar Ringkasan order 7 hari untuk owner (`bonus.md` B31); di Home hanya tombol "Segera" (HM12).
- Foto profil atau avatar.
- Pengaturan notifikasi lengkap (di `notifikasi.md`).
- Mode gelap dan pengaturan ukuran font.

**Tidak dikerjakan:** sapaan menurut jam ("Selamat siang"); sapaan Home dibuat umum (HM4).

---

## 9. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

_(belum ada blok)_

### Handoff #1 | 2026-11-07 | [Ketua]

**Tugas selesai:** HOM.01 dan HOM.02 (tinggal dicentang di sheet).

**File yang diubah:**

- HOM.01: `public/kerangka.js`, `public/index.html`.
- HOM.02: `public/style.css` (hanya menambah di akhir), `public/index.html`, `public/kerangka.js`, `public/akun.js` (satu baris; "OK" ketua diberikan di chat).
- `sw.js` tidak disentuh (tidak ada berkas baru; `chata-logo.png` sudah ada di cache). Hash commit belum dicatat.
- Kode lama tidak ada yang dihapus. Yang diganti dijadikan komentar bertanda `HOM.01` atau `HOM.02`.

**Isi:**

- HOM.01: tab Home (ikon rumah) menggantikan Lainnya (owner) dan Akun (customer, penjaga). Home memakai panel blok akun yang sudah ada (Buku alamat, Pengaturan akun, Keluar), untuk semua peran.
- HOM.02: kartu sampul (`.kartu-sampul`, logo ChATA di marun gelap dengan pendar dan hiasan emas), kartu sapaan "Halo, {nama}, selamat datang di Kedai ChATA", dan lencana peran (`.lencana-peran`, berpinggir marun, bukan warna lencana status). Nama dan peran lewat `textContent`; `akun.js` mengirim nama sebagai argumen kedua `atur(peran, nama)`, tanpa panggilan server baru. Nama dan lencana dibersihkan saat Keluar.

**Keputusan baru:**

- **HM1 berubah:** Home di posisi **paling kiri**, bukan paling kanan. Owner: Home, Order Masuk, Semua Order, Buat Order, Menu. Customer: Home, Pesan, Pesanan Saya. Penjaga: Home, Antrean. Menimpa HM1 dan DS10. Alasan belum tercatat.
- **HM11 berubah:** Home menjadi **halaman pertama setelah masuk** untuk semua peran (bukan tab kerja pertama). Alasan belum tercatat.
- **HM8 dikonfirmasi tetap:** item Aktifkan Notifikasi baru muncul setelah `notifikasi.md` selesai (tidak tampil sebagai "Segera").
- **HM3 terpenuhi:** kartu sampul baru dipakai, jadi pertanyaan terbuka soal `.contoh-sampul` (Handoff `desain.md`) terjawab: dipakai (komponen baru). Penghapusan `.contoh-sampul` yang lama tetap di HOM.05.

**Hasil tes:** HOM.01 dan HOM.02 dites di HP dan laptop dengan tiga peran (owner, penjaga, customer), sesuai. Bukti diperiksa di chat dan tidak disimpan.

**Belum beres:**

- Panel Lainnya (`panel-lainnya`, `lainnya-akun`) masih ada di `index.html` tetapi tidak terjangkau. Item Pelanggan dan Bantuan ("Segera") belum punya jalan masuk sampai HOM.03 dan HOM.04.
- Kartu "Selamat datang" lama hanya disembunyikan (`hidden`). `akun.js` masih mengisi `#sapaan` dan `#catatan-profil`. Penghapusan di HOM.05 (butuh "OK" dan satu blok catatan).
- Tombol Buku alamat, Pengaturan akun, dan Keluar masih bergaya lama; dirapikan di HOM.04.
- Komentar lama di `kerangka.js` dan `index.html` (tab Lainnya dan Akun) belum dibersihkan; ikut HOM.05 bila diizinkan.

**Saran giliran berikutnya:** HOM.03 (tombol Bantuan "Segera", Low-Risk), lalu HOM.04. Lampirkan `AGENTS.md` + `home.md` + `desain.md` + versi terbaru `public/kerangka.js`, `public/index.html`, `public/style.css` (+ `public/akun.js`, `public/akunmenu.js`, `public/alamat.js` untuk HOM.04). Sebelum push, cek tiga hal anti-nyasar. Logout GitHub dan Supabase di profil browser setelah selesai.

### Handoff #1a | 2026-11-07 | [RAC]

**Tugas selesai:** HOM.03 dan HOM.04 (tinggal dicentang di sheet).

**File yang diubah:** `public/index.html`, `public/kerangka.js`, `public/style.css` (hanya menambah di akhir). `sw.js` tidak disentuh (tidak ada berkas baru). Hash commit belum dicatat.

**Isi:**

- HOM.03: tombol Bantuan di Home untuk semua peran, tampil "Segera" dan tidak bisa diketuk (HM5).
- HOM.04: daftar pengaturan akun per peran lewat atribut `data-peran` di `index.html`, ditampilkan oleh `kerangka.js` (`aturItemHome`). Customer: Ganti nama, Ganti nomor WA, Ganti password, Buku alamat. Owner: bagian Pelanggan ("Segera"), lalu Ringkasan order 7 hari ("Segera") tepat di atas Ganti password. Penjaga: Ganti password saja. Keluar tetap paling bawah, diberi jarak. Item yang bisa diketuk memakai layar Akun dan Buku alamat yang sudah ada (`KedaiAkunMenu.tampil`, `KedaiAlamat.tampil`), tanpa panggilan server baru (HM10). Item peran lain disembunyikan, dan semuanya disembunyikan lagi saat Keluar.
- Kode lama tidak ada yang dihapus. Dua tombol lama (Buku alamat dan Pengaturan akun) hanya dibungkus `hidden`. Satu baris lama berubah: pembungkus tombol Keluar ditambah class `home-keluar`.

**Keputusan baru:**

- Ganti nama, Ganti nomor WA, dan Ganti password membuka layar Akun yang sama, lalu menggeser ke kartunya masing-masing. Alasan belum tercatat dari ketua; dipilih penulis kode karena HM6 meminta layar Akun dipakai ulang.
- HM8 tidak berubah: item Aktifkan Notifikasi belum ditampilkan sampai `notifikasi.md` selesai.

**Temuan di lapangan:** link reset password dari dashboard sempat menampilkan "Link sudah tidak berlaku" pada klik pertama. Log Auth menunjukkan link yang sama dibuka dua kali dalam satu detik (`/verify` 303 lalu 403 "One-time token not found"). Siapa pembuka pertamanya belum diketahui (pemindai link atau klik ganda). Link yang sama berhasil saat disalin dan ditempel ke address bar. Pengaturan Auth normal (Site URL, Redirect URLs, OTP 3600 detik). Satu `/recover` sempat 504 lalu berhasil diulang; diamati saja. Cara kirim link reset dicatat di `akun.md` pada HOM.07 (belum ditulis).

**Hasil tes:** HOM.03 dan HOM.04 dites dengan checklist HOM.06 untuk tiga peran (customer, owner, penjaga), sesuai. Bukti diperiksa di chat dan tidak disimpan.

**Belum beres:**

- HOM.05 menunggu "OK" ketua untuk daftar penghapusan: kartu "Selamat datang" tersembunyi (`#sapaan`, `#catatan-profil`), dua tombol lama, kode pengisinya di `akun.js`, satu baris pendengar di `akunmenu.js` dan `alamat.js`, dua baris reset di `kerangka.js`, dan `.contoh-sampul` di `style.css`. Perlu satu blok catatan.
- Panel Lainnya (`panel-lainnya`, `lainnya-akun`) masih ada di `index.html` dan tidak terjangkau; tidak termasuk daftar HOM.05, tanyakan ketua apakah ikut dihapus.
- HOM.06 diulang setelah HOM.05, jangan dicentang dulu. HOM.07 belum dikerjakan.

**Saran giliran berikutnya:** HOM.05 (butuh "OK" ketua; enam berkas, bagi dua giliran). Lampirkan `AGENTS.md` + `home.md` + `desain.md` + versi terbaru `public/index.html`, `public/kerangka.js`, `public/style.css`, `public/akun.js`, `public/akunmenu.js`, `public/alamat.js`. Sebelum push, cek tiga hal anti-nyasar. Logout GitHub dan Supabase di profil browser setelah selesai.

### Handoff #2 | 2026-11-07 | [RAC]

**Tugas selesai:** HOM.03 dan HOM.04 (tinggal dicentang di sheet).

**File yang diubah:** `public/index.html`, `public/kerangka.js`, `public/style.css` (hanya menambah di akhir). `sw.js` tidak disentuh (tidak ada berkas baru). Hash commit belum dicatat.

**Isi (bahasa sederhana):**

- HOM.03: tombol **Bantuan** ada di Home untuk semua peran. Tulisannya "Segera" dan belum bisa diketuk.
- HOM.04: Home sekarang berisi tombol-tombol per peran.
  - Customer: Bantuan, **Pengaturan akun**, Buku alamat, Keluar.
  - Owner: Bantuan, Pelanggan (Segera), Ringkasan order 7 hari (Segera), **Pengaturan akun**, Keluar.
  - Penjaga: Bantuan, **Pengaturan akun**, Keluar.
- Ketuk **Pengaturan akun** membuka satu halaman Akun yang sudah ada. Customer melihat ganti nama, nomor WA, dan password. Owner dan penjaga hanya password. Buku alamat tetap tombol sendiri untuk customer.
- Tidak ada kode lama yang dihapus. Tiga item yang sempat dibuat (Ganti nama, Ganti nomor WA, Ganti password) diganti satu tombol Pengaturan akun dan dijadikan komentar di `index.html`. Dua tombol lama (Buku alamat dan Pengaturan akun) hanya disembunyikan. Satu baris lama berubah: pembungkus tombol Keluar diberi class `home-keluar` untuk jarak.

**Keputusan baru:**

- **HM6 dan HM9 berubah:** Home memakai **satu tombol "Pengaturan akun"** yang membuka satu halaman Akun, bukan tiga tombol terpisah (Ganti nama, Ganti nomor WA, Ganti password). Hal lain di luar akun (Bantuan, Pelanggan, Ringkasan order 7 hari, Buku alamat) tetap tombol sendiri di Home. Ketua menyatakan susunan ini lebih sesuai setelah melihat screenshot. Menimpa HM6 dan HM9.
- HM8 tidak berubah: Aktifkan Notifikasi belum ditampilkan sampai `notifikasi.md` selesai.

**Temuan di lapangan:** link reset password dari dashboard sempat tampil "Link sudah tidak berlaku" pada klik pertama dari email. Log Auth menunjukkan link yang sama dibuka dua kali dalam satu detik, jadi token sekali pakai sudah habis. Siapa pembuka pertamanya belum diketahui. Link yang sama berhasil saat disalin dan ditempel ke address bar. Pengaturan Auth normal (Site URL, Redirect URLs, masa berlaku 3600 detik). Cara aman mengirim link reset akan dicatat di `akun.md` pada HOM.07.

**Hasil tes:** HOM.03 dan HOM.04 dites untuk tiga peran (customer, owner, penjaga) dan aman. Tampilan revisi (satu tombol Pengaturan akun) sudah dilihat dan disetujui ketua lewat screenshot. Bukti diperiksa di chat dan tidak disimpan.

**Belum beres:**

- **HOM.05** menunggu "OK" ketua. Daftar yang akan dihapus: kartu "Selamat datang" tersembunyi (`#sapaan`, `#catatan-profil`) dan kode pengisinya di `akun.js`; dua tombol lama (Buku alamat, Pengaturan akun) beserta satu baris pendengar di `akunmenu.js` dan `alamat.js`; komentar tiga item lama di `index.html` dan tiga aksi tak terpakai di `kerangka.js` (`akun-nama`, `akun-wa`, `akun-pw`); dua baris pembersih di `kerangka.js`; `.contoh-sampul` di `style.css`. Perlu satu blok catatan.
- Panel Lainnya (`panel-lainnya`, `lainnya-akun`) masih ada di `index.html` dan tidak terjangkau; tidak ada di daftar HOM.05, tanyakan ketua apakah ikut dihapus.
- **HOM.06** diulang setelah HOM.05, jangan dicentang dulu. **HOM.07** belum dikerjakan (catatan HM6 dan HM9 berubah, serta catatan link reset).

**Saran giliran berikutnya:** HOM.05 (butuh "OK" ketua; enam berkas, bagi dua giliran). Lampirkan `AGENTS.md` + `home.md` + `desain.md` + versi terbaru `public/index.html`, `public/kerangka.js`, `public/style.css`, `public/akun.js`, `public/akunmenu.js`, `public/alamat.js`. Sebelum push, cek tiga hal anti-nyasar. Logout GitHub dan Supabase di profil browser setelah selesai.

### 2026-11-07: HOM.05 selesai, sisa tampilan sementara dihapus

**Persetujuan:** "OK" ketua untuk daftar penghapusan diberikan di chat. HOM.05 sudah dicentang di sheet.

**Dihapus:**

- `akun.js`: sapaan lama (`#sapaan`) beserta variabel `label`, blok tombol Buku alamat dan tombol Akun, dan blok `#catatan-profil`. Kartu Ganti nama dan Ganti nomor WA (TMN.01) tetap.
- `akunmenu.js` dan `alamat.js`: masing-masing satu baris pendengar tombol lama (`tombol-akun`, `tombol-buku-alamat`).
- `kerangka.js`: tiga aksi tak terpakai (`akun-nama`, `akun-wa`, `akun-pw`) dan dua pembersih `#sapaan` dan `#catatan-profil` di `reset()`. Aksi `akun` dan `alamat` tetap.
- `index.html`: kartu "Selamat datang" yang tersembunyi, dua tombol lama beserta pembungkusnya, dan komentar tiga item lama.
- `style.css`: `.contoh-sampul` dan `.contoh-sampul__nama`. Ini menutup pertanyaan terbuka `.contoh-sampul` di `desain.md` (kartu sampul baru sudah dipakai, HM3).

**Urutan (dua giliran):** giliran A: `akun.js`, `akunmenu.js`, `alamat.js`. Giliran B: `kerangka.js`, `index.html`, `style.css`, dipush bersamaan. JS dihapus lebih dulu karena beberapa baris memanggil id lama tanpa pengaman; bila HTML dihapus duluan, aplikasi bisa error saat dibuka.

**Sengaja dibiarkan:**

- Panel Lainnya (`panel-lainnya`, `lainnya-akun`) di `index.html`: tidak terjangkau dan tidak berbahaya. Bila dihapus nanti, daftar `PANEL` di `kerangka.js` ikut diubah.
- `LABEL_PERAN` di `akun.js` kini tidak dipakai.
- Komentar lama yang sudah basi di bagian atas `akunmenu.js`, `alamat.js`, `kerangka.js`, dan `index.html` (masih menyebut tombol atau id lama).

**Hasil tes:** giliran A dites di HP dan laptop dengan tiga peran; giliran B dites di HP Android dan laptop. Semua aman. Bukti diperiksa di chat dan tidak disimpan.

### 2026-11-10: Keluar pindah ke bilah atas, Bantuan dapat pintu kedua

**Berkas tujuan:** `docs/home.md` bagian 9. Menimpa bagian Keluar pada HM2, HM4 (komponen Home), dan HOM.04. Sumber: `desain.md` blok 10 Nov. Yang paling akhir menang.

- Tombol **Keluar di Home disembunyikan** (`hidden`, kode tidak dihapus; ketua menyetujui penyembunyian 10 Nov 2026). Keluar kini ikon di bilah atas dengan konfirmasi (`desain.md` blok 10 Nov).
- **Pembersihan** kode Keluar di Home ditunda; bila dikerjakan nanti, butuh "OK" tersendiri dan satu blok catatan.
- Tombol **Bantuan di Home tetap** ("Segera"), diaktifkan di BTN.03 ke layar yang sama dengan ikon ?.
- Aturan "Tombol Keluar jangan dekat tombol utama" (DS12) kini berlaku untuk dialog konfirmasi, bukan lagi untuk Home.
- Isi Home selebihnya tidak berubah.

### 2026-11-14: Pil gelar dan tombol Gelar Saya di Home customer

Keputusan ketua (sesi strategi 14 Nov 2026). Sumber: docs/gelar.md GL17 dan GL18. Yang paling akhir menang.

- **Kartu sapaan customer** bertambah satu baris pil gelar di bawah teks sapaan (gelar tingkat pil emas, gelar menu pil kecil). Tidak muncul bila belum punya gelar. Lencana CUSTOMER tetap di kanan.
- **Tombol "Gelar Saya"** (customer saja) tepat di bawah kartu sapaan, di atas Bantuan. Membuka layar tersembunyi dengan tombol Kembali ke Home.
- **HM10 ("Home tidak memanggil server baru") dikecualikan untuk customer:** Home memanggil `gelar_saya` saat dibuka dan lewat Segarkan, satu panggilan tambahan.
- Owner dan penjaga tidak berubah.

### 2026-11-14: Tombol QRIS di Home (semua peran)

**Berkas tujuan:** `docs/home.md`, Catatan Susulan. Sumber: `docs/qris.md` (QR2, QR3). Yang paling akhir menang.

- Home mendapat tombol **"Bayar dengan QRIS"** untuk **semua peran**, tepat di atas tombol Bantuan. Mengetuknya membuka pop-up berisi gambar QRIS (tanpa pindah layar).
- **Urutan (bawaan, ketua boleh membalik):** customer: kartu sapaan, Gelar Saya, QRIS, Bantuan. Owner dan penjaga: kartu sapaan, QRIS, Bantuan. Ini menggeser "Gelar Saya tepat di atas Bantuan" di `gelar.md` GL18; yang paling akhir menang.
- Tombol selalu tampil dan bisa diketuk. Pop-up ikut tertutup saat Keluar.

### 2026-11-14: Tata letak Home disusun ulang (HOM.08)

Permintaan tim, dikerjakan di sesi kode 14 Nov 2026. Menimpa urutan tombol di blok "Tombol QRIS di Home" (14 Nov) dan penempatan Gelar Saya (blok "Pil gelar dan tombol Gelar Saya"). Yang paling akhir menang.

- **Alasan:** tombol Aktifkan notifikasi di Home customer tidak kelihatan tanpa menggulir layar.
- **Urutan baru Home (dari atas):** kartu sampul (logo dikecilkan, sekitar 110 px dari 180 px), kartu sapaan, tombol **Aktifkan notifikasi** (1 baris penuh), baris **3 tombol** (emoji di atas, teks di bawah), lalu daftar pengaturan seperti sebelumnya.
- **Baris 3 tombol:** 🏅 **Gelar** (membuka layar Gelar Saya), 💳 **QRIS** (membuka pop-up QRIS), ❓ **Bantuan** (membuka layar Bantuan). **Customer: 3 kolom. Owner dan penjaga: 2 kolom** (QRIS dan Bantuan), melebar rata karena tombol Gelar khusus customer.
- **Label berubah:** "Gelar Saya" menjadi "Gelar" dan "Bayar dengan QRIS" menjadi "QRIS" di tombol Home. Judul layar tetap "Gelar Saya"; isi pop-up QRIS tidak berubah.
- Tombol yang sudah aktif/diblokir notifikasinya (tombol hilang) tidak meninggalkan ruang kosong.
- **Kode:** hanya `public/index.html` dan `public/style.css` (blok `HOM.06`, hanya tambahan). Id dan `data-aksi` tombol dipertahankan (`home-gelar`, `home-qris`, `home-bantuan`, `home-notif-bungkus`), jadi `kerangka.js`, `qris.js`, dan `notif.js` tidak berubah. `sw.js` tidak disentuh (tidak ada berkas baru). Blok tombol lama dijadikan komentar, tidak dihapus.
- **Tes:** HP dan laptop, tiga peran, termasuk mode pesawat, sesuai. Bukti diperiksa di chat dan tidak disimpan.

---
