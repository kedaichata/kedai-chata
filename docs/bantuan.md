/docs/bantuan.md

# ❓ bantuan.md: Layar Bantuan, Isi dari Google Sheet, dan Impor lewat SQL Editor

> **Versi 1.3 (21 Nov 2026), hasil sesi strategi.** Terhubung ke `AGENTS.md` (peta dokumen dan pengecualian BT7), `database.md`, `desain.md` (DS10, DS15), dan `security.md` (aturan 21, SEC-30, SEC-31). Bergantung pada `akun.md` (fungsi `kedai` dan peran), `desain.md` (komponen), dan `database.md`.
> **Status:** BT1 sampai BT13 disepakati ketua. Butir **(bawaan)** = pilihan penulis, ketua boleh mengubahnya. Layar, aksi server, tabel, lembar, dan isi awal sudah berjalan (BTN.01 sampai BTN.07).
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini** (+ `database.md` dan `security.md` untuk langkah tabel dan aksi). Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 9.
> **Berkas yang diminta AI di awal sesi:** berkas migration terbaru, `supabase/functions/kedai/bantuan.ts`, dan `public/bantuan.js`.
> **Tanpa kode dan tanpa isi SQL.** Rumus yang membuat SQL impor ada di **berkas template lembar** (`bantuan-isi.xlsx`), bukan di md ini. **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Tingkat risiko:** fitur ini **P1**. Tabel, aksi server, dan SQL yang dijalankan manual di production **High-Risk**; tampilan layar dan isi teks **Low-Risk**.
> **Prefix sheet:** BTN.

---

## 1. Tujuan

Customer, owner, dan penjaga bisa membuka **jawaban atas pertanyaan sehari-hari** (cara memesan, arti status, notifikasi, Kotak masuk, QRIS, gelar, tugas tiap peran) tanpa harus bertanya lewat WA terus-menerus. Isinya **ditulis dan diubah ketua di Google Sheet**, lalu dimasukkan ke database lewat SQL Editor, jadi mengubah bantuan **tidak perlu mengubah kode**.

Topik umum tentang aplikasi web (apa itu PWA, cara memasang, update otomatis) ada di **Pengenalan Aplikasi** (`pengenalan.md`), yang terbuka tanpa login dari layar Masuk. Bantuan tidak menyalin topik itu; boleh menyebut "lihat Pengenalan Aplikasi di layar Masuk" supaya tidak ada dua versi yang bisa saling bertentangan.

---

## 2. Keputusan

