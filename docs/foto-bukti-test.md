/docs/foto-bukti-test.md

# 🧪 foto-bukti-test.md: Kasus Uji Foto Bukti (FTO.06)

> **Dibuat 11 Nov 2026 di sesi tes FTO.06.** Hanya kasus uji: **tanpa hasil, tanpa bukti, tanpa data pelanggan** (`AGENTS.md` bagian 10 butir 2). Status per kasus ada di `docs/pemetaan-test.md` bagian 5 dan Handoff di `docs/foto-bukti.md` bagian 9.
> **Dilampirkan hanya di sesi tes**, bersama `AGENTS.md`, `foto-bukti.md`, `order.md`, `security.md`, dan `pemetaan-test.md`.
> **Selisih:** `AGENTS.md` menang atas berkas ini. Semua kasus **P0** (data pelanggan, penghapusan data, akses).

---

## 1. Persiapan

- Akun dummy: 1 penjaga, 1 owner, minimal 2 customer (satu pemilik order, satu bukan). Penjaga kedua opsional (kasus FT-20).
- Order dummy tipe **Diantar** berstatus **Diantar** atau **Selesai**, minimal dua (satu untuk ukuran dan penggantian, satu untuk hak lihat).
- **Foto dummy:** benda netral (meja kosong, tembok). Tanpa wajah, rumah, seragam, struk, atau dokumen.
- **Id order** diambil lewat konsol dengan `order_daftar` lalu dicari menurut nomor, bukan diketik dari tebakan.
- Dashboard Supabase (akun ketua) dibuka di profil browser terpisah, **logout** sesudahnya.

## 2. Hal yang sering menjebak penguji

- **`bersihkan` tidak bisa dipanggil dari konsol aplikasi** (diblokir CORS, tidak dirancang untuk browser). Panggilannya lewat `curl` di Terminal atau lewat penjadwal.
- **Token unggah** muncul di galat konsol. Jangan ditempel ke chat; salin baris hasil saja.
- Berkas yang terunggah tetapi ditolak `foto_catat` **tidak dihapus** server (tanpa DELETE); ia menjadi berkas tanpa baris.
- Tautan lihat hidup 300 detik; tab konsol jangan di-refresh selama menunggu.

---

## 3. Kasus Uji

