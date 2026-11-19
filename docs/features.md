/docs/features.md

# Features & UI Modules — Kedai ChATA

Peta besar semua fitur dan layar **Kedai ChATA** (PWA). Dibaca sekali di awal sesi untuk orientasi. Detail kerja tiap fitur ada di dokumen fitur masing-masing (satu fitur = satu md + satu md tes, dokumen tes dibuat belakangan di sesi tes).

Status: **(ada)** = sudah diimplementasi, **(rencana)** = sudah diputuskan tapi belum dikerjakan, **(ditunda)** = sengaja belum dikerjakan.

> **Versi 1.2 (5 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Perubahan 1.2: bagian 6a (Bantuan), layar per peran memuat Bantuan, LNC.01 dan LNC.03 menyebut isi Bantuan. Perubahan 1.1: bagian 7a (desain) ditambah; jam bebas; mundur satu langkah; aturan tampilan daftar; backup. Semua fitur masih **(rencana)**. Perubahan status dan keputusan baru dari sesi kode dicatat sebagai blok di bagian 11 (append-only), bukan dengan menyunting bagian di atasnya. Struktur data ada di `docs/database.md`, aturan keamanan di `docs/security.md`.

---

## 1. Tujuan & Tiga Pihak

PWA sistem order untuk warung keluarga, sekaligus merapikan catatan order yang selama ini di WhatsApp. Tiga pihak melihat status order yang sama:

| Pihak        | Jumlah      | Peran singkat                                                                           |
| :----------- | :---------- | :-------------------------------------------------------------------------------------- |
| **Customer** | ±100        | Memesan, melihat status, menambah catatan, membatalkan selama Menunggu. Daftar sendiri. |
| **Owner**    | 5 (setara)  | Menyetujui atau menolak, mengelola menu, mencatat order untuk pelanggan tanpa akun.     |
| **Penjaga**  | 2+ (setara) | Memproses dan mengantar order yang sudah disetujui, mengunggah foto bukti bila perlu.   |

Hak lengkap tiap peran ada di `akun.md` bagian 4. Warung buka 7 hari; penjaga di akhir pekan orang yang berbeda, jadi akun penjaga bisa lebih dari 2.

## 2. Akun & Peran (rencana) → `akun.md`

- Daftar dan login email + password lewat Supabase Auth; **tanpa verifikasi email** (email asal-asalan diterima).
- Daftar customer wajib: **nama tampilan, nomor WA, satu alamat** (alias + alamat). Buku alamat **maksimal 5**.
- Owner dan penjaga **dibuatkan ketua** di dashboard, perannya dicatat di tabel `staf`. Tidak ada jalur dari aplikasi untuk menjadi staf.
- Ganti password (minta password lama). Lupa password lewat **link email** yang ditekan ketua dari dashboard (Gmail SMTP tim).

## 3. Menu (rencana) → `menu.md`

- Owner mengelola menu: nama, harga, foto (opsional), tombol **Tersedia/Habis**. Customer dan penjaga hanya melihat.
- Harga **selalu dihitung server**; harga saat order dicatat di order.

## 4. Order (rencana) → `order.md`

- Customer: pilih menu, **tipe (Diantar default, Diambil, Makan di warung)**, alamat, **hari (Hari ini/Besok)**, jam (bebas diisi, tanpa daftar), catatan awal, kirim. Setelah Kirim muncul teks: "Pesanan diterima. Perwakilan ChATA akan menghubungi lewat WhatsApp untuk pembayaran. Pesanan diproses setelah pembayaran dikonfirmasi."
- Status: Menunggu → **Disetujui** (owner terima bayar di luar aplikasi, pilih metode) → Diproses → Diantar / Siap diambil / Siap disajikan → Selesai. Cabang: Ditolak, Dibatalkan (oleh customer saat Menunggu). Salah pencet status boleh dimundurkan satu langkah (bukan dari Selesai). Tanpa tombol batal setelah Disetujui; bila terjadi, diselesaikan kekeluargaan lewat WA.
- **Catatan berlapis** (waktu dan penulis, tidak bisa diedit atau dihapus) selama belum Diproses. Follow up lewat WA; **tidak ada chat di aplikasi**.
- Owner bisa **membuat order untuk pelanggan tanpa akun** lewat wizard 5 langkah, dengan daftar "Pelanggan tanpa akun".

## 5. Foto Bukti Antar (rencana) → `foto-bukti.md`

- Opsional, hanya untuk tipe **Diantar**; penjaga yang menilai perlu atau tidak. Tujuan utama: **bukti bila customer merasa tidak diantar**. Pengunggah boleh mengganti foto bila salah atau buram.
- Dikompres di HP, disimpan di bucket privat, **dibersihkan otomatis setelah 14 hari** (catatan order tetap).

## 6. Notifikasi & Penyegaran (rencana) → `notifikasi.md`

- **Push notification (VAPID)** untuk kejadian penting, termasuk saat aplikasi ditutup. Teks push tidak memuat data pribadi.
- Data diambil saat aplikasi dibuka/kembali ke layar, saat push masuk (bila terbuka), dan lewat tombol **Segarkan**. **Tanpa polling dan tanpa Realtime** (hemat free tier).
- Android (Chrome) didukung penuh. iPhone hanya iOS 16.4 ke atas dan aplikasinya harus dipasang ke layar utama.

## 6a. Bantuan (rencana) → `bantuan.md`

- Layar **tanya-jawab** untuk semua peran: cara memesan, arti status, memasang ke layar utama, notifikasi, lupa password, dan tugas tiap peran. Dibuka dari menu **Akun** (customer, penjaga) dan **Lainnya** (owner); tanpa menu hamburger.
- Isi **ditulis ketua di Google Sheet**, lalu diimpor ke database lewat SQL Editor, jadi mengubah bantuan tidak perlu mengubah kode. Aplikasi tidak bisa mengubah isi. Teks biasa saja; server hanya memberi isi yang sesuai peran pemanggil.
- Dikerjakan **paling akhir**, setelah fitur lain selesai, supaya jawabannya cocok dengan aplikasi yang final.

## 7. Fondasi, Terbit, & PWA (rencana) → `fondasi.md`

- Repo public (akun GitHub ketua), GitHub Pages lewat GitHub Actions, `manifest.json` dan `sw.js` network first. Nama "Kedai ChATA" (pendek "ChATA").
- Pagar **anti-nyasar** untuk laptop bersama: git dan deploy tidak boleh menyentuh akun adik.
- Offline: berkas aplikasi terbuka, tapi login dan semua aksi butuh internet (pesan jelas).
- Semua path relatif terhadap `public/`.

## 7a. Desain (rencana) → `desain.md`

- Tema marun gelap dengan aksen emas; latar isi krem supaya mudah dibaca. Navigasi bawah per peran.
- Tulisan "Kedai ChATA" bergaya logo (wordmark) dari HTML/CSS; logo asli menggantikan bila berkasnya ketemu. Ikon PWA sementara dulu.

## 8. Bonus / Versi 2 dan 3 (ditunda) → `bonus.md`

Daftar kandidat (chat di aplikasi, integrasi LLM, order H+x fleksibel, editor bantuan di aplikasi, gambar dan pencarian di bantuan, rekap dan pendapatan, batas jam dan kuota menu, utang, penggabungan pelanggan, payment gateway, foto bukti transfer, dll). **Belum berurutan**; urutan ditentukan setelah review pemakaian versi 1.

## 9. Aturan Umum Tampilan & Pemeliharaan

- **Sesederhana WA untuk customer:** font dan tombol besar, satu tujuan per layar, bahasa sehari-hari. Ibu-ibu tidak boleh merasa dipersulit.
- Semua teks dari server dan input pengguna lewat `textContent`, bukan `innerHTML`.
- Bahasa UI dan komentar kode: Bahasa Indonesia.
- Teks dan angka yang bisa berubah (batas jumlah dan ukuran, lama simpan, menu) disimpan di database, bukan di kode.
- Fitur yang sudah selesai dites dicatat statusnya lewat blok di bagian 11, bukan dengan menimpa isi bagian di atas.

**Layar per peran (ringkas):**

| Peran    | Layar utama                                                                                                              |
| :------- | :----------------------------------------------------------------------------------------------------------------------- |
| Customer | Pesan (menu), Pesanan Saya (daftar dan detail), Akun (nama, WA, alamat, password, notifikasi, Bantuan).                  |
| Owner    | Order Masuk (Menunggu), Semua Order (filter hari/status), Buat Order (wizard), Menu, Lainnya (Pelanggan, Bantuan, Akun). |
| Penjaga  | Antrean (order Disetujui ke atas; Hari ini lalu Besok), Akun (termasuk Bantuan). Tombol Segarkan di semua layar daftar.  |

**Aturan daftar:** daftar owner dan penjaga hanya menampilkan order dengan hari antar **Hari ini dan Besok**, Hari ini dulu; yang sudah Disetujui (sudah dibayar) di atas, urut waktu disetujui, Selesai di bawah. Order yang hari antarnya sudah lewat tidak tampil. Owner bisa membuka hari lain lewat filter di Semua Order. **Customer tetap melihat riwayat lengkap** di Pesanan Saya. Rinciannya di `order.md` O22.

## 10. Peluncuran (prefix LNC)

Karena hanya ada satu environment (production) dan aplikasi dipakai nyata, peluncuran dibuat bertahap:

1. **LNC.01 ⚠️ Bersihkan data uji** (akun dummy, order uji, foto uji, isi uji Bantuan) sebelum dipakai nyata. Dijelaskan dampaknya dan dibuat bisa dipulihkan.
2. **LNC.02 Cek kuota:** perkirakan panggilan dan ukuran file per hari terhadap batas free tier. Siapkan juga **backup data rutin** (paket gratis tanpa backup otomatis; dipegang adik ketua).
3. **LNC.03 Uji coba terbatas:** owner, penjaga, dan 5 sampai 10 customer pilihan. Order berjalan berdampingan dengan WA. Isi Bantuan sudah terisi sebelum mulai.
4. **LNC.04 Buka untuk semua:** bagikan tautan dan panduan singkat memasang di layar utama (bawaan: lewat WA).
5. **LNC.05 Review pemakaian (sekitar 2 minggu):** catat apa yang paling dibutuhkan, lalu isi kolom alasan di `bonus.md`. Hitung juga keluhan pengguna iPhone (push).

---

## 11. Catatan Susulan (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini bila ada keputusan baru atau kejadian di lapangan. Format: `### YYYY-MM-DD: topik`. Yang paling akhir menang. Aturan lengkap: `AGENTS.md` bagian 2, aturan 7.

_(belum ada blok)_

### 2026-11-08: Reset nomor order di LNC.01

**Berkas tujuan:** `docs/features.md`, Catatan Susulan. Sumber: `docs/order.md` Handoff #1. Yang paling akhir menang.

- Nomor order berjalan terus (O18) dan mulai dari 1, sehingga order uji ikut memakai nomor. Pada pembersihan data uji **LNC.01**, nomor order direset supaya order sungguhan mulai dari awal.
- Reset dilakukan **satu kali oleh ketua di SQL Editor**, setelah tabel order bersih, dengan penjelasan dampak dan "OK" (peran aplikasi tidak punya hak atas urutan nomor).

### 2026-11-11: Layar Kotak masuk dan urutan versi 1

Sumber: docs/inbox.md. Yang paling akhir menang.

- **Layar per peran:** semua peran punya **Kotak masuk** di menu hamburger (di bawah Arithmetics), dengan titik merah di ikon hamburger bila ada yang belum dibaca. Ini jalur kabar cadangan bagi yang notifnya diblokir.
- **Urutan versi 1:** Foto Bukti, lalu Inbox (INB), lalu Notifikasi (NTF), lalu isi Bantuan, tes akhir, dan Peluncuran.
- **Peluncuran (bagian 10):** pembersihan data uji (LNC.01) ikut mencakup isi inbox uji; pengingat rutin ketua ditambah hapus inbox lama.

### 2026-11-14: Fitur Gelar Customer masuk versi 1

Sumber: docs/gelar.md. Yang paling akhir menang.

- **Layar per peran:** customer punya layar **Gelar Saya** (dibuka dari Home) berisi pratinjau banner, Bagikan, dan Unduh PNG. Owner dan penjaga tidak berubah.
- **Urutan versi 1:** fitur ini ditambahkan sebelum Peluncuran. **Peluncuran (bagian 10):** pembersihan data uji (LNC.01) mencakup akun dummy demo gelar; sebelum LNC.04 ambang gelar dikembalikan ke angka asli (GLR.09).

### 2026-11-14: Tombol QRIS di Home masuk versi 1

Sumber: docs/qris.md. Yang paling akhir menang.

- **Layar per peran:** semua peran (customer, owner, penjaga) punya tombol **QRIS** di Home yang membuka pop-up gambar QRIS warung. Layar dan menu lain tidak berubah.
- **Urutan versi 1:** fitur ini ditambahkan sebelum Peluncuran; kecil dan tanpa server, jadi tidak menambah panggilan ke kuota.
- **Peluncuran (bagian 10):** sebelum LNC.04, pastikan `public/img/qris.png` adalah QRIS asli warung. Tidak ada data uji yang perlu dibersihkan untuk fitur ini.

### 2026-11-14: Layar Gelar Saya (customer) masuk versi 1

Sumber: docs/gelar.md. Keputusan ketua (usulan owner setelah demo); peluncuran mundur sekitar 3 hari atas persetujuan owner.

- Layar customer bertambah: pil gelar di kartu sapaan Home dan layar **Gelar Saya** (pratinjau banner, Bagikan, Unduh PNG). Hanya customer.
- Gelar dihitung server dari order Selesai milik akun sendiri; order wakil owner dan pelanggan tanpa akun tidak ikut (GL6).
- Peluncuran: ambang gelar harus dikembalikan ke angka asli sebelum LNC.04 (GLR.09, sudah dikerjakan 14 Nov 2026). Akun dummy bergelar dibersihkan di LNC.01.

### 2026-11-16: Layar Pengenalan Aplikasi di layar Masuk

Sumber: docs/pengenalan.md. Yang paling akhir menang.

- **Layar per peran:** layar **Masuk** (sebelum login, semua orang) bertambah tombol **Pengenalan Aplikasi** yang membuka layar penjelasan 10 topik (dilipat per topik). Layar lain tidak berubah.
- **Urutan versi 1:** fitur ini ditambahkan sebelum Peluncuran; kecil dan tanpa server, jadi tidak menambah panggilan ke kuota.
- **Peluncuran (bagian 10):** sebelum LNC.04, isi sudah dicek ke satu pemakai iPhone dan satu customer (PGN.05). Tidak ada data uji yang perlu dibersihkan untuk fitur ini.

### Handoff #1 | 2026-11-17 | (KETUA)

**Tugas:** persiapan LNC.01 (bersihkan data uji). Sesi ini hanya diskusi, belum ada kode, SQL, atau query yang dijalankan. Yang dibahas: usulan owner soal email akun staf asli, dan rencana awal LNC.01.

**File yang diubah:** tidak ada. Belum ada perubahan tabel, `kedai`, atau `sw.js`.

**Keputusan baru (koordinasi owner, 17 Nov 2026; alasan selebihnya belum tercatat):**

- **Dua kotak Gmail terpisah.** Kotak yang biasa dipakai tes tetap untuk akun uji. Kotak kedua (belum pernah dipakai tes, ada di HP ibu ketua) khusus akun staf asli. Alamat asli tidak ditulis di md, repo, atau chat (contoh dummy: `kedai+ab@contoh.com`).
- **Owner:** alias `+[inisial]` per orang. Inisial harus unik; bila kembar, tambah angka atau huruf.
- **Penjaga:** satu akun `+staf`, karena penjaga hanya satu orang mulai Desember 2026. Sampai peralihan, bila penjaga masih bergantian, riwayat status dan pengunggah foto tidak bisa membedakan orangnya, dan batas `push_maks_perangkat` (5) bisa terlewati. Risiko diterima.
- **Nomor WA:** tiap akun memakai nomor orangnya sendiri (WAG.06), diketik ketua langsung di SQL Editor.
- **Reset password:** link dari dashboard jatuh ke kotak kedua di HP ibu ketua, diteruskan lewat WA pribadi ke orangnya, lalu segera dipakai.
- **Akun asli boleh dibuat sebelum LNC.01.** Email akun uji tidak dipakai ulang untuk akun asli.
- **Rencana LNC.01 (belum disetujui ketua):** akun staf uji (dua akun owner yang dipakai ibu ketua) **dinonaktifkan, bukan dihapus**, supaya jejak `diubah_oleh` di tabel `menu` tidak hilang. Penonaktifan berdasarkan daftar yang disebut satu per satu, akun asli tidak boleh ada di daftar itu.
- **Sheet:** LNC.01a (tes email ke alias +) dan LNC.01b (buat akun staf asli dan isi nomor WA staf, High-Risk, P0) sudah ditambah. Catatan LNC.03 menyebut bagian akun staf asli sudah dikerjakan di LNC.01b; butir LNC.03 sendiri tetap uji coba terbatas.

**Pertentangan dengan catatan lama:** `features.md` bagian 10 dan sheet LNC.01 menyebut akun dummy "dihapus lewat dashboard". Untuk akun staf uji itu diganti menjadi dinonaktifkan (rencana, menunggu "OK" ketua).

**Masalah yang belum beres:**

- Blok catatan untuk `docs/akun.md` (versi terakhir, dengan baris "Desember 2026") **belum dipastikan sudah ditempel**. Berkas `akun.md` belum ada di project.
- LNC.01a belum dikerjakan (email tes ke alias + belum dikirim).
- Belum ada persetujuan "nonaktifkan" untuk dua akun owner uji, dan query baca-saja pendataan data uji belum dibuat.
- Berkas yang belum ada di project dan dibutuhkan sebelum menulis SQL: migration (`20261105_akun.sql`, `20261108_order.sql`, `20261111_foto_bukti.sql`, `20261111_05_inbox.sql`, `20261114_gelar.sql`), serta `akun.md`, `inbox.md`, `foto-bukti.md`, `bantuan.md`.
- Catatan temuan untuk LNC.01: urutan hapus harus tabel anak dulu, `order` terakhir (inbox, `order_item`, `riwayat_status`, `catatan_order`, `baca_catatan`, `foto_bukti` merujuk ke order; order wakil merujuk `pelanggan_luar`). Menu, grup pilihan, aturan gelar, dan `pengaturan` tidak disentuh. Isi uji Bantuan ditandai `aktif = tidak`. Foto uji di Storage dihapus lewat dashboard. Reset nomor order satu kali oleh ketua setelah tabel order bersih. **Ekspor CSV dulu** sebelum penghapusan (tugas adik ketua, simpan di luar repo). Cek apakah grup "Level pedas" asli atau sisa uji. Penghapusan data butuh penjelasan dampak dan "OK" ketua (`AGENTS.md` bagian 2 butir 5).

**Masalah yang sudah beres:**

- Blok catatan untuk `docs/akun.md` (versi terakhir, dengan baris "Desember 2026") sudah ditempel ketua.

**Saran giliran berikutnya:**

1. Kerjakan LNC.01a lalu LNC.01b (ketua, dashboard dan SQL Editor, profil browser terpisah).
2. Sesi LNC.01: lampirkan `AGENTS.md`, `features.md`, `security.md`, `database.md`, `order.md`, `docs/menu.md`, dan migration di atas. Mulai dengan query **baca-saja** untuk mendata data uji, tempel hasilnya (data pribadi disamarkan), lalu penjelasan dampak per tabel dan "OK" ketua sebelum SQL penghapusan apa pun.

### Handoff #2 | 2026-11-18 | [KETUA]

**Tugas:** diskusi saran teman soal hosting (Cloudflare Pages vs GitHub Pages) dan bot. Sesi ini hanya diskusi, belum ada kode, SQL, atau pengaturan yang diubah.

**File yang diubah:** tidak ada.

**Keputusan baru:**

- **Tetap di GitHub Pages.** Alasan pindah hanya karena proteksi bot dinilai kurang kuat; risiko bot ada di Supabase (daftar dan masuk), bukan di hosting statis. Pindah hosting berarti ganti origin (instalasi, push, SEC-33, Site URL Auth ikut berubah). Alasan lain untuk pindah (header keamanan `_headers`, ketentuan layanan GitHub Pages untuk usaha) disebut sekilas dan **belum diputuskan atau dicek**.
- **Turnstile di Daftar dan Masuk:** lihat Blok A.
- **Batas 5 order per customer per hari:** lihat Blok B.
  **Masalah yang belum beres:**

- "OK" ketua untuk Blok A dan B belum tercatat.
- Belum jelas apakah **link reset password dari dashboard** dan **pembuatan akun staf oleh ketua** ikut kena CAPTCHA. Harus dites, jangan diasumsikan.
- Belum dites di HP lama.
- Batas order harian: pengecekan di `database.md` menunjukkan tidak ada batas per customer di `order_buat`; fungsi aslinya belum dibaca.
- Jadwal rilis terbatas: Senin 23 Nov 2026. LNC.01, 01a, 01b juga masih menunggu.
  **Saran giliran berikutnya:**

1. Tempel Blok A, B, dan C, lalu dapatkan "OK" ketua.
2. Sesi kode **Turnstile dulu**. Lampirkan: `AGENTS.md`, `features.md`, `security.md`, `akun.md`, `index.html`, `public/akun.js`, `sw.js`, `config.js`. Mulai dari widget di akun Cloudflare ketua, lalu kode, lalu tes dummy, lalu nyalakan tombol di dashboard terakhir.
3. Cek reset password dan pembuatan akun staf **sebelum LNC.01b**.
4. Sesi kode **batas order** terpisah (jangan digabung dengan Turnstile supaya penyebab masalah mudah dilacak). Lampirkan: `AGENTS.md`, `order.md`, `database.md`, `security.md`, `20261108_order.sql`, berkas `kedai` yang memuat `order_buat`.
5. Handoff pengerjaan Turnstile ditempel di akhir `akun.md` (nomor berikutnya #15); handoff batas order di akhir `order.md`.
6. Tambahkan butir baru ke sheet: "Turnstile di Daftar dan Masuk" dan "Batas 5 order per hari".

### 2026-11-18: Fitur Belanja Warung (khusus owner)

Sumber: docs/belanja.md. Yang paling akhir menang.

- **Layar per peran:** owner bertambah layar **Belanja Warung**, dibuka dari item baru di **menu hamburger** (di bawah Kotak masuk, hanya tampil untuk owner; bukan di Lainnya): akordeon catatan belanja (judul, penginput, total), rekap total per owner, input item dengan tombol Simpan, tombol Kunci. Customer dan penjaga tidak berubah.
- **Versi:** menunggu ketua dan owner (V1 sebelum Peluncuran atau sebelum LNC.04). Belum final.
- **Peluncuran (bagian 10):** LNC.01 mencakup data uji belanja; LNC.02 mencakup kuota; Bantuan owner ditambah entri Belanja Warung.

### 2026-11-18: Versi rilis Belanja Warung diputuskan

Sumber: docs/belanja.md. Keputusan ketua. Yang paling akhir menang.

- Belanja Warung masuk **V1 sebelum Peluncuran** (bukan sebelum LNC.04). Target rilis terbatas tetap Senin 23 Nov 2026; strategi uji coba terbatas dibahas Sabtu 21 Nov 2026.
- **Peluncuran (bagian 10):** LNC.01 harus mencakup data uji belanja yang dibuat saat pengerjaan. Karena fitur dikerjakan sekarang, data uji dibuat dummy dan dibersihkan di LNC.01.

### Handoff #3 | 2026-11-19 | ketua

**Tugas:** LNC.01a (tes email ke alias +) dan LNC.01b (akun staf asli dan nomor WA). Keduanya selesai. Tidak ada berkas aplikasi, migration, atau fungsi yang diubah, tidak ada deploy.

**File yang diubah:** tidak ada. Berkas yang dipakai apa adanya: `supabase/templates/20261106_staf_tambah.sql`, `20261106_staf_cek.sql`, `20261115_03_staf_nomor_wa_isi.sql`. Isian (ID, nama, nomor) hanya diisi di SQL Editor dan tidak disimpan ke repo.

**Yang terbukti (bukti di chat, tidak disimpan):**

- **LNC.01a:** tes dilakukan lewat akun owner asli pertama (bukan akun `+tes`). Email recovery dari Supabase ke alias `+` masuk **Inbox** (bukan Spam), sekitar 3 menit setelah akun dibuat. Link disalin ke tab baru, layar Buat password baru terbuka. Password tidak disimpan, link dianggap habis (sekali pakai).
- **LNC.01b:** template tambah staf berhasil tanpa galat. Tabel `staf` kini berisi **5 owner asli dan 1 penjaga asli**, ditambah 3 akun uji. Semua `aktif = true` dan `bernomor = true` (hasil template nomor WA). Query cek staf: tidak ada staf yang punya profil customer, RLS aktif tanpa policy, `service_role` hanya SELECT, `anon` dan `authenticated` tanpa hak.
- **`push_maks_perangkat` = 5 per akun** (notifikasi.md NT5, Handoff #3): dikonfirmasi tidak berebut antar akun. Tidak ada perubahan pengaturan.

**Keputusan baru (ketua, lewat chat 19 Nov 2026):**

- Akun owner asli pertama dipakai sebagai tes LNC.01a, supaya tidak menambah akun dummy yang harus dibersihkan. Menyimpang dari keputusan 17 Nov (tes dengan alias uji dulu, baru akun asli).
- Empat owner lain dibuat sekaligus (Add user empat kali, lalu template tambah staf dan template nomor WA).
- Penjaga asli satu akun, sesuai keputusan 17 Nov.

**Pertentangan dengan catatan lama:** bagian "tes dulu, baru akun asli" di Handoff #1 (17 Nov) tidak berlaku untuk akun pertama. Yang paling akhir menang.

**Masalah yang belum beres:**

- **Send password recovery untuk keenam akun asli belum dikirim.** Dikirim satu per satu saat orangnya siap membuka email (cek Spam, salin link ke tab baru). Link tes LNC.01a sudah habis, jadi akun pertama juga perlu recovery baru.
- `bernomor = true` hanya membuktikan kolom terisi, bukan nomor itu benar. Kebenarannya dibuktikan lewat WAG.06a.
- Kecocokan tiap akun Auth dengan nama tampilan belum tercatat dicek.
- Akun dummy di Authentication (`test05`, `test06@example.com`, `+trn06`) belum dibersihkan; wajib sebelum LNC.04, butuh "OK" ketua.
- **LNC.01 (P0)** belum dimulai.
- Risiko diterima: satu penjaga berarti riwayat status dan pengunggah foto tidak membedakan orang bila ada pengganti.

**Saran giliran berikutnya:** LNC.01. Ekspor CSV dulu (adik ketua, di luar repo). Mulai dengan query baca-saja untuk mendata data uji. Daftar akun uji yang dinonaktifkan hanya tiga, disebut satu per satu, dan akun asli tidak boleh ada di daftar. Lampirkan `AGENTS.md`, `features.md`, `security.md`, `database.md`, `order.md`, `menu.md`, `belanja.md`, `pemetaan-test.md`, dan semua migration. Penghapusan data butuh penjelasan dampak dan "OK" ketua.

### 2026-11-19: LNC.01 dipecah per kelompok data, data uji Belanja selesai

Sumber: sesi LNC.01c. Keputusan ketua soal pembagian sesi; alasan selebihnya belum tercatat. Yang paling akhir menang.

- **LNC.01 dikerjakan bertahap di sheet**, urutan mengikuti kunci asing (anak dulu, induk terakhir): `LNC.01c` data dummy Belanja, `LNC.01d` inbox dan foto, `LNC.01e` order dan reset nomor order, `LNC.01f` akun. Pembagian ini menambah, tidak menggantikan, daftar bagian 10 dan blok 8 Nov (reset nomor order) dan 17 Nov (akun staf uji dinonaktifkan, bukan dihapus).
- **LNC.01c selesai 19 Nov 2026:** seluruh data uji Belanja (10 catatan, 69 item) dihapus satu kali oleh ketua; tabel kini kosong. Rincian ada di blok `docs/belanja.md` bertanggal sama.
- **Ekspor CSV dilewati untuk Belanja** untuk data Belanja karena isinya data uji yang memang tidak dipakai lagi. Ini menyimpang dari saran Handoff #9 dan catatan baris LNC.01 di sheet (“ekspor dulu”); untuk Belanja, blok ini yang menang.
- **Sisa LNC.01:** `LNC.01d`, `LNC.01e`, `LNC.01f`. Akun uji (tiga akun staf uji dan akun dummy di Auth) baru disentuh di `LNC.01f`, setelah data yang merujuk ke mereka hilang.
