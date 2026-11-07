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
