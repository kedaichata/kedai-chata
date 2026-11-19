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

### Handoff #1 | 2026-11-10 | [Ketua]

**Tugas:** BTN.01 (tabel `bantuan`) selesai dan terbukti. BTN.02 (aksi `bantuan_daftar`) sudah dideploy, tetapi belum lengkap terbukti.

**Berkas yang berubah:**

- Baru: `supabase/migrations/20261110_07_bantuan.sql` dan `_batal.sql`, `supabase/templates/20261110_07_bantuan_cek.sql`.
- Baru: `supabase/functions/kedai/bantuan.ts`.
- Diubah: `supabase/functions/kedai/index.ts` (hanya tambahan: komentar header, satu import, satu sambungan alat bantu, satu `case`; tidak ada kode lama yang dihapus atau dipindah).

**Keputusan baru:**

- BTN.02 **tanpa fungsi SQL dan tanpa migration**: aksi hanya membaca tabel `bantuan` langsung (`service_role` sudah punya SELECT). Alasan: bacaan murni, tidak ada langkah bisnis yang perlu atomik. Pilihan penulis yang disetujui ketua lewat "OK gas"; alasan lain belum tercatat.
- Bentuk data di tabel (pilihan penulis, menambah BT3 dan BT10): `kunci` 3 sampai 50 karakter, hanya huruf kecil, angka, dan strip; `bagian` tidak kosong, maksimal 60; `urutan` bilangan bulat 0 atau lebih; `judul` dan `isi` hanya dicek panjangnya (tanpa syarat spasi di tepi, supaya SQL dari lembar tidak gagal karena baris baru di ujung sel). Tanpa indeks tambahan.
- Balasan `bantuan_daftar`: `{ok: true, bantuan: [...]}` dengan kolom `kunci, bagian, urutan, judul, isi`, urut `urutan` lalu `kunci`. Server membaca peran dari tabel `staf` dan mengabaikan seluruh isi permintaan. Pengelompokan per `bagian` dikerjakan layar.

**Bukti (tidak disimpan, aturan 10):** BTN.01: RLS aktif, 0 policy, `service_role` hanya SELECT, `anon` dan `authenticated` kosong, 9 kolom, 8 konstrain sesuai migration, tabel 0 baris. BTN.02: deploy sukses (6 berkas), tanpa token dibalas 401 oleh platform (SEC-01 untuk aksi ini).

**Belum beres:**

- **BTN.02 belum boleh dicentang di sheet.** Balasan 200 dengan login (daftar kosong) belum terbukti. Dibuktikan di BTN.03 lewat layar Bantuan yang menampilkan "Belum ada bantuan". Penyaringan peran penuh terbukti di BTN.04 dan BTN.06 (SEC-31).
- Lapis kedua token (SEC-02, SEC-32) belum dites.

**Saran giliran berikutnya (BTN.03, Low-Risk, sesi kode):** layar Bantuan, ikon ? di bilah atas (tab utama saja), dan pengaktifan tombol Bantuan di Home (id `home-bantuan`). Lampirkan `AGENTS.md`, `bantuan.md`, `desain.md`, `home.md`, serta `index.html`, `style.css`, `sw.js`, dan JS layar yang relevan. Berkas JS baru wajib didaftarkan di cache `sw.js` (butuh "OK" ketua); gaya tetap di `style.css`.

### Handoff #2 | 2026-11-10 | [FREN]

**Tugas:** BTN.03 (layar Bantuan) **baru giliran A dari dua giliran**. Belum boleh dicentang di sheet. Giliran A sudah ditulis dan disimpan di laptop, **belum di-push** (belum ada hash commit). Giliran B belum dikerjakan.

**Berkas yang berubah (giliran A):**

- Baru: `public/bantuan.js` (layar Bantuan: ambil `bantuan_daftar`, kelompok per `bagian`, pertanyaan dilipat dengan `<details>`, keadaan memuat/kosong/galat/offline, slot infografik).
- Diubah: `public/style.css` (hanya menambah di akhir, blok "BTN.03": ikon ? di bilah atas, gambar infografik, akordeon pertanyaan; bagian lama dicek sama persis).
- Tidak berubah: `bantuan.ts`, `index.ts`, tabel `bantuan`, `index.html`, `kerangka.js`, `sw.js`. Berkas JS baru belum dimuat siapa pun, jadi aman di-push lebih dulu.

**Keputusan baru (ketua, 10 Nov 2026; yang paling akhir menang):**