| No   | Keputusan                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Dasar                                                                                                                                     |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| BT1  | **Bantuan adalah layar tanya-jawab** yang bisa dibuka semua peran setelah login. Pintu masuk: **ikon ? di bilah atas** (tab utama saja, satu ketukan dari tab mana pun) dan **tombol Bantuan di Home** ke layar yang sama. **Tidak ada menu hamburger, menu Akun, atau menu Lainnya** sebagai pintu (customer tidak boleh dipersulit mencari). Ikon ? tidak tampil di sub-layar, Masuk, Daftar, dan selama layar Bantuan sendiri terbuka.                                          | Keputusan ketua 10 Nov 2026 (owner mengeluh Bantuan terlalu jauh dari tab utama); `desain.md` DS10, DS15; `home.md` HM5.                  |
| BT2  | **Isi disimpan di tabel `bantuan`** di database dan **diubah lewat Google Sheet, lalu SQL Editor** oleh ketua atau adik ketua. Aplikasi **tidak bisa mengubah** isi bantuan. Editor di dalam aplikasi masuk `bonus.md` (B32).                                                                                                                                                                                                                                                      | Keputusan ketua 5 Nov 2026.                                                                                                               |
| BT3  | **Kolom lembar:** `kunci` (unik dan tetap), `bagian` (kelompok, misalnya Memulai), `urutan` (kelipatan 10 supaya mudah disisipi), `peran` (`semua`, `customer`, `owner`, atau `penjaga`), `judul` (pertanyaan), `isi` (jawaban), `aktif` (`ya` atau `tidak`), ditambah kolom SQL otomatis dan kolom Cek otomatis. **Bentuk data di tabel:** `kunci` 3 sampai 50 karakter (huruf kecil, angka, strip), `bagian` tidak kosong dan maksimal 60, `urutan` bilangan bulat 0 atau lebih. | Pola lembar bantuan aplikasi referensi (bagian, urutan, judul, isi); peran ditambah. Bentuk data: pilihan penulis yang disetujui ketua.   |
| BT4  | **Teks biasa saja:** tanpa HTML, tanpa markdown, tanpa tautan aktif. Baris baru di `isi` menjadi paragraf baru. Semua tampil lewat `textContent`. **Satu pengecualian: infografik.** Baris dengan `urutan` tepat 1 yang `isi`-nya path gambar relatif di `img/` (contoh `img/infografik.webp`) tampil sebagai gambar di atas daftar, tidak dilipat, dengan `judul` sebagai teks alternatif. Satu gambar umum untuk semua peran (baris berperan `semua`).                           | `security.md` aturan 10. Infografik: keputusan ketua 10 Nov 2026, tanpa kolom `jenis`, tanpa migration. Alasan lain belum tercatat.       |
| BT5  | **Penyaringan peran dilakukan server:** server memberi isi berperan `semua` ditambah isi yang sesuai peran pemanggil (dibaca dari tabel `staf`; bukan staf berarti customer). Peran yang dikirim di permintaan **diabaikan**.                                                                                                                                                                                                                                                      | `security.md` aturan 2 dan 18.                                                                                                            |
| BT6  | **Isi tidak pernah dihapus:** yang tidak dipakai ditandai `aktif = tidak`, dan **baris di lembar tidak dihapus**. Impor memakai **tambah atau perbarui berdasarkan `kunci`**, jadi menjalankan ulang aman.                                                                                                                                                                                                                                                                         | `AGENTS.md` bagian 7 (tanpa DELETE).                                                                                                      |
| BT7  | **SQL impor dibuat otomatis oleh lembar** (kolom SQL) dan dijalankan di SQL Editor. **Pengecualian aturan "SQL disalin ke repo dulu":** SQL isi bantuan adalah **data**, bukan skema, dan sering berubah, jadi **tidak disimpan di repo**; **lembar Google Sheet adalah sumber dan cadangannya** (dipegang adik ketua). **(bawaan)**                                                                                                                                               | `database.md` bagian 6 dan `AGENTS.md` bagian 7 (berlaku untuk skema dan fungsi; pengecualian ini dicatat di keduanya); butuh "OK" ketua. |
| BT8  | **Hak tabel:** `service_role` hanya **baca** `bantuan`, RLS aktif tanpa policy, tanpa DELETE. Aplikasi tidak punya jalur tulis ke tabel ini.                                                                                                                                                                                                                                                                                                                                       | `database.md` bagian 3; `security.md` aturan 1 dan 21.                                                                                    |
| BT9  | **Diambil sekali saat layar Bantuan dibuka** dan lewat tombol **Segarkan**. Tanpa polling. Offline: pesan jelas bahwa butuh internet.                                                                                                                                                                                                                                                                                                                                              | `notifikasi.md` NT10; DS13; hemat free tier.                                                                                              |
| BT10 | **Batas isi** (bentuk data, dicek di database): `judul` 5 sampai 120 karakter, `isi` 1 sampai 2000 karakter, tanpa syarat spasi di tepi (supaya SQL dari lembar tidak gagal karena baris baru di ujung sel). Jumlah isi aktif sebaiknya di bawah sekitar 100. **(bawaan)**                                                                                                                                                                                                         | Layar tetap ringan di HP kecil dan kuota free tier.                                                                                       |
| BT11 | **Isi tidak memuat** nomor rekening atau QRIS, data pribadi, atau rahasia apa pun. Cara bayar tetap lewat WA.                                                                                                                                                                                                                                                                                                                                                                      | `order.md` O21; `security.md` aturan 16 dan 18.                                                                                           |
| BT12 | **Tampilan:** pertanyaan dikelompokkan per `bagian` (judul kelompok), tiap pertanyaan **dilipat** dan dibuka dengan satu ketukan (akordeon bawaan peramban). Urutan mengikuti `urutan`. Pencarian ditunda. **(bawaan)**                                                                                                                                                                                                                                                            | `features.md` bagian 9 (sesederhana WA).                                                                                                  |
| BT13 | **Isi awal ditulis ketua** setelah fitur final (supaya jawabannya cocok dengan aplikasi). Draf contoh disediakan di template lembar sebagai bahan.                                                                                                                                                                                                                                                                                                                                 | Keputusan ketua 5 Nov 2026.                                                                                                               |

---

## 3. Prasyarat

