/docs/pengenalan.md

# 📖 pengenalan.md: Pengenalan Aplikasi (PWA) di Layar Masuk, Terbuka untuk Siapa Pun

> **Versi 1.1 (21 Nov 2026), hasil sesi strategi.** Usulan owner: calon customer (kebanyakan ibu-ibu) kadang ragu memasang karena aplikasi resmi "tidak ada di Play Store". Fitur ini memberi layar penjelasan yang bisa dibuka **tanpa daftar dan tanpa login**. Murni tampilan statis: **tanpa database, tanpa server, tanpa panggilan ke Supabase**.
> **Status:** PGN.01 sampai PGN.07 selesai (termasuk PGN.05a). Butir **(bawaan)** = pilihan penulis; ketua boleh mengubahnya. Bagian iPhone belum dites di perangkat nyata (PG9).
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini + `public/pengenalan-isi.js`**, lalu `public/index.html`, `public/akun.js`, `public/style.css`, dan `public/sw.js`. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 8. Revisi kata-kata dilakukan **hanya di `pengenalan-isi.js`**.
> **Tanpa kode di md ini.** Teks isi ada di berkas terpisah (PG5), bukan di sini.
> **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Tingkat risiko:** fitur ini **P2 (Low-Risk)** untuk tampilan dan isi. Dua langkah **High-Risk** karena menyentuh layar Masuk dan `sw.js` (PG11, PG12).
> **Prefix sheet:** PGN.

---

## 1. Tujuan

Orang yang belum punya akun (atau ragu memasang) bisa membaca, **dari layar Masuk**, jawaban atas kekhawatiran yang paling sering: "kok tidak ada di Play Store?", "harus dipasang?", "kok masih disuruh login?", "aman nggak?". Tujuannya supaya ibu-ibu **lebih familiar dengan konsep PWA** dan tidak batal memakai aplikasi hanya karena tidak menemukannya di toko aplikasi.

Fitur ini **tidak** menggantikan Bantuan (`bantuan.md`). Bantuan butuh login, per peran, dan isinya dari Google Sheet. Pengenalan terbuka untuk siapa pun dan isinya satu berkas tetap di repo.

---

## 2. Tabel Keputusan