| ID    | Kasus                                                                                                                                                                    | Hasil yang benar                                                                                                                                       | Jenis bukti                                              | SEC            |
| :---- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------- | :------------- |
| FT-01 | Penjaga mengambil foto di order Diantar berstatus Diantar atau Selesai.                                                                                                  | "Foto bukti terkirim", thumbnail tampil.                                                                                                               | Layar                                                    |                |
| FT-02 | Ukuran akhir berkas di Storage.                                                                                                                                          | Sekitar 50 KB atau kurang; wajib di bawah 150 KB. Cek beberapa jenis foto, termasuk yang terang dan penuh detail.                                      | Ukuran berkas di dashboard Storage                       |                |
| FT-03 | Tombol foto di tipe Diambil, Makan di warung, dan status sebelum Diantar.                                                                                                | Tombol tidak muncul.                                                                                                                                   | Layar                                                    |                |
| FT-04 | Pengunggah asli mengganti foto.                                                                                                                                          | "Foto bukti diganti.", thumbnail baru, foto lama ditandai diganti.                                                                                     | Layar; isi folder Storage                                | SEC-29         |
| FT-05 | Selain pengunggah asli (owner, atau penjaga lain) memanggil `foto_minta_unggah` pada order yang sudah punya foto.                                                        | 403 "Foto ini hanya bisa diganti oleh yang mengunggahnya", tanpa `url_unggah`.                                                                         | Balasan server                                           | SEC-29         |
| FT-06 | `foto_lihat` sesudah foto diganti.                                                                                                                                       | Hanya foto aktif (waktu foto baru); foto lama tidak bisa dibuka lewat aplikasi.                                                                        | Balasan server                                           | SEC-29         |
| FT-07 | Customer pemilik order, owner, dan penjaga melihat foto di detail order.                                                                                                 | Foto tampil di ketiga layar.                                                                                                                           | Layar                                                    | SEC-20         |
| FT-08 | Customer bukan pemilik memanggil `foto_lihat` dengan id order lain.                                                                                                      | 404 umum, tanpa `url`.                                                                                                                                 | Balasan server                                           | SEC-20, SEC-05 |
| FT-09 | Buka alamat berkas langsung (`/object/public/...`) di jendela privat.                                                                                                    | Galat (Bucket not found), bukan gambar.                                                                                                                | Tampilan peramban dan balasan Storage                    | SEC-20         |
| FT-10 | Buka tautan lihat setelah lewat 300 detik.                                                                                                                               | Ditolak (400 InvalidJWT), bukan gambar; sebelum lewat, 200.                                                                                            | Balasan Storage                                          | SEC-20         |
| FT-11 | Penjaga memanggil `foto_lihat` untuk order Menunggu, Ditolak, dan Dibatalkan (satu per satu).                                                                            | 404 umum, tanpa `url`.                                                                                                                                 | Balasan server                                           | SEC-08         |
| FT-12 | Kirim berkas bukan gambar (teks biasa) ke alamat unggah.                                                                                                                 | Ditolak bucket (415 `invalid_mime_type`); tidak ada berkas baru.                                                                                       | Balasan Storage                                          | SEC-20         |
| FT-13 | Kirim gambar di atas batas bucket 256 KB.                                                                                                                                | Ditolak bucket (413 `EntityTooLarge`); tidak ada berkas baru.                                                                                          | Balasan Storage                                          |                |
| FT-14 | Kirim gambar di antara 150 dan 256 KB, lalu `foto_catat`.                                                                                                                | Lolos bucket, `foto_catat` menolak 400 "Foto terlalu besar"; foto aktif tidak berubah.                                                                 | Balasan server; `foto_lihat` sesudahnya                  |                |
| FT-15 | `foto_catat` untuk lokasi yang belum terunggah.                                                                                                                          | 409 "Foto belum terunggah".                                                                                                                            | Balasan server                                           |                |
| FT-16 | `bersihkan` dipanggil tanpa rahasia, dengan rahasia salah, dan hanya dengan kunci publishable (`apikey` dan `Authorization`).                                            | Semua ditolak 401; isi bucket tidak berubah (hitung berkas sebelum dan sesudah).                                                                       | Balasan server (`curl`); jumlah berkas di Storage        | SEC-21         |
| FT-17 | `bersihkan` uji manual non-simulasi dengan rahasia sah (template uji di `supabase/templates/`).                                                                          | Berkas yang ditandai diganti terhapus dari Storage dan barisnya terisi waktu dibersihkan; foto aktif utuh. **Butuh penjelasan dampak dan "OK" ketua.** | Balasan `bersihkan`; isi folder Storage; query baca-saja | SEC-29         |
| FT-18 | Pembersihan foto aktif yang lewat `foto_simpan_hari` (14 hari). Bila dipercepat dengan menurunkan nilainya sementara: **butuh "OK" ketua**, kembalikan ke 14 sesudahnya. | Hanya foto yang lewat batas terhapus; yang belum tetap utuh; baris order dan catatan tidak berubah.                                                    | Balasan `bersihkan`; isi bucket; query baca-saja         | SEC-17         |
| FT-19 | Tampilan sesudah foto dibersihkan di layar customer, owner, dan penjaga.                                                                                                 | "Foto sudah dihapus"; order dan catatan utuh.                                                                                                          | Layar; balasan `foto_lihat` (`status: "dibersihkan"`)    |                |
| FT-20 | Penyapuan berkas tanpa baris yang lebih tua dari batas (bahan: berkas yang ditolak `foto_catat`).                                                                        | Berkas yatim terhapus; berkas yatim yang lebih muda dari batas tidak tersentuh.                                                                        | Balasan `bersihkan`; isi bucket                          |                |
| FT-21 | Jadwal mingguan jalan sendiri (Minggu 02.00 WIB).                                                                                                                        | Status 200, `"ok":true`, `"simulasi":false`, tanpa gagal.                                                                                              | `cron.job_run_details` dan `net._http_response`          |                |
| FT-22 | Penggantian foto oleh penjaga kedua (bukan pengunggah asli). Opsional, penguat FT-05; butuh baris baru di `staf` ("OK" ketua).                                           | 403, sama seperti FT-05.                                                                                                                               | Balasan server                                           | SEC-29         |

---

## 4. Urutan yang disarankan

1. FT-01 sampai FT-03 (layar, cepat), lalu FT-04 sampai FT-06.
2. FT-07 sampai FT-11 (hak lihat), lalu FT-12 sampai FT-15 (berkas salah).
3. FT-16 (`curl`, tanpa rahasia), lalu hitung berkas Storage.
4. Setelah jadwal pertama berjalan: FT-21, lalu FT-17, FT-18 sampai FT-20 (butuh "OK" ketua untuk yang menghapus).
5. FT-22 bila penjaga kedua sudah ada.

## 5. Kapan SEC boleh dicentang

- **SEC-20:** FT-07 sampai FT-10 dan FT-12 (jenis bukti sesuai kolom Catatan sheet).
- **SEC-21:** FT-16, termasuk hitungan isi bucket sebelum dan sesudah.
- **SEC-29:** FT-04 sampai FT-06 **dan** FT-17 (berkas lama hilang saat pembersihan).
- **FTO.06:** semua kasus kecuali FT-21 (itu FTO.07) dan FT-22 (opsional).
- Ragu yang menyangkut data atau akses: anggap belum lulus.
