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

### 2026-11-07: Foto menu di public/img, dan keputusan pagar MNU.01

Menimpa MN6 dan sebagian `database.md` (bagian 2, 4, 5).

**Foto menu**

- Foto menu disimpan di **`public/img`** (ditayangkan GitHub Pages), **bukan Storage**. Tidak ada bucket foto menu, aksi `foto_menu_minta_unggah` dan `foto_menu_catat`, maupun pengaturan `foto_menu_maks_kb`. `menu_daftar` hanya mengembalikan nama berkas; tidak ada tautan sementara.
- Kolom foto di tabel `menu` berisi **nama berkas saja** (contoh `nasi-ayam.jpg`), kosong bila tanpa foto. Foto tetap opsional.
- Aturan nama berkas (dicek fungsi dan tabel): huruf kecil, angka, dan strip saja, berakhiran `.jpg` atau `.webp` (`.jpeg` dan `.png` ditolak), tanpa garis miring dan tanpa titik ganda.
- Owner mengisi **"Nama berkas foto"** di layar Kelola Menu (nama berkasnya saja, tanpa `public/img/`). Bila berkas belum ada di `public/img` atau nama salah ketik, layar menampilkan placeholder, bukan galat.
- Ketua mengompres foto (target sekitar 30 sampai 50 KB) dan memasukkannya ke `public/img` lewat git push (prosedur `AGENTS.md` bagian 8), beberapa foto sekali push. Ketua membantu owner bila perlu.
- Foto menu **dikecualikan dari daftar cache `sw.js`**; cukup di-cache browser. Foto bersifat publik karena repo public, jadi tidak boleh memuat wajah atau data pelanggan.
- MNU.05 tidak lagi bergantung pada FTO.02 dan FTO.03.
- Alasan: menghemat egress 5 GB yang juga dipakai foto bukti antar; menu jarang berubah, jadi bantuan ketua sesekali dinilai lebih murah daripada egress yang mepet.

**Keputusan lain untuk MNU.01 dan MNU.02**

- Nama menu **kembar ditolak** di antara menu aktif (huruf besar dan kecil dianggap sama).
- `harga_maks_menu` = 200000 rupiah, dikonfirmasi ketua.
- Tabel `menu` memberi pagar kedua: harga lebih dari 0, nama 3 sampai 40 karakter.
- Urutan bawaan daftar menu: nama A sampai Z.
- Mengaktifkan kembali menu lewat `menu_simpan` (owner).

### Handoff #1 | 2026-11-07 | KETUA

**Tugas:** MNU.01 selesai: tabel `menu`, hak minimal, RLS, dan pengaturan `harga_maks_menu` (migration `20261107_menu.sql`). Cek lulus: RLS aktif tanpa policy, hak `service_role` hanya SELECT/INSERT/UPDATE.

**Keputusan:** lihat blok foto menu di atas. Fungsi SQL menu dibuat di MNU.02, bukan MNU.01: `diubah_pada` dan `diubah_oleh` diisi di fungsi (tanpa trigger), nama dirapikan sebelum simpan (spasi awal, akhir, dan ganda) karena tabel menolaknya, harga dicek terhadap `harga_maks_menu`, dan `unique_violation` dipetakan ke satu kode galat aman untuk nama kembar, termasuk saat mengaktifkan kembali menu yang namanya sudah dipakai menu aktif.

### Handoff #2 | 2026-11-07 | FREN

**Tugas:** MNU.02 selesai: empat fungsi SQL menu (`20261107_02_menu_fungsi.sql`) dan empat aksi menu di `kedai`.

**Keputusan baru:**

