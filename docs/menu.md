/docs/menu.md

# 🍱 menu.md: Daftar Menu, Harga, dan Tersedia/Habis

> **Versi 1.0 (4 Nov 2026), hasil sesi strategi.** Bergantung pada `akun.md` (peran owner dikenali server) dan `database.md`.
> **Status:** MN1 sampai MN9 disepakati ketua (sesi strategi 4 Nov 2026). Butir **(bawaan)** = pilihan penulis, boleh diubah sebelum dikerjakan. Belum ada yang dikerjakan.
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini** (+ `database.md` untuk langkah tabel dan fungsi). Kerjakan langkah di bagian 5. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 9.
> **Berkas yang diminta AI di awal sesi:** berkas migration terbaru, `supabase/functions/kedai/`, dan berkas JS menu bila sudah ada.
> **Tanpa kode dan tanpa isi SQL.** **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Fitur ini High-Risk (P0) di sisi harga:** harga memengaruhi total order. Tampilan menu sendiri Low-Risk.

---

## 1. Tujuan

Owner mengelola daftar menu sendiri lewat aplikasi (tanpa menunggu ketua), dan customer, penjaga, serta wizard owner memakai daftar yang sama. Menu dan harga di warung sering berubah, jadi pengelolaannya harus mudah untuk owner non-IT.

---

## 2. Keputusan

| No  | Keputusan                                                                                                                                                                                                                                                    | Dasar                                                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| MN1 | **Owner mengelola menu lewat aplikasi:** tambah, ubah nama dan harga, tombol **Tersedia/Habis**, dan **nonaktifkan** menu. Customer dan penjaga hanya melihat. Semua owner setara.                                                                           | Keputusan ketua 4 Nov 2026.                                                |
| MN2 | Tiap menu: **nama** (3 sampai 40 karakter), **harga** (rupiah, bilangan bulat, lebih dari 0 dan di bawah batas wajar), **Tersedia/Habis**, **aktif/nonaktif**, dan **foto (opsional)**. **Tanpa kategori** di versi 1. **(bawaan)**                          | Keputusan ketua (foto opsional); kategori masuk `bonus.md`.                |
| MN3 | **Habis** = menu tetap tampil ke customer tapi abu-abu dan tidak bisa dipilih. **Nonaktif** = tidak tampil di daftar customer dan wizard (pengganti hapus). Menu **tidak pernah dihapus** (order lama merujuk ke menu).                                      | `AGENTS.md` bagian 7 (tanpa DELETE).                                       |
| MN4 | **Harga selalu dihitung server.** Aplikasi tidak pernah mengirim harga atau total, hanya id menu dan jumlah. Saat order dibuat, **nama dan harga satuan disalin ke order**, jadi mengubah harga atau nama menu tidak mengubah order lama.                    | `security.md` aturan 2; SEC-12.                                            |
| MN5 | Semua aksi menu memakai Edge Function `kedai`: `menu_daftar` (semua peran), `menu_simpan`, `menu_stok` (Tersedia/Habis), `menu_nonaktif` (owner saja). Server memeriksa peran dari tabel `staf`.                                                             | `database.md` bagian 5.                                                    |
| MN6 | **Foto menu opsional**: dikompres di HP (target lebih kecil dari foto bukti, sekitar 100 KB), disimpan di Storage bucket terpisah **privat**, ditampilkan lewat tautan sementara dari server. **Tidak dibersihkan otomatis** (jumlahnya kecil). **(bawaan)** | Hemat kuota 1 GB file dan 5 GB egress; teknik sama dengan `foto-bukti.md`. |
| MN7 | Daftar menu diambil **sekali saat layar dibuka** (dan lewat tombol Segarkan), tidak ada polling. Perubahan Tersedia/Habis oleh owner tidak memicu push ke customer (bawaan).                                                                                 | `notifikasi.md`; hemat free tier.                                          |
| MN8 | Order yang sedang Menunggu **tidak berubah** bila menu kemudian ditandai Habis; owner yang memutuskan (setujui atau tolak lalu follow up lewat WA).                                                                                                          | Keputusan ketua: kesiangan atau menu habis diselesaikan lewat tolak + WA.  |
| MN9 | Perubahan harga oleh owner langsung berlaku untuk order **baru**. Tidak ada riwayat harga terpisah (cukup salinan di order).                                                                                                                                 | Sederhana; riwayat harga masuk `bonus.md` bila dibutuhkan.                 |

