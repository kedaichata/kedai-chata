/docs/bonus.md

# 🎁 bonus.md: Kandidat Fitur Versi 2 dan 3 (Belum Berurutan)

> **Versi 1.1 (4 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Perubahan 1.1: B27 dan B29 diputuskan (tidak di versi 1), B28 disesuaikan, B31 baru. Daftar kandidat yang **sengaja ditunda** dari versi 1. **Belum ada yang diputuskan dan belum ada urutan.**
> **Cara pakai:** dibaca saat **review pemakaian versi 1** (`LNC.05` di `features.md`, sekitar 2 minggu setelah dibuka untuk semua). Kolom **Alasan** dikosongkan sekarang dan diisi ketua setelah review: apa yang benar-benar paling dibutuhkan, berdasarkan pemakaian nyata.
> **Bukan dokumen kerja sesi kode.** Sesi kode tidak mengerjakan butir di sini. Kandidat yang dipilih naik jadi **dokumen fitur sendiri** lewat sesi strategi (satu fitur = satu md + satu md tes), lalu masuk sheet dengan prefix baru. Sesi kode hanya menambah blok di bagian 4 (misalnya bila ada kandidat baru dari lapangan).
> **Prefix sheet:** BNS. **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.

---

## 1. Cara Membaca Daftar

- **Asal** = dokumen tempat kandidat pertama kali disebut sebagai "ditunda".
- **Alasan** = diisi **setelah** review pemakaian. Selama kosong, kandidat belum dianggap dibutuhkan.
- Urutan baris **tidak berarti prioritas**.
- Versi (2 atau 3) ditentukan saat review; satu-satunya petunjuk awal: payment gateway disebut sebagai kandidat **versi 3** di `AGENTS.md`.

---

## 2. Daftar Kandidat

### A. Order dan pembayaran

| No  | Kandidat                                                         | Asal                                | Alasan |
| --- | ---------------------------------------------------------------- | ----------------------------------- | ------ |
| B1  | Chat di aplikasi (menggantikan follow up lewat WA)               | `order.md` O13                      |        |
| B2  | Order H+x fleksibel (lebih dari Hari ini/Besok)                  | `order.md` O2                       |        |
| B3  | Batas jam pesan dan kuota porsi menu                             | `order.md` O2, `menu.md` bagian 8   |        |
| B4  | Utang atau bayar nanti                                           | `order.md` O6                       |        |
| B5  | Ongkir dan diskon                                                | `order.md` O3                       |        |
| B6  | Payment gateway                                                  | `order.md` O6, `AGENTS.md` bagian 1 |        |
| B7  | Foto bukti transfer dari customer                                | `foto-bukti.md` bagian 8            |        |
| B8  | Penggabungan pelanggan tanpa akun ke akun yang mendaftar sendiri | `order.md` O16, `akun.md` bagian 8  |        |

### B. Menu

| No  | Kandidat                                 | Asal                       | Alasan |
| --- | ---------------------------------------- | -------------------------- | ------ |
| B9  | Kategori menu dan urutan tampil          | `menu.md` MN2 dan bagian 8 |        |
| B10 | Paket atau varian menu (pedas, porsi)    | `menu.md` bagian 8         |        |
| B11 | Riwayat perubahan harga                  | `menu.md` MN9 dan bagian 8 |        |
| B12 | Push ke customer saat menu tersedia lagi | `menu.md` MN7 dan bagian 8 |        |

### C. Foto

| No  | Kandidat                                        | Asal                     | Alasan |
| --- | ----------------------------------------------- | ------------------------ | ------ |
| B13 | Beberapa foto per order                         | `foto-bukti.md` bagian 8 |        |
| B14 | Foto dengan lokasi atau stempel waktu di gambar | `foto-bukti.md` bagian 8 |        |
| B15 | Unduh foto oleh owner untuk arsip               | `foto-bukti.md` bagian 8 |        |
| B16 | Lama simpan foto berbeda per jenis order        | `foto-bukti.md` bagian 8 |        |

### D. Akun dan keamanan

| No  | Kandidat                                                         | Asal                                       | Alasan |
| --- | ---------------------------------------------------------------- | ------------------------------------------ | ------ |
| B17 | Verifikasi nomor WA (OTP) dan verifikasi email                   | `akun.md` bagian 8                         |        |
| B18 | Login dengan Google atau nomor WA                                | `akun.md` bagian 8                         |        |
| B19 | Kelola staf dari dalam aplikasi (tambah, nonaktifkan oleh owner) | `akun.md` bagian 8                         |        |
| B20 | Perbedaan hak antar owner                                        | `akun.md` bagian 8                         |        |
| B21 | Rate limit khusus                                                | `akun.md` bagian 8, `security.md` bagian 6 |        |

### E. Laporan dan kecerdasan buatan

| No  | Kandidat                    | Asal                                        | Alasan |
| --- | --------------------------- | ------------------------------------------- | ------ |
| B22 | Rekap harian dan pendapatan | `order.md` bagian 8, `features.md` bagian 8 |        |
| B23 | Integrasi LLM               | `features.md` bagian 8                      |        |

### F. Infrastruktur

| No  | Kandidat                                                           | Asal                                          | Alasan |
| --- | ------------------------------------------------------------------ | --------------------------------------------- | ------ |
| B24 | Domain sendiri                                                     | `fondasi.md` bagian 8                         |        |
| B25 | Lingkungan uji terpisah                                            | `fondasi.md` bagian 8                         |        |
| B26 | Pemantauan otomatis (termasuk pengingat agar project tidak dijeda) | `fondasi.md` bagian 8, `security.md` bagian 6 |        |

### G. Usulan baru dari review md (4 Nov 2026)

Hasil review md 4 Nov 2026. B27 dan B29 sudah diputuskan (tidak di versi 1); B28 dan B30 tetap kandidat; B31 baru.

| No  | Kandidat                                                                                                                                                                                                                                                                                      | Asal                        | Alasan |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------ |
| B27 | **Penanda warung tutup/libur** (customer tidak bisa memesan untuk hari itu, dan terlihat jelas). **Diputuskan 4 Nov 2026: tidak dikerjakan di versi 1** (warung buka 7 hari; order di luar jam atau saat libur sering tetap dilayani, owner memutuskan lewat Setujui/Tolak + WA).             | Review md                   |        |
| B28 | **Pengaturan yang bisa diubah owner dari aplikasi** (misalnya batas jumlah item atau catatan), tanpa menunggu ketua                                                                                                                                                                           | Review md                   |        |
| B29 | **Penutupan atau tanda otomatis untuk order yang menggantung** (hari kemarin masih Menunggu atau Disetujui). **Diputuskan 4 Nov 2026: tanpa tanda dan tanpa tutup otomatis di versi 1**; order yang hari antarnya sudah lewat tidak ditampilkan di daftar owner dan penjaga (`order.md` O22). | `order.md` bagian 8 butir 2 |        |
| B30 | **Pengingat atau notifikasi tambahan** (di luar tabel `notifikasi.md` bagian 4)                                                                                                                                                                                                               | `notifikasi.md` bagian 8    |        |
| B31 | **Ringkasan order 7 hari terakhir untuk owner** (di menu Lainnya)                                                                                                                                                                                                                             | Keputusan ketua 4 Nov 2026  |        |

> Tiga butir yang dulu "Belum diputuskan" di `order.md` bagian 8 sudah diputuskan 4 Nov 2026 (mundur satu langkah, tanpa tanda menggantung, tanpa tombol batal setelah Disetujui) dan tidak masuk daftar ini.

---

## 3. Proses Memilih Setelah Review

1. Review pemakaian versi 1 (`LNC.05`): catat keluhan, permintaan, dan hal yang sering ditanyakan lewat WA.
2. Isi kolom **Alasan** untuk kandidat yang benar-benar terbukti dibutuhkan.
3. Ketua memilih urutan dan versi (2 atau 3). Kandidat terpilih naik jadi dokumen fitur lewat **sesi strategi**; kandidat lain tetap di sini.
4. Dokumen fitur baru mengikuti pola yang sama dengan dokumen lain (tabel keputusan, aturan yang paling sering terlanggar, urutan pekerjaan, ditunda), dan `AGENTS.md` bagian 5 diperbarui lewat blok susulan.

---

## 4. Catatan Susulan (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini bila ada kandidat atau kejadian baru dari lapangan. Format: `### YYYY-MM-DD: topik`. Yang paling akhir menang.

---

### 2026-11-10: Kandidat game tambahan

**Berkas tujuan:** `docs/bonus.md`. Sumber: `docs/gim.md` (GM2, bagian 8).

- **Catch the Vibes** (game dari PWA lama): kandidat game kedua. Versi 1 hanya Arithmetics.
- Game ringan lain yang cocok untuk ibu-ibu (misalnya tebak pasangan kartu atau teka-teki kata) boleh ditambah di sini; belum dipilih.
- Bila game kedua dikerjakan: menu hamburger berubah dari satu item menjadi kelompok Game (lihat GM6), dan gayanya tetap di `game.css`.
- Skor bersama atau leaderboard: tidak dikerjakan; butuh database dan keputusan terpisah yang berisiko (GM8).

### 2026-11-11: Kandidat game lain dan pengembangan game (dari gim.md)

Keputusan ketua (GM2 dan bagian Ditunda di `docs/gim.md`). Game Arithmetics sudah jalan di versi 1; yang di bawah ini kandidat versi 2 atau 3, urutannya ditentukan setelah review pemakaian.

- **Catch the Vibes** dan game lain sebagai kandidat game kedua. Alasan belum tercatat.
- **Kelompok Game di menu hamburger** (bisa dilipat) baru dibuat bila game kedua datang; sekarang menu berisi satu item langsung (GM6).
- **Leaderboard atau skor bersama:** butuh database dan keputusan terpisah yang berisiko (game sekarang tanpa server, GM8).
- **Hamburger berisi item lain** (Bantuan, Keluar, dll.), **suara**, **getar yang bisa diatur**, dan **pilihan tingkat kesulitan**.
