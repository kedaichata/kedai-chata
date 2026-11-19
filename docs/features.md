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

### Handoff #4 | 2026-11-19 | (KETUA)

**Tugas:** LNC.01c (hapus data uji Belanja). Selesai, terbukti, sudah di-push, dan sudah dicentang di sheet (19 Nov 2026). Baris induk `LNC.01` tetap Belum.

**File yang diubah (commit `7cfb66e`, tanpa `[skip ci]`, sudah di-push ke `main`, `a144d2f..7cfb66e`):**

- Baru di `supabase/templates/`: `20261119_belanja_data_uji_cek.sql` (empat query baca-saja) dan `20261119_belanja_data_uji_hapus.sql` (satu transaksi dengan pengaman jumlah dan penginput). Isi uji sudah terhapus, jadi pengamannya tidak lolos bila dijalankan ulang.
- Diubah (hanya ditambah, 0 baris lama berubah): `AGENTS.md` (blok data uji tanpa ekspor CSV), `docs/belanja.md` (blok pembersihan data uji Belanja), `docs/features.md` (blok pembagian LNC.01).
- Tidak ada perubahan `public/`, `kedai`, `sw.js`, tabel, hak tabel, pengaturan, atau fungsi SQL. Cek anti-nyasar lolos (folder, remote, email noreply, kunci SSH khusus proyek).

**Keputusan baru (ketua, 19 Nov 2026):**

- **Data uji murni tidak diekspor CSV sebelum dihapus** (alasan ketua: data uji dibuat untuk dibuang, tidak ada gunanya disimpan). Berlaku umum, dengan syarat isinya terbukti data uji lewat query baca-saja. AI tidak mengungkit CSV lagi untuk data uji. Rincian di blok `AGENTS.md` bertanggal sama. Menimpa saran Handoff #9 (`belanja.md`) dan catatan baris `LNC.01` di sheet.
- **LNC.01 dipecah di sheet** (ID dirapikan setelah koreksi bentrok dengan `LNC.01a` dan `LNC.01b` yang sudah Selesai): `LNC.01c` Belanja, `LNC.01d` inbox dan foto, `LNC.01e` order dan reset nomor order, `LNC.01f` akun. Urutan mengikuti kunci asing; jangan ditukar.
- Ketua mengonfirmasi "Bu Owner 2" dan "Owner Uji" adalah akun uji dan memberi "OK" penghapusan.
- Tidak ada pertentangan lain dengan blok lama.

**Terbukti (diperiksa di chat, tidak disimpan):**

- Sebelum hapus: `belanja` 10 dan `belanja_item` 69 (angka cocok antar query), hanya dua penginput uji, semua dibuat 18 Nov 15.49 sampai 19 Nov 04.25 WIB.
- Sesudah hapus: kedua tabel 0 (screenshot ketua). Hapus berjalan dalam satu transaksi dan tersimpan (query cek jalan sesudah `COMMIT`).

**Masalah yang belum beres:**

- **`LNC.01d`, `LNC.01e`, `LNC.01f` belum dimulai** (semua P0, High-Risk, butuh penjelasan dampak dan "OK" ketua). Baris induk `LNC.01` dicentang setelah ketiganya selesai.
- **Data uji lain masih ada:** isi `inbox`, baris `foto_bukti` dan berkas di bucket `foto-bukti`, `order` beserta `order_item`, `riwayat_status`, `catatan_order`, `baca_catatan`, `pelanggan_luar` uji, `langganan_push` uji, `profil` dan `alamat` customer dummy, isi uji Bantuan (BTN.04, SEC-30), akun dummy demo gelar. Nomor order belum direset.
- **Akun uji belum disentuh.** Rencana (belum disetujui ketua): tiga akun staf uji dinonaktifkan, bukan dihapus; daftar disebut satu per satu dan akun asli tidak boleh ada di dalamnya. Akun dummy di Auth (`test05`, `test06@example.com`, `+trn06`) dihapus lewat dashboard setelah data yang merujuk hilang; wajib sebelum LNC.04.
- Sebelum menghapus akun di Auth, cek dulu tabel yang merujuk ke akun itu (misalnya `inbox.penerima`, `langganan_push.akun`, `belanja.penginput`, `foto_bukti.diunggah_oleh`).
- **Mulai LNC.01d, cek dulu apakah ada data asli yang tercampur** (akun asli dibuat 19 Nov; tes dengan orang sungguhan, misalnya uji coba sebelumnya). Ragu: anggap data asli dan tanyakan ke ketua.
- Belum terbukti dari fitur Belanja: `_batal.sql` BLJ, dua tab bersamaan, `akun_nonaktif`, sesi habis saat Simpan, iPhone, layar sangat sempit. Tes berikutnya memakai catatan baru karena tabel kini kosong.
- Blok `belanja.md` dan `features.md` bertanggal 19 Nov masih memuat kalimat "alasan belum tercatat" soal CSV; blok `AGENTS.md` yang paling akhir menang. Tidak perlu dirapikan.

**Saran giliran berikutnya:**

1. Sesi `LNC.01d`. Lampirkan `AGENTS.md`, `features.md`, `security.md`, `database.md`, `inbox.md`, `foto-bukti.md`, `20261111_05_inbox.sql`, `20261111_foto_bukti.sql`, dan template pembersih inbox INB.06 bila ada di `supabase/templates/`.
2. Mulai dengan query baca-saja untuk mendata `inbox` dan `foto_bukti` (jumlah, pemilik, tanggal), lalu penjelasan dampak dan "OK". Tabel anak dulu: `inbox` dan `foto_bukti` sebelum `order`. Berkas foto di Storage dihapus lewat dashboard setelah barisnya beres, atau dibiarkan disapu `bersihkan` bila lewat 14 hari (keputusan ketua).
3. Lalu `LNC.01e` (order dan reset nomor order, satu kali oleh ketua), lalu `LNC.01f` (akun).
4. Commit yang memuat berkas `supabase/` jangan pakai `[skip ci]`; commit yang hanya docs boleh. Sebelum push, tempel `pwd`, `git remote -v`, dan email commit terakhir, dan baca `git status` serta `git diff --stat` sebelum commit.