---

## 3. Prasyarat

`akun.md` selesai (peran owner dikenali server, fungsi `kedai` terpasang). Foto menu (MN6) bergantung pada `foto-bukti.md` bagian teknik unggah (FTO.02 dan FTO.03).

---

## 4. Yang dibuat

| Komponen                   | Isi                                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------------- |
| Tabel `menu`               | Skema di `database.md`. RLS aktif tanpa policy; hak `service_role` minimal, tanpa DELETE.               |
| Aksi `kedai` untuk menu    | `menu_daftar`, `menu_simpan`, `menu_stok`, `menu_nonaktif` (MN5).                                       |
| Layar Kelola Menu (owner)  | Daftar menu, tombol Tersedia/Habis besar, tambah dan ubah, nonaktifkan.                                 |
| Daftar menu untuk customer | Dipakai di layar Pesan; menu Habis abu-abu. Dipakai juga oleh wizard owner dan penjaga (hanya membaca). |
| Foto menu (opsional)       | Langkah akhir, setelah teknik foto siap.                                                                |

---

## 5. Urutan pekerjaan (untuk TODO sheet, prefix MNU)

Langkah ⚠️ butuh penjelasan dampak dan "OK" ketua.

1. **MNU.01 ⚠️** Migration: tabel `menu`, hak minimal, RLS. SQL disalin ke `supabase/migrations/` dulu. Cek hak `service_role` setelahnya.
2. **MNU.02 ⚠️** Aksi menu di fungsi `kedai` (MN5), hanya owner yang boleh mengubah; deploy dengan urutan aman.
3. **MNU.03** Layar Kelola Menu (owner), termasuk tombol Tersedia/Habis.
4. **MNU.04** Daftar menu untuk customer (dan dipakai ulang di order).
5. **MNU.05** Foto menu opsional: pakai teknik kompres dan unggah dari `foto-bukti.md`, bucket terpisah.
6. **MNU.06** Sesi tes menu (dokumen `menu-test.md` dibuat di sesi tes), bukti untuk hak owner dan harga.

---

## 6. Aturan yang paling sering terlanggar

| Aturan                                                            | Akibat bila dilanggar                                        |
| ----------------------------------------------------------------- | ------------------------------------------------------------ |
| Menerima harga atau total dari aplikasi                           | Customer bisa memesan dengan harga sendiri (SEC-06, SEC-12). |
| Order merujuk harga menu terbaru, bukan salinan saat order dibuat | Mengubah harga menu mengacaukan order dan catatan lama.      |
| Menyediakan tombol hapus menu                                     | Order lama kehilangan rujukan; gunakan nonaktifkan.          |
| Customer atau penjaga bisa memanggil `menu_simpan`                | Siapa pun bisa mengubah harga (SEC-07, SEC-08).              |
| Foto menu berukuran besar                                         | Kuota file dan egress free tier cepat habis.                 |
| Menampilkan menu nonaktif ke customer                             | Customer memesan menu yang sudah tidak dijual.               |

---

## 7. Dampak dan pembatalan

- **Migration menu:** tabel baru, tidak menyentuh data lain. Bisa dibatalkan dengan SQL pembatalan tertulis di repo.
- **Harga salah ketik oleh owner:** ubah lagi lewat layar menu; order yang sudah dibuat dengan harga salah **tidak berubah** (salinan). Koreksi order itu lewat follow up WA dan catatan.
- **Menu ditandai Habis padahal masih ada:** tekan Tersedia lagi; berlaku untuk order berikutnya.

---

## 8. Ditunda

- Kategori menu, urutan tampil, dan paket atau varian (pedas, porsi).
- Kuota porsi harian dan batas jam pesan (`bonus.md`).
- Riwayat perubahan harga.
- Push ke customer saat menu tersedia lagi.

---

## 9. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

_(belum ada blok)_
