/docs/menu.md

# 🍱 menu.md: Daftar Menu, Harga, dan Tersedia/Habis

> **Versi 1.0 (4 Nov 2026), hasil sesi strategi.** Bergantung pada `akun.md` (peran owner dikenali server) dan `database.md`.
> **Status:** MN1 sampai MN9 disepakati ketua (sesi strategi 4 Nov 2026). Butir **(bawaan)** = pilihan penulis, boleh diubah sebelum dikerjakan. Belum ada yang dikerjakan.
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini** (+ `database.md` untuk langkah tabel dan fungsi). Kerjakan langkah di bagian 5. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 9.
> **Berkas yang diminta AI di awal sesi:** berkas migration terbaru, `supabase/functions/kedai/`, dan berkas JS menu bila sudah ada.
> **Tanpa kode dan tanpa isi SQL.** **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Fitur ini High-Risk (P0) di sisi harga:** harga memengaruhi total order. Tampilan menu sendiri Low-Risk.

---

## 1. Tujuan

Owner mengelola daftar menu sendiri lewat aplikasi (tanpa menunggu ketua), dan customer, penjaga, serta wizard owner memakai daftar yang sama. Menu dan harga di warung sering berubah, jadi pengelolaannya harus mudah untuk owner non-IT.

---

## 2. Keputusan

| No  | Keputusan                                                                                                                                                                                                                                                    | Dasar                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| MN1 | **Owner mengelola menu lewat aplikasi:** tambah, ubah nama dan harga, tombol **Tersedia/Habis**, dan **nonaktifkan** menu. Customer dan penjaga hanya melihat. Semua owner setara.                                                                           | Keputusan ketua 4 Nov 2026.                                                |
| MN2 | Tiap menu: **nama** (3 sampai 40 karakter), **harga** (rupiah, bilangan bulat, lebih dari 0 dan di bawah batas wajar), **Tersedia/Habis**, **aktif/nonaktif**, dan **foto (opsional)**. **Tanpa kategori** di versi 1. **(bawaan)**                          | Keputusan ketua (foto opsional); kategori masuk `bonus.md`.                |
| MN3 | **Habis** = menu tetap tampil ke customer tapi abu-abu dan tidak bisa dipilih. **Nonaktif** = tidak tampil di daftar customer dan wizard (pengganti hapus). Menu **tidak pernah dihapus** (order lama merujuk ke menu).                                      | `AGENTS.md` bagian 7 (tanpa DELETE).                                       |
| MN4 | **Harga selalu dihitung server.** Aplikasi tidak pernah mengirim harga atau total, hanya id menu dan jumlah. Saat order dibuat, **nama dan harga satuan disalin ke order**, jadi mengubah harga atau nama menu tidak mengubah order lama.                    | `security.md` aturan 2; SEC-12.                                            |
| MN5 | Semua aksi menu memakai Edge Function `kedai`: `menu_daftar` (semua peran), `menu_simpan`, `menu_stok` (Tersedia/Habis), `menu_nonaktif` (owner saja). Server memeriksa peran dari tabel `staf`.                                                             | `database.md` bagian 5.                                                    |
| MN6 | **Foto menu opsional**: dikompres di HP (target lebih kecil dari foto bukti, sekitar 100 KB), disimpan di Storage bucket terpisah **privat**, ditampilkan lewat tautan sementara dari server. **Tidak dibersihkan otomatis** (jumlahnya kecil). **(bawaan)** | Hemat kuota 1 GB file dan 5 GB egress; teknik sama dengan `foto-bukti.md`. |
| MN7 | Daftar menu diambil **sekali saat layar dibuka** (dan lewat tombol Segarkan), tidak ada polling. Perubahan Tersedia/Habis oleh owner tidak memicu push ke customer (bawaan).                                                                                 | `notifikasi.md`; hemat free tier.                                          |
| MN8 | Order yang sedang Menunggu **tidak berubah** bila menu kemudian ditandai Habis; owner yang memutuskan (setujui atau tolak lalu follow up lewat WA).                                                                                                          | Keputusan ketua: kesiangan atau menu habis diselesaikan lewat tolak + WA.  |
| MN9 | Perubahan harga oleh owner langsung berlaku untuk order **baru**. Tidak ada riwayat harga terpisah (cukup salinan di order).                                                                                                                                 | Sederhana; riwayat harga masuk `bonus.md` bila dibutuhkan.                 |