- **Tanpa kolom `jenis`, tanpa migration, tanpa deploy ulang.** Query baca-saja 10 Nov membuktikan tabel `bantuan` berisi 9 kolom dan tidak punya `jenis`. Rencana kolom `jenis` dibatalkan. Alasan: menghindari perubahan skema dan deploy ulang; alasan lain belum tercatat.
- **Infografik = baris dengan `urutan` tepat 1** yang `isi`-nya path gambar relatif di `img/` (contoh `img/infografik.webp`); `judul` menjadi teks alternatif gambar. Tampil di atas daftar, tidak dilipat, tidak masuk daftar pertanyaan. Ini menimpa sebagian BT4 ("tanpa gambar") dan menggeser B33 ("gambar ditunda") untuk satu gambar.
- **Path dicek di layar saja** (server tidak memeriksa `isi`): diawali `img/`, berakhiran `.webp`, `.png`, atau `.jpg`, tanpa `..`, `:`, `//`. Bila bukan path sah, baris tampil sebagai pertanyaan biasa. Lebih dari satu baris gambar urutan 1: hanya yang pertama dipakai. Gambar belum ada atau gagal dimuat: gambar disembunyikan, layar tetap rapi.
- **Satu gambar umum untuk semua peran** (baris berperan `semua`). Gambar per peran ditunda ke versi berikutnya.
- **Infografik belum ada.** Dimasukkan nanti lewat lembar setelah gambarnya dibuat (gambar acuan teman tidak boleh disalin, `desain.md`).
- **Posisi tombol:** ikon **?** warna emas di sebelah kiri Segarkan di bilah atas (tab utama saja), sesuai blok 10 Nov. Tombol Bantuan di Home ikut diaktifkan ke layar yang sama.
- **Layar Bantuan = panel di dalam kerangka** (bilah atas dan Segarkan langsung jalan), bukan layar terpisah. Pilihan penulis kode yang disetujui lewat "gas" ketua; alasan lain belum tercatat.
- **"OK" ketua untuk `sw.js` sudah diberikan di chat:** `bantuan.js` didaftarkan di cache dan nama cache naik dari `chata-v17` ke `chata-v18`. Gambar infografik didaftarkan di cache nanti, setelah berkasnya ada (butuh "OK" lagi karena menyentuh `sw.js`).

**Rencana giliran B (3 berkas, di-push bersamaan; `sw.js` sudah di-OK):**

- `index.html`: tambah `<div id="panel-bantuan" hidden></div>`; ikon ? emas (id mis. `tombol-bantuan-atas`, kelas `bilah-atas__bantuan`) di kiri Segarkan; `<script src="bantuan.js">` **setelah `akun.js` dan sebelum `kerangka.js`**; tombol `home-bantuan` diaktifkan (buang `disabled` dan label "Segera", tambah `data-aksi="bantuan"`; kode lama dijadikan komentar, tidak dihapus).
- `kerangka.js`: tab tersembunyi `bantuan` (panel `bantuan`) di owner, customer, penjaga (pola sama dengan tab `pelanggan`); tambah `"bantuan"` ke daftar `PANEL`; simpan tab sebelumnya supaya Kembali (tombol `#bantuan-kembali` dibuat `bantuan.js`) membuka tab itu dan navigasi bawah tetap menandai tab asal; aksi Home `bantuan`; pemanggilan `window.KedaiBantuan.tampil()` di `buka()` dan `.reset()` di `reset()`, keduanya dengan pengecekan keberadaan.
- `sw.js`: tambah `"bantuan.js"` di `DAFTAR_CACHE`, nama cache `chata-v18`; kode lama dijadikan komentar.
- Segarkan sudah otomatis memuat ulang layar Bantuan (lewat `muatStatus` lalu `buka(tab)`), jadi tidak perlu pendengar baru.

**Belum beres:**

- Giliran A belum di-push. **Push giliran A bersama atau sebelum giliran B; jangan push giliran B tanpa `bantuan.js` di repo** (`sw.js` mendaftarkan berkas yang harus ada, bila tidak pemasangan cache gagal).
- **BTN.02 belum boleh dicentang.** Bukti balasan 200 dengan login (daftar kosong) baru ada saat layar Bantuan menampilkan "Belum ada bantuan" (giliran B selesai). Penyaringan peran penuh terbukti di BTN.04 dan BTN.06 (SEC-31). Lapis kedua token (SEC-02, SEC-32) belum dites.
- Tes layar belum dilakukan (giliran A belum terpasang). Tes giliran B: tiga peran, ikon ? di tab utama dan tidak di sub-layar/Masuk/Daftar, tombol Bantuan di Home, Kembali, Segarkan, offline, galat, "Belum ada bantuan", Keluar membersihkan isi.

