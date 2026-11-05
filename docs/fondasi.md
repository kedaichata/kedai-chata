/docs/fondasi.md

# 🧱 fondasi.md: Repo, Supabase, Terbit Online, PWA Dasar, dan Pagar Anti-Nyasar

> **Versi 1.3 (5 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Perubahan 1.3: flag deploy per fungsi (F12, FND.07), keterangan kunci lama (bagian 6). Perubahan 1.2: kunci Supabase baru, publishable dan secret (F9, FND.03). Perubahan 1.1: pustaka Supabase disimpan sebagai salinan di `public/lib/` (F9); logo dan ikon sementara (F14, FND.08); cache mencakup semua berkas aplikasi (F10). Dokumen fitur pertama; dokumen fitur lain bergantung pada ini.
> **Status:** F1 sampai F13 disepakati ketua (sesi strategi 4 Nov 2026). Butir bertanda **(bawaan)** adalah pilihan penulis yang tidak ditanyakan satu per satu; ketua boleh mengubahnya sebelum dikerjakan. Belum ada yang dikerjakan.
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini saja**. Kerjakan langkah di bagian 5 satu per satu. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 9 bila ada kejadian di lapangan.
> **Berkas yang diminta AI di awal sesi** (sebut nama dan alasan sekaligus, jangan menebak isinya): sesuai langkah yang dikerjakan, yaitu versi terbaru `public/index.html`, `public/config.js`, `public/sw.js`, `public/manifest.json`, `.gitignore`, atau `.github/workflows/pages.yml`.
> **Tanpa kode dan tanpa isi SQL.** Detail yang sudah ditangani GitHub atau Supabase tidak ditulis ulang.
> **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.

---

## 1. Tujuan

Menyiapkan **tempat berdiri** untuk semua fitur lain. Hasil akhir:

1. Repo GitHub (public) milik akun ketua, dengan struktur folder yang benar dan **pagar anti-nyasar** di laptop bersama.
2. Project Supabase cloud (gratis) milik akun ketua, siap dipakai, dengan alat terminal (CLI) terpasang untuk deploy fungsi.
3. Halaman awal "Kedai ChATA" **terbuka online** di alamat GitHub Pages dan otomatis ter-update tiap ada perubahan di repo.
4. Aplikasi bisa **dipasang di layar utama HP** (PWA) dan versi baru muncul setelah update.

Belum ada login atau order. Halaman awal cukup berisi judul dan teks sederhana.

---

## 2. Keputusan

| No  | Keputusan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Dasar                                                                                                                                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F1  | **Satu akun GitHub (milik ketua), satu repo public, tanpa branch.** Satu laptop Mac (milik adik ketua) dipakai bersama, **serial**: satu orang per giliran.                                                                                                                                                                                                                                                                                                                                                       | Keputusan ketua 4 Nov 2026.                                                                                                                                                       |
| F2  | Struktur folder: `public/` (isi aplikasi, termasuk `img/`), `docs/`, `supabase/` (isi `migrations/`, `templates/`, `functions/`), ditambah `.github/workflows/` untuk penerbitan. **Tanpa `archive/`.**                                                                                                                                                                                                                                                                                                           | Pola proyek adik; `archive/` dibuang karena tidak ada fase penilaian md.                                                                                                          |
| F3  | **Terbit lewat GitHub Pages dengan GitHub Actions.** Satu berkas `.github/workflows/pages.yml` menerbitkan folder `public/`; di Settings repo, sumber Pages diatur ke "GitHub Actions".                                                                                                                                                                                                                                                                                                                           | GitHub Pages "dari cabang" hanya bisa root atau `/docs`, bukan `public/`.                                                                                                         |
| F4  | Semua path **relatif** terhadap `public/`, tidak diawali `/`. Nama berkas gambar dan kode: **huruf kecil semua, tanpa spasi**.                                                                                                                                                                                                                                                                                                                                                                                    | Alamat terbit berbentuk `akun.github.io/repo/`; GitHub Pages membedakan huruf besar dan kecil, Mac tidak.                                                                         |
| F5  | **Berkas masuk ke GitHub lewat terminal** (cek `git status`, lalu `git add .`, `commit`, `push`), **dengan pagar anti-nyasar F6**. Kode dari AI tetap **dicopas dari berkas yang dikirim AI**, bukan ditulis langsung di editor.                                                                                                                                                                                                                                                                                  | `AGENTS.md` bagian 2 dan 8.                                                                                                                                                       |
| F6  | **Pagar anti-nyasar (git).** Repo ChATA di folder terpisah dari repo adik. Nama dan **email commit (noreply GitHub milik ketua) diatur khusus di repo ini**, bukan global. Cara masuk GitHub memakai **kunci SSH khusus proyek ini**. Sebelum tiap push cek folder, `git remote -v`, dan email commit; salah satu tidak cocok = jangan push.                                                                                                                                                                      | Laptop sudah login ke akun adik; `AGENTS.md` bagian 8.                                                                                                                            |
| F7  | **Email commit memakai alamat privat bawaan GitHub (noreply)**, bukan email pribadi. Cek `git status` sebelum `git add .` supaya tidak ada berkas rahasia atau `supabase/.temp` yang ikut. **`.gitignore` wajib memuat `supabase/.temp`** dan berkas rahasia lain.                                                                                                                                                                                                                                                | Repo public; `security.md` aturan 7. `supabase/.temp` dibuat CLI dan mencatat project yang terakhir dituju.                                                                       |
| F8  | **Supabase cloud, paket gratis**, dibuat di **akun Supabase ketua** (bukan akun adik), dibuka di **profil browser terpisah atau jendela privat**. **Wilayah server: Singapura** (nama persis dicek di dashboard saat memilih; sulit diubah setelah dibuat).                                                                                                                                                                                                                                                       | `AGENTS.md` bagian 3 dan 8.                                                                                                                                                       |
| F9  | `public/config.js` hanya berisi **URL project, kunci publishable Supabase (`sb_publishable_...`; kunci `anon` lama tidak dipakai), dan kunci publik VAPID** (kunci VAPID masuk di `notifikasi.md`). Kunci **secret** (`sb_secret_...`) tidak pernah masuk `config.js` atau repo; hanya dibaca `kedai` dari variabel lingkungan fungsi. Pustaka Supabase disimpan sebagai **salinan berkas di `public/lib/` dengan versi dipatok** (bukan dimuat dari CDN, bukan "latest"), supaya aplikasi tetap terbuka offline. | `security.md` aturan 7.                                                                                                                                                           |
| F10 | **PWA:** nama aplikasi **"Kedai ChATA"**, nama pendek (di bawah ikon HP) **"ChATA"**. `sw.js` strategi **network first**; hanya menangani berkas aplikasi dari domain sendiri (GET) dan kejadian push; **tidak meng-cache panggilan ke Supabase**. Tiap berkas aplikasi baru (JS, `style.css`, pustaka di `lib/`, ikon) wajib didaftarkan di daftar cache `sw.js`.                                                                                                                                                | `security.md` aturan 11; `AGENTS.md` bagian 7.                                                                                                                                    |
| F11 | Alamat GitHub Pages didaftarkan di URL Auth Supabase (Site URL dan Redirect URLs) **segera setelah alamat online ada**.                                                                                                                                                                                                                                                                                                                                                                                           | Syarat login dan link reset password di versi online (SEC-24).                                                                                                                    |
| F12 | **Deploy Edge Function lewat terminal** dengan urutan aman di `AGENTS.md` bagian 8 (token sementara milik ketua, `--project-ref` dari `config.js`, dilarang `supabase login`/`link`/`projects list`). Perintah: `supabase functions deploy <nama> --use-api --project-ref ...`, ditambah `--no-verify-jwt` **hanya untuk `bersihkan`** (`kedai` memakai pengecekan token bawaan platform; `AGENTS.md` bagian 7).                                                                                                  | Pola proyek adik; `--use-api` supaya tidak butuh Docker. Flag per fungsi: keputusan ketua 5 Nov 2026 (sebelumnya `--no-verify-jwt` untuk semua hanya mengikuti pola proyek adik). |
| F13 | **Satu environment saja: production (bawaan).** SQL disalin ke `supabase/migrations/` dulu, dijalankan manual di SQL Editor. Dilarang: Docker, VPS, self-host, setup lokal Supabase, **migration CLI**. Folder kosong diberi `.gitkeep`. **Rutin membuka aplikasi** (terutama saat libur sekolah/warung tutup) karena project gratis dijeda otomatis bila sekitar 1 minggu tanpa aktivitas.                                                                                                                       | Pola proyek adik; aturan project gratis Supabase.                                                                                                                                 |
| F14 | **Logo asli ChATA ada tetapi berkasnya belum ketemu** (disimpan keluarga). Sementara dipakai **wordmark** (tulisan "Kedai ChATA" bergaya logo dari HTML/CSS, `desain.md` DS5) dan **ikon PWA sementara** (DS6). Langkah PWA **tidak menunggu** berkas logo; bila berkas asli ketemu (disarankan minimal 512 px), cukup menukar berkas di `public/img/` tanpa mengubah kode.                                                                                                                                       | Keputusan ketua 4 Nov 2026 (logo asli belum ketemu).                                                                                                                              |

---

## 3. Prasyarat

Dokumen pertama, jadi tanpa prasyarat dari dokumen lain. Yang disiapkan manusia: akun GitHub dan akun Supabase **milik ketua** (boleh login Supabase lewat GitHub) dengan email ketua, laptop Mac bersama dengan internet, dan komitmen bahwa **email, password, token, dan kunci rahasia tidak ditulis di chat, md, atau repo.**

---

## 4. Yang dibuat

| Komponen                      | Isi                                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repo GitHub                   | Public; `AGENTS.md` di root; `docs/` berisi md; kerangka folder dengan `.gitkeep`; `.gitignore` (F7).                                                                     |
| Pengaturan git di Mac         | Folder terpisah, nama dan email noreply khusus repo, SSH khusus, kebiasaan cek tiga hal sebelum push (F6).                                                                |
| `public/index.html`           | Halaman awal "Kedai ChATA": judul dan teks singkat Bahasa Indonesia; memuat `config.js`, salinan pustaka Supabase (versi dipatok, di `public/lib/`), dan `manifest.json`. |
| `public/config.js`            | URL project dan kunci publishable saja (F9).                                                                                                                              |
| `public/manifest.json`, ikon  | Nama, nama pendek, warna, ikon (F10, F14). Ikon di `public/img/`.                                                                                                         |
| `public/sw.js`                | Service worker network first (F10). Berisiko, butuh "OK" ketua. Penanganan push ditambah di `notifikasi.md`.                                                              |
| `.github/workflows/pages.yml` | Penerbitan folder `public/` (F3). Berisiko, butuh "OK" ketua.                                                                                                             |
| Project Supabase              | Dibuat lewat dashboard; yang dicatat ke repo hanya URL project dan kunci publishable.                                                                                     |
| Supabase CLI di Mac           | Dipakai hanya untuk deploy fungsi dengan urutan aman (F12).                                                                                                               |

**Alur setelah fondasi jadi:** ubah berkas → `git status` → cek tiga hal (F6) → `git add .` → `commit` → `push` → GitHub menerbitkan otomatis (sekitar 1 sampai 2 menit) → buka alamat aplikasi → versi terbaru muncul di HP.

---

## 5. Urutan pekerjaan (untuk TODO sheet, prefix FND)

Satu langkah per giliran. Langkah ⚠️ butuh penjelasan dampak dan "OK" ketua. **Semua langkah dipandu penuh** (AI menyebut buka apa, klik apa, hasil yang benar).

1. **FND.01** Akun GitHub ketua dan repo public, kerangka folder dengan `.gitkeep`, `.gitignore` (F7), `AGENTS.md` dan md di `docs/`.
2. **FND.02 ⚠️** Git di Mac: folder terpisah, nama dan **email noreply GitHub** (dipandu mencarinya di pengaturan GitHub), kunci SSH khusus, cek anti-nyasar (F6), push pertama.
3. **FND.03** Akun Supabase ketua (profil browser terpisah) dan project Singapura. Catat **hanya** URL project dan kunci publishable. Pakai sistem kunci API baru (publishable dan secret), bukan kunci lama `anon`/`service_role`; bila dashboard menampilkan tombol "Create new API keys", buat dulu.
4. **FND.04** `public/index.html`, `public/config.js`, dan salinan pustaka Supabase di `public/lib/` (versi dipatok).
5. **FND.05 ⚠️** `.github/workflows/pages.yml` dan sumber Pages "GitHub Actions". Hasil benar: halaman awal terbuka di alamat GitHub Pages.
6. **FND.06 ⚠️** Daftarkan alamat GitHub Pages di URL Auth Supabase (F11).
7. **FND.07 ⚠️** Pasang atau cek Supabase CLI di Mac, dan latih urutan deploy aman (F12) dengan satu perintah baca-saja. Token tidak ditempel ke chat. Ingat: `kedai` dan `bersihkan` beda flag; uji pertama `kedai` dengan token login asli adalah SEC-33 (`security.md`).
8. **FND.08 ⚠️** PWA: `manifest.json`, ikon sementara (F14; cara membuatnya dipandu AI saat langkahnya tiba), `sw.js` network first. Hasil benar: bisa dipasang di HP, update muncul, berkas aplikasi terbuka offline.
9. **FND.09** Cek repo bersih dari rahasia, data pribadi, dan `supabase/.temp` (SEC-23), termasuk riwayat commit.
10. **FND.10** Catat batas free tier terbaru dari situs resmi Supabase ke catatan susulan `AGENTS.md` bila ada selisih dari bagian 4.

---

## 6. Aturan yang paling sering terlanggar

| Aturan                                                                                                                                            | Akibat bila dilanggar                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Push tanpa cek folder, `git remote -v`, dan email commit                                                                                          | Kode ChATA nyasar ke repo adik, atau email adik/pribadi terlihat di riwayat publik.                         |
| Memakai nama dan email git **global** laptop                                                                                                      | Commit tercatat atas nama adik.                                                                             |
| Menjalankan `supabase login`, `link`, atau `projects list` di Mac bersama                                                                         | Mengacaukan login CLI milik adik; deploy bisa nyasar ke project lain.                                       |
| Deploy tanpa `--project-ref` dari `config.js`                                                                                                     | Fungsi terpasang di project yang salah.                                                                     |
| Menyeragamkan flag deploy: `--no-verify-jwt` ke `kedai`, atau melepasnya dari `bersihkan`                                                         | Ke `kedai`: lapis pertama hilang. Dari `bersihkan`: penjadwal ditolak platform karena rahasianya bukan JWT. |
| `supabase/.temp` ikut ter-push                                                                                                                    | Informasi project ikut ke repo public.                                                                      |
| Membiarkan sesi GitHub/Supabase ketua terbuka di laptop bersama                                                                                   | Orang lain di laptop itu bisa mengubah project.                                                             |
| Path diawali `/` atau nama berkas berhuruf besar/spasi                                                                                            | Gambar dan skrip gagal termuat di versi online, padahal jalan di Mac.                                       |
| Berkas aplikasi di luar `public/`                                                                                                                 | Tidak ikut terbit.                                                                                          |
| `git add .` tanpa `git status` dulu                                                                                                               | Berkas rahasia atau sampah ikut terunggah ke repo public.                                                   |
| Menaruh kunci secret Supabase (`sb_secret_...`), kunci privat VAPID, password, token CLI, email atau nomor pribadi di repo, `config.js`, md, chat | Repo public: kunci bocor; harus diganti di Supabase.                                                        |
| Memakai kunci lama `anon`/`service_role` (kunci panjang berawalan `eyJ`)                                                                          | Supabase sedang menghentikannya (jadwal di `AGENTS.md` bagian 3); aplikasi bisa tiba-tiba berhenti bekerja. |
| Pustaka tanpa versi dipatok, atau dimuat dari CDN (bukan salinan di `lib/`)                                                                       | Aplikasi bisa rusak sendiri saat pustaka diperbarui.                                                        |
| `sw.js` meng-cache panggilan ke Supabase                                                                                                          | Data order bisa tampil usang atau salah.                                                                    |
| Berkas aplikasi baru (JS, CSS, pustaka, ikon) tidak didaftarkan di cache `sw.js`                                                                  | Aplikasi offline bisa setengah rusak tanpa langsung ketahuan.                                               |
| Mengubah `sw.js`, `config.js`, atau `pages.yml` tanpa penjelasan dan "OK"                                                                         | Aplikasi tidak terbit atau HP menyimpan versi rusak.                                                        |
| Memakai Docker, atau migration CLI (misal `supabase db push`)                                                                                     | Dilarang; SQL dijalankan manual di SQL Editor, deploy fungsi pakai `--use-api`.                             |

---

## 7. Dampak dan pembatalan

- **`pages.yml` salah:** aplikasi tidak terbit; tidak ada data hilang. Perbaiki berkasnya, push ulang.
- **`sw.js` salah:** HP bisa menyimpan versi rusak. Network first mengurangi risikonya; perbaiki dan push ulang, versi baru menggantikan setelah dibuka lagi.
- **Salah push ke repo lain:** laporkan segera ke ketua. Bila berisi rahasia, rahasianya **diganti**, bukan sekadar dihapus dari riwayat.
- **Token CLI bocor:** cabut dan buat baru di dashboard Supabase.
- **Kunci secret Supabase bocor:** buat kunci secret baru di dashboard, ganti di fungsi, lalu hapus yang bocor (`security.md` bagian 5).
- **Project salah wilayah:** sulit diubah; paling aman membuat project baru sebelum ada data.
- **Project dijeda otomatis:** buka dashboard Supabase dan lanjutkan (restore). Data tidak hilang selama masih dalam masa pemulihan yang diumumkan Supabase.

---

## 8. Ditunda

- Domain sendiri (alamat bawaan GitHub Pages dipakai dulu).
- Lingkungan uji terpisah (satu environment production dipakai dulu; free tier mengizinkan lebih dari satu project, bisa dipertimbangkan lewat catatan susulan).
- Pemantauan otomatis (cukup rutin membuka aplikasi dan dashboard).

---

## 9. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

### Handoff #1 | 2026-11-05 | [Ketua]

**Tugas selesai:** FND.01, FND.02, FND.03 (tinggal dicentang di sheet).

**File yang diubah:** semuanya baru. Repo `kedaichata/kedai-chata` (public) berisi `AGENTS.md`, 12 md di `docs/`, `.gitignore`, dan empat `.gitkeep` (`public/`, `supabase/functions`, `supabase/migrations`, `supabase/templates`). Push pertama sukses (commit fb4b817); penulis commit `kedaichata` dengan email noreply GitHub. Project Supabase `kedaichata` jadi, status Healthy, wilayah Singapura.

**Keputusan baru:**

- Akun Supabase didaftarkan lewat **Gmail ketua** (bukan login GitHub), di profil Chrome terpisah. Memenuhi F8 (akun milik ketua). Alasan tidak memakai login GitHub: pilihan ketua, mengikuti pola adik.
- Mac bersama sudah punya kunci SSH adik (`id_rsa`). Kunci ChATA dibuat dengan nama berbeda (`id_ed25519_chata`, ber-passphrase) dan diarahkan hanya lewat `core.sshCommand` **lokal** di folder CHATA. `~/.ssh/config` tidak diubah dan tidak boleh diubah tanpa "OK". Jangan pakai `--global`.
- `.gitignore` memuat: `.DS_Store`, `supabase/.temp`, `.env`, `.env.*`, `*.pem`, `*.key`, `*.csv`, `*.xlsx`.
- Form project Supabase: **Enable Data API** dicentang, **Automatically expose new tables** tidak dicentang, **Enable automatic RLS** dicentang. Alasan: sejalan dengan prinsip "tabel tertutup total" (`database.md` bagian 3); dokumen belum menyebut kotak ini secara eksplisit. Bisa diubah lagi di pengaturan project.
- Sistem kunci baru dipakai: kunci publishable (`sb_publishable_...`) sudah dilihat. Kunci secret belum dibuka dan tidak boleh ditempel ke chat.

**Belum beres:**

- URL project Supabase belum dicatat dengan pasti (jangan menebak dari screenshot; ambil lewat tombol **Copy** di dashboard).

**Saran giliran berikutnya:** FND.04 (`public/index.html`, `public/config.js`, salinan pustaka Supabase di `public/lib/` dengan versi dipatok). Butuh URL project dari tombol Copy dan aba-aba "gas". Sebelum push apa pun, cek tiga hal (folder `CHATA`, `git remote -v` ke `kedaichata`, email commit noreply `kedaichata`). Logout GitHub dan Supabase di profil Chrome setelah selesai.

### 2026-11-05: Pustaka Supabase versi 2.119.0

Berkas public/lib/supabase.js adalah salinan @supabase/supabase-js versi 2.119.0 (build UMD, dist/umd/supabase.js). Diunduh manual oleh ketua dari jsDelivr karena sesi AI tidak bisa mengunduh dari npm. Nama berkas sengaja tanpa nomor versi; bila diganti, catat versi barunya di sini. Alasan memilih versi terbaru: permintaan adik ketua (nomor tetap dipatok sesuai F9).

### Handoff #2 | 2026-11-05 | [Ketua]

**Tugas selesai:** FND.04 (sudah dicentang di sheet).

**File yang diubah:** `public/config.js`, `public/index.html`, `public/lib/supabase.js` (baru), dan `docs/fondasi.md` (blok catatan versi pustaka). Sudah di-push ke `main`, commit 1475870. Tiga cek anti-nyasar lolos sebelum push.

**Keputusan baru:**

- `config.js` memakai satu objek global `window.KEDAI_CONFIG` dengan dua isian: `SUPABASE_URL` dan `SUPABASE_PUBLISHABLE_KEY`. Isian VAPID publik nanti ditambah di objek yang sama (notifikasi.md). Alasan nama ini belum tercatat.
- `index.html` punya satu baris status kecil: "Sistem siap." bila config dan pustaka termuat. Dipakai sebagai cek cepat, tidak memanggil server.
- Pustaka Supabase 2.119.0 diunduh manual oleh ketua dari jsDelivr karena sesi AI tidak bisa mengunduh dari npm (detail di catatan 2026-11-05 di atas).

**Belum beres:**

- `manifest.json` belum ada, jadi konsol browser memberi peringatan kecil; selesai di FND.08.
- `lib/supabase.js` dan berkas aplikasi lain belum masuk daftar cache `sw.js`; dikerjakan di FND.08.
- URL project Supabase kini sudah tercatat di `config.js` (menyelesaikan catatan "belum beres" Handoff #1).

**Saran giliran berikutnya:** FND.05 (`.github/workflows/pages.yml` + sumber Pages "GitHub Actions"), butuh "OK" ketua. Jelaskan dampaknya dulu (sudah dibahas di chat sebelumnya, belum disetujui). Sebelum push, cek tiga hal lagi. Logout GitHub dan Supabase di profil Chrome setelah selesai.

### Handoff #3 | 2026-11-05 | [Ketua]

**Tugas selesai:** FND.05, FND.06, FND.07 (tinggal dicentang di sheet).

**File yang diubah:** `.github/workflows/pages.yml` (baru) dan `docs/fondasi.md` (blok Handoff #2 ditempel; judul Handoff #1 jadi `[Ketua]`, kosmetik). Dua commit di `main`: 5d016dd (catatan Handoff #2) dan e675c56 (workflow penerbitan). Tiga cek anti-nyasar lolos sebelum push. Push memakai kunci SSH ChATA.

**Keputusan baru:**

- Alamat aplikasi: https://kedaichata.github.io/kedai-chata/. Sumber Pages diatur ke GitHub Actions; workflow "Terbitkan ke GitHub Pages" berjalan tiap push ke `main` (19 detik, hijau). Halaman awal terbuka dan menampilkan "Sistem siap.".
- Site URL Supabase diganti dari bawaan (localhost:3000) ke alamat di atas, dan alamat yang sama jadi satu-satunya Redirect URL. Dicek dengan refresh: nilai tersimpan (F11).
- Supabase CLI 2.121.0 sudah terpasang di Mac; tidak diupdate (brew upgrade dilarang, tawaran v3.0.0 diabaikan).
- Token CLI `chata-deploy-5nov`: akses Project hanya ke kedaichata, hak Edge Functions = Read-write, semua hak lain None (termasuk Edge Function Secrets), kedaluwarsa 31 Mar 2027. Alasan masa berlaku panjang: keputusan ketua, supaya tidak bikin ulang di versi 2 dan 3. Token disimpan di penyimpanan aman ketua, tidak di Mac. Preset "Full access" sengaja tidak dipakai (membuka database, kunci API, anggota organisasi).
- Latihan baca-saja `supabase functions list --project-ref "$PROJECT_REF"` berhasil (tabel kosong). Token dibersihkan dari Terminal (dicek `[]`). Dashboard Supabase dan GitHub sudah logout.

**Belum beres:**

- `manifest.json` belum ada (peringatan kecil di konsol); `sw.js` dan daftar cache belum ada. Keduanya di FND.08.
- Belum ada fungsi yang di-deploy. Uji pertama `kedai` dengan token login asli tetap SEC-33 (`security.md`).

**Saran giliran berikutnya:** FND.08 (`manifest.json`, ikon sementara per F14, `sw.js` network first). Berisiko, butuh "OK" ketua; jelaskan dampaknya dulu. Daftarkan semua berkas aplikasi (termasuk `lib/supabase.js`) di cache `sw.js`. Lampirkan `AGENTS.md` + `fondasi.md` + versi terbaru `public/index.html` dan `public/config.js`.

### 2026-11-05: Hasil FND.08 (PWA) dan tes update ditunda

**Berkas:** `public/manifest.json`, `public/sw.js`, `public/img/icon-192.png`, `public/img/icon-512.png` (baru); `public/index.html` (ditambah pendaftaran `sw.js`, kode lama tidak diubah). Commit `4b36033` di `main`.

**Rincian:**

- Ikon sementara: huruf "C" emas di lingkaran marun, latar marun sangat gelap sampai ke tepi (F14, DS6). Disempurnakan di DSN.06.
- `manifest.json`: nama "Kedai ChATA", nama pendek "ChATA", warna latar dan bilah atas `#3B0A14`, `start_url` dan `scope` `./`. Tiap ikon didaftarkan untuk `any` dan `maskable`.
- `sw.js`: network first, hanya GET dari domain sendiri, panggilan Supabase tidak disentuh. Nama cache `chata-v1`; naikkan angkanya bila daftar cache berubah. Daftar cache: `./`, `index.html`, `config.js`, `lib/supabase.js`, `manifest.json`, kedua ikon. **`style.css` belum ada; didaftarkan di DSN.01.** Penanganan push menyusul di `notifikasi.md`.
- Hati-hati: bila satu berkas di daftar cache hilang atau salah nama, pemasangan `sw.js` gagal seluruhnya.

**Hasil tes:** dipasang di layar utama HP Android (Brave), terbuka layar penuh, bilah atas marun. Terbuka offline: lulus di Chrome Mac (DevTools, kotak Offline) dan di HP Android (mode pesawat dan Wi-Fi mati). Peringatan DevTools soal screenshot manifest ("Richer PWA Install UI") bersifat opsional dan diabaikan.

**Belum dites:** versi baru muncul di HP setelah update. Dibuktikan di push berikutnya yang menyentuh berkas aplikasi (misalnya DSN.01), bukan lewat perubahan buatan.

### Handoff #4 | 2026-11-05 | [Ketua]

**Tugas selesai:** FND.08 (sudah dicentang di sheet). Rincian dan hasil tes ada di catatan 2026-11-05 tepat di atas.

**File yang diubah:** `public/manifest.json`, `public/sw.js`, `public/img/icon-192.png`, `public/img/icon-512.png` (semua baru); `public/index.html` (ditambah pendaftaran `sw.js`); `docs/fondasi.md` (catatan susulan). Commit `4b36033` (aplikasi) dan `28aeea6` (catatan) di `main`. Tiga cek anti-nyasar lolos sebelum tiap push.

**Keputusan baru:** tidak ada. Hanya penundaan tes "update muncul di HP" ke push berikutnya yang menyentuh berkas aplikasi (tercatat di atas).

**Belum beres:**

- Tes update versi baru muncul di HP belum dilakukan. Butir sheet: "Tes update muncul di HP" (perlu ditambah ke sheet bila belum).
- `style.css` belum ada dan belum masuk cache `sw.js`. Saat DSN.01, daftarkan di `sw.js` dan naikkan nama cache `chata-v1` (butuh "OK" ketua).
- Ikon masih sementara; disempurnakan di DSN.06.

**Saran giliran berikutnya:** FND.09 (P0, bukti wajib): cek repo bersih dari rahasia, data pribadi, dan `supabase/.temp`, termasuk riwayat commit (SEC-23). Lampirkan `AGENTS.md` + `fondasi.md` + `security.md`. Sebelum push apa pun, cek tiga hal (folder `CHATA`, `git remote -v` ke `kedaichata`, email commit noreply `kedaichata`). Logout GitHub dan Supabase di profil browser setelah selesai.

### Handoff #5 | 2026-11-05 | [Ketua]

**Tugas selesai:** FND.09 dan FND.10 (tinggal dicentang di sheet). Dengan ini seluruh urutan FND.01 sampai FND.10 selesai.

**File yang diubah:** tidak ada. Dua tugas ini hanya pemeriksaan baca-saja, jadi tidak ada commit dan tidak ada push. Tiga cek anti-nyasar lolos sebelum pemeriksaan (folder `CHATA`, remote `kedaichata`, email commit noreply `kedaichata`). Satu-satunya perubahan adalah blok catatan ini yang ditempel ke `docs/fondasi.md`.

**Hasil:**

- FND.09 (SEC-23): lulus, repo bersih. Pencarian di berkas dan seluruh riwayat commit tidak menemukan kunci secret, token CLI, kunci lama `eyJ`, kunci privat, pola nomor HP, atau email asli. `supabase/.temp` tidak pernah masuk riwayat. Kata "password" hanya muncul sebagai teks aturan di md dan kode pustaka `supabase.js`. `config.js` hanya memuat URL project dan kunci publishable. Bukti diperiksa di chat dan tidak disimpan.
- FND.10: batas free tier di situs resmi Supabase (dicek 5 Nov 2026) sama dengan `AGENTS.md` bagian 4, jadi tidak ada catatan susulan yang perlu ditambah ke `AGENTS.md`.

**Keputusan baru:** tidak ada.

**Belum beres (bukan utang fondasi, ikut pekerjaan berikutnya):**

- Tes "versi baru muncul di HP setelah update" belum dilakukan; dibuktikan di push berikutnya yang menyentuh berkas aplikasi (misalnya DSN.01). Butir sheet "Tes update muncul di HP" perlu ditambah bila belum ada.
- `style.css` belum ada dan belum masuk cache `sw.js`. Didaftarkan di DSN.01 dan nama cache `chata-v1` dinaikkan (butuh "OK" ketua).
- Ikon masih sementara; disempurnakan di DSN.06.
- Uji pertama `kedai` dengan token login asli (SEC-33) menunggu fungsinya ada.

**Saran giliran berikutnya:** DSN.01 (berisiko, butuh "OK" ketua; jelaskan dampaknya dulu). Warna, font sistem, dan ukuran dasar di `public/style.css`, semua gaya di satu berkas tanpa CDN. Daftarkan `style.css` di cache `sw.js`. Lampirkan `AGENTS.md` + `desain.md` + versi terbaru `public/sw.js` dan `public/index.html`. Sebelum push apa pun, cek tiga hal anti-nyasar. Logout GitHub dan Supabase di profil browser setelah selesai.

### 2026-11-05: Tes update versi baru di HP lulus (bukti dari DSN.01)

Tes "versi baru muncul di HP setelah update", yang ditunda di catatan FND.08 dan Handoff #4, sudah dilakukan lewat push DSN.01 (commit `1f61971`, workflow Pages hijau 40 detik). Yang paling akhir menang: butir ini **tidak lagi "belum dites"**.

**Hasil:**

- Online: aplikasi yang sudah terpasang di layar utama HP Android memuat tampilan baru (latar krem, judul marun) tanpa hapus data peramban dan tanpa pasang ulang.
- Offline (mode pesawat): tampilan tetap sama. `style.css` ikut tersimpan di cache.

**Perubahan terkait:** nama cache di `sw.js` naik dari `chata-v1` ke `chata-v2`, dan `style.css` sudah masuk daftar cache (rincian di `docs/desain.md`, DSN.01). Daftar cache sekarang: `./`, `index.html`, `config.js`, `lib/supabase.js`, `manifest.json`, `style.css`, kedua ikon.

Bukti diperiksa di chat dan tidak disimpan.
