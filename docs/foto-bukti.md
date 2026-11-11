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
