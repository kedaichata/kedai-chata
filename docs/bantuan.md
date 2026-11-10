/docs/bantuan.md

# ❓ bantuan.md: Layar Bantuan, Isi dari Google Sheet, dan Impor lewat SQL Editor

> **Versi 1.1 (5 Nov 2026), hasil sesi strategi.** Perubahan 1.1: disambungkan ke `AGENTS.md` (peta dokumen dan pengecualian BT7), `database.md` 1.3, `desain.md` 1.2 (DS10, DS15), dan `security.md` 1.2 (aturan 21, SEC-30, SEC-31). Bergantung pada `akun.md` (fungsi `kedai` dan peran), `desain.md` (komponen), dan `database.md`.
> **Status:** BT1 sampai BT13 disepakati ketua (sesi strategi 5 Nov 2026). Butir **(bawaan)** = pilihan penulis, ketua boleh mengubahnya sebelum dikerjakan. Belum ada yang dikerjakan.
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini** (+ `database.md` dan `security.md` untuk langkah tabel dan aksi). Kerjakan langkah di bagian 5. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 9.
> **Berkas yang diminta AI di awal sesi:** berkas migration terbaru, `supabase/functions/kedai/`, dan berkas JS layar bantuan bila sudah ada.
> **Tanpa kode dan tanpa isi SQL.** Rumus yang membuat SQL impor ada di **berkas template lembar** (`bantuan-isi.xlsx`), bukan di md ini. **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Tingkat risiko:** fitur ini **P1**. Tabel, aksi server, dan SQL yang dijalankan manual di production **High-Risk**; tampilan layar dan isi teks **Low-Risk**.
> **Prefix sheet:** BTN.

---

## 1. Tujuan

Customer, owner, dan penjaga bisa membuka **jawaban atas pertanyaan sehari-hari** (cara memesan, arti status, memasang ke layar utama, notifikasi, lupa password, tugas tiap peran) tanpa harus bertanya lewat WA terus-menerus. Isinya **ditulis dan diubah ketua di Google Sheet**, lalu dimasukkan ke database lewat SQL Editor, jadi mengubah bantuan **tidak perlu mengubah kode**.

---

## 2. Keputusan