| No   | Keputusan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Catatan                                                                                                                                                                                                                                                                                                                 |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PG1  | **Pintu masuk: tombol "Pengenalan Aplikasi" hanya di layar Masuk**, di bawah tombol "Lupa password?". Tidak ada di layar Daftar dan tidak ada tautan setelah login (yang sudah login memakai Bantuan).                                                                                                                                                                                                                                                                                                                                                                        | Semua orang melewati layar Masuk dulu.                                                                                                                                                                                                                                                                                  |
| PG2  | **Bentuk: layar di dalam aplikasi** (bukan halaman HTML terpisah), dengan tombol **Kembali** ke layar Masuk. Kembali **tidak mengosongkan** isian email dan password yang sudah diketik (layar Masuk hanya disembunyikan, bukan dibangun ulang). **(bawaan untuk isian tidak hilang)**                                                                                                                                                                                                                                                                                        | Mengikuti pola layar Daftar dan Lupa password.                                                                                                                                                                                                                                                                          |
| PG3  | **Tanpa server dan tanpa database.** Tidak ada aksi `kedai`, tabel, fungsi SQL, atau `localStorage`. Satu-satunya panggilan keluar adalah **satu event anonim `buka-pengenalan`** ke analitik lewat `analitik.js`, tanpa data tambahan; bila script analitik tidak ada, layar berjalan normal. **Status:** panggilan ini belum ditemukan di kode `pengenalan.js` (Handoff #5). Layar **terbuka saat offline** karena berkasnya didaftarkan di cache `sw.js`.                                                                                                                  | `AGENTS.md` bagian 3 dan 7; `analitik.md` AN3, AN4.                                                                                                                                                                                                                                                                     |
| PG4  | **Susunan: akordeon dilipat per topik**, gaya dan perilaku sama dengan Bantuan (`bantuan.md` BT12): satu ketukan membuka isinya. **12 topik, urutan tetap** (bagian 3). Tanpa pencarian. **Infografik di paling atas**, di atas daftar topik: gambar yang sama dengan Bantuan (`img/infografik.webp`); bila gagal dimuat, pembungkusnya disembunyikan dan layar tetap rapi. Bila gambar diganti dengan **nama berkas lain**, ubah `PATH_INFOGRAFIK` di `pengenalan.js` dan daftarkan berkas baru di `sw.js` (butuh "OK" ketua); bila namanya sama, cukup ganti berkasnya.     | Sesederhana WA (`features.md` bagian 9). Topik PWA di paling atas: permintaan owner, disetujui ketua 21 Nov 2026 (alasan: istilah PWA belum dikenal di lingkungan pemakai; alasan lain belum tercatat). Topik 12: keputusan ketua 18 Nov 2026. Infografik sama dengan Bantuan: pilihan PIC, alasan lain belum tercatat. |
| PG5  | **Tiga berkas di `public/`:** `pengenalan-isi.js` (hanya data teks, dimuat layar), `pengenalan.js` (logika layar: tombol, Kembali, menggambar infografik dan akordeon), dan `pengenalan.css` (gaya). Mengubah kata-kata = mengganti **satu berkas** (`pengenalan-isi.js`) lalu push. Layar menggambar topik berurutan dari array, jadi menambah atau mengubah urutan topik tidak menyentuh `pengenalan.js` dan `pengenalan.css`. **Tidak lewat Google Sheet atau SQL** (isi jarang berubah dan tanpa database).                                                               | `AGENTS.md` bagian 6 (satu fitur = satu berkas kecil).                                                                                                                                                                                                                                                                  |
| PG6  | **Format teks lewat penanda ringan:** `**tebal**`, `*miring*`, dan `{warna\|teks}`. Satu fungsi kecil mengubah penanda menjadi elemen `strong`, `em`, dan `span` yang isinya dipasang lewat **`textContent`**. **Tanpa `innerHTML`.** Penanda tidak bersarang (bold di dalam warna tidak didukung). **(bawaan)**                                                                                                                                                                                                                                                              | `security.md` aturan 10. Berbeda dari Bantuan (BT4, teks biasa) karena teks ini tulisan kita sendiri di kode.                                                                                                                                                                                                           |
| PG7  | **Warna hanya dari palet tetap di CSS:** `marun`, `merah` (peringatan), dan `hijau` (kabar baik). Nama warna yang tidak dikenal dirender sebagai teks biasa. Emas tidak dipakai untuk teks di latar terang. **(bawaan)**                                                                                                                                                                                                                                                                                                                                                      | `desain.md` DS3 dan DS11 (tidak mengandalkan warna saja: tetap diawali kata penjelas).                                                                                                                                                                                                                                  |
| PG8  | **CSS terpisah: `public/pengenalan.css`**, kelas berawalan `pgn-`, dimuat setelah `style.css`. Pengecualian dari "semua gaya di satu `style.css`" (`AGENTS.md` bagian 3 dan 6), mengikuti pola `game.css`, `ringkasan.css`, `stepper.css`, dan `gelar.css`. Warna memakai variabel `:root` yang sudah ada.                                                                                                                                                                                                                                                                    | Keputusan ketua, 16 Nov 2026.                                                                                                                                                                                                                                                                                           |
| PG9  | **Isi jujur, tanpa janji berlebihan.** Hal yang tergantung HP atau browser memakai kata "biasanya". **Bagian iPhone belum dites di perangkat nyata** (tidak ada yang punya iPhone): topik 5, serta iPhone di topik 3, 7, 8, dan 11 berstatus draf yang belum terbukti. Sesuai `AGENTS.md` bagian 10 butir 7, iPhone diasumsikan jalan dan keluhan pemakai iPhone ditampung untuk `LNC.05`. Tidak ada janji angka hemat baterai atau kuota. Kalimat "tidak meminta izin" dibatasi pada saat pemasangan; izin notifikasi disebut sebagai satu-satunya izin yang mungkin muncul. | Menghindari keluhan bila kenyataan di HP berbeda. PGN.05 ditandai selesai tanpa tes iPhone atas persetujuan ketua (16 Nov 2026, lewat PIC); alasan persetujuan di luar itu belum tercatat.                                                                                                                              |
| PG10 | **Isi tidak memuat** nomor WA, rekening, QRIS, alamat, tautan aplikasi, kata sandi, atau data pribadi. **Tidak menyebut angka yang mudah berubah** (jumlah hari, batas, jumlah item). Boleh menyebut aturan stabil (misalnya iOS 16.4 untuk notifikasi).                                                                                                                                                                                                                                                                                                                      | `security.md` aturan 7 dan 18; pola `bantuan.md` pedoman gelar (tanpa angka mudah berubah).                                                                                                                                                                                                                             |
| PG11 | **Tombol dan section di `index.html` menyentuh layar Masuk** (kategori "login", `AGENTS.md` bagian 7): wajib penjelasan dampak dan **"OK" ketua**, yang sudah diberikan (konfirmasi ketua, 21 Nov 2026). Perubahan **hanya tambahan**; kode lama layar Masuk tidak dihapus dan tidak diubah perilakunya.                                                                                                                                                                                                                                                                      | Dampak kecil, bisa dibatalkan dengan membuang tombol dan section.                                                                                                                                                                                                                                                       |
| PG12 | **`sw.js`:** `pengenalan-isi.js`, `pengenalan.js`, dan `pengenalan.css` terdaftar di daftar cache (PGN.03, "OK" ketua 16 Nov 2026). `img/infografik.webp` sudah terdaftar sejak BTN.04a. Revisi isi tidak mengubah daftar berkas, jadi `sw.js` tidak perlu diubah.                                                                                                                                                                                                                                                                                                            | `security.md` aturan 11.                                                                                                                                                                                                                                                                                                |
| PG13 | **Layar Pengenalan tidak boleh memakai bagian `#` pada alamat peramban dan tidak mengubah alamat** (tanpa routing hash, tanpa `pushState`). Bagian `#` dipakai link reset password (`akun.md`, AKN.09), yang dibaca sebelum klien dibuat. Pindah layar cukup dengan menampilkan dan menyembunyikan section.                                                                                                                                                                                                                                                                   | Mencegah merusak alur reset password.                                                                                                                                                                                                                                                                                   |
| PG14 | **Yang sudah login tidak melihat layar ini.** Sesi login yang masih tersimpan langsung ke beranda (terbukti AKT-37 di `akun.md`), jadi tombol hanya dilihat saat layar Masuk tampil.                                                                                                                                                                                                                                                                                                                                                                                          | Tidak perlu aturan tambahan.                                                                                                                                                                                                                                                                                            |

---

## 3. Daftar Topik (isi lengkap di `public/pengenalan-isi.js`)

Urutan tetap. Judul dan kata-kata final ditentukan lewat revisi di berkas isi, bukan di tabel ini.

**Gaya bahasa isi** (revisi 16 Nov 2026 atas masukan owner; aturan lengkap ada di komentar kepala `pengenalan-isi.js`): istilah kaku diberi padanan (memasang/menginstal, tautan/link, dan sebagainya), menyebut "Play Store/App Store", sapaan "Anda", dan nama tombol atau menu ditulis persis seperti di layar. Alasan di luar itu belum tercatat.

| No  | Topik                                                                           | Inti pesan                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Kenapa aplikasi PWA ChATA bikin lebih praktis dan tenang? (kunci `pwa-praktis`) | Arti PWA secara singkat; tanpa proses pemasangan yang rumit; izin yang mungkin muncul hanya notifikasi dan itu pilihan pemakai; data tersimpan di sistem ChATA; perwakilan ChATA siap membantu lewat WhatsApp. Isi disetujui owner.                                                                                                                                                                                                         |
| 2   | Kok aplikasi ini tidak ada di Play Store?                                       | Aplikasi web resmi Kedai ChATA; memang dipasang dari browser, bukan dari toko aplikasi.                                                                                                                                                                                                                                                                                                                                                     |
| 3   | Apakah harus dipasang?                                                          | Tidak harus; bisa dipakai lewat browser. Pasang ke layar utama hanya lebih praktis.                                                                                                                                                                                                                                                                                                                                                         |
| 4   | Cara memasang di Android                                                        | Langkah singkat lewat Chrome.                                                                                                                                                                                                                                                                                                                                                                                                               |
| 5   | Cara memasang di iPhone                                                         | Langkah singkat lewat Safari. **Perlu dicek ke pemakai iPhone** (PG9).                                                                                                                                                                                                                                                                                                                                                                      |
| 6   | Apakah harus update?                                                            | Tidak; versi baru terambil sendiri saat dibuka. Bila terasa belum berubah, tutup lalu buka lagi.                                                                                                                                                                                                                                                                                                                                            |
| 7   | Apakah harus ketik email dan password terus?                                    | Biasanya tidak (sesi tersimpan, kecuali Keluar atau data browser dihapus). Tawaran "Simpan password?" dari browser.                                                                                                                                                                                                                                                                                                                         |
| 8   | Notifikasi                                                                      | Harus diizinkan; batasan iPhone (iOS 16.4 dan layar utama); bisa telat saat hemat baterai; status tetap benar di aplikasi dan Kotak masuk.                                                                                                                                                                                                                                                                                                  |
| 9   | Apakah aman?                                                                    | Password dikelola layanan keamanan, notifikasi tanpa data pribadi, aplikasi tidak meminta nomor kartu atau PIN.                                                                                                                                                                                                                                                                                                                             |
| 10  | Apakah berat di HP?                                                             | Ukurannya kecil, tidak ada yang berjalan terus di latar belakang. Tanpa janji angka (PG9).                                                                                                                                                                                                                                                                                                                                                  |
| 11  | Cara menghapus kalau tidak mau lagi                                             | Copot ikon dari layar utama; data pesanan tetap aman di server; bisa masuk lagi kapan saja.                                                                                                                                                                                                                                                                                                                                                 |
| 12  | Bagaimana kalau tidak bisa daftar atau masuk?                                   | Penjelasan singkat kotak centang pemeriksaan keamanan (Turnstile); penyebab yang paling mungkin "biasanya" HP atau browser lama, bukan kesalahan pengguna; periksa internet atau perbarui Chrome ("kadang membantu"); jalan keluar: pesan lewat WhatsApp warung seperti biasa dan pesanan dibantu dicatatkan (sama dengan pesan widget gagal TRN.03a); pengingat tombol Lupa password. Tanpa nomor WA dan tanpa angka mudah berubah (PG10). |

Topik 12 ditulis karena Turnstile dipasang di Daftar dan Masuk, sehingga customer ber-HP atau browser lama bisa terhalang. Ketua memutuskan tidak membuat jalur pengecualian Turnstile; customer yang terhalang dilayani lewat order wakil (Pelanggan tanpa akun) oleh owner. Pengenalan terbuka tanpa login, jadi cocok sebagai arahan bagi customer yang belum pernah berhasil masuk (Bantuan butuh login, B35 ditunda). Selaras dengan entri Bantuan `owner-11` (`bantuan.md` BTN.07).

---

## 4. Alur

1. Layar Masuk (belum login) → ketuk **Pengenalan Aplikasi** → layar Pengenalan: judul "Pengenalan Aplikasi", tombol **Kembali**, infografik di paling atas, lalu daftar 12 topik dilipat.
2. Ketuk satu topik → isinya terbuka. Ketuk lagi → menutup.
3. **Kembali** → layar Masuk, isian yang sudah diketik masih ada (PG2).
4. Tanpa internet: layar tetap terbuka dari cache (PG3). Tidak ada tombol Segarkan karena tidak ada data dari server.

---

## 5. Aturan yang paling sering terlanggar

| Aturan                                                                                          | Akibat bila dilanggar                                                                             |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Memasang isi lewat `innerHTML` karena ada penanda tebal, miring, dan warna                      | Celah XSS bila nanti ada teks dari luar yang ikut masuk; melanggar `security.md` aturan 10 (PG6). |
| Menulis kata-kata isi langsung di `pengenalan.js`, bukan di `pengenalan-isi.js`                 | Revisi teks jadi mengubah kode logika; sulit dicek (PG5).                                         |
| Lupa mendaftarkan berkas baru (termasuk gambar baru bernama lain) di cache `sw.js`              | Layar tidak terbuka saat offline atau tampil kosong (PG4, PG12).                                  |
| Menaruh gaya di `style.css`                                                                     | Menyimpang dari keputusan CSS terpisah (PG8).                                                     |
| Memakai routing `#` atau `pushState` untuk layar Pengenalan                                     | Merusak pembacaan link reset password (PG13).                                                     |
| Mengubah kode layar Masuk yang sudah ada (bukan hanya menambah tombol dan section)              | Risiko merusak login; di luar "OK" yang diberikan (PG11).                                         |
| Mencantumkan nomor WA, rekening, tautan aplikasi, atau angka mudah berubah di isi               | Data pribadi di repo public; isi jadi salah tanpa ada yang tahu (PG10).                           |
| Menjanjikan hal yang tidak pasti (misalnya "pasti tidak perlu login lagi", angka hemat baterai) | Keluhan pemakai bila kenyataan di HP berbeda (PG9).                                               |
| Memakai warna sebagai satu-satunya penanda penting                                              | Sulit dibaca penderita buta warna; tetap awali dengan kata penjelas seperti "Catatan" (PG7).      |

---

## 6. Urutan Pekerjaan (untuk TODO sheet)

| ID                | Pekerjaan                                                                                                                                                                                                                                                         | Risiko            |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| PGN.01 (selesai)  | **Tinjau draf isi** `pengenalan-isi.js` bersama owner. Revisi kata-kata langsung di berkas itu. Tanpa data pribadi.                                                                                                                                               | Low-Risk          |
| PGN.02 (selesai)  | **Layar dan gaya:** `pengenalan.js`, `pengenalan.css`, serta tombol dan section di `index.html` (PG11).                                                                                                                                                           | High-Risk (login) |
| PGN.03 (selesai)  | **Daftarkan di cache `sw.js`** (PG12).                                                                                                                                                                                                                            | High-Risk         |
| PGN.04 (selesai)  | **Tes di Android:** tombol terbuka, 12 topik, Kembali (isian email tidak hilang), offline, bold/miring/warna tampil benar, link reset password masih membuka layar Buat password baru (PG13). Karakter `<` dan `&` diterima cukup lewat bacaan kode (Handoff #5). | Low-Risk          |
| PGN.05 (selesai)  | **Cek isi dengan pemakai nyata:** satu pemakai iPhone mencoba langkah topik 5 (iPhone) dan topik 8 (notifikasi); satu ibu customer membaca dan menyebut bagian yang membingungkan. Ditandai selesai tanpa tes iPhone (PG9).                                       | Low-Risk          |
| PGN.05a (selesai) | **Infografik di paling atas** layar Pengenalan (PG4).                                                                                                                                                                                                             | Low-Risk          |
| PGN.06 (selesai)  | **Sebelum peluncuran (`LNC.04`):** isi final dicek dan terbit, termasuk penekanan PWA (topik 1). Tidak ada data uji yang perlu dibersihkan untuk fitur ini.                                                                                                       | Low-Risk          |
| PGN.07 (selesai)  | **Topik 12** "Bagaimana kalau tidak bisa daftar atau masuk?" (bagian 3).                                                                                                                                                                                          | Low-Risk          |

Tidak ada baris SEC baru: fitur tidak menyentuh server, data, atau akses. Pemeriksaan "tanpa `innerHTML`" cukup dengan pencarian di kode.

---

## 7. Ditunda

- **Gambar atau tangkapan layar** langkah memasang (butuh berkas di `public/img/` dan keputusan soal ukuran).
- **Tombol "Pasang aplikasi" otomatis** (perilaku bawaan peramban yang beda antar HP, dan tidak ada di iPhone).
- **Tautan Pengenalan di layar Daftar** (bila banyak calon customer ragu di tengah formulir).
- **Pencarian** di dalam topik, dan **bahasa lain**.
- **Menangani tombol Kembali bawaan HP** (history): mengikuti perilaku layar lain; sesi kode mengecek bagaimana layar Daftar menanganinya.
- **Isi dari Google Sheet** seperti Bantuan: tidak dikerjakan karena isi jarang berubah dan tanpa database. Bila kelak sering direvisi, jadi kandidat di `bonus.md`.

---

## 8. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

_(belum ada blok)_

### Handoff #1 | 16 Nov 2026 | [RAC]

**Tugas:** PGN.02 (layar dan gaya Pengenalan Aplikasi) selesai, di-push dan dicek visual.
**Hasil:** tombol `#ke-pengenalan` dan section `#layar-pengenalan` ditambah di `index.html` (kode lama layar Masuk tidak diubah); `pengenalan.js`, `pengenalan.css`, dan `pengenalan-isi.js` dibuat.
**Keputusan:** gaya bahasa isi direvisi atas masukan owner (bagian 3); alasan di luar itu belum tercatat.

### Handoff #2 | 16 Nov 2026 | Ketua

**Tugas:** PGN.03 dan PGN.04 selesai: tiga berkas terdaftar di cache `sw.js` ("OK" ketua), dan tes Android lulus (versi baru muncul, topik buka-tutup, Kembali tidak mengosongkan isian, offline terbuka, link reset password tetap membuka layar Buat password baru).
**Keputusan baru:** tidak ada.

### Handoff #3 | 16 Nov 2026 | [RAC]

**Tugas:** PGN.05a selesai: infografik di paling atas layar (PG4), memakai gambar yang sama dengan Bantuan (pilihan PIC; alasan lain belum tercatat).
**Keputusan:** PGN.05 ditandai selesai di sheet tanpa tes di iPhone karena tidak ada yang punya; disetujui ketua lewat PIC (alasan lain belum tercatat). Topik iPhone tetap draf yang belum terbukti (PG9).

### Handoff #4 | 2026-11-18 | [RAC]

**Tugas:** PGN.07 selesai: topik "Bagaimana kalau tidak bisa daftar atau masuk?" ditambah paling akhir (kini topik 12, bagian 3); hanya `pengenalan-isi.js` yang berubah. Terbaca di HP dan laptop (dikonfirmasi PIC).
**Keputusan baru:** tidak ada.

### Handoff #5 | 2026-11-21 | [KETUA]

**Tugas:** PGN.06 selesai: isi final dicek dan terbit di Cloudflare (status Ready), dengan penekanan PWA sesuai permintaan owner. PGN.06 dicentang di sheet (21 Nov 2026).

**Hasil yang terbukti** (dikonfirmasi PIC di chat):

- Topik PWA tampil paling atas, di bawah infografik. Tebal dan warna hijau benar, akordeon buka-tutup normal.
- Mode pesawat di HP: layar Pengenalan terbuka dan tidak ada yang rusak, termasuk topik baru.
- Pencarian kata "analitik" di `public/pengenalan.js` oleh ketua di Zed (21 Nov 2026) menghasilkan 0 kecocokan.

**Keputusan baru:**

- Topik PWA di paling atas, disetujui ketua (21 Nov 2026); alasan di luar yang tertulis di PG4 belum tercatat.
- Karakter `<` dan `&` diterima cukup lewat bacaan kode (semua teks lewat `textContent`, tanpa `innerHTML`), tidak dikejar lagi. Alasan penerimaan di luar itu belum tercatat.
- Persetujuan "OK" ketua untuk perubahan `index.html` (PGN.02) dianggap sudah diberikan (konfirmasi ketua, 21 Nov 2026).

**Daftar butir yang masih terbuka (satu baris per butir):**

- PGN.05: bagian iPhone (topik 5, serta iPhone di topik 3, 7, 8, dan 11) belum dites di perangkat nyata. Diasumsikan jalan, keluhan ditampung untuk LNC.05 (`AGENTS.md` bagian 10 butir 7).
- Belum tercatat ada ibu customer yang membaca isi Pengenalan, termasuk topik PWA yang baru.
- Akordeon topik 12 (tidak bisa daftar atau masuk) belum dikonfirmasi eksplisit. Risiko kecil.
- Panggilan analitik `buka-pengenalan` tidak ditemukan di `public/pengenalan.js` yang dibuka ketua, padahal `analitik.md` AN3 dan AN4 menyebutnya ada. Belum diketahui apakah sengaja belum dipasang, ada di branch lain, atau sudah dibatalkan; belum dicek versi di repo.

**Saran giliran berikutnya:** tidak ada pekerjaan Pengenalan yang wajib sebelum peluncuran (`LNC.04`); sisa hanya butir di atas, yang menunggu pemakai iPhone dan satu ibu customer. Butir analitik dicek di sesi `analitik.md` (lampirkan `analitik.md`, `public/pengenalan.js`, dan `public/analitik.js`). Revisi isi hanya di `public/pengenalan-isi.js`; daftar berkas cache tidak berubah.