- Aksi menu **tetap di `kedai`**, tidak dipisah menjadi fungsi sendiri (keputusan ketua; alasan belum tercatat).
- `menu_daftar`: owner mendapat semua menu (aktif dan nonaktif), customer dan penjaga hanya yang aktif. Balasan hanya nama berkas foto. Akun staf nonaktif ditolak.
- `menu_simpan`: `id` kosong = tambah (otomatis aktif dan Tersedia), `id` terisi = ubah. Isian `aktifkan` = true mengaktifkan kembali menu nonaktif. Nama kembar dibalas kode `nama_kembar`, termasuk saat mengaktifkan kembali.
- `menu_stok` hanya untuk menu aktif (menu nonaktif ditolak, kode `menu_tidak_aktif`). `menu_nonaktif` pada menu yang sudah nonaktif dianggap berhasil.
- Peran owner dicek **dua lapis**: di `kedai` dan di dalam fungsi SQL.
- Fungsi merapikan nama, mengecek harga bulat lebih dari 0 dan tidak melebihi `harga_maks_menu`, serta bentuk nama berkas foto.
- Balasan sukses `menu_simpan`, `menu_stok`, dan `menu_nonaktif` membawa daftar menu terbaru (`menu`), jadi aplikasi tidak perlu memanggil `menu_daftar` lagi.
- Isian permintaan: `aksi`, `id`, `nama`, `harga` (bilangan bulat), `foto` (nama berkas, kosong = tanpa foto), `aktifkan`, `tersedia`. Pesan galat server aman ditampilkan apa adanya lewat `textContent`.

### 2026-11-07: Susunan navigasi owner kini dengan Home

Sumber: `home.md` HM1 dan Handoff #1. Tab Menu owner tetap ada. Susunan navigasi owner: **Home, Order Masuk, Semua Order, Buat Order, Menu** (Home paling kiri, Menu paling kanan). Keputusan MN1 sampai MN9 tidak berubah.

### Handoff #3 | 2026-11-07 | KETUA

**Tugas:** MNU.03 selesai: layar Kelola Menu owner (`menu.js`, panel dan form di `index.html`, blok KRG.01 dan MNU.03 di `style.css`, kerangka tab di `kerangka.js`).

**Keputusan baru:**

- Tombol Tersedia/Habis besar di tiap kartu menu aktif, labelnya menunjukkan aksi berikutnya ("Tandai Habis" / "Tandai Tersedia"). Memanggil `menu_stok`.
- Nonaktifkan memakai konfirmasi di kartu ("Ya, nonaktifkan") yang menjelaskan dampak. Tidak ada tombol hapus. Menu nonaktif diredupkan, berlencana Nonaktif, dan punya tombol "Aktifkan kembali" (`menu_simpan` + `aktifkan: true`). Bila nama kembar, pesan menyuruh ganti nama lewat Ubah.
- Cek di aplikasi hanya kemudahan: nama 3 sampai 40 karakter, harga angka bulat lebih dari 0 (titik dan spasi dibuang), nama berkas foto sesuai aturan. Batas harga dan nama kembar diputuskan server, pesannya ditampilkan apa adanya.
- Foto dibaca dari `img/<nama berkas>`; placeholder "Tanpa foto" atau "Foto belum ada" bila kosong atau berkas tidak ada.
- Daftar dimuat saat tab dibuka (kerangka memanggil `KedaiMenu.tampil`), tanpa polling. Balasan sukses aksi memakai field `menu` untuk memperbarui daftar; bila tidak terbaca baru muat ulang. Bentuk data menu: `{ id, nama, harga, tersedia, aktif, foto }`.
- Balasan galat server tidak membawa kode, jadi nama kembar dikenali dari teks pesan ("nama yang sama").
- Saat Keluar, `KedaiMenu.reset()` membersihkan data menu dari layar.

### Handoff #4 | 2026-11-07 | KETUA

**Tugas:** MNU.04 selesai: daftar menu untuk customer di tab Pesan (`menu.js`, `kerangka.js`, `index.html`, `style.css`; `sw.js` tidak berubah).

**Keputusan baru:**