`akun.md` selesai (fungsi `kedai` dan peran dikenali server) dan `desain.md` sampai komponen dasar (DSN.04). Mekanismenya (BTN.01 sampai BTN.04) tidak bergantung pada fitur lain, tetapi **isi awal (BTN.05) dikerjakan setelah fitur lain selesai**, supaya jawabannya sesuai aplikasi yang final.

---

## 4. Yang dibuat

| Komponen            | Isi                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tabel `bantuan`     | Skema di `database.md`. Sembilan kolom. RLS aktif tanpa policy; `service_role` hanya baca; tanpa DELETE. Kolom waktu bernama `diubah_pada` (tercatat di sheet `Petunjuk` sel B4 pada lembar, dipakai rumus kolom H).                                                                                                                                                                                                  |
| Aksi `kedai`        | `bantuan_daftar` (semua yang login) di `supabase/functions/kedai/bantuan.ts`, **tanpa fungsi SQL** (bacaan murni, tanpa migration): isi aktif yang sesuai peran, urut `urutan` lalu `kunci`. Balasan `{ok: true, bantuan: [...]}` dengan kolom `kunci, bagian, urutan, judul, isi`. Server mengabaikan seluruh isi permintaan. Pengelompokan per `bagian` dikerjakan layar.                                           |
| Layar Bantuan       | Panel di dalam kerangka (bilah atas dan Segarkan langsung jalan), daftar per bagian, pertanyaan dilipat (BT12), infografik di atas bila ada. Teks lewat `textContent`. Keadaan memuat, kosong ("Belum ada bantuan"), galat, dan offline. Kode di `public/bantuan.js`. Layar mengirim satu event anonim `buka-bantuan` lewat `analitik.js`; pertanyaan yang dibuka atau dicari tidak dikirim (`analitik.md` AN3, AN4). |
| Pintu masuk         | Ikon ? emas di bilah atas (kiri Segarkan, tab utama saja) dan tombol Bantuan di Home (BT1). Tombol Kembali membuka tab asal.                                                                                                                                                                                                                                                                                          |
| Lembar Google Sheet | Dibuat dari template `bantuan-isi.xlsx`: kolom A sampai G diisi manual, **kolom H (SQL) dan kolom I (Cek) otomatis dan tidak diubah**. Tanpa data pelanggan.                                                                                                                                                                                                                                                          |

**Format lembar (ringkas):**

| Kolom | Isi          | Aturan                                                                                                                                                                                                                                         |
| ----- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A     | `kunci`      | Unik, huruf kecil, angka, dan garis (contoh `memulai-01`). **Jangan diganti** setelah diimpor.                                                                                                                                                 |
| B     | `bagian`     | Nama kelompok. Tulis sama persis untuk pertanyaan sekelompok.                                                                                                                                                                                  |
| C     | `urutan`     | Angka, kelipatan 10 (10, 20, 30 ...). Boleh disisipi (misalnya 15). **Urutan 1 hanya untuk infografik.**                                                                                                                                       |
| D     | `peran`      | Pilih dari daftar: `semua`, `customer`, `owner`, `penjaga`.                                                                                                                                                                                    |
| E     | `judul`      | Pertanyaan, 5 sampai 120 karakter.                                                                                                                                                                                                             |
| F     | `isi`        | Jawaban, sampai 2000 karakter. Baris baru (Alt+Enter) = paragraf baru. Teks biasa.                                                                                                                                                             |
| G     | `aktif`      | `ya` atau `tidak`.                                                                                                                                                                                                                             |
| H     | SQL otomatis | Rumus. Menangani tanda kutip dan baris baru. **Jangan diubah.** Berisi "PERIKSA KOLOM I" bila kolom I bukan OK.                                                                                                                                |
| I     | Cek otomatis | OK, atau pesan kesalahan sesuai batas tabel (`kunci` 3 sampai 50 huruf kecil, angka, strip dan unik; `bagian` maks 60; `urutan` bilangan bulat 0 atau lebih; `peran` valid; `judul` 5 sampai 120; `isi` 1 sampai 2000; `aktif` ya atau tidak). |

**Aturan baris infografik:** `kunci` `infografik-01`, `urutan` 1, `peran` `semua`, `isi` = path gambar, `aktif` ya. Path dicek di layar saja (server tidak memeriksa `isi`): diawali `img/`, berakhiran `.webp`, `.png`, atau `.jpg`, tanpa `..`, `:`, `//`. Bila bukan path sah, baris tampil sebagai pertanyaan biasa. Bila ada lebih dari satu baris gambar dengan urutan 1, hanya yang pertama dipakai. Gambar belum ada atau gagal dimuat: gambar disembunyikan, layar tetap rapi. Gambar yang dipakai `img/infografik.webp`, dibuat sendiri (gambar acuan teman tidak disalin, `desain.md`).

