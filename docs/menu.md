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

### Handoff #4 | 2026-11-07 | KETUA

**Berkas tujuan:** `docs/menu.md` bagian 9. Yang paling akhir menang.

**Tugas:** MNU.04 selesai (daftar menu untuk customer, tab Pesan). Sudah di-push (commit `<hash>`). Hasil lihat langsung: dua menu dummy tampil benar di tab Pesan customer, satu Habis (abu-abu, lencana Habis) dan satu Tersedia (lencana Tersedia), foto kosong tampil placeholder "Tanpa foto". Ikut dibereskan: isian harga di Kelola Menu kini langsung membuang huruf saat diketik.

**Berkas diubah:** `public/menu.js`, `public/kerangka.js`, `public/index.html`, `public/style.css`. `sw.js` tidak disentuh (cache tetap `chata-v8`), tidak ada berkas JS baru. Tidak ada kode lama yang dihapus; dua baris lama di `kerangka.js` (tab Pesan dan daftar `PANEL`) dijadikan komentar.

**Keputusan baru:**

- Tab Pesan customer hanya **menampilkan** daftar menu aktif; tombol pilih dan jumlah dikerjakan di ORD (keputusan ketua di chat). Tempat tombol nanti: fungsi `buatKartuPelanggan` di `menu.js` (hanya untuk menu Tersedia).
- Menu Habis tampil abu-abu dengan lencana Habis (kelas `.menu-kartu--habis`). Server menyaring menu nonaktif; aplikasi menyaring sekali lagi bila ada `aktif: false`.
- Daftar dimuat saat tab dibuka dan lewat Segarkan, tanpa polling. Bila gagal muat, daftar lama (bila ada) tetap tampil bersama pesan galat. Saat Keluar, data dibersihkan dan balasan yang telat datang diabaikan.
- Logika customer ditaruh di `menu.js` (bukan berkas baru) supaya `sw.js` tidak perlu diubah. Akibatnya `menu.js` sekitar 800 baris (pedoman ~500); pecah bila ORD menambah panjang.
- Isian harga membuang huruf dan simbol saat diketik (titik dan spasi tetap boleh); cek lengkap tetap di `kirim()` dan server.
- Aturan nama berkas foto dipertegas: huruf kecil, angka, strip, berakhiran `.jpg` atau `.webp` (`.jpeg` dan `.png` ditolak). Owner mengisi nama berkasnya saja (contoh `nasi-ayam.jpg`), tanpa `public/img/`.

**Belum beres:**

- Foto menu belum dicoba dengan berkas sungguhan (hanya placeholder yang terlihat). Uji: taruh berkas di `public/img`, push, isi nama berkasnya lewat Ubah.
- Belum dibuktikan dengan data: nama kembar (termasuk saat Aktifkan kembali), batas harga 200000, Nonaktifkan dan Aktifkan kembali, serta 403 bila customer atau penjaga memanggil `menu_simpan`, `menu_stok`, atau `menu_nonaktif`. Diuji di MNU.06.
- Nama kembar dikenali dari teks pesan ("nama yang sama"), sedangkan Handoff #2 menyebut kode `nama_kembar`; cek mana yang benar saat uji.
- Handler fetch `sw.js` menyimpan semua respons sukses domain sendiri, jadi foto menu ikut tersimpan walau tidak ada di `DAFTAR_CACHE`. Putuskan nanti apakah perlu dikecualikan.
- Menu dummy dari uji ini tetap ada (menu tidak bisa dihapus); nonaktifkan atau pakai ulang sebelum peluncuran.

**Saran giliran berikutnya:** MNU.06 (sesi tes menu, High-Risk P0, bukti untuk hak owner dan harga). Lampirkan `AGENTS.md` + `menu.md` + `database.md` + `security.md`; dokumen `menu-test.md` dibuat di sesi tes. Pakai satu akun per peran (owner, penjaga, customer) dengan data dummy, dan bukti diperiksa di chat lalu tidak disimpan. Setelah itu ORD.01 (migration order, butuh "OK" ketua); di ORD, tombol pilih menu dipasang di `buatKartuPelanggan`, dan tab Pesan di `kerangka.js` sudah memakai panel `pesan`.

### 2026-11-07: Deskripsi, sheet detail, dan pilihan menu (permintaan owner)

**Berkas tujuan:** `docs/menu.md` bagian 9. Menggantikan butir "paket atau varian (pedas, porsi)" di bagian 8 (Ditunda) dan menambah MN4. Yang paling akhir menang.

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

**Dampak teknis (butuh "OK" ketua)**

Tabel `menu` sudah live: kolom `deskripsi` adalah perubahan pada tabel yang ada. Tabel grup, opsi, dan pemasangan ke menu baru, serta `menu_simpan` dan `menu_daftar` berubah. Layar Kelola Menu dan `menu.js` (sudah sekitar 800 baris) ikut berubah; komponen sheet sebaiknya berkas baru, sehingga `sw.js` perlu didaftar (butuh "OK").

**Belum diputuskan:** target ukuran foto, batas deskripsi, dan menu Habis boleh dibuka sheet-nya (bawaan: boleh).

### Handoff #5 | 2026-11-07 | [RAC]

**Berkas tujuan:** `docs/menu.md` bagian 9. Yang paling akhir menang.

**Tugas:** MNU.08 selesai (sheet detail menu untuk customer). Sudah di-push dalam dua giliran (hash belum dicatat): giliran 1 tanpa "OK" karena tidak menyentuh `sw.js`, giliran 2 dengan "OK" ketua (diberikan di chat) karena mengubah `sw.js`. Hasil lihat langsung di HP dan laptop: ketuk kartu di tab Pesan membuka sheet berisi foto besar, nama, harga, dan lencana; foto tidak pecah; menu Habis abu-abu, tetap bisa dibuka, dan ada teks "Menu ini sedang habis, jadi belum bisa dipilih."; menu tanpa foto menampilkan "Tanpa foto" tanpa galat; sheet tutup lewat X, ketuk area gelap, dan geser turun (geser pendek kembali ke atas); mode pesawat tetap jalan. Bukti diperiksa di chat dan tidak disimpan.

**Berkas diubah:** `public/menu-detail.js` (baru), `public/menu.js`, `public/style.css` (blok MNU.08 di akhir), `public/index.html` (satu tag script sebelum `menu.js`), `public/sw.js` (`menu-detail.js` masuk daftar cache, cache `chata-v8` jadi `chata-v9`). Tidak ada kode lama yang dihapus; semuanya tambahan.

**Keputusan baru:**