---

## 3. Prasyarat

`akun.md` selesai (peran owner dikenali server, fungsi `kedai` terpasang). Foto menu (MN6) bergantung pada `foto-bukti.md` bagian teknik unggah (FTO.02 dan FTO.03).

---

## 4. Yang dibuat

| Komponen                   | Isi                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| Tabel `menu`               | Skema di `database.md`. RLS aktif tanpa policy; hak `service_role` minimal, tanpa DELETE.               |
| Aksi `kedai` untuk menu    | `menu_daftar`, `menu_simpan`, `menu_stok`, `menu_nonaktif` (MN5).                                       |
| Layar Kelola Menu (owner)  | Daftar menu, tombol Tersedia/Habis besar, tambah dan ubah, nonaktifkan.                                 |
| Daftar menu untuk customer | Dipakai di layar Pesan; menu Habis abu-abu. Dipakai juga oleh wizard owner dan penjaga (hanya membaca). |
| Foto menu (opsional)       | Langkah akhir, setelah teknik foto siap.                                                                |

---

## 5. Urutan pekerjaan (untuk TODO sheet, prefix MNU)

Langkah ⚠️ butuh penjelasan dampak dan "OK" ketua.

1. **MNU.01 ⚠️** Migration: tabel `menu`, hak minimal, RLS. SQL disalin ke `supabase/migrations/` dulu. Cek hak `service_role` setelahnya.
2. **MNU.02 ⚠️** Aksi menu di fungsi `kedai` (MN5), hanya owner yang boleh mengubah; deploy dengan urutan aman.
3. **MNU.03** Layar Kelola Menu (owner), termasuk tombol Tersedia/Habis.
4. **MNU.04** Daftar menu untuk customer (dan dipakai ulang di order).
5. **MNU.05** Foto menu opsional: pakai teknik kompres dan unggah dari `foto-bukti.md`, bucket terpisah.
6. **MNU.06** Sesi tes menu (dokumen `menu-test.md` dibuat di sesi tes), bukti untuk hak owner dan harga.

---

## 6. Aturan yang paling sering terlanggar

| Aturan                                                            | Akibat bila dilanggar                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------ |
| Menerima harga atau total dari aplikasi                           | Customer bisa memesan dengan harga sendiri (SEC-06, SEC-12). |
| Order merujuk harga menu terbaru, bukan salinan saat order dibuat | Mengubah harga menu mengacaukan order dan catatan lama.      |
| Menyediakan tombol hapus menu                                     | Order lama kehilangan rujukan; gunakan nonaktifkan.          |
| Customer atau penjaga bisa memanggil `menu_simpan`                | Siapa pun bisa mengubah harga (SEC-07, SEC-08).              |
| Foto menu berukuran besar                                         | Kuota file dan egress free tier cepat habis.                 |
| Menampilkan menu nonaktif ke customer                             | Customer memesan menu yang sudah tidak dijual.               |

---

## 7. Dampak dan pembatalan

- **Migration menu:** tabel baru, tidak menyentuh data lain. Bisa dibatalkan dengan SQL pembatalan tertulis di repo.
- **Harga salah ketik oleh owner:** ubah lagi lewat layar menu; order yang sudah dibuat dengan harga salah **tidak berubah** (salinan). Koreksi order itu lewat follow up WA dan catatan.
- **Menu ditandai Habis padahal masih ada:** tekan Tersedia lagi; berlaku untuk order berikutnya.

---

## 8. Ditunda

