/docs/database.md

# 🗄️ database.md: Skema Supabase, Hak Akses, Pengaturan, Aksi Server, dan Workflow SQL

> **Versi 1.4 (5 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Perubahan 1.4: flag deploy `kedai` dan `bersihkan` berbeda (bagian 5). Perubahan 1.3: tabel `bantuan`, aksi `bantuan_daftar`, pengecualian SQL isi bantuan, batas isi bantuan (`bantuan.md`), serta kunci Supabase baru (bagian 3 dan 5). Perubahan 1.2: jam bebas (tanpa `jam_antar_daftar`), nomor order berjalan, foto bisa diganti dan penyapuan berkas tanpa baris, koreksi metode bayar, `status` membawa pengaturan. **Perubahan 1.1:** `catatan_order`, `baca_catatan`, dan `pelanggan_luar` dibuat bersama `order` di ORD.01 (sebelumnya ORD.09 dan ORD.11), karena order dan catatan awal membutuhkannya sejak langkah pertama. Dokumen rujukan teknis untuk semua dokumen fitur. Ini bukan fitur, jadi tidak punya tabel keputusan; yang dicatat di sini adalah **bentuk data** dari keputusan di dokumen fitur.
> **Status:** Belum ada yang dikerjakan. Butir **(bawaan)** = pilihan penulis yang belum ditanyakan satu per satu; ketua boleh mengubahnya sebelum tabelnya dibuat.
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini** bersama dokumen fitur yang sedang dikerjakan, tiap kali langkahnya menyentuh tabel, fungsi, pengaturan, atau hak akses. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 9.
> **Berkas yang diminta AI di awal sesi:** berkas migration terbaru di `supabase/migrations/`, `supabase/templates/` bila relevan, dan `supabase/functions/kedai/`.
> **Tanpa kode dan tanpa isi SQL.** Nama tabel dan kolom di sini bersifat deskriptif; nama persisnya ditetapkan saat SQL ditulis dan dicatat di berkas migration.
> **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Dokumen ini High-Risk (P0):** semua perubahan tabel, hak, dan fungsi butuh penjelasan dampak dan "OK" ketua.

---

## 1. Tujuan

Satu tempat untuk menjawab: **data apa disimpan di mana, siapa boleh menyentuhnya, angka apa yang bisa diubah, dan aksi server apa yang ada.** Dokumen fitur memutuskan _apa_ yang dibutuhkan; dokumen ini merangkum _bentuknya_ supaya tabel dan fungsi dari fitur berbeda tidak saling bertabrakan.

Prinsip dari `AGENTS.md` bagian 7 yang berlaku untuk semua isi di bawah: tabel tertutup total untuk aplikasi, semua akses lewat Edge Function `kedai`, logika di fungsi SQL atomik, `service_role` dengan hak minimal dan tanpa DELETE.

---

## 2. Tabel

Tabel dibuat **bertahap**, mengikuti langkah di dokumen fitur (kolom "Dibuat di"). Semua tabel: RLS aktif tanpa policy (bagian 3).

| Tabel            | Dibuat di | Isi pokok                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Aturan khusus                                                                                                                                                                                                                                                                                                  |
| ---------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pengaturan`     | AKN.03    | Kunci, nilai, keterangan, waktu diubah.                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Fitur lain hanya **menambah** baris, tidak mengubah yang ada (AK15). Nilai diubah ketua lewat SQL Editor, dengan "OK" bila berdampak. Daftar kunci di bagian 4.                                                                                                                                                |
| `profil`         | AKN.03    | ID akun (sama dengan ID di Supabase Auth), nama tampilan, nomor WA dalam bentuk seragam, waktu dibuat.                                                                                                                                                                                                                                                                                                                                                                                           | Hanya customer yang punya profil; staf tidak. **Email tidak disalin** ke tabel mana pun (AK1). Data pribadi.                                                                                                                                                                                                   |
| `alamat`         | AKN.03    | ID, pemilik (ID akun), alias, isi alamat, aktif atau tidak, waktu dibuat.                                                                                                                                                                                                                                                                                                                                                                                                                        | Aktif minimal 1 dan maksimal `alamat_maks` per pemilik. **Tidak dihapus, hanya dinonaktifkan** (AK9). Data pribadi.                                                                                                                                                                                            |
| `staf`           | AKN.03    | ID akun, nama tampilan, peran (owner atau penjaga), aktif atau tidak, waktu dibuat.                                                                                                                                                                                                                                                                                                                                                                                                              | Ada baris aktif = staf, tidak ada = customer (AK4). **Hanya ketua yang mengubah lewat SQL Editor**; `service_role` hanya membaca (AK5).                                                                                                                                                                        |
| `menu`           | MNU.01    | ID, nama, harga (rupiah, bilangan bulat), tersedia atau habis, aktif atau tidak, alamat berkas foto (kosong bila tanpa foto), waktu dibuat dan diubah, diubah oleh.                                                                                                                                                                                                                                                                                                                              | **Tidak dihapus** (MN3). Harga dibatasi `harga_maks_menu`.                                                                                                                                                                                                                                                     |
| `order`          | ORD.01    | ID; **nomor order berjalan terus** (O18, tidak di-reset, ditampilkan seperti "#1042"); pemesan (ID akun, kosong bila order wakil owner) atau pelanggan tanpa akun; **salinan** nama dan nomor WA pemesan; tipe; hari target (tanggal, dihitung server); jam permintaan (bebas diisi); **salinan** alias dan isi alamat (hanya tipe Diantar); total; status; metode bayar; pemutus (ID dan nama) beserta waktunya (O7); alasan tolak; penanda "dibuat oleh owner" (O15); waktu dibuat dan diubah. | **Tidak dihapus** (O17). Status hanya diubah fungsi SQL. Data pribadi (salinan nama, WA, alamat).                                                                                                                                                                                                              |
| `order_item`     | ORD.01    | Order, menu, **salinan nama menu**, **salinan harga satuan**, jumlah, subtotal.                                                                                                                                                                                                                                                                                                                                                                                                                  | Tidak diubah setelah dibuat (MN4, O3).                                                                                                                                                                                                                                                                         |
| `riwayat_status` | ORD.01    | Order, status asal, status tujuan, siapa yang mengubah (ID), waktu server, keterangan singkat (opsional; dipakai untuk koreksi metode bayar: metode lama dan baru).                                                                                                                                                                                                                                                                                                                              | **Hanya tambah** (O10).                                                                                                                                                                                                                                                                                        |
| `catatan_order`  | ORD.01    | ID, order, penulis (ID), salinan nama penulis, peran penulis (customer atau owner), isi, waktu server.                                                                                                                                                                                                                                                                                                                                                                                           | **Hanya tambah; tidak bisa diedit atau dihapus** (O12). Data pribadi bila isinya menyebut data pribadi.                                                                                                                                                                                                        |
| `baca_catatan`   | ORD.01    | Akun, order, catatan terakhir yang sudah dibaca, waktu.                                                                                                                                                                                                                                                                                                                                                                                                                                          | Dasar tanda "Catatan baru" di kartu order (O14).                                                                                                                                                                                                                                                               |
| `pelanggan_luar` | ORD.01    | ID, nama, keterangan, nomor WA (opsional), alamat antar (opsional, satu alamat), aktif atau tidak, dibuat oleh (ID owner), waktu dibuat.                                                                                                                                                                                                                                                                                                                                                         | Hanya owner yang membaca dan mengelola. **Tidak dihapus, hanya dinonaktifkan** (O16). Data pribadi.                                                                                                                                                                                                            |
| `foto_bukti`     | FTO.01    | ID, order, lokasi berkas di Storage, waktu unggah, siapa yang mengunggah, **tanda diganti** (foto ini sudah digantikan foto yang lebih baru), **waktu dibersihkan** (kosong bila berkas masih ada).                                                                                                                                                                                                                                                                                              | Baris **tidak dihapus**; yang dihapus hanya berkas (FT8, FT10). Satu baris aktif per order (belum ditandai diganti); pengunggah boleh mengganti foto (FT2), baris lama ditandai diganti.                                                                                                                       |
| `langganan_push` | NTF.02    | ID, akun, alamat tujuan push dari peramban, dua kunci langganan, aktif atau tidak, waktu dibuat, waktu terakhir berhasil.                                                                                                                                                                                                                                                                                                                                                                        | **Dinonaktifkan, tidak dihapus**, supaya konsisten dengan "tanpa DELETE". Tidak pernah dikirim balik ke aplikasi. Maksimal `push_maks_perangkat` aktif per akun.                                                                                                                                               |
| `bantuan`        | BTN.01    | ID, `kunci` (unik, tetap), bagian, urutan, peran isi (semua, customer, owner, atau penjaga), judul, isi, aktif atau tidak, waktu diubah.                                                                                                                                                                                                                                                                                                                                                         | **Tidak dihapus**, yang tidak dipakai ditandai tidak aktif (BT6). `service_role` **hanya baca**; isi diubah ketua lewat impor dari lembar di SQL Editor (BT2, BT8). Judul 5 sampai 120 dan isi 1 sampai 2000 karakter dicek di database (BT10). Bukan data pribadi; tanpa rekening, QRIS, atau rahasia (BT11). |

**Storage (bukan tabel):** dua bucket **privat tanpa policy untuk aplikasi**: satu untuk foto bukti (dibersihkan otomatis, `foto-bukti.md`), satu untuk foto menu (tidak dibersihkan, `menu.md` MN6). Pasang juga batas ukuran dan jenis berkas (gambar saja) di bucket sebagai pagar kedua.

**Nilai tetap yang dipakai di banyak dokumen:**

| Isi               | Nilai                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Status order      | Menunggu, Disetujui, Diproses, Diantar, Siap diambil, Siap disajikan, Selesai, Ditolak, Dibatalkan. |
| Tipe order        | Diantar, Diambil, Makan di warung.                                                                  |
| Metode bayar      | Transfer, Tunai, QRIS.                                                                              |
| Peran             | customer (tanpa baris di `staf`), owner, penjaga.                                                   |
| Peran isi bantuan | semua, customer, owner, penjaga (`bantuan.md` BT3).                                                 |

---

## 3. Hak, RLS, dan Pola Fungsi

**Pola yang sama untuk setiap tabel baru** (urutan dari `AKN.03`):

1. RLS diaktifkan, **tanpa policy** untuk aplikasi.
2. Cabut semua hak `anon`, `authenticated`, dan `service_role`, lalu beri ulang **hanya yang perlu** ke `service_role`.
3. Cek dengan query baca-saja, dan tempel hasilnya ke chat sebagai bukti.

**Hak `service_role` per tabel:** tidak ada yang mendapat DELETE.

| Kelompok               | Tabel                                                                                                 | Hak                                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Hanya baca             | `staf`, `pengaturan`, `bantuan`                                                                       | Baca saja. Perubahan oleh ketua di SQL Editor (`bantuan`: lewat impor dari lembar, `bantuan.md` BT2). |
| Baca dan tambah        | `order_item`, `riwayat_status`, `catatan_order`                                                       | Baca dan tambah; tidak ada hak ubah.                                                                  |
| Baca, tambah, dan ubah | `profil`, `alamat`, `menu`, `order`, `baca_catatan`, `pelanggan_luar`, `foto_bukti`, `langganan_push` | Baca, tambah, dan ubah.                                                                               |

**`anon` dan `authenticated`:** tidak punya hak apa pun ke tabel dan fungsi. Kunci **publishable** (`sb_publishable_...`, pengganti kunci `anon` lama) di `config.js` hanya dipakai untuk Supabase Auth dan memanggil `kedai`; kunci ini masuk sebagai role `anon` (belum login) atau `authenticated` (sudah login). Kunci **secret** (`sb_secret_...`, pengganti kunci `service_role` lama) hanya ada di `kedai` dan masuk sebagai role `service_role`, jadi hak di tabel bagian ini tetap berlaku. Kunci lama tidak dipakai (`AGENTS.md` bagian 3).

**Pola fungsi SQL** (`AGENTS.md` bagian 7): `SECURITY DEFINER`, `search_path` kosong, skema `public.` ditulis eksplisit, `EXECUTE` hanya untuk `service_role`. Satu fungsi = satu langkah bisnis yang atomik (cek, hitung, simpan, catat riwayat). Frontend dan Edge Function tidak memecah langkah itu menjadi beberapa tulis-database terpisah.

**Pengecualian penghapusan:** satu-satunya adalah **berkas foto bukti di Storage** yang dihapus fungsi `bersihkan` lewat jalur resmi Storage (FT7, FT8): berkas yang lebih tua dari `foto_simpan_hari`, berkas yang ditandai diganti, dan berkas tanpa baris yang lebih tua dari batas, hanya di bucket foto bukti. Tidak ada hak DELETE di tabel mana pun. Pembersihan data uji sebelum peluncuran (`LNC.01`) adalah pengecualian terpisah, dilakukan **satu kali oleh ketua** di SQL Editor dengan penjelasan dampak dan "OK".

---

## 4. Pengaturan (nilai awal)

Angka yang bisa berubah **tidak ditulis mati di kode** (`AGENTS.md` bagian 1). Nilai awal di bawah dimasukkan saat tabel atau fitur terkait dibuat. Nilai bertanda **(bawaan)** boleh diubah ketua sebelum dijalankan.

| Kunci                    | Nilai awal                                     | Dipakai oleh        | Dibuat di |
| ------------------------ | ---------------------------------------------- | ------------------- | --------- |
| `alamat_maks`            | 5                                              | AK9                 | AKN.03    |
| `item_maks_per_order`    | 10 (bawaan)                                    | O3                  | ORD.01    |
| `jumlah_maks_per_item`   | 10 (bawaan)                                    | O3                  | ORD.01    |
| `catatan_maks_karakter`  | 200 (bawaan)                                   | O12                 | ORD.01    |
| `catatan_maks_per_order` | 10 (bawaan)                                    | O12                 | ORD.01    |
| `harga_maks_menu`        | 200000 rupiah (bawaan)                         | MN2 ("batas wajar") | MNU.01    |
| `foto_simpan_hari`       | 14                                             | FT6                 | FTO.01    |
| `foto_maks_kb`           | 300 (bawaan; target kompres 100 sampai 200 KB) | FT4                 | FTO.01    |
| `foto_menu_maks_kb`      | 150 (bawaan; target kompres sekitar 100 KB)    | MN6                 | MNU.05    |
| `push_maks_perangkat`    | 5 (bawaan)                                     | NT7                 | NTF.02    |

**Yang tidak masuk pengaturan:** panjang isian yang merupakan bentuk data, yaitu nama tampilan 3 sampai 20 (AK7), alias alamat 3 sampai 30 dan isi alamat 10 sampai 200 (AK9), nama menu 3 sampai 40 (MN2), alasan tolak maksimal 200 (O8), format nomor WA (AK8), format jam (O2), serta judul bantuan 5 sampai 120 dan isi bantuan 1 sampai 2000 karakter (BT10). Jam antar diisi bebas oleh customer, jadi tidak ada daftar jam di pengaturan. Itu aturan validasi di fungsi (untuk `bantuan`, di batas kolom tabel); mengubahnya perlu perubahan fungsi dan "OK". Yang masuk pengaturan hanyalah **batas jumlah, lama, dan ukuran**.

**Mengubah pengaturan** berdampak langsung ke order baru (misalnya batas jumlah item), tidak ke order lama. Mengubah `foto_simpan_hari` ke angka lebih kecil bisa menghapus foto yang masih dibutuhkan, jadi wajib penjelasan dampak dan "OK" (`foto-bukti.md` bagian 7).

---

## 5. Aksi Edge Function `kedai` dan Fungsi Server

`kedai` adalah **satu fungsi dengan banyak aksi**, di-deploy **tanpa** `--no-verify-jwt` (pengecekan token login bawaan platform jadi lapis pertama) dan tetap **memverifikasi token login sendiri paling awal** sebagai lapis kedua (tanpa token atau token tidak valid: 401; rincian dan rencana mundur di `security.md` aturan 3). Peran dibaca server dari tabel `staf`; aplikasi tidak pernah mengirim peran. Pengiriman push dilakukan di dalam `kedai` (bukan fungsi ketiga), setelah aksi berhasil; kegagalan push tidak membatalkan aksi (`notifikasi.md`). Kunci secret dibaca `kedai` dari variabel lingkungan fungsi, tidak ditulis di kode.

| Aksi                                                                           | Siapa                                           | Dokumen               |
| ------------------------------------------------------------------------------ | ----------------------------------------------- | --------------------- |
| `status` (peran, profil, alamat aktif, dan pengaturan yang aman ditampilkan)   | semua yang login                                | `akun.md` AK16        |
| `daftar_profil`, `ganti_nama`, `ganti_wa`                                      | customer                                        | `akun.md`             |
| `alamat_simpan`, `alamat_nonaktif`                                             | customer                                        | `akun.md`             |
| `menu_daftar`                                                                  | semua peran (customer hanya melihat menu aktif) | `menu.md` MN5         |
| `menu_simpan`, `menu_stok`, `menu_nonaktif`                                    | owner                                           | `menu.md` MN5         |
| `order_buat`, `order_batal`                                                    | customer                                        | `order.md`            |
| `order_daftar`, `order_detail`                                                 | semua peran, sesuai visibilitas O11             | `order.md`            |
| `order_setuju`, `order_tolak`                                                  | owner                                           | `order.md`            |
| `order_status` (maju, atau mundur satu langkah)                                | penjaga dan owner                               | `order.md` O10        |
| `order_metode_koreksi`                                                         | owner                                           | `order.md` O23        |
| `catatan_tambah`                                                               | customer pemilik dan owner (sebelum Diproses)   | `order.md` O12        |
| `catatan_dibaca`                                                               | customer pemilik, owner, penjaga                | `order.md` O14        |
| `order_buat_wakil`                                                             | owner                                           | `order.md` O15        |
| `pelanggan_luar_daftar`, `pelanggan_luar_simpan`, `pelanggan_luar_nonaktif`    | owner                                           | `order.md` O16        |
| `foto_minta_unggah`, `foto_catat` (juga untuk mengganti foto, oleh pengunggah) | penjaga dan owner                               | `foto-bukti.md` FT5   |
| `foto_lihat`                                                                   | pemilik order, owner, penjaga                   | `foto-bukti.md` FT3   |
| `push_daftar`, `push_nonaktifkan`                                              | semua yang login                                | `notifikasi.md`       |
| `bantuan_daftar` (isi aktif yang sesuai peran, disaring server)                | semua yang login                                | `bantuan.md` BT5, BT9 |

**Dari bagian "belum tercantum" di dokumen fitur (bawaan, perlu blok susulan di dokumen terkait bila disetujui):**

- **Foto menu:** `foto_menu_minta_unggah` dan `foto_menu_catat` (owner saja). Tautan sementara foto menu **disertakan oleh `menu_daftar`**, jadi layar menu tidak memanggil server satu kali per foto. `menu.md` MN5 belum menyebut ini.
- **Mengaktifkan kembali menu:** lewat `menu_simpan` (owner). `menu.md` MN5 baru menyebut menonaktifkan.

**Fungsi SQL atomik** (satu per langkah bisnis): buat profil dan alamat pertama; buat order (cek menu tersedia, hitung harga, hari dari server, cek format jam, simpan order dan item dan catatan awal, catat riwayat, beri nomor order berjalan); batalkan; setujui; tolak; ubah status (maju atau mundur satu langkah); koreksi metode bayar; tambah catatan; buat order wakil; kelola pelanggan tanpa akun; catat foto.

**Edge Function `bersihkan`:** terpisah, hanya dipanggil penjadwal `pg_cron`, memverifikasi rahasia penjadwal paling awal (`foto-bukti.md` FT7 sampai FT9). Fungsi ini juga menyapu berkas foto yang ditandai diganti dan berkas tanpa baris yang lebih tua dari batas (hanya bucket foto bukti). Pemanggilan fungsi dari database biasanya memakai ekstensi `pg_net`, dengan **rahasia penjadwal sendiri** di header (bukan kunci Supabase: kunci secret baru bukan JWT, jadi pola lama mengirim kunci `service_role` lewat `Authorization` tidak berlaku); ketersediaannya dicek di dashboard saat `FTO.05`. `bersihkan` di-deploy **dengan** `--no-verify-jwt` dan **jangan diubah** ke pola kunci Supabase (`AGENTS.md` bagian 7).

---

## 6. Workflow SQL (satu environment: production)

1. **Tulis dulu di repo:** SQL disalin ke `supabase/migrations/` sebagai berkas berurutan (nama huruf kecil, tanpa spasi, diawali nomor urut dan nama pendek), **sebelum** dijalankan. **Pengecualian:** SQL impor isi `bantuan` adalah data (bukan skema) dan tidak disimpan di repo; lembar Google Sheet bantuan adalah sumbernya (`bantuan.md` BT7, butuh "OK" ketua). Skema tabelnya tetap lewat migration.
2. **Tulis SQL pembatalan** untuk setiap migration, disimpan bersama berkasnya, sebelum migration dijalankan.
3. **Jalankan manual di SQL Editor** (akun ketua, profil browser terpisah). **Dilarang migration CLI** (`supabase db push`), Docker, dan setup lokal.
4. **Cek dengan query baca-saja** (hak tabel, RLS aktif, fungsi ada) dan tempel hasilnya ke chat. Untuk tiap tabel baru, ikuti pola bagian 3.
5. **SQL yang dijalankan berulang** (tambah staf, nonaktifkan staf) ada di `supabase/templates/`, dengan isian yang diisi **di dashboard saja**. ID akun, nama, dan email nyata tidak disimpan di repo.
6. **Perubahan pada tabel atau fungsi yang sudah ada** wajib penjelasan dampak dan "OK" (`AGENTS.md` bagian 2 butir 5). Pastikan perubahan fungsi tidak mengubah data order yang sudah ada.
7. **Urutan migration mengikuti urutan pekerjaan:** AKN.03, MNU.01, ORD.01, FTO.01, NTF.02, BTN.01. (ORD.01 sudah mencakup tabel catatan dan pelanggan tanpa akun.)
8. **Cadangan:** salinan skema, fungsi, dan pengaturan ada di `supabase/` di repo. Data (isi tabel) tidak masuk repo karena memuat data pelanggan. Paket gratis tidak punya backup otomatis, jadi **ekspor data rutin** (tugas adik ketua, cara dibahas di sesi kode) disimpan di luar repo. Isi `bantuan` bukan data pelanggan; cadangannya adalah lembar Google Sheet bantuan (dipegang adik ketua).

---

## 7. Aturan yang paling sering terlanggar

| Aturan                                                                         | Akibat bila dilanggar                                                            |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Tabel baru tanpa RLS, atau hak diberikan ke `anon` atau `authenticated`        | Data bisa dibaca atau diubah langsung dari HP (SEC-03).                          |
| `service_role` diberi hak DELETE atau hak lebih dari tabel di bagian 3         | Order, catatan, atau foto bisa hilang; melanggar `AGENTS.md` bagian 7.           |
| Menyalin email ke tabel aplikasi                                               | Data pribadi ganda; sudah dikelola Supabase Auth.                                |
| Order merujuk menu atau alamat terbaru, bukan salinan                          | Mengubah menu atau alamat mengacaukan order lama.                                |
| Fungsi tanpa `search_path` kosong atau dengan `EXECUTE` terbuka                | Fungsi bisa dipanggil langsung dari HP atau dibajak.                             |
| Menjalankan SQL di SQL Editor sebelum salinannya ada di repo                   | Tidak ada cadangan; sulit dibatalkan.                                            |
| Mengubah nilai `pengaturan` tanpa penjelasan dampak                            | Misalnya `foto_simpan_hari` diperkecil: foto terhapus dan tidak bisa dipulihkan. |
| Menulis data pelanggan atau staf nyata di berkas SQL di repo                   | Repo public: data pribadi terbuka (SEC-23).                                      |
| Memecah satu langkah bisnis menjadi beberapa tulis terpisah dari Edge Function | Order setengah jadi atau dobel bila ada gangguan di tengah.                      |

**Dampak dan pembatalan:** tiap migration menambah tabel atau fungsi baru dan dibatalkan dengan SQL pembatalan yang sudah tertulis di repo. Perubahan pada tabel yang sudah berisi data (misalnya menambah kolom) lebih berisiko dan dibahas per langkah.

---

## 8. Ditunda dan Diputuskan

**Ditunda:** tabel untuk fitur di `bonus.md` (chat, utang, rekap, ongkir dan diskon, riwayat harga, kategori menu, penanda warung tutup, dan lainnya).

**Sudah diputuskan (4 Nov 2026):**

1. **Ganti foto bukti:** pengunggah boleh mengganti; foto lama ditandai diganti dan berkasnya ikut dibersihkan oleh `bersihkan` pada putaran berikutnya (tanpa menunggu 14 hari).
2. **Berkas yatim di Storage:** `bersihkan` juga menyapu berkas tanpa baris yang lebih tua dari batas, hanya di bucket foto bukti.
3. **Penomoran order:** nomor berjalan terus, tidak di-reset ("#1042").

---

## 9. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

### 2026-11-05: Format nama berkas migration

- Nama migration memakai tanggal: `YYYYMMDD_nama.sql` (contoh `20261105_akun.sql`), dengan pembatalannya `YYYYMMDD_nama_batal.sql` di folder yang sama. Bila ada dua migration di hari yang sama, tambah `_02` (contoh `20261105_02_menu.sql`).
- Ini menggantikan "diawali nomor urut" di bagian 6 butir 1 (yang paling akhir menang). Format tahun-bulan-hari dipilih supaya urutan alfabet sama dengan urutan waktu. Keputusan PIC di sesi kode; alasan dari ketua belum tercatat.
- Urutan migration tetap mengikuti bagian 6 butir 7 (AKN.03, MNU.01, ORD.01, FTO.01, NTF.02, BTN.01).
- Query cek baca-saja per migration disimpan di `supabase/templates/` dengan nama `YYYYMMDD_nama_cek.sql` (contoh `20261105_akun_cek.sql`), karena dijalankan berulang dan tanpa data nyata.

### 2026-11-07: Foto menu di public/img (menimpa bagian 2, 4, dan 5)

**Berkas tujuan:** `docs/database.md` bagian 9. Rujukan lengkap ada di blok `docs/menu.md` bagian 9 dengan judul yang sama. Yang paling akhir menang.

- **Bagian 2 (Storage):** hanya **satu bucket** (foto bukti antar). Tidak ada bucket foto menu.
- **Bagian 2 (tabel `menu`):** kolom foto berisi **nama berkas saja** di `public/img` (contoh `nasi-ayam.jpg`), kosong bila tanpa foto. Hanya huruf kecil, angka, dan strip, berakhiran `.jpg` atau `.webp`.
- **Bagian 4:** pengaturan `foto_menu_maks_kb` **tidak dibuat**.
- **Bagian 5:** aksi `foto_menu_minta_unggah` dan `foto_menu_catat` **tidak dibuat**. `menu_daftar` hanya mengembalikan nama berkas, tanpa tautan sementara. Mengaktifkan kembali menu tetap lewat `menu_simpan`.
- **Bagian 3 (hak):** tidak berubah.

### 2026-11-07: Deskripsi menu (menambah bagian 2, 4, dan 5)

**Berkas tujuan:** `docs/database.md` bagian 9. Rujukan lengkap: `docs/menu.md` bagian 9, Handoff #6. Yang paling akhir menang.

- **Bagian 2 (tabel `menu`):** kolom baru `deskripsi` (teks, opsional, boleh beberapa baris). Pagar bentuk di tabel: tidak kosong, tanpa spasi atau baris kosong di awal dan akhir, tanpa karakter CR. Batas panjang atas tidak ada di tabel; dijaga fungsi dari pengaturan.
- **Bagian 4 (pengaturan):** kunci baru `deskripsi_menu_maks` = 200 (karakter, MNU.07). Panjang dihitung setelah dirapikan; satu baris baru dihitung satu karakter.
- **Bagian 5 (fungsi SQL dan aksi):**
  - `menu_simpan` kini punya versi 7 argumen yang menerima `p_deskripsi` (tanpa nilai bawaan). Fungsi merapikan deskripsi (CR jadi satu jenis baris baru, karakter kontrol dibuang, spasi berulang jadi satu, spasi di tepi tiap baris dibuang, baris kosong beruntun jadi satu, baris kosong di awal dan akhir dibuang); hasil kosong disimpan NULL. Kode galat baru: `deskripsi_tidak_valid`.
  - Aksi `menu_simpan` di `kedai` **wajib** menerima field `deskripsi` (teks, boleh kosong); bila field tidak ada, dibalas 400. Deskripsi kosong menghapus deskripsi lama.
  - `menu_daftar` kini membawa field `deskripsi` untuk semua peran.
  - Versi 6 argumen `menu_simpan` (MNU.02) masih ada di database dan tidak dipanggil lagi. Pembuangannya menunggu keputusan ketua (butir sheet: "Buang fungsi menu_simpan lama"; High-Risk, butuh "OK", tidak mendesak).

### 2026-11-07: Grup pilihan gratis (menambah bagian 2, 3, 4, dan 5)

**Berkas tujuan:** `docs/database.md` bagian 9. Rujukan lengkap: `docs/menu.md` bagian 9, Handoff #7 dan #8. Yang paling akhir menang.

- **Bagian 2 (tabel baru, MNU.09):**
  - `grup_pilihan`: `id`, `nama` (3 sampai 30 karakter), `aktif`, `dibuat_pada`, `diubah_pada`, `diubah_oleh`. Nama grup **aktif** tidak boleh kembar (huruf besar dan kecil dianggap sama).
  - `opsi_pilihan`: `id`, `grup_id`, `nama` (2 sampai 30 karakter), `bawaan`, `aktif`, `urutan`, `dibuat_pada`, `diubah_pada`. Nama opsi aktif tidak boleh kembar dalam satu grup; paling banyak satu opsi `bawaan` per grup; opsi bawaan harus aktif.
  - `menu_grup` (pemasangan grup ke menu): `menu_id`, `grup_id` (keduanya kunci utama), `urutan`, `aktif`, `diubah_pada`, `diubah_oleh`.
  - Pagar nama di tabel: tanpa karakter kontrol, tanpa spasi di tepi, tanpa spasi ganda.
- **Bagian 3 (hak):** ketiga tabel RLS aktif tanpa policy. `service_role` hanya SELECT, INSERT, UPDATE; **tanpa DELETE**; `anon` dan `authenticated` nol. Grup dan opsi tidak dihapus, hanya dinonaktifkan; **melepas grup dari menu = `aktif` jadi false**.
- **Bagian 4 (pengaturan):** `grup_maks_per_menu` = 3 dan `opsi_maks_per_grup` = 6. Dihitung dari yang **aktif** saja. Syarat minimal 2 opsi aktif per grup dan tepat satu bawaan adalah aturan fungsi, bukan pengaturan.
- **Bagian 5 (fungsi SQL, `EXECUTE` hanya `service_role`):**
  - `grup_simpan(p_oleh, p_id, p_nama, p_opsi, p_aktifkan)`: owner; `p_id` kosong = grup baru. `p_opsi` adalah **daftar lengkap** opsi (array JSON; urutan = urutan tampil). Saat mengubah, semua opsi lama termasuk yang nonaktif wajib ikut; yang dibuang dikirim `aktif: false`, bila kurang ditolak `opsi_tidak_lengkap`. Grup nonaktif hanya bisa diubah bila `p_aktifkan` = true. Mengembalikan id grup.
  - `grup_nonaktif(p_oleh, p_id)`: owner; opsi dan pemasangannya tidak diubah.
  - `grup_daftar(p_semua)`: tanpa cek peran (dibatasi `kedai`, seperti `menu_daftar`); `true` memuat grup dan opsi nonaktif juga.
  - `menu_grup_atur(p_oleh, p_menu_id, p_grup_ids)`: owner; daftar **lengkap** grup aktif untuk satu menu, kosong = lepas semua.
  - `opsi_periksa(p_menu_id, p_opsi_ids)`: memeriksa opsi terpilih terhadap grup yang terpasang di menu (opsi bawaan dipakai bila grup tidak dipilih). **Belum dipanggil siapa pun**; ORD.01 yang memanggilnya.
  - `menu_daftar` diganti di tempat: kini membawa `grup` di tiap menu (hanya grup dan opsi aktif, semua peran). `menu_simpan` tidak berubah.
  - Kode galat baru: `grup_nama_tidak_valid`, `grup_nama_kembar`, `grup_tidak_ditemukan`, `grup_tidak_aktif`, `grup_tidak_valid`, `grup_terlalu_banyak`, `opsi_tidak_valid`, `opsi_tidak_lengkap`, `opsi_nama_kembar`, `opsi_terlalu_banyak`, `pilihan_rusak`.
- **Bagian 5 (aksi `kedai`):** `grup_daftar`, `grup_simpan`, `grup_nonaktif`, `menu_grup_atur`, semuanya owner saja (lapis kedua peran di `kedai`). Rincian isian dan balasan ada di Handoff #8 (`docs/menu.md`).
- **Berkas SQL:** `supabase/migrations/20261107_04_menu_grup_pilihan.sql` (dan `_batal`), `supabase/templates/20261107_04_menu_grup_pilihan_cek.sql` dan `_uji.sql`. Berkas uji hanya bisa dijalankan selama belum ada grup di database.
- **Catatan untuk ORD.01:** `order_item` perlu menyalin nama grup dan nama opsi terpilih (seperti nama dan harga menu), dan memanggil `opsi_periksa` sebelum menyimpan; kode `pilihan_rusak` dipetakan di `kedai` saat itu.

### 2026-11-08: Tabel order, bentuk persis (ORD.01)

**Berkas tujuan:** `docs/database.md` bagian 9. Rujukan: `docs/order.md` bagian 9, Handoff #1. Yang paling akhir menang.

- **Berkas SQL:** `supabase/migrations/20261108_order.sql` (dan `_batal`), `supabase/templates/20261108_order_cek.sql`. Dijalankan dan dicek 8 Nov 2026. Tidak menyentuh tabel lama.
- **Bagian 2 (tabel baru, nama kolom persis):**
  - `pelanggan_luar`: `id`, `nama`, `keterangan`, `nomor_wa`, `alamat_antar`, `aktif`, `dibuat_oleh` (staf), `dibuat_pada`.
  - `order` (**ditulis `public."order"` di SQL**): `id`, `nomor` (urutan otomatis mulai 1, unik), `pemesan` (profil) atau `pelanggan_luar_id` (tepat satu), `nama_pemesan`, `nomor_wa_pemesan`, `tipe`, `hari_target`, `jam_permintaan` (wajib), `alias_alamat`, `isi_alamat`, `total`, `status` (bawaan Menunggu), `metode_bayar`, `pemutus`, `pemutus_nama`, `diputuskan_pada`, `alasan_tolak`, `dibuat_oleh`, `dibuat_oleh_nama` (penanda order wakil), `dibuat_pada`, `diubah_pada`.
  - `order_item`: `id`, `order_id`, `menu_id`, `nama_menu`, `harga_satuan`, `jumlah`, `subtotal` (harus sama dengan harga × jumlah), **`pilihan`** (daftar teks "Nama grup: Nama opsi", salinan).
  - `riwayat_status`: `id` (urutan otomatis), `order_id`, `status_asal` (kosong di baris pertama), `status_tujuan`, `oleh` (akun Auth), `waktu`, `keterangan`.
  - `catatan_order`: `id` (urutan otomatis), `order_id`, `penulis` (akun Auth), `nama_penulis`, `peran_penulis` (customer atau owner), `isi`, `waktu`.
  - `baca_catatan`: kunci utama (`akun`, `order_id`), `catatan_terakhir_id`, `waktu`.
- **Bagian 2 (nilai tersimpan persis seperti di tabel "Nilai tetap"):** status dan tipe memakai tulisan lengkap berhuruf besar di awal (misalnya `Siap diambil`, `Makan di warung`); metode bayar `Transfer`, `Tunai`, `QRIS`.
- **Bagian 3 (hak):** sesuai tabel yang ada, terbukti lewat query cek. Tambahan: **tiga urutan nomor otomatis** (nomor order, id riwayat, id catatan) **tanpa hak untuk siapa pun** selain pemilik; hanya fungsi `SECURITY DEFINER` yang mengisinya.
- **Bagian 4 (pengaturan):** keempat kunci order sudah dibuat dengan nilai awal sesuai tabel (`item_maks_per_order` 10, `jumlah_maks_per_item` 10, `catatan_maks_karakter` 200, `catatan_maks_per_order` 10).
- **Catatan untuk ORD.02:** semua SQL yang menyebut tabel order wajib memakai `public."order"`. Pagar antar-kolom di tabel (metode bayar dan pemutus mengikuti status, alamat hanya Diantar, pembuat wajib untuk order wakil) berarti `order_buat` dan `order_buat_wakil` harus mengisi kolom-kolom itu konsisten, atau ditolak database.

### 2026-11-09: Fungsi catatan (ORD.09) dan panjang nama penulis catatan

**Berkas tujuan:** `docs/database.md` bagian 9. Rujukan: `docs/order.md` bagian 9, Handoff #18. Yang paling akhir menang.

- **Bagian 5 (fungsi SQL, `EXECUTE` hanya `service_role`):** `catatan_tambah(p_akun, p_order_id, p_isi)` dan `catatan_dibaca(p_akun, p_order_id)`, di `supabase/migrations/20261109_04_catatan_fungsi.sql` (pembatal dan cek menyertai). Tabel, hak tabel, dan pengaturan tidak berubah; nilai terbaca: `catatan_maks_karakter` 200, `catatan_maks_per_order` 10.
- **Kode galat baru:** `catatan_kosong`, `catatan_terlalu_panjang`, `catatan_terlalu_banyak`, `catatan_terkunci`.
- **Panjang nama penulis catatan:** tabel `catatan_order` menolak `nama_penulis` di luar 3 sampai 30 karakter. Untuk owner nama disalin dari `staf.nama_tampilan`, dan **panjang nama staf belum punya aturan tercatat** di dokumen ini. Ketua (9 Nov 2026) menyatakan nama staf berupa nama orang biasa, 3 sampai 30 karakter. Cek 9 Nov 2026: dari 2 staf dan 5 profil, 0 di luar batas. Pagar panjang di tabel `staf` belum diverifikasi. Bila nama staf diubah di luar 3 sampai 30, `catatan_tambah` oleh owner itu gagal dengan galat umum 500.

### 2026-11-10: Fungsi `order_buat_wakil` dan kode galat barunya (ORD.12)

Sumber: `docs/order.md` Handoff #24 dan #25; SQL di `supabase/migrations/20261110_06_order_wakil_fungsi.sql` (pembatal `_batal.sql`, cek di `supabase/templates/20261110_06_order_wakil_fungsi_cek.sql`). Bila tabel aksi atau daftar fungsi di bagian lain berbeda dari blok ini, **yang paling akhir menang**. Alasan keputusan di luar yang disebut: alasan belum tercatat.

- **Fungsi baru `public.order_buat_wakil(uuid, uuid, text, text, text, text, jsonb, text)`**: `SECURITY DEFINER`, `search_path` kosong, `EXECUTE` hanya `service_role` (terbukti cek SQL 1 sampai 4). Hak tabel tidak berubah dan tetap tanpa DELETE. **Tabel dan data lama tidak diubah.**
- **Atomik:** cek pelanggan tanpa akun (aktif), cek menu dan opsi, hitung harga di server, simpan order **langsung Disetujui**, simpan item, dan catat riwayat. Baris pelanggan dikunci `FOR SHARE` selama transaksi, jadi menonaktifkan pelanggan yang bersamaan menunggu.
- **Yang disalin dari pelanggan ke order:** nama dan nomor WA; alamat hanya untuk tipe Diantar (lihat bawah). **Keterangan pelanggan tidak ikut tersalin** (tabel `order` belum punya kolomnya). Alias alamat selalu kosong.
- **Batas** jumlah item per order dan jumlah per item dibaca dari tabel `pengaturan` (`item_maks_per_order`, `jumlah_maks_per_item`), tidak ditulis mati. Aturan menu, pilihan (lewat `opsi_periksa`), dan harga sama dengan `order_buat`.
- **Alamat (tipe Diantar):** alamat yang dikirim dipakai **untuk order itu saja** dan alamat tersimpan pelanggan tidak berubah; bila tidak dikirim, dipakai alamat tersimpan; bila tidak ada keduanya, galat. Panjang 10 sampai 200 karakter. Tipe Diambil dan Makan di warung: alamat yang dikirim diabaikan (terbukti, `isi_alamat` kosong).
- **Pemutus dan pembuat** diisi nama owner pembuat (O15). Riwayat satu baris: status asal kosong, tujuan Disetujui, keterangan "Order wakil. Metode bayar: <metode>". Tanpa catatan awal.
- **Tanpa penahan kirim ganda di server**, sama seperti `order_buat`; tombol Simpan di layar wajib dikunci.
- **Kode galat baru** dipetakan di `supabase/functions/kedai/order_wakil.ts`: `pelanggan_tidak_aktif` (409), `alamat_wajib` (400), `alamat_tidak_valid` (400), `metode_tidak_valid` (400). Daftar lengkap kode yang bisa dilempar fungsi ada di kepala berkas migration; pemetaan ke status HTTP ada di `order_wakil.ts`.
- **Aksi `kedai`:** `order_buat_wakil`, hanya owner (customer dan penjaga dibalas 403). Kontrak isian dan balasan untuk layar ada di `docs/order.md` Handoff #24.

### 2026-11-11: Tabel inbox, pengaturan, dan fungsi (usulan, final di sesi kode)

Keputusan ketua (sesi strategi 11 Nov 2026). Sumber: docs/inbox.md. Nama kolom di bawah **usulan penulis**; sesi kode memeriksa penamaan tabel lain dan meminta "OK" ketua sebelum migration.

- **Tabel `inbox`:** satu baris per kejadian per penerima. Kolom yang dibutuhkan: nomor berjalan (naik terus, dipakai penanda lokal), penerima (akun), teks, nomor order (boleh kosong), waktu dari jam server. RLS aktif tanpa policy. Hak `service_role` **minimal: baca dan tambah saja, tanpa UPDATE dan tanpa DELETE** (status dibaca ada di HP, jadi tidak ada yang diubah). Pembersihan manual oleh ketua di dashboard.
- **Pengaturan baru:** `inbox_simpan_hari` (nilai awal 14) dan batas jumlah item per tampilan (nilai awal ditetapkan di sesi kode).
- **Fungsi SQL:** `inbox_tulis` (atomik, `SECURITY DEFINER`, `search_path` kosong, `public.` eksplisit, `EXECUTE` hanya `service_role`; penerima dihitung dari order dan tabel `staf`) dan `inbox_daftar` (hanya milik pemanggil, 14 hari dari jam server). Nomor inbox terbaru untuk titik merah hanya dihitung dari item dalam 14 hari.
- **Template SQL hapus:** `supabase/templates/`, dua tahap (SELECT lalu DELETE dengan kondisi sama), batas hari dari `pengaturan`, tanpa data nyata. Dijalankan manual oleh ketua.
- **Dicek ulang:** SEC-04 (hak tabel) dan SEC-03 (akses langsung dengan kunci publishable) ikut mencakup tabel inbox.

### 2026-11-11: Tabel `foto_bukti`, bucket `foto-bukti`, dan pengaturan foto (FTO.01)

**Berkas tujuan:** `docs/database.md` bagian 9. Rujukan: blok `docs/foto-bukti.md` bagian 9 dengan judul "Batas ukuran foto bukti 150 KB". Yang paling akhir menang.

- **Berkas SQL:** `supabase/migrations/20261111_foto_bukti.sql` (dan `_batal`), `supabase/templates/20261111_foto_bukti_cek.sql`. Dijalankan dan dicek 11 Nov 2026. Tidak menyentuh tabel lama.
- **Bagian 2 (tabel baru, nama kolom persis):** `foto_bukti`: `id`, `order_id` (merujuk `public."order"`), `lokasi_berkas` (unik; 1 sampai 200 karakter, tanpa karakter kontrol, tidak diawali `/`), `diunggah_pada`, `diunggah_oleh` (merujuk `staf`), `diganti` (bawaan false), `dibersihkan_pada` (kosong bila berkas masih ada; tidak boleh lebih awal dari `diunggah_pada`).
- **Pagar satu foto aktif per order:** indeks unik sebagian pada `order_id` untuk baris `diganti = false`. **Catatan untuk FTO.02:** `foto_catat` wajib menandai foto lama `diganti = true` **lebih dulu**, baru menambah baris foto baru, dalam satu langkah atomik; kalau tidak, penambahan ditolak database.
- **Bagian 2 (Storage):** satu bucket `foto-bukti`, privat, batas 262144 byte, hanya `image/jpeg` dan `image/webp`. Terbukti: tidak ada policy di `storage.objects`, dan bucket di project hanya satu (tidak ada bucket foto menu).
- **Bagian 3 (hak):** `foto_bukti` masuk kelompok "Baca, tambah, dan ubah". Terbukti lewat query cek: `service_role` hanya `INSERT, SELECT, UPDATE` (tanpa DELETE), `anon` dan `authenticated` nol.
- **Bagian 4 (pengaturan):** `foto_simpan_hari` = 14 dan `foto_maks_kb` = **150** (menimpa 300). `foto_menu_maks_kb` tetap tidak dibuat. Batas bucket 256 KB tertulis di SQL, bukan di `pengaturan`.
- **Catatan untuk FTO.05 (`bersihkan`):** `dibersihkan_pada` diisi setelah berkas dihapus lewat jalur resmi Storage. Indeks `foto_bukti_belum_bersih_idx` (baris yang belum dibersihkan, urut waktu unggah) disiapkan untuk penyapuan.
- **Pembatalan:** `_batal.sql` hanya membuang tabel dan dua pengaturan. Bucket tidak ikut dibuang; penghapusannya lewat dashboard (kosongkan dulu). Cara ini belum pernah dicoba.
- **Pilihan penulis** (nama bucket, `diunggah_oleh` merujuk `staf`, nama dan jenis indeks): alasan belum tercatat.

### 2026-11-11: Fungsi foto bukti dan pengaturan `foto_tautan_detik` (FTO.02)

**Berkas tujuan:** `docs/database.md` bagian 9. Rujukan: blok `docs/foto-bukti.md` bagian 9 bertanggal sama dan Handoff #2. Yang paling akhir menang.

- **Berkas SQL:** `supabase/migrations/20261111_02_foto_fungsi.sql` (dan `_batal`), `supabase/templates/20261111_02_foto_fungsi_cek.sql`. Dijalankan dan dicek 11 Nov 2026. Tabel, hak tabel, bucket, dan data lama **tidak diubah**.
- **Bagian 4 (pengaturan):** kunci baru `foto_tautan_detik` = 300 (lama hidup tautan lihat, detik). Harus bilangan bulat 1 sampai 3600; di luar itu fungsi melempar `pengaturan_rusak` (galat umum 500). Batas 3600 adalah pilihan penulis. Kolom `keterangan` baris ini masih kosong.
- **Bagian 5 (fungsi SQL, `SECURITY DEFINER`, `search_path` kosong, `public.` eksplisit, `EXECUTE` hanya `service_role`, terbukti lewat query cek):**
  - `foto_cek_unggah(p_akun, p_order_id)`: pemeriksa hak unggah **tanpa mengunci** order. Penjaga atau owner aktif; order tipe Diantar; status Diantar atau Selesai; bila sudah ada foto aktif, hanya pengunggah asli. Mengembalikan `{order_id, nomor, mengganti, maks_kb}`.
  - `foto_catat(p_akun, p_order_id, p_lokasi, p_ukuran_byte)`: mengunci baris order, memakai `foto_cek_unggah` untuk semua aturan, menolak lokasi yang bentuknya bukan `<id order>/<uuid>.jpg|webp`, menolak ukuran di atas `foto_maks_kb` x 1024, menandai foto lama `diganti = true` **lebih dulu**, lalu menambah baris baru. Mengembalikan `{id (order), nomor, mengganti}`.
  - `foto_lihat_cek(p_akun, p_order_id)`: customer hanya order miliknya, owner semua, penjaga tidak untuk Menunggu, Ditolak, Dibatalkan. Mengembalikan `{order_id, status}` dengan status `ada` (disertai `lokasi`, `detik`, `diunggah_pada`), `dibersihkan`, atau `tidak_ada`. Foto yang sudah ditandai diganti tidak pernah dikembalikan.
  - Yang tidak berhak dibalas `order_tidak_ditemukan`, bukan "dilarang" (SEC-05, SEC-20).
- **Kode galat baru** (pemetaan ke status HTTP ada di `supabase/functions/kedai/foto.ts`): `bukan_antar`, `status_tidak_boleh`, `bukan_pengunggah`, `lokasi_tidak_valid`, `ukuran_tidak_valid`, `ukuran_terlalu_besar`, `foto_sudah_dicatat`. Kode yang sudah ada dipakai ulang: `akun_nonaktif`, `peran_tidak_boleh`, `order_tidak_ditemukan`. `id_kosong` dan `pengaturan_rusak` sengaja tidak dipetakan.
- **Bagian 5 (aksi `kedai`):** `foto_minta_unggah` dan `foto_catat` (penjaga dan owner), `foto_lihat` (semua peran yang berhak). Alamat unggah dan tautan lihat dibuat `kedai` lewat jalur resmi Storage; ukuran berkas dibaca `kedai` dari Storage dan diteruskan ke `foto_catat`. Kontrak isian dan balasan ada di `docs/foto-bukti.md` Handoff #2.
- **Pembatalan:** `_batal.sql` membuang tiga fungsi dan baris `foto_tautan_detik`. Baris di `foto_bukti` yang sudah tercatat tidak ikut terhapus. Belum pernah dicoba.
- **Asumsi yang belum terbukti:** kolom `id` di `foto_bukti` punya nilai bawaan (fungsi tidak mengisinya). Terbukti atau gugur saat foto pertama dicatat (FTO.03). Insert pengaturan hanya mengisi `kunci` dan `nilai`; terbukti jalan.
- **Pilihan penulis** (nama fungsi dan pembagian tugas tiga fungsi): alasan belum tercatat.

### 2026-11-11: Pembersihan foto: fungsi `foto_bersih_*`, rahasia di Vault, dan jadwal mingguan (FTO.05)

**Berkas tujuan:** `docs/database.md` bagian 9. Rujukan: `docs/foto-bukti.md` bagian 9, Handoff #5 dan #6. Yang paling akhir menang.

- **Berkas SQL:** `supabase/migrations/20261111_03_foto_bersih_fungsi.sql` dan `20261111_04_foto_jadwal.sql` (masing-masing dengan `_batal`), `supabase/templates/20261111_03_foto_bersih_fungsi_cek.sql`, `20261111_04_foto_jadwal_cek.sql`, `20261111_04_foto_jadwal_uji.sql`, dan `20261111_04_vault_rahasia.sql` (isiannya hanya diisi di dashboard, tidak ada nilai nyata di repo). Dijalankan dan dicek 11 Nov 2026. Tabel, hak tabel, dan data lama **tidak diubah**.
- **Bagian 5 (fungsi SQL pembantu `bersihkan`):** `foto_bersih_pilih()` (mengembalikan batas waktu dan daftar foto yang layak: sudah ditandai diganti atau lewat `foto_simpan_hari`), `foto_bersih_tandai(p_ids)` (mengisi `dibersihkan_pada`, hanya untuk baris yang memang layak) dan `foto_bersih_tanpa_baris(p_lokasi)` (menyaring lokasi berkas yang tidak punya baris di `foto_bukti`). `EXECUTE` hanya `service_role` (terbukti lewat query cek). Pagar tambahan: `foto_simpan_hari` harus 1 sampai 3650 dan satu panggilan maksimal 1000 elemen; keduanya pilihan penulis, alasan belum tercatat.
- **Bagian 5 (Edge Function `bersihkan`):** sudah dideploy dengan `--no-verify-jwt`. Memakai variabel `KUNCI_SECRET_KEDAI` (sama dengan `kedai`) dan `RAHASIA_PENJADWAL` (minimal 32 karakter; kurang dari itu semua permintaan ditolak 401), dikirim lewat header `x-rahasia-penjadwal`. Ada mode simulasi `{"simulasi": true}` yang hanya melaporkan angka; penjadwal tidak mengirimnya.
- **Vault (menambah FT9):** rahasia penjadwal kini juga tersimpan di **Vault Supabase** dengan nama `rahasia_penjadwal_bersihkan`, bersama alamat project (`url_project_bersihkan`), supaya SQL jadwal tidak memuat nilai apa pun. Ini bergeser dari FT9 ("hanya di dashboard"); Vault ada di dalam project Supabase milik ketua, jadi tidak ada penyimpanan baru di luar dashboard. Alamat project ikut di Vault karena pilihan penulis: salinan migration di repo bisa dijalankan apa adanya tanpa isian yang diganti. Nilainya hanya ditempel di SQL Editor, lalu snippet dihapus.
- **Jadwal (keputusan ketua, 11 Nov 2026):** `pg_cron` pekerjaan `bersihkan-foto-mingguan`, `0 19 * * 6` (UTC) = **Minggu 02.00 WIB**, memanggil `bersihkan` lewat `pg_net` dengan isi `{}` (putaran nyata) dan batas tunggu 150 detik (bawaan 5 detik terlalu pendek). Rahasia dan alamat dibaca dari Vault saat jadwal berjalan. Usulan jadwal dan Vault disetujui ketua; alasan ketua belum tercatat. Praktisnya foto bertahan 14 sampai 21 hari (FT6).
- **Terbukti 11 Nov 2026:** keempat query cek cocok (tiga ekstensi, dua isian di Vault dan memenuhi syarat, jadwal aktif, memakai Vault, tanpa nilai tertulis). Uji manual dengan perintah yang sama dengan jadwal: balasan 200, `"ok":true`, `"simulasi":false`, semua angka 0.
- **Belum terbukti:** jalan otomatis pertama (Sabtu 14 Nov 2026 pukul 19.00 UTC); penyapuan berkas tanpa baris menemukan berkas yatim (diuji di FTO.06); jalur galat Storage dan `sapuan_terpotong`; kedua pembatalan (`_batal.sql` migration 03 dan 04) belum pernah dicoba.
- **Pembatalan:** `_foto_jadwal_batal.sql` hanya mematikan jadwal; fungsi `bersihkan` dan dua isian Vault tidak ikut dibuang (membuangnya langkah terpisah, butuh penjelasan dampak dan "OK"). Bila `bersihkan` dan jadwal sudah terpasang, **matikan jadwal dulu** sebelum membuang fungsi `foto_bersih_*`.
- **Rotasi rahasia:** `security.md` bagian 5 menyebut "ganti nilainya di dashboard dan di penjadwal". Kini artinya mengganti di dua tempat: variabel fungsi `bersihkan` dan isian Vault. Template untuk mengganti isian Vault belum dibuat (template pemasangan gagal bila nama sudah ada).
- **Catatan:** hasil panggilan `pg_net` tersimpan di `net._http_response` hanya sementara; baca segera setelah jalan.

### 2026-11-11: Tabel `inbox`, pengaturan inbox, dan tiga fungsi inbox (INB.01, INB.02)

**Berkas tujuan:** `docs/database.md` bagian 9. Rujukan: `docs/inbox.md` bagian 9, Handoff #1. Yang paling akhir menang.

- **Berkas SQL:** `supabase/migrations/20261111_05_inbox.sql` dan `20261111_06_inbox_fungsi.sql` (masing-masing dengan `_batal`), `supabase/templates/20261111_05_inbox_cek.sql` dan `20261111_06_inbox_fungsi_cek.sql`. Dijalankan dan dicek 11 Nov 2026. Tabel lama dan fungsi lama tidak diubah.
- **Bagian 2 (tabel baru, nama kolom persis):** `inbox`: `id` (nomor berjalan otomatis), `penerima` (merujuk `auth.users`), `teks` (1 sampai 200 karakter), `nomor_order` (boleh kosong; merujuk `order.nomor`, yaitu angka "#N" yang tampil di layar), `waktu` (jam server).
- **Bagian 3 (hak):** `service_role` hanya `INSERT, SELECT` (tanpa UPDATE dan tanpa DELETE); `anon` dan `authenticated` nol; urutan nomor `id` tanpa hak untuk siapa pun. RLS aktif tanpa policy. Terbukti lewat query cek.
- **Bagian 4 (pengaturan):** `inbox_simpan_hari` = 14 dan `inbox_maks_tampil` = 30.
- **Bagian 5 (fungsi SQL, `SECURITY DEFINER`, `search_path` kosong, `EXECUTE` hanya `service_role`, terbukti):** `inbox_tulis(p_pelaku, p_kejadian, p_order_id)` mengembalikan jumlah baris tertulis; `inbox_daftar(p_akun, p_penanda)` mengembalikan `{butir, terbaru, maks}`; `inbox_terbaru(p_akun)` mengembalikan nomor item terbaru atau kosong.
- **Kode galat baru:** `kejadian_tidak_dikenal`, `status_tidak_cocok` (dari `inbox_tulis`; hanya dicatat di log `kedai`). Kode yang sudah ada dipakai ulang: `id_kosong`, `order_tidak_ditemukan`, `akun_nonaktif`, `pengaturan_rusak`.
- **Pengecualian tulis (AGENTS.md blok 11 Nov):** `inbox_tulis` dipanggil `kedai` setelah aksi order berhasil; kegagalannya tidak membatalkan aksi.
- **Pembatalan:** `_batal.sql` migration 05 membuang tabel dan dua pengaturan; migration 06 membuang tiga fungsi (buang fungsi dulu sebelum tabel). Belum pernah dicoba.
- **Pilihan penulis** (nama tabel, kolom, dan fungsi; batas pengaturan 1 sampai 365 dan 1 sampai 200): alasan belum tercatat.

### 2026-11-12: Tabel `langganan_push` dan pengaturan `push_maks_perangkat` (NTF.02)

**Berkas tujuan:** `docs/database.md` bagian 9 (tempel paling bawah). Rujukan: `docs/notifikasi.md` bagian 9, Handoff #2. Yang paling akhir menang.

- **Berkas SQL:** `supabase/migrations/20261112_langganan_push.sql` (dan `_batal`), `supabase/templates/20261112_langganan_push_cek.sql`. Dijalankan dan dicek 12 Nov 2026. Tabel lama dan data lama tidak diubah.
- **Bagian 2 (tabel baru, nama kolom persis):** `langganan_push`: `id` (uuid, nilai bawaan), `akun` (merujuk `auth.users`), `endpoint` (unik se-tabel; harus diawali `https://`, 20 sampai 2000 karakter, tanpa spasi atau karakter kontrol), `kunci_p256dh` dan `kunci_auth` (masing-masing 1 sampai 200 karakter, hanya huruf, angka, `-`, `_`, `=`), `aktif` (bawaan true), `dibuat_pada` (jam server), `terakhir_berhasil_pada` (boleh kosong). Indeks sebagian `langganan_push_akun_aktif_idx` pada `akun` untuk baris `aktif`.
- **Bagian 3 (hak):** `service_role` hanya `INSERT, SELECT, UPDATE` (tanpa DELETE); `anon` dan `authenticated` nol; RLS aktif tanpa policy. Terbukti lewat query cek 12 Nov 2026. Tidak ada urutan nomor otomatis (`id` memakai uuid).
- **Bagian 4 (pengaturan):** `push_maks_perangkat` = 5. Dasarnya **NT5** (bukan NT7 seperti tertulis di tabel bagian 4; NT7 membahas kunci VAPID). Pagar angka bulat 1 sampai 20 **tidak ada di tabel**; dijaga `push_daftar` (NTF.03) dengan galat `pengaturan_rusak`.
- **Catatan untuk NTF.03:** `endpoint` unik se-tabel, jadi bila HP yang sama dipakai akun lain, barisnya **dipindah** ke akun yang sedang login, bukan dibuat dobel. Batas perangkat dihitung dari baris `aktif` per akun oleh `push_daftar`, bukan oleh tabel.
- **Pembatalan:** `_batal.sql` membuang tabel dan baris pengaturan (semua langganan ikut hilang, pengguna harus mengaktifkan notifikasi lagi). Jalankan hanya bila NTF.03 belum dideploy. Belum pernah dicoba.
- **Pilihan penulis** (nama tabel dan kolom, `endpoint` unik se-tabel, `id` uuid, pola isi kunci): disetujui ketua 12 Nov 2026 ("ikut rekomendasi"); alasan ketua selain itu belum tercatat.

### 2026-11-12: Fungsi `push_daftar` dan `push_nonaktifkan` (NTF.03)

**Berkas tujuan:** `docs/database.md` bagian 9 (tempel paling bawah). Rujukan: `docs/notifikasi.md` bagian 9, Handoff #3. Yang paling akhir menang.

- **Berkas SQL:** `supabase/migrations/20261112_02_langganan_push_fungsi.sql` (dan `_batal`), `supabase/templates/20261112_02_langganan_push_fungsi_cek.sql`. Dijalankan dan dicek 12 Nov 2026. Tabel, hak tabel, pengaturan, dan data lama **tidak diubah**.
- **Bagian 5 (fungsi SQL, `SECURITY DEFINER`, `search_path` kosong, `EXECUTE` hanya `service_role`, terbukti lewat query cek A sampai C):**
  - `push_daftar(p_akun, p_endpoint, p_p256dh, p_auth)` mengembalikan bilangan bulat: jumlah perangkat lama yang dinonaktifkan karena batas (0 bila tidak ada).
  - `push_nonaktifkan(p_akun, p_endpoint)` mengembalikan 0 atau 1 (jumlah baris yang dimatikan).
- **Perilaku `push_daftar` (atomik):**
  - Endpoint yang sudah ada (akun sama atau akun lain) **dipindah** ke akun pemanggil, diaktifkan kembali, kuncinya diganti, `dibuat_pada` diisi `now()`, dan `terakhir_berhasil_pada` dikosongkan.
  - Bila perangkat aktif melebihi `push_maks_perangkat`, perangkat aktif **terlama** (urut `dibuat_pada`, lalu `id`) dinonaktifkan; perangkat yang baru didaftarkan tidak pernah jadi korban. Baris tidak dihapus.
  - Dua pendaftaran bersamaan untuk satu akun diurutkan dengan kunci penasihat per akun.
  - `push_maks_perangkat` harus bilangan bulat 1 sampai 20; di luar itu `pengaturan_rusak`.
- **Pergeseran makna kolom:** `dibuat_pada` di `langganan_push` kini berarti **waktu pendaftaran terakhir perangkat itu**, bukan pembuatan baris pertama (disetujui ketua, 12 Nov 2026, supaya "terlama" adil). Menambah blok `langganan_push` bertanggal sama.
- **`push_nonaktifkan`:** hanya langganan milik pemanggil. Endpoint tidak ada, sudah mati, atau milik akun lain: tidak ada yang berubah, hasil 0, tanpa galat dan tanpa membedakan ketiganya (SEC-25). Tidak mengecek akun nonaktif, supaya staf yang baru dinonaktifkan tetap bisa mematikan langganannya.
- **Kode galat baru:** `langganan_tidak_valid` (400; format isian salah, dicek di fungsi sama seperti constraint tabel). Kode yang sudah ada dipakai ulang: `id_kosong`, `akun_nonaktif`. `pengaturan_rusak` tidak dipetakan (galat umum 500).
- **Bagian 5 (aksi `kedai`):** `push_daftar` dan `push_nonaktifkan`, untuk semua yang login, di `supabase/functions/kedai/push.ts`. Kontrak isian dan balasan ada di `docs/notifikasi.md` Handoff #3.
- **Pembatalan:** `_batal.sql` hanya membuang dua fungsi (tabel dan data tidak ikut). Bila tabel akan dibuang lewat pembatal NTF.02, buang dua fungsi ini dulu. Belum pernah dicoba.
- **Belum terbukti:** logika (pemindahan akun, perangkat ke-6, `push_nonaktifkan` akun lain tidak berefek); baru bisa dites di NTF.08.
- **Pilihan penulis** (nama fungsi, nilai kembalian, kunci penasihat, `terakhir_berhasil_pada` dikosongkan saat daftar ulang, staf nonaktif boleh mematikan): alasan belum tercatat.

### 2026-11-13: `inbox_tulis` mengembalikan penerima, fungsi `push_langganan_ambil` dan `push_hasil_catat` (NTF.06)

**Berkas tujuan:** `docs/database.md` bagian 9 (tempel paling bawah). Rujukan: `docs/notifikasi.md` bagian 9, Handoff #9, dan blok `AGENTS.md` bertanggal sama. Yang paling akhir menang.

- **Berkas SQL:** `supabase/migrations/20261113_inbox_tulis_penerima.sql` (dan `_batal`), `supabase/templates/20261113_inbox_tulis_penerima_cek.sql`. Dijalankan dan dicek 13 Nov 2026 (cek A sampai F cocok). Tabel, hak tabel, pengaturan, dan data lama **tidak diubah**.
- **Bagian 5 (`inbox_tulis` dibuat ulang):** fungsi dihapus lalu dibuat ulang dalam satu transaksi karena tipe kembalian berubah dari integer menjadi `jsonb`. Aturan penerima, teks, dan pemeriksaan status **sama persis** dengan versi 11 Nov. Kembalian kini array, satu elemen per penerima yang baru ditulis ke inbox: `akun`, `teks`, `nomor_order`, `tujuan`. `tujuan` = `antrean` hanya untuk penjaga pada kejadian `batal_owner` (pengecualian NT8), selain itu `order`. Array kosong bila tidak ada penerima. Hak `EXECUTE` diberikan ulang hanya ke `service_role`.
- **Bagian 5 (fungsi baru, `SECURITY DEFINER`, `search_path` kosong, `EXECUTE` hanya `service_role`, terbukti lewat cek A sampai C):**
  - `push_langganan_ambil(p_akun uuid[])`: hanya membaca. Mengembalikan array `{id, akun, endpoint, p256dh, auth}` untuk langganan **aktif** milik akun-akun itu. Isinya hanya untuk dipakai `kedai`, tidak dikirim ke aplikasi dan tidak ditulis di log. Batas 100 akun per panggilan.
  - `push_hasil_catat(p_berhasil uuid[], p_mati uuid[])`: satu langkah atomik. `p_berhasil` mengisi `terakhir_berhasil_pada` (jam server); `p_mati` mengubah `aktif` jadi false (tanpa DELETE). Hanya baris yang masih aktif yang diubah. Batas 200 id per daftar. Mengembalikan `{diperbarui, dinonaktifkan}`.
- **Pengecualian tulis (menimpa bagian 5, kalimat tentang pengiriman push):** `inbox_tulis` dan `push_hasil_catat` dipanggil `kedai` setelah aksi berhasil; kegagalannya tidak membatalkan aksi (IB12, NT4). Berlaku hanya untuk dua fungsi ini.
- **Bagian 3 (hak):** tidak berubah. Terbukti lewat cek D dan E: `langganan_push` untuk `service_role` hanya `INSERT, SELECT, UPDATE`; `inbox` hanya `INSERT, SELECT`; `anon` dan `authenticated` nol.
- **Bagian 5 (aksi `kedai`):** tidak ada aksi baru. Pengirim push berjalan di dalam `tulisInbox`, dan kodenya menyusul di sesi berikutnya.
- **Kode galat baru:** `daftar_terlalu_panjang` (dari dua fungsi baru). Tidak dipetakan; hanya tercatat di log `kedai`, tidak sampai ke layar.
- **Pembatalan:** `_batal.sql` membuang dua fungsi baru dan mengembalikan `inbox_tulis` versi 11 Nov. **Deploy `kedai` versi sebelum pengirim push lebih dulu**, karena versi pengirim mengharapkan `inbox_tulis` mengembalikan daftar. Belum pernah dicoba.
- **Belum terbukti:** isi kembalian `inbox_tulis` yang baru dan pencatatan hasil lewat `push_hasil_catat` baru terbukti saat push pertama terkirim (NTF.06, tes `order_baru`). Sampai `kedai` baru dideploy, tidak ada yang membaca kembalian baru, dan `kedai` yang live tetap jalan.
- **Pilihan penulis** (tujuan `antrean` ditentukan di `inbox_tulis`, batas 100 dan 200, kembalian berbentuk `jsonb`, id order tidak ikut di kembalian): alasan belum tercatat.

### 2026-11-13: Migration 13 Nov terbukti lewat push sungguhan (NTF.06)

**Berkas tujuan:** `docs/database.md` bagian 9 (tempel paling bawah). Kejadian di lapangan, bukan keputusan baru. Sumber: `docs/notifikasi.md` bagian 9, Handoff #10, #11, dan #14. Yang paling akhir menang.

- **Menimpa dua kalimat di blok 13 Nov di atas:** "**Belum terbukti** ... baru terbukti saat push pertama terkirim" dan "kodenya menyusul di sesi berikutnya". Keduanya sudah lewat: pengirim push (`kirim_push.ts`, dengan `inbox.ts` yang menyerahkan penerima) sudah di-deploy ke `kedai` dan dipakai.
- **Terbukti (diperiksa di chat, tidak disimpan; akun dummy):**
  - `inbox_tulis` versi baru: kembalian penerima terbaca `kedai`, dan push sampai ke penerima yang benar untuk `order_baru`, `setujui`, `tolak`, `catatan_customer`, `catatan_owner`, `status`, dan `batal_owner`.
  - `push_langganan_ambil`: langganan aktif terambil dan push terkirim.
  - `push_hasil_catat`: `terakhir_berhasil_pada` terisi dan cocok dengan jam log server (jam server).
  - Log `kedai push:` menunjukkan `terkirim`, `mati 0`, `gagal 0`.
- **Belum terbukti:**
  - Jalur langganan mati (`p_mati`, mengubah `aktif` jadi false) belum pernah terpicu, karena semua log menunjukkan `mati 0`.
  - `_batal.sql` belum pernah dicoba.
- **Tidak ada perubahan** pada tabel, hak, pengaturan, atau fungsi SQL. Blok ini hanya mencatat status.

---