- Tab Pesan customer hanya **menampilkan** daftar menu aktif; tombol pilih dan jumlah dikerjakan di ORD (keputusan ketua di chat), dipasang di fungsi `buatKartuPelanggan` di `menu.js` (hanya untuk menu Tersedia).
- Menu Habis tampil abu-abu dengan lencana Habis (kelas `.menu-kartu--habis`). Server menyaring menu nonaktif; aplikasi menyaring sekali lagi bila ada `aktif: false`.
- Daftar dimuat saat tab dibuka dan lewat Segarkan, tanpa polling. Bila gagal muat, daftar lama (bila ada) tetap tampil bersama pesan galat. Saat Keluar, data dibersihkan dan balasan yang telat datang diabaikan.
- Logika customer ditaruh di `menu.js` (bukan berkas baru) supaya `sw.js` tidak perlu diubah.
- Isian harga di Kelola Menu langsung membuang huruf dan simbol saat diketik (titik dan spasi tetap boleh); cek lengkap tetap di `kirim()` dan server.

### 2026-11-07: Deskripsi, sheet detail, dan pilihan menu (permintaan owner)

Menggantikan butir "paket atau varian (pedas, porsi)" di bagian 8 (Ditunda) dan menambah MN4.

**Deskripsi dan sheet detail**

- Tiap menu punya **deskripsi (opsional)**, maks 200 karakter, batas disimpan di database (bawaan).
- Customer mengetuk **kartu menu** (foto atau bagian mana saja) untuk membuka **sheet detail**: foto besar, nama, harga, deskripsi, dan pilihan (bila ada). Tutup lewat tombol X, ketuk di luar, atau geser turun.
- Menu Habis tetap bisa dibuka, tetapi tidak bisa dipilih (bawaan).
- Tombol tambah dan jumlah dipasang di sheet yang sama saat ORD dikerjakan; di MNU sheet hanya menampilkan.
- Target ukuran foto untuk zoom: **belum diputuskan** (30 sampai 50 KB mungkin kurang tajam saat diperbesar; ketua yang memutuskan).

**Add-on berbayar = menu biasa**

- Add-on yang menambah harga (extra telur, es batu) dibuat owner sebagai **menu biasa** dan dipilih customer sebagai item terpisah. Tidak ada harga tambahan per pilihan, sehingga rumus total tidak berubah (MN4 dan O3 utuh).
- Konsekuensi: add-on tidak terikat ke menu induknya; customer bisa memesannya tanpa menu induk. Diterima karena wajar di warung. Beri nama jelas (misal "Tambah es batu").

**Pilihan gratis (grup pilihan)**

- **Grup pilihan** dibuat owner **sekali**, lalu **dipasang ke menu mana saja** yang perlu (seperti mekanisme merchant GoFood). Menu tanpa grup tidak menampilkan pilihan apa pun (es teh tidak punya pilihan pedas).
- Satu jenis grup saja: **pilih satu, dengan tepat satu opsi bawaan**. Tanpa harga, tanpa pilih banyak.
- Contoh: grup "Tingkat pedas" berisi Tidak pedas (**bawaan**), Sedang, Pedas. Bawaan "Tidak pedas" dipilih karena kebanyakan pemesan memesan untuk anak sekolah. Grup lain, misalnya "Dingin / Panas" untuk minuman, dibuat dengan cara yang sama.
- Satu menu boleh memakai lebih dari satu grup (bawaan).
- Grup dan opsi **tidak dihapus**, hanya dinonaktifkan (bawaan, sejalan MN3).
- Pilihan **gratis**: tidak mengubah harga dan total.
- Catatan "pedas/sedang/tidak" yang tadinya masuk catatan order kini menjadi pilihan di item.

**Perubahan MN4 (aplikasi kirim apa saja)**

Aplikasi mengirim **id menu, jumlah, dan id opsi terpilih** (satu per grup). Server memeriksa bahwa opsi itu milik grup yang terpasang di menu tersebut. Bila tidak dikirim, server memakai opsi bawaan (bawaan). Aplikasi tetap tidak pernah mengirim harga atau total.

### Handoff #5 | 2026-11-07 | [RAC]

**Tugas:** MNU.08 selesai: sheet detail menu untuk customer (`menu-detail.js` baru, kait kecil di `menu.js`, blok MNU.08 di `style.css`, `sw.js` naik ke `chata-v9`). Foto menu sekitar 30 sampai 50 KB tidak pecah saat diperbesar di sheet.