- Kategori menu, urutan tampil, dan paket atau varian (pedas, porsi).
- Kuota porsi harian dan batas jam pesan (`bonus.md`).
- Riwayat perubahan harga.
- Push ke customer saat menu tersedia lagi.

---

## 9. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

_(belum ada blok)_

### 2026-11-07: Foto menu di public/img, dan keputusan pagar MNU.01

**Berkas tujuan:** `docs/menu.md` bagian 9. Menimpa MN6 dan sebagian `database.md` (bagian 2, 4, 5). Yang paling akhir menang.

**Foto menu**

- Foto menu disimpan di **`public/img`** (ditayangkan GitHub Pages), **bukan Storage**. MN6 digantikan.
- Tidak ada bucket foto menu, aksi `foto_menu_minta_unggah` dan `foto_menu_catat`, maupun pengaturan `foto_menu_maks_kb`. Tautan sementara foto tidak dibuat; `menu_daftar` hanya mengembalikan nama berkas.
- Kolom foto di tabel `menu` berisi **nama berkas saja** (contoh `nasi-ayam.jpg`), kosong bila tanpa foto. Foto tetap opsional.
- Aturan nama berkas (dicek fungsi dan tabel): huruf kecil, angka, dan strip saja, berakhiran `.jpg` atau `.webp`, tanpa garis miring dan tanpa titik ganda.
- Owner mengisi **"Nama berkas foto"** di layar Kelola Menu. Bila berkas belum ada di `public/img` atau nama salah ketik, layar menampilkan placeholder, bukan galat.
- Ketua mengompres foto (target sekitar 30 sampai 50 KB) dan memasukkannya ke `public/img` lewat git push (prosedur `AGENTS.md` bagian 8), beberapa foto sekali push. Ketua membantu owner bila perlu.
- Foto menu **dikecualikan dari daftar cache `sw.js`**; cukup di-cache browser. Foto menu bersifat publik karena repo public, jadi tidak boleh memuat wajah atau data pelanggan.
- MNU.05 tidak lagi bergantung pada FTO.02 dan FTO.03.
- Alasan: menghemat egress 5 GB yang juga dipakai foto bukti antar; menu jarang berubah, jadi bantuan ketua sesekali dinilai lebih murah daripada egress yang mepet.

**Keputusan lain untuk MNU.01 dan MNU.02**

- Nama menu **kembar ditolak** di antara menu aktif (huruf besar dan kecil dianggap sama).
- `harga_maks_menu` = 200000 rupiah, dikonfirmasi ketua.
- Tabel `menu` memberi pagar kedua: harga lebih dari 0, nama 3 sampai 40 karakter.
- Urutan bawaan daftar menu: nama A sampai Z.
- Mengaktifkan kembali menu lewat `menu_simpan` (owner).

### Handoff #1 | 2026-11-07 | KETUA

**Tugas:** MNU.01 selesai. Tabel `menu`, hak minimal, RLS, dan pengaturan `harga_maks_menu` sudah jalan di production dan lulus semua cek (RLS aktif, tanpa policy, hak `service_role` hanya SELECT/INSERT/UPDATE, tabel kosong). Sudah di-push (commit `e9fe2d3`).

**Berkas diubah:** `supabase/migrations/20261107_menu.sql`, `supabase/migrations/20261107_menu_batal.sql`, `supabase/templates/20261107_menu_cek.sql`, serta blok susulan di `docs/menu.md` dan `docs/database.md`.

**Keputusan baru:** lihat blok `2026-11-07: Foto menu di public/img` di atas (foto di `public/img`, nama kembar ditolak, pagar kedua di tabel, urutan A sampai Z, batas harga 200000).

**Belum beres:** aturan nama dan foto di tabel belum diuji dengan data (tabel masih kosong); diuji di MNU.06.

**Saran giliran berikutnya (MNU.02):** minta `supabase/functions/kedai/` terbaru dan jelaskan dampak sebelum "OK". Fungsi SQL menu dibuat di sini, bukan di MNU.01:

