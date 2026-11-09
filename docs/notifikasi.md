/docs/notifikasi.md

# 🔔 notifikasi.md: Push (VAPID) dan Penyegaran Data Tanpa Polling

> **Versi 1.1 (4 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Perubahan 1.1: mundur satu langkah dan penggantian foto tanpa push; iPhone diasumsikan jalan; memakai nomor order berjalan. Bergantung pada `akun.md` (peran dan login), `order.md` (status dan catatan), dan `fondasi.md` (`sw.js`).
> **Status:** NT1 sampai NT12 sebagian disepakati dari dokumen lain (rujukan di kolom Dasar); sisanya **(bawaan)** = pilihan penulis, ketua boleh mengubahnya sebelum dikerjakan. Belum ada yang dikerjakan.
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini** (+ `database.md` dan `security.md` untuk langkah tabel, fungsi, dan aturan akses). Kerjakan langkah di bagian 5. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 9.
> **Berkas yang diminta AI di awal sesi:** `public/sw.js`, `public/config.js`, berkas migration terbaru, `supabase/functions/kedai/`, dan berkas JS notifikasi bila sudah ada.
> **Tanpa kode dan tanpa isi SQL.** **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Fitur ini High-Risk (P0):** `sw.js`, rahasia (kunci VAPID), dan isi push yang tidak boleh memuat data pribadi.
> **Daftar "siapa dapat push kapan" ada di bagian 4 berkas ini dan satu-satunya yang berlaku**; `order.md` hanya merujuk ke sini.

---

## 1. Tujuan

Customer, owner, dan penjaga **tahu ada kejadian penting** (order baru, disetujui, ditolak, status berubah, catatan baru) **tanpa harus membuka aplikasi terus-menerus**, dan tanpa membebani kuota free tier. Push menjawab "ada yang perlu dilihat"; **data lengkapnya tetap diambil dari server saat aplikasi dibuka.**

---

## 2. Keputusan

| No   | Keputusan                                                                                                                                                                                                                                                                                             | Dasar                                                            |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| NT1  | **Push notification (Web Push dengan VAPID)** untuk kejadian penting, termasuk saat aplikasi ditutup.                                                                                                                                                                                                 | `AGENTS.md` bagian 1 dan 3; `features.md` bagian 6.              |
| NT2  | **Teks push umum saja:** tanpa nama, alamat, nomor WA, isi catatan, atau nama menu. Boleh memuat **nomor order** ("#1042"). **(bawaan untuk nomor order)**                                                                                                                                            | `security.md` aturan 16; O18.                                    |
| NT3  | **Tanpa polling dan tanpa Realtime.** Data diambil saat aplikasi dibuka atau kembali ke layar, saat push masuk (bila aplikasi terbuka), dan lewat tombol **Segarkan**. Tidak ada timer yang memanggil server terus-menerus.                                                                           | `AGENTS.md` bagian 4; O19; MN7.                                  |
| NT4  | **Pengirim push ada di dalam Edge Function `kedai`**, dipanggil setelah aksi berhasil. Tidak ada fungsi ketiga. **Kegagalan push tidak membatalkan aksi**, dan **tidak ada antrean atau percobaan ulang** (satu kali coba). **(bawaan)**                                                              | `AGENTS.md` bagian 3 (dua fungsi saja); hemat kuota.             |
| NT5  | **Satu akun boleh punya beberapa perangkat.** Langganan disimpan per perangkat di tabel `langganan_push`; maksimal `push_maks_perangkat` (nilai awal 5) per akun. Langganan yang sudah mati (ditolak push service) atau yang dimatikan pengguna **dinonaktifkan, tidak dihapus**. **(bawaan)**        | `database.md` bagian 2 dan 3 (tanpa DELETE).                     |
| NT6  | **Izin notifikasi tidak diminta mendadak.** Customer melihat tombol **"Aktifkan notifikasi"** di menu Akun dan satu ajakan lembut **setelah order pertama terkirim**. Staf melihat ajakan di layar utama sampai diaktifkan. Pop-up izin peramban baru muncul **setelah tombol ditekan**. **(bawaan)** | Customer harus sesederhana WA; `features.md` bagian 9.           |
| NT7  | **Kunci VAPID:** kunci **publik** ada di `public/config.js`; kunci **privat** hanya di dashboard Supabase (rahasia fungsi). Pasangan kunci dibuat sekali dan dipandu AI.                                                                                                                              | `security.md` aturan 7 dan 16; F9.                               |
| NT8  | **`sw.js` menangani dua kejadian push:** push masuk (menampilkan notifikasi) dan notifikasi ditekan (membuka aplikasi ke detail order terkait). Bila aplikasi sedang terbuka, push masuk memicu **penyegaran data**, bukan hanya tampilan notifikasi. Perubahan `sw.js` butuh "OK" ketua.             | F10; `AGENTS.md` bagian 7.                                       |
| NT9  | **Satu notifikasi per order diganti yang terbaru** (tag per order), supaya penjaga dan owner tidak kebanjiran bila status berubah cepat. **(bawaan)**                                                                                                                                                 | Hemat perhatian.                                                 |
| NT10 | **Penyegaran saat kembali ke layar dibatasi:** tidak menyegarkan lagi bila kurang dari sekitar 30 detik sejak penyegaran terakhir. **(bawaan)**                                                                                                                                                       | Hemat panggilan Edge Function (batas sekitar 500.000 per bulan). |
| NT11 | **Android (Chrome) didukung penuh.** iPhone hanya iOS 16.4 ke atas dan aplikasi **harus dipasang ke layar utama**. Push diuji di Android; batasan iPhone hanya dicatat. Selebihnya iPhone **diasumsikan jalan**, dan keluhan iPhone ditampung lalu dihitung di review pemakaian (`LNC.05`).           | `AGENTS.md` bagian 10 butir 7.                                   |
| NT12 | **Customer tanpa push tetap terlayani:** status selalu bisa dilihat dengan membuka aplikasi dan menekan Segarkan. Push adalah pelengkap, bukan satu-satunya jalan.                                                                                                                                    | NT3; kebanyakan ibu-ibu belum tentu mengaktifkan.                |

---

## 3. Prasyarat

`akun.md` (login dan peran) dan `fondasi.md` (`sw.js` dan manifest, FND.08) selesai. Push untuk kejadian order dikerjakan **bertahap bersama `order.md`**: order bisa berjalan lebih dulu tanpa push, lalu tiap kejadian di bagian 4 dipasang setelah aksinya jalan.

---

## 4. Yang dibuat

### 4.1 Siapa dapat push kapan (kejadian → penerima)

"Owner" berarti semua owner aktif yang punya langganan aktif; "penjaga" idem. **Penulis atau pelaku aksi tidak dikabari atas aksinya sendiri.** Order wakil owner tidak mengirim push ke pemesan karena tidak punya akun (O15).

| Kejadian                                                     | Penerima                     | Teks push (contoh)                                                                          |
| ------------------------------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------- |
| Customer mengirim order (Menunggu)                           | Owner                        | "Ada order baru."                                                                           |
| Catatan baru dari customer, order **Menunggu**               | Owner                        | "Ada catatan baru di order #N."                                                             |
| Catatan baru dari customer, order **Disetujui**              | Owner dan penjaga            | "Ada catatan baru di order #N."                                                             |
| Catatan baru dari owner (hasil follow up WA), order Menunggu | Customer pemilik             | "Ada catatan baru di pesananmu." **(bawaan)**                                               |
| Catatan baru dari owner, order Disetujui                     | Customer pemilik dan penjaga | idem **(bawaan)**                                                                           |
| Customer membatalkan order (saat Menunggu)                   | Owner                        | "Order #N dibatalkan pemesan." **(bawaan)**                                                 |
| Setujui                                                      | Customer pemilik dan penjaga | Customer: "Pesananmu sudah disetujui." Penjaga: "Ada order disetujui."                      |
| Tolak                                                        | Customer pemilik             | "Pesananmu belum bisa diterima. Buka aplikasi untuk detailnya." (alasan dibaca di aplikasi) |
| Diproses                                                     | Customer pemilik             | "Pesananmu sedang diproses."                                                                |
| Diantar / Siap diambil / Siap disajikan                      | Customer pemilik             | "Pesananmu sedang diantar." / "…siap diambil." / "…siap disajikan."                         |
| Selesai                                                      | Customer pemilik             | "Pesananmu selesai. Foto bukti (bila ada) dibuka di aplikasi."                              |
| Foto bukti diunggah **setelah** Selesai                      | Customer pemilik             | "Foto bukti antar sudah tersedia." **(bawaan)**                                             |
| Order wakil owner dibuat (langsung Disetujui)                | Penjaga                      | "Ada order disetujui."                                                                      |

Catatan penting dari tabel:

- **Penjaga tidak dikabari untuk order Menunggu**, karena penjaga belum boleh melihat order itu (O11). Ini menyamakan O14 dengan O11.
- **Foto tidak pernah dikirim lewat isi push** (FT11); fotonya dibuka di aplikasi. Foto yang diunggah sebelum Selesai tidak butuh push sendiri karena tercakup push status. Penggantian foto tidak mengirim push baru **(bawaan)**.
- **Owner tidak dikabari** soal perubahan status pengerjaan (Diproses dan seterusnya); owner melihatnya di layar Semua Order. **(bawaan)**
- **Mundur satu langkah** (koreksi salah pencet, `order.md` O10) **tidak mengirim push** ke customer **(bawaan)**; status di aplikasi mengikuti.
- Kejadian di luar tabel ini (misalnya menu Tersedia/Habis berubah) **tidak mengirim push** (MN7).

### 4.2 Penyegaran data tanpa polling

| Kapan data diambil                              | Catatan                                                   |
| ----------------------------------------------- | --------------------------------------------------------- |
| Layar daftar atau detail dibuka                 | Selalu.                                                   |
| Aplikasi kembali ke layar (dari latar belakang) | Dibatasi NT10.                                            |
| Push masuk saat aplikasi terbuka                | `sw.js` memberi tahu aplikasi, lalu aplikasi menyegarkan. |
| Tombol **Segarkan**                             | Ada di semua layar daftar.                                |

Tidak ada penyegaran berkala. Tanda **"Catatan baru"** di kartu order hilang setelah catatan dibaca (`catatan_dibaca`).

### 4.3 Komponen

| Komponen                     | Isi                                                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kunci VAPID                  | Dibuat sekali; publik di `config.js`, privat di dashboard (NT7).                                                                                   |
| Tabel `langganan_push`       | Skema di `database.md`. RLS aktif tanpa policy; hak minimal, tanpa DELETE.                                                                         |
| Aksi `kedai`                 | `push_daftar` (simpan langganan perangkat, dengan batas NT5) dan `push_nonaktifkan` (matikan langganan perangkat itu, juga dipanggil saat Keluar). |
| Pengirim push di `kedai`     | Dipanggil setelah aksi order berhasil, sesuai tabel 4.1. Pustaka push dengan **versi dipatok**.                                                    |
| `sw.js`                      | Penanganan push masuk dan notifikasi ditekan (NT8). Berkas JS notifikasi baru didaftarkan di cache.                                                |
| Berkas JS dan CSS notifikasi | Tombol "Aktifkan notifikasi" dan ajakan lembut (NT6), penyegaran saat kembali ke layar (NT10), tombol Segarkan.                                    |

---

## 5. Urutan pekerjaan (untuk TODO sheet, prefix NTF)

Langkah ⚠️ butuh penjelasan dampak dan "OK" ketua.

1. **NTF.01 ⚠️** Pasangan kunci VAPID: dibuat dengan panduan penuh; privat hanya di dashboard, publik masuk `config.js`.
2. **NTF.02 ⚠️** Migration: tabel `langganan_push` dan baris `pengaturan` `push_maks_perangkat`, hak minimal, RLS. Cek hak `service_role` setelahnya.
3. **NTF.03 ⚠️** Aksi `kedai`: `push_daftar` dan `push_nonaktifkan`, dengan cek token dan batas perangkat.
4. **NTF.04 ⚠️** `sw.js`: penanganan push dan notifikasi ditekan. Hasil benar: notifikasi muncul saat aplikasi ditutup, ditekan membuka detail order.
5. **NTF.05** Tombol "Aktifkan notifikasi" di menu Akun dan ajakan setelah order pertama (NT6); `push_nonaktifkan` saat Keluar.
6. **NTF.06 ⚠️** Pengirim push di `kedai`, **per kejadian di tabel 4.1**, dipasang bertahap mengikuti pekerjaan `order.md` (order baru, setujui/tolak, status, catatan, batal, foto).
7. **NTF.07** Penyegaran: saat kembali ke layar (dengan batas NT10), saat push masuk, tombol Segarkan, tanda "Catatan baru".
8. **NTF.08** Sesi tes notifikasi (dokumen `notifikasi-test.md` dibuat di sesi tes): di Android; isi push tanpa data pribadi (SEC-22); langganan akun lain tidak bisa disentuh (SEC-25); kuota panggilan.

---

## 6. Aturan yang paling sering terlanggar

| Aturan                                                              | Akibat bila dilanggar                                                         |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Isi push memuat nama, alamat, nomor WA, isi catatan, atau nama menu | Data pribadi muncul di layar kunci dan lewat pihak ketiga (SEC-22).           |
| Foto dikirim lewat isi push                                         | Foto pribadi terbuka di layar kunci; fotonya hanya dibuka di aplikasi (FT11). |
| Kunci privat VAPID di repo, md, chat, atau `config.js`              | Repo public: siapa pun bisa mengirim push palsu; kunci harus diganti.         |
| Mengirim push ke penjaga untuk order Menunggu                       | Penjaga melihat sinyal tentang order yang tidak boleh ia lihat (O11).         |
| Polling atau timer yang menyegarkan data terus-menerus              | Kuota panggilan free tier cepat habis (NT3).                                  |
| Menghapus baris langganan push                                      | Melanggar "tanpa DELETE"; nonaktifkan saja (NT5).                             |
| Kegagalan push menggagalkan aksi (setujui, ubah status)             | Order macet hanya karena notifikasi gagal terkirim.                           |
| Meminta izin notifikasi langsung saat membuka aplikasi              | Pengguna menolak sebelum paham gunanya, lalu notifikasi mati selamanya.       |
| Mengubah `sw.js` tanpa "OK" ketua                                   | HP bisa menyimpan versi rusak (`fondasi.md` bagian 7).                        |
| Berkas JS notifikasi tidak didaftarkan di cache `sw.js`             | Aplikasi offline setengah rusak.                                              |

---

## 7. Dampak dan pembatalan

- **Migration langganan:** tabel baru, tidak menyentuh data lain. Bisa dibatalkan dengan SQL pembatalan tertulis di repo.
- **`sw.js` salah:** HP bisa menyimpan versi rusak; perbaiki dan push ulang (network first mengurangi risiko).
- **Kunci VAPID diganti:** semua langganan lama tidak berlaku; pengguna perlu mengaktifkan notifikasi lagi.
- **Pengirim push salah kirim ke orang yang keliru:** perbaiki aturan penerima dan deploy ulang `kedai`; push yang sudah terkirim tidak bisa ditarik.
- **Push tidak sampai:** order dan status tetap benar karena data diambil dari server saat aplikasi dibuka (NT12).

---

## 8. Ditunda

- Pengingat otomatis (misalnya order menggantung).
- Push saat menu tersedia lagi (`menu.md` bagian 8).
- Pengaturan per jenis notifikasi dan jam tenang.
- Notifikasi lewat WA atau email.
- Dukungan iPhone yang lebih dalam (di luar batasan iOS 16.4 dan layar utama).

---

## 9. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

_(belum ada blok)_

### 2026-11-08: Push untuk batal oleh owner dan alih hari

**Berkas tujuan:** `docs/notifikasi.md` bagian 9 (tempel paling bawah). Sumber: keputusan ketua lewat PIC 8 Nov 2026, lihat blok "Owner boleh membatalkan setelah Disetujui, dan aksi Alih hari" di `docs/order.md`. Yang paling akhir menang.

**Menambah tabel 4.1** (tabel 4.1 lama tetap berlaku untuk kejadian lain):

| Kejadian                                             | Penerima                     | Teks push (contoh)                                                                                               |
| ---------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Owner membatalkan order yang sudah Disetujui ke atas | Customer pemilik dan penjaga | Customer: "Pesananmu dibatalkan. Buka aplikasi untuk detailnya." Penjaga: "Order #N dibatalkan."                 |
| Owner mengalihkan hari (alih hari)                   | Customer pemilik dan penjaga | Customer: "Pesananmu dialihkan ke besok. Buka aplikasi untuk detailnya." Penjaga: "Order #N dialihkan ke besok." |

**Ditegaskan:**

- Baris "Customer membatalkan order (saat Menunggu) → Owner" kini **keputusan ketua**, bukan lagi (bawaan). Penjaga tidak dikabari untuk batal saat Menunggu (O11, O14).
- **Alasan batal atau alih hari tidak masuk isi push** (NT2); dibaca di aplikasi, seperti alasan tolak.
- **Alih hari tetap mengirim push** meskipun status kembali ke Disetujui: ini bukan "mundur satu langkah" (catatan 4.1, O10), yang tetap tanpa push.
- **Order wakil (O15):** pemesan tanpa akun tidak dikabari; hanya penjaga yang dapat push. Pelaku (owner) tidak dikabari atas aksinya sendiri.
- **Tag per order (NT9)** tetap: push batal atau alih menggantikan notifikasi lama untuk order yang sama.
- **Pengecualian NT8:** notifikasi batal yang ditekan **penjaga membuka Antrean**, bukan detail order, karena order Dibatalkan tidak bisa dibuka penjaga (404). Untuk customer dan owner, tetap membuka detail order. Perubahan penanganan di `sw.js` ini butuh "OK" ketua (NTF.04).
- Penjaga tidak mendapat penjelasan di aplikasi; penjelasan lewat WA (keputusan ketua).

**Dampak pada langkah kerja:** NTF.06 memasang dua kejadian baru ini setelah aksinya ada (`order_batal` di ORD.04, `order_alih_hari` di ORD.07); sebelum itu order berjalan tanpa push (bag. 3). NTF.04 memuat pengecualian NT8; NTF.08 memuat tes: isi push tanpa data pribadi, penjaga menekan push batal membuka Antrean, order wakil tidak mengirim push ke customer.

**Belum beres:** teks push di atas contoh, boleh disesuaikan ketua. Bila push untuk penjaga ternyata dirasa mengganggu, cukup hapus baris penjaga di tabel (alasan belum tercatat).

### 2026-11-09: Tanda "Catatan baru" digeser dari ORD.10 ke NTF.07

**Berkas tujuan:** `docs/notifikasi.md` bagian 9 (tempel paling bawah). Sumber: keputusan ketua lewat PIC, 9 Nov 2026, sesi ORD.10. Yang paling akhir menang.

**Keputusan (ketua):**

- Tanda **"Catatan baru" di kartu order tidak dikerjakan di ORD.10**. ORD.10 dikerjakan tanpa tanda: catatan tampil di detail order (customer, owner, penjaga) dan customer serta owner bisa menambah catatan (O12). Alasan ketua: tanda tanpa push belum berguna di tahap ini, karena daftar hanya dimuat saat layar dibuka, kembali ke layar, atau Segarkan (bag. 4.2).
- Tanda dikerjakan di **NTF.07**, **bersamaan dengan pengirim push catatan di NTF.06** (O14, tabel 4.1 baris catatan baru), supaya urutannya lengkap: push bunyi, orang membuka aplikasi, tanda menunjukkan order yang mana.

**Yang perlu diingat saat NTF.07:**

- `order_daftar` dan `order_detail` belum membawa penunjuk baca milik pemanggil (Handoff #17 dan #19 di `docs/order.md`), jadi tanda butuh perubahan **fungsi SQL** (⚠️, "OK" ketua). Perkiraan penulis, belum dicek di SQL-nya: cukup mengubah `order_daftar`, sedangkan `order_detail` kemungkinan tidak perlu disentuh. Bila `order_detail` tetap diubah, berangkat dari `20261109_03_order_detail_pembatal.sql` (versi aktif).
- Aksi `catatan_dibaca` sudah ada (ORD.09); layar customer dan owner memanggilnya saat detail dibuka, sehingga penunjuk baca sudah terisi sejak ORD.10.
- Penjaga: memakai tanda atau tidak **belum diputuskan** (O14 mengabari penjaga untuk order Disetujui ke atas). Putuskan di NTF.07.

**Pertentangan dengan catatan lama:** langkah 10 di `docs/order.md` bagian 5 (ORD.10 "dan tanda 'Catatan baru' di kartu order") tidak berlaku lagi untuk bagian tanda; tanda ada di NTF.07.