### Handoff #5 | 2026-11-19 | (KETUA)

**Berkas tujuan:** `docs/features.md`, tempel paling bawah (setelah Handoff #4). Yang paling akhir menang.

**Tugas:** LNC.01d (hapus data uji inbox dan foto). Selesai, terbukti, dan sudah dicentang di sheet (19 Nov 2026). Baris induk `LNC.01` tetap Belum; `LNC.01e` dan `LNC.01f` belum dimulai.

**File yang diubah (semua baru, tidak ada yang lama disentuh):**

- `supabase/templates/20261119_inbox_foto_data_uji_cek.sql` (enam query baca-saja, A sampai F).
- `supabase/templates/20261119_inbox_foto_data_uji_hapus.sql` (satu transaksi dengan pengaman, tanpa ID akun).
- `docs/features.md`: blok ini.
- Tidak ada perubahan `public/`, `kedai`, `sw.js`, tabel, hak tabel, pengaturan, atau fungsi SQL. Tidak ada deploy.
- Status commit: belum. Kedua template dan blok ini masuk satu commit, **tanpa `[skip ci]`** karena menyentuh `supabase/` (AGENTS.md blok 12 Nov 2026).

**Keputusan baru (ketua, 19 Nov 2026):**

- Ketua mengonfirmasi tiga akun staf di data inbox dan foto (dua owner, satu penjaga) adalah akun uji, dan **semua customer di data itu dummy; belum ada customer sungguhan yang masuk.** Ini menjadi dasar "OK" penghapusan.
- Pengaman SQL hapus memakai **batas tanggal 19 Nov 2026 (waktu akun asli dibuat) dan jumlah akun berbeda**, bukan daftar ID akun, jadi berkas aman masuk repo. Alasan ketua selain itu belum tercatat (pilihan penulis).
- **Nomor urut `id` inbox tidak direset.** Penanda titik merah di HP memakai nomor itu, dan resetnya tidak perlu. Pilihan penulis, alasan belum tercatat.
- Berkas foto di Storage dihapus lewat dashboard (hapus lima folder per order di bucket `foto-bukti`; bucket tidak dihapus), setelah barisnya hilang dari tabel.
- Mengikuti blok `AGENTS.md` 19 Nov 2026: data uji tidak diekspor CSV; syarat satu-satunya terbukti data uji lewat query baca-saja.
- Tidak ada pertentangan dengan blok lama. Peringatan Handoff #4 ("cek dulu apakah ada data asli yang tercampur") terjawab: tidak ada.

**Terbukti (bukti diperiksa di chat, tidak disimpan):**

- Sebelum hapus: `inbox` 255 baris (lima penerima: tiga akun staf uji dan dua customer, semua bertanggal 11 sampai 18 Nov, 0 baris sejak 19 Nov), `foto_bukti` 9 baris (satu pengunggah, penjaga uji), 5 berkas di Storage (145,8 KB, semuanya punya baris, 0 yatim). Angka cocok dengan order yang dirujuk (#60 sampai #138).
- Sesudah hapus: `inbox` 0 dan `foto_bukti` 0 (screenshot ketua, tersimpan setelah `COMMIT`); berkas di bucket `foto-bukti` 0 (hasil query cek blok A).

**Belum beres:**

- **LNC.01e (order dan reset nomor order)** dan **LNC.01f (akun)** belum dimulai (keduanya P0, High-Risk, butuh penjelasan dampak dan "OK" ketua). Baris induk `LNC.01` dicentang setelah keduanya selesai.
- **Data uji yang masih ada:** `order` (dari data tadi, nomor sekitar #60 sampai #138) beserta `order_item`, `riwayat_status`, `catatan_order`, `baca_catatan`; `pelanggan_luar` uji dan 8 order wakil (#72, #76, #120 sampai #125); `langganan_push` uji; `profil` dan `alamat` customer dummy; isi uji Bantuan (BTN.04, SEC-30); akun dummy demo gelar; akun dummy di Authentication (Handoff #3). Nomor order belum direset.
- Order dirujuk **lima akun customer pemesan**, lebih banyak dari tiga akun dummy yang disebut di Handoff #3. Ketua menyatakan semua customer dummy; daftarnya tetap dicocokkan di `LNC.01f`.
- Order #110 sampai #138 tampaknya sisa tes batas order harian (BTO.04). Hanya dugaan dari pola waktu dan tipe; dibuktikan di sesi 01e.
- Tiga akun staf uji rencananya **dinonaktifkan, bukan dihapus** (Handoff #1 dan #3, menunggu "OK" ketua), disebut satu per satu, dan akun asli tidak boleh ada di daftar.
- Template hapus inbox INB.06 tahap 2 (`DELETE`) belum pernah dijalankan; tabel inbox kini kosong, jadi baru bisa diuji dengan baris asli yang berumur lebih dari 14 hari (paling cepat sekitar awal Desember 2026).
- Logout Supabase dan GitHub di profil browser ketua belum dikonfirmasi.

**Saran giliran berikutnya (LNC.01e):**

1. Sesi baru. Lampirkan `AGENTS.md`, `features.md` (dengan Handoff #5), `security.md`, `database.md`, `order.md`, `menu.md`, `pemetaan-test.md`, `20261108_order.sql`, dan migration lain yang menyentuh tabel yang merujuk ke `order` (`20261108_02_order_fungsi.sql`, `20261118_order_batas_harian.sql`, `20261111_foto_bukti.sql`, `20261111_05_inbox.sql`, migration `pelanggan_luar` dan `langganan_push`). AI menyebut berkas lain yang kurang di awal sesi.
2. Mulai dengan query **baca-saja**: jumlah dan rentang tanggal `order`, per pemesan (ID awal saja), order wakil dan `pelanggan_luar`, status, serta jumlah baris di tabel anak. Pastikan **tidak ada order sungguhan** sebelum penjelasan dampak dan "OK" ketua.
3. Urutan hapus: tabel anak dulu (`baca_catatan`, `catatan_order`, `riwayat_status`, `order_item`; `inbox` dan `foto_bukti` sudah kosong), lalu `order`, lalu `pelanggan_luar` uji. Satu transaksi dengan pengaman jumlah, memakai pola `20261119_inbox_foto_data_uji_hapus.sql`.
4. **Reset nomor order satu kali oleh ketua di SQL Editor**, setelah tabel `order` kosong, dengan penjelasan dampak dan "OK" (blok 8 Nov 2026). Setelah itu order sungguhan mulai dari #1.
5. Lalu `LNC.01f` (akun), dengan penonaktifan akun staf uji seperti di atas.
6. Sebelum push: tempel `pwd`, `git remote -v`, dan email commit terakhir, baca `git status` dan `git diff --stat` sebelum commit. Commit yang memuat `supabase/` jangan pakai `[skip ci]`.

### Handoff #6 | 2026-11-19 | (KETUA)

**Tugas:** LNC.01e (hapus data uji order dan reset nomor order) **baru dimulai, belum selesai**. Sesi ini hanya persiapan: belum ada SQL yang dijalankan, belum ada data yang dihapus, tidak ada perubahan `public/`, `kedai`, `sw.js`, tabel, hak tabel, pengaturan, atau fungsi. Baris `LNC.01e` di sheet tetap **Belum**.

**File yang diubah:** satu berkas baru, **belum di-commit**: `supabase/templates/20261119_order_data_uji_cek.sql` (blok A sampai H, semuanya `SELECT`, tanpa data nyata). Commit-nya menyentuh `supabase/`, jadi **tanpa `[skip ci]`** (`AGENTS.md` blok 12 Nov 2026). Handoff ini sendiri masuk commit yang sama.

**Keputusan baru:** tidak ada. Klarifikasi yang dibahas (dari `gelar.md` GL8): **tabel `gelar` tidak perlu dihapus atau disentuh di LNC.01e.** Isinya aturan (ambang, nama, `menu_id`), bukan hasil, dan tidak merujuk ke `order` maupun akun. Gelar customer dihitung server tiap diminta dari order Selesai milik akun, jadi begitu order uji terhapus, gelar akun dummy otomatis nol. Selaras dengan Handoff #1 (aturan gelar tidak disentuh di LNC.01).

**Rencana LNC.01e (belum disetujui ketua; butuh penjelasan dampak dan "OK"):**

1. Jalankan blok A sampai H di SQL Editor (akun ketua, profil browser terpisah), satu blok per kali, tempel hasilnya ke chat.
2. Bila semua terbukti data uji (blok G semuanya 0, tidak ada akun customer berprofil sejak 19 Nov), AI menjelaskan dampak per tabel, lalu "OK" ketua.
3. Hapus dalam satu transaksi dengan pengaman jumlah (pola `20261119_inbox_foto_data_uji_hapus.sql`). Urutan: tabel anak dulu (`baca_catatan`, `catatan_order`, `riwayat_status`, `order_item`), lalu `order`, lalu `pelanggan_luar` uji. Urutan final mengikuti hasil blok B (kunci asing).
4. **Reset nomor order satu kali oleh ketua**, setelah `order` kosong, dengan "OK" tersendiri (blok 8 Nov 2026). Setelah itu order sungguhan mulai dari #1.
   **Masalah yang belum beres:**

- **Blok A sampai H belum dijalankan.** Blok D memakai kolom `profil.dibuat_pada` yang belum dicek di migration; bila galat "column does not exist", berhenti dan laporkan, jangan diubah sendiri.
- **Belum diputuskan: tes gelar yang tersisa (GLR.07)** dikerjakan dulu sebelum order dihapus atau tidak. Sisanya: status Diantar, Ditolak, Dibatalkan satu per satu, dan PNG unduhan dengan nama panjang (`gelar.md` Handoff #5). Sesudah order terhapus, tes itu butuh order dummy baru yang harus dibersihkan lagi. Pilihan penulis: kerjakan sekarang bila mau, tetapi **ketua yang memutuskan** (tidak ada keputusan tercatat).
- **Cek baca-saja yang masih disarankan:** (1) gelar menu `menu-karage` dan `menu-katsu` masih terhubung ke menu aktif yang benar (menu dummy sudah diubah jadi menu asli lewat edit, Handoff #14 `menu.md`; cek memastikan tidak ada menu baru yang menggantikan); (2) ambang `gelar` masih angka asli (1, 10, 25, 50, 100 dan 20) sesudah GLR.09.
- **Sisa di tabel `gelar`:** dua baris uji nonaktif (`tingkat-uji-enam`, `tingkat-uji-tujuh`). Tidak memengaruhi hitungan dan tidak terkait order; bukan bagian 01e. Merapikannya butuh "OK" tersendiri.
- **LNC.01f (akun)** belum dimulai. Rencana (belum disetujui): tiga akun staf uji dinonaktifkan, bukan dihapus, disebut satu per satu; akun asli tidak boleh ada di daftar. Akun dummy di Auth (`test05`, `test06@example.com`, `+trn06`, dan akun customer dummy lain) dihapus lewat dashboard setelah data yang merujuk hilang; wajib sebelum LNC.04.
- Data uji lain yang masih ada (Handoff #5): `langganan_push` uji, `profil` dan `alamat` customer dummy, isi uji Bantuan (BTN.04, SEC-30), dan akun dummy demo gelar.
- Butir terbuka dari Handoff #1 sampai #5 yang tidak disebut di sini tidak berubah (antara lain kecocokan akun Auth dengan nama tampilan, Send password recovery enam akun asli, logout Supabase dan GitHub di profil browser ketua).
  **Saran giliran berikutnya:**

1. Commit berkas template baru dan handoff ini (tanpa `[skip ci]`). Sebelum push, tempel `pwd`, `git remote -v`, dan email commit terakhir; baca `git status` dan `git diff --stat` dulu.
2. Sesi baru LNC.01e. Lampirkan `AGENTS.md`, `features.md` (dengan Handoff #6), `security.md`, `database.md`, `order.md`, `menu.md`, `gelar.md`, `pemetaan-test.md`, `20261108_order.sql`, `20261108_02_order_fungsi.sql`, dan dua template LNC.01d (`..._inbox_foto_data_uji_cek.sql`, `..._hapus.sql`). Minta AI menyebut berkas lain yang kurang di awal sesi.
3. Mulai dari blok A sampai H, lalu putuskan soal tes gelar tersisa, lalu penjelasan dampak dan "OK".

### Handoff #7 | 2026-11-19 | (KETUA)

**Berkas tujuan:** `docs/features.md`, tempel paling bawah (setelah Handoff #6). Yang paling akhir menang.

**Tugas:** LNC.01e (hapus data uji order dan reset nomor order). **Selesai dan terbukti** (19 Nov 2026). Silakan dicentang di sheet. Baris induk `LNC.01` tetap **Belum**; `LNC.01f` belum dimulai.

**File yang diubah (semua baru, tidak ada yang lama disentuh):**

- `supabase/templates/20261119_order_data_uji_cek.sql` (blok A sampai H, baca-saja; sudah ter-push, commit `a509136`).
- `supabase/templates/20261119_order_data_uji_hapus.sql` (satu blok `DO` dengan pengaman jumlah, tanpa ID akun).
- `supabase/templates/20261119_order_reset_nomor.sql` (reset `order_nomor_seq`, dengan pengaman tabel kosong).
- `docs/features.md`: blok ini.
- Tidak ada perubahan `public/`, `kedai`, `sw.js`, tabel, hak tabel, pengaturan, atau fungsi SQL. Tidak ada deploy.
- Status commit: belum untuk dua berkas hapus dan reset serta blok ini. Ketiganya masuk satu commit, **tanpa `[skip ci]`** karena menyentuh `supabase/` (`AGENTS.md` blok 12 Nov 2026).

**Keputusan baru:** tidak ada. "OK" ketua diberikan di chat untuk penghapusan dan, terpisah, untuk reset nomor (blok 8 Nov 2026). Mengikuti blok `AGENTS.md` 19 Nov 2026: data uji tidak diekspor CSV; syarat satu-satunya terbukti data uji lewat query baca-saja. Pilihan penulis (alasan belum tercatat dari ketua): nomor urut internal `catatan_order`, `riwayat_status`, dan `inbox` tidak direset (tidak pernah tampil ke pemakai, sama seperti keputusan inbox di Handoff #5). Tes gelar tidak dikerjakan sebelum order dihapus; GLR.07 sudah Selesai di sheet.

**Terbukti (bukti diperiksa di chat, tidak disimpan):**

- Sebelum hapus: `order` 138 (nomor 1 sampai 138, dibuat 8 sampai 18 Nov, **0 sejak 19 Nov**), `order_item` 166, `riwayat_status` 360, `catatan_order` 61, `baca_catatan` 42, `pelanggan_luar` 11, `inbox` 0, `foto_bukti` 0. Lima akun pemesan semuanya customer biasa (bukan staf), profil dibuat 6 dan 18 Nov. Order wakil 23 (cocok antar blok E dan F), dibuat dua owner uji (staf dibuat 6 dan 12 Nov). Blok G (jejak staf asli dan aktivitas sejak 19 Nov): semua 0. Kunci asing (blok B) tidak memuat tabel tak terduga; urutan hapus mengikutinya.
- Selisih dengan Handoff #5: di sana 8 order wakil (hanya yang terkait inbox dan foto); totalnya 23. Tidak bertentangan.
- Sesudah hapus: delapan tabel (`order`, `order_item`, `riwayat_status`, `catatan_order`, `baca_catatan`, `pelanggan_luar`, `inbox`, `foto_bukti`) semuanya 0.
- Sesudah reset: `order_nomor_seq` `last_value = 1`, `is_called = false`. Order sungguhan pertama bernomor **#1**.

**Belum beres:**

- **`LNC.01f` (akun)** belum dimulai (P0, High-Risk, butuh penjelasan dampak dan "OK" ketua). Baris induk `LNC.01` dicentang setelah selesai.
- **Data uji yang masih ada:** `langganan_push` uji; `profil` dan `alamat` customer dummy (lima akun pemesan tadi); isi uji Bantuan (BTN.04, SEC-30); dua baris uji nonaktif di tabel `gelar` (`tingkat-uji-enam`, `tingkat-uji-tujuh`, tidak memengaruhi hitungan, merapikannya butuh "OK" tersendiri); akun dummy di Authentication.
- Tiga akun staf uji rencananya **dinonaktifkan, bukan dihapus**, disebut satu per satu; akun asli tidak boleh ada di daftar (Handoff #1 dan #3, menunggu "OK" ketua). Sebelum menghapus akun di Auth, cek tabel yang merujuk ke akun itu (misalnya `langganan_push.akun`, `foto_bukti.diunggah_oleh`, `belanja.penginput`, `menu.diubah_oleh`).
- Berkas foto di Storage (Handoff #5) dan template hapus inbox INB.06 tahap 2 (belum pernah dijalankan; baru bisa diuji dengan baris asli berumur lebih dari 14 hari) tidak berubah.
- Butir terbuka dari Handoff #1 sampai #6 yang tidak disebut di sini tidak berubah (antara lain Send password recovery enam akun asli, logout Supabase dan GitHub di profil browser ketua).

**Saran giliran berikutnya (LNC.01f):**

1. Sesi baru. Lampirkan `AGENTS.md`, `features.md` (dengan Handoff #7), `security.md`, `database.md`, `akun.md`, `menu.md`, dan migration yang menyentuh `staf`, `profil`, `alamat`, `langganan_push`. AI menyebut berkas lain yang kurang di awal sesi.
2. Mulai dengan query **baca-saja**: semua tabel yang merujuk ke akun (kunci asing ke `profil` dan `staf`), daftar akun uji dan akun asli (ID awal saja), lalu penjelasan dampak dan "OK" ketua.
3. Urutan: data customer dummy dulu (`langganan_push`, `alamat`, `profil`), penonaktifan tiga akun staf uji, baru penghapusan akun dummy di Auth lewat dashboard. Wajib selesai sebelum LNC.04.
4. Sebelum push: tempel `pwd`, `git remote -v`, dan email commit terakhir; baca `git status` dan `git diff --stat` sebelum commit. Commit yang memuat `supabase/` jangan pakai `[skip ci]`.

### Handoff #8 | 2026-11-19 | (KETUA)

**Berkas tujuan:** `docs/features.md`, tempel paling bawah (setelah Handoff #7). Yang paling akhir menang.

**Tugas:** LNC.01f (hapus data uji akun). **Selesai dan terbukti** (19 Nov 2026), dicentang di sheet bersama LNC.01c sampai LNC.01e. Baris induk `LNC.01` sudah dicentang ketua di sheet, **tetapi isi uji Bantuan (BTN.04, SEC-30) belum dibuktikan lewat query di sesi ini** (lihat "Belum beres"). Tidak ada perubahan `public/`, `kedai`, `sw.js`, migration, tabel, hak tabel, pengaturan, atau fungsi SQL. Tidak ada deploy.

**File yang diubah (semua baru, tidak ada yang lama disentuh):**

- `supabase/templates/20261119_akun_data_uji_cek.sql` (blok A sampai F, baca-saja; hasil hanya memuat 8 karakter awal ID, nama staf hanya untuk akun sebelum 19 Nov).
- `supabase/templates/20261119_akun_data_uji_hapus.sql` (Langkah 1 hapus `langganan_push`, `alamat`, `profil`; Langkah 2 nonaktifkan tiga staf uji; Langkah 3 daftar akun Auth untuk dihapus manual; cek akhir). Memuat ID awal tiga akun uji yang kini sudah dihapus; tidak ada ID akun asli.
- `supabase/templates/20261119_menu_pindah_pencatat.sql` (pindah `diubah_oleh` ke satu akun owner asli). **Versi di repo tetap berisi `GANTI_8_KARAKTER_AWAL`**; ID akun asli hanya diketik di SQL Editor dan tidak disimpan.
- `supabase/templates/20261119_staf_uji_hapus.sql` (hapus tuntas tiga baris `staf` uji, dengan pengaman 12 tabel).
- `docs/features.md`: blok ini.
- Status commit: belum untuk keempat template dan blok ini. Semuanya masuk satu commit, **tanpa `[skip ci]`** karena menyentuh `supabase/` (`AGENTS.md` blok 12 Nov 2026).

**Keputusan baru (ketua, 19 Nov 2026; alasan selebihnya belum tercatat):**

- **Pencatat menu dipindah ke akun asli ibu ketua.** `diubah_oleh` di `menu` (38 baris), `grup_pilihan` (7), dan `menu_grup` (20) dipindah dari dua akun owner uji ke satu akun owner asli, karena input menu memang dikerjakan ibu ketua, hanya lewat akun uji. Hanya kolom `diubah_oleh` yang berubah; `diubah_pada` dan isi menu tidak disentuh (tanpa trigger).
- **Tiga akun staf uji dihapus tuntas, bukan dinonaktifkan.** Ini **menimpa** rencana "dinonaktifkan, bukan dihapus" di blok 17 Nov dan Handoff #1, #3, #7. Alasan rencana lama (menjaga jejak `diubah_oleh`) gugur setelah pencatat dipindah dan tidak ada lagi baris yang merujuk ke ketiganya. Urutan wajib: baris `staf` dihapus lebih dulu lewat SQL Editor, baru akun Auth lewat dashboard (Auth menolak selama `staf_id_fkey` masih merujuk).
- Pilihan penulis: tiga `langganan_push` milik staf uji (semuanya nonaktif) ikut dihapus bersama tujuh milik customer dummy.
- Langkah menonaktifkan staf uji dijalankan hanya setelah akun asli ibu ketua terbukti bisa login, supaya pengelolaan menu tidak terputus.
- Mengikuti blok `AGENTS.md` 19 Nov 2026: data uji tidak diekspor CSV; syarat satu-satunya terbukti data uji lewat query baca-saja. Empat akun gmail non-staf dikonfirmasi ketua sebagai kotak uji tim sebelum dihapus. Ketua juga menyatakan belum ada customer asli dan belum ada transaksi asli.

**Terbukti (bukti diperiksa di chat, tidak disimpan):**

- **Sebelum:** `auth.users` 20 (9 staf, 9 profil, 2 tanpa baris), `staf` 9 (3 dibuat sebelum 19 Nov, 6 sejak 19 Nov: 5 owner dan 1 penjaga, semua aktif), `profil` 9, `alamat` 16, `langganan_push` 10 (semuanya nonaktif; 7 milik profil, 3 milik staf uji). Order, inbox, belanja, `pelanggan_luar`, `foto_bukti`, dan tabel turunan order semuanya 0. Tidak ada akun non-staf dibuat atau login sejak 19 Nov. Tidak ada staf asli yang merujuk data lain (semua 0).
- **Jejak menu:** semua `diubah_oleh` hanya dari dua akun owner uji (menu 11 dan 27, `grup_pilihan` 3 dan 4, `menu_grup` 4 dan 16), semuanya staf, tidak ada customer. Peta kunci asing: `menu` dan lima tabel lain merujuk `staf`/`profil`/`auth.users` tanpa `ON DELETE`, sehingga penghapusan akun diblokir selama masih dirujuk. `grup_pilihan.diubah_oleh` dan `menu_grup.diubah_oleh` **tidak punya kunci asing**.
- **Setelah Langkah 1 dan 2:** `profil` 0, `alamat` 0, `langganan_push` 0, `staf` 9 (aktif 6, nonaktif 3), `menu` 38, `grup_pilihan` 7, `menu_grup` 20.
- **Setelah Langkah 3 (11 akun Auth dihapus: 7 berdomain `example.com`, 4 gmail) dan pemindahan pencatat:** ketiga akun uji 0 di tiga tabel, satu akun asli memegang 38, 7, dan 20.
- **Akhir (sesudah hapus tuntas staf uji dan tiga akun Auth):** `auth.users` 6, non-staf 0, `staf` 6 (aktif 6, nonaktif 0), `profil`, `alamat`, `langganan_push` 0, `menu` 38, `grup_pilihan` 7, `menu_grup` 20, dan satu akun asli memegang 38 menu.

**Bahan belajar:**

- Template pindah pencatat versi pertama memuat sintaks `IS DISTINCT FROM ALL (...)` yang tidak valid di Postgres. Galat muncul saat SQL dibaca, sebelum berjalan, jadi tidak ada data yang berubah; diperbaiki menjadi `IS NULL OR NOT IN`. Pelajaran: template SQL baru dicoba dulu sebagai blok yang tidak merusak, dan galat sintaks aman karena tidak menjalankan apa pun.
- Hasil query tanpa nama kolom dan email penuh (hanya ID awal, domain, dan penanda `+`) cukup untuk mencocokkan akun uji dan asli tanpa data pribadi di chat.

**Belum beres:**

- **Isi uji Bantuan (BTN.04, SEC-30):** belum dibuktikan sudah `aktif = tidak` (catatan baris `LNC.01` di sheet). Perlu query baca-saja (cek nama kolom tabel `bantuan` di migration BTN.01 dulu). Baris induk `LNC.01` sudah dicentang; bila ternyata masih aktif, bereskan sebelum LNC.04.
- **Dua baris uji nonaktif di tabel `gelar`** (`tingkat-uji-enam`, `tingkat-uji-tujuh`): tidak memengaruhi hitungan; merapikannya butuh "OK" tersendiri.
- **Akun asli:** empat owner dan satu penjaga belum pernah login; kirim recovery satu per satu saat orangnya siap membuka email (cek Spam, salin link ke tab baru). Hanya akun ibu ketua yang terbukti bisa login.
- Teks catatan baris `LNC.01` di sheet masih menulis "akun staf uji dinonaktifkan, bukan dihapus" dan "akun dummy di Auth dihapus lewat dashboard"; teks sheet tidak diubah, blok ini yang menang.
- Blok catatan pendek di `docs/menu.md` dan `docs/database.md` (pencatat menu kini akun asli; staf uji sudah dihapus) belum ditulis. Opsional; bila tidak ditulis, blok ini cukup sebagai rujukan.
- Butir terbuka Handoff #1 sampai #7 yang tidak disebut di sini tidak berubah (antara lain template hapus inbox INB.06 tahap 2, berkas foto di Storage, logout Supabase dan GitHub di profil browser ketua).

**Saran giliran berikutnya:**

1. Cek isi uji Bantuan (query baca-saja) lalu tandai `aktif = tidak` bila perlu, dengan "OK" ketua.
2. Kirim recovery ke lima akun asli yang belum pernah login; pastikan masing-masing bisa masuk dengan email dan password.
3. Lanjut `LNC.02` (cek kuota dan backup), lalu `LNC.03` (uji coba terbatas, jadwal Senin 23 Nov 2026). Lampirkan `AGENTS.md`, `features.md` (dengan Handoff #8), `security.md`, dan `database.md`.
4. Sebelum push: tempel `pwd`, `git remote -v`, dan email commit terakhir; baca `git status` dan `git diff --stat` sebelum commit. Commit yang memuat `supabase/` jangan pakai `[skip ci]`.

### Handoff #9 | 2026-11-19 | (KETUA)

**Berkas tujuan:** `docs/features.md`, tempel paling bawah (setelah Handoff #8). Yang paling akhir menang.

**Tugas:** penutupan `LNC.01` (cek isi uji Bantuan, sisa dari Handoff #8). **Selesai dan terbukti** (19 Nov 2026). Baris induk `LNC.01` **dicentang ketua di sheet** (Selesai, 19 Nov 2026), bersama `LNC.01c` sampai `LNC.01f`. Pelurusan: Handoff #8 menulis baris induk "sudah dicentang"; faktanya sempat dilepas sampai isi uji Bantuan terbukti, lalu dicentang ulang hari ini. Kondisi akhir: Selesai.

**File yang diubah (semua hanya ditambah, 0 baris lama berubah):**

- Baru: `supabase/templates/20261119_bantuan_data_uji_cek.sql` (satu query baca-saja, kolom `isi` tidak ditampilkan).
- Diubah: `docs/bantuan.md` (satu blok catatan susulan, 8 baris), `docs/features.md` (blok ini).
- Satu commit, **tanpa `[skip ci]`** karena menyentuh `supabase/` (`AGENTS.md` blok 12 Nov 2026). Saat blok ini ditulis commit belum dibuat.
- Tidak ada perubahan `public/`, `kedai`, `sw.js`, migration, tabel, hak tabel, pengaturan, atau fungsi SQL. Tidak ada deploy. Lembar `bantuan-isi` tidak diubah. Cek anti-nyasar sebelum push lolos (folder `CHATA`, remote `kedaichata/kedai-chata`, email noreply akun proyek).

**Keputusan baru (ketua, 19 Nov 2026):**

- **`penjaga-07` (Bantuan) dibiarkan `aktif = ya`**, berdampingan dengan `notif-06`. Ini **menimpa** Handoff #6 di `docs/bantuan.md` ("dinonaktifkan saat pembersihan data") dan **tidak dijadikan butir sheet**. Alasan ketua: tidak dipermasalahkan dan tidak mau menambah butir di sheet. Alasan selebihnya belum tercatat. Isi `notif-06` belum dibandingkan dengan `penjaga-07`. Rincian di blok `docs/bantuan.md` bertanggal sama.

**Terbukti (bukti diperiksa di chat, tidak disimpan):**

- Tabel `bantuan`: total 80 baris, aktif 74, nonaktif 6. Empat baris uji (`uji-baris`, `uji-html`, `uji-kutip`, `uji-nonaktif`) semuanya `aktif = false`. Tidak ada baris aktif lain yang mirip uji (nama, judul, atau isi). `notif-06` aktif, `penjaga-07` aktif (sesuai keputusan di atas).
- Enam baris nonaktif cocok dengan hitungan: empat baris uji ditambah `memesan-10` dan `owner-12` (batas order harian, nonaktif sengaja, `bantuan.md` Handoff #6). Dua baris terakhir tidak ditampilkan satu per satu oleh query.
- Syarat `LNC.01` lain sudah terbukti di Handoff #4, #5, #7, dan #8 (Belanja, inbox dan foto, order dan reset nomor, akun uji).

**Masalah yang belum beres (tidak berubah dari Handoff #8, kecuali yang disebut):**

- Butir "isi uji Bantuan belum dibuktikan" di Handoff #8 **terjawab dan tidak lagi terbuka**.
- Dua baris uji nonaktif di tabel `gelar` (`tingkat-uji-enam`, `tingkat-uji-tujuh`): tidak memengaruhi hitungan; merapikannya butuh "OK" tersendiri.
- Akun asli: empat owner dan satu penjaga belum pernah login; kirim recovery satu per satu saat orangnya siap membuka email (cek Spam, salin link ke tab baru). Hanya akun ibu ketua yang terbukti bisa login.
- Butir terbuka Handoff #1 sampai #8 yang tidak disebut di sini tidak berubah (antara lain template hapus inbox INB.06 tahap 2, berkas foto di Storage, blok catatan opsional di `menu.md` dan `database.md`, logout Supabase dan GitHub di profil browser ketua).

**Saran giliran berikutnya:**

1. Sesi baru `LNC.02` (cek kuota dan backup), lalu `LNC.03` (uji coba terbatas, jadwal Senin 23 Nov 2026). Lampirkan `AGENTS.md`, `features.md` (dengan Handoff #9), `security.md`, dan `database.md`.
2. Sebelum `LNC.03`: kirim recovery ke lima akun asli yang belum pernah login dan pastikan masing-masing bisa masuk.
3. Sebelum push: tempel `pwd`, `git remote -v`, dan email commit terakhir; baca `git status` dan `git diff --stat` dulu. Commit yang memuat `supabase/` jangan pakai `[skip ci]`.

### Handoff #10 | 2026-11-19 | (KETUA)

**Berkas tujuan:** `docs/features.md`, tempel paling bawah (setelah Handoff #9). Kalau versi lama Handoff #10 sudah ditempel, **ganti** dengan ini (bukan tambah #11). Yang paling akhir menang.

**Tugas:** `LNC.02` **dicentang ketua 19 Nov 2026.** Cek kuota selesai (dasarnya data tes). Backup: ekspor 8 tabel berisi terbukti, 13 tabel kosong tercatat, panduan dan jadwal ada. **Uji restore belum dilakukan** (lihat "Masalah yang belum beres"); sesuai keputusan ketua, itu **tidak dimasukkan ke sheet** dan dicatat di sini saja.

**File yang diubah:** tidak ada di repo (`public/`, `kedai`, `sw.js`, migration, tabel, fungsi SQL tidak tersentuh; tidak ada commit atau deploy). Hanya blok ini ke `docs/features.md`. Di luar repo: folder `backup-CHATA` (sejajar `CHATA`), subfolder `20261119`, berisi 8 berkas CSV. Panduan: `Panduan_Ekspor_Data_Rutin.md` (draf v2, menunggu review ketua).

**Keputusan baru (ketua):**

- Semua tabel harus diekspor dan dicatat dengan format lembar (Tgl, No, Nama Tabel, Jml Row di Tabel, Nama File, Catatan). Tabel 0 baris tidak bisa diekspor (dashboard menolak), cukup dicatat.
- Lembar catatan: Google Drive ketua, file **chata**, tab **BackupChata**, dibagikan hanya ke yang mengerjakan ekspor.
- Ekspor data dan cek pemakaian (termasuk Log Query) **seminggu sekali, hari Sabtu**, bersamaan.
- Cara akses login dan siapa yang mengerjakan diatur ketua dan **tidak ditulis di md**.
- Uji beberapa HP bersamaan dipindah ke LNC.03 (diukur dari pemakaian pengguna sendiri lewat halaman usage; tidak memakai password owner). Cek panggilan Kotak masuk juga dipindah ke LNC.03.
- Restore tidak dimasukkan ke sheet (ketua: butir sheet bertambah terus dan bukan blocking; tempat restore belum ada).

**Hasil cek kuota (dashboard, 19 Nov 2026, siklus 5 Nov sampai 5 Des, Free Plan):**

- Edge Function 5.616 / 500.000, database 0,029 / 0,5 GB, egress 0,035 / 5 GB, storage 0 / 1 GB, pengguna aktif 16 / 50.000, Realtime 0.
- **Log Query 165,74 / 100 GB (166%).** Dashboard menyatakan kuota Free Plan belum terlampaui dan batas log belum diberlakukan; jadwal penerapan belum jelas. Lonjakan sekitar 11 sampai 16 Nov (puncak sekitar 56 GB di 13 Nov, perkiraan dari grafik); penyebab belum diketahui. Reset 5 Des. Menghapus log tidak menurunkan angkanya.
- Kesimpulan: cukup di free plan, **berdasarkan data tes dan asumsi** (sekitar 3.000 panggilan per hari, sekitar 18% dari batas; foto sekitar 63 MB dari asumsi 30 foto per hari), bukan data transaksi nyata. Cek ulang setelah LNC.03.
- Project Overview: "Last backup: No backups", sesuai `AGENTS.md` bagian 4.

**Hasil ekspor (19 Nov 2026):**

- Cara: ⋮ pada baris tabel di daftar kiri Table Editor, lalu Export data, lalu Export table as CSV. Satu tabel per ekspor. Nama berkas `<tabel>_rows.csv`. "Delete table" tepat di bawah Export data; "Import data from CSV" ada di menu Insert (jangan disentuh). Via CLI tidak dipakai (`AGENTS.md` bagian 3 dan 8).
- **8 tabel lulus** (jumlah baris cocok dengan "N records"): `pengaturan` 22, `staf` 6, `menu` 38, `menu_grup` 20, `grup_pilihan` 7, `opsi_pilihan` 23, `bantuan` 80, `gelar` 9. `menu` dan `bantuan` perlu hitungan CSV (python `csv`) karena teks berbaris banyak membuat `wc -l` lebih besar dari N.
- **13 tabel kosong, tidak diekspor:** `order`, `order_item`, `riwayat_status`, `catatan_order`, `baca_catatan`, `belanja`, `belanja_item`, `profil`, `alamat`, `pelanggan_luar`, `foto_bukti`, `inbox`, `langganan_push`.
- Cek ini membuktikan jumlah baris, **bukan isi tiap sel**.
- Authentication, Users: 6 akun (5 owner dan 1 penjaga), cocok dengan `staf` = 6. Toolbar halaman itu tidak menampilkan tombol ekspor; email akun hanya hidup di Authentication. Dicatat sebagai risiko, ditinjau lagi setelah customer asli terdaftar.

**Masalah yang belum beres:**

- **Restore backup belum pernah diuji.** Ekspor terbukti utuh, **bisa tidaknya dipulihkan belum terbukti.** Syarat dan risiko (perkiraan, belum diuji):
  - Harus di **project kosong terpisah**, tidak pernah di `kedaichata` (impor CSV ke production berisiko menimpa atau menambah data). Tempat itu **belum ada**. `AGENTS.md` bagian 4 mencatat batas 2 project aktif per organisasi; apakah membuat project kedua boleh belum dibahas di dokumen mana pun, jadi perlu keputusan ketua.
  - CSV hanya isi tabel; project kosong harus diberi skema dari `supabase/` dulu. Prosedur menerapkannya belum ditemukan di dokumen.
  - `staf` merujuk ke ID akun di Authentication; akun baru di project lain bisa punya ID berbeda, sehingga data `staf` hasil impor bisa tidak nyambung.
  - Kesetiaan tipe kolom (tanggal, ID, teks panjang) setelah impor dari CSV belum terbukti.
  - **Usulan** (bukan aturan): uji restore sebelum LNC.04 (buka untuk semua), karena di LNC.03 data masih sedikit dan WA masih jadi cadangan. Keputusan waktunya di ketua.
- Pengingat kalender Sabtu: ketua menyatakan sudah dipasang. Template hapus inbox (INB.06 tahap 2) masih tercatat terbuka di Handoff #9; belum ada kabar beres.
- Blok catatan susulan `AGENTS.md` bagian 4 (hasil cek kuota dan Log Query) **belum dibuat**; butir sheet "Pantau kuota Log Query" **tidak ditambahkan** (pengecekannya sudah masuk jadwal Sabtu di panduan). Menunggu ketua bila blok catatan mau dibuat.
- Status `Panduan_Ekspor_Data_Rutin.md` di Peta Dokumentasi (dokumen resmi atau berkas kerja) belum diputuskan.
- Logout Supabase dan penutupan profil browser terpisah sudah diingatkan; belum dikonfirmasi.
- Butir terbuka Handoff #1 sampai #9 yang tidak disebut di sini tidak berubah (antara lain recovery lima akun asli yang belum pernah login).

**Saran giliran berikutnya:**

1. LNC.03 (Senin 23 Nov): setelah pemakaian nyata beberapa hari, cek halaman usage (Edge Function per hari terhadap sekitar 16.600 per hari, dan panggilan Kotak masuk) dan perbarui kesimpulan kuota dengan data nyata.
2. Sabtu pertama: ekspor rutin sesuai panduan; isi lembar BackupChata; cek tabel yang mulai terisi (bandingkan N records dengan hasil cek).
3. Sebelum LNC.04: rancang uji restore di project kosong (keputusan project kedua, skema dari `supabase/`, pemetaan ID akun staf), dan catat hasilnya sebagai handoff.
4. Cek anti-nyasar sebelum push (`pwd`, `git remote -v`, email commit terakhir), bila ada commit.

### 2026-11-20: Analitik Umami fase 1 masuk versi 1

Keputusan ketua (20 Nov 2026). Sumber: docs/analitik.md. Alasan ketua selain yang tertulis belum tercatat.

- **Urutan versi 1:** fitur ini dikerjakan sebelum LNC.03 bila memungkinkan; tidak menunda LNC.03 (bawaan).
- **Layar per peran:** tidak ada layar atau tombol baru. Layar Masuk, Daftar, Pengenalan, Bantuan, dan Belanja menambah penanda anonim tak terlihat.
- **Kuota:** tidak menambah panggilan Edge Function, database, egress, atau Log Query Supabase (panggilan ke Umami, bukan ke Supabase). Kesimpulan kuota Handoff #10 tidak berubah.
- **Jadwal:** dikejar Jumat sampai Minggu 20 sampai 22 Nov 2026 agar lulus sebelum LNC.03 (Senin 23 Nov); bersaing dengan sisa persiapan LNC.03 di Handoff #9 dan #10 (recovery lima akun asli). Bila tes belum lulus, ditunda dan LNC.03 jalan tanpa fitur ini.
- **LNC.05 (review pemakaian):** tambah bahan: angka kunjungan dan OS dari Umami (termasuk jumlah pengguna iPhone, bahan butir iPhone di `AGENTS.md` bagian 10), dibandingkan jumlah akun customer baru dari Supabase (ANL.08).
