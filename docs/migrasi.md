/docs/migrasi.md

# Migrasi Hosting dan Domain: Kedai ChATA

Pindah dari GitHub Pages ke Cloudflare (Workers, static assets), memakai domain sendiri, sampai semua yang terikat alamat ikut tersambung. Dibaca di awal sesi MGR. Satu fitur = satu md; tes migrasi memakai baris SEC yang sudah ada (tidak ada dokumen tes baru).

> **Versi 1.0 (20 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Prefix sheet: **MGR**. **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang. Perubahan status dan keputusan baru dari sesi kode dicatat sebagai blok di bagian 10 (append-only), bukan dengan menyunting bagian di atasnya. Tidak ada kode, SQL, atau pengaturan yang diubah saat dokumen ini ditulis.

---

## 1. Latar dan Tujuan

- ChATA dipakai nyata oleh warung dan isinya order makanan (menu, harga, QRIS, persetujuan pembayaran). Ketentuan GitHub Pages (halaman batas penggunaan dan ketentuan produk tambahan GitHub, dibaca 20 Nov 2026; ketentuan produk tambahan versi berlaku 27 Agu 2026) tidak mengizinkan Pages sebagai hosting gratis untuk bisnis online, e-commerce, atau situs yang tujuan utamanya memfasilitasi transaksi komersial atau SaaS komersial. Donasi dan crowdfunding diizinkan. Tidak ada pengecualian untuk skala kecil atau usaha keluarga.
- **Penilaian penulis (bukan keputusan GitHub dan bukan nasihat hukum):** ChATA kemungkinan besar masuk larangan itu, minimal abu-abu yang miring ke sana. Pembayaran di luar aplikasi melemahkan argumen "memfasilitasi transaksi" tetapi tidak menghilangkannya. Yang memutuskan adalah GitHub.
- **Cloudflare:** Self-Serve Subscription Agreement (update 12 Sep 2025) dan Service-Specific Terms bagian Developer Platform (update 28 Sep 2026) tidak memuat larangan pemakaian komersial seperti itu. Dokumentasi Pages (update 25 Agu 2026) menyebut Workers sebagai platform utama Cloudflare dan menyarankan proyek baru dimulai di Workers. **Belum dibaca:** Website Terms of Use dan Domain Registration Agreement Cloudflare.
- **Tujuan:** (1) aplikasi pindah ke hosting yang ketentuannya cocok, (2) alamat final berupa domain sendiri, (3) tidak ada customer yang terganggu.
- **Kondisi saat ini (Handoff #8 dan #9):** belum ada customer asli. Yang perlu memasang ulang PWA hanya HP tim yang sudah memasangnya dari alamat lama. Rencana kecil, tidak ada data pelanggan yang dipindah.
- **Tidak berubah:** Supabase (database, Auth, Storage, Edge Function), kode aplikasi, tema, dan cara kerja order. Aplikasi tetap berkas statis di `public/` dengan path relatif.

## 2. Tabel Keputusan

| No   | Keputusan                                                                                                                                                                                                                                 | Catatan                                                                                                                                                                                                                                                                                                                                           |
| :--- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MG1  | Pindah dari GitHub Pages ke **Cloudflare Workers (static assets)**, bukan Cloudflare Pages.                                                                                                                                               | Keputusan ketua 20 Nov 2026. Alasan: ketentuan GitHub Pages (bagian 1) dan arah Cloudflare ke Workers. Alasan ketua selain itu belum tercatat.                                                                                                                                                                                                    |
| MG2  | Dikejar selesai **sebelum LNC.03 (Senin 23 Nov 2026)**. Bila P0 belum lulus di gerbang keputusan (MGR.19), ketua memutuskan: LNC.03 mundur, atau jalan sementara di alamat lama.                                                          | Bawaan; ketua boleh mengubah. Jalan di alamat lama berarti GitHub Pages hidup lebih lama (lihat MG9).                                                                                                                                                                                                                                             |
| MG3  | Beli **domain sendiri** lewat **Cloudflare Registrar**.                                                                                                                                                                                   | Bawaan; ketua boleh mengubah. Alasan: custom domain di Workers hanya untuk domain yang nameserver-nya dikelola Cloudflare. Domain dari tempat lain berarti nameserver harus dipindah ke Cloudflare (langkah tambahan). Ini B24 di `bonus.md` yang naik ke versi 1.                                                                                |
| MG4  | Nama domain dan akhirannya (TLD): **belum ditentukan, ketua memilih.**                                                                                                                                                                    | Kriteria usulan: pendek, mudah dieja dan diketik ibu-ibu, mudah dikenali dari tautan WA. Cek ketersediaan, harga tahun pertama **dan harga perpanjangan** sebelum membeli, dan cek akhiran yang diinginkan memang dijual di Cloudflare. Harga tidak dicatat di sini (belum dicek).                                                                |
| MG5  | Akun Cloudflare: **milik ketua, akun yang sama dengan Turnstile.** Tidak membuat akun baru.                                                                                                                                               | Dibuka di profil browser terpisah (`AGENTS.md` bagian 8), logout setelah selesai. Aktifkan 2FA; kode pemulihan disimpan ketua di tempat aman, bukan di chat, repo, atau md. Apakah 2FA sudah aktif: belum dicek (MGR.01).                                                                                                                         |
| MG6  | Penerbitan lewat **Workers Builds dari dashboard** (hubungkan repo GitHub). **Tidak memasang `wrangler` atau CLI lain di Mac.**                                                                                                           | Selaras `AGENTS.md` bagian 3 (CLI hanya deploy fungsi Supabase). Build berjalan di sisi Cloudflare. Repo tidak mendapat `package.json`, npm, atau dependensi; hanya satu berkas konfigurasi `wrangler.jsonc` di akar repo. "OK" ketua untuk tafsir ini terhadap aturan "tanpa build tool, tanpa npm": belum tercatat, diminta saat berkas dibuat. |
| MG7  | Menambah `wrangler.jsonc`, menyambungkan Workers Builds, dan menghentikan `pages.yml` adalah **perubahan berisiko** (penerbitan).                                                                                                         | Wajib penjelasan dampak dan "OK" ketua (`AGENTS.md` bagian 2 butir 5 dan bagian 7). `pages.yml` **tidak dihapus** tanpa perintah eksplisit (aturan 2 butir 2); menonaktifkannya lewat tab Actions tidak menghapus berkas.                                                                                                                         |
| MG8  | **Bertahap dan aditif.** Alamat baru ditambahkan di samping alamat lama (Redirect URLs Auth, hostname Turnstile). Alamat lama dihapus belakangan. **Titik pindah resmi = mengganti Site URL Auth.**                                       | Sebelum titik itu, mundur cukup dengan tidak mengganti Site URL.                                                                                                                                                                                                                                                                                  |
| MG9  | **GitHub Pages dimatikan** setelah alamat baru lulus tes (MGR.23), tidak dibiarkan hidup sebagai cadangan lama-lama.                                                                                                                      | Bila dibiarkan, situs tetap berada di bawah ketentuan yang bermasalah. Batas: paling lambat sebelum LNC.04. Mundur sesudahnya lewat rollback di Cloudflare (Workers punya fitur rollback), bukan menghidupkan lagi GitHub Pages.                                                                                                                  |
| MG10 | Cloudflare hanya menyajikan berkas statis. **Tidak ada Worker script, Functions, penyimpanan, atau rahasia aplikasi di Cloudflare.**                                                                                                      | Data pelanggan dan semua rahasia tetap di Supabase (`AGENTS.md` bagian 7). Penagihan: permintaan berkas statis di Workers gratis (panduan migrasi Cloudflare, 12 Nov 2026); batas lain dicek di MGR.02.                                                                                                                                           |
| MG11 | Tes migrasi **tanpa membuat order.**                                                                                                                                                                                                      | Order tes = data uji baru yang harus dibersihkan (penjelasan dampak dan "OK") dan nomor order perlu direset lagi (blok 8 Nov di `features.md`). Pakai akun customer asli ketua (sheet SEC-50) untuk tes login dan layar. Layar Daftar cukup dibuka (widget muncul), tidak dikirim.                                                                |
| MG12 | **Recovery password akun asli yang belum login dikirim setelah Site URL final** (MGR.21).                                                                                                                                                 | Handoff #8 dan #9: recovery belum dikirim. Link recovery dari dashboard diduga mengikuti Site URL (dibuktikan di MGR.21). Bila dikirim sebelum pindah, linknya menuju alamat lama dan perlu dikirim ulang. Link yang sudah dipakai atau habis tidak bisa dipakai lagi.                                                                            |
| MG13 | **Pengingat rutin baru:** tanggal jatuh tempo domain (ingatkan satu bulan sebelumnya), auto-renew tetap aktif, kartu pembayaran valid.                                                                                                    | Masuk pengingat rutin `AGENTS.md` bagian 4. Domain kedaluwarsa = aplikasi tidak bisa dibuka dan tautan di WA mati.                                                                                                                                                                                                                                |
| MG14 | Hanya **satu alamat resmi** (domain sendiri). Alamat bawaan Cloudflare (`workers.dev`) hanya untuk uji awal, lalu dinonaktifkan bila dashboard menyediakannya. Preview build cabang lain dimatikan; hanya cabang `main` yang diterbitkan. | Tiap alamat tambahan wajib didaftarkan di Auth, Turnstile, dan pembatas asal permintaan `kedai` (bila ada). Menonaktifkan = mengubah konfigurasi, butuh "OK". Cloudflare boleh mengganti subdomain `workers.dev` dan `pages.dev` dengan pemberitahuan minimal satu minggu; tidak berlaku untuk domain sendiri.                                    |
| MG15 | **Analitik ikut pindah:** domain situs di Umami dan penyaring alamat di `analitik.js` (bila ada) diganti ke alamat baru.                                                                                                                  | Baris SEC-51 di sheet menyebut alamat selain GitHub Pages tidak terhitung. Tanpa perubahan ini kunjungan di alamat baru tidak tercatat, tanpa pesan galat. Isi `analitik.js` belum dibaca di sesi strategi.                                                                                                                                       |

## 3. Alur dan Urutan Pekerjaan (untuk TODO sheet)

Satu langkah per giliran, tampilan dashboard diminta lewat screenshot (`AGENTS.md` bagian 9). Ringkasan baris sheet ada di `migrasi-sheet.tsv`.

**Fase A. Siapkan (tidak mengubah apa pun yang sedang jalan)**
MGR.01 cek akun Cloudflare ketua, 2FA, metode bayar. MGR.02 baca batas Static Assets dan Workers Builds. MGR.03 pilih nama domain dan akhiran. MGR.04 beli domain. MGR.05 pengingat kalender domain. MGR.06 inventaris tempat yang menyebut alamat lama.

**Fase B. Bangun paralel (aplikasi lama tetap jalan)**
MGR.07 tambah `wrangler.jsonc`. MGR.08 hubungkan repo ke Workers Builds. MGR.09 deploy pertama dan cek di alamat bawaan. MGR.10 pasang domain sendiri.

**Fase C. Daftarkan alamat baru, secara aditif**
MGR.11 Auth Redirect URLs dan hostname Turnstile. MGR.12 Umami dan `analitik.js`. MGR.13 pembatas asal permintaan `kedai`. MGR.14 cek `manifest.json`, `sw.js`, `config.js`.

**Fase D. Tes di alamat baru (tanpa order)**
MGR.15 login tiga peran dan layar Daftar. MGR.16 ulang SEC-33. MGR.17 ulang SEC-51. MGR.18 PWA di Android dan notifikasi.

**Fase E. Pindah resmi**
MGR.19 gerbang keputusan. MGR.20 ganti Site URL dan `WA_URL_APLIKASI`. MGR.21 tes link reset (SEC-50), lalu kirim recovery akun asli. MGR.22 hapus alamat lama dari Auth dan Turnstile. MGR.23 matikan GitHub Pages dan putuskan nasib `pages.yml`.

**Fase F. Rapikan**
MGR.24 dokumen, isi Pengenalan, Bantuan, dan panduan pasang. MGR.25 umumkan alamat resmi ke tim dan catat tanggal pindah.

**Usulan jadwal (bawaan; ketua boleh mengubah):**

| Hari          | Pekerjaan                                                                                                                                                             |
| :------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Jumat 20 Nov  | Fase A. Domain dibeli bila namanya sudah ketemu.                                                                                                                      |
| Sabtu 21 Nov  | Fase B dan C. Hari ini juga ada ekspor rutin, cek pemakaian, dan pembahasan strategi uji coba terbatas (`features.md` dan Handoff #10); ketua menentukan mana duluan. |
| Minggu 22 Nov | Fase D, gerbang MGR.19, lalu MGR.20 sampai MGR.22.                                                                                                                    |
| Senin 23 Nov  | MGR.23 bila tes stabil, MGR.24 dan MGR.25, lalu LNC.03 di alamat baru. Bila gerbang tidak lulus: lihat MG2.                                                           |

## 4. Tempat yang Terikat ke Alamat

| Tempat                                                    | Yang diubah                                                             | Kapan          | Bila terlewat                                                        |
| :-------------------------------------------------------- | :---------------------------------------------------------------------- | :------------- | :------------------------------------------------------------------- |
| Auth Supabase, Redirect URLs                              | Tambah alamat baru; hapus alamat lama belakangan                        | MGR.11, MGR.22 | Login dan reset password gagal                                       |
| Auth Supabase, Site URL                                   | Ganti ke alamat baru (titik pindah resmi)                               | MGR.20         | Link reset dan email Auth menuju alamat lama                         |
| Widget Turnstile, daftar hostname                         | Tambah alamat baru; hapus alamat lama belakangan                        | MGR.11, MGR.22 | Daftar dan Masuk ditolak di alamat baru                              |
| Umami, domain situs                                       | Ganti ke alamat baru                                                    | MGR.12         | Kunjungan tidak tercatat                                             |
| `analitik.js`, penyaring alamat (bila ada)                | Ganti ke alamat baru                                                    | MGR.12         | Sama; SEC-51 tidak lulus                                             |
| `kedai`, pembatas asal permintaan/CORS (bila ada)         | Tambah alamat baru, deploy sesuai urutan `AGENTS.md` bagian 8           | MGR.13         | Semua aksi gagal dari alamat baru (SEC-33)                           |
| Variabel fungsi `kedai`: `WA_URL_APLIKASI`                | Ganti ke alamat baru                                                    | MGR.20         | Tautan di notifikasi WA menuju alamat lama                           |
| `manifest.json`, `sw.js`, `config.js`                     | Cek apakah ada yang terikat alamat lama atau subfolder; ubah bila perlu | MGR.14         | PWA tidak bisa dipasang, atau cache salah                            |
| Klik notifikasi push (`sw.js` dan teks push dari `kedai`) | Cek apakah alamat tertulis penuh                                        | MGR.14         | Notifikasi membuka alamat lama                                       |
| Template email Auth (bila pernah diubah)                  | Cek apakah ada alamat tertulis                                          | MGR.11         | Link di email salah                                                  |
| Isi Pengenalan, lembar Bantuan, panduan pasang (lewat WA) | Ganti alamat lama                                                       | MGR.24         | Customer diarahkan ke alamat lama                                    |
| GitHub: Pages di pengaturan repo dan workflow `pages.yml` | Matikan Pages, nonaktifkan workflow                                     | MGR.23         | Situs lama tetap hidup; push berikutnya memunculkan galat penerbitan |
| `AGENTS.md` bagian 3 dan 7, `features.md`, `bonus.md`     | Blok catatan susulan (append-only)                                      | MGR.24         | Dokumen menyesatkan sesi berikutnya                                  |

## 5. Aturan yang Paling Sering Terlanggar

1. **Jangan ganti Site URL sebelum alamat baru lulus tes** (MGR.15 sampai MGR.17). Site URL adalah titik pindah.
2. **Tambah alamat baru dulu, hapus alamat lama belakangan.** Jangan ditukar dalam satu langkah.
3. **Recovery akun asli dikirim setelah Site URL final**, bukan sebelumnya (MG12).
4. **Jangan membuat order untuk tes** (MG11). Data uji baru berarti bersih-bersih lagi dan reset nomor order lagi.
5. **Jangan menebak tampilan dashboard Cloudflare, Supabase, atau GitHub.** Minta screenshot. Jangan mengarang nama menu atau isian build dan deploy; ambil dari dokumentasi Workers Builds dan screenshot.
6. **Token, kode pemulihan 2FA, dan data pendaftar domain tidak masuk chat, repo, atau md.**
7. **Jangan biarkan dua hosting hidup lama.** GitHub Pages dimatikan di MGR.23 (MG9).
8. **Cek anti-nyasar sebelum setiap push** (folder, `git remote -v`, email commit milik ketua). Commit yang memuat `wrangler.jsonc` **tanpa `[skip ci]`**. Dashboard Cloudflare dan GitHub milik ketua dibuka di profil browser terpisah, lalu logout.
9. **Jangan menyentuh pengecekan akses fungsi** (`kedai` dengan token login, `bersihkan` dengan rahasia penjadwal). Satu-satunya perubahan di `kedai` yang direncanakan hanya daftar asal permintaan, bila memang ada (MGR.13).
10. **Berkas login dan `sw.js`:** perubahan apa pun tetap butuh penjelasan dampak dan "OK" ketua, termasuk bila hanya mengganti alamat.

## 6. Tes dan Bukti

- Memakai baris SEC yang sudah ada; tidak ada baris SEC baru. **SEC-33** (login dan CORS dari alamat asli) diulang di MGR.16. **SEC-51** (event hanya nama layar, tanpa data pribadi) diulang di MGR.17 dari alamat baru. **SEC-50** (link reset tidak membawa bagian `#` atau `?` ke Umami) diulang di MGR.21 karena link reset hanya jatuh ke alamat baru setelah Site URL pindah.
- **Bukti diperiksa bersama di chat saat sesi tes lalu tidak disimpan** (`AGENTS.md` bagian 10 butir 2). Screenshot disamarkan (email dan data pelanggan). Tanpa bukti jangan diberi lulus dan jangan dicentang di sheet.
- Hanya akun customer asli ketua dan tiga akun staf asli yang dipakai. Tidak ada akun dummy baru.
- **Tes PWA (MGR.18):** pasang dari alamat baru di Android, buka tanpa internet, versi baru muncul setelah update (network first). Catatan dari dokumentasi Cloudflare: saat deploy, halaman versi lama dan berkas versi baru bisa sempat tercampur sebentar; perhatikan saat tes bila ada berkas yang gagal dimuat tepat setelah deploy. Langganan push terikat alamat, jadi tiap HP perlu mengaktifkan notifikasi lagi di alamat baru.
- Kategori: tes pindah dan login adalah High-Risk (P0). Pengingat kalender dan dokumen Low-Risk.

## 7. Berkas yang Dibutuhkan di Sesi Kode

Disebut di awal sesi supaya tidak ditebak (aturan 4). Tiap sesi hanya melampirkan yang relevan.

- Selalu: `AGENTS.md`, `migrasi.md`, `security.md`.
- MGR.06 dan MGR.14: `public/config.js`, `public/manifest.json`, `public/sw.js`, `public/index.html`, `public/analitik.js`, `pengenalan-isi.js`, dan keluaran pencarian alamat lama di repo.
- MGR.07 dan MGR.23: `.github/workflows/pages.yml`, `fondasi.md`.
- MGR.11, MGR.20, MGR.21: `akun.md` (AKN.09, reset password), `features.md` (Handoff #8 dan #9 untuk recovery), screenshot pengaturan URL Auth Supabase dan widget Turnstile.
- MGR.12 dan MGR.17: `analitik.md`, `public/analitik.js`, screenshot Umami.
- MGR.13: `supabase/functions/kedai/index.ts` (bagian yang menangani asal permintaan atau header CORS). **Bila berkas tidak ditempel, jangan ditebak apakah pembatas itu ada.**
- MGR.20: `wa-notif.md`, `notifikasi.md`, daftar variabel fungsi `kedai` (nama saja, bukan nilai).

## 8. Belum Diketahui (jangan ditebak, cek di sesi kerja)

- Nama domain, akhiran yang tersedia di Cloudflare, harga tahun pertama dan perpanjangan.
- Batas Static Assets (jumlah dan ukuran berkas) dan batas Workers Builds (jumlah build per bulan di paket gratis). Halamannya belum dibaca (MGR.02).
- Apakah 2FA di akun Cloudflare ketua sudah aktif, dan metode bayar apa yang dipakai.
- Isian build dan deploy di Workers Builds untuk situs tanpa build, serta apakah pengaturan _build watch paths_ cukup untuk mencegah build dari commit yang hanya mengubah docs. Apakah `[skip ci]` dihormati Workers Builds belum dicek. Aturan `[skip ci]` 12 Nov di `AGENTS.md` ditulis untuk GitHub Actions.
- Apakah `kedai` punya daftar asal permintaan yang diizinkan, dan isi penyaring alamat di `analitik.js`.
- Apakah `manifest.json` memakai `start_url`, `scope`, atau `id` yang terikat subfolder GitHub Pages, dan apakah `sw.js` menulis alamat penuh untuk klik notifikasi.
- Apakah link recovery dari dashboard Supabase benar-benar mengikuti Site URL (dugaan; dibuktikan di MGR.21).
- Apakah template email Auth pernah diubah.
- Apakah dashboard menyediakan cara menonaktifkan alamat `workers.dev` dan preview build, dan namanya.

## 9. Ditunda

Belum diputuskan; kandidat dicatat di `bonus.md`.

- Header keamanan lewat berkas `_headers` (disebut sekilas di Handoff #2, belum dicek).
- Aturan WAF atau rate limit Cloudflare di depan aplikasi (terkait B21 dan B26).
- Analitik web bawaan Cloudflare (Umami sudah dipakai, ANL).
- Email dengan alamat domain sendiri.
- Pengalihan otomatis dari alamat lama ke alamat baru (butuh GitHub Pages tetap hidup, bertentangan dengan MG9).
- **Payment gateway (B6):** ketentuan Cloudflare melarang memproses atau mengumpulkan data kartu kredit pribadi atau bisnis di situs yang memakai layanan gratis. Periksa ulang ketentuan sebelum B6 dikerjakan. Alur sekarang (bayar di luar aplikasi, QRIS berupa gambar) tidak bersinggungan.
- Pembelian domain tambahan, subdomain khusus (misalnya untuk uji), dan pindah region Supabase: tidak direncanakan.

## 10. Catatan Susulan (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini bila ada keputusan baru atau kejadian di lapangan. Format: `### YYYY-MM-DD: topik`. Yang paling akhir menang. Aturan lengkap: `AGENTS.md` bagian 2, aturan 7.

---

_(belum ada blok)_

### 2026-11-20: Domain `kedaichata.biz.id` dibeli di BOC, nameserver dipindah ke Cloudflare

Keputusan ketua (sesi kode MGR, 20 Nov 2026). Alasan: `.my.id` tidak dijual di Cloudflare Registrar (layar "TLD is not supported"), jadi domain dibeli di tempat lain. Ketua memilih `.biz.id` (syarat di BOC: perorangan, organisasi, atau UMKM). Helipod digugurkan (akun dihapus ketua). Alasan lain belum tercatat.

- **Domain:** `kedaichata.biz.id`, dibeli di BOC, auto-renew On, jatuh tempo 20 Nov 2027. Status Active di BOC dan di Cloudflare (paket Free). Harga tahun pertama dan perpanjangan BOC: belum tercatat.
- **Nameserver:** diganti di panel BOC ke dua nameserver Cloudflare (butir baru MGR.04a, selesai 20 Nov 2026). Record DNS di Cloudflare kosong (0 record); tidak ada record yang dibuat manual.
- **Pertentangan dengan teks lama:** MG3 ("beli lewat Cloudflare Registrar") dan MG4 ("cek harga di Cloudflare") tidak berlaku untuk pembelian ini. MG13: jatuh tempo dan auto-renew kini dicek di BOC. Yang paling akhir menang.
- **Akun Cloudflare (MGR.01):** 2FA aktif lewat email (bukan aplikasi autentikator). Metode bayar tidak dicek karena domain dibeli di BOC dan Workers gratis untuk kebutuhan ini.
- **Batas gratis Cloudflare (MGR.02, dokumentasi resmi, dibaca 20 Nov 2026):** Static Assets 20.000 berkas per versi dan 25 MiB per berkas; Workers Builds 3.000 menit build per bulan, 1 build bersamaan, batas waktu build 20 menit. Isi `public/` saat ini 94 item, sekitar 3,4 MB. **Belum dicek:** apakah permintaan berkas statis ikut terhitung di batas 100.000 permintaan per hari paket gratis Workers.
- **Data pendaftar domain:** tidak dicatat di chat atau md (bagian 7). Pengaturan privasi WHOIS di BOC: belum tercatat.

### Handoff #1 | 2026-11-20 | [KETUA]

- **Tugas:** Fase A migrasi (MGR.01 sampai MGR.05) dan MGR.04a (nameserver ke Cloudflare). Dicentang ketua di sheet: MGR.01 sampai MGR.05 dan MGR.04a.
- **File yang diubah:** tidak ada. Repo, `public/`, Supabase, dan GitHub Pages tidak disentuh.
- **Keputusan baru:** lihat blok domain di atas.
- **Belum beres:** (1) MGR.06 belum dijalankan; perintah `grep -rn "github.io"` di repo belum dieksekusi, hasilnya jadi daftar kerja MGR.11 sampai MGR.14 dan MGR.24. (2) Logout Cloudflare dan BOC di profil browser terpisah (syarat MGR.01). (3) Pastikan pengingat kalender 20 Okt 2027 benar-benar terpasang (MGR.05) dan harga perpanjangan BOC dicatat. (4) Hal 100.000 permintaan per hari belum dicek.
- **Saran giliran berikutnya:** jalankan MGR.06 dan tempel hasilnya. Lalu MGR.07 (`wrangler.jsonc`, perubahan berisiko: butuh penjelasan dampak dan "OK" ketua, cek anti-nyasar sebelum push, commit tanpa `[skip ci]`). Lampirkan `AGENTS.md`, `migrasi.md`, `security.md`, dan untuk MGR.07 juga `.github/workflows/pages.yml` dan `fondasi.md`.

### 2026-11-20: Hasil MGR.06, inventaris alamat GitHub Pages lama

Kejadian di lapangan (sesi kode MGR, 20 Nov 2026). Sumber: hasil `grep -rn "github.io"` di repo, tanpa `.git` dan `node_modules`. Tidak ada berkas yang diubah.

- **`public/index.html` baris 2385:** atribut `data-domains` Umami berisi alamat lama. Bila tidak diganti, kunjungan dari alamat baru tidak tercatat tanpa pesan galat (MG15). Dikerjakan di MGR.12. Mengubah `index.html` termasuk kategori login: butuh konfirmasi ketua.
- **`supabase/functions/kedai/index.ts` baris 130:** `ASAL_DIIZINKAN` berisi satu alamat, yaitu alamat lama. Jadi `kedai` **punya** pembatas asal permintaan. Ini menjawab butir bagian 8 ("apakah `kedai` punya daftar asal"). Dikerjakan di MGR.13: alamat baru ditambah di samping yang lama, deploy sesuai `AGENTS.md` bagian 8, butuh "OK" ketua.
- **`docs/`:** `fondasi.md` (baris 34 dan 191), `akun.md` (429 dan 446), `analitik.md` (156), `notifikasi.md` (468), dan `migrasi.md` (170) menyebut alamat lama sebagai riwayat atau catatan. Tidak disunting; ditangani lewat blok catatan susulan di MGR.24.
- **Tidak muncul di hasil pencarian:** `sw.js`, `manifest.json`, `config.js`, `analitik.js`, `pengenalan-isi.js`. Ini belum membuktikan aman: pencarian tidak menangkap path subfolder repo atau alamat dalam bentuk lain. Isinya tetap dibaca di MGR.12 dan MGR.14.
- **Di luar repo (tidak terjangkau pencarian):** Auth Supabase (Site URL, Redirect URLs, template email), widget Turnstile, dashboard Umami, variabel `WA_URL_APLIKASI`, lembar Bantuan, dan panduan pasang di WA. Sudah punya butir sendiri (MGR.11, MGR.12, MGR.20, MGR.24).
- **Catatan hasil pencarian:** keluaran dipotong 200 karakter per baris, jadi konteks baris `fondasi.md:34` tidak terlihat.

### 2026-11-20: MGR.07 selesai, `wrangler.jsonc` ditambah, nama Worker `kedai-chata`

Keputusan ketua (sesi kode MGR, 20 Nov 2026). Sumber: MG6, MG7. Alasan ketua selain yang tertulis di bawah belum tercatat.

- **"OK" ketua tercatat** untuk tafsir `wrangler.jsonc` terhadap aturan "tanpa build tool, tanpa npm" (build berjalan di sisi Cloudflare; repo tanpa `package.json`, npm, atau dependensi). Ini menggantikan "OK belum tercatat" di MG6. Yang paling akhir menang.
- **Nama Worker: `kedai-chata`**, sama dengan nama repo (usulan, disetujui ketua). Apakah nama di berkas harus sama dengan nama di dashboard Cloudflare: belum dicek, dicek di MGR.08 dari dokumentasi Workers Builds.
- **Isi `wrangler.jsonc`** (akar repo): `name`, `compatibility_date` 2026-11-20, dan `assets.directory` ke `./public`. Tanpa `main` (tanpa skrip Worker, MG10).
- **Penerbitan:** commit `e723b40` (memuat juga blok MGR.06), tanpa `[skip ci]`. Tiga cek anti-nyasar lolos sebelum push. Workflow "Terbitkan ke GitHub Pages" #160 hijau (23 detik). `pages.yml` tidak disentuh dan GitHub Pages tetap hidup (MG9).
- **Belum tersambung:** Cloudflare belum dihubungkan ke repo, jadi berkas ini belum dipakai (MGR.08).
- MGR.07 dicentang ketua di sheet.

### Handoff #2 | 2026-11-20 | [KETUA]

- **Tugas:** MGR.06 (inventaris alamat lama) dan MGR.07 (`wrangler.jsonc`). Keduanya sudah dicentang ketua di sheet.
- **File yang diubah:** `wrangler.jsonc` (baru, akar repo) dan `docs/migrasi.md` (blok catatan). Commit `e723b40` sudah di-push; workflow Pages #160 hijau (23 detik). `pages.yml`, `public/`, dan Supabase tidak disentuh.
- **Keputusan baru:** "OK" ketua untuk tafsir `wrangler.jsonc` terhadap "tanpa build tool, tanpa npm" (MG6), dan nama Worker `kedai-chata`. Rinciannya ada di blok MGR.07 di atas.
- **Belum beres:**
  1. Blok "MGR.07 selesai" dan handoff ini **belum di-commit dan belum di-push** (ditempel setelah push). Ikutkan di commit berikutnya.
  2. Dari Handoff #1, belum ada kabar: logout Cloudflare dan BOC di profil browser terpisah; pengingat kalender 20 Okt 2027 terpasang dan harga perpanjangan BOC dicatat; hal batas 100.000 permintaan per hari untuk Workers belum dicek.
  3. Nama Worker harus cocok dengan nama di dashboard Cloudflare atau tidak: belum dicek (MGR.08).
  4. Temuan MGR.06 menunggu dikerjakan: `data-domains` di `index.html` (MGR.12) dan `ASAL_DIIZINKAN` di `kedai/index.ts` (MGR.13).
- **Saran giliran berikutnya:** MGR.08 (P0 High-Risk, hubungkan repo ke Workers Builds lewat dashboard). Lampirkan `AGENTS.md`, `migrasi.md`, `security.md`. Buka dashboard Cloudflare dan GitHub ketua di profil browser terpisah, logout setelah selesai. Baca dokumentasi Workers Builds dulu dan minta screenshot tiap layar; jangan menebak nama menu atau isian build dan deploy. Beri akses hanya ke repo ChATA, hanya cabang `main` yang diterbitkan, preview build dimatikan. Apakah `[skip ci]` dihormati Workers Builds belum dicek. Sebelum push apa pun, cek tiga hal anti-nyasar.

### 2026-11-20: MGR.08 selesai, repo tersambung ke Workers Builds

Kejadian di lapangan (sesi kode MGR, 20 Nov 2026). Sumber: MG6, MG7, MG14. "OK" ketua untuk penyambungan: belum tercatat.

- **Tersambung:** Worker `kedai-chata` ke repo `kedaichata/kedai-chata`. App GitHub "Cloudflare Workers and Pages" dipasang dengan akses hanya ke repo itu (izin read dan write untuk code, checks, deployments, pull requests; paket standar app, tidak bisa diubah dari layar instalasi).
- **Pengaturan:** production branch `main`, build command kosong, deploy command `npx wrangler deploy`, root `/`, tanpa variabel atau rahasia. **Preview builds mati** (diverifikasi di tab Previews Base). Watch paths: Include `*`, Exclude `docs/*` dan `AGENTS.md`.
- **Deploy pertama:** build #aa1d3acf sukses (29 detik), 92 berkas, alamat uji `https://kedai-chata.kedaichata.workers.dev`. Token build "kedai-chata build token" dibuat otomatis oleh Cloudflare; tidak disimpan di mana pun.
- **Peringatan di log, belum dikerjakan:** `workers_dev` dan **Preview URLs** aktif otomatis karena `wrangler.jsonc` tidak menyebutnya. Preview URLs sedikit bertentangan dengan MG14; mematikannya berarti menambah `preview_urls = false` di `wrangler.jsonc` (perubahan berisiko, butuh penjelasan dan "OK" ketua). `workers_dev` dinonaktifkan nanti setelah domain sendiri jalan.
- **Belum terbukti:** apakah commit yang hanya mengubah docs benar-benar tidak memicu build (diuji saat commit docs berikutnya). Apakah `[skip ci]` dihormati Workers Builds: belum dicek; jangan diandalkan.
- **Pertentangan dengan catatan lama:** hanya satu. Bagian 8 baris "Isian build dan deploy di Workers Builds" kini terjawab. Yang paling akhir menang.
- MGR.08 dicentang ketua di sheet.

### Handoff #3 | 2026-11-20 | [KETUA]

- **Tugas:** MGR.08 (hubungkan repo ke Workers Builds) dan MGR.09 (deploy pertama dan cek di alamat `workers.dev`). Keduanya sudah dicentang ketua di sheet.
- **File yang diubah:** `docs/migrasi.md` saja (blok MGR.07, blok MGR.08, Handoff #2), commit `b548a3d` dengan `[skip ci]`, sudah di-push. `public/`, `wrangler.jsonc`, `pages.yml`, dan Supabase tidak disentuh.
- **Hasil yang terbukti:**
  1. Build pertama sukses (#aa1d3acf, 92 berkas). Alamat uji `https://kedai-chata.kedaichata.workers.dev` terbuka di jendela privat: layar Masuk, tampilan, dan Pengenalan normal, tanpa galat berkas.
  2. Commit docs `b548a3d` tidak memicu build di Cloudflare (watch paths Exclude `docs/*` dan `AGENTS.md` bekerja) maupun workflow GitHub Pages (`[skip ci]` dihormati; tetap 160 run).
  3. Preview builds mati (dicek di tab Previews Base). Token build terbaca normal ("kedai-chata build token"); tulisan "unavailable" sempat muncul hanya sebagai kekhasan tampilan.
- **Keputusan baru:** tidak ada di luar blok MGR.07 dan MGR.08.
- **Belum beres:**
  1. **MGR.10 belum dikerjakan:** menunggu "OK" ketua untuk Custom Domain `kedaichata.biz.id`. Jalurnya: Cloudflare, proyek `kedai-chata`, Settings, Domains & Routes, Add, Custom Domain.
  2. **Preview URLs aktif otomatis** (peringatan di log build). Mematikannya berarti menambah `preview_urls = false` di `wrangler.jsonc` (perubahan berisiko, butuh penjelasan dan "OK"). `workers_dev` dimatikan setelah domain sendiri jalan (MG14).
  3. **Widget Turnstile gagal dan terus mengulang** di alamat `workers.dev` (galat 400 ke `challenges.cloudflare.com`, pesan ramah muncul di layar). Dugaan: hostname belum didaftarkan di widget (belum terbukti). Setelah MGR.11 galat itu harus berhenti; bila tidak, selidiki di MGR.15.
  4. Domain yang ditambah lewat dashboard (bukan `wrangler.jsonc`): belum diketahui apakah deploy berikutnya membiarkannya utuh. Cek tab Domains setelah build berikutnya yang menyentuh `public/` atau `wrangler.jsonc`.
  5. Batas 100.000 permintaan per hari: panel menunjukkan 0 / 100.000, tetapi apakah permintaan berkas statis ikut terhitung belum terbukti.
  6. Dua entri "Manually deployed" di Deployments (`cf209e0a`, `ea9fc4c0`): diduga dibuat alur Create application; belum terbukti.
  7. Dari MGR.06, masih menunggu: `data-domains` di `index.html` (MGR.12), `ASAL_DIIZINKAN` di `kedai/index.ts` (MGR.13), dan cek `sw.js`, `manifest.json`, `config.js` (MGR.14).
- **Saran giliran berikutnya:** MGR.10 (P0). Lampirkan `AGENTS.md`, `migrasi.md`, `security.md`. Buka dashboard Cloudflare ketua di profil browser terpisah, logout setelah selesai. Jelaskan dampak, tunggu "OK" ketua, minta screenshot sebelum klik konfirmasi. Domain yang diketik hanya `kedaichata.biz.id`, tanpa `www`. Jangan ganti Site URL dan jangan bagikan alamat baru sebelum MGR.11 sampai MGR.19 selesai. Untuk MGR.11, siapkan `akun.md`, `features.md`, dan screenshot URL Auth Supabase dan widget Turnstile.

### Handoff #4 | 2026-11-20 | [KETUA]

- **Tugas:** MGR.10 (pasang domain sendiri) dan MGR.11 (daftarkan alamat baru di Turnstile dan Auth). MGR.10 sudah dicentang ketua; MGR.11 siap dicentang.
- **File yang diubah:** tidak ada. Repo, `public/`, `wrangler.jsonc`, `pages.yml`, dan kode Supabase tidak disentuh. Yang berubah hanya pengaturan di dashboard: Custom Domain di Cloudflare, hostname widget Turnstile, dan Redirect URLs Auth Supabase.
- **Hasil yang terbukti:**
  1. `kedaichata.biz.id` terpasang di Worker `kedai-chata` (tab Domains, tipe Production). Layar Masuk dan Pengenalan terbuka normal di jendela privat.
  2. Hostname `kedaichata.biz.id` ditambah ke widget Turnstile "Kedai ChATA" (kini 2 dari 10, `kedaichata.github.io` utuh). Widget menampilkan "Berhasil!" dan POST 400 ke `challenges.cloudflare.com` berhenti. Dugaan Handoff #3 poin 3 terbukti.
  3. Redirect URLs Auth: `https://kedaichata.biz.id/` ditambah (Total 2, entri lama utuh). **Site URL tidak diganti.**
  4. Template email Auth: hanya Reset password yang dipakai dan dicek (bawaan, memakai `{{ .ConfirmationURL }}`, tanpa alamat tertulis). Confirm signup tidak terkirim; Invite user belum pernah dipakai dan tidak diperiksa.
- **Keputusan baru:**
  1. "OK" ketua untuk MGR.10, domain akar saja tanpa `www`. `www.kedaichata.biz.id` tidak punya DNS, jadi tidak terbuka. Butir baru untuk sheet: "Alihkan www ke domain utama", dikerjakan setelah MGR.20.
  2. `kedai-chata.kedaichata.workers.dev` sengaja tidak didaftarkan di Turnstile (MG14); galat widget di sana dibiarkan.
  3. Format entri Redirect URLs mengikuti yang lama: `https://kedaichata.biz.id/` (dengan garis miring, tanpa wildcard).
- **Pertentangan dengan catatan lama:** jalur "Settings, Domains & Routes" di Handoff #3 sudah usang. Di dashboard sekarang jalurnya tab **Domains**, tombol **Add Domain** (Subdomain dikosongkan untuk domain akar). Yang paling akhir menang.
- **Belum beres:**
  1. **MGR.12:** `data-domains` di `public/index.html` baris 2385 masih alamat lama; `analitik.js` belum dibaca; domain situs di dashboard Umami belum diganti. Menyentuh `index.html` (kategori login): butuh penjelasan dampak dan "OK" ketua. Usulan: **tambah** alamat baru di samping yang lama (MG8), format `data-domains` dicek dari berkas aslinya.
  2. **MGR.13:** `ASAL_DIIZINKAN` di `kedai/index.ts` baris 130 masih hanya alamat lama. **Selama ini belum diubah, Masuk dan semua aksi `kedai` dari `kedaichata.biz.id` diduga gagal (CORS).** Karena itu jangan tes Masuk atau Daftar di alamat baru dulu.
  3. MGR.14 (cek `manifest.json`, `sw.js`, `config.js`, teks klik push) belum dikerjakan.
  4. Preview URLs aktif (toggle Preview di tab Domains menyala). Mematikannya lewat `preview_urls = false` di `wrangler.jsonc` atau toggle itu: perubahan berisiko, butuh "OK". Toggle `workers.dev` dimatikan setelah domain sendiri lulus tes (MG14).
  5. Belum terbukti: domain yang ditambah lewat dashboard tetap utuh setelah deploy berikutnya yang menyentuh `public/` atau `wrangler.jsonc`; permintaan berkas statis ikut terhitung di batas 100.000 per hari; asal dua entri "Manually deployed".
  6. Galat CSP (`connect-src 'self'` memblokir `data:,`), "No available adapters", dan "OTS parsing error WOFF" di console berasal dari skrip tantangan Cloudflare (`normal?lang=id:1`), dugaan tidak berbahaya karena widget berhasil. Belum diselidiki asal CSP-nya; bila widget gagal di HP tertentu, dicek di MGR.15.
  7. Alamat `kedaichata.biz.id` belum dibagikan ke siapa pun; tetap begitu sampai MGR.19.
- **Saran giliran berikutnya:** MGR.12, lalu MGR.13 (keduanya butuh "OK" ketua dan commit tanpa `[skip ci]`, cek anti-nyasar sebelum push). Lampirkan `AGENTS.md`, `migrasi.md`, `security.md`, `analitik.md`, `public/analitik.js`, bagian `public/index.html` sekitar baris 2385, `supabase/functions/kedai/index.ts` (bagian `ASAL_DIIZINKAN`), dan screenshot pengaturan website Umami tanpa data kunjungan nyata. Deploy `kedai` mengikuti urutan `AGENTS.md` bagian 8.