| No   | Keputusan                                                                                                                                                                                                                                                                                                                            | Dasar                                                                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| BT1  | **Bantuan adalah layar tanya-jawab** yang bisa dibuka semua peran setelah login. Dibuka dari menu **Akun** (customer dan penjaga) dan menu **Lainnya** (owner). **Tidak ada menu hamburger** (customer tidak boleh dipersulit mencari). **(bawaan untuk letaknya)**                                                                  | Keputusan ketua 5 Nov 2026 (butuh layar bantuan); `desain.md` DS10, DS15.                                                                 |
| BT2  | **Isi disimpan di tabel `bantuan`** di database dan **diubah lewat Google Sheet, lalu SQL Editor** oleh ketua atau adik ketua. Aplikasi **tidak bisa mengubah** isi bantuan. Editor di dalam aplikasi masuk `bonus.md` (B32).                                                                                                        | Keputusan ketua 5 Nov 2026.                                                                                                               |
| BT3  | **Kolom lembar:** `kunci` (unik dan tetap), `bagian` (kelompok, misalnya Memulai), `urutan` (kelipatan 10 supaya mudah disisipi), `peran` (`semua`, `customer`, `owner`, atau `penjaga`), `judul` (pertanyaan), `isi` (jawaban), `aktif` (`ya` atau `tidak`), ditambah kolom SQL otomatis.                                           | Pola lembar bantuan aplikasi referensi (bagian, urutan, judul, isi); peran ditambah.                                                      |
| BT4  | **Teks biasa saja** di versi 1: tanpa HTML, tanpa markdown, tanpa gambar, tanpa tautan aktif. Baris baru di `isi` menjadi paragraf baru. Semua tampil lewat `textContent`.                                                                                                                                                           | `security.md` aturan 10.                                                                                                                  |
| BT5  | **Penyaringan peran dilakukan server:** server memberi isi berperan `semua` ditambah isi yang sesuai peran pemanggil (dibaca dari tabel `staf`; bukan staf berarti customer). Peran yang dikirim di permintaan **diabaikan**.                                                                                                        | `security.md` aturan 2 dan 18.                                                                                                            |
| BT6  | **Isi tidak pernah dihapus:** yang tidak dipakai ditandai `aktif = tidak`, dan **baris di lembar tidak dihapus**. Impor memakai **tambah atau perbarui berdasarkan `kunci`**, jadi menjalankan ulang aman.                                                                                                                           | `AGENTS.md` bagian 7 (tanpa DELETE).                                                                                                      |
| BT7  | **SQL impor dibuat otomatis oleh lembar** (kolom SQL) dan dijalankan di SQL Editor. **Pengecualian aturan "SQL disalin ke repo dulu":** SQL isi bantuan adalah **data**, bukan skema, dan sering berubah, jadi **tidak disimpan di repo**; **lembar Google Sheet adalah sumber dan cadangannya** (dipegang adik ketua). **(bawaan)** | `database.md` bagian 6 dan `AGENTS.md` bagian 7 (berlaku untuk skema dan fungsi; pengecualian ini dicatat di keduanya); butuh "OK" ketua. |
| BT8  | **Hak tabel:** `service_role` hanya **baca** `bantuan`, RLS aktif tanpa policy, tanpa DELETE. Aplikasi tidak punya jalur tulis ke tabel ini.                                                                                                                                                                                         | `database.md` bagian 3; `security.md` aturan 1 dan 21.                                                                                    |
| BT9  | **Diambil sekali saat layar Bantuan dibuka** dan lewat tombol **Segarkan**. Tanpa polling. Offline: pesan jelas bahwa butuh internet.                                                                                                                                                                                                | `notifikasi.md` NT10; DS13; hemat free tier.                                                                                              |
| BT10 | **Batas isi** (bentuk data, dicek di database): `judul` 5 sampai 120 karakter, `isi` 1 sampai 2000 karakter. Jumlah isi aktif sebaiknya di bawah sekitar 100. **(bawaan)**                                                                                                                                                           | Layar tetap ringan di HP kecil dan kuota free tier.                                                                                       |
| BT11 | **Isi tidak memuat** nomor rekening atau QRIS, data pribadi, atau rahasia apa pun. Cara bayar tetap lewat WA.                                                                                                                                                                                                                        | `order.md` O21; `security.md` aturan 16 dan 18.                                                                                           |
| BT12 | **Tampilan:** pertanyaan dikelompokkan per `bagian` (judul kelompok), tiap pertanyaan **dilipat** dan dibuka dengan satu ketukan (akordeon bawaan peramban). Urutan mengikuti `urutan`. Pencarian ditunda. **(bawaan)**                                                                                                              | `features.md` bagian 9 (sesederhana WA).                                                                                                  |
| BT13 | **Isi awal ditulis ketua** setelah fitur final (supaya jawabannya cocok dengan aplikasi). Draf contoh sekitar 18 pertanyaan disediakan di template lembar sebagai bahan.                                                                                                                                                             | Keputusan ketua 5 Nov 2026.                                                                                                               |

---

## 3. Prasyarat

`akun.md` selesai (fungsi `kedai` dan peran dikenali server) dan `desain.md` sampai komponen dasar (DSN.04). Mekanismenya (BTN.01 sampai BTN.04) tidak bergantung pada fitur lain, tetapi **isi awal (BTN.05) dikerjakan setelah fitur lain selesai**, supaya jawabannya sesuai aplikasi yang final.

---

## 4. Yang dibuat

| Komponen            | Isi                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Tabel `bantuan`     | Skema di `database.md`. RLS aktif tanpa policy; `service_role` hanya baca; tanpa DELETE.                                                   |
| Aksi `kedai`        | `bantuan_daftar` (semua yang login): isi aktif yang sesuai peran, urut `urutan` lalu `kunci`.                                              |
| Layar Bantuan       | Daftar per bagian, pertanyaan dilipat (BT12). Teks lewat `textContent`. Tombol Segarkan di bilah atas.                                     |
| Pintu masuk         | Item **Bantuan** di menu Akun (customer, penjaga) dan Lainnya (owner). Tidak ada hamburger.                                                |
| Lembar Google Sheet | Dibuat dari template `bantuan-isi.xlsx`: kolom A sampai G diisi manual, **kolom H (SQL) otomatis dan tidak diubah**. Tanpa data pelanggan. |

**Format lembar (ringkas):**

