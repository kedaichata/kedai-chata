/docs/pemetaan-test.md

# 🗺️ pemetaan-test.md: Peta Tes ORD.14 ke SEC, Supaya Tes Tidak Diulang

> **Dibuat 10 Nov 2026 atas permintaan ketua.** Berkas kerja, bukan keputusan fitur. Dilampirkan di awal sesi tes **bersama** `AGENTS.md`, `order.md`, dan `security.md`.
> **Isi awal diambil dari Handoff `order.md` (#3 sampai #27) dan screenshot sheet (SEC-05 sampai SEC-31, 10 Nov).** Kolom status yang tidak yakin ditandai **cek sheet**.
> **Arti ✅: tes itu tidak perlu diulang. Bukan berarti baris SEC boleh dicentang.** Status ini dugaan dari handoff, belum dicocokkan baris demi baris dengan teks sheet. Centang SEC hanya bila semua aksi di barisnya terbukti **dan** jenis buktinya sesuai kolom Catatan sheet (mis. SEC-12 minta query baca-saja, bukan hanya balasan server). Penentu akhirnya AI di sesi tes (bagian 2).
> **Bukti tetap tidak disimpan** (`AGENTS.md` bagian 10 butir 2). Berkas ini hanya menyimpan **status**: apa yang sudah terbukti, apa yang belum.
> **Bagian 5 (Log status) append-only**: tempel baris baru di bawah, jangan ubah baris lama. Yang paling akhir menang.
> **Selisih:** `AGENTS.md` menang atas berkas ini.

---

## 1. Tujuan

1. Tes yang sudah lulus **tidak diulang** di sesi lain.
2. Baris SEC di sheet **dicentang tepat waktu**, yaitu begitu semua aksi di barisnya terbukti, tidak lebih awal dan tidak terlupa.
3. Penguji (satu orang, sesi AI sering beda hari) selalu tahu **sisa kerjaan**.

---

## 2. Kewajiban AI (WAJIB, karena manusia tidak akan ingat)

**Awal sesi tes:**

1. Baca bagian 4 (peta) dan bagian 5 (log). Sebutkan ke penguji dalam 3 baris: apa yang **sudah terbukti (jangan diulang)** dan apa **sisa tes** yang disarankan hari ini.
2. Bila penguji mengusulkan tes yang sudah terbukti, AI **bilang "ini sudah lulus tanggal X"** dan menawarkan tes sisa. Pengecualian yang boleh diulang: tes yang kodenya berubah sejak itu, dan query cek 8 dan 9 yang memang dijadwalkan di akhir.

**Setiap selesai satu tes (tiap giliran, bukan menunggu akhir sesi):**

3. AI menyebut: (a) tes apa yang baru terbukti, (b) **SEC mana yang kini lengkap: "butir SEC-NN sudah selesai, silakan dicentang di sheet"**, (c) SEC mana yang belum lengkap dan **tepatnya aksi apa yang masih kurang**.
4. AI **tidak** menyatakan SEC lulus bila ada satu aksi di barisnya tanpa bukti (`AGENTS.md` bagian 10 butir 2). Ragu menyangkut data atau akses: anggap belum lulus.

**Akhir sesi:**

5. AI menawarkan dua hal: **Handoff** (`AGENTS.md` bagian 2 butir 9) dan **satu blok log pendek** untuk bagian 5 berkas ini. Penguji menempelnya. AI tidak menulis catatan untuk sheet; pengisian sheet dan kolom Catatan dilakukan manusia.

---

## 3. Aturan Main Penguji

- Akun dan data **dummy** saja. Jangan geser jam Mac bersama.
- **Jangan sentuh NTF, FTO, BTN, LNC, GIM** di sesi tes ini (belum waktunya atau menunggu keputusan ketua).
- Satu sesi = satu kelompok tes di bagian 4. Selesaikan dulu, jangan loncat-loncat.
- Bukti ditempel dan diperiksa di chat, lalu tidak disimpan.

---

## 4. Peta Tes

Tanda: ✅ terbukti (rujukan handoff) · ⬜ belum · ❓ cek sheet atau tanya ketua.

### 4.1 Tes yang bisa jalan sekarang (Mac, akun dummy, tanpa Android)

**K1. Hak per peran (SEC-07, SEC-08, SEC-13, SEC-14)**

| Aksi / kasus                              | Customer (SEC-07)                                                          | Penjaga (SEC-08)                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `order_setuju`, `order_tolak`             | ✅ 403 (H#9)                                                               | ✅ 403 (H#9)                                                                        |
| `order_batal`                             | ✅ pada Menunggu sah milik sendiri; ⬜ **batal setelah Disetujui ditolak** | ✅ (H#11; cek sheet)                                                                |
| `order_status`                            | ✅ 403 (H#13)                                                              | ✅ order Menunggu/Ditolak/Dibatalkan = 404 (H#13)                                   |
| `order_metode_koreksi`, `order_alih_hari` | ✅ 403 (H#13)                                                              | ✅ 403 (H#13)                                                                       |
| `order_buat_wakil` (SEC-13)               | ✅ 403 (H#25)                                                              | ✅ 403 (H#25)                                                                       |
| `pelanggan_luar_*` (SEC-14)               | ✅ 403 (H#23)                                                              | ✅ 403 (H#23)                                                                       |
| `catatan_tambah`                          | n/a                                                                        | ✅ 403 (H#19)                                                                       |
| `menu_simpan`, `menu_stok`                | ❓ cek sheet (mungkin sudah di menu-test)                                  | ❓                                                                                  |
| Penjaga membuka order Dibatalkan/Ditolak  | n/a                                                                        | ✅ tidak terlihat di daftar (H#19); ⬜ buka langsung lewat `order_detail` dengan id |

Sisa K1: customer batal setelah Disetujui, `menu_*` oleh customer dan penjaga, `order_detail` langsung oleh penjaga pada order Dibatalkan.

**Status per baris SEC (setelah dicocokkan dengan teks sheet, 10 Nov):**

- **SEC-13: kemungkinan lengkap.** Ditolak untuk non-owner (✅ H#25) dan order wakil sah langsung Disetujui dengan penanda pembuat (✅ cek SQL 5, H#25). AI mengonfirmasi lalu mengingatkan centang.
- **SEC-14: BELUM lengkap.** Teks barisnya juga meminta "penjaga hanya melihat salinan di order". Yang terbukti baru 403 pada `pelanggan_luar_*`. **Sisa:** penjaga membuka detail order wakil dan melihat nama, WA, alamat salinan di order, dan tidak ada jalur ke daftar pelanggan tanpa akun.
- **SEC-07 dan SEC-08: belum lengkap** (sisa di tabel di atas).

**K2. Dua sesi bersamaan (SEC-10)**

| Kasus                                     | Status                               |
| ----------------------------------------- | ------------------------------------ |
| Dua owner Setuju bersamaan                | ✅ (H#11)                            |
| Customer Batal vs owner Setuju bersamaan  | ⬜ (butuh dua sesi login)            |
| Tolak menang saat bersamaan               | ⬜                                   |
| Dua sesi menekan `order_status` yang sama | ⬜                                   |
| Ketuk dua kali tombol status di layar     | ⬜ (tidak bisa manual; lewat konsol) |

Cara: dua profil browser atau satu biasa dan satu jendela privat. Hanya login aplikasi ChATA, bukan dashboard.

**K3. Status dan alih hari (SEC-15)**

✅ Jalur maju dan mundur, loncat, mundur dari Selesai, jalur per tipe, kembali ke Disetujui hanya lewat alih hari (H#13). ❓ Belum dicocokkan dengan teks sheet (termasuk "tercatat di riwayat" dan tambahan 8 Nov di security.md bagian 7). AI mencocokkan dulu sebelum menyatakan lengkap.

**K4. Catatan (SEC-16)**

| Kasus                                                                   | Status                |
| ----------------------------------------------------------------------- | --------------------- |
| Penjaga tidak bisa menambah, batas 10 catatan dan 200 karakter (konsol) | ✅ (H#18, H#19)       |
| Kunci saat Diproses, terbuka lagi saat mundur                           | ✅ (H#19)             |
| Catatan di Ditolak, Dibatalkan, Selesai ditolak                         | ✅ (H#18)             |
| Terbuka lagi setelah **alih hari**                                      | ⬜                    |
| Batas 10 dan karakter **lewat layar**, 409 saat status berubah          | ⬜                    |
| Edit atau hapus catatan (tidak ada jalurnya)                            | ❓ cek bersama SEC-17 |
| Catatan di order wakil                                                  | ✅ (H#25)             |

**K5. Tag HTML (SEC-18)**

| Kolom                                                                | Status    |
| -------------------------------------------------------------------- | --------- |
| Catatan, tiga layar                                                  | ✅ (H#21) |
| Alasan tolak, alasan batal, alasan alih hari                         | ⬜        |
| Nama pemesan, alias dan alamat, nama menu, nama pelanggan tanpa akun | ⬜        |

**K6. Harga, total, status palsu (SEC-06, SEC-12)**

- **SEC-06: belum pasti.** ✅ `order_buat` dan `order_buat_wakil` mengabaikan isian palsu (H#3, H#24). ⬜ aksi lain yang menerima isian (`order_status`, `order_setuju`, `catatan_tambah`, dll.): kirim peran, id pengguna, status palsu, lalu cek diabaikan.
- **SEC-12: belum lengkap.** Harga menu diubah dan order lama tetap sudah teramati lewat balasan server (MT-24), tetapi kolom Catatan sheet meminta **bukti query baca-saja `order` dan `order_item`**. **Sisa:** jalankan query itu di SQL Editor (login dashboard oleh ketua, lalu logout).

**K7. Metode bayar (SEC-11)**

✅ Kosong, asing, huruf kecil = 400; koreksi oleh non-owner 403; pada Selesai 409; metode sama 400 (H#9, H#13). ❓ Belum dicocokkan dengan teks sheet. AI mencocokkan dulu sebelum menyatakan lengkap.

**K8. Milik orang lain, dua customer (SEC-05, SEC-09)**

| Aksi                                                              | Status                          |
| ----------------------------------------------------------------- | ------------------------------- |
| `order_detail`, `order_batal`, `catatan_tambah`, `catatan_dibaca` | ✅ 404 (H#3, H#18)              |
| `order_daftar` tidak memuat milik orang lain                      | ✅ (H#3)                        |
| `alamat_simpan` dengan id alamat orang lain                       | ⬜                              |
| `foto_lihat`, `push_nonaktifkan`                                  | tidak sekarang (SEC-20, SEC-25) |

SEC-05 di sheet bertuliskan "Setelah ORD.14".

**K9. Hak dan hapus (SEC-17)**

⬜ Query baca-saja hak tabel (tanpa DELETE) dan daftar aksi `kedai` (tidak ada aksi hapus). Bisa sekarang; login dashboard oleh ketua lalu logout.

**K10. Teks baris ORD.14 di sheet (dicocokkan 10 Nov)**

Sheet ORD.14: "Setelah ORD.13 dan ORD.15" (keduanya sudah Selesai, jadi ORD.14 boleh jalan). Butir yang disebut sheet:

| Butir di sheet                                               | Status                                                                                                                |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Harga, hak, dobel-setujui (dua owner)                        | ✅ (H#3, H#9, H#11)                                                                                                   |
| Mundur satu langkah, koreksi metode bayar                    | ✅ (H#13)                                                                                                             |
| Batal vs setuju bersamaan                                    | ⬜ (K2)                                                                                                               |
| Owner batal dari **tiap status**                             | ✅ dari Disetujui (H#9). ⬜ dari Diproses dan Diantar/Siap/Siap disajikan. ⬜ **Selesai ditolak** lewat `order_batal` |
| Customer batal setelah Disetujui ditolak                     | ⬜                                                                                                                    |
| Alih hari dari tiap status; Selesai dan selain Besok ditolak | ✅ (H#13: Disetujui, Diproses, Diantar; Selesai 409; sudah Besok 409)                                                 |
| Aksi owner oleh customer dan penjaga ditolak                 | ✅ sebagian, lihat K1                                                                                                 |
| Penjaga menekan tombol status pada order Dibatalkan          | ✅ 404 (H#13); ⬜ lewat layar                                                                                         |

Catatan: teks baris ORD.14 **tidak menyebut** urutan daftar O22, wizard hari Besok, jumlah menu, dan tes catatan lewat layar. Butir-butir itu (bagian 4.2) berasal dari "masih terbuka" di Handoff, bukan dari teks sheet. Sheet juga menyebut `order-test.md` dibuat di sesi tes; berkas ini bisa jadi bahan awalnya.

### 4.2 Tes non-SEC dari handoff (tidak ada di teks baris ORD.14)

| Tes                                                  | Hasil yang benar                                                                                                                                                                                                                                                                                                                | Status                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Urutan daftar owner dan penjaga (O22)                | Hanya hari antar Hari ini dan Besok; Hari ini dulu. Dalam hari: kelompok Disetujui sampai siap, lalu Menunggu, Selesai, Ditolak dan Dibatalkan; dalam kelompok terlama dulu (H#2). Order yang hari antarnya lewat tidak tampil; owner bisa membukanya lewat filter hari di Semua Order. Customer: riwayat lengkap, terbaru dulu | ⬜                                             |
| Wizard: hari **Besok**                               | `hari_target` order = tanggal besok menurut server; ringkasan menulis Besok                                                                                                                                                                                                                                                     | ⬜                                             |
| Wizard: tambah, kurangi, hapus jumlah menu           | Baris dan jumlah berubah tanpa layar loncat ke atas; total resmi dari balasan server                                                                                                                                                                                                                                            | ⬜                                             |
| Wizard: Segarkan saat terisi                         | Isian wizard bertahan (H#26)                                                                                                                                                                                                                                                                                                    | ⬜                                             |
| Wizard: pilihan menu non-bawaan di HP                | Teks pilihan tersalin ke order, tampil di detail                                                                                                                                                                                                                                                                                | ⬜ (HP)                                        |
| Layar penjaga: pola layar loncat                     | Aksi di bawah detail panjang tidak menarik layar ke atas                                                                                                                                                                                                                                                                        | ✅ (H#27; ORD.18 Selesai)                      |
| Query cek 8 dan 9                                    | Hasil sesuai berkas cek                                                                                                                                                                                                                                                                                                         | ⬜ **paling akhir**, setelah semua tes catatan |
| Tes pemakai (nyokap, satu order wakil tanpa dipandu) | Selesai tanpa dipandu; titik bingung dicatat                                                                                                                                                                                                                                                                                    | ⬜ **setelah semua di atas lulus**             |

### 4.3 Menunggu Android

- **SEC-19** (jam HP digeser): pesan lewat layar, cek `hari_target`; bagian alih hari dan waktu catatan juga. **Ini gerbang FTO.01** di sheet.
- Cek `sw.js` v17 muncul di HP, tes wizard di HP.

### 4.4 Bukan sekarang (urutan sheet)

SEC-20, 21, 29 menunggu rantai FTO. SEC-22, 25 menunggu NTF. SEC-30, 31 menunggu BTN. SEC-04 dan SEC-03 menunggu SEC-31 (tabel bantuan ikut dicek). SEC-23 sebelum LNC.01. SEC-27 (galat umum, P1) bisa kapan saja.

---

## 5. Log Status (append-only)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD | PIC: kelompok tes`. Isi: apa yang baru terbukti, **SEC yang sudah dicentang di sheet**, sisa. Tanpa bukti, tanpa data pelanggan.

---

### 2026-11-10 | ketua: isi awal

Semua status ✅ di bagian 4 berasal dari Handoff `order.md`, belum diperiksa ulang. Belum ada baris SEC yang dicentang di sheet.

### 2026-11-10 | PIC: K1 dan K2 (tanpa Android)

**Baru terbukti** (tanpa bukti dan tanpa data pelanggan):

- **K1:** customer dan penjaga memanggil aksi owner-only (termasuk `menu_simpan`, `menu_stok`, `order_alih_hari`) = 403; customer batal setelah Disetujui = 409, status tetap; penjaga `order_batal` = 403; penjaga `order_detail` id langsung pada Menunggu, Ditolak, Dibatalkan = 404; penjaga membuka order wakil melihat salinan nama, WA, alamat tanpa id pelanggan; `pelanggan_luar_daftar` oleh penjaga = 403.
- **K2:** customer Batal vs owner Setuju (4 kali) dan vs owner Tolak (1 kali): tepat satu menang, riwayat bersih. Dua sesi `order_status` pada order yang sama: satu 200, satu 409, riwayat satu baris.

**SEC yang lengkap dan diingatkan untuk dicentang di sheet:** SEC-07, SEC-08, SEC-13, SEC-14. (Tanggal centang oleh PIC: AIK)

**Belum lengkap:**

- **SEC-10:** sisi customer menang belum teramati (owner menang 5 dari 5, penyebab belum diketahui); ketuk dua kali di layar belum; query baca-saja `order` belum.
- **SEC-06:** aksi selain `order_buat` belum. **SEC-12:** query baca-saja belum.
- **SEC-05 dan SEC-09:** `alamat_simpan` milik orang lain belum.
- **SEC-11, SEC-15, SEC-16:** dicocokkan dulu dengan teks sheet; K4 sisa: catatan terbuka lagi setelah alih hari, batas lewat layar.
- **SEC-17:** query hak dan daftar aksi belum.
- **SEC-18:** tag HTML selain catatan belum.
- **K10:** owner batal dari Diproses dan Diantar/Siap, Selesai ditolak lewat `order_batal`.
- **Non-SEC (4.2):** semua masih ⬜; query cek 8 dan 9 paling akhir; tes pemakai setelah semuanya lulus.
- **Android:** SEC-19, `sw.js` v17.

**Catatan:** baris ORD.14 di sheet sempat ditandai Selesai; ORD.14 belum selesai, kembalikan ke Belum.

### 2026-11-10 | PIC: K10, K6, K5 (tanpa Android)

**Baru terbuka:**

- **K10:** owner batal dari Diproses, Diantar, Siap diambil, Siap disajikan = 200; Selesai ditolak = 409. Sisa: TC-K10-03 lewat layar.
- **K6:** isian palsu diabaikan di semua aksi yang menerima isian (termasuk `order_status` oleh penjaga dan `catatan_dibaca`).
- **K5:** tag HTML tampil sebagai teks biasa di semua kolom dan layar yang relevan; nama profil ditolak di input.

**SEC yang lengkap dan diingatkan untuk dicentang di sheet:** SEC-06, SEC-18. (Tanggal centang oleh PIC: ...)

**Belum lengkap:** SEC-10 (customer menang, ketuk dua kali, query `order`), SEC-12 (query), SEC-05 dan SEC-09 (`alamat_simpan`), SEC-17 (K9), SEC-11, SEC-15, SEC-16 (cocokkan sheet; K4 sisa), TC-K10-03, non-SEC 4.2, query cek 8 dan 9, tes pemakai, Android (SEC-19, `sw.js` v17).

### 2026-11-10 | [RAC]: sinkron centang SEC-11, SEC-14, SEC-15

Dicocokkan dengan teks sheet dari Handoff #9, #13, #28. Sudah dicentang di sheet: SEC-11, SEC-14, SEC-15. Tes K3 dan K7 tidak perlu diulang.
Sisa K1, K2, K10: lihat entri sebelumnya.

<!-- Berkas tujuan: docs/pemetaan-test.md, tempel PALING BAWAH bagian 5 (di bawah entri K1 dan K2). Append-only. -->

### 2026-11-10 | [AIK]: K8, SEC-16, SEC-17, SEC-12, SEC-10, sinkron centang

Baru terbukti: K8 (`alamat_simpan` milik orang lain = 404, alamat pemilik tetap); SEC-16 (catatan terbuka lagi setelah alih hari, owner dan customer; hak `catatan_order` tanpa UPDATE dan DELETE; daftar aksi `kedai`); SEC-17 (hak `service_role` tanpa DELETE dan TRUNCATE); SEC-12 (harga di order adalah salinan); SEC-10 (query order dan riwayat bersih).

SEC yang dicentang di sheet: SEC-05, SEC-09, SEC-10, SEC-11, SEC-12, SEC-14, SEC-15, SEC-16, SEC-17. K3 dan K7 tidak perlu diulang.

Keputusan ketua: SEC-10 dicentang walau "customer menang" tidak teramati (owner yang menang, diterima); TC-K10-03 lewat layar dicoret (server sudah menyaring).

Sisa: SEC-19 (Android), non-SEC (O22, wizard Besok, jumlah menu, Segarkan, pilihan non-bawaan di HP), query cek 8 dan 9 paling akhir, tes pemakai. ORD.14 tetap Belum, menunggu keputusan ketua soal syarat tutup.
