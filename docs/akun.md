/docs/akun.md

# 👤 akun.md: Daftar, Login, Tiga Peran, Profil, Buku Alamat, Password

> **Versi 1.3 (5 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Perubahan 1.3: `kedai` di-deploy tanpa `--no-verify-jwt` dan diuji dengan login asli di SEC-33 (AK10, AK16, AKN.04, AKN.05). Perubahan 1.2: kunci publishable (AK1), menu Akun memuat Bantuan dan hak lihat Bantuan di tabel bagian 4 (`bantuan.md`). Perubahan 1.1: kalimat "email aktif" di layar Daftar, petunjuk isi alamat, penjaga bisa lebih dari 2, hak koreksi dan ganti foto di tabel bagian 4. Bergantung pada `fondasi.md` (repo, project Supabase, terbit online, CLI).
> **Status:** AK1 sampai AK18 disepakati ketua (sesi strategi 4 Nov 2026). Butir bertanda **(bawaan)** adalah pilihan penulis yang tidak ditanyakan satu per satu (sebagian mengikuti pola proyek adik); ketua boleh mengubahnya sebelum dikerjakan. Belum ada yang dikerjakan.
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini saja** (tambah `database.md` bila menyentuh tabel atau fungsi). Kerjakan langkah di bagian 5. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 9.
> **Berkas yang diminta AI di awal sesi** (sebut nama dan alasan sekaligus, jangan menebak isinya): `public/index.html` dan `public/config.js`, berkas migration terbaru di `supabase/migrations/`, `supabase/functions/kedai/` bila sudah ada, dan berkas JS akun bila sudah ada.
> **Tanpa kode dan tanpa isi SQL.** Detail yang sudah ditangani Supabase Auth (penyimpanan password, token, sesi, format email) tidak ditulis ulang.
> **Fitur ini High-Risk (P0):** login, peran, dan data pelanggan (nomor WA, alamat). Tes teliti dan wajib ada bukti (`AGENTS.md` bagian 10).
> **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.

---

## 1. Tujuan

Tiga jenis pengguna bisa **masuk dan dikenali server** dengan perannya masing-masing:

- **Customer** (±100): daftar sendiri, mengisi profil (nama, nomor WA, alamat), mengelola buku alamat, mengganti password.
- **Owner** (5, setara) dan **penjaga** (2 atau lebih, setara; tim akhir pekan orang yang berbeda): **dibuatkan ketua**; tidak ada jalur dari aplikasi untuk menjadi staf.

Fitur ini prasyarat semua fitur lain: tanpa pengguna dan peran yang dikenali server, tidak ada order yang aman.

---

## 2. Keputusan

| No   | Keputusan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Dasar                                                                                                                     |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| AK1  | **Daftar dan login** email + password lewat **Supabase Auth**, dipanggil dari aplikasi dengan kunci publishable (`sb_publishable_...`). Tidak ada tabel akun buatan sendiri. Email hanya ada di Supabase Auth, tidak disalin ke tabel aplikasi.                                                                                                                                                                                                                                                                                                                                                               | `AGENTS.md` bagian 3; pola proyek adik.                                                                                   |
| AK2  | **Tanpa verifikasi email** ("Confirm email" dimatikan). **Email asal-asalan diterima** (batasan diterima: pelanggan dengan email asal-asalan tidak bisa mereset password lewat link, lihat AK12). Layar Daftar memuat satu kalimat: "Pakai email yang aktif, dipakai bila lupa password."                                                                                                                                                                                                                                                                                                                     | Keputusan ketua 4 Nov 2026. Berisiko (login), butuh "OK" ketua.                                                           |
| AK3  | **Aturan password:** hanya huruf dan angka, minimal 8 karakter, tanpa syarat kerumitan lain. Panjang minimal juga diatur di Supabase Auth; aturan "hanya huruf dan angka" **hanya dicek di aplikasi**. **(bawaan)**                                                                                                                                                                                                                                                                                                                                                                                           | Mengikuti proyek adik; yang memanggil Supabase langsung bisa membuat password bersimbol, dampaknya hanya ke akun sendiri. |
| AK4  | **Tiga peran.** Peran ditentukan **server**: bila akun punya baris di tabel `staf` maka perannya **owner** atau **penjaga**, bila tidak maka **customer**. Aplikasi tidak pernah mengirim peran. Hak tiap peran ada di bagian 4.                                                                                                                                                                                                                                                                                                                                                                              | Keputusan ketua; `security.md` aturan 2.                                                                                  |
| AK5  | **Akun staf dibuat ketua**, bukan mendaftar sendiri. Prosedur di bagian 4 (dashboard Supabase + satu SQL kecil). Tabel `staf` **hanya bisa diubah dari SQL Editor oleh ketua**; `service_role` hanya boleh membaca. Staf yang berhenti **dinonaktifkan**, akunnya tidak dihapus.                                                                                                                                                                                                                                                                                                                              | Keputusan ketua; `AGENTS.md` bagian 7.                                                                                    |
| AK6  | **Pendaftaran customer:** layar Daftar (email, password), langsung masuk, lalu layar **Lengkapi profil**: **nama tampilan**, **nomor WA (wajib)**, dan **satu alamat (wajib)**. Server membuat profil dan alamat pertama dalam satu langkah atomik. Akun yang belum punya profil (aplikasi ditutup di tengah jalan) melihat layar Lengkapi profil lagi setelah masuk.                                                                                                                                                                                                                                         | Keputusan ketua: nomor WA wajib supaya owner bisa follow up; alamat minimal 1 saat daftar.                                |
| AK7  | **Nama tampilan:** 3 sampai 20 karakter, huruf, angka, spasi, garis bawah; boleh sama antar pengguna; bisa diganti. Ditampilkan lewat `textContent`.                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Pola proyek adik; SEC-18.                                                                                                 |
| AK8  | **Nomor WA:** wajib, hanya angka (boleh diawali +62, 62, atau 08), panjang wajar; disimpan dalam bentuk seragam. **Tidak diverifikasi** (batasan diterima, seperti email asal-asalan). Customer bisa menggantinya. Layar Daftar memuat satu kalimat: nomor dipakai warung untuk menghubungi soal pesanan. **Nomor WA adalah data pribadi**: ada di database, **tidak boleh masuk repo, md, atau chat**.                                                                                                                                                                                                       | Keputusan ketua; `security.md` aturan 7 dan 18.                                                                           |
| AK9  | **Buku alamat:** tiap alamat punya **alias** (3 sampai 30 karakter, misal "Sekolah anak 1", "Rumah") dan **isi alamat** (10 sampai 200 karakter). **Minimal 1 dan maksimal 5 alamat aktif** (batas di `pengaturan`: `alamat_maks`). Bisa tambah, ubah, dan **nonaktifkan** (tanpa hapus). Alamat nonaktif tidak muncul di pilihan; order lama tetap menyimpan **salinan** alamatnya. Alamat adalah data pribadi (aturan sama dengan nomor WA). Isian alamat memuat **petunjuk**: untuk antar ke sekolah tulis nama sekolah, kelas, dan nama anak (contoh: "SD X, kelas 3B, a.n. Budi"); tanpa kolom tambahan. | Keputusan ketua: kebanyakan ibu punya 1 sampai 3 anak di sekolah berbeda.                                                 |
| AK10 | **Identitas dan peran selalu dari token login di server.** Fungsi server memverifikasi token sendiri paling awal (lapis kedua setelah pengecekan token bawaan platform); tanpa token atau token tidak valid dibalas 401. Aplikasi tidak pernah mengirim ID, peran, atau nomor orang lain.                                                                                                                                                                                                                                                                                                                     | `security.md` aturan 2 dan 3.                                                                                             |
| AK11 | **Ganti password** (pengguna yang sudah masuk): isi **password lama** dan password baru; aplikasi login ulang dengan password lama dulu, baru mengganti. Aturan password baru sama dengan AK3. Berlaku untuk semua peran. **(bawaan)**                                                                                                                                                                                                                                                                                                                                                                        | Mengikuti proyek adik; login ulang supaya tidak memicu verifikasi email.                                                  |
| AK12 | **Lupa password lewat link email.** Tim memakai **Gmail khusus proyek** sebagai SMTP di Supabase (verifikasi 2 langkah aktif; app password hanya diketik di dashboard, tidak di chat, md, repo, atau WA). Pengguna menghubungi tim (customer: lewat owner/WA), **ketua menekan "Send password recovery" dari dashboard**, pengguna membuat password baru lewat layar **Buat password baru**. Aplikasi tidak punya tombol kirim email. **Customer dengan email asal-asalan tidak menerima link**: solusinya daftar ulang dengan email lain (riwayat order lama tetap di akun lama). **(bawaan)**               | Mengikuti proyek adik (blok `security.md` 2 Nov 2026 di sana); email bawaan Supabase hanya 2 per jam, tidak cukup.        |
| AK13 | Ada tombol **Keluar**. Sesi login dikelola Supabase.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Kebutuhan dasar akun.                                                                                                     |
| AK14 | **Pesan galat aman**, Bahasa Indonesia ("Email atau password salah", "Gagal memuat", "Password minimal 8 karakter, hanya huruf dan angka", "Nomor WA tidak valid"). Galat mentah tidak ditampilkan; semua teks lewat `textContent`.                                                                                                                                                                                                                                                                                                                                                                           | `security.md` aturan 9 dan 10.                                                                                            |
| AK15 | Tabel `pengaturan` dibuat **di sini**, dengan baris awal `alamat_maks` (5). Fitur lain hanya **menambah** baris, tanpa mengubah yang ada.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `database.md` bagian 4.                                                                                                   |
| AK16 | Fungsi server utama bernama **`kedai`** (satu fungsi, banyak aksi). Akun memakai aksi `status`, `daftar_profil`, `ganti_nama`, `ganti_wa`, `alamat_simpan`, `alamat_nonaktif`. Di-deploy dengan urutan aman `AGENTS.md` bagian 8, **tanpa `--no-verify-jwt`** (pengecekan token bawaan platform jadi lapis pertama), ditambah pengecekan token sendiri (AK10) sebagai lapis kedua. Uji pertama dengan login asli: SEC-33 (`security.md`).                                                                                                                                                                     | `database.md` bagian 5; `fondasi.md` F12.                                                                                 |
| AK17 | Tanpa rate limit khusus selain bawaan Supabase. Email, nomor WA, dan alamat satu pengguna **tidak tampil ke customer lain**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `security.md` bagian 2.                                                                                                   |
| AK18 | Akun uji memakai **email dummy, nomor WA dummy yang jelas palsu, dan alamat dummy**. Bukti tes (screenshot) tidak boleh memuat data pelanggan nyata.                                                                                                                                                                                                                                                                                                                                                                                                                                                          | `AGENTS.md` bagian 2 butir 11 dan bagian 10.                                                                              |

---

## 3. Prasyarat

Dari `fondasi.md`: repo dan terbit online jalan (FND.05), project Supabase dibuat (FND.03), alamat GitHub Pages terdaftar di URL Auth (FND.06), `config.js` berisi URL dan kunci publishable, CLI siap dengan urutan deploy aman (FND.07).

---

## 4. Yang dibuat

**Alur pengguna:**

1. **Customer baru:** layar Daftar (email, password) → langsung masuk → layar **Lengkapi profil** (nama, WA, alamat pertama) → server membuat profil → layar utama customer.
2. **Customer lama:** layar Masuk → aplikasi memanggil `status` → layar utama sesuai peran.
3. **Staf:** layar Masuk (akun dibuatkan ketua) → `status` mengembalikan peran owner atau penjaga → layar utama sesuai peran. Staf tidak melewati layar Lengkapi profil.
4. **Menu akun:** Ganti nama, Ganti nomor WA (customer), Buku alamat (customer), Ganti password, **Bantuan** (`bantuan.md`), Keluar. Untuk owner, Akun dan Bantuan ada di menu Lainnya (`desain.md` DS10, DS15).
5. **Lupa password:** tautan di layar Masuk menampilkan petunjuk menghubungi tim (AK12), tanpa nomor atau email di repo.

**Hak tiap peran (acuan semua dokumen; server yang memaksa):**

| Aksi                                                          | Customer                   | Owner               | Penjaga                                 |
| ------------------------------------------------------------- | -------------------------- | ------------------- | --------------------------------------- |
| Lihat menu                                                    | ✔ (yang aktif)             | ✔                   | ✔                                       |
| Kelola menu                                                   | –                          | ✔                   | –                                       |
| Buat order sendiri                                            | ✔                          | –                   | –                                       |
| Buat order untuk pelanggan tanpa akun                         | –                          | ✔                   | –                                       |
| Lihat order                                                   | hanya miliknya             | semua               | status Disetujui ke atas                |
| Batalkan order                                                | miliknya, saat Menunggu    | –                   | –                                       |
| Setujui / Tolak                                               | –                          | ✔                   | –                                       |
| Koreksi metode bayar (sebelum Selesai)                        | –                          | ✔                   | –                                       |
| Ubah status pengerjaan (Diproses dst) dan mundur satu langkah | –                          | ✔ **(bawaan)**      | ✔                                       |
| Tambah catatan                                                | miliknya, sebelum Diproses | ✔, sebelum Diproses | – (hanya membaca)                       |
| Unggah dan ganti foto bukti (ganti: pengunggah)               | –                          | ✔                   | ✔                                       |
| Lihat foto bukti                                              | order miliknya             | ✔                   | ✔                                       |
| Kelola Pelanggan tanpa akun                                   | –                          | ✔                   | – (hanya melihat di order)              |
| Lihat nomor WA dan alamat pemesan                             | miliknya sendiri           | ✔                   | ✔ pada order yang terlihat **(bawaan)** |
| Aktifkan notifikasi push                                      | ✔                          | ✔                   | ✔                                       |
| Lihat Bantuan (isi sesuai peran, `bantuan.md`)                | ✔                          | ✔                   | ✔                                       |

**Prosedur ketua membuat akun staf (dipandu AI, satu langkah per giliran, ⚠️ butuh "OK"):**

1. Dashboard Supabase (akun ketua, profil browser terpisah) → **Authentication → Users → Add user**. Isi **email asli staf** dan **password acak sementara** (diketik langsung di dashboard, tidak dicatat di mana pun), pilih konfirmasi otomatis (nama persis opsi dicek di dashboard).
2. Tekan **Send password recovery** untuk akun itu. Staf menerima link dan **membuat password sendiri**. Tidak ada password sementara yang dikirim lewat WA atau chat.
3. Salin **ID akun** dari daftar Users. Jalankan SQL dari `supabase/templates/` (tambah staf) di **SQL Editor**, mengisi ID, nama tampilan, dan peran **di dashboard saja** (ID, nama, dan email nyata tidak disimpan di repo).
4. Cek dengan query baca-saja, lalu staf masuk dan layarnya sesuai peran.
5. Staf yang berhenti: jalankan SQL template nonaktifkan staf. Akun tidak dihapus.

Satu orang yang juga customer memakai **dua akun berbeda** (email berbeda), satu staf dan satu customer.

**Komponen:**

| Komponen                                       | Isi                                                                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Pengaturan Auth di dashboard                   | "Confirm email" mati; panjang minimal password 8; cek "Secure password change"; SMTP Gmail tim (AK12); Site URL dan Redirect URLs.   |
| Tabel `pengaturan`, `profil`, `alamat`, `staf` | Skema di `database.md`. RLS aktif tanpa policy; hak `service_role` minimal, tanpa DELETE.                                            |
| Fungsi SQL pembuat profil                      | Atomik: buat profil dan alamat pertama bersama, tolak bila sudah ada. Pola keamanan fungsi sesuai `AGENTS.md` bagian 7.              |
| Edge Function `kedai`                          | Versi pertama: aksi akun (AK16), hanya untuk pengguna yang login.                                                                    |
| Berkas JS dan CSS akun                         | Layar Daftar, Masuk, Lengkapi profil, Buat password baru, menu akun, buku alamat. Satu berkas kecil per fitur (di bawah ~500 baris). |
| `supabase/templates/`                          | SQL "tambah staf" dan "nonaktifkan staf" (tanpa data nyata).                                                                         |

---

## 5. Urutan pekerjaan (untuk TODO sheet, prefix AKN)

Langkah ⚠️ butuh penjelasan dampak dan "OK" ketua.

1. **AKN.01 ⚠️** Pengaturan Auth di dashboard (AK2, AK3). Cek juga "Secure password change".
2. **AKN.02 ⚠️** SMTP Gmail tim di dashboard (AK12): Gmail khusus proyek, verifikasi 2 langkah, app password hanya di dashboard; cek batas email per jam dan Site URL/Redirect URLs.
3. **AKN.03 ⚠️** Migration: tabel `pengaturan` (baris `alamat_maks`), `profil`, `alamat`, `staf`, hak, RLS, fungsi pembuat profil. SQL disalin ke `supabase/migrations/` dulu, baru dijalankan. Tiap tabel baru: cabut semua hak `service_role` lalu beri ulang yang perlu, cek dengan query baca-saja.
4. **AKN.04 ⚠️** Edge Function `kedai` versi pertama (aksi akun), satu berkas utuh per langkah, cek token sendiri paling awal, deploy dengan urutan aman **tanpa `--no-verify-jwt`** (`AGENTS.md` bagian 7 dan 8).
5. **AKN.05** Layar Daftar, Masuk, Keluar. Layar Daftar memuat kalimat email aktif (AK2). **Setelahnya jalankan SEC-33** (uji pertama `kedai` dengan login asli, `security.md`) sebelum lanjut ke AKN.06; bila gagal, ikuti rencana mundur di `security.md` aturan 3.
6. **AKN.06** Layar Lengkapi profil (nama, WA, alamat pertama) dengan kalimat penjelasan nomor WA.
7. **AKN.07** Buku alamat: tambah, ubah, nonaktifkan, batas 5, dengan petunjuk isi alamat (AK9).
8. **AKN.08** Menu akun: ganti nama, ganti nomor WA, ganti password (login ulang password lama).
9. **AKN.09** Layar Buat password baru dari link reset, dan tautan "Lupa password?" dengan petunjuk.
10. **AKN.10 ⚠️** SQL template tambah/nonaktifkan staf dan prosedur ketua; buat akun 1 owner dan 1 penjaga uji, lalu akun staf asli saat peluncuran.
11. **AKN.11** Sesi tes akun (dokumen `akun-test.md` dibuat di sesi tes): 1 akun per peran + 1 customer kedua, bukti wajib.

---

## 6. Aturan yang paling sering terlanggar

| Aturan                                                                         | Akibat bila dilanggar                                                            |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Mengaktifkan kembali "Confirm email"                                           | Pendaftaran macet: email verifikasi tidak terkirim ke customer biasa.            |
| Memercayai peran, ID, atau nomor dari kiriman aplikasi                         | Customer bisa menyamar jadi owner atau melihat data orang lain (SEC-06, SEC-09). |
| Membuat jalur "daftar sebagai owner" di aplikasi                               | Siapa pun bisa menyetujui order dan melihat data pelanggan.                      |
| Menyimpan email atau password di tabel aplikasi                                | Data pribadi bocor; password sudah dikelola Supabase.                            |
| Menulis nomor WA, alamat, atau email nyata di repo, md, chat, screenshot bukti | Repo public: data pelanggan terbuka (`security.md` aturan 7).                    |
| Mengirim password sementara staf lewat WA/chat/repo                            | Akun staf bisa diambil alih; pakai Send password recovery.                       |
| Menampilkan galat mentah Supabase                                              | Pelanggan bingung; bisa membocorkan detail.                                      |
| Memasang nama, alias, atau alamat lewat `innerHTML`                            | Teks berisi tag bisa menjalankan skrip (SEC-18).                                 |
| Ganti password tanpa login ulang dengan password lama                          | Supabase bisa meminta verifikasi lewat email yang tidak terkirim.                |
| Tabel baru tanpa RLS, atau hak diberikan ke `anon`/`authenticated`             | Data bisa dibaca atau diubah langsung dari HP (SEC-03).                          |
| App password Gmail ditulis di chat, md, repo, atau WA                          | Email tim bisa disalahgunakan; harus dicabut dan dibuat ulang.                   |

---

## 7. Dampak dan pembatalan

- **Pengaturan Auth salah:** pendaftaran atau login macet; kembalikan pengaturan di dashboard. Tidak ada data hilang.
- **Migration akun:** tabel baru dan tidak menyentuh data lain. Bisa dibatalkan dengan SQL pembatalan tertulis di repo (dibuat sebelum dijalankan).
- **Edge Function salah:** pengguna melihat pesan galat umum; deploy ulang versi benar.
- **Salah memberi peran staf:** jalankan SQL nonaktifkan staf; peran hilang seketika di pemanggilan berikutnya.
- **Nomor WA atau alamat salah ketik:** pengguna memperbaiki sendiri lewat menu akun; order lama tidak berubah (salinan).
- **Akun uji sebelum peluncuran:** dibersihkan di `LNC.01` (`features.md`).

---

## 8. Ditunda

- Verifikasi nomor WA (OTP) dan verifikasi email.
- Login dengan Google atau nomor WA.
- Mengelola staf dari dalam aplikasi (tambah, nonaktifkan oleh owner).
- Rate limit khusus dan penggabungan pelanggan tanpa akun ke akun yang mendaftar sendiri (lihat `bonus.md`).
- Perbedaan hak antar owner (semua setara dulu).

---

## 9. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

### Handoff #1 | 2026-11-05 | [ketua]

**Tugas:** AKN.01 dan AKN.02 (pengaturan Auth dan SMTP di dashboard Supabase). Keduanya selesai.

**File yang diubah:** tidak ada. Semua perubahan dilakukan di dashboard Supabase akun ketua.

**Hasil:**

- AKN.01: Confirm email mati. Panjang minimal password 8. Password requirements dikosongkan. Secure password change mati (lihat keputusan baru).
- AKN.02: Custom SMTP aktif dengan Gmail khusus proyek (Sender name "Kedai ChATA", host smtp.gmail.com, port 465). App password hanya diketik di dashboard. Rate limit email 30 per jam dan interval 60 detik per user, tidak diubah (cukup untuk skala warung). Site URL dan Redirect URLs berisi alamat GitHub Pages ChATA (hasil FND.06), tidak diubah.

**Keputusan baru (menggantikan bunyi "dicek" di AKN.01, bagian 4 dokumen ini, dan security.md aturan 17 serta SEC-28):**

- Secure password change sengaja dibiarkan MATI atas keputusan ketua.
- Alasan: ganti password sudah memakai login ulang dengan password lama (AK11), jadi sesi selalu baru. Bila dinyalakan, customer ber-email asal-asalan (AK2) bisa mentok karena kode verifikasi tidak sampai.
- Dampak: tidak ada pagar tambahan di sisi Supabase untuk sesi lama. Bisa dinyalakan lagi kapan saja.
- Untuk SEC-28 yang diperiksa: Confirm email mati, minimal password 8, Secure password change mati.

**Belum beres:**

- Email dari Gmail tim belum pernah benar-benar terkirim. Uji kirim lewat link reset password dari dashboard (SEC-24), setelah akun uji ada. Bila gagal, curigai app password atau alamat Gmail yang salah ketik.
- Catatan keputusan di atas belum ditempel ke `docs/security.md` bagian 7. Tempel blok pendek di bawah.

**Saran giliran berikutnya:** AKN.03 (migration tabel pengaturan, profil, alamat, staf, hak, RLS, fungsi pembuat profil). High-Risk, butuh OK ketua. Lampirkan AGENTS.md, akun.md, database.md, security.md, dan isi supabase/migrations/ bila sudah ada.

### Handoff #2 | 2026-11-05 | [RAC]

**Tugas:** AKN.03 (migration akun). Selesai, sudah di-push.

**File yang diubah (semuanya baru):**

- `supabase/migrations/20261105_akun.sql`
- `supabase/migrations/20261105_akun_batal.sql`
- `supabase/templates/20261105_akun_cek.sql`
  **Hasil:** empat tabel (`pengaturan`, `profil`, `alamat`, `staf`), RLS aktif tanpa policy, hak `service_role` sesuai `database.md` bagian 3 tanpa DELETE, baris awal `alamat_maks` = 5, dan fungsi `public.buat_profil(p_id, p_nama, p_wa, p_alias, p_alamat)` yang atomik (profil dan alamat pertama sekaligus). Dijalankan di SQL Editor atas OK ketua. Query cek baca-saja lulus semua (RLS, tanpa policy, hak tabel, hak fungsi, pengaturan); ini bukti SEC-04, diperiksa di chat dan tidak disimpan.

**Keputusan baru:**

- Nomor WA disimpan seragam `628...` (angka saja). Input boleh diawali `+62`, `62`, atau `08`; hanya nomor seluler (setelah awalan harus `8`). Nomor yang sama boleh dipakai beberapa akun. Ini perincian AK8 (butir bawaan); belum ditanyakan satu per satu ke ketua.
- `buat_profil` menolak akun yang punya baris di tabel `staf` (staf tidak punya profil customer, AK4).
- Kode galat `buat_profil` untuk dipetakan `kedai` ke pesan aman: `id_kosong`, `nama_tidak_valid`, `wa_tidak_valid`, `alias_tidak_valid`, `alamat_tidak_valid`, `pengaturan_rusak`, `akun_staf`, `profil_sudah_ada`.
- Format nama migration berubah (lihat blok 2). Disepakati PIC di sesi ini, belum dikonfirmasi ketua.
  **Belum beres:**

- **Selisih dengan AK16 (usulan, belum diputuskan ketua):** AK16 menyebut `kedai` versi pertama membawa enam aksi akun, padahal fungsi SQL baru ada `buat_profil`. Usulan: AKN.04 berisi rangka `kedai`, cek token dua lapis, CORS, dan aksi `status` serta `daftar_profil`. Aksi `alamat_simpan` dan `alamat_nonaktif` ditambah di AKN.07, `ganti_nama` dan `ganti_wa` di AKN.08, masing-masing dengan migration kecil dan OK ketua. Alternatifnya satu migration kedua sekarang untuk keempat fungsi itu.
- SEC-03 versi penuh (akses langsung dari HP dengan kunci publishable) belum dites; masuk AKN.11.
- Uji kirim email dari Gmail tim (SEC-24) masih menunggu akun uji (dari Handoff #1).
- Catatan koreksi: Handoff #1 menyebut blok "Secure password change mati" belum ditempel ke `security.md`; ternyata sudah ada di `security.md` bagian 7.
  **Saran giliran berikutnya:** AKN.04 (Edge Function `kedai` versi pertama). High-Risk, butuh OK ketua. Yang perlu disiapkan sebelum mulai: (1) keputusan ketua soal scope di atas, (2) alamat GitHub Pages untuk daftar asal CORS, (3) konfirmasi FND.07 beres, (4) kunci secret baru (`sb_secret_...`) dibuat dan disimpan ketua sebagai secret fungsi di dashboard, bukan di kode, chat, atau md. Lampirkan `AGENTS.md`, `akun.md`, `database.md`, `security.md`, `public/config.js`, dan isi `supabase/migrations/` terbaru; folder `supabase/functions/` saat ini hanya berisi `.gitkeep`.

---

### Handoff #3 | 2026-11-06 | [ketua]

**Tugas:** AKN.04 (Edge Function `kedai` versi pertama). Selesai: kode ditulis, secret dipasang, dideploy, dan sudah di-push (commit `8b0e714`).

**File yang diubah (baru):**

- `supabase/functions/kedai/index.ts`

**Hasil:**

- Rangka `kedai` dengan cek token dua lapis. Lapis pertama: Verify JWT platform menyala (dicek di dashboard, deploy tanpa `--no-verify-jwt`). Lapis kedua: cek sendiri paling awal di kode, tanpa token atau token tidak valid dibalas 401; token kunci Supabase (`sb_...`) dan token anon ditolak.
- CORS hanya untuk alamat GitHub Pages ChATA.
- Dua aksi: `status` (peran dari tabel `staf`, profil, alamat aktif, dan `alamat_maks`; email tidak dikirim) dan `daftar_profil` (ID dari token, isian lain diabaikan, kode galat `buat_profil` dipetakan ke pesan aman Bahasa Indonesia).
- Deploy lewat urutan aman `AGENTS.md` bagian 8. Token CLI sudah dibersihkan dari Terminal (dicek `[]`).

**Keputusan baru:**

- **Scope AKN.04 dipersempit (opsi A, keputusan ketua):** `kedai` v1 hanya membawa `status` dan `daftar_profil`. `alamat_simpan` dan `alamat_nonaktif` ditambah di AKN.07, `ganti_nama` dan `ganti_wa` di AKN.08, masing-masing dengan migration kecil dan OK ketua. Ini menyelesaikan selisih dengan AK16 yang disebut di Handoff #2 (AK16 menyebut enam aksi; yang paling akhir menang).
- Nama variabel rahasia fungsi: `KUNCI_SECRET_KEDAI` (berisi kunci `sb_secret_...`, diisi di dashboard Edge Functions → Secrets). Nama tanpa awalan `SUPABASE_` dipilih karena nama berawalan itu biasanya ditolak dashboard.
- Staf yang nonaktif dibalas 403 di `status` (tidak jatuh jadi customer). Ini pilihan penulis (bawaan), belum ditanyakan satu per satu ke ketua.
- `@supabase/supabase-js` dipatok `2.58.0`.

**Belum beres:**

- **Fungsi belum pernah dipanggil.** Deploy hanya membuktikan kode terkirim. Uji dengan login asli dari halaman GitHub Pages (SEC-33) menunggu layar Masuk di AKN.05. Dashboard memberi label pengaturan "Verify JWT with legacy secret" (hanya menerima token berpenandatangan rahasia lama). Bila SEC-33 menunjukkan token login asli ditolak platform atau preflight CORS gagal: jangan lanjut, ikuti rencana mundur `security.md` aturan 3 (hanya dengan OK ketua).
- Bila uji menunjukkan kunci `sb_secret_...` tidak jalan dengan `supabase-js 2.58.0`, laporkan ke ketua; jangan diubah diam-diam.
- SEC-03 versi penuh dan uji kirim email Gmail tim (SEC-24) masih menunggu akun uji (dari Handoff #1 dan #2).

**Saran giliran berikutnya:** AKN.05 (layar Daftar, Masuk, Keluar), lalu langsung SEC-33. Lampirkan `AGENTS.md`, `akun.md`, `security.md`, `public/index.html`, `public/sw.js`, `public/config.js`, dan `supabase/functions/kedai/index.ts`. Berkas JS baru wajib didaftarkan di cache `sw.js` (butuh OK ketua). Butir baru yang perlu ditambah ke sheet: migration dan aksi alamat (AKN.07), migration dan aksi ganti nama/WA (AKN.08).

### 2026-11-06: AKN.07 dan AKN.08 membawa migration dan aksi `kedai`

- Akibat opsi A (AKN.04 hanya membawa `status` dan `daftar_profil`, lihat Handoff #3), pekerjaan berikut **wajib masuk ke langkah yang sudah ada**. Jangan dianggap hanya urusan layar:
  - **AKN.07 (buku alamat):** migration kecil berisi fungsi SQL atomik untuk simpan dan nonaktifkan alamat (cek kepemilikan dan batas `alamat_maks` dari `pengaturan`), ditambah aksi `alamat_simpan` dan `alamat_nonaktif` di `kedai`.
  - **AKN.08 (menu akun):** migration kecil berisi fungsi SQL atomik untuk ganti nama dan ganti nomor WA (aturan validasi sama dengan AK7 dan AK8), ditambah aksi `ganti_nama` dan `ganti_wa` di `kedai`.
- Tiap migration: ⚠️ butuh penjelasan dampak dan "OK" ketua; SQL disalin dulu ke `supabase/migrations/` (format `YYYYMMDD_nama.sql` dan `_batal.sql`), query cek baca-saja di `supabase/templates/`, tabel dan fungsi baru mengikuti pola hak `AGENTS.md` bagian 7.
- Tiap penambahan aksi berarti **deploy ulang `kedai`** dengan urutan aman `AGENTS.md` bagian 8, **tanpa `--no-verify-jwt`**.
- Nama fungsi SQL ditentukan di sesi masing-masing. Alasan pemisahan dari AKN.04: scope dipersempit atas keputusan ketua (opsi A).

### Handoff #4 | 2026-11-06 | RAC

**Tugas:** AKN.05 (layar Daftar, Masuk, Keluar) dan SEC-33 (uji pertama `kedai` dengan login asli). Selesai dan sudah di-push (commit `50ec621`; ikon tab `56029b4`). "OK" ketua untuk ganti halaman contoh, ubah `sw.js`, dan uji login diberikan lewat WA.

**File yang diubah:** `public/akun.js` (baru), `public/index.html`, `public/sw.js` (cache `chata-v3` jadi `chata-v4`, `akun.js` masuk daftar cache). `style.css` dan `kedai` tidak disentuh.

**Hasil:** Daftar (langsung masuk, Confirm email mati), Masuk, Keluar, dan pesan "Email atau password salah" berjalan. Setelah masuk, aplikasi memanggil `kedai` aksi `status` dan menampilkan layar sementara: "Halo [nama], Anda berhasil masuk sebagai [peran]". Ada layar Memuat, Galat, dan Offline. **SEC-33 lulus:** dari halaman GitHub Pages dengan login asli, `kedai` aksi `status` dibalas 200, tidak ada 401 dari platform dan tidak ada galat CORS. Bukti diperiksa di chat dan tidak disimpan. Dites di Brave di Mac; belum dites di HP Android.

**Keputusan baru:**

- SEC-33 lulus, jadi `kedai` **tetap tanpa `--no-verify-jwt`**. Rencana mundur di `security.md` aturan 3 tidak dipakai.
- Halaman contoh DSN.02 sampai DSN.05 dihapus dari `index.html` (termasuk navigasi contoh dan `.contoh-sampul` di HTML). Kode `.contoh-*` di `style.css` dibiarkan. Ini menjawab pertanyaan `.contoh-sampul` di Handoff desain.md #2 sampai #4 untuk bagian HTML. OK ketua lewat WA.
- Layar sementara setelah masuk memuat sapaan nama (tambahan dari ketua) dan tombol Keluar; diganti layar sebenarnya di langkah berikutnya.
- Keluar hanya mengakhiri sesi di perangkat itu. Daftar dengan email yang sudah dipakai menampilkan "Email ini sudah terdaftar. Silakan masuk." Cek password "hanya huruf dan angka, 8 sampai 72 karakter" hanya di layar Daftar; layar Masuk tidak membatasi karakter. Ketiganya pilihan penulis (bawaan), belum ditanyakan satu per satu ke ketua.
- Ikon tab peramban: `<link rel="icon">` ke `img/icon-192.png` di `index.html`; menghilangkan galat 404 `favicon.ico`.
- Pustaka Supabase di `public/lib/supabase.js` berversi 2.119.0 (dibaca dari isi berkas; sebelumnya belum tercatat).

**Belum beres:**

- Layar sementara dan baris "Sistem siap." bersifat sementara. Navigasi per peran sudah dihapus dari `index.html` dan dibuat ulang saat layar utama dikerjakan.
- Form melebar penuh di layar lebar (laptop) karena `style.css` belum membatasi lebar.
- SEC-24 (uji kirim email Gmail tim) menunggu akun uji dengan email asli milik tim; akun uji AKN.05 memakai domain contoh dan tidak menerima email. SEC-03 versi penuh masuk AKN.11. Akun uji dibersihkan di `LNC.01`.

**Saran giliran berikutnya:** AKN.06 (layar Lengkapi profil: nama, nomor WA, alamat pertama, dengan kalimat penjelasan nomor WA). Aksi `daftar_profil` dan fungsi `buat_profil` sudah ada, jadi kemungkinan tanpa migration baru: kerjanya di layar dan `akun.js` (layar muncul saat `status` mengembalikan `profil` kosong). High-Risk (P0, data pelanggan), tes teliti dengan bukti dan data dummy. Berkas JS baru wajib didaftarkan di `sw.js` (butuh "OK" ketua). Lampirkan `AGENTS.md`, `akun.md`, `security.md`, `public/index.html`, `public/akun.js`, `public/sw.js`, `public/style.css`, dan `supabase/functions/kedai/index.ts`.

### Handoff #5 | 2026-11-06 | EMIR

**Tugas:** AKN.06 (layar Lengkapi profil: nama, nomor WA, alamat pertama, dengan kalimat penjelasan nomor WA). Selesai dan sudah di-push. "OK" ketua untuk perubahan `sw.js` sudah diberikan.

**File yang diubah:** `public/profil.js` (baru, 153 baris), `public/akun.js` (426 baris; hanya menambah), `public/index.html` (section `layar-profil` dan tag script `profil.js` setelah `akun.js`), `public/sw.js` (`profil.js` masuk daftar cache, `chata-v4` jadi `chata-v5`). `style.css` dan `kedai` tidak disentuh. Tanpa migration baru.

**Hasil:** Customer yang belum punya profil melihat layar Lengkapi profil (4 isian, tombol Simpan dan Keluar) setelah daftar atau masuk. Simpan memanggil aksi `daftar_profil`, lalu `status` dimuat ulang dan layar sementara menampilkan "Profil Anda sudah lengkap". Pengujian dilakukan di Brave di Mac (DevTools mode HP) dengan akun dan data dummy; lulus: akun baru melihat layar profil (balasan `status`: `customer`, `profil: null`), validasi isian kosong dan WA tidak valid ditolak di HP tanpa panggilan server, tutup tab lalu masuk lagi tanpa simpan memunculkan layar profil lagi (AK6), simpan berhasil (`{"ok":true}`), Keluar mengosongkan isian, login ulang akun yang sudah punya profil tidak melihat layar profil. Bukti diperiksa di chat dan tidak disimpan.

**Keputusan baru:**

- Logika layar ditaruh di berkas terpisah `profil.js` (pilihan PIC) supaya `akun.js` tetap di bawah ~500 baris. Konsekuensinya `sw.js` berubah (OK ketua).
- `akun.js` membuka layar lewat `window.KedaiProfil.tampil()` dan membagikan pembantu lewat `window.KedaiAkun` (dibekukan). Urutan script wajib: `akun.js`, lalu `profil.js`. `panggilKedai(aksi, data)` kini menerima isian; kunci `aksi` selalu dari parameter.
- Layar profil hanya muncul bila `peran === "customer"` DAN `profil` kosong. Staf selalu punya `profil: null`, jadi syarat peran wajib.
- Bawaan penulis, belum ditanyakan satu per satu ke ketua: spasi dan tanda hubung di nomor WA dibuang sebelum dikirim; pagar WA di HP longgar (+62/62/08, lalu 8, total panjang wajar), server yang memutuskan; kolom Nama alamat tidak diisi otomatis; balasan 409 (`profil_sudah_ada`) dianggap beres dan lanjut muat status; WA dan alamat dikosongkan dari form setelah simpan dan saat Keluar; galat dari server tampil sebagai satu pesan di atas tombol (bukan per kolom).
- Teks "Profil belum lengkap..." di `isiSementara` (`akun.js`) kini tidak pernah tampil, tetapi dibiarkan (tidak dihapus tanpa perintah).

**Belum beres:**

- Tes staf tidak melihat layar profil dan `daftar_profil` dari staf dibalas 403 ditunda sampai akun owner uji ada (AKN.10); digabung ke AKN.11.
- Belum dites di HP Android. Layar sementara bersifat sementara. Form masih melebar penuh di layar lebar (dari Handoff #4).
- SEC-24 (uji kirim email Gmail tim) dan SEC-03 versi penuh masih menunggu, seperti di Handoff #4. Akun uji AKN.05 dan AKN.06 dibersihkan di `LNC.01`.

**Saran giliran berikutnya:** AKN.07 (buku alamat). High-Risk (P0, data pelanggan). Butuh migration kecil (fungsi SQL atomik simpan dan nonaktifkan alamat, cek kepemilikan dan batas `alamat_maks`) dan aksi `alamat_simpan` serta `alamat_nonaktif` di `kedai`, dengan deploy ulang `kedai` tanpa `--no-verify-jwt`. Butuh penjelasan dampak dan "OK" ketua. Lampirkan `AGENTS.md`, `akun.md`, `database.md`, `security.md`, `public/index.html`, `public/akun.js`, `public/profil.js`, `public/sw.js`, `public/style.css`, `supabase/functions/kedai/index.ts`, dan isi `supabase/migrations/`.