| Kolom | Isi          | Aturan                                                                                         |
| ----- | ------------ | ---------------------------------------------------------------------------------------------- |
| A     | `kunci`      | Unik, huruf kecil, angka, dan garis (contoh `memulai-01`). **Jangan diganti** setelah diimpor. |
| B     | `bagian`     | Nama kelompok. Tulis sama persis untuk pertanyaan sekelompok.                                  |
| C     | `urutan`     | Angka, kelipatan 10 (10, 20, 30 ...). Boleh disisipi (misalnya 15).                            |
| D     | `peran`      | Pilih dari daftar: `semua`, `customer`, `owner`, `penjaga`.                                    |
| E     | `judul`      | Pertanyaan, 5 sampai 120 karakter.                                                             |
| F     | `isi`        | Jawaban, sampai 2000 karakter. Baris baru (Alt+Enter) = paragraf baru. Teks biasa.             |
| G     | `aktif`      | `ya` atau `tidak`.                                                                             |
| H     | SQL otomatis | Rumus. Menangani tanda kutip dan baris baru. **Jangan diubah.**                                |

**Prosedur impor (untuk ketua atau adik):**

1. Ubah atau tambah baris di lembar (kolom A sampai G). Jangan menghapus baris.
2. Pastikan tiap baris punya `kunci` unik dan semua kolom terisi.
3. Salin **seluruh kolom H** dari baris 2 sampai baris terakhir yang berisi.
4. Buka SQL Editor di dashboard Supabase (akun ketua), tempel, lalu **Run**. Hasil yang benar: berhasil tanpa pesan galat.
5. Buka aplikasi, menu Bantuan, tekan Segarkan, dan cek isinya.
6. Isi yang tidak dipakai lagi: ubah `aktif` menjadi `tidak`, salin ulang kolom H, dan jalankan lagi.

---

## 5. Urutan pekerjaan (untuk TODO sheet, prefix BTN)

Langkah ⚠️ butuh penjelasan dampak dan "OK" ketua. Dikerjakan **setelah `notifikasi.md`** (di sheet: setelah SEC-25).

1. **BTN.01 ⚠️** Migration: tabel `bantuan` (kunci unik, bagian, urutan, peran, judul, isi, aktif, waktu diubah), batas panjang judul dan isi, hak `service_role` hanya baca, RLS. SQL disalin ke `supabase/migrations/` dulu. Cek hak setelahnya.
2. **BTN.02 ⚠️** Aksi `bantuan_daftar` di `kedai`: semua yang login, isi aktif, disaring peran dari server (BT5), urut `urutan` lalu `kunci`. Deploy dengan urutan aman.
3. **BTN.03** Layar Bantuan (BT12) dan item Bantuan di menu Akun dan Lainnya. Teks lewat `textContent`; offline menampilkan pesan. Komponen daftar tanya-jawab dibuat di langkah ini (`desain.md` DS15 dan bagian 4.3).
4. **BTN.04 ⚠️** Siapkan lembar dari template dan **uji impor 3 baris contoh**: satu berisi tanda kutip, satu berisi baris baru, satu `aktif = tidak`. Menjalankan SQL di production, jadi butuh "OK".
5. **BTN.05** Tulis isi awal (sekitar 15 sampai 25 pertanyaan untuk customer, owner, dan penjaga) di lembar, lalu impor.
6. **BTN.06** Sesi tes bantuan (dokumen `bantuan-test.md` dibuat di sesi tes): tiap peran hanya melihat isinya, `aktif = tidak` tidak tampil, teks berisi tag HTML tampil sebagai teks, tanpa token ditolak. Rujukan tes keamanan: SEC-30 dan SEC-31 (`security.md`).

---

## 6. Aturan yang paling sering terlanggar

| Aturan                                             | Akibat bila dilanggar                                                                 |
| -------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Menaruh Bantuan di menu hamburger atau tersembunyi | Ibu-ibu tidak menemukannya (DS10).                                                    |
| Menampilkan isi lewat `innerHTML`                  | Teks berisi tag bisa menjalankan skrip (SEC-30).                                      |
| Menghapus baris di lembar untuk "menghapus" isi    | Isi lama tetap di database dan tetap tampil; pakai `aktif = tidak` (BT6).             |
| Mengganti `kunci` yang sudah diimpor               | Dianggap isi baru; isi lama tetap aktif sehingga muncul dobel.                        |
| Mengetik atau mengubah kolom SQL (H) secara manual | Tanda kutip salah dan impor gagal atau merusak isi.                                   |
| Menulis rekening, QRIS, atau data pribadi di isi   | Terbaca semua pengguna (BT11).                                                        |
| Mengirim peran dari aplikasi untuk memilih isi     | Customer bisa melihat isi owner atau penjaga; server harus mengabaikannya (SEC-31).   |
| Bantuan tidak diperbarui setelah fitur berubah     | Petunjuk salah; setiap perubahan fitur dicatat sebagai butir baru "perbarui bantuan". |
| Memberi aplikasi hak tulis ke `bantuan`            | Melanggar BT8; isi bisa diubah dari aplikasi.                                         |

