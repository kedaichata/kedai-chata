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
