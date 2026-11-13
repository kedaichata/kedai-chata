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

### 2026-11-11: Kotak masuk (INB) mendahului push; tanda "Catatan baru" dibatalkan

Keputusan ketua (sesi strategi 11 Nov 2026). Sumber: docs/inbox.md. Yang paling akhir menang.

- **Urutan:** Inbox (INB) dikerjakan **sebelum** push. NTF.01 baru setelah INB selesai dan lulus tes.
- **Tanda "Catatan baru" di kartu order dibatalkan** (menimpa blok 9 Nov di bagian ini, kalimat tentang tanda di bagian 4.2, dan NTF.07 bagian tanda). Diganti item Kotak masuk "Ada catatan baru di order #N.". `order_daftar` tidak perlu diubah. Pertanyaan "penjaga memakai tanda atau tidak" ikut selesai. NTF.07 tinggal: penyegaran saat kembali ke layar (batas NT10), saat push masuk, dan tombol Segarkan.
- **Tabel 4.1 tetap satu-satunya daftar siapa dapat kabar kapan.** Inbox memakainya apa adanya (termasuk tambahan 8 Nov), tanpa tabel kedua. Teks inbox sama dengan teks push (NT2 berlaku).
- **NTF.06 menumpang:** pengirim push dipasang di titik pemanggilan yang sama dengan `inbox_tulis` dan memakai penerima yang sudah dihitung, supaya tidak ada hitungan dobel.
- **Pengecualian NT8 untuk penjaga** (push batal membuka Antrean) hanya untuk push. Item inbox tidak bisa diketuk (IB5).
- **NT12 diperkuat:** Kotak masuk menjadi jalur kabar cadangan bagi yang notifnya diblokir. Mundur satu langkah tetap tanpa kabar (push maupun inbox).

### Handoff #1 | 2026-11-12 | ketua

**Tugas:** NTF.01 (pasangan kunci VAPID). Selesai dan sudah dicentang di sheet.

**File yang diubah:** tidak ada. Tidak ada deploy, commit, atau push.

**Keputusan baru:**

- Pasangan kunci dibuat 12 Nov 2026 di Mac, lewat alat bawaan Node (`crypto`, kurva prime256v1) tanpa internet, bukan `npx web-push`. Alasan: pustaka pihak ketiga harus berversi dipatok (AGENTS.md bagian 3). Alasan ketua selain itu belum tercatat.
- Kunci disimpan di pwd manager ketua (satu tempat dengan token deploy), sebagai dua entri: "ChATA - VAPID kunci PRIVAT (push)" dan "ChATA - VAPID kunci PUBLIK (push)". Adik ketua boleh mengambilnya bila dibutuhkan (alasan ketua selain itu belum tercatat).
- Kunci privat tidak pernah ditempel ke chat. Layar Terminal sudah dibersihkan dan ditutup.
- Akun dummy owner kedua sengaja dibiarkan aktif untuk tes push dengan banyak owner (NTF.08). Alasan: ketua (12 Nov 2026).

**Terbukti (diperiksa di chat, tidak disimpan):** kunci publik yang ditempel ketua dari pwd manager bentuknya benar (87 karakter, diawali "B", hanya karakter base64url, tanpa "="). Kecocokan dengan kunci privatnya belum teruji; baru terbukti saat push pertama terkirim (NTF.06) dan diterima (NTF.04).

**Belum beres:**

- Kunci privat belum dipasang di dashboard Supabase (rahasia fungsi `kedai`); dilakukan di NTF.06, butuh "OK".
- Kunci publik belum masuk `public/config.js`; ikut langkah yang menyentuh `config.js`, butuh "OK".
- Pengingat dari sesi foto: cek jadwal pembersihan jalan sendiri setelah Minggu 15 Nov 2026 02.00 WIB (FTO.07).
- Teks layar Order wakil ("Belum ada notifikasi otomatis ke layar HP") perlu diperbarui saat push sudah jalan.

**Saran giliran berikutnya (NTF.02, ⚠️ butuh penjelasan dampak dan "OK" ketua):**