**Catatan untuk BTN.04 dan BTN.05:**

- **Urutan 1 jangan dipakai untuk pertanyaan biasa** (pertanyaan tetap kelipatan 10).
- Template lembar `bantuan-isi.xlsx` **tidak perlu diubah**: baris infografik diisi manual seperti baris lain (`urutan` 1, `peran` `semua`, `isi` = path gambar).
- Berkas gambar harus sudah ada di `public/img/` sebelum baris diimpor, dan didaftarkan di `sw.js` (naikkan nama cache; butuh "OK" ketua).

**Saran giliran berikutnya (giliran B, Low-Risk, kecuali `sw.js` yang sudah di-OK):** lampirkan `AGENTS.md` + `bantuan.md` + `desain.md` + `home.md` + versi terbaru `public/index.html`, `public/kerangka.js`, `public/sw.js` (+ `public/bantuan.js` dan `public/style.css` bila ingin dicek). Sebelum push, cek tiga hal anti-nyasar (folder aktif, `git remote -v`, email commit terakhir; semuanya milik ketua), dan sebelum `git add .` cek `git status`. Logout GitHub dan Supabase di profil browser setelah selesai.

**Butir baru yang perlu ditambah ke sheet:** "Buat gambar infografik alur dan pasang di Bantuan" (judul pendek; menunggu gambar). Butir "kolom jenis" yang sempat disarankan **tidak jadi**, tidak usah ditambah.

### Handoff #3 | 2026-11-11 | [RAC]

**Tugas:** BTN.03 (layar Bantuan) selesai. Giliran A dan B sudah terpasang dan dites. BTN.02 dan BTN.03 sudah dicentang di sheet.

