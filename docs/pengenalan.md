/docs/pengenalan.md

# 📖 pengenalan.md: Pengenalan Aplikasi (PWA) di Layar Masuk, Terbuka untuk Siapa Pun

> **Versi 1.0 (16 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Usulan owner: calon customer (kebanyakan ibu-ibu) kadang ragu memasang karena aplikasi resmi "tidak ada di Play Store". Fitur ini memberi layar penjelasan yang bisa dibuka **tanpa daftar dan tanpa login**. Murni tampilan statis: **tanpa database, tanpa server, tanpa panggilan ke Supabase**.
> **Status:** Belum ada yang dikerjakan. Butir **(bawaan)** = pilihan penulis yang belum ditanyakan satu per satu; ketua boleh mengubahnya sebelum dikerjakan. Pintu masuk, bentuk layar, jumlah topik, gaya akordeon, penanda format, dan CSS terpisah dipilih di sesi strategi ini (usulan owner). **Rancangan fitur disetujui ketua, 16 Nov 2026**, termasuk PG11 dan PG12 sebagai rencana. Di sesi kode, ketua tetap dikonfirmasi singkat sebelum `index.html` dan `sw.js` benar-benar diubah (`AGENTS.md` bagian 2 butir 5).
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini + `public/pengenalan-isi.js`** (draf isi), lalu `public/index.html`, `public/akun.js`, `public/style.css`, dan `public/sw.js`. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 8. Revisi kata-kata dilakukan **hanya di `pengenalan-isi.js`**.
> **Tanpa kode di md ini.** Teks isi ada di berkas terpisah (PG5), bukan di sini.
> **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Tingkat risiko:** fitur ini **P2 (Low-Risk)** untuk tampilan dan isi. Dua langkah **High-Risk** karena menyentuh layar Masuk dan `sw.js` (PG11, PG12).
> **Prefix sheet:** PGN (bawaan).

---

## 1. Tujuan

Orang yang belum punya akun (atau ragu memasang) bisa membaca, **dari layar Masuk**, jawaban atas kekhawatiran yang paling sering: "kok tidak ada di Play Store?", "harus dipasang?", "kok masih disuruh login?", "aman nggak?". Tujuannya supaya ibu-ibu **lebih familiar dengan konsep PWA** dan tidak batal memakai aplikasi hanya karena tidak menemukannya di toko aplikasi.

Fitur ini **tidak** menggantikan Bantuan (`bantuan.md`). Bantuan butuh login, per peran, dan isinya dari Google Sheet. Pengenalan terbuka untuk siapa pun dan isinya satu berkas tetap di repo.

---

## 2. Tabel Keputusan

| No   | Keputusan                                                                                                                                                                                                                                                                                                                                                 | Catatan                                                                                                       |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| PG1  | **Pintu masuk: tombol "Pengenalan Aplikasi" hanya di layar Masuk**, di bawah tombol "Lupa password?". Tidak ada di layar Daftar dan tidak ada tautan setelah login (yang sudah login memakai Bantuan).                                                                                                                                                    | Semua orang melewati layar Masuk dulu.                                                                        |
| PG2  | **Bentuk: layar di dalam aplikasi** (bukan halaman HTML terpisah), dengan tombol **Kembali** ke layar Masuk. Kembali **tidak mengosongkan** isian email dan password yang sudah diketik (layar Masuk hanya disembunyikan, bukan dibangun ulang). **(bawaan untuk isian tidak hilang)**                                                                    | Mengikuti pola layar Daftar dan Lupa password.                                                                |
| PG3  | **Tanpa server dan tanpa database.** Tidak ada aksi `kedai`, tabel, fungsi SQL, `localStorage`, maupun panggilan jaringan. Layar **terbuka saat offline** karena berkasnya didaftarkan di cache `sw.js`.                                                                                                                                                  | `AGENTS.md` bagian 3 dan 7. Tidak menambah panggilan ke kuota Supabase.                                       |
| PG4  | **Susunan: akordeon dilipat per topik**, gaya dan perilaku sama dengan Bantuan (`bantuan.md` BT12): judul topik tampil berurutan, satu ketukan membuka isinya. **10 topik, urutan tetap** (bagian 3). Tanpa pencarian.                                                                                                                                    | Sesederhana WA (`features.md` bagian 9).                                                                      |
| PG5  | **Tiga berkas baru di `public/`:** `pengenalan-isi.js` (hanya data teks, dimuat layar), `pengenalan.js` (logika layar: tombol, Kembali, menggambar akordeon), dan `pengenalan.css` (gaya). Mengubah kata-kata = mengganti **satu berkas** (`pengenalan-isi.js`) lalu push. **Tidak lewat Google Sheet atau SQL** (isi jarang berubah dan tanpa database). | `AGENTS.md` bagian 6 (satu fitur = satu berkas kecil).                                                        |
| PG6  | **Format teks lewat penanda ringan:** `**tebal**`, `*miring*`, dan `{warna\|teks}`. Satu fungsi kecil mengubah penanda menjadi elemen `strong`, `em`, dan `span` yang isinya dipasang lewat **`textContent`**. **Tanpa `innerHTML`.** Penanda tidak bersarang (bold di dalam warna tidak didukung). **(bawaan)**                                          | `security.md` aturan 10. Berbeda dari Bantuan (BT4, teks biasa) karena teks ini tulisan kita sendiri di kode. |
| PG7  | **Warna hanya dari palet tetap di CSS:** `marun`, `merah` (peringatan), dan `hijau` (kabar baik). Nama warna yang tidak dikenal dirender sebagai teks biasa. Emas tidak dipakai untuk teks di latar terang. **(bawaan)**                                                                                                                                  | `desain.md` DS3 dan DS11 (tidak mengandalkan warna saja: tetap diawali kata penjelas).                        |
| PG8  | **CSS terpisah: `public/pengenalan.css`**, kelas berawalan `pgn-`, dimuat setelah `style.css`. Pengecualian dari "semua gaya di satu `style.css`" (`AGENTS.md` bagian 3 dan 6), mengikuti pola `game.css`, `ringkasan.css`, `stepper.css`, dan `gelar.css`. Warna memakai variabel `:root` yang sudah ada.                                                | Keputusan ketua, 16 Nov 2026.                                                                                 |
| PG9  | **Isi jujur, tanpa janji berlebihan.** Hal yang tergantung HP atau browser memakai kata "biasanya". Bagian iPhone **belum bisa dites** (tidak ada perangkat uji, `AGENTS.md` bagian 10 butir 7), jadi ditandai "perlu dicek ke pemakai iPhone" (PGN.05). Tidak ada janji angka hemat baterai atau kuota.                                                  | Menghindari keluhan bila kenyataan di HP berbeda.                                                             |
| PG10 | **Isi tidak memuat** nomor WA, rekening, QRIS, alamat, tautan aplikasi, kata sandi, atau data pribadi. **Tidak menyebut angka yang mudah berubah** (jumlah hari, batas, jumlah item). Boleh menyebut aturan stabil (misalnya iOS 16.4 untuk notifikasi).                                                                                                  | `security.md` aturan 7 dan 18; pola `bantuan.md` pedoman gelar (tanpa angka mudah berubah).                   |
| PG11 | **Menambah tombol dan section di `index.html` menyentuh layar Masuk** (kategori "login", `AGENTS.md` bagian 7): wajib penjelasan dampak dan **"OK" ketua**. Perubahan **hanya tambahan**; kode lama layar Masuk tidak dihapus dan tidak diubah perilakunya.                                                                                               | Dampak kecil, bisa dibatalkan dengan membuang tombol dan section.                                             |
| PG12 | **`sw.js`:** daftarkan `pengenalan-isi.js`, `pengenalan.js`, dan `pengenalan.css` di daftar cache dan naikkan versi cache dari versi terakhir. Butuh **"OK" ketua** (`AGENTS.md` bagian 7). Tes setelahnya: versi baru muncul (network first) dan layar tetap terbuka offline.                                                                            | `security.md` aturan 11.                                                                                      |
| PG13 | **Layar Pengenalan tidak boleh memakai bagian `#` pada alamat peramban dan tidak mengubah alamat** (tanpa routing hash, tanpa `pushState`). Bagian `#` dipakai link reset password (`akun.md`, AKN.09), yang dibaca sebelum klien dibuat. Pindah layar cukup dengan menampilkan dan menyembunyikan section.                                               | Mencegah merusak alur reset password.                                                                         |
| PG14 | **Yang sudah login tidak melihat layar ini.** Sesi login yang masih tersimpan langsung ke beranda (terbukti AKT-37 di `akun.md`), jadi tombol hanya dilihat saat layar Masuk tampil.                                                                                                                                                                      | Tidak perlu aturan tambahan.                                                                                  |

---

## 3. Daftar Topik (isi lengkap di `public/pengenalan-isi.js`)

Urutan tetap. Judul dan kata-kata final ditentukan lewat revisi di berkas isi, bukan di tabel ini.

| No  | Topik                                        | Inti pesan                                                                                                                                 |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Kok aplikasi ini tidak ada di Play Store?    | Aplikasi web resmi Kedai ChATA; memang dipasang dari browser, bukan dari toko aplikasi.                                                    |
| 2   | Apakah harus dipasang?                       | Tidak harus; bisa dipakai lewat browser. Pasang ke layar utama hanya lebih praktis.                                                        |
| 3   | Cara memasang di Android                     | Langkah singkat lewat Chrome.                                                                                                              |
| 4   | Cara memasang di iPhone                      | Langkah singkat lewat Safari. **Perlu dicek ke pemakai iPhone** (PG9).                                                                     |
| 5   | Apakah harus update?                         | Tidak; versi baru terambil sendiri saat dibuka. Bila terasa belum berubah, tutup lalu buka lagi.                                           |
| 6   | Apakah harus ketik email dan password terus? | Biasanya tidak (sesi tersimpan, kecuali Keluar atau data browser dihapus). Tawaran "Simpan password?" dari browser.                        |
| 7   | Notifikasi                                   | Harus diizinkan; batasan iPhone (iOS 16.4 dan layar utama); bisa telat saat hemat baterai; status tetap benar di aplikasi dan Kotak masuk. |
| 8   | Apakah aman?                                 | Password dikelola layanan keamanan, notifikasi tanpa data pribadi, aplikasi tidak meminta nomor kartu atau PIN.                            |
| 9   | Apakah berat di HP?                          | Ukurannya kecil, tidak ada yang berjalan terus di latar belakang. Tanpa janji angka (PG9).                                                 |
| 10  | Cara menghapus kalau tidak mau lagi          | Copot ikon dari layar utama; data pesanan tetap aman di server; bisa masuk lagi kapan saja.                                                |

---

## 4. Alur

1. Layar Masuk (belum login) → ketuk **Pengenalan Aplikasi** → layar Pengenalan: judul "Pengenalan Aplikasi", tombol **Kembali**, daftar 10 topik dilipat.
2. Ketuk satu topik → isinya terbuka. Ketuk lagi → menutup.
3. **Kembali** → layar Masuk, isian yang sudah diketik masih ada (PG2).
4. Tanpa internet: layar tetap terbuka dari cache (PG3). Tidak ada tombol Segarkan karena tidak ada data dari server.

---

## 5. Aturan yang paling sering terlanggar

| Aturan                                                                                          | Akibat bila dilanggar                                                                             |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Memasang isi lewat `innerHTML` karena ada penanda tebal, miring, dan warna                      | Celah XSS bila nanti ada teks dari luar yang ikut masuk; melanggar `security.md` aturan 10 (PG6). |
| Menulis kata-kata isi langsung di `pengenalan.js`, bukan di `pengenalan-isi.js`                 | Revisi teks jadi mengubah kode logika; sulit dicek (PG5).                                         |
| Lupa mendaftarkan tiga berkas baru di cache `sw.js`                                             | Layar tidak terbuka saat offline atau tampil kosong (PG12).                                       |
| Menaruh gaya di `style.css`                                                                     | Menyimpang dari keputusan CSS terpisah (PG8).                                                     |
| Memakai routing `#` atau `pushState` untuk layar Pengenalan                                     | Merusak pembacaan link reset password (PG13).                                                     |
| Mengubah kode layar Masuk yang sudah ada (bukan hanya menambah tombol dan section)              | Risiko merusak login; di luar "OK" yang diminta (PG11).                                           |
| Mencantumkan nomor WA, rekening, tautan aplikasi, atau angka mudah berubah di isi               | Data pribadi di repo public; isi jadi salah tanpa ada yang tahu (PG10).                           |
| Menjanjikan hal yang tidak pasti (misalnya "pasti tidak perlu login lagi", angka hemat baterai) | Keluhan pemakai bila kenyataan di HP berbeda (PG9).                                               |
| Memakai warna sebagai satu-satunya penanda penting                                              | Sulit dibaca penderita buta warna; tetap awali dengan kata penjelas seperti "Catatan" (PG7).      |

---

## 6. Urutan Pekerjaan (untuk TODO sheet)

| ID     | Pekerjaan                                                                                                                                                                                                                                                                     | Risiko            |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| PGN.01 | **Tinjau draf isi** `pengenalan-isi.js` bersama owner. Revisi kata-kata langsung di berkas itu (belum ada kode layar). Tanpa data pribadi.                                                                                                                                    | Low-Risk          |
| PGN.02 | **Layar dan gaya:** `pengenalan.js`, `pengenalan.css`, serta tombol dan section di `index.html` (PG11). Satu berkas utuh per langkah; penjelasan dampak dan **"OK" ketua** sebelum `index.html` diubah.                                                                       | High-Risk (login) |
| PGN.03 | **Daftarkan di cache `sw.js`** (PG12), naikkan versi cache. Butuh "OK" ketua.                                                                                                                                                                                                 | High-Risk         |
| PGN.04 | **Tes di Android:** tombol terbuka, 10 topik, Kembali (isian email tidak hilang), offline, bold/miring/warna tampil benar, karakter seperti `<` dan `&` tampil apa adanya, link reset password masih membuka layar Buat password baru (PG13). Konfirmasi hasil cukup di chat. | Low-Risk          |
| PGN.05 | **Cek isi dengan pemakai nyata:** satu pemakai iPhone mencoba langkah topik 4 dan topik 7; satu ibu customer membaca dan menyebut bagian yang membingungkan. Revisi `pengenalan-isi.js` bila perlu.                                                                           | Low-Risk          |
| PGN.06 | **Sebelum peluncuran (`LNC.04`):** pastikan isi final sudah dicek (PGN.05). Tidak ada data uji yang perlu dibersihkan untuk fitur ini.                                                                                                                                        | Low-Risk          |

Tidak ada baris SEC baru: fitur tidak menyentuh server, data, atau akses. Pemeriksaan "tanpa `innerHTML`" cukup dengan pencarian di kode saat PGN.02.

---

## 7. Ditunda

- **Gambar atau tangkapan layar** langkah memasang (butuh berkas di `public/img/` dan keputusan soal ukuran).
- **Tombol "Pasang aplikasi" otomatis** (perilaku bawaan peramban yang beda antar HP, dan tidak ada di iPhone).
- **Tautan Pengenalan di layar Daftar** (bila banyak calon customer ragu di tengah formulir).
- **Pencarian** di dalam topik, dan **bahasa lain**.
- **Menangani tombol Kembali bawaan HP** (history): sekarang mengikuti perilaku layar lain; sesi kode mengecek bagaimana layar Daftar menanganinya.
- **Isi dari Google Sheet** seperti Bantuan: tidak dikerjakan karena isi jarang berubah dan tanpa database. Bila kelak sering direvisi, jadi kandidat di `bonus.md`.

---

## 8. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

### Handoff #1 | 16 Nov 2026 | [RAC]

**Tugas:** PGN.02 (layar dan gaya Pengenalan Aplikasi). Status: selesai, sudah di-push dan layarnya sudah dicek visual di browser. Penutupan handoff ini dibuat oleh PIC lain dari ringkasan lisan dan berkas, bukan dari sesi kode aslinya.

**File yang diubah:**

- `public/index.html`: hanya ditambah. Satu tombol `#ke-pengenalan` ("Pengenalan Aplikasi", di bawah "Lupa password?"), satu section `#layar-pengenalan`, satu tag `<link>` ke `pengenalan.css` (setelah `gelar.css`), dan dua tag `<script>` (`pengenalan-isi.js` lalu `pengenalan.js`, setelah `qris.js`). Kode lama layar Masuk tidak diubah.
- `public/pengenalan.js` (baru): logika layar. Tanpa `innerHTML`, tanpa `localStorage`, tanpa panggilan jaringan, tanpa `#` alamat atau `pushState`. Layar Masuk hanya disembunyikan, jadi isian email dan password tidak hilang.
- `public/pengenalan.css` (baru): kelas berawalan `pgn-`, akordeon `<details>`, palet marun/merah/hijau.
- `public/pengenalan-isi.js` (baru): 10 topik, hanya data teks.
  **Keputusan baru:**

- Gaya bahasa isi direvisi 16 Nov 2026 atas masukan owner: istilah kaku diberi padanan (memasang/menginstal, tautan/link, dst.), menyebut "Play Store/App Store", sapaan "Anda", dan nama tombol/menu ditulis persis seperti di layar. Aturan lengkapnya ada di komentar kepala `pengenalan-isi.js`. Alasan di luar itu belum tercatat.
  **Belum beres:**

- **PGN.03 belum dikerjakan:** `sw.js` belum mendaftarkan `pengenalan-isi.js`, `pengenalan.js`, dan `pengenalan.css`, dan versi cache masih `chata-v28`. Akibatnya layar Pengenalan belum terbuka saat offline (PG3, PG12). Butuh "OK" ketua.
- Persetujuan ketua khusus untuk perubahan `index.html` pada PGN.02 tidak tercatat di sesi ini (rancangan umumnya sudah disetujui 16 Nov 2026). Mohon ketua mengonfirmasi bila belum.
- Bagian iPhone (topik 4, serta iPhone di topik 6, 7, dan 10) belum dites di perangkat nyata (PGN.05).
- Belum ada tes Android (PGN.04).
  **Saran giliran berikutnya:**

1. PGN.03: tambah tiga berkas ke `DAFTAR_CACHE` di `sw.js` dan naikkan versi cache menjadi `chata-v29`, setelah "OK" ketua. Commit ini menyentuh kode, jadi tanpa `[skip ci]`.
2. PGN.04: tes Android sesuai daftar di bagian 6 (termasuk offline dan link reset password tetap membuka layar Buat password baru).
3. PGN.05 dan PGN.06 menyusul sebelum peluncuran (`LNC.04`).

### Handoff #2 | 16 Nov 2026 | Ketua

**Tugas:** PGN.03 (daftar cache `sw.js`) dan PGN.04 (tes Android). Status: keduanya selesai.

**File yang diubah:**

- `public/sw.js`: ditambah `pengenalan.css`, `pengenalan-isi.js`, dan `pengenalan.js` di `DAFTAR_CACHE` (komentar `// PGN.03`). Versi cache naik dari `chata-v28` ke `chata-v29`; baris v28 dijadikan komentar, tidak dihapus. Logika install, activate, fetch, dan push tidak disentuh. Disetujui ketua ("OK", 16 Nov 2026). Sudah di-push (commit `4c83b83`, tanpa `[skip ci]`).
- `docs/pengenalan.md`: Handoff #1 ditempel.

**Hasil tes Android (PGN.04), dikonfirmasi ketua di chat:**

- Versi baru muncul setelah update dan cache `chata-v29` aktif di browser (network first jalan).
- Tombol Pengenalan Aplikasi terbuka, 10 topik bisa buka-tutup, tebal, miring, dan warna tampil benar.
- Tombol Kembali tidak mengosongkan isian email dan password.
- Layar Pengenalan terbuka saat offline.
- Link reset password tetap membuka layar Buat password baru.

**Keputusan baru:** tidak ada.

**Belum beres:**

- Poin "karakter `<` dan `&` tampil apa adanya" belum dibuktikan lewat layar, karena isi sekarang tidak memuat karakter itu. Dianggap cukup lewat bacaan kode (semua teks lewat `textContent`, tanpa `innerHTML`). Keputusan menerima ini ada di ketua; alasan penerimaan belum tercatat.
- **PGN.05:** bagian iPhone (topik 4, serta iPhone di topik 6, 7, dan 10) belum dites di perangkat nyata. Belum ada pembacaan oleh ibu customer.

**Saran giliran berikutnya:**

1. PGN.05: satu pemakai iPhone mencoba langkah topik 4 dan topik 7; satu ibu customer membaca dan menyebut bagian yang membingungkan. Revisi hanya di `public/pengenalan-isi.js`, lalu push biasa. Tanpa `[skip ci]`, karena berkas di `public/` berubah. Revisi isi tidak mengubah daftar berkas, jadi `sw.js` tidak perlu diubah.
2. PGN.06: sebelum peluncuran (`LNC.04`), pastikan isi final sudah dicek lewat PGN.05.

### Handoff #3 | 16 Nov 2026 | [RAC]

**Tugas:** PGN.05a (infografik di bagian paling atas layar Pengenalan). Status: selesai, sudah di-push (commit `4404072`, tanpa `[skip ci]`) dan dites.

**File yang diubah:**

- `public/pengenalan.js`: hanya ditambah. Fungsi `buatInfografik()` dan dua konstanta (path gambar dan teks alternatif). Gambar dipasang sebelum daftar topik. Gambar gagal dimuat: pembungkusnya disembunyikan, layar tetap rapi.
- `public/pengenalan.css`: hanya ditambah di akhir, kelas `pgn-infografik`.
- Tidak berubah: `index.html` dan `sw.js`. `img/infografik.webp` sudah ada di `DAFTAR_CACHE` sejak `chata-v19`, jadi versi cache tetap `chata-v29`.

**Keputusan baru:**

- Infografik di Pengenalan memakai **gambar yang sama dengan Bantuan** (`img/infografik.webp`), bukan gambar baru. Pilihan PIC di sesi ini; alasan lain belum tercatat.
- PGN.05 ditandai Selesai di sheet (16 Nov 2026) **tanpa tes di perangkat iPhone**, karena tidak ada yang punya iPhone. Disetujui ketua (16 Nov 2026, lewat PIC); alasan persetujuan di luar itu belum tercatat. Topik 4 dan bagian iPhone di topik 6, 7, dan 10 tetap berstatus draf yang belum terbukti. Sesuai `AGENTS.md` bagian 10 butir 7, iPhone diasumsikan jalan dan keluhan pemakai iPhone ditampung untuk `LNC.05`. Apakah seorang ibu customer sudah membaca isi Pengenalan: belum tercatat.

**Hasil tes (dikonfirmasi PIC di chat):** infografik tampil paling atas dan 10 topik tetap normal, akordeon tetap bekerja. Layar tetap terbuka saat offline. Isian email dan password tetap ada setelah buka Pengenalan lalu Kembali.

**Belum beres:**

- PGN.06: sebelum peluncuran (`LNC.04`), pastikan isi final sudah dicek.
- Gambar `infografik.webp` dipakai bersama oleh Bantuan dan Pengenalan. Bila diganti dengan **nama berkas lain**, ubah `PATH_INFOGRAFIK` di `pengenalan.js` dan daftarkan berkas baru di `sw.js` (butuh "OK" ketua). Bila nama sama, cukup ganti berkasnya.

**Saran giliran berikutnya:** PGN.06 menjelang peluncuran. Isi Pengenalan hanya direvisi di `public/pengenalan-isi.js`, push biasa tanpa `[skip ci]`.

### 2026-11-18: Topik ke-11 "Bagaimana kalau tidak bisa daftar atau masuk?"

Keputusan ketua (sesi lanjutan Turnstile, 18 Nov 2026). Berkas tujuan: docs/pengenalan.md bagian 8. Bertentangan dengan PG4 dan bagian 3 ("10 topik, urutan tetap"); yang paling akhir menang, jadi daftar topik menjadi 11.

- **Alasan:** Turnstile dipasang di Daftar dan Masuk (blok Turnstile 18 Nov di AGENTS.md). Customer ber-HP atau browser lama bisa terhalang. Ketua memutuskan tidak membuat jalur pengecualian Turnstile; customer yang terhalang dilayani lewat order wakil (Pelanggan tanpa akun) oleh owner. Pengenalan terbuka tanpa login dari layar Masuk, jadi cocok sebagai tempat arahan untuk customer yang belum pernah berhasil masuk (Bantuan butuh login, B35 ditunda).
- **Isi (inti pesan):** bila tetap gagal daftar atau masuk, biasanya karena HP atau browser sudah lama; customer tetap bisa memesan dengan menghubungi warung lewat WhatsApp seperti biasa dan pesanannya dibantu dicatatkan; memperbarui Chrome kadang membantu. Tanpa nomor WA, tanpa angka mudah berubah, kata "biasanya" untuk hal yang tergantung HP (PG9, PG10). Kata-kata final ditulis di `public/pengenalan-isi.js`, mengikuti aturan gaya di komentar kepala berkas itu.
- **Topik ke-11, ditaruh paling akhir.** Urutan topik 1 sampai 10 tidak berubah.
- **Cara kerja:** revisi hanya di `public/pengenalan-isi.js`, push biasa **tanpa `[skip ci]`**. `sw.js` tidak berubah karena daftar berkas cache tidak berubah. Tanpa Google Sheet atau SQL.
- **Konsisten dengan:** pesan widget gagal di TRN.03a (akun.md Handoff #16) dan entri Bantuan owner (bantuan.md blok 18 Nov 2026). Inti kalimatnya sama: pesan lewat WhatsApp warung seperti biasa, kami bantu catatkan.
- **Butir sheet:** PGN.07 "Topik ke-11 Pengenalan, arahan bila tidak bisa masuk" (Low-Risk, P1; cek ID PGN terakhir di sheet).
- **Belum dikerjakan.** Bukti tes: layar dibuka di Android, topik ke-11 muncul paling akhir, akordeon tetap bekerja, offline tetap terbuka.
