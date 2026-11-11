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

---