**Keputusan baru:**

- Komponen sheet berdiri sendiri di `menu-detail.js` (`window.KedaiMenuDetail`, fungsi `buka` dan `tutup`), elemennya dibuat lewat JS. `menu.js` hanya menambah kait kecil di `buatKartuPelanggan` dan penutupan sheet di `resetPelanggan`. Alasan: `menu.js` sudah sangat panjang.
- Cara tutup: tombol X, ketuk area gelap, geser turun (lebih dari sekitar 80 px = tutup, hanya layar sentuh), dan Esc. Sheet ditutup seketika saat Keluar. Ketukan pada tombol di dalam kartu tidak membuka sheet.
- Bagian deskripsi hanya tampil bila `deskripsi` berupa teks tidak kosong.
- Tampilan: tinggi maksimal 85% layar, lebar maksimal 560 px di layar lebar (alasan belum tercatat dari ketua).

### Handoff #6 | 2026-11-07 | KETUA

**Tugas:** MNU.07 selesai: kolom `deskripsi`, pengaturan, dan fungsi SQL (`20261107_03_menu_deskripsi.sql`), `kedai` diperluas, isian deskripsi di Kelola Menu, `menu.js` menyalin `deskripsi` ke sheet. Uji SQL lulus (rapikan, kosong jadi NULL, 201 karakter ditolak, 200 diterima).

**Keputusan baru:**

- Deskripsi opsional dan **boleh beberapa baris** (Enter); untuk daftar, owner mengawali tiap baris dengan "- ". Batas **200 karakter**, disimpan di pengaturan `deskripsi_menu_maks`. Usulan owner, diputuskan ketua di chat.
- Server merapikan sebelum simpan: akhir baris CR jadi satu jenis baris baru, karakter kontrol dibuang, spasi berulang jadi satu, spasi di tepi tiap baris dibuang, baris kosong beruntun jadi satu, baris kosong di awal dan akhir dibuang, hasil kosong disimpan NULL. Panjang dihitung setelah dirapikan (satu Enter = satu karakter).
- `menu_simpan` **wajib** menerima field `deskripsi` (teks, boleh kosong); bila field tidak ada, dibalas 400. Deskripsi kosong menghapus deskripsi lama. Karena itu aksi Aktifkan kembali ikut mengirim deskripsi.
- `menu_daftar` membawa `deskripsi` ke semua peran.
- Kode galat baru `deskripsi_tidak_valid` (400, "Deskripsi menu terlalu panjang.", tanpa angka karena batasnya ada di pengaturan).
- Tabel `menu` punya pagar bentuk untuk `deskripsi` (tidak kosong, tanpa spasi di tepi, tanpa CR); batas panjang dijaga fungsi dari pengaturan, sama seperti `harga_maks_menu`.
- Fungsi `menu_simpan` versi 7 argumen dibuat **tanpa nilai bawaan** pada `p_deskripsi`; versi 6 argumen (MNU.02) sengaja dibiarkan supaya `kedai` lama tetap jalan selama deploy, dan panggilan lama dan baru tidak ambigu.

### Handoff #7 | 2026-11-07 | FREN

**Tugas:** MNU.09 giliran 1 (SQL) selesai: tabel dan fungsi grup pilihan di `20261107_04_menu_grup_pilihan.sql`. "OK" ketua lewat WA (ketua setuju pada usulan).

**Keputusan baru (usulan penulis, disetujui ketua; alasan selebihnya belum tercatat):**