- Isi `diubah_pada` dan `diubah_oleh` di fungsi (tidak ada trigger).
- Rapikan nama sebelum simpan (spasi di awal, akhir, dan ganda), karena tabel menolaknya.
- Cek harga terhadap `harga_maks_menu`.
- Petakan `unique_violation` nama kembar ke satu kode galat aman, termasuk saat mengaktifkan kembali menu yang namanya sudah dipakai menu aktif.
- `menu_daftar` mengembalikan hanya nama berkas foto, urut nama A sampai Z; customer hanya melihat menu aktif.

### Handoff #2 | 2026-11-07 | FREN

**Berkas tujuan:** `docs/menu.md` bagian 9. Yang paling akhir menang.

**Tugas:** MNU.02 selesai. Empat fungsi SQL menu dan empat aksi menu di `kedai` sudah jalan di production (commit `88f6ad5`). Hasil cek: `EXECUTE` hanya `postgres` dan `service_role`, nilai peran `owner` cocok, `harga_maks_menu` 200000, tabel `menu` masih kosong. Aksi lama (login, profil) diuji dengan 3 akun beda peran dan normal.

**Berkas diubah:** `supabase/migrations/20261107_02_menu_fungsi.sql`, `supabase/migrations/20261107_02_menu_fungsi_batal.sql`, `supabase/templates/20261107_02_menu_fungsi_cek.sql`, `supabase/functions/kedai/index.ts` (hanya penambahan, tidak ada baris lama yang diubah).

**Keputusan baru:**

- Aksi menu **tetap di `kedai`**, tidak dipisah menjadi fungsi sendiri (keputusan ketua; alasan belum tercatat).
- `menu_daftar`: owner mendapat semua menu (aktif dan nonaktif), customer dan penjaga hanya yang aktif. Balasan hanya nama berkas foto. Akun staf nonaktif ditolak.
- `menu_simpan`: `id` kosong = tambah (otomatis aktif dan Tersedia), `id` terisi = ubah. Isian `aktifkan` = true mengaktifkan kembali menu nonaktif. Nama kembar dibalas kode `nama_kembar`, termasuk saat mengaktifkan kembali.
- `menu_stok` hanya untuk menu aktif (menu nonaktif ditolak, kode `menu_tidak_aktif`). `menu_nonaktif` pada menu yang sudah nonaktif dianggap berhasil.
- Peran owner dicek **dua lapis**: di `kedai` dan di dalam fungsi SQL.
- Fungsi merapikan nama (spasi awal, akhir, dan ganda), mengecek harga bulat lebih dari 0 dan tidak melebihi `harga_maks_menu`, serta bentuk nama berkas foto.
- Balasan sukses `menu_simpan`, `menu_stok`, dan `menu_nonaktif` membawa daftar menu terbaru (`menu`), jadi aplikasi tidak perlu memanggil `menu_daftar` lagi.

**Belum beres:** aksi menu belum pernah dipanggil dengan data. Nama kembar, batas harga, nama dan foto tidak valid, serta 403 untuk customer dan penjaga belum dibuktikan; diuji di MNU.06.

**Saran giliran berikutnya (MNU.03, layar Kelola Menu):** minta berkas JS aplikasi dan `style.css` terbaru, `sw.js` (berkas JS baru wajib didaftarkan di cache, butuh "OK"), dan `desain.md`. Isi permintaan: `aksi`, `id`, `nama`, `harga` (bilangan bulat), `foto` (nama berkas, kosong = tanpa foto), `aktifkan`, `tersedia`. Pesan galat dari server sudah aman ditampilkan apa adanya (lewat `textContent`).

### 2026-11-07: Susunan navigasi owner kini dengan Home

**Berkas tujuan:** `docs/menu.md` bagian 9. Sumber: `home.md` HM1 dan Handoff #1. Yang paling akhir menang.

Tab Menu owner tetap ada. Susunan navigasi owner kini: **Home, Order Masuk, Semua Order, Buat Order, Menu** (Home paling kiri, Menu paling kanan). Keputusan menu MN1 sampai MN9 tidak berubah.