**Prosedur impor (untuk ketua atau adik):**

1. Ubah atau tambah baris di lembar (kolom A sampai G). Jangan menghapus baris.
2. Pastikan kolom I berisi OK dan tiap baris punya `kunci` unik.
3. Salin kolom H: seluruh baris dari baris 2 sampai baris terakhir yang berisi, atau hanya baris yang berubah.
4. Buka SQL Editor di dashboard Supabase (akun ketua), tempel, lalu **Run**. Hasil yang benar: berhasil tanpa pesan galat.
5. Buka aplikasi, layar Bantuan, tekan Segarkan, dan cek isinya.
6. Mengubah kata-kata: edit baris yang sama (`kunci` tetap), salin kolom H baris itu, Run, Segarkan.
7. Isi yang tidak dipakai lagi: ubah `aktif` menjadi `tidak`, salin ulang kolom H baris itu, dan jalankan lagi. Baris tidak dihapus.

---

## 5. Urutan pekerjaan (untuk TODO sheet, prefix BTN)

Langkah ⚠️ butuh penjelasan dampak dan "OK" ketua. Bantuan dikerjakan **lebih dulu**, tidak menunggu `notifikasi.md` atau SEC-25.

1. **BTN.01 ⚠️ (selesai)** Migration: tabel `bantuan` (kunci unik, bagian, urutan, peran, judul, isi, aktif, waktu diubah), batas panjang judul dan isi, hak `service_role` hanya baca, RLS. SQL disalin ke `supabase/migrations/` dulu. Hak dicek setelahnya.
2. **BTN.02 ⚠️ (selesai)** Aksi `bantuan_daftar` di `kedai`: semua yang login, isi aktif, disaring peran dari server (BT5), urut `urutan` lalu `kunci`. Deploy dengan urutan aman.
3. **BTN.03 (selesai)** Layar Bantuan (BT12), ikon ? di bilah atas, dan tombol Bantuan di Home aktif ke layar yang sama. Teks lewat `textContent`; offline menampilkan pesan; kosong menampilkan "Belum ada bantuan". Berkas JS baru didaftarkan di cache `sw.js`.
4. **BTN.04 ⚠️ (selesai)** Lembar dari template dan uji impor baris contoh: satu berisi tanda kutip, satu berisi baris baru, satu `aktif = tidak`. Baris uji ditandai `aktif = tidak`, tidak dihapus.
5. **BTN.04a (selesai)** Infografik alur aplikasi: `img/infografik.webp`, didaftarkan di cache `sw.js`, baris lembar `infografik-01` (`urutan` 1, `peran` `semua`).
6. **BTN.05 (selesai)** Isi awal ditulis di lembar dan diimpor, sudah melalui review. Sekitar 70 pertanyaan untuk customer, owner, dan penjaga, termasuk Kotak masuk (titik merah, pesan 14 hari, status dibaca per HP), QRIS (QRS.05), gelar (GLR.10), dan bagian **Belanja Owner** (khusus owner, `belanja-01` sampai `belanja-04`). Pedoman isi: tanpa rekening, QRIS, atau data pribadi; **tanpa angka dan nama gelar yang mudah berubah** (hanya aturan stabil: pesanan Selesai yang dihitung, pesanan yang dicatatkan pihak ChATA tidak menambah gelar, banner lewat tombol Gelar di Home lalu Bagikan atau Unduh PNG); tanpa menyalin topik Pengenalan.
7. **BTN.06 (selesai)** Sesi tes: tiap peran hanya melihat isinya, `aktif = tidak` tidak tampil, teks berisi tag HTML tampil sebagai teks, tanpa token ditolak. Rujukan tes keamanan: SEC-30 dan SEC-31 (`security.md`).
8. **BTN.07 (selesai)** Entri owner `owner-11`: customer yang tidak bisa daftar atau masuk. Penyebab biasanya HP atau browser lama sehingga pemeriksaan keamanan tidak selesai; owner tidak meminta customer mencoba berulang-ulang; pesanan dicatat lewat menu Pelanggan tanpa akun, dan kabar status lewat WhatsApp seperti biasa. Customer yang terhalang tidak bisa membuka Bantuan, jadi arahan untuk mereka ada di Pengenalan (topik "tidak bisa daftar atau masuk").