- Tiga tabel baru: `grup_pilihan`, `opsi_pilihan`, `menu_grup`. RLS aktif tanpa policy, `service_role` hanya baca, tambah, dan ubah (tanpa DELETE). Melepas grup dari menu = penanda aktif jadi false.
- Pengaturan baru: `grup_maks_per_menu` = 3 dan `opsi_maks_per_grup` = 6, dihitung dari yang **aktif** saja (yang nonaktif tidak bisa dihapus).
- Tiap grup: minimal 2 opsi aktif, tepat satu opsi bawaan dan harus aktif. Nama grup 3 sampai 30 karakter, nama opsi 2 sampai 30 karakter (bentuk data, dijaga tabel dan fungsi, tidak di pengaturan). Nama grup aktif tidak boleh kembar; nama opsi aktif tidak boleh kembar dalam satu grup (huruf besar dan kecil dianggap sama).
- `grup_simpan(p_oleh, p_id, p_nama, p_opsi, p_aktifkan default false)`: owner; id kosong = grup baru. `p_opsi` adalah **daftar lengkap** opsi (array JSON), urutan daftar = urutan tampil; tiap elemen `{id (kosong bila baru), nama, bawaan, aktif (bila tidak ada dianggap true)}`. Saat mengubah grup, semua opsi lama (termasuk yang nonaktif) wajib ikut; yang dibuang dikirim dengan `aktif: false`, bila ada yang kurang ditolak (`opsi_tidak_lengkap`). Grup nonaktif hanya bisa diubah bila `p_aktifkan` = true (sekaligus mengaktifkannya kembali). Mengembalikan id grup.
- `grup_nonaktif(p_oleh, p_id)`: owner; opsi dan pemasangannya tidak diubah.
- `grup_daftar(p_semua)`: grup beserta opsinya untuk layar owner; `true` memuat grup dan opsi nonaktif juga (supaya bisa dikirim balik lengkap ke `grup_simpan`), `false` hanya yang aktif. Tidak memeriksa peran; pembatasan ke owner dilakukan `kedai`, sama seperti `menu_daftar`.
- `menu_grup_atur(p_oleh, p_menu_id, p_grup_ids uuid[])`: owner; daftar **lengkap** grup aktif yang diinginkan untuk satu menu, urutan daftar = urutan tampil; daftar kosong = lepas semua.
- `opsi_periksa(p_menu_id, p_opsi_ids uuid[])` mengembalikan `[{grup_id, grup_nama, opsi_id, opsi_nama}]`, satu per grup aktif yang terpasang di menu itu; grup tanpa pilihan memakai opsi bawaan. Menolak (`opsi_tidak_valid`) opsi nonaktif, opsi dari grup yang tidak terpasang di menu itu, id dobel, id kosong, dan dua opsi dari grup yang sama.
- `menu_daftar` membawa `grup` di tiap menu: `[{id, nama, opsi: [{id, nama, bawaan}]}]`, hanya grup dan opsi aktif, ke semua peran.
- Kode galat baru: `grup_nama_tidak_valid`, `grup_nama_kembar`, `grup_tidak_ditemukan`, `grup_tidak_aktif`, `grup_tidak_valid`, `grup_terlalu_banyak`, `opsi_tidak_valid`, `opsi_tidak_lengkap`, `opsi_nama_kembar`, `opsi_terlalu_banyak`, `pilihan_rusak` (data tidak konsisten; seharusnya tidak pernah muncul).

### Handoff #8 | 2026-11-07 | KETUA

**Tugas:** MNU.09 selesai (giliran 2): empat aksi grup pilihan di `kedai`.

**Keputusan baru (pilihan penulis; "OK" deploy dari ketua, alasan selebihnya belum tercatat):**

