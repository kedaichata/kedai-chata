/docs/desain.md

# 🎨 desain.md: Antarmuka, Tema Marun dan Emas, Navigasi, dan Komponen

> **Versi 1.2 (5 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Perubahan 1.2: DS10 menambah Bantuan di Akun dan Lainnya, DS15 baru (layar Bantuan), komponen daftar tanya-jawab (`bantuan.md`). Perubahan 1.1: logo menjadi wordmark (DS5), ikon sementara (DS6), "Lainnya" khusus owner (DS10), kartu order memakai nomor berjalan dan jam permintaan. Bergantung pada `fondasi.md` (struktur `public/`, `style.css`, `sw.js`). Dipakai semua dokumen fitur untuk tampilan layar.
> **Status:** DS1 sampai DS15 sebagian dari keputusan ketua (tema marun gelap, aksen emas, logo dari HTML/CSS, bilah navigasi emas); sisanya **(bawaan)** = pilihan penulis, ketua boleh mengubahnya sebelum dikerjakan. Belum ada yang dikerjakan.
> **Referensi:** tampilan aplikasi teman (bilah atas, navigasi bawah, kartu) dipakai sebagai **inspirasi struktur**; aset, teks, dan gamifikasinya tidak disalin.
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini** bersama dokumen fitur yang sedang dikerjakan. Kerjakan langkah di bagian 5. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 9.
> **Berkas yang diminta AI di awal sesi:** `public/style.css`, `public/index.html`, dan berkas JS layar yang sedang dikerjakan.
> **Tanpa kode.** **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Fitur ini Low-Risk (P2)** untuk tampilan. Pengecualian: tombol aksi berisiko (Setujui, Tolak, Batalkan) dan teks dari pengguna tetap mengikuti `security.md` (aturan 9 dan 10).
> **Prefix sheet:** DSN.

---

## 1. Tujuan

Aplikasi terasa **sesederhana WA** untuk ibu-ibu, tetap rapi untuk owner dan penjaga, dan **nyambung dengan identitas warung** (marun gelap dan emas, logo ChATA). Satu gaya dipakai di semua layar supaya tidak ada layar yang terasa berbeda aplikasi.

---

## 2. Keputusan

| No   | Keputusan                                                                                                                                                                                                                                                                                                                                                                                                  | Dasar                                                                                         |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| DS1  | **Tema: marun gelap dengan aksen emas**, mengikuti warna logo warung. Marun dibuat **lebih gelap dari logo** supaya logo tetap menonjol.                                                                                                                                                                                                                                                                   | Keputusan ketua 4 Nov 2026.                                                                   |
| DS2  | **Marun gelap untuk bingkai** (bilah atas, navigasi bawah, kartu sampul). **Latar isi terang** (krem atau putih) supaya mudah dibaca di bawah matahari. **(bawaan)**                                                                                                                                                                                                                                       | Ibu-ibu tidak boleh dipersulit (`features.md` bagian 9).                                      |
| DS3  | **Emas untuk aksen:** ikon dan teks di navigasi, garis, lencana, tanda aktif. **Bukan untuk teks kecil di latar terang** (emas di atas putih sulit dibaca).                                                                                                                                                                                                                                                | Keterbacaan.                                                                                  |
| DS4  | **Navigasi bawah memakai emas:** menu aktif **emas terang dan tebal** dengan garis penanda; menu tidak aktif **emas redup**. Semua dengan ikon **dan tulisan**.                                                                                                                                                                                                                                            | Keputusan ketua 4 Nov 2026.                                                                   |
| DS5  | **Wordmark** (tulisan "Kedai ChATA" bergaya logo) dibuat dari HTML dan CSS, tanpa berkas gambar, sebagai komponen di `style.css`: lingkaran, tulisan, dan hiasan. Dipakai di layar Masuk, Daftar, dan kartu sampul. Logo asli ada tetapi berkasnya belum ketemu; bila ketemu, tukar berkas di `public/img/` (atau ganti komponen) tanpa mengubah layar lain.                                               | Keputusan ketua; berkas logo belum ketemu.                                                    |
| DS6  | **Ikon PWA (manifest) tetap butuh berkas gambar** (F14). Sementara dipakai **ikon sementara** (misalnya huruf "C" emas di lingkaran marun) yang dibuat di FND.08; DSN.06 menyempurnakannya dari wordmark, atau menggantinya dengan logo asli bila berkasnya ketemu (ukuran 192 dan 512 px), disimpan di `public/img/`.                                                                                     | `fondasi.md` F14, FND.08.                                                                     |
| DS7  | **Font bawaan sistem, CSS ditulis sendiri, tanpa CDN** (tanpa Bootstrap, Tailwind, atau Google Fonts). **Semua gaya di satu berkas `public/style.css`.**                                                                                                                                                                                                                                                   | `AGENTS.md` bagian 3.                                                                         |
| DS8  | **Satu tujuan per layar, bahasa sehari-hari, tombol dan font besar.** Ukuran teks isi sekitar 16 sampai 18 px, tombol aksi tinggi minimal sekitar 48 px. **(bawaan)**                                                                                                                                                                                                                                      | `features.md` bagian 9.                                                                       |
| DS9  | **Bilah atas:** judul layar di kiri, tombol **Segarkan** di kanan (ikon penyegaran, tidak ada timer). Tombol Keluar ada di menu Akun, bukan di bilah atas. **(bawaan)**                                                                                                                                                                                                                                    | NT3; `notifikasi.md` bagian 4.2.                                                              |
| DS10 | **Navigasi bawah per peran, langsung tampil (customer dan penjaga tanpa menu tersembunyi; satu menu "Lainnya" hanya untuk owner):** Customer: Pesan, Pesanan Saya, Akun. Penjaga: Antrean, Akun. Owner: Order Masuk, Semua Order, Buat Order, Menu, dan **Lainnya** (berisi Pelanggan, Bantuan, dan Akun).                                                                                                 | `features.md` bagian 9 (layar per peran); menu hamburger berisi banyak pilihan tidak dipakai. |
| DS11 | **Status order selalu tampil dengan tulisan dan warna** (tidak hanya warna): lencana kecil di kartu dan detail. Warna di bagian 4.                                                                                                                                                                                                                                                                         | Aksesibilitas; buta warna.                                                                    |
| DS12 | **Tombol berbahaya (Tolak, Batalkan) memakai tombol berpinggir dengan teks jelas**, bukan isian marun, supaya tidak tertukar dengan tombol aksi utama. **Setujui** memakai tombol isian. **(bawaan)**                                                                                                                                                                                                      | Marun sebagai warna utama bentrok dengan merah sebagai tanda bahaya.                          |
| DS13 | **Keadaan khusus punya tampilan sendiri:** memuat, daftar kosong, galat, dan offline (pesan jelas bahwa login dan aksi butuh internet). Pesan Bahasa Indonesia, umum, tanpa galat mentah.                                                                                                                                                                                                                  | `security.md` aturan 9; F10.                                                                  |
| DS14 | **Tampil benar di HP kecil dan orientasi tegak** (mobile-first). Semua teks dari server dan input pengguna lewat `textContent`.                                                                                                                                                                                                                                                                            | `AGENTS.md` bagian 3; `security.md` aturan 10.                                                |
| DS15 | **Layar Bantuan** (tanya-jawab, `bantuan.md`) **tidak masuk navigasi bawah**; pintu masuknya item **Bantuan** di layar **Akun** (customer dan penjaga) dan di **Lainnya** (owner). Bilah atas memakai judul "Bantuan" dan tombol Segarkan (DS9). Pertanyaan dikelompokkan per bagian dan dilipat; keadaan khusus (memuat, "Belum ada bantuan", galat, offline) mengikuti DS13. **(bawaan untuk letaknya)** | `bantuan.md` BT1, BT9, BT12; DS9, DS10, DS13.                                                 |

---

## 3. Prasyarat

`fondasi.md` selesai sampai `index.html`, `config.js`, dan `sw.js` (FND.04 sampai FND.08). Berkas `style.css` didaftarkan di cache `sw.js`.

---

## 4. Yang dibuat

### 4.1 Warna (titik awal, nilai final dicek di HP)

| Peran warna        | Contoh nilai | Dipakai untuk                            |
| ------------------ | ------------ | ---------------------------------------- |
| Marun sangat gelap | `#3B0A14`    | Bilah atas, navigasi bawah, kartu sampul |
| Marun              | `#6B1020`    | Tombol aksi utama, judul penting         |
| Emas terang        | `#E2B84A`    | Menu aktif, ikon aktif, lencana          |
| Emas redup         | `#B8923A`    | Menu tidak aktif, garis tipis            |
| Krem               | `#FFF8EC`    | Latar isi                                |
| Teks gelap         | `#2A1A1A`    | Teks isi di latar krem                   |
| Teks terang        | `#FFF4DC`    | Teks di atas marun                       |

Kontras teks emas di atas marun gelap cukup tinggi; teks isi di latar krem memakai teks gelap. **Cek keterbacaan di HP sungguhan** sebelum dikunci.

### 4.2 Warna lencana status

| Status                                  | Warna       |
| --------------------------------------- | ----------- |
| Menunggu                                | Oranye      |
| Disetujui                               | Biru        |
| Diproses                                | Kuning tua  |
| Diantar / Siap diambil / Siap disajikan | Hijau muda  |
| Selesai                                 | Hijau       |
| Ditolak                                 | Merah pucat |
| Dibatalkan                              | Abu-abu     |

Marun pekat **tidak dipakai** untuk status.

### 4.3 Komponen

| Komponen           | Isi                                                                                                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bilah atas         | Judul layar dan tombol Segarkan (DS9).                                                                                                                                                                                |
| Navigasi bawah     | Tiga sampai lima menu per peran (DS10), emas aktif dan redup (DS4).                                                                                                                                                   |
| Wordmark HTML/CSS  | Komponen wordmark ChATA (DS5), dua ukuran: besar (Masuk, Daftar) dan kecil (kartu sampul).                                                                                                                            |
| Kartu              | Pinggir bulat, satu isi pokok per kartu. Dipakai untuk kartu order, menu, dan alamat.                                                                                                                                 |
| Kartu order        | Nomor order ("#1042"), pemesan, jam permintaan ("Minta diantar jam 11.15"), tipe, total, lencana status, tanda "Catatan baru".                                                                                        |
| Tombol             | Aksi utama (isian marun), aksi sekunder (berpinggir), berbahaya (berpinggir, DS12).                                                                                                                                   |
| Isian dan daftar   | Isian besar dengan label jelas; daftar yang bisa digulir.                                                                                                                                                             |
| Keadaan khusus     | Memuat, kosong, galat, offline (DS13).                                                                                                                                                                                |
| Daftar tanya-jawab | Judul kelompok (bagian); pertanyaan dilipat dan dibuka dengan satu ketukan (akordeon bawaan peramban); isi berupa teks biasa, baris baru menjadi paragraf baru (DS15). Dibuat di BTN.03 (`bantuan.md`), bukan di DSN. |

---

## 5. Urutan pekerjaan (untuk TODO sheet, prefix DSN)

Dikerjakan **setelah `fondasi.md` dan sebelum `akun.md`**, karena layar pertama (Daftar dan Masuk, AKN.05) membutuhkan gaya dasar.

1. **DSN.01** Warna, font sistem, dan ukuran dasar di `public/style.css`; daftarkan di cache `sw.js` (butuh "OK" karena menyentuh `sw.js`).
2. **DSN.02** Wordmark HTML/CSS (DS5) dan halaman contoh yang menampilkannya.
3. **DSN.03** Bilah atas dan navigasi bawah per peran (DS9, DS10, DS4).
4. **DSN.04** Komponen dasar: kartu, tombol, isian, daftar, lencana status.
5. **DSN.05** Keadaan khusus: memuat, kosong, galat, offline.
6. **DSN.06** Ikon PWA disempurnakan dari wordmark, atau dari logo asli bila ketemu (DS6), menggantikan ikon sementara dari FND.08.
7. **DSN.07** Cek tampilan di HP sungguhan (Android dan layar kecil): keterbacaan emas dan marun, ukuran tombol.

---

## 6. Aturan yang paling sering terlanggar

| Aturan                                                            | Akibat bila dilanggar                                           |
| ----------------------------------------------------------------- | --------------------------------------------------------------- |
| Memakai CDN atau Google Fonts untuk gaya dan font                 | Melanggar `AGENTS.md` bagian 3; aplikasi bergantung pihak luar. |
| Menaruh gaya di banyak berkas atau langsung di JS                 | Tampilan tidak seragam dan sulit diperbaiki.                    |
| Memasang teks pengguna lewat `innerHTML` demi tampilan            | Teks berisi tag bisa menjalankan skrip (SEC-18).                |
| Teks emas kecil di latar krem atau putih                          | Tidak terbaca, terutama di bawah matahari.                      |
| Status hanya dibedakan warna                                      | Pengguna buta warna atau layar pucat salah paham.               |
| Tombol Tolak atau Batalkan berwarna sama dengan tombol utama      | Salah pencet yang berdampak ke order dan pembayaran.            |
| Menu tersembunyi (hamburger) berisi banyak pilihan untuk customer | Ibu-ibu tidak menemukannya.                                     |
| Berkas `style.css` baru tidak didaftarkan di cache `sw.js`        | Aplikasi offline tampil tanpa gaya.                             |
| Menyalin aset atau teks dari aplikasi referensi                   | Pelanggaran hak dan tampilan tidak khas ChATA.                  |

---

## 7. Dampak dan pembatalan

- **Gaya salah:** hanya tampilan; perbaiki `style.css` dan push ulang. Tidak ada data hilang.
- **Perubahan `sw.js`** (daftar cache) tetap butuh penjelasan dan "OK" ketua (`fondasi.md` bagian 7).
- **Warna kurang terbaca:** ubah nilai warna di satu tempat (`style.css`); berlaku ke semua layar.

---

## 8. Ditunda

- Mode gelap penuh sebagai pilihan (sekarang latar isi krem dengan bingkai marun).
- Ringkasan order 7 hari untuk owner di menu Lainnya (`bonus.md` B31).
- Animasi dan transisi yang berat.
- Ilustrasi atau foto dekoratif.
- Pengaturan ukuran font oleh pengguna.

---

## 9. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

_(belum ada blok)_