### Handoff #3 | 2026-11-07 | KETUA

**Berkas tujuan:** `docs/menu.md` bagian 9. Yang paling akhir menang.

**Tugas:** MNU.03 selesai (layar Kelola Menu owner). Sudah di-push (commit `6081c59`, "MNU.03 + kerangka apps", Pages #27 sukses). Tab Menu owner terbuka dan menampilkan keadaan kosong ("0 menu, 0 aktif", "Belum ada menu", tombol Tambah menu).

**Berkas diubah:** `public/menu.js` (baru), `public/kerangka.js`, `public/style.css` (blok KRG.01 dan MNU.03, hanya penambahan), `public/sw.js` (cache `chata-v8`; `menu.js` dan `kerangka.js` didaftarkan, foto menu tidak), `public/index.html` (panel dan form Menu).

**Keputusan baru:**

- Tombol Tersedia/Habis besar di tiap kartu menu aktif, labelnya menunjukkan aksi berikutnya ("Tandai Habis" / "Tandai Tersedia"). Memanggil `menu_stok`.
- Nonaktifkan memakai konfirmasi di kartu ("Ya, nonaktifkan") yang menjelaskan dampak. Tidak ada tombol hapus. Menu nonaktif diredupkan, berlencana Nonaktif, dan punya tombol "Aktifkan kembali" (`menu_simpan` + `aktifkan: true`). Bila nama kembar, pesan menyuruh ganti nama lewat Ubah.
- Cek di aplikasi hanya kemudahan: nama 3 sampai 40 karakter, harga angka bulat lebih dari 0 (titik dan spasi dibuang), nama berkas foto sesuai aturan. Batas harga dan nama kembar diputuskan server, pesannya ditampilkan apa adanya.
- Foto dibaca dari `img/<nama berkas>`; placeholder "Tanpa foto" atau "Foto belum ada" bila kosong atau berkas tidak ada.
- Daftar dimuat saat tab dibuka (kerangka memanggil `KedaiMenu.tampil`), tanpa polling. Balasan sukses aksi memakai field `menu` untuk memperbarui daftar; bila tidak terbaca baru muat ulang.
- Nama kembar dikenali dari teks pesan ("nama yang sama") karena balasan galat tidak membawa field kode.
- Saat Keluar, `KedaiMenu.reset()` membersihkan data menu dari layar.

**Belum beres:**

- Belum diuji dengan data (tabel masih kosong): tambah, ubah, Tersedia/Habis, nonaktif dan aktifkan kembali, nama kembar, batas harga, foto, dan 403 untuk non-owner. Diuji di MNU.06.
- Bentuk data menu diandaikan `{ id, nama, harga, tersedia, aktif, foto }`. Bila uji pertama beda, cukup sesuaikan `bacaMenu` di `menu.js`.
- Handoff #2 menyebut kode `nama_kembar`, sedangkan `menu.js` mengandalkan teks pesan. Cek mana yang benar saat uji.
- Handler fetch `sw.js` menyimpan semua respons sukses domain sendiri, jadi foto menu ikut tersimpan walau tidak ada di `DAFTAR_CACHE` (berbeda dari catatan "cukup di-cache browser"). Putuskan nanti apakah perlu dikecualikan.

**Saran giliran berikutnya (MNU.04, daftar menu untuk customer):** minta `menu.js`, `kerangka.js`, `index.html`, `style.css`, `sw.js` (berkas JS baru wajib didaftarkan, butuh "OK"), dan `desain.md`. `KedaiMenu` hanya mengekspos `tampil` dan `reset`, jadi pembantu kartu, `rupiah`, dan foto perlu diekspos atau dipisah bila dipakai ulang. Customer memakai `menu_daftar` (hanya menu aktif); menu Habis abu-abu dan tidak bisa dipilih; aplikasi tidak pernah mengirim harga atau total, hanya id menu dan jumlah (MN4). Tab Pesan customer di `kerangka.js` masih "segera".