- Empat aksi baru: `grup_daftar`, `grup_simpan`, `grup_nonaktif`, `menu_grup_atur`. Semuanya **owner saja**, dicek dua lapis (di `kedai` dan di fungsi SQL).
- Isian: `grup_daftar` tanpa isian; `grup_simpan` = `id` (kosong = grup baru, **tanpa field `id` sama sekali**, `id: ""` dibalas 400), `nama`, `opsi` (daftar **lengkap**, tiap elemen `id`, `nama`, `bawaan`, `aktif`), `aktifkan`; `grup_nonaktif` = `id`; `menu_grup_atur` = `menu_id` dan `grup_ids` (daftar lengkap grup aktif, kosong = lepas semua).
- `grup_daftar` selalu meminta semua grup dan opsi, termasuk yang nonaktif, supaya bisa dikirim balik lengkap ke `grup_simpan`.
- Balasan sukses: `grup_daftar` membawa `grup`; `grup_simpan` membawa `id`, `grup`, dan `menu`; `grup_nonaktif` membawa `grup` dan `menu`; `menu_grup_atur` membawa `menu`. Aplikasi tidak perlu memanggil ulang.
- `kedai` hanya meneruskan field `id`, `nama`, `bawaan`, `aktif` dari tiap opsi, dengan pagar kasar 100 opsi dan 50 grup per permintaan. Batas sebenarnya dijaga fungsi SQL dari pengaturan.
- Peta galat `PETA_GALAT_GRUP`: `bukan_owner` 403; `grup_tidak_ditemukan` dan `menu_tidak_ditemukan` 404; `grup_nama_kembar`, `opsi_nama_kembar`, `grup_tidak_aktif`, `opsi_tidak_lengkap`, `grup_terlalu_banyak`, `opsi_terlalu_banyak` 409; `grup_nama_tidak_valid`, `grup_tidak_valid`, `opsi_tidak_valid` 400. Pesan batas jumlah tanpa angka karena batasnya ada di pengaturan. Kode `id_kosong` dan `pengaturan_rusak` sengaja tidak dipetakan (jadi galat umum 500).

### 2026-11-07: Layar Kelola Grup terpisah, dan cara memasang grup ke menu (MNU.10)

- Layar **Kelola Grup** adalah **layar terpisah** (bukan bagian layar Kelola Menu), dibuka dari **tombol di tab Menu**. Keputusan ketua (disampaikan lewat anggota tim).
- **Tidak ada grup contoh atau grup siap pakai.** Owner membuat semua grup sendiri dari nol. Keputusan ketua.
- Grup dibuat **sekali**, lalu dipasang ke **banyak menu** (mekanisme server MNU.09).
- Pemasangan dilakukan dari **sisi grup**: di layar Kelola Grup, tiap grup menampilkan daftar menu dengan kotak centang (memanggil `menu_grup_atur`). Ketua belum punya preferensi; dipilih mengikuti rekomendasi AI. Alasan selebihnya belum tercatat. Pemasangan dari form Ubah menu (sisi menu) tidak dibuat.

### Handoff #9 | 2026-11-08 | [RAC]

**Tugas:** MNU.10 selesai: layar owner Kelola Grup pilihan (`grup.js` baru; tombol "Kelola grup pilihan" di tab Menu; `sw.js` naik ke `chata-v10`).

**Keputusan baru (ketua lewat perantara, pilihan A dari rekomendasi AI):**

- Tombol "Pasang ke menu" di kartu grup aktif membuka daftar menu dengan kotak centang; tiap ketukan langsung menyimpan lewat `menu_grup_atur`. Grup nonaktif tidak punya tombol pasang.
- Yang dikirim ke `menu_grup_atur`: daftar lengkap grup aktif menu itu dengan urutan lama; grup yang baru dicentang di urutan terakhir (urutan tampil = urutan pemasangan). Batas jumlah grup per menu tidak dihitung di aplikasi; pesan penolakan server ditampilkan apa adanya dan kotak dikembalikan.
- Menu yang datanya tidak punya daftar `grup` dianggap tidak terbaca, supaya satu ketukan tidak melepas grup lain dari menu itu. Menu nonaktif tetap bisa diberi grup (ditandai "(nonaktif)").
- Editor opsi: opsi bawaan tidak punya tombol hapus; opsi baru "Hapus opsi", opsi lama "Nonaktifkan opsi" (dikirim `aktif: false`); grup baru mulai dengan 2 opsi kosong (pertama bawaan); opsi baru yang kosong diabaikan saat kirim. Validasi klien hanya kemudahan (nama grup 3 sampai 30, opsi 2 sampai 30, minimal 2 opsi aktif, tepat 1 bawaan, tidak kembar); keputusan akhir di server.
- Nama grup dan opsi tampil persis seperti diketik.
- Bentuk data: `grup_daftar` membawa `grup` berbentuk `{id, nama, aktif, opsi:[{id, nama, bawaan, aktif}]}`; `menu_daftar` membawa `grup` per menu.
- Menonaktifkan grup lalu mengaktifkannya kembali **tidak** melepas pemasangannya; selama nonaktif, menu tidak menampilkannya sebagai terpasang.
- Diputuskan ketua (8 Nov): MNU.11 hanya **menampilkan** grup dan opsinya di sheet detail customer; **memilih opsi** dikerjakan di ORDER (lihat blok 2026-11-08 di bawah).

