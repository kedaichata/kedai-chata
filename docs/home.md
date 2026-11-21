/docs/home.md

# 🏠 home.md: Layar Home (Kartu Sampul, Sapaan, Tombol Cepat, Pengaturan Akun)

> **Versi 1.2 (21 Nov 2026), hasil sesi strategi.** Bergantung pada `desain.md` (komponen, DS10, DS15), `akun.md` (layar Akun, Buku alamat, ganti password), dan kerangka layar utama (tab navigasi bawah per peran).
> **Status:** HM1 sampai HM12 disepakati ketua. Butir **(bawaan)** = pilihan penulis, boleh diubah. HOM.01 sampai HOM.08 selesai. Tombol Bagikan masih rencana (HM2, SHR.05).
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini + `desain.md`**. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 9.
> **Berkas yang diminta AI di awal sesi:** `public/kerangka.js`, `public/index.html`, `public/style.css`, `public/akun.js`, `public/akunmenu.js`, `public/alamat.js`, dan `public/sw.js`.
> **Tanpa kode.** **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Fitur ini Low-Risk (P2):** hanya tampilan, tanpa tabel, fungsi, atau Edge Function baru. Pengecualian: langkah yang menyentuh `akun.js` atau `sw.js` butuh "OK" ketua.
> **Prefix sheet:** HOM.

---

## 1. Tujuan

Setelah masuk, semua peran punya satu tempat yang jelas untuk "diri sendiri": logo warung, sapaan dan peran, tombol cepat (QRIS, Bantuan, Gelar), dan pengaturan akun. Tab **Home** menggantikan tab **Lainnya** (owner) dan **Akun** (customer, penjaga), supaya pengguna tidak tersesat dan fitur berikutnya tinggal mengisi tab yang sudah ada.

---

## 2. Keputusan