---

## 7. Dampak dan pembatalan

- **Migration:** tabel baru, tidak menyentuh data order, akun, atau menu. Bisa dibatalkan dengan SQL pembatalan tertulis di repo.
- **Isi salah atau usang:** perbaiki di lembar dan impor ulang; berlaku saat layar Bantuan dibuka berikutnya. Tidak ada data pelanggan yang terpengaruh.
- **Impor salah (misalnya salah `kunci`):** tandai isi yang tidak diinginkan `aktif = tidak` dan impor ulang. Tidak ada penghapusan.
- **Lembar hilang:** isi masih ada di database; tabelnya bisa diekspor lewat dashboard untuk membuat lembar baru. Karena itu adik ketua menyimpan salinan lembar.
- **Tabel `bantuan` kosong:** layar menampilkan "Belum ada bantuan"; fitur lain tidak terganggu.

---

## 8. Ditunda

- Editor bantuan di dalam aplikasi untuk owner (`bonus.md` B32).
- Gambar atau tangkapan layar di bantuan (B33).
- Pencarian di bantuan dan bantuan kontekstual per layar (ikon "?") (B34).
- Bantuan yang bisa dibuka sebelum login (B35): butuh jalur tanpa token, bertentangan dengan aturan cek token paling awal.
- Umpan balik "membantu atau tidak" dan terjemahan.

---

## 9. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

### 2026-11-07: Pintu Bantuan pindah ke Home

**Berkas tujuan:** `docs/bantuan.md`, Catatan Susulan di akhir berkas. Menimpa BT1, baris "Pintu masuk" di bagian 4, dan BTN.03 (letak item Bantuan). Sumber: `home.md` HM5, HOM.03. Yang paling akhir menang.

- Bantuan dibuka dari **tombol Bantuan di Home** untuk semua peran, bukan dari menu Akun atau Lainnya (keduanya sudah tidak ada di navigasi).
- Tempat tombolnya **sudah dibuat** di `index.html` (id `home-bantuan`), tampil "Segera" dan `disabled` sampai BTN.03 selesai. BTN.03 tinggal **mengaktifkan tombol itu** dan membuat layarnya; tidak perlu membuat item baru di menu.

### 2026-11-10: Pintu Bantuan adalah ikon ? di bilah atas, dikerjakan lebih dulu

**Berkas tujuan:** `docs/bantuan.md` bagian 9. Menimpa blok 7 Nov (pintu ke Home), BT1, baris "Pintu masuk" di bagian 4, BTN.03, dan urutan "setelah `notifikasi.md` (SEC-25)" di bagian 5. Sumber: `desain.md` blok 10 Nov. Yang paling akhir menang.

- **Alasan:** owner mengeluh Bantuan terlalu jauh (order, Home, Bantuan). Pintu dipindah ke **ikon ? di bilah atas**, satu ketukan dari tab utama mana pun.
- Tombol Bantuan di Home tetap sebagai pintu kedua ke layar yang sama.
- **Urutan:** BTN dikerjakan **lebih dulu**, tidak menunggu `notifikasi.md` atau SEC-25. Langkah ⚠️ (BTN.01, BTN.02, BTN.04) tetap butuh penjelasan dampak dan "OK" ketua.
- **BTN.03 kini:** layar Bantuan, **ikon ? di bilah atas** (dibuat di langkah ini, bukan sebagai tombol mati di DSN.08), dan pengaktifan tombol Bantuan di Home. Tidak ada item di menu Akun atau Lainnya (keduanya sudah tidak ada).
- Ikon ? tidak tampil di sub-layar, Masuk, dan Daftar (`desain.md` blok 10 Nov).
- Isi awal (BTN.05) tetap ditulis setelah fitur final; sampai itu layar menampilkan "Belum ada bantuan".