### Handoff #10 | 2026-11-08 | FREN

**Tugas:** MNU.11 selesai: pilihan grup tampil di sheet detail customer (`menu-detail.js`: `buatGrup`; `menu.js`: `bacaGrupPelanggan`; blok MNU.11 di `style.css`). Dicek di layar sempit dan di HP Android.

**Keputusan baru:**

- Opsi bawaan ditandai **emoji centang (✅)** setelah nama opsi (contoh "Tidak pedas ✅"), menggantikan tulisan "(bawaan)". Di bawah semua grup ada satu baris keterangan kecil: **"✅ = otomatis dipilih kalau tidak diganti"**. Keduanya diputuskan ketua lewat perantara, alasan belum tercatat.
- Menu tanpa grup dan grup tanpa opsi tidak menampilkan bagian pilihan. Menu Habis tetap menampilkan pilihannya.
- `bacaGrupPelanggan` meneruskan `id`, `nama`, dan `bawaan` per opsi; elemen dengan bentuk salah dibuang. Pilihan di sheet kini bisa dipilih customer (satu opsi per grup, bawaan terpilih), dikerjakan di ORD.03.

### Handoff #11 | 2026-11-08 | [AIK]

**Tugas:** sesi tes MNU.06 bagian pertama; menghasilkan `docs/menu-test.md` (kasus uji MT-01 sampai MT-24). Tes lewat Console browser dengan akun dummy owner, penjaga, dan customer.

**Keputusan dan temuan:**

- Cek tampilan cukup diceritakan dengan kata-kata, tanpa screenshot HP. Bukti P0 tetap teks balasan server dari Console. Data uji dipakai ulang, tidak membuat menu atau grup baru kecuali perlu.
- Balasan galat server hanya membawa `ok` dan `pesan`, tanpa kode. Nama kembar dikenali dari teks "nama yang sama" di `menu.js`, dan itu cocok.
- Aturan nama kembar hanya antar menu **aktif**. Menu nonaktif boleh diganti ke nama yang dipakai menu aktif, tetapi mengaktifkannya kembali ditolak 409.
- `grup_simpan` untuk grup baru harus **tanpa field `id`**. Bentuk isian lengkap ada di `docs/menu-test.md` bagian 1.

### Handoff #12 | 2026-11-08 | [RAC]

**Tugas:** sesi tes MNU.06 selesai: **MT-01 sampai MT-22 lulus**, mencakup 403 non-owner untuk aksi menu, batas harga 200000, nama kembar, nonaktif dan aktifkan kembali, seluruh aksi grup dengan data, dan tag HTML di nama grup dan opsi tampil sebagai tulisan (SEC-18). `menu-test.md` tetap v1.0.

**Temuan di lapangan:**

- `kedai/index.ts` **tidak punya angka batas harga tertulis mati**. Yang ada hanya pagar kasar (bilangan bulat dan tidak melebihi batas integer 32-bit, `BATAS_INTEGER`); batas wajar dicek fungsi SQL dari pengaturan `harga_maks_menu`.
- Balasan "Data belum lengkap atau tidak valid." pada tes harga berarti ada field wajib yang kurang di isian tes (misalnya `deskripsi`), bukan soal harga. Dengan isian lengkap, harga di luar batas dibalas "Harga tidak valid atau melebihi batas."

### 2026-11-08: Pemilihan opsi di order dikerjakan di ORD.02 dan ORD.03

