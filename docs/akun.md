/docs/akun.md

# 👤 akun.md: Daftar, Login, Tiga Peran, Profil, Buku Alamat, Password

> **Versi 1.3 (5 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Perubahan 1.1 sampai 1.3: kalimat "email aktif" di layar Daftar, petunjuk isi alamat, penjaga bisa lebih dari 2, hak koreksi dan ganti foto di tabel bagian 4 (1.1); kunci publishable (AK1), menu Akun memuat Bantuan dan hak lihat Bantuan di tabel bagian 4 (`bantuan.md`) (1.2); `kedai` di-deploy tanpa `--no-verify-jwt` dan diuji dengan login asli di SEC-33 (AK10, AK16, AKN.04, AKN.05) (1.3). Bergantung pada `fondasi.md` (repo, project Supabase, terbit online, CLI).
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

**Tugas:** AKN.01 dan AKN.02 (pengaturan Auth dan SMTP di dashboard Supabase) selesai. Tidak ada berkas yang berubah.

**Hasil:** Confirm email mati. Panjang minimal password 8. Password requirements dikosongkan. Custom SMTP aktif dengan Gmail khusus proyek (Sender name "Kedai ChATA", host smtp.gmail.com, port 465); app password hanya diketik di dashboard. Rate limit email 30 per jam dan interval 60 detik per user, tidak diubah (cukup untuk skala warung). Site URL dan Redirect URLs berisi alamat GitHub Pages ChATA (FND.06).

**Keputusan baru (menggantikan bunyi "dicek" di AKN.01, bagian 4 dokumen ini, dan `security.md` aturan 17 serta SEC-28):**

- **Secure password change sengaja dibiarkan MATI** atas keputusan ketua. Alasan: ganti password sudah memakai login ulang dengan password lama (AK11), jadi sesi selalu baru; bila dinyalakan, customer ber-email asal-asalan (AK2) bisa mentok karena kode verifikasi tidak sampai.
- Dampak: tidak ada pagar tambahan di sisi Supabase untuk sesi lama. Bisa dinyalakan lagi kapan saja.
- SEC-28 yang diperiksa: Confirm email mati, minimal password 8, Secure password change mati.

### Handoff #2 | 2026-11-05 | [RAC]

**Tugas:** AKN.03 (migration akun) selesai: tabel `pengaturan` (baris `alamat_maks` = 5), `profil`, `alamat`, `staf`; RLS aktif tanpa policy; hak `service_role` sesuai `database.md` bagian 3 tanpa DELETE; fungsi atomik `public.buat_profil(p_id, p_nama, p_wa, p_alias, p_alamat)` (profil dan alamat pertama sekaligus). Berkas: `supabase/migrations/20261105_akun.sql` (+ `_batal.sql`) dan `supabase/templates/20261105_akun_cek.sql`.

**Keputusan baru:**

- Nomor WA disimpan seragam `628...` (angka saja). Input boleh diawali `+62`, `62`, atau `08`; hanya nomor seluler (setelah awalan harus `8`). Nomor yang sama boleh dipakai beberapa akun. Ini perincian AK8 (butir bawaan; belum ditanyakan satu per satu ke ketua).
- `buat_profil` menolak akun yang punya baris di tabel `staf` (staf tidak punya profil customer, AK4).
- Kode galat `buat_profil` yang dipetakan `kedai` ke pesan aman: `id_kosong`, `nama_tidak_valid`, `wa_tidak_valid`, `alias_tidak_valid`, `alamat_tidak_valid`, `pengaturan_rusak`, `akun_staf`, `profil_sudah_ada`.
- Nama migration berformat `YYYYMMDD_nama.sql` dengan pembatal `YYYYMMDD_nama_batal.sql` (disepakati PIC, belum dikonfirmasi ketua).

### Handoff #3 | 2026-11-06 | [ketua]

**Tugas:** AKN.04 (Edge Function `kedai` versi pertama) selesai: `supabase/functions/kedai/index.ts`, di-deploy lewat urutan aman tanpa `--no-verify-jwt`.

**Hasil:** Cek token dua lapis: lapis pertama Verify JWT platform; lapis kedua cek sendiri paling awal (tanpa token atau token tidak valid dibalas 401; token kunci Supabase `sb_...` dan token anon ditolak). CORS hanya untuk alamat GitHub Pages ChATA. Dua aksi: `status` (peran dari tabel `staf`, profil, alamat aktif, dan `alamat_maks`; email tidak dikirim) dan `daftar_profil` (ID dari token, isian lain diabaikan, kode galat `buat_profil` dipetakan ke pesan aman Bahasa Indonesia).

**Keputusan baru:**

- **Scope AKN.04 dipersempit (opsi A, keputusan ketua):** `kedai` v1 hanya membawa `status` dan `daftar_profil`. `alamat_simpan` dan `alamat_nonaktif` ditambah di AKN.07, `ganti_nama` dan `ganti_wa` di AKN.08, masing-masing dengan migration kecil dan OK ketua. Ini menggantikan AK16 yang menyebut enam aksi sekaligus.
- Nama variabel rahasia fungsi: `KUNCI_SECRET_KEDAI` (berisi kunci `sb_secret_...`, diisi di dashboard Edge Functions → Secrets). Nama tanpa awalan `SUPABASE_` dipilih karena nama berawalan itu biasanya ditolak dashboard.
- Staf yang nonaktif dibalas 403 di `status` (tidak jatuh jadi customer). Pilihan penulis (bawaan), belum ditanyakan satu per satu ke ketua.
- `@supabase/supabase-js` di fungsi dipatok `2.58.0`.

### 2026-11-06: AKN.07 dan AKN.08 membawa migration dan aksi `kedai`

- Akibat opsi A (AKN.04 hanya membawa `status` dan `daftar_profil`), pekerjaan berikut **wajib masuk ke langkah yang sudah ada**, bukan hanya urusan layar:
  - **AKN.07 (buku alamat):** migration kecil berisi fungsi SQL atomik untuk simpan dan nonaktifkan alamat (cek kepemilikan dan batas `alamat_maks` dari `pengaturan`), ditambah aksi `alamat_simpan` dan `alamat_nonaktif` di `kedai`.
  - **AKN.08 (menu akun):** migration kecil berisi fungsi SQL atomik untuk ganti nama dan ganti nomor WA (validasi sama dengan AK7 dan AK8), ditambah aksi `ganti_nama` dan `ganti_wa` di `kedai`.
- Tiap migration: ⚠️ butuh penjelasan dampak dan "OK" ketua; SQL disalin dulu ke `supabase/migrations/` (format `YYYYMMDD_nama.sql` dan `_batal.sql`), query cek baca-saja di `supabase/templates/`, tabel dan fungsi baru mengikuti pola hak `AGENTS.md` bagian 7.
- Tiap penambahan aksi berarti **deploy ulang `kedai`** dengan urutan aman `AGENTS.md` bagian 8, **tanpa `--no-verify-jwt`**.

### Handoff #4 | 2026-11-06 | RAC

**Tugas:** AKN.05 (layar Daftar, Masuk, Keluar) dan SEC-33 selesai. `public/akun.js` baru; `index.html` dan `sw.js` (cache `chata-v4`) diubah.

**Hasil:** Daftar (langsung masuk), Masuk, Keluar, dan pesan "Email atau password salah" berjalan. Setelah masuk, aplikasi memanggil `kedai` aksi `status`. Ada layar Memuat, Galat, dan Offline. **SEC-33 lulus:** dari halaman GitHub Pages dengan login asli, `kedai` aksi `status` dibalas 200, tanpa 401 dari platform dan tanpa galat CORS.

**Keputusan baru:**

- SEC-33 lulus, jadi `kedai` **tetap tanpa `--no-verify-jwt`**; rencana mundur di `security.md` aturan 3 tidak dipakai.
- Halaman contoh DSN.02 sampai DSN.05 dihapus dari `index.html` (kode `.contoh-*` di `style.css` dibiarkan). OK ketua lewat WA.
- Keluar hanya mengakhiri sesi di perangkat itu. Daftar dengan email yang sudah dipakai menampilkan "Email ini sudah terdaftar. Silakan masuk." Cek password "hanya huruf dan angka, 8 sampai 72 karakter" hanya di layar Daftar; layar Masuk tidak membatasi karakter. Ketiganya pilihan penulis (bawaan), belum ditanyakan satu per satu ke ketua.
- Ikon tab peramban: `<link rel="icon">` ke `img/icon-192.png` di `index.html`.
- Pustaka Supabase di aplikasi: `public/lib/supabase.js` versi 2.119.0 (dibaca dari isi berkas).

### Handoff #5 | 2026-11-06 | EMIR

**Tugas:** AKN.06 (layar Lengkapi profil) selesai. `public/profil.js` baru; `akun.js`, `index.html`, `sw.js` (cache `chata-v5`) diubah. Tanpa migration baru.

**Keputusan baru:**

- Logika layar di berkas terpisah `profil.js` (pilihan PIC) supaya `akun.js` tetap di bawah ~500 baris. `akun.js` membuka layar lewat `window.KedaiProfil.tampil()` dan membagikan pembantu lewat `window.KedaiAkun` (dibekukan). Urutan script wajib: `akun.js`, lalu `profil.js`. `panggilKedai(aksi, data)` menerima isian; kunci `aksi` selalu dari parameter.
- Layar profil hanya muncul bila `peran === "customer"` DAN `profil` kosong (staf selalu `profil: null`, jadi syarat peran wajib).
- Bawaan penulis, belum ditanyakan satu per satu ke ketua: spasi dan tanda hubung di nomor WA dibuang sebelum dikirim; pagar WA di HP longgar (+62/62/08, lalu 8, total panjang wajar), server yang memutuskan; kolom Nama alamat tidak diisi otomatis; balasan 409 (`profil_sudah_ada`) dianggap beres dan lanjut muat status; WA dan alamat dikosongkan dari form setelah simpan dan saat Keluar; galat dari server tampil sebagai satu pesan di atas tombol.
- Teks "Profil belum lengkap..." di `isiSementara` (`akun.js`) kini tidak pernah tampil, tetapi dibiarkan (tidak dihapus tanpa perintah).

### Handoff #6 | 2026-11-06 | [RAC]

**Tugas:** AKN.07 (buku alamat) selesai. `public/alamat.js` baru; `index.html`, `akun.js`, `sw.js` (cache `chata-v6`), dan `kedai/index.ts` (aksi `alamat_simpan`, `alamat_nonaktif`) diubah. Migration `20261106_alamat.sql`.

**Hasil:** fungsi SQL `public.alamat_simpan(p_pemilik, p_id, p_alias, p_isi)` (id kosong = tambah, terisi = ubah) dan `public.alamat_nonaktif(p_pemilik, p_id)`, atomik; baris profil dikunci (`FOR UPDATE`) supaya dua permintaan bersamaan tidak menembus batas. Balasan sukses kedua aksi memuat `alamat` (daftar aktif terbaru). Kode galat: `alias_tidak_valid` dan `alamat_tidak_valid` 400, `alamat_penuh` 409, `alamat_terakhir` 409, `alamat_tidak_ditemukan` 404, `profil_tidak_ada` 400. Terbukti: batas 5 ditolak server dengan 409 walau lewat konsol, dan SEC-09 lintas akun (akun B tidak bisa mengubah atau menonaktifkan alamat akun A, 404).

**Keputusan baru** (bawaan penulis; ketua hanya menyetujui "ikut rekomendasi"):

- Alias dan isi sama-sama bisa diubah; alias kembar boleh; alamat nonaktif tidak bisa diaktifkan lagi (customer menambah alamat baru). Order lama aman karena menyimpan salinan (AK9).
- Alamat milik orang lain, nonaktif, atau tidak ada dibalas satu kode yang sama (`alamat_tidak_ditemukan`, 404) supaya tidak membocorkan keberadaan alamat.
- Nonaktifkan alamat aktif terakhir ditolak server (`alamat_terakhir`); tombolnya juga dimatikan di layar.
- Saat server membalas 404 atau 409, layar kembali ke daftar, menampilkan pesannya, lalu menyegarkan data lewat `status`. `alamat.js` mengisi data lewat aksi `status` saat layar dibuka. Di layar alamat 409 berarti gagal (beda dengan `profil.js`).

### Handoff #7 | 2026-11-06 | [AIK]

**Tugas:** AKN.08 bagian 08a (ganti nama dan ganti nomor WA) selesai. `public/akunmenu.js` baru; `index.html`, `akun.js`, `sw.js` (cache `chata-v7`), dan `kedai/index.ts` (aksi `ganti_nama`, `ganti_wa`) diubah. Migration `20261106_ganti_profil.sql`.

**Hasil:** fungsi SQL `public.ganti_nama(p_pemilik, p_nama)` dan `public.ganti_wa(p_pemilik, p_wa)`, atomik; aturan sama dengan `buat_profil` (WA disimpan seragam `62...`). Balasan sukses hanya `{"ok":true}`; layar membaca nilai terbaru lewat `status`. Kode galat: `nama_tidak_valid` dan `wa_tidak_valid` 400, `profil_tidak_ada` 400 ("Lengkapi profil dulu."); peran selain customer dibalas 403. SEC-06 terbukti: id/pemilik palsu di kiriman diabaikan.

**Keputusan baru** (bawaan penulis; ketua menyetujui ringkasan rencana):

- Ganti nama dan ganti WA hanya untuk customer (mengikuti `database.md`). Nama staf diubah ketua lewat SQL Editor.
- Nomor WA lama tidak ditampilkan; kolom WA selalu kosong dan dikosongkan lagi setelah berhasil dan saat Keluar. Kolom Nama diisi dari `status`. Spasi dan tanda hubung di nomor WA dibuang sebelum dikirim.
- Tombol Kembali di layar Akun memuat ulang `status` supaya sapaan memakai nama terbaru.

### 2026-11-06: tes layar 08a tuntas (ganti nama dan ganti WA)

Isian tidak valid (nama 2 huruf, WA `12345`) ditolak di layar dengan pesan merah di bawah kolom tanpa panggilan ke server, dan Keluar mengosongkan layar Akun (WA, pesan sukses, dan pesan galat kosong; kolom Nama terisi dari server).

### Handoff #8 | 2026-11-06 | [RAC]

**Tugas:** AKN.08 bagian 08b (ganti password, AK11) selesai; **AKN.08 selesai**. Tanpa migration, tanpa perubahan `kedai`, `sw.js` tidak berubah. Perubahan di `akun.js` (pembantu `gantiPassword(lama, baru)`, dibagikan lewat `window.KedaiAkun`), `akunmenu.js` (logika form), dan `index.html` (kartu "Ganti password").

**Alur:** ambil email dari sesi login di HP (tidak disimpan), login ulang dengan password lama, baru `updateUser` password baru lewat Supabase Auth. Aturan password baru sama dengan AK3 (huruf dan angka, 8 sampai 72 karakter), dicek di HP; Supabase tetap yang memutuskan. Pesan galat aman: "Password lama salah.", "Password baru harus berbeda dari password lama.", pesan aturan password, pesan terlalu sering, offline, dan pesan umum. Password lama salah ditolak tanpa mengubah apa pun.

**Keputusan baru** (bawaan penulis; ketua menyetujui ringkasan rencana): Secure password change tetap mati (keputusan ketua di Handoff #1); dua isian password tanpa kolom "ulangi password baru".

### Handoff #9 | 2026-11-06 | [RAC]

**Tugas:** AKN.09 (layar Buat password baru dari link reset, dan tautan "Lupa password?", AK12) selesai. Tanpa migration, tanpa perubahan `kedai`, `sw.js` tidak berubah. Perubahan di `index.html` (kartu pesan sukses di layar Masuk, tombol "Lupa password?" dengan kartu petunjuk, section `layar-resetpw`) dan `akun.js` (layar `resetpw`, bagian `#` alamat dibaca sebelum klien dibuat, fungsi `mulaiReset`, `kirimResetPw`, `selesaiReset`, `batalReset`, `linkTidakBerlaku`).

**Alur:** link dari "Send password recovery" membuka layar Buat password baru (bukan beranda). Simpan berhasil: sesi sementara ditutup, kembali ke layar Masuk dengan kartu "Password berhasil dibuat". Batal: sesi sementara ditutup lewat Keluar, kembali ke Masuk. Link rusak atau sudah terpakai: layar Masuk dengan pesan "Link sudah tidak berlaku. Hubungi tim untuk link baru." **SEC-24 lulus:** email dari Gmail tim terbukti sampai dan link membuka layar yang benar.

**Keputusan baru** (bawaan penulis; ketua menyetujui ringkasan rencana):

- Satu isian password baru, tanpa kolom "ulangi password" (sama seperti ganti password). Aturan AK3.
- Layar Buat password baru hanya tampil bila sesi benar-benar berasal dari link: token sesi sama dengan token di alamat, atau Supabase mengirim event `PASSWORD_RECOVERY`. Token hanya dibandingkan di memori, tidak dicatat, dan alamat peramban dibersihkan.
- Link tetap sekali pakai (sifat Supabase); ketua memutuskan dipertahankan.
- Petunjuk "Lupa password?" tanpa nomor atau email di repo.

**Kejadian di lapangan (bahan belajar):**

1. **Email reset gagal dikirim (500, 535 BadCredentials).** Penyebab: app password Gmail diketik manual dari layar HP dan meleset. Perbaikan: app password dibuat ulang lalu dipasang di SMTP Supabase. Pencegahan: app password selalu disalin dan ditempel, jangan diketik; di laptop bersama login akun Google lewat "Coba cara lain" (kode dari `g.co/sc`) dan hilangkan centang "Jangan tanya lagi di perangkat ini". Pesan galat asli ada di Logs, Auth (log API Gateway hanya memuat "unexpected_failure").
2. **Link sah tampil "Link sudah tidak berlaku".** Pengecekan sesi di kode versi pertama diperbaiki dengan membandingkan token. Penyebab pastinya tidak dipastikan (event `PASSWORD_RECOVERY` datang terlambat, atau tes pertama masih memakai `akun.js` lama dari cache). Pencegahan: setelah tiap deploy, muat ulang keras (Cmd+Shift+R) sebelum tes, dan tiap percobaan butuh link baru.

### Handoff #10 | 2026-11-06 | [FREN]

**Tugas:** AKN.10 (SQL template staf dan prosedur ketua; 1 owner dan 1 penjaga uji) selesai. Berkas baru di `supabase/templates/`:

- `20261106_staf_tambah.sql`: isian (ID akun, nama tampilan, peran) diisi di dashboard saja. Menolak bila ID tidak ada di Auth, akun sudah punya profil customer (AK4), atau sudah ada di `staf` (tidak menimpa).
- `20261106_staf_nonaktif.sql`: `aktif = false` pada satu baris staf aktif. Tanpa DELETE.
- `20261106_staf_cek.sql`: query cek baca-saja (daftar dan ringkasan staf, staf tanpa profil customer, RLS dan policy, hak tabel `staf`). Nama dan email tidak ditampilkan, ID hanya 8 karakter, jadi aman ditempel ke chat.

**Keputusan baru (ketua):**

- Template staf tetap di `supabase/templates/`, bukan `migrations/`: yang membuat tabel atau fungsi di `migrations/`, query cek dan SQL berisian di `templates/`.
- Nilai peran tetap `owner` dan `penjaga`. Peran `staf` ditolak `staf_peran_cek` dan `staf` sudah dipakai sebagai istilah payung. Bila yang tidak enak dibaca adalah tampilan layar, ubah labelnya di layar (DSN), bukan nilai di database.
- Template tambah sengaja tidak menimpa baris yang sudah ada (bawaan penulis).

**Akun uji (data dummy):** owner uji dan penjaga uji memakai email berpola `+owner` dan `+staf` milik PIC; customer uji: beberapa akun berdomain example.com (tidak bisa menerima email) dan satu akun beremail milik adik ketua. Dibersihkan di `LNC.01`.

**Kejadian di lapangan:** email recovery pertama ke akun staf masuk **Spam**; email berikutnya masuk inbox setelah pengirim ditandai "Bukan spam" (dugaan). Staf asli perlu diingatkan cek Spam.

### Handoff #11 | 2026-11-06 | [RAC+FREN]

**Tugas:** sesi tes AKN.11 bagian pertama; `docs/akun-test.md` dibuat (hanya kasus uji). Tidak ada kode, migration, atau deploy yang diubah.

**Yang lulus (bukti di chat, tidak disimpan):**

- **Staf:** owner dan penjaga masuk dengan peran benar tanpa layar Lengkapi profil; keduanya memanggil `alamat_simpan`, `ganti_nama`, `ganti_wa`, `daftar_profil` dan dibalas 403 "Aksi ini hanya untuk customer." (penjaga juga `alamat_nonaktif`, 403 bukan 404). Ganti password dari akun penjaga berhasil.
- **SEC-03 versi penuh:** baca `pengaturan`, `profil`, `alamat`, `staf` lewat REST dengan kunci publishable: tanpa login 401, dengan token login 403 (`42501`); `rpc` ke `buat_profil` ditolak `42501`. Fungsi lain tercakup bukti hak fungsi di query cek migration (SEC-04).
- **SEC-01:** `kedai` tanpa token dibalas 401 "Sesi tidak valid" (ditolak fungsi sendiri). **SEC-02:** token palsu dibalas 401 `UNAUTHORIZED_LEGACY_JWT` (ditolak platform). **SEC-32:** kunci publishable dan JWT `anon` lama sebagai Bearer sama-sama 401 "Sesi tidak valid" (lapis kedua terbukti). Kunci lama masih tampil di dashboard (View legacy API keys, pensiun awal 2027).
- **Milik orang lain (alamat):** lulus di AKN.07; tidak perlu diulang.

**Kejadian di lapangan (bahan belajar):**

1. Satu screenshot layar Masuk memuat alamat email akun uji penjaga (milik tim) di chat. Tidak masuk repo, md, atau kode; password akun itu sudah diganti. Pencegahan: bukti dikirim sebagai teks (status code, isi balasan Console); screenshot hanya bila diminta, dengan bagian yang harus di-crop disebut dulu.
2. Tes yang sudah lulus di sesi kode sempat diulang. Pencegahan: AI membaca handoff sebelumnya untuk tes yang sudah lulus sebelum menyusun langkah.

### Handoff #12 | 7 Nov 2026 | ketua

**Tugas:** sesi tes AKN.11 lanjutan: SEC-28, SEC-26, dan sisa kasus lulus. Berkas baru `supabase/templates/20261106_staf_aktifkan.sql`; `docs/akun-test.md` diperbarui (AKT-28 dipertajam, AKT-38 baru, baris penunjuk "file ini tidak memuat status; lihat Handoff dan sheet").

**Yang lulus (akun dan data dummy; bukti di chat, tidak disimpan):**

- **SEC-28** (cek dashboard): Confirm email mati, minimal password 8, Secure password change mati, Password requirements kosong.
- **SEC-26:** penjaga uji dinonaktifkan lewat template nonaktif dengan sesi login lama masih terbuka. Tombol Segarkan dibalas **403** "Akun ini tidak aktif. Hubungi pengelola." dan aplikasi menampilkan layar galat (bukan layar Lengkapi profil). Setelah diaktifkan kembali lewat template aktifkan, "Coba lagi" dibalas 200 (`peran: penjaga`) tanpa login ulang.
- **AKT-29:** dari akun customer, `status` dengan `peran: "owner"` tetap dijawab customer; aksi `staf_tambah` dan `staf_aktifkan` dibalas 400 "Aksi tidak dikenal." Tidak ada jalur menjadi staf dari aplikasi.
- **AKT-38:** template aktifkan dengan ID nol, atau dengan ID penjaga yang sudah aktif, gagal sendiri ("Tidak ada staf NONAKTIF dengan ID ini (salah ID, atau sudah aktif). Tidak ada yang diubah.").
- `alamat_nonaktif` oleh owner dibalas 403 (AKT-25). **AKT-27 dan AKT-22:** link reset membuka layar Buat password baru, password baru diterima dan lama ditolak, link yang sama dibuka kedua kali ditolak. Akun yang diuji adalah owner uji (password sudah berganti, disimpan ketua).
- Query cek staf lulus di tiga keadaan (aktif, penjaga nonaktif, aktif kembali).

**Keputusan baru (disetujui ketua):** template aktifkan kembali staf hanya mengubah satu kolom (`aktif` false ke true) pada satu baris staf nonaktif; tanpa DELETE; tanpa mengubah tabel, fungsi, atau hak; gagal sendiri bila isian belum diganti, ID salah, atau staf sudah aktif. Komentar di `20261106_staf_nonaktif.sql` yang menulis bahwa mengaktifkan kembali "belum diputuskan" sengaja tidak diubah; keputusan ini yang berlaku.

**Prosedur tes lewat Console (untuk sesi tes berikutnya):**

- Di tab Network, klik kanan panggilan `kedai` lalu Copy as fetch. Sebelum Enter: ubah `credentials` jadi `"omit"`; hapus semua header kecuali `apikey`, `authorization`, `content-type`, `x-client-info` (header lain ditolak CORS server dan itu benar; server tidak boleh diubah untuk ini); ganti `body`; di ujung tambahkan `.then(r => r.text().then(t => console.log(r.status, t)))`.
- Token `authorization` memuat sesi login: jangan ditempel ke chat atau disimpan; tempel hanya baris hasil (status dan balasan). Token dari sesi yang sudah Keluar dibalas 401, jadi ambil dari panggilan terbaru (Clear Network dulu, lalu Segarkan).
- Bukti query cek staf diambil sebelum akun diaktifkan kembali. Query yang terisi ID tidak boleh disimpan ke repo atau chat; tutup tab query tanpa menyimpan.

### 2026-11-07: staf yang juga customer pakai dua akun (versi 1)

- **Keputusan (ketua):** di versi 1, owner atau penjaga yang juga mau memesan (misalnya untuk anaknya) memakai **dua akun**: satu staf, satu customer. Pola email: `nama+peran@gmail.com` (misal `+owner` dan `+customer`). Ini menegaskan aturan di bagian 4 dan AK4, bukan perubahan.
- **Akun staf dibuat sejak awal sebagai staf** lewat template tambah staf. Jangan menjadikan akun customer yang sudah punya profil sebagai staf (template menolak).
- **Pemicu:** masukan dari keluarga ketua bahwa owner juga punya anak yang memesan, jadi butuh alamat dan order sendiri.
- **Ditunda:** satu akun untuk dua peran (staf punya profil dan alamat sendiri). Berisiko (peran, login, fungsi server, tes ulang), jadi dibahas setelah review pemakaian versi 1 bila keluhan owner banyak. Alasan penundaan selebihnya belum tercatat.
- **Teruji:** login akun staf berpola `+owner` dan `+staf`, dan daftar customer dengan email berpola `+customer`.

### Handoff #13 | 7 Nov 2026 | ketua

**Tugas:** AKN.11 (sesi tes akun) **selesai**. `docs/akun-test.md` diperbarui dengan kasus baru AKT-39 (daftar dengan email berisi `+`) dan AKT-40 (template tambah staf menolak akun yang sudah customer atau sudah staf).

**Yang lulus (bukti di chat, tidak disimpan):**

- **AKT-36 (Android):** setelah update, versi baru muncul, layar Akun dan Buku alamat terbaca, tombol cukup besar.
- **AKT-37 (offline):** internet dimatikan lalu app dibuka: muncul layar Offline ChATA (bukan halaman Chrome). "Coba lagi" saat offline tetap di layar yang sama tanpa crash; setelah internet menyala masuk ke beranda tanpa login ulang.
- **AKT-39:** daftar dengan email berpola `nama+customer` diterima, layar Lengkapi profil muncul, masuk sebagai customer.
- **AKT-40:** template tambah staf dengan ID akun customer berprofil gagal ("Akun ini sudah punya profil customer. Staf harus akun terpisah (email berbeda)."); dengan ID penjaga yang sudah di `staf` gagal ("Akun ini sudah ada di tabel staf. Tidak ada yang diubah."). Tidak ada baris staf yang terbentuk atau berubah.

### Handoff #14 | 7 Nov 2026 | [RAC]

**Tugas:** TMN.01 (sembunyikan tombol dan kartu yang tidak berlaku untuk staf) selesai. Perubahan di `akun.js` (`isiSementara`: tombol Akun tampil untuk semua peran; kartu Ganti nama dan Ganti nomor WA hanya untuk customer), `index.html` (id `kartu-akun-nama` dan `kartu-akun-wa`), dan `style.css`. Tanpa migration, deploy fungsi, atau perubahan `sw.js`.

**Keputusan baru (ketua, lewat sesi kode):** Buku alamat disembunyikan untuk staf. Tombol Akun tetap tampil untuk semua peran (dipakai staf untuk ganti password). Di layar Akun, kartu Ganti nama dan Ganti nomor WA disembunyikan untuk staf karena server memang menolaknya (403).

**Pelajaran:** tombol Buku alamat sebenarnya sudah ditandai tersembunyi untuk staf di `akun.js`, tetapi tetap tampil karena kelas `.tombol` ber-`display: flex` menimpa atribut `hidden`. Perbaikan: aturan global `[hidden] { display: none !important; }` di `style.css`, plus `.baris-tombol:has(> [hidden]:only-child)` supaya baris tombol kosong ikut hilang. Jangan menghapus aturan itu.

**Masih terbuka:**

- Form dan layar akun masih melebar penuh di layar lebar (laptop).
- Tulisan sukses "Nama berhasil diganti." dan "Nomor WA berhasil diganti." kecil dan abu-abu di bawah judul, gampang terlewat bila layar tergulir (P2).
- Klik dua kali atau layar tertutup sebelum password baru dibuat menghasilkan "Link sudah tidak berlaku" dan butuh link baru dari ketua (dipertahankan sesuai keputusan ketua; bahan pertimbangan di review pemakaian bila pelanggan sering mengeluh).
- Di luar kode: logout dari akun Google proyek di laptop bersama, dan hapus app password lama yang salah ketik di akun Google itu.
- Akun uji (termasuk yang berisi email asli milik tim) dibersihkan di `LNC.01`.

### 2026-11-07: Pengaturan akun dan Buku alamat pindah ke Home

Sumber: `home.md` (HM6, HM9, Handoff #2). Menimpa bagian 4 butir 4 (menu Akun) serta catatan tentang tombol Akun dan Buku alamat di layar sementara dan menu Lainnya.

- Tombol "Akun" dan "Buku alamat" di layar sementara dihapus (HOM.05). Gantinya di Home: satu tombol **Pengaturan akun** (semua peran) yang membuka layar Akun yang sama, dan tombol **Buku alamat** (customer saja). Customer melihat Ganti nama, Ganti nomor WA, dan Ganti password; owner dan penjaga hanya Ganti password (TMN.01). Bukan tiga tombol terpisah.
- Bantuan bukan lagi item di menu Akun atau Lainnya, tetapi tombol di Home (`home.md` HM5), "Segera".
- Owner tidak lagi lewat menu Lainnya; Home dipakai semua peran.
- Aturan akun tidak berubah (AK7 sampai AK11). Menyembunyikan item per peran hanya kemudahan tampilan; server tetap yang menolak.

**Temuan di lapangan (terkait AK12):** link reset password dari dashboard sempat tampil "Link sudah tidak berlaku" pada klik pertama dari email. Log Auth menunjukkan link yang sama dibuka dua kali dalam satu detik (`/verify` 303 lalu 403 "One-time token not found"), jadi token sekali pakai sudah habis. Pembuka pertamanya belum diketahui (pemindai link atau klik ganda). Link yang sama berhasil saat disalin dan ditempel ke address bar. Pengaturan Auth normal (Site URL, Redirect URLs, masa berlaku 3600 detik). Satu `/recover` sempat 504 lalu berhasil diulang; diamati saja.

### 2026-11-07: Cara memakai link reset password (AK12)

Melengkapi AK12; alurnya tidak berubah.

- **Temuan dari ketua:** link reset yang diklik langsung dari email sering langsung tampil "Link sudah tidak berlaku", tetapi tidak selalu (kadang langsung berhasil). Link yang sama, bila **disalin lalu ditempel di tab baru**, selalu berhasil.
- **Cara yang dipakai:** saat pengguna menerima link reset, mintalah ia **menyalin link dari email dan menempelkannya di tab baru** (address bar), jangan diklik langsung.
- **Penyebab belum dipastikan.** Log Auth pernah menunjukkan link yang sama dibuka dua kali dalam satu detik, dan link hanya berlaku sekali pakai. Dugaan (belum dibuktikan): pemindai link di email membukanya lebih dulu.