- Komponen sheet berdiri sendiri di `menu-detail.js` (`window.KedaiMenuDetail`, fungsi `buka` dan `tutup`), elemennya dibuat lewat JS. `menu.js` hanya menambah kait kecil di `buatKartuPelanggan` dan penutupan sheet di `resetPelanggan`. Alasan: `menu.js` sudah sekitar 850 baris. Kait hanya aktif bila komponen termuat.
- Sheet hanya menampilkan. Tombol tambah dan jumlah dipasang di sini saat ORD dikerjakan. Ketukan pada tombol di dalam kartu tidak membuka sheet.
- Cara tutup: tombol X, ketuk area gelap, geser turun (lebih dari sekitar 80 px = tutup), dan Esc di keyboard. Geser hanya untuk layar sentuh. Sheet ditutup seketika saat Keluar.
- Bagian deskripsi hanya tampil bila `deskripsi` berupa teks tidak kosong. `bacaMenuPelanggan` di `menu.js` belum menyalin field itu, jadi deskripsi belum tampil sampai MNU.07.
- Hasil lihat langsung: foto menu ukuran sekitar 30 sampai 50 KB tidak pecah saat diperbesar di sheet. **Target ukuran foto tetap belum diputuskan ketua.**
- Alasan pilihan tampilan (tinggi maksimal 85% layar, lebar maksimal 560 px di layar lebar) belum tercatat dari ketua.

**Belum beres:**

