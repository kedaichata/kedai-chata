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

---