- Lampirkan AGENTS.md, notifikasi.md (dengan Handoff #1), database.md, security.md, serta `supabase/migrations/20261111_05_inbox.sql` dan `20261111_06_inbox_fungsi.sql` (pola hak, nama, dan pembatal; jangan menebak).
- Isi: migration tabel `langganan_push` dan baris `pengaturan` `push_maks_perangkat` (nilai awal 5), RLS tanpa policy, `service_role` baca/tambah/ubah tanpa DELETE, SQL pembatal tertulis di repo sebelum dijalankan, lalu query cek hak. Nama kolom persis ditetapkan di sesi kode dan dicatat di database.md.
- NTF.06 nanti menumpang titik pemanggilan `tulisInbox` yang sama (IB14), supaya penerima tidak dihitung dua kali.

### Handoff #2 | 2026-11-12 | ketua

**Tugas:** NTF.02 (migration tabel `langganan_push` dan pengaturan `push_maks_perangkat`). Selesai dan siap dicentang di sheet.

**File yang diubah:** tiga berkas baru, tanpa mengubah berkas lama. Sudah di-commit dan di-push ke `main` (12 Nov 2026, commit `f43f84f`):

- `supabase/migrations/20261112_langganan_push.sql`
- `supabase/migrations/20261112_langganan_push_batal.sql`
- `supabase/templates/20261112_langganan_push_cek.sql`

Tidak ada perubahan di `public/`, jadi aplikasi yang tampil tidak berubah. Tidak ada deploy `kedai`.

**Keputusan baru:**

- `endpoint` unik se-tabel (satu HP, satu baris). Bila HP dipakai bergantian dua akun, NTF.03 memindahkan baris ke akun yang sedang login. Alasan ketua selain "ikut rekomendasi penulis" belum tercatat.
- Batas 5 perangkat aktif per akun **dijaga `push_daftar` (NTF.03)**, bukan tabel. Pagar angka 1 sampai 20 untuk `push_maks_perangkat` juga di `push_daftar`.
- Nama kolom persis dicatat di `docs/database.md` bagian 9 (blok 12 Nov 2026). Di sana juga ada koreksi kecil: `push_maks_perangkat` berdasar NT5, bukan NT7.

**Terbukti (diperiksa di chat, tidak disimpan):** migration berhasil tanpa galat; query cek A sampai H cocok semua: RLS aktif, tanpa policy, `service_role` hanya `INSERT, SELECT, UPDATE`, `anon` dan `authenticated` tanpa hak, `push_maks_perangkat` = 5, delapan kolom, enam constraint, tiga indeks.

**Belum beres:**

- `_batal.sql` belum pernah dicoba.
- Kunci privat VAPID belum di dashboard Supabase (dipasang di NTF.06, butuh "OK"); kunci publik belum di `public/config.js` (ikut langkah yang menyentuh `config.js`, butuh "OK"). Tidak berubah dari Handoff #1.
- Pengingat dari Handoff #1 masih berlaku: cek jadwal pembersihan foto jalan sendiri setelah Minggu 15 Nov 2026 02.00 WIB (FTO.07); teks layar Order wakil ("Belum ada notifikasi otomatis ke layar HP") diperbarui saat push sudah jalan.
- **Pertanyaan terbuka untuk NTF.03:** bila akun sudah punya 5 perangkat aktif dan mendaftar perangkat ke-6, apakah **ditolak** dengan pesan jelas, atau perangkat **terlama otomatis dinonaktifkan**? NT5 hanya menulis "maksimal", belum memutuskan. Perlu keputusan ketua sebelum NTF.03 dikode.

**Saran giliran berikutnya (NTF.03, ⚠️ butuh penjelasan dampak dan "OK" ketua):**

- Lampirkan `AGENTS.md`, `notifikasi.md` (dengan Handoff #2), `database.md`, `security.md`, `supabase/functions/kedai/index.ts`, satu berkas kelompok aksi sebagai pola (misalnya `inbox.ts`), dan `supabase/migrations/20261112_langganan_push.sql`.
- Isi: fungsi SQL atomik untuk `push_daftar` (cek batas perangkat, pindah endpoint antar akun, isi atau aktifkan ulang baris) dan `push_nonaktifkan` (hanya langganan milik pemanggil, SEC-25), lalu aksi `kedai` di berkas baru `push.ts` dan sambungan di `index.ts`. Fungsi SQL baru berarti migration baru dan "OK" ketua. Pengirim push tidak termasuk di sini (NTF.06), jadi belum perlu pustaka push.
- Aksi `push_daftar` dan `push_nonaktifkan` untuk semua yang login; token dibaca di server, isian dari aplikasi hanya `endpoint` dan dua kunci.

### 2026-11-12: Perangkat melebihi batas: yang terlama dinonaktifkan

**Berkas tujuan:** `docs/notifikasi.md` bagian 9 (tempel paling bawah, di bawah Handoff #2). Sumber: keputusan ketua, 12 Nov 2026, sesi NTF.02. Yang paling akhir menang.

**Keputusan (ketua):**

- Bila akun sudah punya `push_maks_perangkat` perangkat aktif dan mendaftarkan perangkat baru, `push_daftar` **menonaktifkan perangkat aktif terlama** (`aktif` jadi false, baris tidak dihapus, NT5). Pendaftaran perangkat baru **berhasil**, tidak ditolak.
- Dilakukan dalam satu langkah atomik di fungsi SQL (NTF.03), bersama pendaftaran perangkat baru.
- Ini mempertegas NT5, yang hanya menulis "maksimal" dan tidak menyebut apa yang terjadi di batas itu. Menjawab pertanyaan terbuka di Handoff #2.
- Alasan ketua belum tercatat.

**Yang perlu diingat saat NTF.03 dan NTF.08:**

- Perangkat yang dinonaktifkan tidak diberi tahu dan berhenti menerima push. Kabarnya tetap sampai lewat buka aplikasi dan Segarkan (NT12) serta Kotak masuk.
- **Pilihan penulis, belum dibahas dengan ketua:** "terlama" diukur dari `dibuat_pada`. Baris yang didaftarkan ulang atau dipindah dari akun lain perlu `dibuat_pada` yang diperbarui supaya dihitung terbaru; tanpa itu, HP lama yang baru mendaftar ulang bisa langsung jadi korban berikutnya. Putuskan rincian ini di NTF.03.
- NTF.08 menambah tes: perangkat ke-6 berhasil didaftarkan, yang terlama menjadi nonaktif, jumlah aktif tetap sama dengan batas.

**Pertentangan dengan catatan lama:** hasil benar "ditolak" untuk pendaftaran melebihi batas (SEC-25, `security.md`) tidak berlaku lagi untuk bagian itu; lihat blok bertanggal sama di `docs/security.md` bagian 7.

### Handoff #3 | 2026-11-12 | ketua

**Tugas:** NTF.03 (aksi `kedai` `push_daftar` dan `push_nonaktifkan`, beserta fungsi SQL-nya). Selesai dan sudah dicentang di sheet.

**File yang diubah** (satu commit `3fe3189`, sudah di-push ke `main` 12 Nov 2026):

- `supabase/functions/kedai/index.ts` (hanya tambahan: catatan kepala, 1 import, 1 blok sambungan, 2 `case`; kode lama tidak berubah)
- `supabase/functions/kedai/push.ts` (baru)
- `supabase/migrations/20261112_02_langganan_push_fungsi.sql` (baru)
- `supabase/migrations/20261112_02_langganan_push_fungsi_batal.sql` (baru)
- `supabase/templates/20261112_02_langganan_push_fungsi_cek.sql` (baru)

Migration dijalankan di SQL Editor dan `kedai` di-deploy (sembilan berkas) pada 12 Nov 2026. Tidak ada perubahan di `public/`, jadi tampilan aplikasi tidak berubah. Token deploy sudah dibersihkan dan dashboard sudah logout.

**Keputusan baru:**

- "Terlama" diukur dari `dibuat_pada`, dan `dibuat_pada` diperbarui tiap daftar ulang atau pindah akun (disetujui ketua). Alasan ketua selain itu belum tercatat. Rincian di `docs/database.md` bagian 9 (blok 12 Nov 2026, `push_daftar`).
- **Kontrak aksi untuk NTF.05** (semua yang login; akun selalu dari token, isian lain diabaikan):
  - `push_daftar`: isian `endpoint`, `p256dh`, `auth` (teks dari langganan peramban; `endpoint` maks 2000 dan kunci maks 200 karakter). Balasan `{ ok: true, perangkat_dinonaktifkan: <jumlah> }`. Galat: 400 (isian salah), 403 (akun nonaktif).
  - `push_nonaktifkan`: isian `endpoint`. Balasan selalu `{ ok: true }` bila bentuk isian benar, termasuk bila langganan tidak ada atau milik akun lain. Juga dipanggil saat Keluar.
- **Pilihan penulis, tidak ditolak ketua, alasan belum tercatat:** balasan `push_daftar` memuat jumlah perangkat yang dimatikan; daftar ulang mengosongkan `terakhir_berhasil_pada`; staf nonaktif tetap boleh memanggil `push_nonaktifkan`.

**Terbukti (diperiksa di chat, tidak disimpan):** query cek A sampai E cocok semua (kedua fungsi `SECURITY DEFINER` dengan `search_path` kosong, `EXECUTE` hanya `service_role`, hak tabel `langganan_push` tidak berubah, `push_maks_perangkat` = 5). Deploy `kedai` berhasil di project yang benar. Dengan akun dummy owner, aksi lama (layar order, menu, kotak masuk) tetap jalan.

**Belum beres:**

- **Logika dua aksi baru belum terbukti**, karena belum ada yang memanggilnya (tombol baru ada di NTF.05). Dibuktikan di NTF.08: perangkat ke-6 berhasil dan yang terlama nonaktif; HP yang sama dipakai akun lain dipindah; akun A tidak bisa mematikan langganan akun B (baris akun B tidak berubah); isian salah dibalas 400.
- `_batal.sql` migration ini belum pernah dicoba.
- Dari Handoff #1 dan #2, tidak berubah: kunci privat VAPID belum di dashboard (NTF.06, butuh "OK"); kunci publik belum di `public/config.js` (ikut langkah yang menyentuh `config.js`, butuh "OK"); cek jadwal pembersihan foto jalan sendiri setelah Minggu 15 Nov 2026 02.00 WIB (FTO.07); teks layar Order wakil ("Belum ada notifikasi otomatis ke layar HP") diperbarui saat push sudah jalan.

**Saran giliran berikutnya (NTF.04, ⚠️ menyentuh `sw.js`, butuh penjelasan dampak dan "OK" ketua):**

- Lampirkan `AGENTS.md`, `notifikasi.md` (dengan Handoff #3), `security.md`, `public/sw.js`, dan `public/config.js`.
- Isi: penanganan push masuk dan notifikasi ditekan; pengecualian NT8 untuk penjaga (notifikasi batal yang ditekan penjaga membuka Antrean); tag per order (NT9); bila aplikasi terbuka, push masuk memicu penyegaran. Berkas JS baru wajib didaftarkan di cache `sw.js`.
- Push sungguhan baru bisa diuji penuh setelah NTF.05 (berlangganan) dan NTF.06 (pengirim) ada.
- NTF.06 nanti memakai `push.ts` sebagai pola berkas baru dan menumpang titik pemanggilan `tulisInbox` yang sama (IB14), supaya penerima tidak dihitung dua kali.

### Handoff #4 | 2026-11-12 | RAC

**Berkas tujuan:** `docs/notifikasi.md` bagian 9 (tempel paling bawah, di bawah Handoff #3). Append-only.

**Tugas:** NTF.04 (`sw.js`: penanganan push masuk dan notifikasi ditekan). Bagian `sw.js` selesai dan sudah dicentang di sheet. Butir baru **NTF.04a "Aplikasi membuka layar dari notifikasi"** sudah ditambah di sheet (status Belum).

**File yang diubah** (satu commit `9203343`, sudah di-push ke `main` 12 Nov 2026, "OK" ketua sudah ada):

- `public/sw.js` (kode lama tidak dihapus; cache naik dari `chata-v22` ke `chata-v23`; daftar cache tidak berubah)

Tidak ada migration, tidak ada deploy `kedai`, tidak ada perubahan di `public/` selain `sw.js`.

**Keputusan baru:**

- **Bentuk isi push dari server** (kontrak untuk NTF.06), JSON kecil: `judul`, `isi`, `nomor` (opsional, untuk tag per order), `tujuan` (`"order"` atau `"antrean"`, selain itu dianggap tidak ada), `id` (opsional, id order). Server yang tahu peran penerima, jadi `sw.js` tidak menebak peran. **Pilihan penulis, belum dibahas dengan ketua, alasan belum tercatat.**
- Isi kosong, bukan JSON, atau rusak: tampil teks umum ("Kedai ChATA" / "Ada kabar baru di Kedai ChATA."). Teks dipotong (judul 60, isi 160 karakter).
- Tag per order hanya dipasang bila `nomor` ada (NT9); notifikasi baru menggantikan yang lama dan tetap berbunyi.
- Push masuk saat aplikasi terbuka: halaman diberi pesan `{jenis: "segarkan"}`, lalu notifikasi tetap tampil (NT8). Pesan dikirim ke semua halaman aplikasi yang terbuka, bukan hanya yang terlihat (pilihan penulis).
- Notifikasi ditekan, aplikasi terbuka: halaman difokuskan dan diberi pesan `{jenis: "buka", tujuan, id}`. Aplikasi tertutup: dibuka lewat alamat `?buka=order&id=...` atau `?buka=antrean`. `id` hanya huruf, angka, strip, garis bawah (maks 64).
- Pengecualian NT8 untuk penjaga (push batal membuka Antrean) dijalankan lewat `tujuan: "antrean"` yang **dikirim server**; `sw.js` hanya meneruskan.

**Terbukti (diperiksa di chat, tidak disimpan; Brave desktop, simulasi tombol Push di DevTools, data dummy):** push masuk menampilkan notifikasi, termasuk saat tab ditutup; isi rusak (`halo`) jadi teks umum; `nomor` sama menyisakan satu notifikasi (`getNotifications`); pesan `segarkan` dan `buka` (tujuan dan id utuh) sampai ke halaman; saat aplikasi tertutup, jendela aplikasi terbuka dengan `location.search` = `?buka=antrean`. Aplikasi terpasang (PWA) membuka jendela aplikasi, bukan tab biasa.

**Belum beres:**

- **Aplikasi belum membaca `?buka=` dan pesan `buka`**, dan belum mendengarkan pesan `segarkan`. Itu isi NTF.04a. Jadi hasil benar "ditekan membuka detail order" dan "penjaga membuka Antrean" belum tercapai sampai layar.
- Belum diuji: push sungguhan dari server (enkripsi dan kecocokan kunci VAPID; baru terbukti di NTF.06), layar kunci Android (SEC-22), dan tujuan `antrean` dengan akun penjaga sungguhan (NTF.08).
- Dari Handoff #1 sampai #3, tidak berubah: kunci privat VAPID belum di dashboard (NTF.06, butuh "OK"); kunci publik belum di `public/config.js` (ikut langkah yang menyentuh `config.js`, butuh "OK"); cek jadwal pembersihan foto jalan sendiri setelah Minggu 15 Nov 2026 02.00 WIB (FTO.07); teks layar Order wakil ("Belum ada notifikasi otomatis ke layar HP") diperbarui saat push sudah jalan; logika `push_daftar` dan `push_nonaktifkan` baru terbukti di NTF.08.
- Catatan lingkungan tes: izin notifikasi Brave di Mac adik ketua dinyalakan untuk tes ini; boleh dimatikan lagi. Brave bisa memblokir layanan push bawaan Google (belum dicek); tes push sungguhan tetap di Android Chrome.

**Saran giliran berikutnya (NTF.04a, kemungkinan menyentuh `akun.js` sehingga butuh penjelasan dampak dan "OK" ketua):**

- Lampirkan `AGENTS.md`, `notifikasi.md` (dengan Handoff #4), `security.md`, `public/sw.js`, `public/kerangka.js`, `public/index.html`, `public/akun.js`, `public/pesanan.js`, `public/orderowner.js`, `public/orderpenjaga.js`.
- Isi: setelah login dan peran dikenal, baca `?buka=` lalu buka layar yang sesuai; dengarkan pesan `buka` (aplikasi sudah terbuka) dan `segarkan` (batas NT10); bersihkan `?buka=` dari alamat setelah dipakai. Peran dan akses tetap diputuskan server: `id` dari alamat atau pesan tidak dipercaya, bila bukan hak pemanggil server membalas 404 atau 403 dan aplikasi menampilkan pesan umum (aturan 2, 5, 9). `tujuan: "antrean"` hanya berarti untuk penjaga.
- Berkas JS baru, bila ada, wajib didaftarkan di cache `sw.js` (butuh "OK").

### Handoff #5 | 2026-11-12 | FREN

**Tugas:** NTF.04a (aplikasi membuka layar dari notifikasi). **Kode selesai ditulis dan lulus uji tiruan, tetapi BELUM dipasang ke repo, BELUM di-push, dan BELUM dites di HP.** Jangan dicentang di sheet sebelum tes Android lulus. PIC berhenti sebelum push karena ada keperluan mendadak; push dilakukan adik ketua atau ketua.

**File yang diubah:**

- **Giliran 1, sudah di-commit lokal (belum push):** commit `697eec7` di `main` (`origin/main` tertinggal 1 commit). Isi: `public/pesanan.js`, `public/orderowner.js`, `public/orderpenjaga.js`, masing-masing ditambah fungsi `siapkanDetail(id)` (owner: `siapkanMasuk` dan `siapkanSemua`). Fungsi ini hanya menyiapkan keadaan layar, tanpa panggilan server.
- **Giliran 2, BELUM masuk repo:** `public/kerangka.js` (utuh, versi baru) dan `public/orderpenjaga.js` (revisi atas commit `697eec7`: ditambah `siapkanDaftar()`). Kedua berkas ada di sesi chat PIC (panel samping). Cara melanjutkan, pilih satu:
  1. Ambil kedua berkas dari sesi chat itu lewat PIC, copas ke `public/`, lalu commit.
  2. Sesi baru: lampirkan `AGENTS.md`, `notifikasi.md` (dengan handoff ini), `public/kerangka.js` dan `public/orderpenjaga.js` terbaru, lalu minta giliran 2 dibuat ulang dari ringkasan di bawah.
- Tidak ada perubahan di `sw.js`, `akun.js`, `config.js`, `index.html`, migration, atau `kedai`. Tidak ada berkas JS baru, jadi daftar cache `sw.js` dan versinya tidak perlu diubah. Tidak ada deploy `kedai`.
- Saat commit giliran 2: **jangan pakai `[skip ci]`** (commit berisi kode; aturan ketua 12 Nov, blok di `AGENTS.md`).

**Keputusan baru:**

- **Alasan belum tercatat, disetujui PIC:** saat pesan `segarkan` masuk, aplikasi memuat ulang **data layar yang sedang terbuka saja** (1 panggilan, tanpa layar "memuat" penuh), bukan meniru tombol Segarkan penuh. Arahan ketua tentang hemat panggilan free tier.
- Giliran 1 dan 2 di-commit lokal per giliran, **push sekali setelah giliran 2**, dengan cek anti-nyasar (folder, `git remote -v`, email commit terakhir; semuanya milik ketua).
- **Pilihan penulis, belum dibahas dengan ketua, alasan belum tercatat:**
  - Notifikasi order untuk **owner membuka Order Masuk** (bukan Semua Order), karena push owner kebanyakan order baru. Detail order berstatus apa pun tetap bisa dibuka di sana; tombol Kembali kembali ke daftar Menunggu.
  - `segarkan` di dalam batas 30 detik (NT10) **tidak dibuang**: dijadwalkan **satu** penyegaran susulan di akhir batas (bukan timer berulang), supaya push yang datang di dalam batas tidak membuat layar usang.
  - Push yang masuk saat aplikasi di latar belakang hanya menandai; disegarkan **sekali** saat aplikasi kembali ke layar.
  - Hanya layar order yang disegarkan (Pesanan Saya, Order Masuk, Semua Order, Antrean). Home dan tab lain tidak, karena tab lain memuat sendiri saat dibuka.
- Ringkasan kontrak giliran 2 (bila dibuat ulang): `kerangka.js` membaca `?buka=` saat dimuat dan memakainya **sekali** setelah login dan peran dikenal (`atur`), lalu membuang `?buka=` dan `id` dari alamat; mendengarkan pesan `buka` dan `segarkan` dari `sw.js`; tujuan customer = Pesanan Saya, owner = Order Masuk, penjaga = Antrean (`tujuan: "antrean"` memakai `siapkanDaftar`, `tujuan: "order"` dengan id memakai `siapkanDetail`); tujuan yang tidak cocok peran diabaikan; `id` hanya dicek bentuknya (huruf, angka, strip, garis bawah, maks 64), server yang memutuskan akses (404 atau 403, pesan umum); Keluar membuang tujuan tertunda dan timer.
- `siapkanDaftar()` ditambah karena tanpa itu penjaga yang sedang membuka detail satu order akan tetap di detail itu saat menekan push Antrean (pengecualian NT8).

**Terbukti (diperiksa di chat, tidak disimpan):** sintaks kelima berkas lolos; tidak ada baris lama yang hilang (satu baris `return` di `orderowner.js` diganti, versi lama disimpan sebagai komentar); 21 skenario dengan DOM tiruan lulus (tiga peran, alamat dan pesan, id jahat, sebelum login, batas 30 detik dan burst, latar belakang, Keluar). **Ini bukan pengganti tes di production.**

**Belum beres:**

- Giliran 2 belum dipasang dan belum di-push (lihat atas). Tes manual setelah push, Android, akun dummy:
  1. Aplikasi ditutup, tekan push order (customer atau owner): detail order terbuka, alamat tidak lagi memuat `?buka=`.
  2. Aplikasi terbuka, tekan push: pindah ke detail order.
  3. Penjaga menekan push batal: masuk ke daftar Antrean, bukan detail; coba juga saat penjaga sedang membuka detail order lain.
  4. Id order milik orang lain: pesan umum, tidak ada data tampil.
  5. Tab Network: 1 panggilan data per ketukan, bukan 2.
- Push sungguhan dari server belum ada (NTF.06). Tes sekarang memakai simulasi tombol Push di DevTools dengan isi `{"judul":"x","isi":"y","tujuan":"order","id":"<id order dummy>","nomor":1}`.
- `inbox.js` belum dilihat di sesi ini. Perilaku bila overlay Kotak masuk sedang terbuka saat push ditekan belum teruji; layak dites sekali.
- Penyegaran saat kembali ke layar secara umum dan tombol Segarkan tetap NTF.07, tidak disentuh.
- Dari Handoff #1 sampai #4, tidak berubah: kunci privat VAPID belum di dashboard (NTF.06, butuh "OK"); kunci publik belum di `public/config.js` (ikut langkah yang menyentuh `config.js`, butuh "OK"); cek jadwal pembersihan foto jalan sendiri setelah Minggu 15 Nov 2026 02.00 WIB (FTO.07); teks layar Order wakil ("Belum ada notifikasi otomatis ke layar HP") diperbarui saat push sudah jalan; logika `push_daftar` dan `push_nonaktifkan` baru terbukti di NTF.08.
- Pengingat pencatatan: blok aturan `[skip ci]` untuk `AGENTS.md` sudah didraft (disetujui ketua), tinggal ditempel.

**Saran giliran berikutnya:**

- **Pertama, selesaikan NTF.04a:** pasang dua berkas giliran 2, commit tanpa `[skip ci]`, push dengan cek anti-nyasar, tes Android, lalu centang NTF.04a di sheet bila semua lulus. Tidak butuh "OK" ketua karena tidak menyentuh `akun.js`, `sw.js`, atau `config.js`.
- **Berikutnya NTF.05** (tombol "Aktifkan notifikasi" di menu Akun, ajakan setelah order pertama, `push_nonaktifkan` saat Keluar; ⚠️ High-Risk, kemungkinan menyentuh `config.js` dan `akun.js`, butuh penjelasan dampak dan "OK" ketua). Lampirkan `AGENTS.md`, `notifikasi.md` (dengan Handoff #3 sampai #5), `security.md`, `public/akun.js`, `public/akunmenu.js`, `public/config.js`, `public/sw.js`, `public/kerangka.js`, `public/pesan.js`, `public/index.html`. Kontrak aksi `push_daftar` dan `push_nonaktifkan` ada di Handoff #3.

### Handoff #6 | 2026-11-12 | RAC

**Tugas:** melanjutkan NTF.04a (aplikasi membuka layar dari notifikasi) dari Handoff #5. Kode giliran 2 sudah dipasang dan online. **Tes belum dijalankan, jadi NTF.04a belum dicentang di sheet.**

**File yang diubah** (sudah di-push ke `main` 12 Nov 2026):

- Commit `f064002` (kode, tanpa `[skip ci]`): `public/kerangka.js` (utuh, versi baru) dan `public/orderpenjaga.js` (ditambah `siapkanDaftar()`). Bersama commit `697eec7` (giliran 1) ikut terkirim. Penerbitan Pages run #105 hijau.
- Commit `959715f` (docs murni, `[skip ci]`): `AGENTS.md` (blok aturan `[skip ci]`) dan `docs/notifikasi.md` (Handoff #5).

Tidak ada perubahan di `sw.js`, `akun.js`, `config.js`, `index.html`, migration, atau `kedai`. Tidak ada deploy `kedai`. Cek anti-nyasar (folder, `git remote -v`, email commit) sudah dilakukan sebelum tiap push dan semuanya milik ketua.

**Keputusan baru:**

- Keputusan ketua (12 Nov 2026, lewat RAC, via telepon): bukti tes dari Brave atau Chrome desktop boleh dianggap mewakili Android untuk semua tes (bukan hanya NTF.04a). Alasan ketua: ingin rilis cepat karena sudah ditunggu owner; bila perilaku di Android ternyata berbeda, diperbaiki di versi 2. NTF.04a tetap harus dites dan tidak dicentang sebelum lulus.
- **Pertentangan dengan catatan lama:** `AGENTS.md` bagian 10 butir 7 ("Push dites di Android") dan NTF.08 ("di Android") tidak berlaku lagi untuk hal ini; yang paling akhir menang. Bukti tetap diperiksa bersama di chat dan tidak disimpan (bagian 10 butir 2). Ketua belum memutuskan apakah `AGENTS.md` perlu blok pengganti.
- Keputusan ini hanya soal **perangkat uji**: tes penjaga, layar kunci (SEC-22), dan push sungguhan dari server tetap wajib ada bukti, tetapi buktinya boleh dari Brave/Chrome desktop.
- Pilihan RAC, belum dibahas dengan ketua, alasan belum tercatat: tes NTF.04a memakai simulasi tombol Push di DevTools sambil menunggu NTF.06.

**Terbukti (diperiksa di chat, tidak disimpan):** push berhasil, commit tampil di `origin/main`, Actions run #105 hijau. Perilaku aplikasi di layar **belum teruji**; hanya uji tiruan 21 skenario dari Handoff #5.

**Belum beres:**

- **Tes NTF.04a (Brave/Chrome desktop, akun dummy):**
  1. Aplikasi ditutup, tekan push order: detail order terbuka, alamat tidak lagi memuat `?buka=`.
  2. Aplikasi terbuka, tekan push: pindah ke detail order.
  3. Penjaga menekan push batal: masuk daftar Antrean, bukan detail; coba juga saat sedang membuka detail order lain.
  4. Id order milik orang lain: pesan umum, tidak ada data tampil.
  5. Tab Network: 1 panggilan data per ketukan, bukan 2.
     Isi push tiruan: `{"judul":"x","isi":"y","tujuan":"order","id":"<id order dummy>","nomor":1}`. Centang NTF.04a hanya bila kelimanya lulus.
- `inbox.js`: perilaku bila overlay Kotak masuk terbuka saat push ditekan belum teruji.
- Dari Handoff #1 sampai #5, tidak berubah: kunci privat VAPID belum di dashboard (NTF.06, butuh "OK"); kunci publik belum di `public/config.js` (butuh "OK"); cek jadwal pembersihan foto jalan sendiri setelah Minggu 15 Nov 2026 02.00 WIB (FTO.07); teks layar Order wakil diperbarui saat push sudah jalan; logika `push_daftar` dan `push_nonaktifkan` baru terbukti di NTF.08.

**Saran giliran berikutnya:**

- **Pertama:** jalankan tes NTF.04a di atas, periksa buktinya bareng di chat, lalu centang NTF.04a bila lulus.
- **Berikutnya NTF.05** (⚠️ High-Risk, kemungkinan menyentuh `config.js` dan `akun.js`, butuh penjelasan dampak dan "OK" ketua; bila yang bertugas bukan ketua, AI membuat ringkasan untuk diteruskan lewat WA). Lampirkan `AGENTS.md`, `notifikasi.md` (dengan Handoff #3 sampai #6), `security.md`, `public/akun.js`, `public/akunmenu.js`, `public/config.js`, `public/sw.js`, `public/kerangka.js`, `public/pesan.js`, `public/index.html`. Kontrak aksi `push_daftar` dan `push_nonaktifkan` ada di Handoff #3.

### Handoff #7 | 2026-11-13 | FREN

**Tugas:** tes NTF.04a (aplikasi membuka layar dari notifikasi), melanjutkan Handoff #5 dan #6. Kelima tes lulus dan NTF.04a sudah dicentang di sheet.

**File yang diubah:** tidak ada. Tidak ada commit, push, migration, atau deploy `kedai`.

**Keputusan baru:** tidak ada. Perangkat uji Brave desktop, sesuai keputusan ketua di Handoff #6.

**Terbukti (diperiksa di chat, tidak disimpan; Brave desktop, akun dummy):**

1. Aplikasi ditutup, notifikasi order ditekan: aplikasi terbuka langsung di detail order, alamat bersih tanpa `?buka=`.
2. Aplikasi terbuka, notifikasi ditekan: pindah ke detail order di tab yang sama, tanpa tab baru.
3. Penjaga menekan notifikasi `tujuan: "antrean"`: masuk daftar Antrean, baik dari beranda maupun saat sedang membuka detail order lain.
4. Penjaga menekan notifikasi ke order Menunggu (bukan haknya): server membalas 404, layar hanya "Pesanan tidak ditemukan.", tidak ada data order tampil.
5. Satu ketukan menghasilkan satu panggilan data `kedai` (1 fetch). Baris kedua di Network adalah preflight CORS (204), bukan panggilan Edge Function.

**Catatan cara tes (untuk sesi tes berikutnya):**

- Tes 1 sampai 4 memakai `self.registration.showNotification(...)` dari Console jendela Inspect service worker. Itu menguji handler **klik** dan pembukaan layarnya. Handler **push** (isi JSON jadi notifikasi) terbukti di Handoff #4.
- Jendela Inspect dibuka lewat DevTools, Application, Service workers, "See all registrations", entri `kedaichata.github.io`, Inspect.
- Memicu push dari Console lewat `new PushEvent(...)` tidak bisa: browser menolak `waitUntil` pada event buatan tangan. Itu batasan browser, bukan galat `sw.js`.
- Notifikasi dari tombol Push DevTools ternyata dibuat dan muncul di layar Mac (2 tercatat lewat `getNotifications`), hanya tidak terlihat saat ditekan.

**Belum beres:**

- Perilaku overlay Kotak masuk (`inbox.js`) saat notifikasi ditekan belum teruji.
- Push sungguhan dari server belum ada (NTF.06): enkripsi dan kecocokan pasangan kunci VAPID baru terbukti di sana.
- Tes id order milik customer lain (bukan penjaga) belum terpisah; masuk NTF.08. Layar kunci (SEC-22) juga NTF.08.
- Dari Handoff #1 sampai #6, tidak berubah: kunci privat VAPID belum di dashboard (NTF.06, butuh "OK"); kunci publik belum di `public/config.js` (butuh "OK"); cek jadwal pembersihan foto jalan sendiri setelah Minggu 15 Nov 2026 02.00 WIB (FTO.07); teks layar Order wakil ("Belum ada notifikasi otomatis ke layar HP") diperbarui saat push sudah jalan; logika `push_daftar` dan `push_nonaktifkan` baru terbukti di NTF.08.

**Saran giliran berikutnya:**

- **NTF.05** (⚠️ High-Risk, kemungkinan menyentuh `config.js` dan `akun.js`, butuh penjelasan dampak dan "OK" ketua; bila yang bertugas bukan ketua, AI membuat ringkasan untuk diteruskan lewat WA).
- Lampirkan `AGENTS.md`, `notifikasi.md` (dengan Handoff #3 sampai #7), `security.md`, `public/akun.js`, `public/akunmenu.js`, `public/config.js`, `public/sw.js`, `public/kerangka.js`, `public/pesan.js`, `public/index.html`.
- Kontrak aksi `push_daftar` dan `push_nonaktifkan` ada di Handoff #3.
- Commit yang hanya berisi docs/md boleh memakai `[skip ci]`; commit yang menyentuh kode tidak.

### Handoff #8 | 2026-11-13 | ketua

**Tugas:** NTF.05 (tombol "Aktifkan notifikasi" di Home dan `push_nonaktifkan` saat Keluar). Selesai dan sudah dicentang di sheet. Butir baru **NTF.05a** (ajakan setelah order pertama) sudah ditambah ke sheet.

**File yang diubah** (satu commit `aa70704`, sudah di-push ke `main` 13 Nov 2026, tanpa `[skip ci]`; "OK" ketua sudah ada):

- `public/notif.js` (baru)
- `public/index.html` (satu blok tombol di bawah Bantuan, satu `<script>`)
- `public/akun.js` (hanya `keluar()`: memanggil `KedaiNotif.nonaktifkan()` sebelum `signOut`, dan `KedaiNotif.reset()` di `selesai`; baris `signOut` lama dijadikan komentar)
- `public/config.js` (ditambah `VAPID_PUBLIC_KEY`, kunci publik saja)
- `public/sw.js` (`notif.js` didaftarkan di cache; `chata-v23` jadi `chata-v24`)

Tidak ada migration dan tidak ada deploy `kedai`.

**Keputusan baru (ketua, 13 Nov 2026; yang paling akhir menang):**

- **Tombol "Aktifkan notifikasi" ada di Home, tepat di bawah Bantuan, untuk semua peran.** Menggantikan NT6 ("menu Akun" dan ajakan staf di layar utama). Alasan ketua selain yang dibahas (Home sudah jadi pintu utama sejak HOM.01) belum tercatat.
- **Ajakan lembut setelah order pertama dipindah ke NTF.05a**, dikerjakan setelah NTF.06. Alasan: sebelum NTF.06 server belum mengirim push, jadi ajakan menjanjikan hal yang belum terjadi; dan `pesan.js` (alur order yang dipakai nyata) tidak disentuh di NTF.05. Menimpa bagian "ajakan setelah order pertama" di langkah NTF.05 (bagian 5).
- **Tombol tetap dirilis di NTF.05** meski push dari server baru jalan di NTF.06. Langganan tersimpan lebih awal; selama jeda, penekan tombol belum menerima apa-apa.
- Draft isi sheet NTF.05a disiapkan AI atas permintaan ketua (pengecualian AGENTS.md aturan 3 dan 8).
- **Pilihan penulis, tidak ditolak ketua, alasan belum tercatat:** setelah aktif tombol hilang (bukan jadi "Matikan"); tombol juga tidak tampil bila peramban tidak mendukung push atau izin diblokir. Penanda "sudah aktif" di `localStorage` kunci `chata_notif_aktif` (nilai "1", tanpa data pribadi, per perangkat bukan per akun), dihapus saat Keluar. `nonaktifkan()` dibatasi sekitar 3 detik dan kegagalannya tidak menahan Keluar. Langganan di peramban tidak di-unsubscribe saat Keluar (dipakai ulang akun berikutnya); yang dinonaktifkan adalah barisnya di server.

**Terbukti (diperiksa di chat, tidak disimpan; Brave desktop mode biasa, akun dummy, query baca-saja):**

1. Tombol tampil, izin, berlangganan, `push_daftar`: satu baris `langganan_push` aktif.
2. Keluar: barisnya tetap ada, `aktif` jadi false (tanpa DELETE).
3. Masuk lagi: tombol tampil lagi; menekannya mengaktifkan barisnya dan memperbarui `dibuat_pada`.
4. Keluar saat offline: tidak tersangkut; baris tetap aktif karena server tidak terjangkau (wajar).
5. Pindah akun di HP yang sama (akun dummy kedua): tetap satu baris, `akun` berganti, `aktif = true`, `dibuat_pada` lebih baru.

Ikut terbukti: Brave bisa berlangganan push tanpa pengaturan tambahan.

**Belum beres:**

- Jumlah panggilan `push_nonaktifkan` di tab Network belum diperiksa (hasil database sudah membuktikan aksinya jalan).
- Dari Handoff #3, masuk NTF.08: perangkat ke-6 (yang terlama nonaktif); akun A tidak bisa mematikan langganan akun B (SEC-25); isian salah dibalas 400.
- Kecocokan pasangan kunci VAPID (publik di `config.js`, privat di pwd manager) baru terbukti saat push pertama terkirim (NTF.06) dan diterima.
- Kunci privat VAPID belum di dashboard Supabase (NTF.06, butuh "OK").
- Bila sesi habis tanpa lewat Keluar lalu akun lain masuk di HP yang sama, penanda tombol bisa tertinggal: tombol tidak tampil dan HP masih mengirim ke akun lama sampai ada yang menekan tombol atau Keluar. Dibiarkan; dicatat bila ternyata sering terjadi.
- Cek jadwal pembersihan foto jalan sendiri setelah Minggu 15 Nov 2026 02.00 WIB (FTO.07).
- Teks layar Order wakil ("Belum ada notifikasi otomatis ke layar HP") diperbarui saat push sudah jalan.
- Catatan lingkungan: tes awal sempat di mode incognito sehingga izin terblokir (bukan galat aplikasi); izin Brave mode biasa di Mac adik ketua aktif untuk tes. Baris langganan terakhir milik akun dummy kedua masih `aktif = true` di database.

**Saran giliran berikutnya (NTF.06, ⚠️ High-Risk, butuh penjelasan dampak dan "OK" ketua; bila yang bertugas bukan ketua, AI membuat ringkasan untuk diteruskan lewat WA):**

- Lampirkan `AGENTS.md`, `notifikasi.md` (dengan Handoff #3 sampai #8), `database.md`, `security.md`, `supabase/functions/kedai/index.ts`, `push.ts`, `inbox.ts`, berkas yang memanggil `tulisInbox` (titik pemasangan, IB14), dan `public/sw.js`.
- Isi: kunci privat VAPID dipasang di dashboard (rahasia fungsi `kedai`, tidak lewat chat); pustaka push dengan versi dipatok; pengirim push di titik pemanggilan `tulisInbox` yang sama, per kejadian tabel 4.1, dengan bentuk isi push dari Handoff #4 (`judul`, `isi`, `nomor`, `tujuan`, `id`). Satu kali coba, kegagalan tidak membatalkan aksi (NT4). Dipasang bertahap per kejadian.
- Setelah NTF.06: **NTF.05a** (menyentuh `pesan.js`).
- Commit yang hanya berisi docs/md boleh memakai `[skip ci]`; commit yang menyentuh kode tidak.

### Handoff #9 | 2026-11-13 | ketua

**Tugas:** NTF.06 (pengirim push), baru langkah SQL dan rahasia dashboard. **Kode pengirim belum ditulis.** Belum dicentang di sheet.

**File yang diubah** (satu commit `154d9a4`, sudah di-push ke `main` 13 Nov 2026, tanpa `[skip ci]`):

- `supabase/migrations/20261113_inbox_tulis_penerima.sql` (dan `_batal.sql`)
- `supabase/templates/20261113_inbox_tulis_penerima_cek.sql`
- `AGENTS.md` (blok 13 Nov: pengecualian tulis-database diperluas)

Tidak ada perubahan di `public/` dan tidak ada deploy `kedai`.

**Keputusan baru (ketua, 13 Nov 2026):**

- `inbox_tulis` kini mengembalikan **daftar penerima** (array JSON: `akun`, `teks`, `nomor_order`, `tujuan`) sebagai ganti jumlah baris. Fungsi dibuat ulang; aturan penerima dan teks tidak berubah. Alasan: penerima push tidak dihitung dua kali (IB14).
- Pengecualian tulis-database diperluas ke `push_hasil_catat` (hanya mencatat hasil kirim push; kegagalannya tidak membatalkan aksi, NT4).
- `VAPID_KONTAK` memakai email warung yang sama dengan pengirim email reset password. Alasan ketua selain itu belum tercatat.
- **Pilihan penulis, tidak ditolak ketua, alasan belum tercatat:** tujuan `antrean` (penjaga, `batal_owner`) ditentukan di `inbox_tulis`; batas `push_langganan_ambil` 100 akun dan `push_hasil_catat` 200 id; rancangan kode: `npm:web-push@3.6.7` lewat `import()` dinamis dalam `try/catch`, pengiriman di latar belakang (`EdgeRuntime.waitUntil` bila ada), tahap 1 hanya kejadian `order_baru` lewat daftar kejadian aktif di kode.

**Terbukti (diperiksa di chat, tidak disimpan):**

- Migration sukses di SQL Editor. Cek A sampai F cocok: tiga fungsi (satu per nama, kembalian `jsonb`, `SECURITY DEFINER`, `search_path` kosong); `EXECUTE` hanya `service_role`, tanpa PUBLIC; hak tabel `langganan_push` (`INSERT, SELECT, UPDATE`) dan `inbox` (`INSERT, SELECT`) tidak berubah; ada 1 langganan aktif dari 1 akun.
- Lima rahasia ada di dashboard: `KUNCI_SECRET_KEDAI`, `RAHASIA_PENJADWAL`, `VAPID_PUBLIK`, `VAPID_PRIVAT` (bentuk benar, 43 karakter), `VAPID_KONTAK`. Nilainya tidak pernah ditempel ke chat.

**Belum beres:**

- Kode pengirim: berkas baru `supabase/functions/kedai/kirim_push.ts` dan `inbox.ts` utuh. `index.ts` tidak berubah. Belum deploy `kedai`.
- Kecocokan pasangan kunci VAPID dan kecocokan `web-push` dengan Edge Function baru terbukti saat push pertama terkirim.
- Akun pemilik satu-satunya langganan aktif belum dipastikan berperan owner. Tes `order_baru` butuh owner dummy dengan langganan aktif (bila bukan, aktifkan notifikasi dari akun owner dummy).
- `_batal.sql` belum pernah dicoba. Bila dipakai, deploy `kedai` versi lama dulu.
- Blok `docs/database.md` bagian 9 untuk migration ini belum ditulis.
- Dashboard Supabase perlu di-logout bila belum.
- Dari Handoff #8, tidak berubah: NTF.05a menyusul setelah NTF.06; logika `push_daftar` dan `push_nonaktifkan` baru terbukti di NTF.08; cek jadwal pembersihan foto jalan sendiri setelah Minggu 15 Nov 2026 02.00 WIB (FTO.07); teks layar Order wakil diperbarui saat push sudah jalan; perilaku overlay Kotak masuk saat push ditekan belum teruji.

**Saran giliran berikutnya (NTF.06 lanjutan, ⚠️ High-Risk):**

- Lampirkan `AGENTS.md`, `notifikasi.md` (dengan Handoff #9), `database.md`, `security.md`, `supabase/functions/kedai/index.ts`, `inbox.ts`, dan `push.ts` (pola). Balas "gas" untuk memulai kode.
- Urutan: kode ditulis, disalin ke repo, `kedai` di-deploy (urutan aman `AGENTS.md` bagian 8, tanpa `--no-verify-jwt`), lalu tes `order_baru` dengan akun dummy (customer memesan, owner dummy menerima push). Setelah itu cek `terakhir_berhasil_pada` lewat query baca-saja.
- Commit kode tanpa `[skip ci]`.

<!-- Berkas tujuan: docs/notifikasi.md bagian 9, tempel PALING BAWAH (di bawah Handoff #9). Append-only. -->

### Handoff #10 | 2026-11-13 | ketua

**Tugas:** NTF.06 (pengirim push), lanjutan Handoff #9. Tahap 1 (`order_baru`) selesai dan terbukti. Tahap 2 (`setujui`, `tolak`) sudah di-deploy tetapi **belum dites dan belum di-commit**. Sesi dihentikan di tengah tes karena ketua harus pergi. NTF.06 **belum dicentang** di sheet.

**File yang diubah:**

- **Sudah di-commit dan di-push** (commit `d263e2e`, `main`, 13 Nov 2026, tanpa `[skip ci]`, Actions hijau): `supabase/functions/kedai/kirim_push.ts` (baru) dan `supabase/functions/kedai/inbox.ts` (utuh; `tulisInbox` kini menyerahkan penerima ke pengirim push). `index.ts` tidak berubah.
- **Sudah di-deploy ke `kedai`, BELUM di-commit:** `supabase/functions/kedai/kirim_push.ts` versi tahap 2 (hanya `KEJADIAN_PUSH_AKTIF` ditambah `setujui` dan `tolak`, plus komentar). `git status` terakhir: hanya berkas itu yang berubah. **Kode yang live di server kini berbeda dari repo sampai berkas ini di-commit.**

Tidak ada migration baru. Token deploy sudah dibersihkan dua kali (`[]`).

**Keputusan baru:**

- Tahap 2 dipasang atas arahan ketua ("lanjut tahap 2 sekarang"). Alasan ketua selain itu belum tercatat.
- **Pilihan penulis, belum dibahas dengan ketua, alasan belum tercatat:** TTL push 3600 detik, batas tunggu 8 detik per pengiriman, urgensi normal, `VAPID_KONTAK` otomatis diberi awalan `mailto:` bila belum ada; id order dikirim di isi push hanya untuk tujuan `order`; pengiriman jalan di latar belakang lewat `EdgeRuntime.waitUntil` bila ada.
- Cara menambah kejadian push: cukup menambah nama di `KEJADIAN_PUSH_AKTIF` di `kirim_push.ts`, lalu deploy ulang `kedai`.

**Terbukti (diperiksa di chat, tidak disimpan):**

- Tahap 1, HP owner Android (Brave, dipasang lewat Brave), akun dummy: push `order_baru` terkirim (log `kedai push: order_baru | terkirim 1 | mati 0 | gagal 0`); `terakhir_berhasil_pada` terisi dan cocok dengan jam log (`push_hasil_catat` jalan); notifikasi ditekan membuka **detail order** yang bersangkutan (bukan sekadar daftar); layar kunci hanya "Ada order baru." tanpa data pribadi (SEC-22 lulus untuk `order_baru` saja). Pasangan kunci VAPID cocok dan impor `npm:web-push@3.6.7` jalan di `kedai`.
- Log menunjukkan `terkirim 1` untuk order #81 (09:29:13), #82 (09:36:28), #83 (09:45:23), #84 (09:45:49).
- Deploy tahap 2 berhasil (sepuluh berkas, project yang benar).

**State terakhir (sedang menunggu):**

- Ketua sedang **menunggu notifikasi order baru #83 dan #84 muncul di HP owner**. Server sudah mengirim (log di atas), jadi bila belum muncul, penyebabnya di sisi HP (kemungkinan penghemat baterai Android atau Brave tertidur), bukan kode. Notifikasi pertama (#81) juga sempat telat. Belum dipastikan apakah #83 dan #84 sudah sampai dan berapa lama telatnya.
- Customer dummy aktif di **laptop** (Brave), karena ketua hanya punya satu HP. Langganan push customer itu aktif (query: satu baris `peran` kosong, satu baris `owner`). Penjaga **belum punya** langganan aktif.
- Order uji tahap 2 sudah dibuat dan **belum diapa-apakan**: **#83 (order A, untuk dicoba Setujui)** dan **#84 (order B, untuk dicoba Tolak)**, keduanya Menunggu.

**Belum beres:**

- **Tes tahap 2 belum dijalankan.** Urutan: Brave laptop tetap berjalan (notifikasi macOS untuk Brave aktif); owner (HP) menekan Setujui pada #83, lalu Tolak pada #84. Hasil benar: laptop menerima "Pesananmu sudah disetujui." dan "Pesananmu belum bisa diterima. Buka aplikasi untuk detailnya."; HP owner **tidak** bunyi untuk dua aksi itu (pelaku tidak dikabari); notifikasi yang diklik membuka detail order yang tepat; log `kedai push: setujui | terkirim 1 ...` dan `kedai push: tolak | ...`. Push untuk penjaga (saat Setujui) tidak teruji karena belum ada langganan penjaga; catat sebagai belum teruji.
- **Commit tahap 2 belum dibuat.** Setelah tes lulus: `git add supabase/functions/kedai/kirim_push.ts`, commit **tanpa `[skip ci]`** (isinya kode), cek anti-nyasar (`pwd`, `git remote -v`, email commit terakhir; semuanya milik ketua), baru push. Bila tes gagal dan harus mundur, deploy ulang dari commit `d263e2e`.
- SEC-22 baru terbukti untuk `order_baru`. Baris SEC-22 **jangan dicentang** sebelum kejadian lain dites. Tes di laptop tidak punya layar kunci; yang dicek hanya teks notifikasi.
- Tahap 3 belum dipasang: `status`, `catatan_customer`, `catatan_owner`, `batal_customer`, `batal_owner` (penjaga membuka Antrean), `alih_hari`, `foto_setelah_selesai`, `order_wakil`. Mundur satu langkah tetap tanpa push.
- Blok `docs/database.md` bagian 9 untuk migration 13 Nov (`inbox_tulis` mengembalikan penerima, `push_langganan_ambil`, `push_hasil_catat`) **belum ditulis** (sudah disebut di Handoff #9).
- Hasil `_batal.sql` migration 13 Nov belum pernah dicoba.
- Dari Handoff #8, tidak berubah: NTF.05a (ajakan setelah order pertama, menyentuh `pesan.js`) menyusul setelah NTF.06; logika `push_daftar` dan `push_nonaktifkan` baru terbukti penuh di NTF.08 (perangkat ke-6, akun lain tidak bisa mematikan langganan akun B); perilaku overlay Kotak masuk saat push ditekan belum teruji.
- **Cek jadwal pembersihan foto jalan sendiri setelah Minggu 15 Nov 2026 02.00 WIB (FTO.07).** Jadwal otomatis pertama: Sabtu 14 Nov 2026 pukul 19.00 UTC.
- Teks layar Order wakil ("Belum ada notifikasi otomatis ke layar HP") perlu diperbarui saat kejadian `order_wakil` sudah dipasang.
- Dashboard Supabase dan profil browser ketua: logout dan tutup bila masih terbuka.

**Saran giliran berikutnya:**

1. Lampirkan `AGENTS.md`, `notifikasi.md` (dengan Handoff #3 sampai #10), `database.md`, `security.md`, `supabase/functions/kedai/index.ts`, `inbox.ts`, `kirim_push.ts` (versi tahap 2), dan `push.ts`.
2. Mulai dengan menanyakan hasil notif #83 dan #84 di HP owner. Lalu jalankan tes tahap 2 (Setujui #83, Tolak #84), centang tidak dilakukan, dan commit `kirim_push.ts` setelah lulus.
3. Lanjut tahap 3 bertahap (disarankan `status` dan `catatan` dulu, lalu `batal` dan `alih_hari`, lalu `foto` dan `order_wakil`). Tiap tahap: ubah `KEJADIAN_PUSH_AKTIF`, deploy `kedai` lewat urutan aman bagian 8 (tanpa `--no-verify-jwt`), tes dengan akun dummy. Tahap `batal_owner` perlu tes khusus: penjaga yang menekan notifikasi membuka Antrean (butuh langganan penjaga).
4. Tulis blok `database.md` bagian 9 untuk migration 13 Nov (docs murni, boleh `[skip ci]`), dan tempel Handoff #10 ini (docs murni, boleh `[skip ci]` bila dicommit tersendiri).

<!-- Berkas tujuan: docs/notifikasi.md bagian 9, tempel PALING BAWAH (di bawah Handoff #10). Append-only. -->

### Handoff #11 | 2026-11-13 | ketua

**Tugas:** NTF.06 (pengirim push), lanjutan Handoff #10. Tahap 2 (`setujui`, `tolak`) lulus tes dan tahap 3 sudah dipasang. **Push dirilis untuk dipakai owner.** `batal_owner` sengaja belum aktif. NTF.06 belum dicentang di sheet (lihat "Belum beres").

**File yang diubah** (semua sudah di-push ke `main` 13 Nov 2026, tanpa `[skip ci]`, cek anti-nyasar lulus sebelum tiap push):

- Commit `82c4eda`: `supabase/functions/kedai/kirim_push.ts` (tahap 2: `setujui`, `tolak`). Ini menutup selisih "kode live berbeda dari repo" di Handoff #10.
- Commit `90952e4`: `supabase/functions/kedai/kirim_push.ts` (tahap 3, utuh; hanya daftar `KEJADIAN_PUSH_AKTIF` dan komentar kepala yang berubah, baris lama dijadikan komentar).

`kedai` di-deploy dua kali (sepuluh berkas, project yang benar, tanpa `--no-verify-jwt`, token dibersihkan, hasil `[]`). Kode live sama dengan commit `90952e4`. Tidak ada migration dan tidak ada perubahan di `public/`.

**Keputusan baru (ketua, 13 Nov 2026):**

- **Rilis tanpa tes satu per satu untuk semua kejadian push.** Kejadian yang belum dites dan push untuk penjaga **dites sendiri oleh ketua**; bila ada masalah, ketua membuka sesi sendiri. Alasan ketua: owner (ibu ketua) sudah ingin memakainya, dan sedikit hal yang meleset bisa diterima. Alasan ketua selain itu belum tercatat.
- Dasar teknis yang dibahas di chat: push pelengkap, bukan inti (NT4, NT12); kegagalan push tidak membatalkan order; kabar tetap ada lewat Kotak masuk dan buka aplikasi.
- Tahap 3 memasang tujuh kejadian sekaligus: `status`, `catatan_customer`, `catatan_owner`, `batal_customer`, `alih_hari`, `foto_setelah_selesai`, `order_wakil`. Nama dicocokkan dengan daftar kode di `inbox.ts`.
- **`batal_owner` sengaja belum dipasang.** Alasan: penjaga yang menekan push batal harus membuka Antrean (pengecualian NT8) dan belum ada tes dengan akun penjaga. Memasangnya: tambah nama di `KEJADIAN_PUSH_AKTIF` di `kirim_push.ts`, lalu deploy ulang `kedai`.
- Pilihan penulis, tidak ditolak ketua, alasan belum tercatat: butir baru **NTF.06b** ("aktifkan push `batal_owner` setelah tes penjaga") disarankan ditambah di sheet.
- **Pertentangan dengan catatan lama:** `AGENTS.md` bagian 10 butir 2 menulis "tanpa bukti jangan diberi lulus". Keputusan rilis di atas **tidak mengubah itu**: kejadian yang belum dites hanya dirilis, tidak dicentang lulus.

**Terbukti (diperiksa di chat, tidak disimpan; owner di HP Android, customer di Brave laptop, akun dummy):**

- Log server `kedai push: <kejadian> | terkirim 1 | mati 0 | gagal 0` untuk `order_baru`, `setujui`, `tolak`, `catatan_customer`, `catatan_owner`, dan `status` (dua kali, Diproses dan Diantar). Tidak ada baris `mati` atau `gagal`.
- Notifikasi sampai di penerima yang benar dengan teks umum: owner untuk `order_baru` dan catatan customer; customer untuk `setujui`, `tolak`, catatan owner, dan status. Alasan tolak tidak muncul di notifikasi.
- Klik notifikasi membuka detail order yang tepat (diuji untuk `setujui` dan `tolak`; alasan tolak tampil di aplikasi).
- Pelaku tidak dikabari: HP owner diam saat Setujui, Tolak, dan ubah status.

**Pengamatan:**

- Push ke Brave **kadang telat** (beberapa menit pada `setujui` dan `tolak`; cepat pada `setujui` dan `status` berikutnya), sedangkan server selalu cepat. Pola sporadis, kemungkinan di sisi push service. Untuk review pemakaian (`LNC.05`). Pesan ke owner: notifikasi hanya bantuan, status yang pasti ada di aplikasi.

**Belum beres:**

- **Belum dites (dirilis tanpa tes sendiri):** `batal_customer`, `alih_hari`, `foto_setelah_selesai`, `order_wakil`.
- **Belum aktif:** `batal_owner`.
- **Belum teruji:** semua push ke penjaga (belum ada langganan penjaga), termasuk `setujui` dan `status`; penjaga menekan push membuka Antrean; **SEC-22 di layar kunci Android** (tes di laptop tidak punya layar kunci, jadi baris SEC-22 **jangan dicentang**); pelaku diam untuk dua kejadian catatan (belum dikonfirmasi satu per satu); id order milik customer lain lewat push (NTF.08); perilaku overlay Kotak masuk saat push ditekan.
- **NTF.06 belum dicentang**: `batal_owner` belum dipasang. Ketua yang memutuskan apakah ditutup sebagai tahap 1 sampai 3 dengan butir NTF.06b.
- Pemantauan: lihat log `kedai push:` (Edge Functions, kedai, Logs) di hari-hari awal. Baris `gagal` atau `mati` yang berulang, atau kejadian yang tidak muncul sama sekali, berarti ada yang perlu dilihat.
- Komentar di `inbox.ts` baris 5 ("kejadian yang aktif saat ini: `order_baru`") sudah usang; tidak berpengaruh, dibiarkan (`AGENTS.md` aturan 2).
- Teks layar Order wakil ("Belum ada notifikasi otomatis ke layar HP") perlu diperbarui karena `order_wakil` sudah aktif (hanya penjaga yang dapat push).
- **Blok `docs/database.md` bagian 9 untuk migration 13 Nov belum ditulis** (`inbox_tulis` mengembalikan penerima, `push_langganan_ambil`, `push_hasil_catat`; sudah disebut di Handoff #9 dan #10).
- `_batal.sql` migration 13 Nov belum pernah dicoba. Bila dipakai, deploy `kedai` versi lama dulu.
- Dari Handoff #8, tidak berubah: NTF.05a (ajakan setelah order pertama, menyentuh `pesan.js`); NTF.07; logika `push_daftar` dan `push_nonaktifkan` baru terbukti penuh di NTF.08 (perangkat ke-6, akun A tidak bisa mematikan langganan akun B).
- **Cek jadwal pembersihan foto jalan sendiri setelah Minggu 15 Nov 2026 02.00 WIB (FTO.07).** Jadwal otomatis pertama: Sabtu 14 Nov 2026 pukul 19.00 UTC.
- Dashboard Supabase dan profil browser ketua: logout dan tutup bila masih terbuka.

**Saran giliran berikutnya:**

1. Ketua menguji sendiri kejadian yang belum dites dan akun penjaga (aktifkan notifikasi dari akun penjaga dummy, lalu coba `setujui` dan `status`). Bila ada masalah, buka sesi baru dengan melampirkan `AGENTS.md`, `notifikasi.md` (dengan Handoff #8 sampai #11), `database.md`, `security.md`, `kedai/index.ts`, `inbox.ts`, `kirim_push.ts`, dan `push.ts`.
2. Setelah tes penjaga lulus: pasang `batal_owner` (butir NTF.06b), tes penjaga menekan push batal membuka Antrean, lalu cek SEC-22 di layar kunci Android.
3. Tulis blok `docs/database.md` untuk migration 13 Nov (docs murni, boleh `[skip ci]`).
4. Lanjut NTF.05a, lalu NTF.07 dan NTF.08.
5. Commit yang hanya berisi docs/md boleh memakai `[skip ci]`; commit yang menyentuh kode tidak.

### Handoff #12 | 2026-11-13 | FREN

**Tugas:** NTF.05a (ajakan lembut "Aktifkan notifikasi" sekali setelah order pertama terkirim). **Kode sudah ditulis dan lolos cek sintaks, tetapi BELUM dites di layar, BELUM di-commit, dan BELUM di-push.** Jangan dicentang di sheet sebelum tes lulus.

**File yang diubah** (hanya di Mac lokal; `git status` 13 Nov 2026: `public/notif.js` dan `public/pesan.js` modified, belum di-stage, `main` sama dengan `origin/main`):

- `public/pesan.js`: kartu "Mau dikabari?" (tombol Aktifkan dan Nanti saja) dibuat lewat JS dan dipasang di layar "Pesanan terkirim", tepat di atas "Pesan lagi". Dipanggil sesudah order berhasil, dibungkus `try/catch`. Disembunyikan saat "Pesan lagi", tab Pesan dibuka ulang, dan Keluar.
- `public/notif.js`: dua fungsi baru `bisaDiajak()` dan `aktifkanUntukAjakan()`, dibuka lewat `window.KedaiNotif`. Alur izin, berlangganan, dan `push_daftar` memakai kode yang sama dengan tombol Home.
- Kode lama tidak dihapus (dibandingkan dengan versi sebelumnya: hanya tambahan).
- Tidak ada perubahan di `index.html`, `sw.js`, `config.js`, migration, atau `kedai`. Tidak ada berkas JS baru, jadi daftar cache `sw.js` tidak berubah.

**Keputusan baru:**

- "OK" ketua untuk menyentuh `pesan.js` sudah ada (via PIC, 13 Nov 2026). Alasan ketua selain itu belum tercatat.
- **Ajakan sekali per HP, apa pun jawabannya** (Aktifkan, Nanti saja, izin ditolak): penanda `localStorage` `chata_notif_diajak` ("1", tanpa data pribadi) diisi begitu kartu tampil. Dipilih PIC dengan dasar prinsip ketua "versi 1 simpel, perbaikan di versi berikutnya". Menjawab butir NTF.05a di sheet. Tombol Home tetap jalan bagi yang berubah pikiran.
- **Pilihan penulis, belum dibahas dengan ketua, alasan belum tercatat:**
  - Penanda `chata_notif_diajak` **tidak dihapus saat Keluar** (per HP, bukan per akun).
  - "Order pertama" dihitung per HP, server tidak dicek.
  - Bila `localStorage` tidak bisa dibaca, ajakan dianggap sudah tampil dan tidak muncul.
  - Kartu dibuat lewat JS sehingga `index.html` tidak berubah. Rencana awal yang diajukan ke ketua mencantumkan tiga berkas; hasilnya dua berkas, lebih kecil.
- Pengecualian NT6 tetap: pop-up izin peramban baru muncul setelah tombol Aktifkan ditekan.

**Terbukti:** hanya sintaks kedua berkas lolos (`node --check`) dan tidak ada baris lama yang hilang. Perilaku di layar **belum teruji**.

**Belum beres:**

- **Tes NTF.05a** (Brave/Chrome desktop, akun customer dummy; sesuai keputusan ketua di Handoff #6):
  1. Hapus penanda `chata_notif_aktif` dan `chata_notif_diajak`, kirim satu order dummy: kartu muncul di layar terkirim.
  2. Tekan Aktifkan: pop-up izin, lalu kartu "Notifikasi sudah aktif di HP ini", tombol Home hilang, satu baris `langganan_push` aktif (query baca-saja).
  3. Kirim order kedua: kartu tidak muncul lagi.
  4. Ulangi dari awal dengan Nanti saja: order berikutnya tanpa kartu, tombol Home masih ada.
  5. Opsional: tolak izin di pop-up: pesan diblokir tampil dan tombol Home hilang.
     Centang NTF.05a hanya bila semuanya lulus.
- **Commit dan push belum dibuat.** Commit kode **tanpa `[skip ci]`**. Sebelum push, tempel hasil `pwd`, `git remote -v`, dan email commit terakhir ke chat (semuanya harus milik ketua).
- Dari Handoff #11, tidak berubah: `batal_owner` belum aktif (butir NTF.06b, menunggu tes penjaga); kejadian yang dirilis tanpa tes sendiri (`batal_customer`, `alih_hari`, `foto_setelah_selesai`, `order_wakil`); semua push ke penjaga belum teruji; SEC-22 di layar kunci Android belum (baris jangan dicentang); NTF.06 belum dicentang di sheet.
- Blok `docs/database.md` bagian 9 untuk migration 13 Nov belum ditulis.
- Cek jadwal pembersihan foto jalan sendiri setelah Minggu 15 Nov 2026 02.00 WIB (FTO.07).
- Teks layar Order wakil ("Belum ada notifikasi otomatis ke layar HP") perlu diperbarui.
- Push ke Brave kadang telat sementara server cepat (untuk review pemakaian, `LNC.05`).
- Logika `push_daftar` dan `push_nonaktifkan` baru terbukti penuh di NTF.08.

**Saran giliran berikutnya:**

1. Jalankan tes NTF.05a di atas, periksa buktinya di chat, lalu commit dan push (tanpa `[skip ci]`, dengan cek anti-nyasar). Centang NTF.05a bila lulus.
2. Lampirkan `AGENTS.md`, `notifikasi.md` (dengan Handoff #8 sampai #12), `public/pesan.js`, dan `public/notif.js` terbaru dari repo lokal.
3. Setelahnya: NTF.07 (penyegaran saat kembali ke layar, batas NT10, saat push masuk, tombol Segarkan), lalu NTF.06b dan tes penjaga, lalu NTF.08.

### Handoff #13 | 2026-11-13 | RAC

**Tugas:** NTF.05a (ajakan lembut "Aktifkan notifikasi" sekali setelah order pertama terkirim), melanjutkan Handoff #12. Tes 1 sampai 4 lulus dan NTF.05a sudah dicentang di sheet.

**File yang diubah** (satu commit `f12420b`, sudah di-push ke `main` 13 Nov 2026, tanpa `[skip ci]`, Actions hijau; cek anti-nyasar lulus sebelum push):

- `public/pesan.js` (kartu "Mau dikabari?")
- `public/notif.js` (`bisaDiajak()` dan `aktifkanUntukAjakan()`)
- `docs/notifikasi.md` (Handoff #11 dan #12)

Tidak ada perubahan di `index.html`, `sw.js`, `config.js`, migration, atau `kedai`. Tidak ada deploy `kedai`.

**Keputusan baru:**

- Tes dilakukan setelah push, di production, dengan akun dummy (sesuai AGENTS.md bagian 10 butir 1). Yang ditahan sebelum tes lulus hanya centang di sheet, bukan push.
- Perangkat uji Brave desktop, sesuai keputusan ketua di Handoff #6.
- Tes 5 (izin diblokir) sengaja tidak dites, demi rilis cepat. Alasan ketua selain itu belum tercatat.

**Terbukti (diperiksa di chat, tidak disimpan; Brave desktop, akun customer dummy):**

1. Order pertama: kartu muncul di layar "Pesanan terkirim", pop-up izin tidak muncul sebelum Aktifkan ditekan (NT6).
2. Aktifkan: kartu berganti "Notifikasi sudah aktif di HP ini.", dua tombol hilang, tombol Home hilang, `chata_notif_diajak` dan `chata_notif_aktif` = 1, satu baris `langganan_push` aktif dengan `dibuat_pada` baru dan `terakhir_berhasil_pada` kosong (wajar, belum ada push terkirim).
3. Order kedua: kartu tidak muncul lagi.
4. Nanti saja (penanda dihapus lewat Console, lalu order baru): kartu hilang, hanya `chata_notif_diajak` = 1, tombol Home tetap ada, order berikutnya tanpa kartu.

**Belum beres:**

- Tes 5 (izin diblokir: pesan diblokir tampil dan tombol Home hilang) tidak dites.
- Baris `langganan_push` browser tes masih `aktif = true`, karena penanda dihapus lewat Console, bukan lewat Keluar. Sisa cara tes, bukan galat aplikasi.
- Dari Handoff #11 dan #12, tidak berubah: `batal_owner` belum aktif (NTF.06b, menunggu tes penjaga); `batal_customer`, `alih_hari`, `foto_setelah_selesai`, `order_wakil` dirilis tanpa tes sendiri; semua push ke penjaga belum teruji; SEC-22 di layar kunci Android belum teruji (baris jangan dicentang); NTF.06 belum dicentang; NTF.07 dan NTF.08 belum dikerjakan.
- Blok `docs/database.md` bagian 9 untuk migration 13 Nov belum ditulis.
- Teks layar Order wakil ("Belum ada notifikasi otomatis ke layar HP") perlu diperbarui.
- Cek jadwal pembersihan foto jalan sendiri setelah Minggu 15 Nov 2026 02.00 WIB (FTO.07).
- Push ke Brave kadang telat sementara server cepat (untuk review pemakaian, `LNC.05`).

**Saran giliran berikutnya:**

1. Ketua atau PIC menguji akun penjaga (aktifkan notifikasi dari akun penjaga dummy, coba `setujui` dan `status`), lalu pasang `batal_owner` (NTF.06b) dan tes penjaga menekan push batal membuka Antrean.
2. NTF.07: penyegaran saat kembali ke layar (batas NT10), saat push masuk, tombol Segarkan.
3. Tulis blok `docs/database.md` bagian 9 untuk migration 13 Nov (docs murni, boleh `[skip ci]`).
4. NTF.08: sesi tes notifikasi.
5. Lampirkan `AGENTS.md`, `notifikasi.md` (dengan Handoff #8 sampai #13), `security.md`, dan berkas yang relevan. Commit yang hanya berisi docs/md boleh memakai `[skip ci]`; commit yang menyentuh kode tidak.

### Handoff #14 | 2026-11-13 | RAC

**Tugas:** NTF.06 tahap 4 (push `batal_owner`). Selesai dan sudah dicentang di sheet. Menimpa kalimat "`batal_owner` belum dipasang" di Handoff #11 dan #13; yang paling akhir menang.

**File yang diubah** (satu commit `0fdc508`, sudah di-push ke `main` 13 Nov 2026, tanpa `[skip ci]`; cek anti-nyasar lulus):

- `supabase/functions/kedai/kirim_push.ts` (hanya `"batal_owner"` ditambah di `KEJADIAN_PUSH_AKTIF` dan dua komentar; kode dan komentar lama tidak dihapus)

`kedai` di-deploy 13 Nov 2026 (sepuluh berkas, project yang benar, tanpa `--no-verify-jwt`, "OK" ketua sudah ada). Token dibersihkan (`[]`) dan dashboard sudah logout. Tidak ada migration dan tidak ada perubahan di `public/`.

**Keputusan baru:**

- Ketua (13 Nov 2026, via WA lewat RAC): tidak perlu tes untuk semua aksi karena terlalu lama, tetapi kodenya tetap dikerjakan; tes cukup di bagian yang berubah. Ini mengoreksi bacaan Handoff #11 bahwa `batal_owner` ditahan menunggu tes penjaga.
- Alasan ketua selain itu belum tercatat.

**Terbukti (diperiksa di chat, tidak disimpan; owner di HP Android, penjaga di HP Android lain, customer di Brave laptop, akun dummy):**

1. Log server: `kedai push: batal_owner | terkirim 2 | mati 0 | gagal 0`.
2. Customer: notifikasi "Pesananmu dibatalkan. Buka aplikasi untuk detailnya." sampai, tanpa alasan di teks. Klik membuka detail order, alasan batal terbaca di aplikasi.
3. Penjaga: notifikasi "Order #N dibatalkan." sampai. Klik membuka **Antrean**, bukan detail order (pengecualian NT8 terbukti dengan push sungguhan).
4. Owner pelaku: diam.
5. Ikut terbukti: `order_baru` ke owner dan `setujui` ke penjaga ("Ada order disetujui.") sampai di HP.

**Belum beres:**

- Layar kunci Android untuk `batal_owner` (SEC-22) belum dicek; yang dicek hanya teks notifikasi. Baris SEC-22 jangan dicentang.
- Dirilis tanpa tes sendiri: `batal_customer`, `alih_hari`, `foto_setelah_selesai`, `order_wakil`. Push `status` ke penjaga belum teruji.
- Push ke Brave kadang telat sementara server cepat (untuk review pemakaian, `LNC.05`).
- NTF.07 dan NTF.08 belum dikerjakan; logika `push_daftar` dan `push_nonaktifkan` baru terbukti penuh di NTF.08.
- Blok `docs/database.md` bagian 9 untuk migration 13 Nov belum ditulis.
- Teks layar Order wakil ("Belum ada notifikasi otomatis ke layar HP") perlu diperbarui.
- Cek jadwal pembersihan foto jalan sendiri setelah Minggu 15 Nov 2026 02.00 WIB (FTO.07).
- Perilaku overlay Kotak masuk saat push ditekan belum teruji.

**Saran giliran berikutnya:**

1. NTF.07: penyegaran saat kembali ke layar (batas NT10), saat push masuk, tombol Segarkan.
2. Blok `docs/database.md` untuk migration 13 Nov (docs murni, boleh `[skip ci]`).
3. NTF.08: sesi tes notifikasi.
4. Lampirkan `AGENTS.md`, `notifikasi.md` (dengan Handoff #8 sampai #14), `security.md`, dan berkas yang relevan.

---
