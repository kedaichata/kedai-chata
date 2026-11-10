/docs/order-test.md

# 🧪 order-test.md: Kasus Uji ORD.14 (Order)

> **Dibuat 10 Nov 2026 di sesi tes ORD.14.** Hanya memuat **kasus uji**, tanpa hasil dan tanpa bukti (`AGENTS.md` bagian 10 butir 2). Status per tes ada di `pemetaan-test.md` bagian 5 (log). Dilampirkan di sesi tes bersama `AGENTS.md`, `order.md`, `security.md`, dan `pemetaan-test.md`.
> **Selisih:** `AGENTS.md` menang atas berkas ini.
> **Persiapan umum:** akun dummy (customer, customer kedua, owner, penjaga), dua jendela ChATA terpisah (biasa dan privat), konsol lewat `window.KedaiAkun.panggilKedai(aksi, data)`. Jangan buka dashboard kecuali untuk query baca-saja (login ketua, lalu logout). Jangan geser jam Mac bersama.

---

## Pola tes bersamaan (dua sesi)

1. Buat order dummy lewat layar, pastikan tampil di kedua jendela.
2. Pasang skrip konsol di tiap jendela. Tiap skrip membaca order dulu, lalu menunggu **jam target yang sama** (jam Mac hanya untuk penjadwalan, bukan untuk server) sebelum memanggil aksi.
3. Jangan sentuh jendela mana pun sampai lewat jam target.
4. Hasil benar: **tepat satu menang**, yang lain mendapat pesan sesuai statusnya. Dua-duanya sukses = P0.
5. Urutan tiba di server tidak bisa disimpulkan dari stempel waktu di konsol.
6. Tutup dengan cek status akhir dan riwayat (`order_daftar`, `order_detail`) bahwa hanya satu perubahan tercatat.

---

## K1. Hak per peran (SEC-07, SEC-08, SEC-13, SEC-14)

| ID       | Kasus                                                                                                                                                           | Hasil yang benar                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| TC-K1-01 | Customer memanggil `menu_simpan`, `menu_stok`, `order_setuju`, `order_tolak`, `order_metode_koreksi`, `order_alih_hari`, `order_buat_wakil`, `pelanggan_luar_*` | 403 "Aksi ini hanya untuk owner."                                                          |
| TC-K1-02 | Customer `order_batal` pada order yang sudah Disetujui                                                                                                          | 409 "sudah diproses"; status tidak berubah                                                 |
| TC-K1-03 | Penjaga memanggil aksi owner-only (`menu_*`, `order_alih_hari`, `order_setuju`, `order_tolak`, `order_metode_koreksi`, `order_buat_wakil`, `pelanggan_luar_*`)  | 403                                                                                        |
| TC-K1-04 | Penjaga `order_batal`                                                                                                                                           | 403                                                                                        |
| TC-K1-05 | Penjaga `order_detail` dengan id langsung pada order Menunggu, Ditolak, Dibatalkan                                                                              | 404 "Pesanan tidak ditemukan."                                                             |
| TC-K1-06 | Penjaga `order_detail` pada order wakil                                                                                                                         | 200; nama, WA, dan alamat salinan terlihat; tanpa id pelanggan; riwayat dan pemutus kosong |
| TC-K1-07 | Penjaga `pelanggan_luar_daftar`                                                                                                                                 | 403                                                                                        |

## K2. Dua sesi bersamaan (SEC-10)

| ID       | Kasus                                                    | Hasil yang benar                                                        |
| -------- | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| TC-K2-01 | Dua owner Setuju pada order Menunggu yang sama           | Satu 200, satu 409 "sudah diproses"; pemutus tercatat                   |
| TC-K2-02 | Customer Batal vs owner Setuju                           | Satu menang, satu 409; riwayat bersih                                   |
| TC-K2-03 | Customer Batal vs owner Tolak                            | Satu menang; bila owner menang, customer 409 "sudah ditolak sebelumnya" |
| TC-K2-04 | Dua sesi owner `order_status` maju pada status yang sama | Satu 200, satu 409 "status sudah berubah"; riwayat satu baris maju      |
| TC-K2-05 | Ketuk dua kali tombol status di layar                    | Hanya satu perubahan (hanya lewat konsol; tombol langsung berganti)     |
| TC-K2-06 | Sisi **customer menang** pada TC-K2-02 dan TC-K2-03      | Owner 409 "sudah dibatalkan"                                            |

Query baca-saja `order` (SQL Editor) melengkapi bukti SEC-10 sesuai kolom Catatan sheet.

## K3. Status dan alih hari (SEC-15)

| ID       | Kasus                                                                                | Hasil yang benar                                              |
| -------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| TC-K3-01 | Loncat status, mundur lebih dari satu langkah, mundur dari Selesai, jalur salah tipe | Ditolak                                                       |
| TC-K3-02 | Mundur satu langkah yang sah                                                         | Diterima, tercatat di riwayat                                 |
| TC-K3-03 | Kembali ke Disetujui dari Diantar/Siap lewat `order_status`                          | Ditolak                                                       |
| TC-K3-04 | Kembali ke Disetujui lewat `order_alih_hari` oleh owner (bukan dari Selesai)         | Diterima, tercatat (hari lama dan baru, siapa, kapan, alasan) |
| TC-K3-05 | `order_alih_hari` dari tiap status; Selesai dan order yang sudah Besok               | Selesai 409; sudah Besok 409                                  |

## K4. Catatan (SEC-16)