- Target ukuran foto untuk zoom belum diputuskan ketua (lihat di atas).
- Deskripsi belum tampil; menunggu MNU.07.
- Saat ORD menambah tombol di sheet, tahanan Tab di `tekanTombol` (`menu-detail.js`) perlu disesuaikan, karena sekarang hanya ada satu elemen yang bisa difokus (tombol X).
- Menu dummy dari tes (termasuk yang tanpa foto) tidak bisa dihapus; nonaktifkan atau pakai ulang sebelum peluncuran.
- Handler fetch `sw.js` menyimpan semua respons sukses domain sendiri, jadi foto menu ikut tersimpan walau catatan lama bilang cukup di-cache browser. Masih menunggu keputusan (carry-over dari Handoff #3 dan #4).
- Belum dibuktikan dengan data (diuji di MNU.06): nama kembar, batas harga 200000, Nonaktifkan dan Aktifkan kembali, dan 403 untuk non-owner.

**Saran giliran berikutnya:** MNU.07 (kolom deskripsi, High-Risk, butuh "OK" ketua karena mengubah tabel `menu` yang sudah live). Lampirkan `AGENTS.md` + `menu.md` + `database.md` + `security.md`, berkas migration terbaru, `supabase/functions/kedai/`, serta `menu.js`, `menu-detail.js`, `index.html`, `style.css`, `sw.js`. Isinya: kolom `deskripsi` (opsional, maksimal 200 karakter, batas disimpan di database), `menu_simpan` dan `menu_daftar` diperluas, isian deskripsi di Kelola Menu, lalu `bacaMenu` dan `bacaMenuPelanggan` menyalin `deskripsi` supaya muncul di sheet. Jelaskan dampaknya ke ketua dulu; ringkasan WA bisa dibuat bila yang bertugas bukan ketua.

### Handoff #6 | 2026-11-07 | KETUA

**Berkas tujuan:** `docs/menu.md` bagian 9. Menggantikan butir "batas deskripsi" yang tertulis belum diputuskan di blok `2026-11-07: Deskripsi, sheet detail, dan pilihan menu`. Yang paling akhir menang.

**Tugas:** MNU.07 selesai (deskripsi menu). Kolom `deskripsi`, pengaturan, dan fungsi SQL sudah jalan di production; `kedai` sudah dideploy; aplikasi sudah di-push (commit `135538e`, Pages hijau). Cek SQL 1 sampai 5 dan uji perilaku fungsi lulus (rapikan, kosong jadi NULL, 201 karakter ditolak, 200 karakter diterima). Hasil lihat langsung: owner mengisi deskripsi tiga baris bergaya bullet lewat Ubah dan tersimpan; customer membuka sheet detail dan deskripsi tampil tiga baris terpisah, juga pada menu Habis; Nonaktifkan lalu Aktifkan kembali tidak menghapus deskripsi; sheet tutup lewat X, ketuk area gelap, dan geser turun di HP. Bukti diperiksa di chat dan tidak disimpan.

**Berkas diubah:** `supabase/migrations/20261107_03_menu_deskripsi.sql`, `supabase/migrations/20261107_03_menu_deskripsi_batal.sql`, `supabase/templates/20261107_03_menu_deskripsi_cek.sql`, `supabase/templates/20261107_03_menu_deskripsi_uji.sql`, `supabase/functions/kedai/index.ts` (hanya penambahan), `public/menu.js`, `public/index.html`. `style.css` dan `sw.js` tidak disentuh (cache tetap `chata-v9`; tidak ada berkas JS baru). Di `menu.js` dua baris lama ikut diubah, hanya untuk menambah `deskripsi`: baris komentar header dan baris `var data` di `kirim`. Sisanya tambahan.

**Keputusan baru:**

- Deskripsi opsional dan **boleh beberapa baris** (Enter); untuk daftar, owner mengawali tiap baris dengan "- ". Batas **200 karakter**, disimpan di pengaturan `deskripsi_menu_maks`. Usulan owner, diputuskan ketua di chat; alasan selebihnya belum tercatat.
- Server merapikan sebelum simpan: akhir baris CR jadi satu jenis baris baru, karakter kontrol dibuang, spasi berulang jadi satu, spasi di tepi tiap baris dibuang, baris kosong beruntun jadi satu, baris kosong di awal dan akhir dibuang, hasil kosong disimpan NULL. Panjang dihitung setelah dirapikan (satu Enter = satu karakter).
- `menu_simpan` **wajib** menerima field `deskripsi` (teks, boleh kosong); bila field tidak ada, dibalas 400. Deskripsi kosong menghapus deskripsi lama. Karena itu aksi Aktifkan kembali ikut mengirim deskripsi.
- `menu_daftar` kini membawa `deskripsi` ke semua peran (customer dan penjaga ikut melihatnya).
- Kode galat baru `deskripsi_tidak_valid` (400, "Deskripsi menu terlalu panjang.", tanpa angka karena batasnya ada di pengaturan).
- Tabel `menu` punya pagar bentuk untuk `deskripsi` (tidak kosong, tanpa spasi di tepi, tanpa CR); batas panjang dijaga fungsi dari pengaturan, sama seperti `harga_maks_menu`.
- Fungsi `menu_simpan` versi 7 argumen dibuat **tanpa nilai bawaan** pada `p_deskripsi`, dan versi 6 argumen (MNU.02) sengaja dibiarkan supaya `kedai` lama tetap jalan selama deploy; panggilan lama dan baru tidak ambigu.

**Belum beres:**

- Fungsi `menu_simpan` versi 6 argumen masih ada di database dan tidak dipanggil lagi. Butir baru untuk sheet: "Buang fungsi menu_simpan lama". High-Risk, butuh "OK" ketua, tidak mendesak.
- Penolakan deskripsi lebih dari 200 karakter terbukti di server (uji SQL) tetapi belum dilihat lewat aplikasi (pesan merah di form). Diuji di MNU.06.
- Deskripsi belum tampil di kartu Kelola Menu (owner); hanya terlihat di form Ubah dan sheet detail customer.
- Blok susulan untuk `docs/database.md` bagian 9 (kolom `deskripsi`, pengaturan `deskripsi_menu_maks`, fungsi `menu_simpan` 7 argumen, `menu_daftar` membawa `deskripsi`) belum ditempel.
- Carry-over dari Handoff #3 sampai #5 tetap berlaku: target ukuran foto belum diputuskan; cara mengenali nama kembar (teks pesan atau kode); handler fetch `sw.js` ikut menyimpan foto menu; belum dibuktikan dengan data di MNU.06 (batas harga 200000, Nonaktifkan dan Aktifkan kembali dengan nama kembar, 403 untuk non-owner).
- Menu dummy dari uji tetap ada (menu tidak bisa dihapus); nonaktifkan atau pakai ulang sebelum peluncuran.

**Saran giliran berikutnya:** MNU.09 (grup pilihan gratis: tabel grup, opsi, dan pemasangan ke menu; High-Risk, butuh "OK" ketua karena tabel dan fungsi baru serta `menu_simpan` dan `menu_daftar` berubah lagi), sesuai urutan sheet. Lampirkan `AGENTS.md` + `menu.md` + `database.md` + `security.md`, migration terbaru (`20261107_03_menu_deskripsi.sql`), `supabase/functions/kedai/`, `menu.js`, `menu-detail.js`, `index.html`, `style.css`, `sw.js`. `menu.js` kini 874 baris (pedoman sekitar 500), jadi komponen baru sebaiknya berkas terpisah; berkas JS baru wajib didaftarkan di `sw.js` (butuh "OK"). Sesi tes MNU.06 (High-Risk P0, bukti untuk hak owner dan harga) dapat dijalankan sebelum atau sesudah MNU.09 sampai MNU.11; ketua yang memutuskan.

### Handoff #7 | 2026-11-07 | FREN

**Berkas tujuan:** `docs/menu.md` bagian 9. Yang paling akhir menang.

**Tugas:** MNU.09 **baru separuh**: giliran 1 (SQL) selesai dan sudah jalan di production; giliran 2 (aksi `kedai`) belum dikerjakan. **Jangan dicentang di sheet dulu.** "OK" ketua untuk tabel dan fungsi baru serta angka batas diberikan lewat WA (ketua setuju pada usulan). Migration dijalankan manual di SQL Editor akun ketua. Cek struktur 1 sampai 6 lulus, uji perilaku fungsi 60 lulus dan 0 gagal (uji dibatalkan otomatis, cek sesudah uji menunjukkan 0 grup, 0 opsi, 0 pemasangan). Bukti diperiksa di chat dan tidak disimpan.

**Berkas diubah (semua baru, belum di-commit dan belum di-push):** `supabase/migrations/20261107_04_menu_grup_pilihan.sql`, `supabase/migrations/20261107_04_menu_grup_pilihan_batal.sql`, `supabase/templates/20261107_04_menu_grup_pilihan_cek.sql`, `supabase/templates/20261107_04_menu_grup_pilihan_uji.sql` (pastikan keempatnya ada di folder repo ChATA sebelum commit). Tidak ada kode lama yang dihapus. `menu_daftar` diganti di tempat (hanya menambah field `grup`); `menu_simpan` tidak disentuh. `index.ts`, `menu.js`, `index.html`, `style.css`, dan `sw.js` tidak disentuh.

**Keputusan baru (usulan penulis, disetujui ketua lewat WA; alasan selebihnya belum tercatat):**

- Tiga tabel baru: `grup_pilihan`, `opsi_pilihan`, `menu_grup`. RLS aktif tanpa policy, `service_role` hanya baca, tambah, dan ubah (tanpa DELETE). Melepas grup dari menu = penanda aktif jadi false.
- Pengaturan baru: `grup_maks_per_menu` = 3 dan `opsi_maks_per_grup` = 6. Keduanya dihitung dari yang **aktif** saja (yang nonaktif tidak bisa dihapus).
- Tiap grup: minimal 2 opsi aktif, tepat satu opsi bawaan dan harus aktif. Nama grup 3 sampai 30 karakter, nama opsi 2 sampai 30 karakter (bentuk data, dijaga tabel dan fungsi, tidak di pengaturan). Nama grup aktif tidak boleh kembar; nama opsi aktif tidak boleh kembar dalam satu grup (huruf besar dan kecil dianggap sama).
- `grup_simpan(p_oleh, p_id, p_nama, p_opsi, p_aktifkan default false)`: owner; id kosong = grup baru. `p_opsi` adalah **daftar lengkap** opsi (array JSON), urutan daftar = urutan tampil; tiap elemen `{id (kosong bila baru), nama, bawaan, aktif (bila tidak ada dianggap true)}`. Saat mengubah grup, semua opsi lama (termasuk yang nonaktif) wajib ikut; yang dibuang dikirim dengan `aktif: false`, bila ada yang kurang ditolak (`opsi_tidak_lengkap`). Grup nonaktif hanya bisa diubah bila `p_aktifkan` = true (sekaligus mengaktifkannya kembali). Mengembalikan id grup.
- `grup_nonaktif(p_oleh, p_id)`: owner; opsi dan pemasangannya tidak diubah.
- `grup_daftar(p_semua)`: grup beserta opsinya untuk layar owner; `true` memuat grup dan opsi nonaktif juga (supaya bisa dikirim balik lengkap ke `grup_simpan`), `false` hanya yang aktif. Fungsinya tidak memeriksa peran; pembatasan ke owner dilakukan `kedai`, sama seperti `menu_daftar`.
- `menu_grup_atur(p_oleh, p_menu_id, p_grup_ids uuid[])`: owner; daftar **lengkap** grup aktif yang diinginkan untuk satu menu, urutan daftar = urutan tampil; daftar kosong = lepas semua.
- `opsi_periksa(p_menu_id, p_opsi_ids uuid[])` mengembalikan `[{grup_id, grup_nama, opsi_id, opsi_nama}]`, satu per grup aktif yang terpasang di menu itu; grup tanpa pilihan memakai opsi bawaan. Menolak (`opsi_tidak_valid`) opsi nonaktif, opsi dari grup yang tidak terpasang di menu itu, id dobel, id kosong, dan dua opsi dari grup yang sama. Disiapkan untuk ORD.01; **belum dipanggil siapa pun**.
- `menu_daftar` kini membawa `grup` di tiap menu: `[{id, nama, opsi: [{id, nama, bawaan}]}]`, hanya grup dan opsi aktif, ke semua peran.
- Kode galat baru (untuk peta galat `kedai`): `grup_nama_tidak_valid`, `grup_nama_kembar`, `grup_tidak_ditemukan`, `grup_tidak_aktif`, `grup_tidak_valid`, `grup_terlalu_banyak`, `opsi_tidak_valid`, `opsi_tidak_lengkap`, `opsi_nama_kembar`, `opsi_terlalu_banyak`, `pilihan_rusak` (data tidak konsisten; seharusnya tidak pernah muncul).

**Belum beres:**

- Giliran 2 MNU.09: aksi `kedai` untuk `grup_daftar`, `grup_simpan`, `grup_nonaktif`, dan `menu_grup_atur` (semuanya owner saja; `menu_daftar` sudah membawa `grup` tanpa perubahan di `kedai`), peta galat untuk kode baru (pesan tanpa angka, karena batas ada di pengaturan, seperti `deskripsi_tidak_valid`), lalu deploy `kedai` (butuh "OK" ketua, urutan aman `AGENTS.md` bagian 8).
- Aplikasi belum membaca field `grup`. Layar owner = MNU.10, tampilan pilihan di sheet detail = MNU.11.
- Blok susulan `docs/database.md` bagian 9 untuk MNU.07 (dari Handoff #6) dan MNU.09 belum ditempel; usul: ditulis sekaligus setelah giliran 2.
- Berkas uji `20261107_04_menu_grup_pilihan_uji.sql` hanya bisa dijalankan selama **belum ada grup pilihan** di database (jalan berhenti dengan pesan bila sudah ada); jangan dipakai ulang setelah owner membuat grup.
- Fungsi `menu_simpan` versi 6 argumen masih ada di database (carry-over Handoff #6).
- Carry-over Handoff #3 sampai #6 tetap berlaku: target ukuran foto belum diputuskan; cara mengenali nama kembar; handler fetch `sw.js` ikut menyimpan foto menu; belum dibuktikan dengan data di MNU.06; menu dummy dari uji tidak bisa dihapus. `menu.js` sekitar 874 baris (pedoman sekitar 500), komponen baru sebaiknya berkas terpisah dan wajib didaftarkan di `sw.js` (butuh "OK").

**Saran giliran berikutnya:** giliran 2 MNU.09 (aksi `kedai`, High-Risk, deploy butuh "OK" ketua). Lampirkan `AGENTS.md` + `menu.md` (sudah memuat handoff ini) + `database.md` + `security.md`, `supabase/functions/kedai/index.ts` versi terbaru, dan `20261107_04_menu_grup_pilihan.sql`. Berkas aplikasi belum perlu sampai MNU.10. Sesudah MNU.09 selesai, dicentang, lalu MNU.10 (layar owner), MNU.11, dan sesi tes MNU.06 (ketua yang memutuskan urutannya).

### Handoff #8 | 2026-11-07 | KETUA

**Berkas tujuan:** `docs/menu.md` bagian 9. Yang paling akhir menang.

**Tugas:** MNU.09 **selesai** (giliran 2: aksi grup pilihan di `kedai`). Sudah dideploy dengan urutan aman `AGENTS.md` bagian 8 ("OK" ketua diberikan di chat) dan di-push (commit `17ef790`). Hasil tes lewat Console browser dengan akun dummy: owner memanggil `grup_daftar` (200, grup 0), `grup_nonaktif` dan `menu_grup_atur` dengan id kosong-kosongan (404, pesan "tidak ditemukan"), `grup_simpan` dengan satu opsi (400, pesan aturan pilihan), semuanya tanpa menyimpan data; customer dan penjaga memanggil keempat aksi dan **semuanya 403** ("hanya untuk owner"); aksi lama `status` dan `menu_daftar` tetap normal. Token akses dibersihkan dari Mac dan sesi dashboard di-logout. Bukti diperiksa di chat dan tidak disimpan.

**Berkas diubah:** `supabase/functions/kedai/index.ts` saja (hanya penambahan, tidak ada baris lama yang dihapus atau diubah; tambahan sekitar 226 baris). Berkas lain tidak disentuh.

**Keputusan baru (pilihan penulis; "OK" deploy dari ketua, alasan selebihnya belum tercatat):**

- Empat aksi baru di `kedai`: `grup_daftar`, `grup_simpan`, `grup_nonaktif`, `menu_grup_atur`. Semuanya **owner saja**, dicek dua lapis (di `kedai` dan di fungsi SQL).
- Isian permintaan: `grup_daftar` tanpa isian; `grup_simpan` = `id` (kosong = grup baru), `nama`, `opsi` (daftar **lengkap**, tiap elemen `id`, `nama`, `bawaan`, `aktif`), `aktifkan`; `grup_nonaktif` = `id`; `menu_grup_atur` = `menu_id` dan `grup_ids` (daftar lengkap grup aktif, kosong = lepas semua).
- `grup_daftar` selalu meminta semua grup dan opsi, termasuk yang nonaktif, supaya bisa dikirim balik lengkap ke `grup_simpan`.
- Balasan sukses: `grup_daftar` membawa `grup`; `grup_simpan` membawa `id`, `grup`, dan `menu`; `grup_nonaktif` membawa `grup` dan `menu`; `menu_grup_atur` membawa `menu`. Aplikasi tidak perlu memanggil ulang.
- `kedai` hanya meneruskan field `id`, `nama`, `bawaan`, `aktif` dari tiap opsi, dengan pagar kasar 100 opsi dan 50 grup per permintaan. Batas sebenarnya tetap dijaga fungsi SQL dari pengaturan.
- Peta galat `PETA_GALAT_GRUP`: `bukan_owner` 403; `grup_tidak_ditemukan` dan `menu_tidak_ditemukan` 404; `grup_nama_kembar`, `opsi_nama_kembar`, `grup_tidak_aktif`, `opsi_tidak_lengkap`, `grup_terlalu_banyak`, `opsi_terlalu_banyak` 409; `grup_nama_tidak_valid`, `grup_tidak_valid`, `opsi_tidak_valid` 400. Pesan batas jumlah tanpa angka karena batasnya ada di pengaturan. Kode `id_kosong` dan `pengaturan_rusak` sengaja tidak dipetakan (jadi galat umum 500). Kode `pilihan_rusak` belum dipetakan karena hanya keluar dari `opsi_periksa`; dipetakan di ORD.01.

**Belum beres:**

- Jalur **sukses** `grup_simpan`, `grup_nonaktif`, dan `menu_grup_atur` dengan data belum pernah dicoba lewat `kedai`; yang terbukti baru jalur galat dan 403. Masuk sesi tes MNU.06 (butir sheet: "Tes aksi grup dengan data").
- Koreksi: blok `docs/database.md` untuk MNU.07 **sudah ada** (judul "Deskripsi menu"), jadi catatan "belum ditempel" di Handoff #6 dan #7 tidak berlaku. Blok MNU.09 ditempel bersamaan dengan handoff ini.
- Aplikasi belum membaca field `grup` dari `menu_daftar`. Layar owner = MNU.10, tampilan pilihan di sheet detail = MNU.11.
- Berkas uji `20261107_04_menu_grup_pilihan_uji.sql` hanya bisa dijalankan selama belum ada grup pilihan di database; jangan dipakai ulang setelah owner membuat grup.
- Carry-over Handoff #3 sampai #7 tetap berlaku: fungsi `menu_simpan` 6 argumen masih ada di database; target ukuran foto belum diputuskan; cara mengenali nama kembar (teks pesan atau kode); handler fetch `sw.js` ikut menyimpan foto menu; belum dibuktikan dengan data di MNU.06 (batas harga 200000, Nonaktifkan dan Aktifkan kembali dengan nama kembar, 403 untuk non-owner); menu dummy dari uji tidak bisa dihapus. `menu.js` sekitar 874 baris (pedoman sekitar 500), komponen baru sebaiknya berkas terpisah dan wajib didaftarkan di `sw.js` (butuh "OK").

**Saran giliran berikutnya:** MNU.10 (layar owner: kelola grup pilihan, buat sekali lalu centang di tiap menu). Lampirkan `AGENTS.md` + `menu.md` (sudah memuat handoff ini) + `desain.md`, serta `menu.js`, `menu-detail.js`, `akun.js` (pembungkus `panggilKedai`), `kerangka.js`, `index.html`, `style.css`, dan `sw.js`. `database.md` dan `security.md` belum perlu karena tidak ada perubahan tabel atau fungsi. Catatan desain: `grup_simpan` meminta daftar opsi lengkap, jadi layar harus memuat dulu lewat `grup_daftar`. Berkas JS baru wajib didaftarkan di `sw.js` (butuh "OK" ketua). Sesudahnya MNU.11 lalu sesi tes MNU.06 (ketua yang memutuskan urutannya).

### 2026-11-07: Layar Kelola Grup terpisah, dan cara memasang grup ke menu (MNU.10)

**Berkas tujuan:** `docs/menu.md` bagian 9. Melengkapi blok `2026-11-07: Deskripsi, sheet detail, dan pilihan menu` dan Handoff #8. Yang paling akhir menang.

- Layar **Kelola Grup** adalah **layar terpisah** (bukan bagian layar Kelola Menu), dibuka dari **tombol di tab Menu**. Keputusan ketua (disampaikan lewat anggota tim).
- **Tidak ada grup contoh atau grup siap pakai.** Owner membuat semua grup sendiri dari nol. Keputusan ketua.
- Grup dibuat **sekali**, lalu dipasang ke **banyak menu** (mekanisme yang sudah ada di server, MNU.09).
- Pemasangan dilakukan dari **sisi grup**: di layar Kelola Grup, tiap grup menampilkan daftar menu dengan kotak centang (memanggil `menu_grup_atur`). Ketua belum punya preferensi; dipilih mengikuti rekomendasi AI. Alasan selebihnya belum tercatat.
- Pemasangan dari form Ubah menu (sisi menu) **tidak dibuat** di MNU.10.

### Handoff #9 | 2026-11-08 | [RAC]

**Berkas tujuan:** `docs/menu.md` bagian 9. Yang paling akhir menang.

**Tugas:** MNU.10 **selesai** (layar owner Kelola Grup pilihan: buat, ubah, nonaktifkan, aktifkan kembali grup beserta opsinya, dan pasang grup ke menu dengan kotak centang). "OK" ketua untuk perubahan `sw.js` sudah diberikan. Aplikasi di-push (commit `641c948`). Hasil lihat langsung dengan akun owner di production: layar terbuka dari tombol "Kelola grup pilihan" di tab Menu dan `grup_daftar` terbaca; grup "Level pedas" (Tidak pedas bawaan, Sedang, Pedas) dibuat lewat `grup_simpan` dan tampil sebagai kartu Aktif; panel "Pasang ke menu" memuat empat menu dari `menu_daftar`; mencentang menu memasang grup dan ringkasan kartu berubah; centang tetap ada setelah Muat ulang; melepas centang berhasil; Nonaktifkan lalu Aktifkan kembali grup berhasil. Sebelum itu, `grup.js` dan `akun.js` lolos `node --check`, dan perilaku pemasangan diuji di browser dengan data tiruan (centang, lepas, galat 409 mengembalikan kotak). Bukti diperiksa di chat dan tidak disimpan.

**Berkas diubah:** `public/grup.js` (baru, sekitar 1000 baris), `public/akun.js` (hanya tambahan: komentar header, `"grup"` di `LAYAR`, `KedaiGrup.reset()` di `keluar()`), `public/index.html` (hanya tambahan: tombol `menu-ke-grup`, section `layar-grup`, tag `grup.js`), `public/style.css` (hanya tambahan di akhir: `.pasang-menu` dan turunannya), `public/sw.js` (dua baris: `grup.js` masuk `DAFTAR_CACHE`, cache `chata-v9` jadi `chata-v10`). `menu.js`, `menu-detail.js`, dan `kerangka.js` tidak disentuh.

**Keputusan baru (ketua, lewat perantara; pilihan A dari rekomendasi AI):**

- Kelola Grup adalah **layar terpisah**, dibuka dari tombol "Kelola grup pilihan" di tab Menu. Tidak ada grup contoh: owner mendefinisikan sendiri, lalu dipasang ke banyak menu (grup = template yang dibuat sekali).
- Pemasangan dilakukan **dari sisi grup**: tombol "Pasang ke menu" di kartu grup aktif membuka daftar menu dengan kotak centang; tiap ketukan langsung menyimpan lewat `menu_grup_atur`. Grup nonaktif tidak punya tombol pasang.
- Yang dikirim ke `menu_grup_atur`: daftar lengkap grup aktif menu itu dengan urutan lama; grup yang baru dicentang di urutan terakhir (urutan tampil = urutan pemasangan). Batas jumlah grup per menu tidak dihitung di aplikasi; pesan penolakan server ditampilkan apa adanya dan kotak dikembalikan.
- Menu yang datanya tidak punya daftar `grup` dianggap tidak terbaca (tidak dipakai), supaya satu ketukan tidak melepas grup lain dari menu itu. Menu nonaktif tetap bisa diberi grup (ditandai "(nonaktif)").
- Editor opsi: opsi bawaan tidak punya tombol hapus; opsi baru "Hapus opsi", opsi lama "Nonaktifkan opsi" (dikirim `aktif: false`); grup baru mulai dengan 2 opsi kosong (pertama bawaan); opsi baru yang kosong diabaikan saat kirim. Validasi klien hanya kemudahan (nama grup 3–30, opsi 2–30, minimal 2 opsi aktif, tepat 1 bawaan, tidak kembar); keputusan akhir di server.
- Nama grup dan opsi tampil persis seperti diketik (tidak diubah huruf besar-kecilnya).
- Bentuk data yang terbukti benar di production: `grup_daftar` membawa `grup` berbentuk `{id, nama, aktif, opsi:[{id, nama, bawaan, aktif}]}`; `menu_daftar` membawa `grup` per menu.
- Terbukti lewat tes langsung: menonaktifkan grup lalu mengaktifkannya kembali **tidak** melepas pemasangannya; grup yang tadi terpasang di menu langsung tercentang lagi tanpa dipasang ulang. Selama nonaktif, menu tidak menampilkannya sebagai terpasang.
- Diputuskan ketua (2026-11-08): **MNU.11 hanya menampilkan** grup pilihan dan opsinya (read-only) di sheet detail customer, memakai field `grup` yang sudah dibawa `menu_daftar`; opsi bawaan ditandai "(bawaan)". **Memilih opsi** (ketuk, masuk keranjang, tersimpan di order) dikerjakan di **ORDER (ORD.01 dan seterusnya)**, bukan di MNU.11.

**Belum beres:**

- Belum dicoba dengan data nyata: Ubah grup (termasuk menonaktifkan opsi dan mengganti bawaan) dan penolakan batas jumlah grup per menu (`grup_terlalu_banyak`) lewat aplikasi. Penolakan nama grup kembar (server, 409) dan nama opsi kembar (cek di layar) sudah terbukti. Masuk butir sheet "Tes aksi grup dengan data" di sesi tes MNU.06.
- Grup dan menu uji ("Level pedas" terpasang di satu menu atau lebih) tetap ada karena tidak bisa dihapus; nonaktifkan atau pakai ulang sebelum peluncuran. Berkas uji `20261107_04_menu_grup_pilihan_uji.sql` tidak boleh dijalankan lagi (sudah ada grup).
- Tampilan pilihan di sheet detail customer = MNU.11, belum dikerjakan. `opsi_periksa` belum dipanggil siapa pun (ORD.01).
- Pemilihan opsi oleh customer belum ada di aplikasi (sampai MNU.11, customer hanya bisa melihat opsi). Dikerjakan di ORD.01: tombol pilih di sheet detail atau keranjang, lalu `opsi_periksa` dipanggil saat order dibuat. Kode galat `pilihan_rusak` ikut dipetakan di `kedai` pada saat itu.
- Carry-over Handoff #3 sampai #8 tetap berlaku (fungsi `menu_simpan` 6 argumen masih ada; ukuran foto; nama kembar; handler fetch `sw.js` untuk foto menu; bukti MNU.06; menu dummy tidak bisa dihapus). `menu.js` sekitar 874 baris; berkas JS baru wajib didaftarkan di `sw.js` (butuh "OK").

**Saran giliran berikutnya:** MNU.11, **read-only** (pilihan grup hanya tampil di sheet detail customer, memakai field `grup` yang sudah dibawa `menu_daftar`; pemilihan opsi ada di ORDER, lihat keputusan ketua di atas). Perkiraan satu giliran: tidak ada aksi server atau migration baru, perubahan di `menu-detail.js` dan sedikit tambahan `style.css`. Lampirkan `AGENTS.md` + `menu.md` (sudah memuat handoff ini) + `desain.md`, serta `menu.js`, `menu-detail.js`, `index.html`, `style.css`, dan `sw.js`. Sesudahnya sesi tes MNU.06 (ketua yang memutuskan urutannya).

### Handoff #10 | 2026-11-08 | FREN

**Berkas tujuan:** `docs/menu.md` bagian 9 (tempel paling bawah). Yang paling akhir menang.

**Tugas:** MNU.11 **selesai** (pilihan grup tampil, hanya dibaca, di sheet detail customer). Tanpa aksi server, migration, atau perubahan `sw.js`, jadi tidak butuh "OK" ketua (cache tetap `chata-v10`). Hasil lihat langsung di layar sempit dan di HP Android (jalan, emoji dan keterangan tampil): menu dengan grup "Level pedas" menampilkan judul grup dan tiga opsi di bawah deskripsi, dengan garis pemisah; tanda centang hanya di "Tidak pedas". Tes DOM tiruan: menu tanpa grup dan grup tanpa opsi tidak menampilkan bagian pilihan. Bukti diperiksa di chat dan tidak disimpan. Sudah di-push (commit `8f9d8fd`).

**Berkas diubah:** `public/menu-detail.js` (fungsi `buatGrup`, pemanggilan di `isiSheet`, komentar header), `public/menu.js` (fungsi `bacaGrupPelanggan` dan satu field `grup` di `bacaMenuPelanggan`), `public/style.css` (blok MNU.11 di akhir, termasuk `.sheet-menu__legenda`). Semuanya hanya tambahan; tidak ada kode lama yang dihapus atau diubah.

**Keputusan baru:**

- Opsi bawaan ditandai **emoji centang (✅)** setelah nama opsi (contoh "Tidak pedas ✅"), **menggantikan** tulisan "(bawaan)" yang tadinya dipakai di keputusan ketua 2026-11-08 (Handoff #9). Diputuskan ketua lewat perantara; alasan belum tercatat.
- Di bawah semua grup ada satu baris keterangan kecil: **"✅ = otomatis dipilih kalau tidak diganti"**. Dipilih ketua dari dua usulan (yang lain "✅ = pilihan standar"); alasan belum tercatat.
- Pilihan di sheet hanya **tulisan**: tanpa tombol, tombol radio, atau kotak pilih, supaya tidak terkesan bisa diketuk. Memilih opsi tetap di ORD.
- `bacaGrupPelanggan` hanya meneruskan `nama` dan `bawaan` per opsi (id tidak dibawa karena belum dipakai). Elemen dengan bentuk salah dibuang; grup tanpa opsi terbaca tidak ditampilkan.
- Menu Habis tetap menampilkan pilihannya.

**Belum beres:**

- Sudah dicek di Android dan jalan. iPhone belum dicek (tidak ada perangkat uji, `AGENTS.md` bagian 10 butir 7); bentuk emoji bisa sedikit beda, keluhan pengguna iPhone dihitung di review pemakaian.
- Saat ORD menambah tombol di sheet, tahanan Tab di `tekanTombol` (`menu-detail.js`) perlu disesuaikan (sekarang hanya tombol X yang bisa difokus). Carry-over Handoff #5.
- Pemilihan opsi oleh customer belum ada. Dikerjakan di ORD.01 (`opsi_periksa` dipanggil saat order dibuat; kode galat `pilihan_rusak` ikut dipetakan di `kedai`).
- Carry-over Handoff #3 sampai #9 tetap berlaku: fungsi `menu_simpan` 6 argumen masih ada; target ukuran foto belum diputuskan; cara mengenali nama kembar (teks pesan atau kode); handler fetch `sw.js` ikut menyimpan foto menu; belum dibuktikan dengan data di MNU.06 (batas harga 200000, Nonaktifkan dan Aktifkan kembali dengan nama kembar, 403 untuk non-owner, aksi grup dengan data: Ubah grup, menonaktifkan opsi, mengganti bawaan, `grup_terlalu_banyak`); grup dan menu dummy tidak bisa dihapus (nonaktifkan atau pakai ulang sebelum peluncuran); berkas uji `20261107_04_menu_grup_pilihan_uji.sql` tidak boleh dijalankan lagi. `menu.js` kini sekitar 900 baris (pedoman sekitar 500); komponen baru sebaiknya berkas terpisah dan wajib didaftarkan di `sw.js` (butuh "OK").

**Saran giliran berikutnya:** MNU.06 (sesi tes menu, High-Risk P0; bukti untuk hak owner, harga, dan aksi grup dengan data). Lampirkan `AGENTS.md` + `menu.md` (sudah memuat handoff ini) + `database.md` + `security.md`; dokumen `menu-test.md` dibuat di sesi tes. Pakai satu akun per peran (owner, penjaga, customer) dengan data dummy. Atau ORD.01 (migration order, butuh "OK" ketua) bila ketua memilih itu dulu; urutannya ketua yang memutuskan.

### Handoff #11 | 2026-11-08 | [AIK]

**Berkas tujuan:** `docs/menu.md` bagian 9 (tempel paling bawah, di bawah Handoff #10). Yang paling akhir menang.

**Tugas:** Sesi tes MNU.06 **baru sebagian**. **Jangan dicentang di sheet dulu.** Tidak ada kode aplikasi, SQL, atau Edge Function yang diubah. Yang baru hanya `docs/menu-test.md` (kasus uji MT-01 sampai MT-24; simpan di repo). Semua tes lewat Console browser dengan akun dummy owner, penjaga, dan customer. Bukti diperiksa di chat dan tidak disimpan.

**Sudah lulus, jangan diulang** (nomor kasus di `docs/menu-test.md`): MT-01 sampai MT-11, MT-13, MT-15 sampai MT-22. Dari daftar itu, MT-03, MT-11, MT-19, MT-20, MT-21, dan MT-22 terbukti di sesi kode (Handoff #1 sampai #10); sisanya di sesi tes 8 Nov 2026. Termasuk yang kini sudah terbukti dengan data: 403 non-owner untuk aksi menu, batas harga 200000, nama kembar, nonaktif dan aktifkan kembali, serta seluruh aksi grup (buat, ubah, ganti bawaan, nonaktifkan opsi, batas opsi, batas 3 grup per menu).

**Keputusan baru** (PIC sesi ini; alasan selebihnya belum tercatat):

- `menu-test.md` dibuat saat handoff ini, bukan di tengah sesi.
- Cek tampilan cukup diceritakan dengan kata-kata, tanpa screenshot HP (alasan: repot memindahkan gambar dari HP ke laptop). Bukti P0 tetap teks balasan server dari Console.
- Data uji dipakai ulang, tidak membuat menu atau grup baru kecuali perlu.

**Temuan di lapangan:**

- Balasan galat server hanya membawa `ok` dan `pesan`, tanpa kode. Nama kembar dikenali dari teks "nama yang sama" di `menu.js`, dan itu cocok. Carry-over soal teks atau kode **terjawab**.
- Aturan nama kembar hanya antar menu **aktif** (sesuai blok 2026-11-07 Foto menu). Menu nonaktif boleh diganti ke nama yang dipakai menu aktif, tetapi mengaktifkannya kembali ditolak 409.
- Harga 200001, 0, dan -5 dibalas 400 "Data belum lengkap atau tidak valid.", sedangkan 1500.5 dibalas "Harga tidak valid atau melebihi batas.". Belum dicek di `supabase/functions/kedai/index.ts` apakah `kedai` punya batas harga sendiri (bila ada angka tertulis mati, itu melanggar aturan angka di database). Batas 200000 itu sendiri sudah terbukti benar.
- `grup_simpan` untuk grup baru harus **tanpa field `id`** (`id: ""` dibalas 400). Bentuk isian lengkap ada di `docs/menu-test.md` bagian 1.

**Belum beres:**

- **MT-14** (tag HTML di nama grup dan nama opsi): data uji sudah dipasang, tampilannya belum dicek. Nama grup uji kini `<b>Grup</b> <i>HTML</i>` dengan dua opsi bertag, terpasang di menu "menu tanpa gambar", dan menu itu **sedang aktif** (customer bisa melihatnya). Cek: owner di Kelola grup pilihan dan panel "Pasang ke menu"; customer di sheet detail menu itu. Hasil yang benar: semuanya tampil sebagai tulisan, tanpa popup.
- **Pulihkan data uji** sesudah MT-14, lewat layar: (1) tab Menu owner, ketuk Nonaktifkan pada "menu tanpa gambar"; (2) Kelola grup pilihan, kartu grup bertag, "Pasang ke menu", lepas centang "menu tanpa gambar", lalu Nonaktifkan grup itu. Keadaan akhir yang benar: "menu tanpa gambar" nonaktif, harga 1000, tanpa foto, deskripsi, dan grup; Grup Uji 1b (kini bernama bertag), Grup Uji 2, dan Grup Uji 3 nonaktif; "Level pedas" tetap aktif dan terpasang di "ayam karage". Menu dummy lain (ayam karage, Ayam Katsu, es teh manis) tidak disentuh.
- **MT-12** (pesan merah di form Ubah untuk deskripsi 201 karakter): belum dilihat lewat aplikasi.
- **MT-23 dan MT-24** menunggu order (ORD.01 dan ORD.02); dikerjakan di sesi tes order.
- Cek `kedai/index.ts` soal batas harga (lihat Temuan).
- Carry-over Handoff #3 sampai #10 yang **masih berlaku**: fungsi `menu_simpan` 6 argumen masih ada (membuangnya butuh "OK" ketua); target ukuran foto belum diputuskan; handler fetch `sw.js` ikut menyimpan foto menu; menu dan grup dummy tidak bisa dihapus (nonaktifkan atau pakai ulang sebelum peluncuran); tahanan Tab di `tekanTombol` (`menu-detail.js`) perlu disesuaikan saat ORD menambah tombol di sheet; pemilihan opsi oleh customer dan pemetaan `pilihan_rusak` di ORD.01; iPhone belum dicek; `menu.js` sekitar 900 baris (pedoman sekitar 500); berkas uji `20261107_04_menu_grup_pilihan_uji.sql` tidak boleh dijalankan lagi.

**Saran giliran berikutnya:** sesi singkat menutup MNU.06: MT-14, MT-12, lalu pulihkan data uji. Bila semuanya lulus, MNU.06 siap dicentang. Setelah itu urutan ditentukan ketua (ORD.01 butuh "OK" ketua karena migration). Lampirkan `AGENTS.md` + `menu.md` (sudah memuat handoff ini) + `menu-test.md` + `akun.js`. Untuk ORD.01 tambahkan `order.md`, `database.md`, dan `security.md`.

### Handoff #12 | 2026-11-08 | [RAC]

**Berkas tujuan:** `docs/menu.md` bagian 9 (tempel paling bawah, di bawah Handoff #11). Yang paling akhir menang.

**Tugas:** Sesi tes MNU.06 **selesai**. **Silakan dicentang di sheet.** Tidak ada kode aplikasi, SQL, atau Edge Function yang diubah. `docs/menu-test.md` tidak berubah (tetap v1.0). Tes lewat akun dummy owner dan customer; MT-05 lewat Console browser. Bukti diperiksa di chat dan tidak disimpan.

**Lulus di sesi ini:**

- **MT-14**: nama grup dan nama opsi berisi tag HTML (`<b>`, `<img onerror>`, `<script>`) tampil sebagai tulisan di Kelola grup pilihan, panel "Pasang ke menu", dan sheet detail customer. Tidak ada popup.
- **MT-12**: deskripsi 201 karakter di form Ubah menampilkan pesan merah "deskripsi terlalu panjang"; data tidak berubah (form Ubah dibuka lagi: nama, harga 1000, deskripsi kosong).
- **MT-05 (diulang dengan isian lengkap)**: harga 200001, 0, -5, dan 1500.5 semuanya dibalas 400 "Harga tidak valid atau melebihi batas."; tidak ada menu terbuat.

Dengan ini **MT-01 sampai MT-22 seluruhnya lulus**. Tersisa **MT-23 dan MT-24**, dikerjakan di sesi tes order (ORD.01 dan ORD.02).

**Koreksi terhadap Handoff #11 (yang paling akhir menang):** catatan bahwa harga 200001, 0, dan -5 dibalas "Data belum lengkap atau tidak valid." berarti penolakan itu bukan karena harga. Dugaan: ada field wajib yang kurang di isian tes (misalnya `deskripsi`); penyebab pastinya belum tercatat. Setelah diulang dengan isian lengkap, semuanya dibalas pesan harga yang benar (lihat MT-05 di atas).

**Temuan di lapangan:** `supabase/functions/kedai/index.ts` **tidak punya angka batas harga tertulis mati**. Yang ada hanya pagar kasar (harus bilangan bulat dan tidak melebihi batas integer 32-bit, `BATAS_INTEGER`); batas wajar dicek fungsi SQL dari pengaturan `harga_maks_menu`. Carry-over soal batas harga di `kedai` (Handoff #11) **terjawab**: tidak melanggar aturan angka di database.

**Data uji sudah dipulihkan:** "menu tanpa gambar" nonaktif, harga 1000, tanpa foto, deskripsi, dan grup; grup bertag HTML, Grup Uji 2, dan Grup Uji 3 nonaktif; "Level pedas" aktif dan terpasang di "ayam karage". Menu dummy lain (ayam karage, Ayam Katsu, es teh manis) tidak disentuh.

**Keputusan baru:** tidak ada.

**Belum beres (carry-over yang masih berlaku):** fungsi `menu_simpan` 6 argumen masih ada (membuangnya butuh "OK" ketua); target ukuran foto belum diputuskan; handler fetch `sw.js` ikut menyimpan foto menu; menu dan grup dummy tidak bisa dihapus (nonaktifkan atau pakai ulang sebelum peluncuran); tahanan Tab di `tekanTombol` (`menu-detail.js`) perlu disesuaikan saat ORD menambah tombol di sheet; pemilihan opsi oleh customer dan pemetaan `pilihan_rusak` dikerjakan di ORD.01; iPhone belum dicek; `menu.js` sekitar 900 baris (pedoman sekitar 500); berkas uji `20261107_04_menu_grup_pilihan_uji.sql` tidak boleh dijalankan lagi.

**Saran giliran berikutnya:** urutan ditentukan ketua. Kandidatnya ORD.01 (migration order, butuh "OK" ketua). Lampirkan `AGENTS.md` + `menu.md` (sudah memuat handoff ini) + `order.md`, `database.md`, dan `security.md`. MT-23 dan MT-24 dites setelah ORD.01 dan ORD.02 jalan, memakai `menu-test.md`.

### 2026-11-08: Pemilihan opsi di order dikerjakan di ORD.02 dan ORD.03

**Berkas tujuan:** `docs/menu.md` bagian 9. Meluruskan Handoff #9 sampai #12. Yang paling akhir menang.

- ORD.01 sudah selesai dan hanya berisi migration tabel (tidak memanggil `opsi_periksa` dan tidak mengubah `kedai`).
- Pemanggilan `opsi_periksa` dan pemetaan kode galat `pilihan_rusak` di `kedai` dikerjakan di **ORD.02** (`order_buat`). Tombol pilih opsi di aplikasi dikerjakan di **ORD.03**.
- `order_item.pilihan` sudah siap menampung salinan pilihan (lihat `docs/order.md` Handoff #1). MT-23 dan MT-24 menunggu ORD.02.

### Handoff #13 | 2026-11-08 | [FREN]

**Berkas tujuan:** `docs/menu.md` bagian 9 (tempel paling bawah, di bawah blok `2026-11-08: Pemilihan opsi di order dikerjakan di ORD.02 dan ORD.03`). Yang paling akhir menang.

**Tugas:** Sesi tes **MT-23 dan MT-24 selesai, keduanya lulus.** Dengan ini **seluruh kasus `docs/menu-test.md` (MT-01 sampai MT-24) sudah lulus.** Tidak ada kode aplikasi, SQL, atau Edge Function yang diubah. `docs/menu-test.md` tidak berubah (tetap v1.0). Tes lewat Console browser di aplikasi asli (`window.KedaiAkun.panggilKedai`) dengan akun dummy customer 1 dan owner. Bukti diperiksa di chat dan tidak disimpan.

**Lulus di sesi ini:**

- **MT-24 (isian palsu):** `order_buat` dikirim dengan `harga`, `total`, `status: "Disetujui"`, dan `harga` di tiap item. Balasan 200 dengan total 25000 (ayam karage x1 opsi Sedang + es teh manis x2), status Menunggu. `order_detail` menunjukkan harga satuan 15000 dan 5000, tidak ada angka palsu yang tersimpan.
- **MT-24 (opsi di luar grup):** opsi "Pedas" (grup Level pedas) dikirim ke es teh manis yang tidak punya grup. Dibalas 409 "Pilihan menu berubah atau tidak valid. Muat ulang menu lalu coba lagi." (pemetaan `pilihan_rusak`). Daftar order sesudahnya tidak memuat order baru; nomor order berikutnya tetap terpakai berurutan (tidak loncat).
- **MT-24 (teks pilihan):** pilihan tersalin sebagai "Level pedas: Sedang" di `order_item`.
- **MT-23:** harga es teh manis diubah owner dari 5000 ke 7000 lewat layar Menu. Order baru (nomor 5) total 7000. Order lama (nomor 4) tetap harga satuan 5000 dan total 25000.

**Keputusan baru:** tidak ada.

**Pertentangan dengan Handoff #11 dan #12:** butir "MT-23 dan MT-24 menunggu order" dan "tersisa MT-23 dan MT-24" sudah tidak berlaku; keduanya kini lulus.

**Data uji (dummy):**

- Menu dipulihkan: es teh manis kembali Rp 5.000, Tersedia. Ayam karage (Rp 15.000, grup Level pedas terpasang) dan Ayam Katsu (Rp 12.000) tidak disentuh dan Tersedia.
- Order uji milik customer 1 yang tertinggal: nomor 1 sampai 5. Tidak bisa dihapus; dibersihkan di LNC.01 bersama reset nomor order. Nomor 4 dan 5 dibuat di sesi ini.

**Belum beres (carry-over yang masih berlaku):** fungsi `menu_simpan` 6 argumen masih ada (membuangnya butuh "OK" ketua); target ukuran foto belum diputuskan; handler fetch `sw.js` ikut menyimpan foto menu; menu dan grup dummy tidak bisa dihapus (nonaktifkan atau pakai ulang sebelum peluncuran); tahanan Tab di `tekanTombol` (`menu-detail.js`) perlu disesuaikan saat ORD menambah tombol di sheet; iPhone belum dicek; `menu.js` sekitar 900 baris (pedoman sekitar 500); berkas uji `20261107_04_menu_grup_pilihan_uji.sql` tidak boleh dijalankan lagi.

**Saran giliran berikutnya:** ORD.03 (layar customer Pesan; **belum dikerjakan**, status sheet masih Belum). Lampirkan `AGENTS.md` + `order.md` + `akun.js`, `menu.js`, `menu-detail.js`, `kerangka.js`, `style.css`, dan `sw.js`. Berkas JS baru wajib didaftarkan di cache `sw.js` (perubahan `sw.js` butuh "OK" ketua). Tombol Kirim dikunci di layar karena server tidak menahan kirim ganda (`order.md` Handoff #2). Setelah itu ORD.04, lalu ORD.05 (butuh penjelasan dampak dan "OK" ketua).