**Berkas yang berubah (giliran B):** `public/index.html`, `public/kerangka.js`, `public/sw.js` (cache `chata-v17` jadi `chata-v18`, `bantuan.js` masuk daftar cache; "OK" ketua sudah tercatat di Handoff #2). Hash commit giliran A: `ccc1d5e`. Hash giliran B belum dicatat. Kode lama tidak ada yang dihapus; yang diganti dijadikan komentar bertanda `BTN.03`.

**Isi:** ikon ? emas di bilah atas (kiri Segarkan), panel `#panel-bantuan`, tombol Bantuan di Home aktif (versi "Segera" disimpan sebagai komentar), tab tersembunyi `bantuan` di semua peran, tombol Kembali membuka tab asal dan navigasi bawah tetap menandai tab asal, `KedaiBantuan.tampil()` dan `.reset()` dipanggil dari `kerangka.js`.

**Keputusan baru (pilihan penulis kode, disetujui lewat "gas"; alasan lain belum tercatat):**

- Ikon ? disembunyikan selama layar Bantuan sendiri terbuka.
- Tab `bantuan` juga ditambahkan ke peran tak dikenal (`lain`) supaya ikon ? tidak jadi tombol kosong.

**Hasil tes:** dites di laptop dan HP, semua berfungsi sesuai. Bukti diperiksa di chat dan tidak disimpan. Layar menampilkan "Belum ada bantuan", jadi balasan 200 dengan login untuk `bantuan_daftar` terbukti.

**Belum beres:**

- Penyaringan peran penuh baru terbukti di BTN.04 dan BTN.06 (SEC-31). Lapis kedua token (SEC-02, SEC-32) belum dites.
- BTN.04 (lembar dari template dan uji impor 3 baris contoh) menjalankan SQL di production: butuh penjelasan dampak dan "OK" ketua.
- BTN.05 (isi awal) dikerjakan setelah fitur lain final. BTN.06 (sesi tes, SEC-30 dan SEC-31) setelah BTN.04.
- Infografik belum ada. Baris `urutan` 1 diisi lewat lembar setelah gambar dibuat dan didaftarkan di `sw.js` (naikkan cache, butuh "OK").

**Saran giliran berikutnya:** BTN.04, sesi kode High-Risk. Lampirkan `AGENTS.md` + `bantuan.md` + `database.md` + `security.md` + `bantuan-isi.xlsx` (template lembar). Tidak ada data pelanggan nyata di lembar.

**Butir baru yang perlu ditambah ke sheet:** "Buat gambar infografik alur dan pasang di Bantuan" (kalau belum ditambah).

### Handoff #4 | 2026-11-11 | [Ketua]

**Tugas:** BTN.04 (lembar dari template dan uji impor 3 baris) selesai dan terbukti. BTN.04a (infografik) selesai: gambar, cache, dan baris di database sudah jalan.

**Berkas yang berubah:**

- Baru: `public/img/infografik.webp`.
- Diubah: `public/sw.js` (cache `chata-v18` jadi `chata-v19`, `img/infografik.webp` masuk `DAFTAR_CACHE`; baris lama dijadikan komentar). "OK" ketua sudah diberikan di chat. Commit `ecbf4c4`, sudah di-push dan terbit.
- Lembar `bantuan-isi.xlsx` dibuat ulang di sesi ini (Google Sheet, bukan di repo, BT7). Tanpa migration dan tanpa deploy.

**Keputusan baru (pilihan penulis, disetujui ketua; alasan lain belum tercatat):**

- Lembar kini punya kolom **I "Cek"** (otomatis) di samping kolom H. Isinya OK atau pesan kesalahan sesuai batas tabel (`kunci` 3 sampai 50 huruf kecil/angka/strip dan unik, `bagian` maks 60, `urutan` bilangan bulat 0 atau lebih, `peran` valid, `judul` 5 sampai 120, `isi` 1 sampai 2000, `aktif` ya atau tidak). Bila bukan OK, kolom H berisi "PERIKSA KOLOM I", bukan SQL. Ini menambah format lembar di bagian 4 (kolom A sampai G manual, H dan I otomatis).
- Nama kolom waktu di tabel (`diubah_pada`) ada di sheet `Petunjuk` sel B4, dipakai rumus kolom H.
- Rumus H mengganti tanda kutip ganda dengan `chr(34)` dan baris baru dengan `chr(10)`, supaya salin dari Sheets tidak terbungkus tanda kutip.
- Mengubah wording: edit baris yang sama, `kunci` tetap, salin kolom H baris yang berubah saja, Run, Segarkan. Pertanyaan tidak dipakai: `aktif = tidak`, baris tidak dihapus.
- Baris infografik: `kunci` `infografik-01`, `urutan` 1, `peran` `semua`, `isi` `img/infografik.webp`, `aktif = ya`. Sudah diimpor.

**Hasil tes:** impor 4 baris berhasil tanpa galat. Di layar Bantuan: tanda kutip tunggal dan ganda tampil normal, jawaban 3 baris tampil terpisah, `aktif = tidak` tidak tampil, infografik tampil di atas. Bukti diperiksa di chat dan tidak disimpan.

**Belum beres:**

- Baris uji `uji-kutip` dan `uji-baris` **harus ditandai `aktif = tidak` lalu diimpor ulang** (masih terlihat customer bila belum). Pelaksanaannya belum dikonfirmasi saat handoff ditulis.
- Penyaringan peran penuh belum terbukti karena semua baris uji berperan `semua`; dibuktikan di BTN.06 (SEC-31). Lapis kedua token (SEC-02, SEC-32) belum dites.
- BTN.05 (isi awal) menunggu fitur final. Pakai `kunci` baru (misal `memulai-01`), jangan menimpa baris uji. Urutan 1 hanya untuk infografik.
- Galat Console `favicon.ico` 404 di root situs: tidak berbahaya, tidak mendesak.

**Saran giliran berikutnya:** BTN.05 (tulis isi awal di lembar lalu impor) setelah fitur lain final, atau BTN.06 (sesi tes, SEC-30 dan SEC-31) setelah isi berperan beragam ada. Lampirkan `AGENTS.md` + `bantuan.md` + `security.md` + lembar terbaru. Tanpa data pelanggan di lembar.

**Butir baru yang perlu ditambah ke sheet:** "Tambah favicon di index.html".

### 2026-11-11: Isi Bantuan perlu menjelaskan Kotak masuk

Keputusan ketua (sesi strategi 11 Nov 2026). Sumber: docs/inbox.md. Yang paling akhir menang.

- Saat menulis isi awal (BTN.05), tambahkan penjelasan singkat untuk customer, owner, dan penjaga: apa itu Kotak masuk, arti **titik merah** di hamburger, bahwa pesan hanya tampil **14 hari**, dan bahwa status dibaca **per HP** (HP baru: semua tampil belum dibaca sekali).
- Tanpa data pribadi, rekening, atau QRIS (aturan BTN.05 tetap).

### 2026-11-14: Isi Bantuan tentang QRIS

**Berkas tujuan:** `docs/bantuan.md`. Sumber: `docs/qris.md` (QRS.05). Yang paling akhir menang.

- Isi Bantuan ditambah satu jawaban singkat: di mana tombol QRIS (Home), bahwa pembayaran mengikuti arahan perwakilan ChATA lewat WA, dan bahwa pesanan diproses setelah pembayaran dikonfirmasi.
- Ditulis manual di lembar Bantuan, **tanpa angka** dan tanpa menarik otomatis dari aplikasi. Tidak ada perubahan skema atau kode.

### Handoff #1 | 2026-11-14 | Ketua

**Tugas:** QRS.01 (siapkan gambar QRIS). Selesai.

**File yang diubah:**

- `public/img/qris.jpg` (baru). Hasil Squoosh dari JPG asli: 709 × 1000 px, MozJPEG kualitas 90, sekitar 123 KB. Latar putih, kode tidak terpotong, tanpa data pribadi lain. Sudah dipindai di aplikasi pembaca GoPay dan ShopeePay (konfirmasi ketua).

**Keputusan baru:**

- **Format gambar QRIS jadi `.jpg`, nama berkas `qris.jpg`** (bukan `qris.png`). Dasar: QR1 membolehkan format diganti selama namanya dicatat; blok ini adalah catatannya. Alasan: JPG asli 146 KB, saat dikonversi ke PNG malah membengkak jadi sekitar 300 KB.
- Semua penyebutan `qris.png` di dokumen ini (QR1, QR9, QR10, bagian 4, QRS.01 sampai QRS.03, bagian 6, bagian 7) dibaca **`qris.jpg`**. Yang paling akhir menang.

**Belum beres:**

- Belum tercatat apakah `qris.jpg` sudah di-push. Bila belum, push mengikuti aturan anti-nyasar (`AGENTS.md` bagian 8).
- Teks QRS.02 dan QRS.03 di sheet mungkin masih menyebut `qris.png`; ubah manual.

**Saran giliran berikutnya:**

- Kerjakan QRS.02 bersama QRS.03. Lampirkan `AGENTS.md`, `qris.md` (termasuk blok ini), `home.md`, `desain.md`, `public/index.html`, `public/kerangka.js`, `public/style.css`, `public/sw.js`.
- QRS.03 (menyentuh `sw.js`): daftarkan `qris.jpg` dan `qris.js`, naikkan cache `chata-v27` jadi `chata-v28`. Butuh "OK" ketua.
- Gambarnya **tegak (709 × 1000)**. Pop-up harus membatasi tinggi gambar atau bisa digulir, supaya tombol **Simpan gambar** dan **Tutup** tetap terlihat di HP kecil.
- Tautan Simpan gambar mengarah ke `qris.jpg`.

### 2026-11-14: Isi Bantuan tentang gelar (rencana GLR.10)

Sumber: docs/gelar.md GL25. Isi ditulis manual di lembar Bantuan bersama BTN.05, bukan lewat md.

- Topik: apa itu gelar, gelar naik seiring pesanan yang selesai, **pesanan yang dicatatkan oleh pihak ChATA tidak menambah gelar**, dan cara membuat banner.
- **Tanpa angka ambang** (mudah berubah, GL15, GL25). Berlaku untuk peran customer.
- Belum dikerjakan; saat ditulis, ikuti pola impor BT7 (SQL isi tidak disimpan di repo).

### 2026-11-14: Pedoman menulis isi Bantuan tentang gelar (GLR.10)

Keputusan ketua (sesi GLR.09, 14 Nov 2026). Melengkapi blok "Isi Bantuan tentang gelar (rencana GLR.10)" di atas; bila ada pertentangan, yang ini menang. Dasar: gelar.md GL9, GL15, GL25.

- **Jangan menyebut angka ambang atau nama gelar tertentu.** Ambang dan nama gelar ada di tabel dan bisa diubah lewat lembar `gelar-isi`, sedangkan teks Bantuan ditulis manual dan tidak ikut berubah, jadi tulisannya bisa menjadi salah tanpa ada yang tahu. Perluasan ke nama gelar adalah usulan penulis sesi ini; alasan lain belum tercatat.
- **Contoh:** hindari "Selesaikan 10 pesanan untuk jadi Langganan." Pakai "Gelarmu naik seiring jumlah pesananmu yang sudah selesai."
- **Aman disebut (aturan stabil):** hanya pesanan berstatus Selesai yang dihitung (GL2), dan pesanan yang dicatatkan pihak ChATA tidak menambah gelar (GL6).
- Cara membuat banner: tombol **Gelar** di Home, lalu **Bagikan** atau **Unduh PNG**.

### 2026-11-16: Hubungan Bantuan dengan Pengenalan Aplikasi

Sumber: `docs/pengenalan.md` PG7 dan bagian 1. Hanya penjelasan; tidak ada perubahan skema atau kode. Yang paling akhir menang.

- **Pengenalan Aplikasi** adalah layar terpisah yang terbuka **tanpa login** dari layar Masuk, isinya satu berkas tetap di repo (`public/pengenalan-isi.js`). **Bantuan** tetap butuh login, per peran, dan isinya dari lembar Google Sheet (BT2).
- Saat menulis isi awal (BTN.05), tidak perlu menyalin topik umum yang sudah ada di Pengenalan (apa itu PWA, cara memasang, update otomatis). Bantuan boleh menyebut "lihat Pengenalan Aplikasi di layar Masuk" tanpa menyalin isinya, supaya tidak ada dua versi yang bisa saling bertentangan.

### Handoff #5 | 2026-11-16 | FREN

**Tugas:** BTN.06 (sesi tes bantuan) selesai dan terbukti. SEC-30 dan SEC-31 ikut selesai.

**Berkas yang berubah:** tidak ada berkas di repo. Di lembar `bantuan-isi` (Google Sheet, BT7) ditambah satu baris uji `uji-html` (bagian `Uji impor`, urutan 940, peran `semua`, isi berisi tag HTML dan `<script>`). Baris itu diimpor ke tabel `bantuan`, dites, lalu dimatikan (`aktif = tidak`) dan diimpor ulang. Baris tidak dihapus di lembar maupun tabel. Tanpa migration dan tanpa deploy.

**Keputusan baru:** tidak ada. "OK" ketua untuk impor dan pematian baris uji sudah diberikan di chat.

**Hasil tes** (bukti diperiksa di chat dan tidak disimpan, aturan 10):

- **SEC-30:** isi berisi tag HTML tampil sebagai teks biasa di layar Bantuan, tanpa pop-up. Baris uji sudah hilang dari layar customer setelah dimatikan.
- **SEC-31:** `bantuan_daftar` dari customer dengan peran dan isian palsu di isi permintaan memberi balasan yang sama persis dengan panggilan normal. Kolom hanya `kunci, bagian, urutan, judul, isi`. Tanpa token, hanya `apikey`, token palsu, dan kunci publishable sebagai Bearer semuanya dibalas 401. Hak `service_role` pada `bantuan` hanya SELECT, RLS aktif, 0 policy.
- **Per peran:** customer tidak melihat Tugas owner dan Tugas penjaga. Owner hanya melihat Tugas owner. Penjaga hanya melihat Tugas penjaga. Owner dan penjaga tidak melihat isi khusus customer (Memulai).

**Belum beres:**

- Penyaringan peran untuk **owner dan penjaga** baru teramati di layar (sebagian laporan lisan), belum dari balasan server seperti customer. Perintah konsol yang sama bisa dijalankan sekali di tiap akun bila ketua mau lebih ketat.
- Kelompok `Uji impor` kini berisi 4 baris, semuanya `aktif = tidak` (`uji-kutip`, `uji-baris`, `uji-nonaktif`, `uji-html`), jadi tidak tampil. Jangan diaktifkan lagi.
- `bantuan-test.md` belum dibuat. Sheet menyebutnya, tetapi bukti tidak disimpan (`AGENTS.md` bagian 10), jadi dokumen itu hanya akan memuat kasus uji tanpa hasil. Perlu diputuskan ketua apakah masih dibutuhkan.

**Saran giliran berikutnya:** SEC-04 dan SEC-03 untuk semua tabel (bantuan, inbox, gelar, staf, dan lainnya), High-Risk. Lampirkan `AGENTS.md`, `security.md`, `database.md`, dan `pemetaan-test.md`. SEC-32 bagian JWT `anon` lama bisa dites bila dashboard masih menampilkan kunci lama.

**Butir baru yang perlu ditambah ke sheet:** tidak ada.

### 2026-11-18: Isi Bantuan owner: customer tidak bisa daftar atau masuk

Keputusan ketua (sesi lanjutan Turnstile, 18 Nov 2026). Berkas tujuan: docs/bantuan.md bagian 9. Melengkapi BTN.05 (isi awal); bukan butir sheet baru. Yang paling akhir menang.

- **Alasan:** setelah Turnstile aktif, sebagian customer (HP atau browser lama) bisa terhalang daftar atau masuk. Jalan keluarnya adalah order wakil lewat Pelanggan tanpa akun oleh owner, jadi owner perlu tahu caranya.
- **Satu entri di lembar Bantuan, peran `owner` saja.** Customer yang terhalang tidak bisa membuka Bantuan (butuh login; B35 ditunda), jadi arahan untuk customer ada di Pengenalan (pengenalan.md blok 18 Nov 2026).
- **Inti isi (draf bahan):** penyebab biasanya HP atau browser customer lama sehingga pemeriksaan keamanan tidak selesai; jangan minta customer mencoba berulang-ulang; catat pesanan lewat menu Pelanggan tanpa akun, lalu koordinasi lewat WhatsApp seperti biasa; pesanan lewat jalur ini tidak muncul di aplikasi customer, jadi kabar status juga lewat WhatsApp.
- **Cek sebelum menulis:** nama menu dan tombol harus persis seperti di layar owner (dicek ke aplikasi), dan pernyataan soal status ke customer dicocokkan dengan `order.md`.
- **Aturan tetap:** teks biasa (BT4), tanpa nomor WA atau data pribadi (BT11), tanpa angka mudah berubah. `kunci` baru, `urutan` kelipatan 10, `bagian` mengikuti isi lembar yang ada. Jangan memakai `urutan` 1.
- **Cara:** tulis di lembar, impor lewat SQL Editor (BT7). Tanpa kode dan tanpa push. Dikerjakan bersama BTN.05.

### Handoff #6 | 2026-11-18 | [FREN]

**Tugas:** BTN.05 (isi awal Bantuan) **dikerjakan sebagai draf lengkap, belum final**. Isi baru juga mencakup BTN.07 (draf), GLR.10, dan QRS.05. Tidak ada berkas di repo, migration, atau deploy yang berubah. Isi ditulis di lembar `bantuan-isi` (Google Sheet, BT7), lalu diimpor lewat kolom H di SQL Editor akun ketua. SQL impor tidak disimpan di repo.

**Isi yang ditambah (ringkas, sekitar 70 pertanyaan di 10 bagian):**

- Draf dasar (29 pertanyaan): Memulai, Memesan, Status pesanan, Pembayaran, Notifikasi, Tugas owner, Tugas penjaga, Umum.
- Tambahan 1 (17 baris): privasi dan keluar akun, menu Habis, rincian dan pilihan menu, menghubungi warung, riwayat pesanan, notifikasi tidak masuk, tugas owner (kelola menu, foto dan grup pilihan, foto bukti, akun staf), tugas penjaga (foto bukti, batasan penjaga), game, pembaruan aplikasi.
- Tambahan 2 (11 baris): notifikasi per peran dan notif telat (`notif-03` sampai `notif-07`), bagian baru **Kotak masuk** (`inbox-01` sampai `inbox-06`). Terbukti tampil di layar.
- Tambahan 3 (11 baris): QRIS di bagian Pembayaran (`qris-01` sampai `qris-05`) dan bagian baru **Gelar** (`gelar-01` sampai `gelar-06`). Terbukti tampil di layar.
- Tambahan 4: `owner-11` (customer tidak bisa daftar atau masuk, BTN.07).
- Tambahan 5: `memesan-10` dan `owner-12` (batas order harian), **`aktif = tidak`**.

**Keputusan baru:**

- Fokus sesi ini adalah **kelengkapan Q&A**; reword (konsistensi "Anda" vs "-mu", nama tombol) ditunda ke PIC.
- Isi gelar tanpa angka ambang dan tanpa nama gelar tertentu (GL15, GL25). Batas order harian tanpa angka. `inbox-04` memakai kata "sekitar" karena batasnya ada di pengaturan.
- `penjaga-07` digantikan `notif-06` (lebih lengkap). Dinonaktifkan saat pembersihan data, bukan sekarang.
- Dua baris batas order dibiarkan `aktif = tidak` karena fiturnya belum live dan kodenya belum dibuat.
- Alasan keputusan di luar yang disebut di atas: alasan belum tercatat.

**Belum beres:**

- **BTN.05 belum boleh dicentang** sampai reword selesai dan nama tombol, tab, dan menu dicocokkan ke layar asli (antara lain Pesanan Saya, Coba lagi, Chat WA, Simpan gambar, Unduh PNG, Bagikan, Pengaturan akun, Keluar, menu daftar Pelanggan tanpa akun).
- `notif-01` masih memakai "pesananmu".
- Baris yang bergantung fitur lain perlu dicek ulang saat fiturnya final: foto bukti (`status-06`, `owner-09`, `penjaga-05`) dan notifikasi.
- Status impor `owner-11`, `memesan-10`, `owner-12`, dan tambahan 1 belum dikonfirmasi di chat.
- Penyaringan peran untuk owner dan penjaga baru teramati di layar (Handoff #5); belum dari balasan server.
- Pernyataan di `owner-11` ("tidak muncul di aplikasi customer") disimpulkan dari `gelar.md` GL6 dan belum dicocokkan dengan `order.md` dan layar owner.

**Butir baru yang perlu ditambah ke sheet:**

- "Nonaktifkan penjaga-07 dan baris uji bantuan" (saat pembersihan data).
- "Aktifkan Bantuan batas order harian" (setelah batas live dan lulus tes, sebelum LNC.04; cocokkan kalimat dengan pesan di layar).

**Saran giliran berikutnya:** reword dan cocokkan dengan layar asli (lampirkan screenshot), centang GLR.10 dan QRS.05 bila isinya sudah sesuai, lalu BTN.07 setelah `owner-11` terimpor. Setiap perubahan fitur dicatat sebagai butir "perbarui Bantuan".

### 2026-11-19: Isi Bantuan Belanja Warung, bagian khusus "Belanja Owner"

Keputusan ketua (sesi BLJ.08, 19 Nov 2026). Sumber: docs/belanja.md. Melengkapi BTN.05 (isi awal); bukan butir sheet baru. Yang paling akhir menang.

- **Empat entri baru di lembar `bantuan-isi`**, bagian **`Belanja Owner`**, peran `owner`, `aktif = ya`: `belanja-01` (apa itu dan cara membuka, `urutan` 850), `belanja-02` (mencatat dan mencicil, 860), `belanja-03` (salah input: Ubah dan Batalkan, 870), `belanja-04` (arti Kunci dan efeknya ke total, 880).
- **Bagian khusus, bukan di "Tugas owner".** Alasan ketua: bagian yang hanya dilihat owner. Alasan lain belum tercatat. Penyaringan peran tetap dilakukan server (BT5).
- **Aturan isi tetap:** teks biasa (BT4), tanpa angka batas (harga, panjang, jumlah barang, jumlah catatan terkunci yang tampil ada di `pengaturan`), tanpa data pribadi (BT11), `urutan` bukan 1.
- **Bergantung pada layar Belanja Warung.** Nama tombol (+ Catatan baru, Tambah, Simpan, Tambah barang, Ubah, Batalkan, Ubah judul, Kunci) sudah dicocokkan ketua dengan layar asli pada 19 Nov 2026. Bila layar berubah, catat butir baru "perbarui Bantuan" (bagian 6, aturan yang paling sering terlanggar).
- **Sudah diimpor dan tampil** di layar Bantuan akun owner (screenshot ketua, 19 Nov). Seperti isi lain, SQL impor tidak disimpan di repo (BT7); lembar adalah sumber dan cadangannya. Belum dicek dari akun customer dan penjaga bahwa bagian ini tidak tampil.
- **Tidak ada perubahan skema, kode, atau deploy.**

### 2026-11-19: `penjaga-07` dibiarkan aktif, baris uji Bantuan terbukti nonaktif

Keputusan ketua (19 Nov 2026, sesi penutupan LNC.01). Alasan ketua: tidak dipermasalahkan, dan tidak mau menambah butir baru di sheet. Alasan selebihnya belum tercatat. Yang paling akhir menang.

- **`penjaga-07` dibiarkan `aktif = ya`**, berdampingan dengan `notif-06`. Ini **menimpa** Handoff #6 (18 Nov 2026) yang menulis `penjaga-07` "dinonaktifkan saat pembersihan data" dan butir sheet "Nonaktifkan penjaga-07 dan baris uji bantuan". Bagian `penjaga-07` dari butir itu **tidak dikerjakan dan tidak dijadikan butir sheet**. Isi `notif-06` belum dibandingkan dengan `penjaga-07`, jadi belum diketahui apakah ada isi yang tumpang tindih atau usang.
- **Baris uji Bantuan terbukti nonaktif** lewat query baca-saja (19 Nov 2026): `uji-baris`, `uji-html`, `uji-kutip`, dan `uji-nonaktif` semuanya `aktif = false`, dan tidak ada baris aktif lain yang mirip uji. Bagian butir Handoff #6 tentang baris uji ini sudah terpenuhi. Bukti diperiksa di chat dan tidak disimpan (`AGENTS.md` bagian 10).
- Tidak ada perubahan skema, kode, data, atau deploy. Lembar `bantuan-isi` tidak diubah.

### 2026-11-20: Layar Bantuan mengirim satu event anonim

Sumber: docs/analitik.md (AN3, AN4).

- Saat layar Bantuan dibuka, satu event `buka-bantuan` dikirim lewat `analitik.js`. **Pertanyaan yang dibuka atau dicari tidak dikirim.**
- Isi Bantuan, lembar Google Sheet bantuan, dan SQL impor tidak berubah.

---
