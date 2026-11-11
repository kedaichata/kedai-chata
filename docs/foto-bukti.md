/docs/foto-bukti.md

# 📸 foto-bukti.md: Foto Bukti Antar, Kompres, Penyimpanan, dan Pembersihan 14 Hari

> **Versi 1.1 (4 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Perubahan 1.1: pengunggah boleh mengganti foto (FT2), penyapuan berkas tanpa baris dan foto diganti (FT7, FT8), catatan internal 14 sampai 21 hari (FT6). Bergantung pada `order.md` (status Diantar) dan `database.md` (Storage dan penjadwal).
> **Status:** FT1 sampai FT12 disepakati ketua (sesi strategi 4 Nov 2026). Butir **(bawaan)** = pilihan penulis; ketua boleh mengubahnya sebelum dikerjakan. Belum ada yang dikerjakan.
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini** (+ `database.md`, `security.md`). Kerjakan langkah di bagian 5. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 9.
> **Berkas yang diminta AI di awal sesi:** berkas migration terbaru, `supabase/functions/kedai/`, `supabase/functions/bersihkan/` bila sudah ada, dan berkas JS foto bila sudah ada.
> **Tanpa kode dan tanpa isi SQL.** **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Fitur ini High-Risk (P0):** data pelanggan dan **satu-satunya pengecualian aturan "tanpa DELETE"** (pembersihan). Tes teliti dan wajib ada bukti.

---

## 1. Tujuan

Menjawab masalah utama yang melahirkan aplikasi ini: **customer merasa pesanan tidak diantar.** Penjaga bisa memotret bukti antar (misalnya makanan di depan pintu atau di sekolah), customer dan owner bisa melihatnya. Foto **opsional**: penjaga yang menilai perlu atau tidak. Karena kuota file free tier kecil (sekitar 1 GB), foto dikompres di HP dan dibersihkan otomatis setelah 14 hari.

---

## 2. Keputusan

| No   | Keputusan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Dasar                                                                    |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| FT1  | Foto bukti **opsional**. **Penjaga yang menilai** perlu atau tidak; tidak ada kewajiban foto. Hanya ditawarkan untuk tipe **Diantar**.                                                                                                                                                                                                                                                                                                                                                                  | Keputusan ketua 4 Nov 2026; `order.md` O1.                               |
| FT2  | Foto diunggah saat status **Diantar atau Selesai**, oleh **penjaga atau owner**. **Satu foto aktif per order**; **pengunggah boleh mengganti** foto yang salah atau buram (foto lama ditandai diganti dan berkasnya ikut dibersihkan).                                                                                                                                                                                                                                                                  | Alur ketua (mermaid awal); penggantian foto: keputusan ketua 4 Nov 2026. |
| FT3  | **Dilihat oleh customer pemilik order dan owner dan penjaga.** Customer lain tidak bisa melihat.                                                                                                                                                                                                                                                                                                                                                                                                        | `akun.md` bagian 4; `security.md` SEC-20.                                |
| FT4  | **Kompres di HP sebelum diunggah:** target sekitar **100 sampai 200 KB** (perkecil sisi terpanjang dan kualitas). Server menolak berkas **bukan gambar** atau **lebih besar dari batas** (`foto_maks_kb` di `pengaturan`). Tes wajib mengecek ukuran akhir.                                                                                                                                                                                                                                             | Keputusan ketua; hitungan kuota 1 GB file dan 5 GB egress.               |
| FT5  | **Bucket Storage privat tanpa policy untuk aplikasi.** Unggah lewat **alamat unggah bertanda tangan dari server** (aksi `foto_minta_unggah`), lalu server mencatat foto (aksi `foto_catat`). Melihat lewat **tautan sementara dari server** (aksi `foto_lihat`). Aplikasi tidak pernah menulis langsung ke Storage.                                                                                                                                                                                     | `AGENTS.md` bagian 7 (tabel dan akses tertutup).                         |
| FT6  | **Disimpan 14 hari lalu dibersihkan otomatis.** Lama simpan ada di `pengaturan` (`foto_simpan_hari`, nilai awal 14). Karena penjadwalnya mingguan (FT7), praktisnya berkas bertahan 14 sampai 21 hari; ini catatan internal, **customer tidak perlu diberi tahu lamanya**. **Catatan order tetap**; hanya berkas foto yang dihapus. Setelah dibersihkan, order menampilkan "Foto sudah dihapus".                                                                                                        | Keputusan ketua 4 Nov 2026.                                              |
| FT7  | **Pembersihan memakai penjadwal mingguan** (`pg_cron`) yang memanggil Edge Function **`bersihkan`** satu kali seminggu. Fungsi menghapus berkas lewat **jalur resmi Storage** (bukan menghapus baris tabel Storage lewat SQL, karena berkas bisa tertinggal), lalu menandai baris foto sebagai dibersihkan. Fungsi juga menyapu berkas yang ditandai diganti (FT2) dan berkas tanpa baris yang lebih tua dari `foto_simpan_hari` (sisa unggahan yang tidak sempat dicatat), hanya di bucket foto bukti. | Keputusan ketua (cron mingguan); kuota panggilan tidak terasa.           |
| FT8  | **Pengecualian "tanpa DELETE" yang resmi dan satu-satunya:** hanya berkas foto bukti (dan foto menu **tidak** dibersihkan, `menu.md` MN6) yang lebih tua dari `foto_simpan_hari`, yang ditandai diganti, atau yang tidak punya baris dan lebih tua dari batas; tidak ada penghapusan baris order atau catatan. Fungsi `bersihkan` memverifikasi **rahasia penjadwal** paling awal (bukan token login); tanpa rahasia: ditolak.                                                                          | `security.md` aturan 3 dan 12; butuh "OK" ketua.                         |
| FT9  | Rahasia penjadwal (nilai pengenal pemanggil `bersihkan`) disimpan **hanya di dashboard Supabase**, tidak di chat, md, atau repo. SQL penjadwal di repo **tanpa nilai rahasia** (diisi saat dijalankan).                                                                                                                                                                                                                                                                                                 | `security.md` aturan 7.                                                  |
| FT10 | **Tabel `foto_bukti`** mencatat: order, lokasi berkas, waktu unggah, siapa yang mengunggah, tanda diganti, dan waktu dibersihkan (kosong bila masih ada). Baris **tidak dihapus**.                                                                                                                                                                                                                                                                                                                      | `database.md` bagian 2.                                                  |
| FT11 | **Push ke customer** saat status Selesai (atau saat foto diunggah) memuat teks umum saja; fotonya dibuka di aplikasi, **tidak dikirim lewat push**.                                                                                                                                                                                                                                                                                                                                                     | `notifikasi.md`; `security.md` aturan 16.                                |
| FT12 | Foto menu (`menu.md` MN6) memakai **teknik kompres dan unggah yang sama**, tapi bucket terpisah dan tanpa pembersihan. **(bawaan)**                                                                                                                                                                                                                                                                                                                                                                     | Menghindari kode ganda.                                                  |

**Perkiraan kuota (asumsi kasar):** 30 order per hari × 150 KB ≈ 4,5 MB per hari, sekitar 135 MB per bulan; dengan simpan 14 hari yang tersimpan paling banyak sekitar 63 MB. Aman untuk 1 GB. Egress (5 GB per bulan) aman selama foto tidak dibuka berulang dalam jumlah besar.

---

## 3. Prasyarat

`order.md` (status Diantar dan peran penjaga) berjalan. `database.md` memuat tabel `foto_bukti` dan pengaturan foto. Penjadwal `pg_cron` tersedia di project Supabase (dicek di dashboard saat langkahnya tiba).

---

## 4. Yang dibuat

| Komponen                        | Isi                                                                                                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucket Storage privat           | Tanpa policy untuk aplikasi (FT5); satu bucket foto bukti (dan satu bucket foto menu, MN6).                                                                          |
| Tabel `foto_bukti` + pengaturan | `foto_simpan_hari` (14), `foto_maks_kb`. Skema di `database.md`.                                                                                                     |
| Aksi `kedai` untuk foto         | `foto_minta_unggah`, `foto_catat`, `foto_lihat` dengan pengecekan peran dan kepemilikan order; `foto_catat` juga dipakai mengganti foto, hanya oleh pengunggah asli. |
| Berkas JS foto                  | Kompres gambar di HP, tombol foto di layar penjaga (hanya tipe Diantar, status Diantar atau Selesai), tampilan foto di detail order.                                 |
| Edge Function `bersihkan`       | Hapus berkas foto lewat jalur resmi, tandai dibersihkan; sapu berkas yang ditandai diganti dan berkas tanpa baris; verifikasi rahasia penjadwal paling awal.         |
| Penjadwal `pg_cron` mingguan    | Memanggil `bersihkan` seminggu sekali. SQL di `supabase/migrations/` tanpa nilai rahasia.                                                                            |

---

## 5. Urutan pekerjaan (untuk TODO sheet, prefix FTO)

Langkah ⚠️ butuh penjelasan dampak dan "OK" ketua.

1. **FTO.01 ⚠️** Migration: tabel `foto_bukti`, baris `pengaturan` foto, bucket privat tanpa policy, hak minimal, RLS. Cek hak `service_role` setelahnya.
2. **FTO.02 ⚠️** Aksi `kedai`: `foto_minta_unggah`, `foto_catat`, `foto_lihat` dengan cek peran, kepemilikan, tipe Diantar, batas ukuran, dan penggantian oleh pengunggah.
3. **FTO.03** Kompres foto di HP dan tombol foto di layar penjaga (opsional, hanya Diantar).
4. **FTO.04** Tampilan foto di detail order untuk customer, owner, dan penjaga, termasuk "Foto sudah dihapus".
5. **FTO.05 ⚠️** Edge Function `bersihkan`, rahasia penjadwal, dan penjadwal mingguan, termasuk penyapuan foto yang diganti dan berkas tanpa baris (**pengecualian DELETE**, FT8). Dikerjakan **setelah foto bukti jalan**. Deploy dengan urutan aman, nama fungsi disebut saat memandu.
6. **FTO.06** Sesi tes foto (dokumen `foto-bukti-test.md` dibuat di sesi tes): ukuran akhir, hak lihat, pembersihan hanya foto lewat 14 hari, penggantian foto (hanya pengunggah asli), penyapuan berkas tanpa baris, bukti wajib.

---

## 6. Aturan yang paling sering terlanggar

| Aturan                                                                | Akibat bila dilanggar                                                      |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Mengunggah foto mentah dari kamera HP tanpa kompres                   | Kuota 1 GB dan egress 5 GB cepat habis.                                    |
| Bucket dibuat publik atau diberi policy untuk aplikasi                | Foto (lokasi rumah dan sekolah anak) bisa dibuka orang asing (SEC-20).     |
| Menghapus berkas foto lewat SQL ke tabel Storage                      | Berkas tertinggal di penyimpanan walau barisnya hilang.                    |
| `bersihkan` tidak memverifikasi rahasia penjadwal                     | Siapa pun bisa memicu penghapusan foto (SEC-21).                           |
| Pembersihan menghapus order atau catatan, bukan hanya berkas foto     | Riwayat order hilang; melanggar `AGENTS.md` bagian 7.                      |
| Rahasia penjadwal ditulis di repo, md, atau chat                      | Repo public: rahasia bocor; harus diganti.                                 |
| Customer bisa melihat foto order orang lain                           | Kebocoran data dan lokasi (SEC-05, SEC-20).                                |
| Foto ikut dikirim lewat isi push                                      | Data pribadi muncul di layar kunci dan lewat pihak ketiga (SEC-22).        |
| Menaruh foto uji berisi wajah, rumah, atau seragam nyata di bukti tes | Data pribadi terbuka di bukti yang ikut ke md atau chat; pakai foto dummy. |
| Foto lama tidak ditandai diganti saat foto baru diunggah              | Berkas lama menumpuk dan tetap bisa dibuka.                                |

---

## 7. Dampak dan pembatalan

- **Migration dan bucket foto:** tabel dan bucket baru, tidak menyentuh data order. Bisa dibatalkan dengan SQL pembatalan tertulis.
- **Foto terhapus terlalu cepat** (nilai `foto_simpan_hari` terlalu kecil): foto tidak bisa dipulihkan. Karena itu mengubah nilai ini butuh penjelasan dampak dan "OK" ketua. Order tetap utuh.
- **`bersihkan` salah:** bisa menghapus terlalu banyak berkas. Karena itu fungsinya diuji dulu dengan foto uji di `FTO.06` dan penjadwalnya dipasang **terakhir**.
- **Penjadwal dimatikan:** foto menumpuk; kuota bisa penuh. Pantau pemakaian file di dashboard saat rutin membuka project.
- **Kuota file penuh:** unggah foto gagal dengan pesan umum; order dan aksi lain tetap jalan.

---

## 8. Ditunda

- Beberapa foto per order dan foto bukti transfer dari customer (`bonus.md`).
- Foto otomatis dengan lokasi atau stempel waktu di gambar.
- Pengunduhan foto oleh owner untuk arsip.
- Lama simpan berbeda per jenis order.

---

## 9. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

_(belum ada blok)_

### 2026-11-11: Foto menu tetap berkas di `public/img`, tanpa bucket

Keputusan ketua (tercatat di sheet pada MNU.05: "foto sekarang di /public/img"; alasan lain belum tercatat). Yang paling akhir menang.

- **FT12 tidak berlaku.** Foto menu **tidak** memakai teknik kompres dan unggah foto bukti, dan **tidak ada bucket foto menu**.
- **Bagian 4 (baris "Bucket Storage privat")** dan **FT8 (kalimat soal foto menu)** dibaca ulang: hanya ada **satu bucket, yaitu foto bukti**. Pembersihan `bersihkan` hanya menyentuh bucket itu.
- **FTO.01 membuat satu bucket saja** (foto bukti). Jangan membuat bucket foto menu.
- **MNU.05 dibatalkan** di sheet. Rantai kerja: FTO.05 kini "Setelah FTO.04" (sebelumnya "Setelah MNU.05").
- Perbaikan urutan di sheet yang perlu dijaga: **FTO.06 tetap "Setelah FTO.05"** (tes pembersihan butuh `bersihkan` sudah jalan).

### 2026-11-11: Batas ukuran foto bukti 150 KB, target kompres sekitar 50 KB (FTO.01)

Keputusan ketua (sesi kode FTO.01, 11 Nov 2026). Alasan dari ketua: foto hanya untuk menunjukkan posisi barang ditaruh. Menimpa angka lama di FT4 dan perkiraan kuota; yang paling akhir menang.

- **FT4 dibaca ulang:** target kompres di HP **sekitar 50 KB** (sebelumnya 100 sampai 200 KB). Cara mencapainya (ukuran sisi dan kualitas) ditetapkan di FTO.03.
- **Batas server:** `foto_maks_kb` = **150** (sebelumnya 300). Server menolak foto di atas itu.
- **Batas bucket (pagar kedua):** **256 KB** (262144 byte), hanya `image/jpeg` dan `image/webp`. Angkanya tertulis di SQL, bukan di `pengaturan`; bila `foto_maks_kb` kelak dinaikkan di atas 256, batas bucket ikut diubah (butuh "OK" ketua).
- **Perkiraan kuota membaik:** sekitar 30 order x 50 KB, kira-kira 1,5 MB per hari (perkiraan di bagian 2 memakai 150 KB per foto, jadi sudah lebih longgar dari itu).
- **FTO.01 selesai 11 Nov 2026:** tabel `foto_bukti`, dua pengaturan, satu bucket privat `foto-bukti`. Terbukti lewat query cek (RLS, tanpa policy, hak tanpa DELETE, bucket tunggal dan privat). Bentuk persisnya ada di blok `docs/database.md` bagian 9 tanggal yang sama.
- **Untuk FTO.03:** target 50 KB. **Untuk FTO.06:** ukuran akhir diuji terhadap batas 150 KB dan targetnya.

### Handoff #1 | 2026-11-11 | Ketua

- **Tugas:** FTO.01 selesai (migration tabel `foto_bukti`, dua pengaturan foto, satu bucket privat `foto-bukti`, hak minimal, RLS). Dijalankan di project ChATA dan dibuktikan lewat 10 query cek; semua cocok harapan. Sudah di-commit dan di-push (`cf7751e`). Butir FTO.01 sudah dicentang di sheet.
- **File yang diubah:**
  - Baru: `supabase/migrations/20261111_foto_bukti.sql`, `supabase/migrations/20261111_foto_bukti_batal.sql`, `supabase/templates/20261111_foto_bukti_cek.sql`.
  - Blok catatan ditambah di `docs/foto-bukti.md` dan `docs/database.md` (bagian 9). Bagian lain tidak diubah.
- **Keputusan baru:** batas server `foto_maks_kb` 150 KB, batas bucket 256 KB, target kompres sekitar 50 KB. Alasan dari ketua: foto hanya untuk menunjukkan posisi barang ditaruh. Rinciannya ada di blok `foto-bukti.md` dan `database.md` bertanggal sama; di sana yang paling akhir menang atas FT4 (100 sampai 200 KB) dan nilai 300 di `database.md` bagian 4.
- **Belum beres:**
  - Pembatalan bucket belum pernah dicoba. `_batal.sql` hanya membuang tabel dan pengaturan; bucket dihapus lewat dashboard (kosongkan dulu). Supabase mungkin memblokir penghapusan bucket lewat SQL, dan itu belum dipastikan.
  - Bucket belum pernah menerima berkas; unggah sungguhan baru bisa dites setelah FTO.02 dan FTO.03.
  - Baris SEC (SEC-03, SEC-04, SEC-17, SEC-20) **jangan dicentang dari pekerjaan ini**. Mereka menunggu sesi tes keamanan; bukti sesi ini tidak disimpan.
  - Alasan beberapa pilihan penulis belum tercatat: nama bucket, `diunggah_oleh` merujuk `staf`, nama dan jenis indeks.
  - Format `lokasi_berkas` belum ditetapkan; tabel hanya menolak kosong, kontrol karakter, dan awalan `/`. Ditetapkan di FTO.02.
- **Saran giliran berikutnya (FTO.02, butuh penjelasan dampak dan "OK" ketua):**
  - Lampirkan `AGENTS.md`, `foto-bukti.md`, `database.md`, `security.md`, `supabase/functions/kedai/index.ts`, dan berkas kelompok `kedai` yang relevan (misalnya `order_status.ts`).
  - Aksi baru `foto_minta_unggah`, `foto_catat`, `foto_lihat` ditaruh di berkas baru di `supabase/functions/kedai/` (blok `AGENTS.md` 9 Nov 2026), bukan di `index.ts`.
  - Pencatatan foto = fungsi SQL atomik: foto lama ditandai `diganti = true` **dulu**, baru baris baru ditambah (ada pagar satu foto aktif per order). Hanya pengunggah asli yang boleh mengganti.
  - Hanya order tipe Diantar yang boleh diberi foto, dan hanya saat status Diantar atau Selesai; batas ukuran dibaca dari `pengaturan`, bukan ditulis mati.
  - Rantai sheet: FTO.03 setelah FTO.02, FTO.04 setelah FTO.03, FTO.05 setelah FTO.04, FTO.06 setelah FTO.05.
- **Rahasia:** sesi ini tidak memakai token CLI; dashboard sudah logout.

### 2026-11-11: Aksi foto (FTO.02): nama berkas, tautan lihat 300 detik, ukuran dibaca server

Keputusan ketua (sesi kode FTO.02, 11 Nov 2026). Menjabarkan FT2 dan FT5; tidak bertentangan dengan blok lama. Alasan dari ketua di luar yang disebut: alasan belum tercatat.

- **Nama berkas dibuat server:** `<id order>/<uuid acak>.jpg` atau `.webp` (huruf kecil). Aplikasi hanya menyebut jenis (`jpg` atau `webp`), tidak pernah menentukan nama berkas.
- **Tautan lihat hidup 300 detik**, disimpan di `pengaturan` sebagai `foto_tautan_detik` (bukan ditulis mati di kode, AGENTS.md bagian 1). Tiap foto dibuka, aplikasi minta tautan baru. Lama berlaku alamat unggah mengikuti bawaan Supabase dan tidak diatur kita (angka persisnya belum diverifikasi).
- **Ukuran dibaca server dari Storage**, bukan dari kiriman aplikasi, lalu dibandingkan dengan `foto_maks_kb` (150) di fungsi SQL.
- **Hanya pengunggah asli yang boleh mengganti** (FT2). Akibat yang diterima ketua: bila pengunggah asli dinonaktifkan, tidak ada yang bisa mengganti fotonya.
- **Hak lihat:** customer pemilik order, owner, penjaga. Penjaga tidak melihat foto order Menunggu, Ditolak, atau Dibatalkan (O11, SEC-08).
- **Berkas yang terunggah tetapi ditolak** (misalnya terlalu besar) **tidak dihapus** oleh `kedai` (tanpa DELETE). Ia menjadi berkas tanpa baris dan disapu `bersihkan` di FTO.05 (FT7).
- **FTO.02 selesai 11 Nov 2026:** tiga fungsi SQL dan tiga aksi `kedai` sudah di production. Bentuk persis fungsi ada di blok `docs/database.md` bagian 9 bertanggal sama.

### Handoff #2 | 2026-11-11 | Ketua

- **Tugas:** FTO.02 selesai: migration tiga fungsi SQL foto + pengaturan `foto_tautan_detik`, aksi `kedai` `foto_minta_unggah`, `foto_catat`, `foto_lihat`. Migration dijalankan dan lulus 5 query cek (fungsi aman, `EXECUTE` hanya `service_role`, pengaturan masuk, hak tabel `foto_bukti` tanpa DELETE, 0 baris foto). `kedai` dideploy (urutan aman, token sudah dibersihkan, dashboard sudah logout). Uji ringan masuk di tiga peran: tampilan normal. Sudah di-commit dan di-push (`75ddeac`). Butir FTO.02 sudah dicentang di sheet.
- **File yang diubah:**
  - Baru: `supabase/functions/kedai/foto.ts`, `supabase/migrations/20261111_02_foto_fungsi.sql`, `supabase/migrations/20261111_02_foto_fungsi_batal.sql`, `supabase/templates/20261111_02_foto_fungsi_cek.sql`.
  - Diubah (hanya penambahan): `supabase/functions/kedai/index.ts` (satu import, satu blok sambungan, tiga `case`).
  - Blok catatan ditambah di `docs/foto-bukti.md` dan `docs/database.md` (bagian 9).
- **Keputusan baru:** lihat blok catatan 2026-11-11 di atas (nama berkas buatan server, tautan 300 detik, ukuran dari Storage).
- **Kontrak aksi untuk layar (FTO.03 dan FTO.04).** Semua lewat `kedai`, id akun dari token; aplikasi hanya mengirim yang tertulis:
  - `foto_minta_unggah`: kirim `id` (order) dan `jenis` (`jpg` atau `webp`). Penjaga dan owner saja. Balasan: `{ ok, lokasi, token, url_unggah, mengganti, maks_kb }`.
  - `foto_catat`: kirim `id` dan `lokasi` (persis yang diberikan `foto_minta_unggah`). Penjaga dan owner saja. Balasan: `{ ok, order: { id, nomor, mengganti } }`. Galat 409 "Foto belum terunggah" bila berkasnya belum sampai ke Storage.
  - `foto_lihat`: kirim `id`. Semua peran yang berhak. Balasan `{ ok, status: "ada", url, berlaku_detik, diunggah_pada }`, atau `{ ok, status: "dibersihkan" }` (tampilkan "Foto sudah dihapus"), atau `{ ok, status: "tidak_ada" }`.
  - Alur unggah: `foto_minta_unggah`, unggah berkas ke `url_unggah` memakai `token`, lalu `foto_catat`. Tampilan foto minta tautan baru tiap dibuka (hidup 300 detik).
  - Tombol foto hanya untuk order **Diantar**, status **Diantar atau Selesai**. Server menolak selain itu.
- **Belum beres:**
  - **Aksi foto belum pernah dipanggil sungguhan.** Pembuatan alamat unggah ke bucket `foto-bukti` dan pencatatan foto pertama baru terbukti di FTO.03. Cara persis mengunggah dari HP (memakai pustaka Supabase salinan di `public/lib/` atau permintaan langsung ke `url_unggah`) belum dicoba; pilih dan uji di FTO.03. Kode `foto.ts` belum pernah dikompilasi sebelum deploy (deploy sukses, tetapi jalannya baru terbukti saat dipanggil).
  - Asumsi: kolom `id` di `foto_bukti` punya nilai bawaan. Bila ternyata tidak, `foto_catat` gagal dengan galat umum 500 saat pemanggilan pertama.
  - Kolom `keterangan` untuk pengaturan `foto_tautan_detik` masih kosong (tidak mengganggu; `UPDATE` pengaturan butuh "OK").
  - Baris SEC (SEC-07, SEC-08, SEC-20, SEC-29) **jangan dicentang dari pekerjaan ini**; menunggu sesi tes keamanan, bukti sesi ini tidak disimpan.
  - Layar penjaga (`orderpenjaga.js`) belum dicek untuk pola "layar loncat ke atas" (catatan `AGENTS.md` 9 Nov 2026). FTO.03 menyentuh layar itu: jaga posisi gulung bila detail digambar ulang.
- **Saran giliran berikutnya (FTO.03):**
  - Lampirkan `AGENTS.md`, `foto-bukti.md`, `database.md`, `security.md` bila perlu, serta berkas layar penjaga (`orderpenjaga.js`), `style.css`, dan `sw.js`; minta AI menyebut berkas lain yang dibutuhkan di awal sesi.
  - Target kompres sekitar 50 KB, batas server 150 KB, batas bucket 256 KB (blok 11 Nov 2026 di atas).
  - Berkas JS baru wajib didaftarkan di cache `sw.js`; mengubah `sw.js` butuh "OK" ketua. Bila giliran dipegang bukan ketua, AI memberi ringkasan yang bisa diteruskan lewat WA (AGENTS.md aturan 12).
  - Butir baru yang perlu ditambah ke sheet: **"Uji aksi foto dari layar"** (setelah FTO.03) dan **"Isi keterangan pengaturan foto_tautan_detik"** (rapi-rapi, tidak mendesak).
  - Rantai sheet tetap: FTO.04 setelah FTO.03, FTO.05 setelah FTO.04, FTO.06 setelah FTO.05.
- **Rahasia:** sesi ini memakai token CLI hanya di satu jendela Terminal, sudah ditutup dan dicek kosong; dashboard Supabase dan GitHub sudah logout.

### Handoff #3 | 2026-11-11 | FREN

- **Tugas:** FTO.03 selesai (kompres foto di HP dan tombol foto di layar penjaga). Sudah di-commit dan di-push (`33f9248` dan `684f6c9`). Butir FTO.03 sudah dicentang di sheet. Foto pertama terkirim dari HP penjaga dengan akun dan order dummy: alur foto_minta_unggah, unggah ke Storage, foto_catat jalan sampai "Foto bukti terkirim".
- **File yang diubah:**
  - Baru: `public/foto.js`.
  - Diubah (hanya penambahan): `public/orderpenjaga.js` (satu panggilan `KedaiFoto.pasang` di detail order dan satu `KedaiFoto.reset` di reset), `public/index.html` (satu `<script src="foto.js">` sebelum `orderpenjaga.js`), `public/sw.js` (naik ke `chata-v21`, `foto.js` masuk daftar cache; OK ketua sudah ada).
  - `style.css` tidak diubah (kartu foto memakai kelas yang sudah ada).
- **Keputusan baru (PIC FREN):**
  - Kompres: mulai sisi terpanjang 640 px, kualitas JPEG 0,5, lalu turun bertahap (kualitas 0,5 / 0,4 / 0,3, ukuran sisi 640 sampai 320) sampai sekitar 50 KB. Alasan: kualitas kasar boleh; bila customer bilang foto tidak jelas, minta foto ulang lewat WA. Angkanya ada di blok `KOMPRES` di atas `foto.js`. Batas keras tetap dari server (`maks_kb`, 150).
  - Tombol foto hanya di detail order (bukan di kartu daftar), hanya tipe Diantar, status Diantar atau Selesai. Terbukti: tidak muncul di tipe Diambil dan Makan di warung, dan tidak muncul di status sebelum Diantar.
  - Input foto memakai `capture="environment"`: langsung membuka kamera belakang, tanpa pilihan galeri. Terbukti di satu HP; di HP lain atribut ini bisa diabaikan.
  - Unggah ke Storage: permintaan PUT langsung ke `url_unggah` dengan FormData (`cacheControl` dan berkas), header `apikey` (kunci publishable), tanpa `Authorization`. Kunci hanya dikirim ke alamat Supabase milik config.js. Terbukti jalan.
  - Tombol selalu bertulisan "Ambil foto bukti"; layar tidak memanggil server saat detail dibuka (tampilan foto ada di FTO.04).
- **Terbukti:** foto terkirim (Storage dan `foto_catat`); asumsi kolom `id` di `foto_bukti` punya nilai bawaan gugur (tidak ada galat 500).
- **Belum beres:**
  - Ukuran akhir foto terhadap target 50 KB dan batas 150 KB belum dicek (diuji di FTO.06).
  - Pesan "Foto bukti diganti." belum dicoba, dan penggantian oleh penjaga lain yang bukan pengunggah asli belum dicoba (SEC-29).
  - Baris SEC (SEC-07, SEC-08, SEC-20, SEC-29) jangan dicentang dari pekerjaan ini; menunggu sesi tes keamanan, bukti sesi ini tidak disimpan.
  - Foto dummy hasil tes masih ada di bucket `foto-bukti`; ikut dibersihkan `bersihkan` (FTO.05) atau pembersihan data uji sebelum peluncuran.
  - Teks butir FTO.03 di sheet masih menyebut 100 sampai 200 KB; ikuti 50 KB (blok 11 Nov 2026 di atas).
  - Layar owner belum punya tombol foto (sheet hanya menyebut layar penjaga). Perlu diputuskan ketua bila diinginkan.
- **Saran giliran berikutnya (FTO.04):**
  - Lampirkan `AGENTS.md`, `foto-bukti.md`, `pesanan.js` (customer), `orderowner.js`, `orderpenjaga.js`, `foto.js`, `style.css`, `index.html`, dan `sw.js` bila ada berkas JS baru. AI menyebut berkas lain yang kurang di awal sesi.
  - Aksi `foto_lihat` (kontrak di Handoff #2): kirim `id`, balasan `status` ada (dengan `url`), dibersihkan ("Foto sudah dihapus"), atau tidak_ada. Tautan hidup 300 detik, jadi minta tautan baru tiap foto dibuka.
  - Customer pemilik order, owner, dan penjaga boleh melihat; penjaga tidak melihat order Menunggu, Ditolak, atau Dibatalkan. Gambar lewat `img` dengan `src` dari server, teks lewat `textContent`.
  - Rantai sheet tetap: FTO.05 setelah FTO.04, FTO.06 setelah FTO.05.
- **Rahasia:** sesi ini tidak memakai token CLI dan tidak ada deploy fungsi. Hanya commit dan push dengan kunci SSH khusus proyek (pengecekan folder, alamat tujuan, dan email commit cocok sebelum tiap push).

### Handoff #4 | 2026-11-11 | (RAC)

- **Tugas:** FTO.04 selesai (tampilan foto bukti di detail order untuk penjaga, customer, dan owner). Tes lulus di HP dan laptop untuk ketiga layar; sudah di-commit dan di-push (`3ea25fa` untuk `pesanan.js` dan `orderowner.js`; `foto.js` dan `style.css` di commit sebelumnya). Butir FTO.04 sudah dicentang di sheet.
- **File yang diubah (hanya penambahan):** `public/foto.js`, `public/style.css`, `public/pesanan.js`, `public/orderowner.js`. `index.html`, `sw.js`, dan server tidak diubah.
- **Keputusan baru (ketua, lewat WA):**
  - Foto tampil sebagai thumbnail kecil (tinggi tetap 120 px) saat detail dibuka; diketuk, gambar yang sama membesar lewat CSS (tanpa panggilan server). Alasan: sederhana dan hemat request free tier.
  - Tombol unggah foto di layar owner **dipindah ke versi 2** (`bonus.md`). Ini menggeser FT2 untuk layar saja: server (`foto_minta_unggah`, `foto_catat`) tetap mengizinkan owner dan tidak diubah. Alasan lain belum tercatat.
- **Cara kerja (untuk sesi berikutnya):**
  - `foto_lihat` dipanggil sekali per order, hasilnya disimpan di memori layar, tidak di `localStorage`. Detail digambar ulang tidak memanggil server lagi.
  - Bila gambar gagal tampil (tautan 300 detik habis), dicoba sekali dengan tautan baru lalu berhenti. Hasil "belum ada foto" hanya diingat 30 detik. Hasil "dibersihkan" tidak dimuat ulang.
  - Customer dan owner memakai `KedaiFoto.lihat(wadah, order)` (hanya melihat); penjaga memakai `KedaiFoto.pasang` (thumbnail di dalam kartu unggah). `KedaiFoto.reset()` dipanggil saat Keluar di ketiga layar.
- **Belum beres:**
  - "Foto sudah dihapus" dan perilaku tautan habis belum bisa dites; menunggu `bersihkan` (FTO.05, FTO.06).
  - Ukuran akhir foto terhadap target 50 KB dan batas 150 KB masih diuji di FTO.06.
  - Penggantian foto oleh penjaga lain (SEC-29) belum dicoba.
  - Baris SEC (SEC-07, SEC-08, SEC-20, SEC-29) **jangan dicentang dari pekerjaan ini**; menunggu sesi tes keamanan, bukti tidak disimpan.
  - Foto dummy hasil tes masih ada di bucket `foto-bukti`; dibersihkan `bersihkan` atau pembersihan data uji sebelum peluncuran.
- **Saran giliran berikutnya (FTO.05, butuh penjelasan dampak dan "OK" ketua):**
  - Lampirkan `AGENTS.md`, `foto-bukti.md`, `database.md`, `security.md`, `supabase/functions/kedai/index.ts`, dan berkas migration foto terbaru.
  - Edge Function `bersihkan` dan penjadwal mingguan adalah pengecualian DELETE (FT8). Deploy dengan `--no-verify-jwt` hanya untuk `bersihkan`, urutan aman di `AGENTS.md` bagian 8.
  - Butir baru yang perlu ditambah ke sheet: **"Tombol unggah foto di layar owner (versi 2)"**.
  - Rantai sheet tetap: FTO.05 setelah FTO.04, FTO.06 setelah FTO.05.
- **Rahasia:** sesi ini tidak memakai token CLI dan tidak ada deploy fungsi. Push memakai kunci SSH khusus proyek; folder, alamat tujuan, dan email commit dicek cocok sebelum push.

### Handoff #5 | 2026-11-11 | Ketua

- **Tugas:** FTO.05 **sebagian**. Selesai dan terbukti: tiga fungsi SQL pembantu, Edge Function `bersihkan` terpasang dan teruji, rahasia penjadwal terpasang di dashboard, ekstensi `pg_cron`, `pg_net`, dan `supabase_vault` sudah terpasang. **Belum:** rahasia di Vault, penjadwal mingguan, dan uji lewat jalur penjadwal. Butir FTO.05 **belum boleh dicentang** di sheet. Status commit dan push berkas baru belum dikonfirmasi di sesi ini (ketua baru menyalin berkas ke folder repo).
- **File yang diubah (semua baru, tidak ada kode lama yang diubah):**
  - `supabase/migrations/20261111_03_foto_bersih_fungsi.sql` dan `20261111_03_foto_bersih_fungsi_batal.sql`
  - `supabase/templates/20261111_03_foto_bersih_fungsi_cek.sql`
  - `supabase/functions/bersihkan/index.ts`
  - Tidak disentuh: `kedai/index.ts`, `foto.ts`, `sw.js`, dan `public/`.
- **Keputusan baru (ketua, 11 Nov 2026):**
  - `bersihkan` memakai variabel `KUNCI_SECRET_KEDAI` yang sama dengan `kedai`.
  - **Mode simulasi:** isi permintaan `{"simulasi": true}` hanya melaporkan angka, tanpa menghapus atau menandai. Penjadwal tidak pernah mengirimnya.
  - Rahasia penjadwal dikirim lewat header `x-rahasia-penjadwal`, variabelnya `RAHASIA_PENJADWAL` (minimal 32 karakter; kurang dari itu atau kosong, semua permintaan ditolak 401). Dibuat dengan `openssl rand -hex 32`, disimpan di pwd manager dan dashboard saja.
  - `bersihkan` dideploy dengan `--no-verify-jwt`, sesuai `AGENTS.md` bagian 7 dan 8.
  - Penyapuan berkas tanpa baris dibatasi 90 detik; sisanya disapu putaran mingguan berikutnya.
  - **Pilihan penulis, alasan belum tercatat:** `foto_simpan_hari` harus 1 sampai 3650; satu panggilan SQL maksimal 1000 elemen; `foto_bersih_tandai` hanya menandai baris yang memang layak (pagar kedua); balasan `bersihkan` hanya angka; ada penyapuan umur berkas dari `created_at` Storage.
  - **Usulan belum disetujui:** jadwal mingguan **Minggu 02.00 WIB** (Sabtu 19.00 UTC) dan rahasia disimpan di Vault.
- **Terbukti (bukti diperiksa di chat, tidak disimpan):**
  - Migration lulus, enam query cek cocok (hak `EXECUTE` hanya `service_role`, tanpa DELETE).
  - `bersihkan` tanpa rahasia, dengan rahasia salah, dan hanya dengan kunci publishable (`apikey` dan `Authorization`): semuanya 401 dari fungsi sendiri.
  - Simulasi: `foto_diproses` 1, tidak ada yang berubah. Uji nyata: 1 berkas yang ditandai `diganti` terhapus dari Storage, barisnya terisi `dibersihkan_pada`, foto aktif utuh dan masih tampil di aplikasi. Diulang: semua angka 0 (aman diulang).
- **Belum beres:**
  - Penjadwal belum dipasang; langkah berikutnya lihat bawah.
  - **Penyapuan berkas tanpa baris belum terbukti menemukan berkas yatim.** Hasil 0 belum bisa dibedakan dari "tidak ada yang ditemukan"; diuji di FTO.06 dengan berkas uji yang cukup tua.
  - Jalur galat Storage dan `sapuan_terpotong` belum pernah dipicu.
  - **Pembatalan** migration belum pernah dicoba. Bila `bersihkan` dan penjadwal sudah terpasang, matikan penjadwal dulu sebelum membuang fungsi.
  - Tampilan "Foto sudah dihapus" untuk foto aktif yang sudah dibersihkan belum bisa dites (foto aktif baru 14 hari lagi).
  - Baris SEC (SEC-20, SEC-21, SEC-29) **jangan dicentang dari pekerjaan ini**. SEC-21 baru bukti kasus ditolak; SEC-29 (penggantian oleh penjaga lain) belum dicoba. Bukti sesi ini tidak disimpan.
  - Fungsi `foto_bersih_*` belum dicatat di `docs/database.md` bagian 9 (butuh blok susulan bila ketua setuju).
  - Editor menandai `index.ts` merah; sama seperti `kedai/index.ts` (editor tidak mengenal Deno), tidak mengganggu.
- **Saran giliran berikutnya (butuh penjelasan dampak dan "OK" ketua):**
  - Lampirkan `AGENTS.md`, `foto-bukti.md`, `database.md`, `security.md`, dan `supabase/functions/bersihkan/index.ts`.
  - Tulis: template Vault (tempat kosong, tanpa nilai), migration jadwal mingguan (`pg_cron` memanggil `bersihkan` lewat `pg_net`, rahasia dari Vault, batas tunggu lebih panjang dari bawaan 5 detik, jam dalam UTC), berkas pembatal, dan query cek.
  - Setelah menempel rahasia di SQL Editor, **hapus snippet-nya** (SQL Editor menyimpan query, nilai rahasia ikut tersimpan).
  - Uji sekali secara manual dengan perintah yang sama dengan jadwal, lalu baca balasannya di `net._http_response`. Baru sesudah itu butir FTO.05 boleh dicentang.
  - Lanjut FTO.06 (sesi tes). Rantai sheet tetap: FTO.06 setelah FTO.05.
- **Rahasia:** token CLI dipakai hanya di satu jendela Terminal, sudah ditutup dan dicek kosong. `RAHASIA_PENJADWAL` tidak pernah masuk chat, repo, atau md, dan sudah di-`unset` dari Terminal. Dashboard Supabase **belum logout**; logout dan tutup sebelum selesai.

### Handoff #6 | 2026-11-11 | Ketua

- **Tugas:** FTO.05 selesai (lanjutan Handoff #5): rahasia penjadwal dan alamat project disimpan di Vault, jadwal mingguan `pg_cron` dipasang, lalu diuji manual dengan perintah yang sama dengan jadwal. Butir FTO.05 siap dicentang di sheet (pengingat dari AI). Commit dan push belum dilakukan saat handoff ini ditulis; semua berkas Handoff #5 dan #6 akan masuk satu commit.
- **File yang diubah:** semua baru, tidak ada kode lama yang diubah.
  - Dari Handoff #5 (belum di-commit): `supabase/migrations/20261111_03_foto_bersih_fungsi.sql` dan `_batal.sql`, `supabase/templates/20261111_03_foto_bersih_fungsi_cek.sql`, `supabase/functions/bersihkan/index.ts`.
  - Sesi ini: `supabase/templates/20261111_04_vault_rahasia.sql`, `supabase/migrations/20261111_04_foto_jadwal.sql` dan `_batal.sql`, `supabase/templates/20261111_04_foto_jadwal_cek.sql` dan `_uji.sql`.
  - Blok catatan ditambah di `docs/database.md` (bagian 9) dan handoff ini di `docs/foto-bukti.md`. Bagian lain tidak diubah.
- **Keputusan baru (ketua, 11 Nov 2026):** jadwal tiap Minggu 02.00 WIB (Sabtu 19.00 UTC) dan rahasia penjadwal disimpan di Vault. Alasan ketua belum tercatat. Alamat project ikut di Vault (pilihan penulis, supaya migration tanpa isian). Rincian di blok `docs/database.md` bertanggal sama; di sana yang paling akhir menang atas FT9.
- **Terbukti (bukti diperiksa di chat, tidak disimpan):**
  - Empat query cek lulus: ekstensi `pg_cron`, `pg_net`, `supabase_vault` ada; dua isian Vault ada dan memenuhi syarat; jadwal `0 19 * * 6` aktif, memakai Vault, tanpa nilai tertulis di perintahnya.
  - Uji manual: 200, `"ok":true`, `"simulasi":false`, semua angka 0. Jalur database ke `bersihkan` dengan rahasia dari Vault bekerja.
- **Belum beres:**
  - **Jadwal belum pernah jalan sendiri.** Jalan otomatis pertama Sabtu 14 Nov 2026 pukul 19.00 UTC (Minggu 15 Nov 02.00 WIB). Hasilnya dibaca di `cron.job_run_details` dan `net._http_response`.
  - Penyapuan berkas tanpa baris belum terbukti menemukan berkas yatim (hasil 0 belum bisa dibedakan dari "tidak ada yang ditemukan"); jalur galat Storage dan `sapuan_terpotong` belum pernah dipicu.
  - Kedua pembatalan (migration 03 dan 04) belum pernah dicoba. Bila perlu membongkar, matikan jadwal dulu sebelum membuang fungsi.
  - Template untuk mengganti isian Vault (rotasi rahasia) belum ada.
  - Foto dummy hasil tes masih ada di bucket `foto-bukti`; foto aktifnya belum 14 hari, jadi tampilan "Foto sudah dihapus" dan "pembersihan hanya foto lewat 14 hari" belum bisa dites secara alami. Cara menguji di FTO.06 perlu diputuskan; mengubah `foto_simpan_hari` sementara butuh penjelasan dampak dan "OK" ketua.
  - Baris SEC (SEC-20, SEC-21, SEC-29) **jangan dicentang dari pekerjaan ini**. SEC-21 baru bukti kasus ditolak, SEC-29 (penggantian oleh penjaga lain) belum dicoba, bukti sesi ini tidak disimpan.
- **Saran giliran berikutnya (FTO.06, sesi tes):**
  - Lampirkan `AGENTS.md`, `foto-bukti.md`, `order.md`, `security.md`, dan `docs/pemetaan-test.md`. AI membuat `foto-bukti-test.md` di sesi tes, memakai foto dummy tanpa wajah, rumah, atau seragam nyata, dan di awal sesi menyebut apa yang sudah terbukti dan sisa tes.
  - Butir baru yang perlu ditambah ke sheet: **"Cek jadwal foto jalan pertama"** (setelah 15 Nov 2026).
  - Rantai sheet tetap: FTO.06 setelah FTO.05, SEC-20 setelah FTO.06.
- **Rahasia:** sesi ini tidak memakai token CLI dan tidak ada deploy fungsi. `RAHASIA_PENJADWAL` hanya ditempel di SQL Editor (Vault), snippet-nya sudah dihapus, tidak pernah masuk chat, repo, atau md. Dashboard Supabase sudah logout.

### Handoff #7 | 2026-11-11 | (AIK)

- **Tugas:** FTO.06 (sesi tes foto) **sebagian**. Tes dijalankan lewat layar, konsol, `curl`, dan dashboard Storage, memakai akun dummy (1 penjaga, 1 owner, 3 customer). Butir FTO.06 **belum boleh dicentang** (tes pembersihan belum bisa jalan). Tidak ada kode, SQL, migration, `kedai`, `bersihkan`, atau `sw.js` yang diubah, jadi tidak ada commit.
- **Baris SEC yang sudah lengkap, silakan dicentang di sheet:** SEC-20 dan SEC-21. **SEC-29 belum** (bagian 3 menunggu pembersihan).
- **Terbukti** (bukti diperiksa di chat, tidak disimpan):
  - **Ukuran akhir:** tiga foto dummy 22,16 KB, 17,07 KB, dan 29,86 KB, semuanya jpeg, di bawah target 50 KB dan batas 150 KB.
  - **Penggantian oleh pengunggah asli (#61):** pesan "Foto bukti diganti.", thumbnail berubah, folder Storage berisi dua berkas.
  - **SEC-29 (dua dari tiga bagian):** owner mencoba mengganti foto #61 lewat `foto_minta_unggah` dan dibalas 403 "Foto ini hanya bisa diganti oleh yang mengunggahnya." `foto_lihat` hanya mengembalikan foto aktif (jam foto baru, bukan foto lama).
  - **SEC-20:** customer bukan pemilik memanggil `foto_lihat` dan dibalas 404 tanpa `url`; alamat `/object/public/` langsung dibalas 404 NoSuchBucket; tautan 300 detik dibuka 200 lalu 8 menit kemudian 400 InvalidJWT (`exp` lewat).
  - **SEC-21:** `bersihkan` tanpa rahasia (lewat `curl`) = 401; isi bucket tidak berubah (#61 tetap 2, #62 tetap 1). Rahasia salah dan hanya kunci publishable sudah terbukti 401 di Handoff #5.
  - **Penjaga dan order Dibatalkan:** `foto_lihat` untuk #44 (Dibatalkan, tipe Diambil) = 404 tanpa `url`.
  - **Server menolak berkas salah:** teks biasa ditolak bucket (415 `invalid_mime_type`); 300 KB ditolak bucket (413 `EntityTooLarge`); 200 KB lolos bucket tetapi `foto_catat` membalas 400 "Foto terlalu besar. Ambil foto lagi." Foto aktif #62 tidak berubah sesudahnya.
- **Keputusan baru:** tidak ada. Ketua belum memutuskan soal tes pembersihan; arah sementara: **digabung dengan FTO.07** (setelah jadwal jalan sendiri Minggu 15 Nov 2026). Alasan belum tercatat.
- **Belum beres (kasus yang belum dites):**
  1. **Pembersihan hanya foto lewat 14 hari** (foto aktif yang lewat batas terhapus, yang belum tetap utuh, order dan catatan tetap). Belum bisa dites alami: foto dummy baru berumur sehari.
  2. **Tampilan "Foto sudah dihapus"** di layar customer, owner, dan penjaga (balasan `foto_lihat` `status: "dibersihkan"`). Menunggu nomor 1.
  3. **Penyapuan berkas tanpa baris.** Bahan: satu berkas 200 KB di folder #62 (ditolak `foto_catat`, jadi tanpa baris). Baru bisa disapu bila umurnya sudah lewat `foto_simpan_hari`. Hasil 0 di Handoff #5 belum bisa dibedakan dari "tidak ada yang ditemukan"; jalur galat Storage dan `sapuan_terpotong` belum pernah dipicu.
  4. **SEC-29 bagian 3:** berkas lama #61 (22,16 KB, sudah ditandai diganti) hilang saat pembersihan. Bisa dites lebih cepat tanpa mengubah `foto_simpan_hari`: uji manual non-simulasi lewat `supabase/templates/20261111_04_foto_jadwal_uji.sql`. Dampak: satu berkas dummy lama terhapus permanen, foto aktif dan order utuh. Butuh penjelasan dampak dan "OK" ketua, dan dashboard ketua dibuka lalu di-logout.
  5. **SEC-29 dengan penjaga kedua** belum dicoba (hanya owner sebagai "bukan pengunggah asli"). Penjaga kedua butuh baris baru di `staf` (OK ketua). Bukti owner sah untuk aturan server; ini hanya penguat.
  6. **Jadwal otomatis pertama** (Minggu 15 Nov 2026 02.00 WIB) = FTO.07: baca `cron.job_run_details` dan `net._http_response`.
  7. **Penjaga tidak melihat order Menunggu atau Ditolak:** hanya Dibatalkan yang dites (#44). Ketiganya satu aturan server (O11), tetapi Menunggu dan Ditolak belum dites satu per satu.
  8. **Ukuran akhir** baru dari foto sederhana (benda di meja). Foto yang terang dan penuh detail belum dicoba.
  9. **SEC-20:** yang dites jalur `/object/public/`. Jalur lain tanpa tanda tangan tidak dites; kuat dugaan ditolak karena bucket privat tanpa policy (bukti FTO.01), tetapi itu belum bukti baru.
  10. **Penolakan peran di `foto_catat`** tidak dites terpisah (tidak ada lokasi sah tanpa lolos `foto_minta_unggah`).
  11. **Kedua pembatalan migration** (03 dan 04) belum pernah dicoba (tidak berubah dari Handoff #5 dan #6).
  12. Bila pembersihan dites dengan menurunkan `foto_simpan_hari` sementara: butuh penjelasan dampak dan "OK" ketua, foto lewat batas terhapus permanen, kembalikan ke 14 sesudahnya.
- **Data dummy** (dibersihkan di LNC.01 atau oleh `bersihkan`): order #61 (Diantar, 2 berkas di Storage: yang lama sudah ditandai diganti, yang aktif 17,07 KB) dan #62 (Diantar, 2 berkas: foto aktif 29,86 KB dan satu berkas yatim 200 KB). Foto dummy lama #61 berisi kacamata dan struk (tanpa data pribadi yang terbaca). Order #44 Dibatalkan (Diambil) dipakai untuk tes penjaga.
- **Saran giliran berikutnya (setelah 15 Nov, sesi tes FTO.07):**
  - Lampirkan `AGENTS.md`, `foto-bukti.md`, `order.md`, `security.md`, `docs/pemetaan-test.md`.
  - Baca hasil jadwal pertama. Lalu pilih: (a) uji manual berkas diganti #61 (kasus 4, OK ketua), (b) tes pembersihan 14 hari, "Foto sudah dihapus", dan penyapuan yatim, bila berkas sudah cukup tua atau dengan `foto_simpan_hari` sementara (kasus 1 sampai 3, 12).
  - Setelah kasus 1 sampai 4 terbukti, baru FTO.06 dan SEC-29 boleh dicentang.
  - Butir baru untuk sheet: **"Tes pembersihan foto bersama FTO.07"**.
- **Rahasia:** sesi ini tidak memakai token CLI dan tidak ada deploy. Dua token unggah bertanda tangan (lokasi dummy di #62) sempat tampil di chat; keduanya untuk satu lokasi dummy, tidak pernah dipakai, dan kedaluwarsa sekitar 2 jam setelah dibuat, jadi tidak perlu tindakan. Lain kali salin hanya baris hasil. Logout dashboard Supabase belum dikonfirmasi; logout dan tutup profil browser ketua.

### Handoff #8 | 2026-11-11 | Ketua

- **Tugas:** FTO.06 (sesi tes foto) selesai, lanjutan Handoff #7. Butir FTO.06 sudah dicentang di sheet. SEC-29 juga sudah dicentang (SEC-20 dan SEC-21 dicentang lebih awal). **FTO.07 tetap Belum.** Tidak ada kode, SQL, migration, `kedai`, `bersihkan`, atau `sw.js` yang diubah, jadi tidak ada commit.
- **File yang diubah:** tidak ada.
- **Keputusan baru (ketua, 11 Nov 2026):** jadwal cron **tidak memblokir** FTO.06 dan SEC-29. Yang dites adalah isi pembersihan, bukan jadwalnya, jadi tes dijalankan lewat uji manual `supabase/templates/20261111_04_foto_jadwal_uji.sql` (perintah yang sama dengan jadwal). FTO.07 dipisah dan dicek setelah jadwal jalan sendiri. Alasan ketua: aplikasi sudah ditunggu owner untuk dipakai. Ini menggantikan arah sementara di Handoff #7 ("tes pembersihan digabung dengan FTO.07").
- **Terbukti (bukti diperiksa di chat, tidak disimpan):**
  - FT-17 (SEC-29): berkas lama yang ditandai diganti hilang dari Storage saat pembersihan, barisnya terisi `dibersihkan_pada`, foto aktif utuh.
  - FT-18: foto aktif yang lewat 14 hari terhapus; foto aktif yang baru tetap utuh; order dan catatan tidak berubah.
  - FT-20: berkas tanpa baris yang lebih tua dari batas terhapus.
  - FT-19: "Foto sudah dihapus" tampil di layar lihat-saja (satu capture mewakili customer dan owner, memakai fungsi yang sama) dan di layar penjaga; balasan server `status: "dibersihkan"`.
  - FT-11: penjaga dibalas 404 tanpa `url` untuk order Menunggu dan Ditolak; order yang boleh dilihat dibalas 200 dengan token yang sama.
  - FT-02: foto ramai di order Diantar berukuran 26,39 KB, jpeg, di bawah target 50 KB dan batas 150 KB.
- **Data uji yang diubah manual lewat SQL Editor (hanya data dummy):** `diunggah_pada` satu foto aktif dan `created_at` satu berkas di `storage.objects` dimundurkan 20 hari untuk memicu pembersihan. Order dummy baru: satu Menunggu, satu Ditolak, satu Diantar dengan foto aktif. Folder foto order yang dibersihkan kini kosong.
- **Belum beres:**
  - **FTO.07:** jadwal belum pernah jalan sendiri; jalan pertama Minggu 15 Nov 2026 02.00 WIB. Baca `cron.job_run_details` dan `net._http_response` segera (hasil `pg_net` tersimpan sementara).
  - Berkas tanpa baris yang **lebih muda** dari batas tidak tersentuh: baru terbukti tidak langsung, belum dengan berkas yatim baru.
  - FT-22 (penjaga kedua bukan pengunggah asli): opsional, belum dicoba.
  - Tombol "Ambil foto bukti" di layar penjaga tetap muncul setelah foto dibersihkan; perilaku menekannya (apakah boleh mengunggah ulang) belum dicoba.
  - Jalur galat Storage dan `sapuan_terpotong` belum pernah dipicu. Kedua pembatalan migration (03 dan 04) belum pernah dicoba.
  - Template untuk mengganti isian Vault (rotasi rahasia) belum ada.
  - Kolom `keterangan` pengaturan `foto_tautan_detik` masih kosong (tidak mendesak).
  - Foto dan order dummy menunggu pembersihan data uji di LNC.01.
- **Catatan cara tes dari konsol (bahan belajar):** "Copy as fetch" dari tab Network gagal CORS bila dijalankan apa adanya. Perbaikannya: `credentials` jadi `omit`, buang header `cache-control`, `pragma`, dan `priority`, ganti `body` dengan aksi dan id yang diuji. `foto_lihat` butuh id order (UUID), bukan nomor; ambil id lewat query baca-saja.
- **Saran giliran berikutnya:**
  - Setelah 15 Nov 2026: cek FTO.07 (butir sudah ada di sheet, tidak perlu butir baru).
  - Urutan versi 1 sesuai `AGENTS.md`: Foto Bukti sudah beres, lanjut Inbox, lalu Notifikasi.
  - Butir baru yang perlu ditambah ke sheet: **"Template rotasi isian Vault"** dan **"Uji penjaga kedua foto (opsional)"**. Butir "Tes pembersihan foto bersama FTO.07" dari Handoff #7 tidak jadi diperlukan.
  - Baris SEC selain yang sudah dicentang jangan dicentang dari pekerjaan ini.
- **Rahasia:** sesi ini tidak memakai token CLI dan tidak ada deploy. Rahasia penjadwal hanya dibaca dari Vault oleh database, tidak pernah tampil di chat, repo, atau md. Logout dashboard Supabase belum dikonfirmasi; logout dan tutup profil browser ketua.