- ORD.01 hanya berisi migration tabel (tidak memanggil `opsi_periksa` dan tidak mengubah `kedai`).
- Pemanggilan `opsi_periksa` dan pemetaan kode galat `pilihan_rusak` di `kedai` dikerjakan di **ORD.02** (`order_buat`). Tombol pilih opsi di aplikasi dikerjakan di **ORD.03**.
- `order_item.pilihan` menampung salinan pilihan (lihat `docs/order.md` Handoff #1).

### Handoff #13 | 2026-11-08 | [FREN]

**Tugas:** MT-23 dan MT-24 lulus, sehingga **seluruh kasus `docs/menu-test.md` (MT-01 sampai MT-24) sudah lulus**. Tes lewat Console di aplikasi asli (`window.KedaiAkun.panggilKedai`) dengan akun dummy customer 1 dan owner.

**Yang terbukti:**

- Isian palsu (`harga`, `total`, `status: "Disetujui"`, harga di tiap item) diabaikan: total tetap 25000 dihitung server, status Menunggu, harga satuan 15000 dan 5000 dari menu.
- Opsi di luar grup yang terpasang di menu dibalas 409 "Pilihan menu berubah atau tidak valid. Muat ulang menu lalu coba lagi." (pemetaan `pilihan_rusak`); tidak ada order terbentuk dan nomor order tidak loncat.
- Pilihan tersalin sebagai "Level pedas: Sedang" di `order_item`.
- Harga es teh manis diubah owner 5000 ke 7000: order baru memakai 7000, order lama tetap 5000.

**Data uji (dummy) yang tertinggal:** menu dan grup tidak bisa dihapus. "menu tanpa gambar" nonaktif (harga 1000, tanpa foto, deskripsi, dan grup); grup bertag HTML, Grup Uji 2, dan Grup Uji 3 nonaktif; "Level pedas" aktif dan terpasang di "ayam karage"; es teh manis kembali Rp 5.000 Tersedia. Nonaktifkan atau pakai ulang sebelum peluncuran (LNC.01).

**Masih terbuka:**

- Fungsi `menu_simpan` 6 argumen masih ada di database dan tidak dipanggil lagi. Butir sheet: "Buang fungsi menu_simpan lama" (High-Risk, butuh "OK" ketua, tidak mendesak).
- Target ukuran foto menu untuk zoom belum diputuskan ketua.
- Handler fetch `sw.js` menyimpan semua respons sukses domain sendiri, jadi foto menu ikut tersimpan walau tidak ada di `DAFTAR_CACHE`. Putuskan apakah perlu dikecualikan.
- Deskripsi belum tampil di kartu Kelola Menu (owner); hanya terlihat di form Ubah dan sheet detail customer.
- iPhone belum dicek (tidak ada perangkat uji, `AGENTS.md` bagian 10 butir 7); keluhan dihitung di review pemakaian.
- `menu.js` sekitar 900 baris (pedoman sekitar 500); komponen baru sebaiknya berkas terpisah dan wajib didaftarkan di `sw.js` (butuh "OK").
- Berkas uji `20261107_04_menu_grup_pilihan_uji.sql` tidak boleh dijalankan lagi (sudah ada grup pilihan).

### 2026-11-11: MN6 dan MNU.05 tidak berlaku, foto menu tetap di `public/img`

Keputusan ketua (tercatat di sheet pada MNU.05; alasan lain belum tercatat). Sumber: docs/foto-bukti.md blok 11 Nov 2026. Yang paling akhir menang.

- **MN6 (foto menu lewat unggah, kompres, bucket terpisah, tanpa pembersihan) tidak berlaku.** Foto menu adalah berkas biasa di `public/img` yang diterbitkan bersama aplikasi.
- **MNU.05 dibatalkan.** Tidak ada aksi unggah, tidak ada bucket, tidak ada kompres otomatis untuk foto menu.
- **Belum diputuskan:** ukuran target foto menu (MNU.08 mencatat "target ukuran belum diputuskan"). Karena fotonya berkas aplikasi, ukuran dijaga saat berkas ditaruh di repo.