| No   | Keputusan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Dasar                                                                                                                                                                                                                                                                                   |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HM1  | **Home menggantikan "Lainnya" dan "Akun"** di navigasi bawah, di posisi **paling kiri**. Owner: Home, Order Masuk, Semua Order, Buat Order, Menu. Customer: Home, Pesan, Pesanan Saya. Penjaga: Home, Antrean.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Keputusan ketua 7 Nov 2026; letak paling kiri: alasan belum tercatat. Menimpa DS10 dan DS15.                                                                                                                                                                                            |
| HM2  | **Isi Home dari atas ke bawah:** kartu sampul, kartu sapaan (lencana peran dan, untuk customer, pil gelar), tombol **Aktifkan notifikasi** (satu baris penuh, semua peran), baris tombol bergambar, lalu daftar pengaturan akun per peran. **Baris tombol bergambar** (emoji di atas, teks di bawah): customer 3 kolom (Gelar, QRIS, Bantuan); owner dan penjaga 2 kolom (QRIS, Bantuan), melebar rata. **Keluar tidak ada di Home:** ikon di bilah atas dengan dialog konfirmasi (`desain.md` blok 10 Nov); tombol Keluar di Home disembunyikan, kodenya tidak dihapus. Satu tujuan per layar, tombol besar. **Rencana (SHR.05):** satu tombol lebar **Bagikan** di bawah tombol Aktifkan notifikasi dan di atas baris tombol bergambar, untuk customer dan owner; membuka layar tersembunyi dengan tombol Kembali ke Home. Penjaga belum diputuskan (`bagikan.md` K1), bawaan sementara penjaga tidak melihat tombol. | Keputusan ketua 7 Nov 2026 dan 10 Nov 2026; HOM.08 (permintaan tim 14 Nov 2026: tombol notifikasi customer tidak kelihatan tanpa menggulir); `desain.md` DS8, DS9, DS12 (kini untuk dialog konfirmasi); `bagikan.md` SH20 (rancangan disetujui ketua 21 Nov 2026 kecuali soal penjaga). |
| HM3  | **Kartu sampul** (DS2, DS5): kartu marun gelap berisi logo ChATA (sekitar 110 px) dengan pendar dan hiasan emas. Komponen `.kartu-sampul` di `style.css`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Keputusan ketua 7 Nov 2026; HOM.08.                                                                                                                                                                                                                                                     |
| HM4  | **Sapaan umum:** "Halo, {nama}, selamat datang di Kedai ChATA", dengan **lencana peran** (Owner, Penjaga, Customer) di sebelahnya (`.lencana-peran`). Lencana berpinggir marun, **bukan** warna lencana status (DS11). **Tanpa sapaan menurut jam**: tidak dikerjakan, jadi tidak perlu waktu dari server, dan jam HP tidak dipakai (`AGENTS.md` bagian 7). Hanya nama yang berasal dari server; nama dan lencana dibersihkan saat Keluar. **Customer:** satu baris pil gelar di bawah teks sapaan (gelar tingkat pil emas, gelar menu pil kecil), tidak muncul bila belum punya gelar.                                                                                                                                                                                                                                                                                                                                 | Keputusan ketua 7 Nov 2026 dan 14 Nov 2026; `AGENTS.md` bagian 7; `gelar.md` GL17.                                                                                                                                                                                                      |
| HM5  | **Bantuan:** tombol di Home untuk semua peran (❓ di baris tombol bergambar), aktif ke layar Bantuan (`bantuan.md`). Ikon ? di bilah atas membuka layar yang sama.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Keputusan ketua 7 Nov 2026; DS15; `bantuan.md` BT1.                                                                                                                                                                                                                                     |
| HM6  | **Daftar pengaturan akun per peran:** Customer: satu tombol **Pengaturan akun** (satu halaman Akun berisi ganti nama, ganti nomor WA, ganti password) dan tombol **Buku alamat** sendiri. Owner: **Pelanggan** (HM7), **Ringkasan order 7 hari** (HM12), lalu Pengaturan akun (hanya ganti password). Penjaga: Pengaturan akun (hanya ganti password; server menolak ganti nama dan WA untuk staf, TMN.01). **Layar Akun dan Buku alamat yang sudah ada dipakai ulang**, tidak ditulis ulang.                                                                                                                                                                                                                                                                                                                                                                                                                           | Keputusan ketua 7 Nov 2026 (susunan satu tombol Pengaturan akun dilihat ketua lewat screenshot); `akun.md` AK7 sampai AK11.                                                                                                                                                             |
| HM7  | **Owner: item Pelanggan** ("Pelanggan tanpa akun", `order.md`) ada di Home dalam bagian tersendiri sebelum pengaturan akun, aktif ke layar Pelanggan tanpa akun. **(bawaan)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Akibat HM1 (Lainnya dihapus); konfirmasi ketua 21 Nov 2026 bahwa item aktif dan sudah dites.                                                                                                                                                                                            |
| HM8  | **Aktifkan Notifikasi:** tombol satu baris penuh di bawah kartu sapaan (`notifikasi.md`). Hilang bila notifikasi sudah aktif atau diblokir, tanpa meninggalkan ruang kosong.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Referensi tampilan ketua; HOM.08; konfirmasi ketua 21 Nov 2026.                                                                                                                                                                                                                         |
| HM9  | **Tidak ada teks sementara di Home:** kartu "Selamat datang... Anda berhasil masuk sebagai...", catatan profil lama, dan tombol pengaturan lama dihapus (HOM.05). Kata "selamat datang" hanya ada di sapaan (HM4). Pengaturan akun lewat satu tombol (HM6).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Keputusan ketua 7 Nov 2026.                                                                                                                                                                                                                                                             |
| HM10 | **Home tidak memanggil server baru.** Nama dan peran dari balasan `status` yang sudah dimuat. Semua teks dari server lewat `textContent`. Peran hanya menentukan item yang tampil; yang menolak akses sebenarnya server. **Pengecualian customer:** Home memanggil `gelar_saya` saat dibuka dan lewat Segarkan (satu panggilan tambahan).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `AGENTS.md` bagian 7; SEC-18; `gelar.md` GL17.                                                                                                                                                                                                                                          |
| HM11 | **Halaman pertama setelah masuk adalah Home** untuk semua peran. **(bawaan)**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Alasan belum tercatat.                                                                                                                                                                                                                                                                  |
| HM12 | **Ringkasan order 7 hari (owner):** tombol di daftar pengaturan akun, **tepat di atas Pengaturan akun**, hanya tampil untuk owner, aktif ke layar Ringkasan (`ringkasan.md`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Keputusan ketua 7 Nov 2026; `ringkasan.md`; konfirmasi ketua 21 Nov 2026.                                                                                                                                                                                                               |

Struktur tampilan referensi ketua dipakai sebagai **inspirasi susunan**; aset, teks, dan gamifikasinya tidak disalin (`desain.md` bagian "Referensi").

---

## 3. Prasyarat

Kerangka layar utama sudah terpasang (bilah atas, navigasi bawah per peran). `akun.md` selesai (layar Akun, Buku alamat, ganti password). Komponen dasar `desain.md` (kartu, tombol, daftar, lencana) tersedia di `style.css`.

---

## 4. Yang dibuat

| Komponen                   | Isi                                                                                                                                                                                                                                                                                                                                   |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tab Home (tiga peran)      | Pengganti Lainnya dan Akun di navigasi bawah, paling kiri, halaman pertama setelah masuk (HM1, HM11).                                                                                                                                                                                                                                 |
| Kartu sampul               | Komponen logo di `style.css` (HM3).                                                                                                                                                                                                                                                                                                   |
| Kartu sapaan               | "Halo, {nama}, selamat datang di Kedai ChATA"; lencana peran berpinggir marun; pil gelar untuk customer (HM4).                                                                                                                                                                                                                        |
| Tombol Aktifkan notifikasi | Satu baris penuh di bawah kartu sapaan (HM8).                                                                                                                                                                                                                                                                                         |
| Baris tombol bergambar     | Customer: Gelar (layar Gelar Saya dengan tombol Kembali ke Home), QRIS (pop-up gambar QRIS tanpa pindah layar, ikut tertutup saat Keluar), Bantuan. Owner dan penjaga: QRIS dan Bantuan (HM2, HM5). Judul layar Gelar tetap "Gelar Saya". Id dan `data-aksi` tombol: `home-gelar`, `home-qris`, `home-bantuan`, `home-notif-bungkus`. |
| Daftar pengaturan akun     | Per peran: Pengaturan akun dan Buku alamat (customer), Pelanggan dan Ringkasan order 7 hari (owner), Pengaturan akun (penjaga) (HM6, HM7, HM12). Memakai layar Akun dan Buku alamat yang ada.                                                                                                                                         |
| Keluar                     | Ikon di bilah atas dengan dialog konfirmasi (HM2).                                                                                                                                                                                                                                                                                    |
| Tombol Bagikan             | Rencana, belum dikerjakan (HM2, SHR.05).                                                                                                                                                                                                                                                                                              |

---

## 5. Urutan pekerjaan (untuk TODO sheet, prefix HOM)

Langkah ⚠️ butuh penjelasan dampak dan "OK" ketua.

1. **HOM.01 ⚠️ (selesai)** Navigasi: ganti Lainnya dan Akun menjadi Home untuk tiga peran (HM1). Menyentuh kerangka, dan `sw.js` bila ada berkas JS baru.
2. **HOM.02 (selesai)** Kartu sampul, sapaan umum, dan lencana peran (HM3, HM4).
3. **HOM.03 (selesai)** Tombol Bantuan di Home (HM5); tombolnya kini aktif ke layar Bantuan.
4. **HOM.04 (selesai)** Daftar pengaturan akun per peran, tombol Ringkasan order 7 hari untuk owner, item Pelanggan untuk owner (HM6, HM7, HM12).
5. **HOM.05 ⚠️ (selesai)** Bersihkan sisa sementara: kartu "Selamat datang", catatan profil lama, tombol lama, dan `.contoh-sampul` (HM9). Menyentuh `akun.js`; penghapusan kode butuh "OK" dan satu blok catatan.
6. **HOM.06 (selesai)** Cek tampilan Home di HP untuk tiga peran, termasuk layar kecil dan keluar-masuk akun (nama dan sapaan hilang setelah Keluar).
7. **HOM.07 (selesai)** Catat keputusan di dokumen terkait (bagian 7).
8. **HOM.08 (selesai)** Susun ulang tata letak Home (permintaan tim, 14 Nov 2026): logo diperkecil, tombol Aktifkan notifikasi satu baris penuh di bawah sapaan, tombol Gelar, QRIS, dan Bantuan dalam satu baris (customer 3 kolom, owner dan penjaga 2 kolom) dengan emoji dan teks (HM2).

---

## 6. Aturan yang paling sering terlanggar

| Aturan                                                           | Akibat bila dilanggar                                                                           |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Sapaan "Selamat pagi/siang" dari jam HP                          | Melanggar aturan waktu hanya dari server (`AGENTS.md` bagian 7). Sapaan Home dibuat umum (HM4). |
| Memasang nama pengguna lewat `innerHTML`                         | Nama berisi tag bisa menjalankan skrip (SEC-18).                                                |
| Item yang belum jalan tampil sebagai tombol aktif                | Pengguna mengetuk dan tidak terjadi apa-apa; ibu-ibu bingung.                                   |
| Nama dan sapaan tersisa di layar setelah Keluar                  | HP dipakai bergantian; data pribadi terlihat orang berikutnya.                                  |
| Lencana peran memakai warna lencana status                       | Tertukar dengan status order (DS11).                                                            |
| Tombol Keluar ditaruh di dekat tombol utama                      | Salah pencet keluar (DS12); dialog konfirmasi wajib.                                            |
| Menyembunyikan item untuk peran lain dianggap pengaman           | Pengaman sebenarnya server; ini hanya kemudahan.                                                |
| Tombol Ringkasan order 7 hari tampil untuk customer atau penjaga | Peran salah melihat menu owner; hanya owner (HM12).                                             |
| Berkas JS atau gambar baru tidak didaftarkan di `sw.js`          | Aplikasi offline tampil tanpa bagian itu (butuh "OK", naikkan versi cache).                     |

---

## 7. Dampak dan pembatalan

- **Perubahan tampilan saja:** tidak menyentuh database, fungsi SQL, atau Edge Function. Dibatalkan dengan push ulang berkas lama.
- **Tab Akun dan Lainnya tidak ada di navigasi;** layar Akun dan Buku alamat tetap ada dan dibuka dari Home.
- **Dokumen terkait keputusan Home:** `desain.md` (DS10, DS15, kartu sampul dipakai), `akun.md` (letak Akun dan Buku alamat di Home), `menu.md` (susunan tab owner), `bonus.md` (B31), `gelar.md` (GL17, GL18), `qris.md`, `bagikan.md`, dan `AGENTS.md` bagian 5 dan 12 (`docs/home.md`, prefix HOM).
- **Bila ada keluhan pengguna soal letak menu:** posisi Home dan halaman pertama setelah masuk (HM1, HM11) mudah diubah tanpa menyentuh isi layar.

---

## 8. Ditunda

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

**Tugas:** HOM.01 dan HOM.02 selesai, dites di HP dan laptop untuk tiga peran.
**Hasil:** tab Home menggantikan Lainnya dan Akun; kartu sampul, sapaan, dan lencana peran terpasang. Nama lewat `textContent` dan dibersihkan saat Keluar.
**Keputusan:** Home paling kiri (HM1) dan Home sebagai halaman pertama setelah masuk (HM11), alasan belum tercatat. Kartu sampul terpakai (HM3).

### Handoff #1a | 2026-11-07 | [RAC]

**Tugas:** HOM.03 dan HOM.04 selesai, dites untuk tiga peran. Item per peran diatur lewat atribut `data-peran` di `index.html` dan ditampilkan oleh `kerangka.js`; layar Akun dan Buku alamat dipakai ulang tanpa panggilan server baru (HM10).
**Temuan di lapangan:** link reset password dari dashboard sempat tampil "Link sudah tidak berlaku" pada klik pertama dari email. Log Auth menunjukkan link yang sama dibuka dua kali dalam satu detik (token sekali pakai sudah habis); siapa pembuka pertamanya belum diketahui. Link yang sama berhasil saat disalin dan ditempel ke address bar. Pengaturan Auth normal (Site URL, Redirect URLs, masa berlaku 3600 detik).

### Handoff #2 | 2026-11-07 | [RAC]

**Tugas:** HOM.03 dan HOM.04 diselesaikan dengan susunan satu tombol Pengaturan akun (HM6, HM9), disetujui ketua lewat screenshot. HOM.05 sampai HOM.08 selesai (sheet Home 8 dari 8); sisa tampilan sementara dihapus dan Home disusun ulang (HM2).

**Hasil yang terbukti:**

- Tiga peran (customer, owner, penjaga) dites di HP dan laptop, termasuk HOM.08 dengan mode pesawat.
- Item Pelanggan, Ringkasan order 7 hari, dan Aktifkan notifikasi aktif untuk peran yang bersangkutan dan sudah dites (ketua, 21 Nov 2026).

**Daftar butir yang masih terbuka (satu baris per butir):**

- Home owner belum dilihat langsung (kabar anggota tim: di bawah tombol Aktifkan notifikasi hanya ada dua tombol bergambar, QRIS dan Bantuan). Minta screenshot Home owner dengan data dummy sebelum `kerangka.js` diubah di SHR.05.
- Tombol Bagikan belum dikerjakan (SHR.05); soal penjaga belum diputuskan (`bagikan.md` K1), bawaan sementara penjaga tidak melihat tombol.
- Panel Lainnya (`panel-lainnya`, `lainnya-akun`) masih ada di `index.html` dan tidak terjangkau; menghapusnya butuh "OK" dan daftar `PANEL` di `kerangka.js` ikut diubah.
- Kode Keluar di Home hanya disembunyikan; pembersihannya ditunda dan butuh "OK" tersendiri serta satu blok catatan.
- `LABEL_PERAN` di `akun.js` tidak dipakai, dan komentar lama yang basi masih ada di `akunmenu.js`, `alamat.js`, `kerangka.js`, dan `index.html`.
- Penyebab link reset password yang terbuka dua kali belum diketahui.

**Saran giliran berikutnya:** SHR.05 (tombol Bagikan): lampirkan `AGENTS.md` + `home.md` + `bagikan.md` + `desain.md` serta versi terbaru `public/kerangka.js`, `public/index.html`, `public/style.css`. Minta screenshot Home owner dengan data dummy lebih dulu.