Baris `memesan-10` dan `owner-12` (batas order harian, tanpa angka) ada di lembar dengan `aktif = tidak`. Batas order harian sudah live dan lulus tes, dan isi lembar sudah direview owner, jadi kedua baris tinggal diaktifkan sebelum LNC.04, dengan kalimat dicocokkan ke pesan di layar.

---

## 6. Aturan yang paling sering terlanggar

| Aturan                                                                           | Akibat bila dilanggar                                                                                                  |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Menaruh Bantuan di menu hamburger atau tersembunyi                               | Ibu-ibu tidak menemukannya (DS10).                                                                                     |
| Menampilkan isi lewat `innerHTML`                                                | Teks berisi tag bisa menjalankan skrip (SEC-30).                                                                       |
| Menghapus baris di lembar untuk "menghapus" isi                                  | Isi lama tetap di database dan tetap tampil; pakai `aktif = tidak` (BT6).                                              |
| Mengganti `kunci` yang sudah diimpor                                             | Dianggap isi baru; isi lama tetap aktif sehingga muncul dobel.                                                         |
| Mengetik atau mengubah kolom SQL (H) atau Cek (I) secara manual                  | Tanda kutip salah dan impor gagal atau merusak isi.                                                                    |
| Menulis rekening, QRIS, atau data pribadi di isi                                 | Terbaca semua pengguna (BT11).                                                                                         |
| Mengirim peran dari aplikasi untuk memilih isi                                   | Customer bisa melihat isi owner atau penjaga; server harus mengabaikannya (SEC-31).                                    |
| Bantuan tidak diperbarui setelah fitur berubah                                   | Petunjuk salah; setiap perubahan fitur dicatat sebagai butir baru "perbarui Bantuan".                                  |
| Memberi aplikasi hak tulis ke `bantuan`                                          | Melanggar BT8; isi bisa diubah dari aplikasi.                                                                          |
| Memakai `urutan` 1 untuk pertanyaan biasa                                        | Baris tampil sebagai infografik atau terlewat dari daftar pertanyaan (BT4).                                            |
| Mengimpor baris infografik sebelum gambarnya ada di `public/img/` dan di `sw.js` | Gambar tidak tampil atau tidak tersedia offline; naikkan nama cache `sw.js` (butuh "OK" ketua).                        |
| Menyebut angka ambang atau nama gelar tertentu di isi Bantuan                    | Teks Bantuan ditulis manual dan tidak ikut berubah bersama tabel `gelar`, jadi bisa menjadi salah tanpa ada yang tahu. |

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
- Gambar atau tangkapan layar di bantuan selain satu infografik (B33), dan infografik berbeda per peran.
- Pencarian di bantuan dan bantuan kontekstual per layar (ikon "?") (B34).
- Bantuan yang bisa dibuka sebelum login (B35): butuh jalur tanpa token, bertentangan dengan aturan cek token paling awal.
- Umpan balik "membantu atau tidak" dan terjemahan.

---

## 9. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

_(belum ada blok)_

### Handoff #1 | 2026-11-10 | [Ketua]

**Tugas:** BTN.01 (tabel `bantuan`) dan BTN.02 (aksi `bantuan_daftar`) selesai dan terbukti.
**Keputusan:** BTN.02 tanpa fungsi SQL dan tanpa migration, aksi membaca tabel langsung karena bacaan murni. Pilihan penulis yang disetujui ketua lewat "OK gas"; alasan lain belum tercatat. Kode baru ada di `bantuan.ts`; `index.ts` hanya mendapat satu import, satu sambungan alat bantu, dan satu `case`.

### Handoff #2 | 2026-11-10 | [FREN]

**Tugas:** BTN.03 giliran A (layar Bantuan di `public/bantuan.js` dan gaya di `style.css`).
**Keputusan ketua (10 Nov 2026):** tanpa kolom `jenis`, tanpa migration, tanpa deploy ulang; infografik = baris `urutan` 1 dengan aturan path di bagian 4; satu gambar umum untuk semua peran. Layar Bantuan berupa panel di dalam kerangka, pilihan penulis kode yang disetujui lewat "gas"; alasan lain belum tercatat.

### Handoff #3 | 2026-11-11 | [RAC]

**Tugas:** BTN.03 selesai (giliran A dan B), dites di laptop dan HP.
**Keputusan (pilihan penulis kode, disetujui lewat "gas"):** tab `bantuan` juga ditambahkan untuk peran tak dikenal (`lain`) supaya ikon ? tidak menjadi tombol kosong; alasan lain belum tercatat.