| ID       | Kasus                                                               | Hasil yang benar                                        |
| -------- | ------------------------------------------------------------------- | ------------------------------------------------------- |
| TC-K4-01 | Penjaga menambah catatan                                            | 403                                                     |
| TC-K4-02 | Batas 10 catatan dan 200 karakter                                   | 409 / 400                                               |
| TC-K4-03 | Catatan saat Diproses ke atas, Ditolak, Dibatalkan, Selesai         | Ditolak 409; terbuka lagi bila dimundurkan ke Disetujui |
| TC-K4-04 | Catatan terbuka lagi setelah **alih hari**                          | Diterima untuk customer pemilik dan owner               |
| TC-K4-05 | Batas 10 dan karakter lewat layar; 409 saat status berubah di layar | Pesan server tampil                                     |
| TC-K4-06 | Edit atau hapus catatan                                             | Tidak ada jalurnya (cek bersama SEC-17)                 |
| TC-K4-07 | Catatan di order wakil                                              | Diterima; penulis dari server                           |

## K5. Tag HTML (SEC-18)

Isi `<b>x</b>` atau `<img src=x>` di tiap kolom, buka di layar customer, owner, penjaga. Hasil benar: tampil sebagai teks biasa.

| ID       | Kolom                                         |
| -------- | --------------------------------------------- |
| TC-K5-01 | Catatan                                       |
| TC-K5-02 | Alasan tolak, alasan batal, alasan alih hari  |
| TC-K5-03 | Nama pemesan, alias dan alamat                |
| TC-K5-04 | Nama menu                                     |
| TC-K5-05 | Nama pelanggan tanpa akun (daftar dan wizard) |

## K6. Harga, total, status palsu (SEC-06, SEC-12)

| ID       | Kasus                                                                                                                          | Hasil yang benar                                                |
| -------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| TC-K6-01 | `order_buat` dan `order_buat_wakil` dengan harga, total, status, peran palsu                                                   | Diabaikan                                                       |
| TC-K6-02 | Aksi lain yang menerima isian (`order_status`, `order_setuju`, `catatan_tambah`, dll.) dengan peran, id pengguna, status palsu | Diabaikan                                                       |
| TC-K6-03 | Ubah harga menu, order lama tetap                                                                                              | Query baca-saja `order` dan `order_item` menunjukkan harga lama |

## K7. Metode bayar (SEC-11)

| ID       | Kasus                                           | Hasil yang benar |
| -------- | ----------------------------------------------- | ---------------- |
| TC-K7-01 | Setuju dengan metode kosong, asing, huruf kecil | 400              |
| TC-K7-02 | Koreksi metode oleh non-owner                   | 403              |
| TC-K7-03 | Koreksi metode pada Selesai; metode sama        | 409; 400         |

## K8. Milik orang lain (SEC-05, SEC-09)

| ID       | Kasus                                                                                      | Hasil yang benar     |
| -------- | ------------------------------------------------------------------------------------------ | -------------------- |
| TC-K8-01 | Customer B: `order_detail`, `order_batal`, `catatan_tambah`, `catatan_dibaca` pada order A | 404                  |
| TC-K8-02 | Customer B: `order_daftar`                                                                 | Tidak memuat milik A |
| TC-K8-03 | `alamat_simpan` dengan id alamat milik orang lain                                          | Ditolak              |

## K9. Hak dan hapus (SEC-17)

| ID       | Kasus                     | Hasil yang benar     |
| -------- | ------------------------- | -------------------- |
| TC-K9-01 | Query baca-saja hak tabel | Tanpa DELETE         |
| TC-K9-02 | Daftar aksi `kedai`       | Tidak ada aksi hapus |

## K10. Batal dan alih hari per status (teks baris ORD.14)

| ID        | Kasus                                                                     | Hasil yang benar                                 |
| --------- | ------------------------------------------------------------------------- | ------------------------------------------------ |
| TC-K10-01 | Owner `order_batal` dari Disetujui, Diproses, Diantar/Siap/Siap disajikan | 200 Dibatalkan; riwayat mencatat dari status apa |
| TC-K10-02 | Owner `order_batal` pada Selesai                                          | Ditolak                                          |
| TC-K10-03 | Penjaga menekan tombol status pada order Dibatalkan lewat layar           | Tidak terlihat atau ditolak                      |

## K11. Non-SEC dari handoff

| ID        | Kasus                                       | Hasil yang benar                                                    |
| --------- | ------------------------------------------- | ------------------------------------------------------------------- |
| TC-K11-01 | Urutan daftar owner dan penjaga (O22)       | Hanya Hari ini dan Besok; Hari ini dulu; urutan kelompok sesuai O22 |
| TC-K11-02 | Wizard: hari Besok                          | `hari_target` = besok menurut server                                |
| TC-K11-03 | Wizard: tambah, kurangi, hapus jumlah menu  | Layar tidak loncat; total resmi dari server                         |
| TC-K11-04 | Wizard: Segarkan saat terisi                | Isian bertahan                                                      |
| TC-K11-05 | Wizard: pilihan menu non-bawaan di HP       | Teks pilihan tersalin ke order                                      |
| TC-K11-06 | Query cek 8 dan 9                           | Sesuai berkas cek (**paling akhir**)                                |
| TC-K11-07 | Tes pemakai: satu order wakil tanpa dipandu | Selesai; titik bingung dicatat (**setelah semua lulus**)            |

## K12. Menunggu Android

| ID        | Kasus                                                                                           |
| --------- | ----------------------------------------------------------------------------------------------- |
| TC-K12-01 | SEC-19: jam HP digeser, pesan lewat layar, cek `hari_target` dan waktu catatan (gerbang FTO.01) |
| TC-K12-02 | `sw.js` v17 muncul di HP; wizard di HP                                                          |

---

## Catatan Susulan dan Handoff (append-only)

> Handoff ORD.14 ditempel di `order.md` bagian 9 (`AGENTS.md` bagian 2 butir 9). Berkas ini hanya memuat kasus uji.