### Handoff #4 | 2026-11-11 | [Ketua]

**Tugas:** BTN.04 dan BTN.04a selesai: lembar dibuat dari template (kolom I "Cek" ditambahkan), impor uji berhasil, dan infografik `img/infografik.webp` terpasang dan tampil. Pilihan penulis yang disetujui ketua; alasan lain belum tercatat.

### Handoff #5 | 2026-11-16 | [FREN]

**Tugas:** BTN.06 selesai; SEC-30 dan SEC-31 ikut selesai.
**Hasil:** isi berisi tag HTML tampil sebagai teks; peran palsu di permintaan customer diabaikan server; tanpa token, token palsu, dan kunci publishable sebagai Bearer dibalas 401; tiap peran hanya melihat isinya (teramati di layar). Kelompok `Uji impor` berisi empat baris (`uji-kutip`, `uji-baris`, `uji-nonaktif`, `uji-html`), semuanya `aktif = tidak`; jangan diaktifkan lagi.

### Handoff #6 | 2026-11-21 | [FREN]

**Tugas:** BTN.05 (isi awal Bantuan) dan BTN.07 selesai, sudah melalui review; isi mencakup juga GLR.10 dan QRS.05. Isi ditulis di lembar `bantuan-isi` (Google Sheet, BT7) lalu diimpor lewat kolom H di SQL Editor akun ketua. Tidak ada berkas di repo, migration, atau deploy yang berubah.

**Hasil yang terbukti:**

- Draf dasar, privasi, menu Habis, riwayat, tugas owner dan penjaga, game, pembaruan aplikasi, Kotak masuk (`inbox-01` sampai `inbox-06`), notifikasi per peran (`notif-03` sampai `notif-07`), QRIS (`qris-01` sampai `qris-05`), gelar (`gelar-01` sampai `gelar-06`), dan Belanja Owner (`belanja-01` sampai `belanja-04`, tampil di layar akun owner) sudah diimpor.
- Empat baris uji terbukti `aktif = tidak` lewat query baca-saja (19 Nov 2026); tidak ada baris aktif lain yang mirip uji.
- Isi semua baris sudah direview owner (disampaikan ketua, 21 Nov 2026).

**Keputusan baru:**

- Isi gelar tanpa angka ambang dan tanpa nama gelar tertentu (GL15, GL25). Batas order harian tanpa angka. `inbox-04` memakai kata "sekitar" karena batasnya ada di pengaturan.
- Baris `penjaga-07` aktif berdampingan dengan `notif-06` (keputusan ketua 19 Nov 2026; alasan ketua: tidak dipermasalahkan dan tidak mau menambah butir baru di sheet).
- Bagian **Belanja Owner** dibuat khusus (bukan di "Tugas owner"), peran `owner`, `urutan` 850 sampai 880. Alasan ketua: bagian yang hanya dilihat owner. Nama tombol sudah dicocokkan ketua dengan layar asli (19 Nov 2026).
- Layar Bantuan mengirim satu event anonim `buka-bantuan` lewat `analitik.js` (`analitik.md` AN3, AN4).
- Alasan keputusan di luar yang disebut: alasan belum tercatat.

**Daftar butir yang masih terbuka (satu baris per butir):**

- Penyaringan peran untuk owner dan penjaga belum terbukti dari balasan server (baru teramati di layar).
- SEC-32 bagian JWT `anon` lama belum dites (butir sheet Keamanan sudah selesai).
- Bagian Belanja Owner belum dicek tidak tampil di akun customer dan penjaga.
- SHR.09: isi Bantuan tentang Bagikan belum ditulis; menunggu fitur Bagikan jalan, ditulis manual di lembar, bahan di `bagikan.md`.
- `memesan-10` dan `owner-12`: masih `aktif = tidak`, tinggal diaktifkan sebelum LNC.04 dengan kalimat dicocokkan ke pesan di layar.
- Keputusan ketua: apakah `bantuan-test.md` masih dibutuhkan (bukti tidak disimpan, `AGENTS.md` bagian 10, jadi dokumen itu hanya akan memuat kasus uji tanpa hasil).
- Favicon: galat Console `favicon.ico` 404, tidak berbahaya dan tidak mendesak (tanpa nomor sheet).

**Saran giliran berikutnya:** aktifkan `memesan-10` dan `owner-12` di lembar (prosedur impor bagian 4). Setiap perubahan fitur dicatat sebagai butir baru "perbarui Bantuan".
