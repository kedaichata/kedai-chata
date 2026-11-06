/docs/akun-test.md

# 🧪 akun-test.md: Kasus Uji Fitur Akun

> Hanya kasus uji. **Tanpa hasil dan tanpa bukti** (`AGENTS.md` bagian 10 butir 2). Hanya dilampirkan di sesi tes bersama `AGENTS.md`, `akun.md`, dan `security.md`.
> Tes di production dengan **akun, nomor WA, dan alamat dummy**. Screenshot hanya bila diminta, dan **email, nomor, alamat nyata ditutup atau di-crop dulu**.
> Prioritas: P0 = login, peran, data pelanggan, keamanan. P1 = pendukung. P2 = tampilan.
> Sebelum tes setelah deploy: muat ulang keras (Cmd+Shift+R).
> Prefix ID: AKT. Rujukan keamanan memakai ID di `security.md` bagian 3.

## 1. Daftar, Masuk, Keluar

| ID     | Tes                                                           | Hasil yang benar                                       | Prioritas |
| ------ | ------------------------------------------------------------- | ------------------------------------------------------ | --------- |
| AKT-01 | Daftar dengan email dummy dan password valid.                 | Langsung masuk, lalu layar Lengkapi profil.            | P0        |
| AKT-02 | Daftar dengan email yang sudah terdaftar.                     | Pesan "Email ini sudah terdaftar. Silakan masuk."      | P1        |
| AKT-03 | Daftar dengan password bersimbol atau kurang dari 8 karakter. | Ditolak di HP tanpa panggilan server.                  | P1        |
| AKT-04 | Masuk dengan password salah.                                  | "Email atau password salah", tanpa galat mentah.       | P0        |
| AKT-05 | Tekan Keluar, lalu buka layar-layar akun.                     | Sesi berakhir; isian dan data layar sebelumnya kosong. | P0        |

## 2. Lengkapi profil (AK6 sampai AK8)

| ID     | Tes                                                                          | Hasil yang benar                                | Prioritas |
| ------ | ---------------------------------------------------------------------------- | ----------------------------------------------- | --------- |
| AKT-06 | Kirim profil dengan isian kosong atau WA tidak valid.                        | Ditolak di layar tanpa panggilan server.        | P1        |
| AKT-07 | Daftar, tutup tab sebelum simpan, lalu masuk lagi.                           | Layar Lengkapi profil muncul lagi.              | P0        |
| AKT-08 | Simpan profil valid, lalu keluar dan masuk lagi.                             | Berhasil; layar profil tidak muncul lagi.       | P0        |
| AKT-09 | Kirim `daftar_profil` dengan ID atau peran palsu di isi permintaan (SEC-06). | Diabaikan; profil terbentuk untuk akun sendiri. | P0        |

## 3. Buku alamat (AK9)

| ID     | Tes                                                                         | Hasil yang benar                                       | Prioritas |
| ------ | --------------------------------------------------------------------------- | ------------------------------------------------------ | --------- |
| AKT-10 | Tambah, ubah, nonaktifkan alamat; isi dengan teks berisi tag HTML (SEC-18). | Berfungsi; tag tampil sebagai teks biasa.              | P0        |
| AKT-11 | Lewati batas 5 alamat lewat konsol.                                         | Server menolak (409); tombol Tambah mati di 5 dari 5.  | P0        |
| AKT-12 | Nonaktifkan alamat aktif terakhir.                                          | Ditolak server (409); alamat tetap aktif.              | P0        |
| AKT-13 | Akun B mengubah atau menonaktifkan alamat akun A dengan ID-nya (SEC-09).    | 404 "Alamat tidak ditemukan."; alamat A tidak berubah. | P0        |
| AKT-14 | Alias kurang dari 3 huruf atau ID bukan UUID.                               | Ditolak 400.                                           | P1        |

## 4. Menu akun (AK7, AK8, AK11)

| ID     | Tes                                                                                                      | Hasil yang benar                                                                                   | Prioritas |
| ------ | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------- |
| AKT-15 | Ganti nama dan ganti WA lewat layar; WA diisi dengan tanda hubung atau awalan 08.                        | Berhasil; sapaan memakai nama baru; WA tersimpan seragam `62...`.                                  | P0        |
| AKT-16 | Nama 2 huruf dan WA tidak valid.                                                                         | Ditolak di layar tanpa panggilan server, dan juga ditolak server (400) lewat konsol.               | P1        |
| AKT-17 | Kirim ID atau pemilik palsu pada `ganti_nama` dan `ganti_wa` (SEC-06).                                   | Diabaikan; yang berubah akun sendiri.                                                              | P0        |
| AKT-18 | Ganti password: (a) password lama salah, (b) password baru bersimbol atau kurang dari 8, (c) data benar. | (a) ditolak, password tidak berubah; (b) ditolak di HP; (c) berhasil, lama ditolak, baru diterima. | P0        |
| AKT-19 | Keluar lalu buka layar Akun lagi.                                                                        | Isian WA dan password kosong; pesan lama tidak tersisa.                                            | P2        |

## 5. Lupa password (AK12)

| ID     | Tes                                                       | Hasil yang benar                                                           | Prioritas |
| ------ | --------------------------------------------------------- | -------------------------------------------------------------------------- | --------- |
| AKT-20 | Tekan "Lupa password?".                                   | Petunjuk menghubungi tim, tanpa nomor atau email.                          | P2        |
| AKT-21 | Kirim "Send password recovery" dari dashboard, buka link. | Layar Buat password baru; password valid diterima, login dengan yang baru. | P0        |
| AKT-22 | Buka link yang sama dua kali, atau link rusak.            | "Link sudah tidak berlaku. Hubungi tim untuk link baru."                   | P1        |
| AKT-23 | Tekan Batal di layar Buat password baru.                  | Sesi sementara ditutup, kembali ke layar Masuk.                            | P1        |

## 6. Staf: owner dan penjaga (AK4, AK5)

| ID     | Tes                                                                                                            | Hasil yang benar                                                         | Prioritas |
| ------ | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | --------- |
| AKT-24 | Masuk sebagai owner uji dan penjaga uji.                                                                       | Peran terbaca benar; layar Lengkapi profil tidak muncul.                 | P0        |
| AKT-25 | Staf memanggil `daftar_profil`, `alamat_simpan`, `alamat_nonaktif`, `ganti_nama`, `ganti_wa` (SEC-07, SEC-08). | Semua 403 "Aksi ini hanya untuk customer."; tidak ada data terbentuk.    | P0        |
| AKT-26 | Staf mengganti password lewat layar Akun.                                                                      | Berhasil; password lama ditolak, baru diterima.                          | P1        |
| AKT-27 | Reset password akun staf lewat link dari dashboard.                                                            | Sama seperti AKT-21.                                                     | P1        |
| AKT-28 | Nonaktifkan staf lewat SQL template, lalu staf memakai aplikasi; aktifkan kembali (SEC-26).                    | Staf nonaktif 403 di panggilan berikutnya; setelah aktif kembali normal. | P0        |
| AKT-29 | Cari jalur menjadi staf dari aplikasi (SEC-26).                                                                | Tidak ada jalur; akun baru selalu customer.                              | P0        |

## 7. Akses dan keamanan (rujukan `security.md`)

| ID     | Tes                                                                                           | Rujukan                | Prioritas |
| ------ | --------------------------------------------------------------------------------------------- | ---------------------- | --------- |
| AKT-30 | `kedai` tanpa token, dengan token palsu, dan dengan kunci Supabase atau JWT `anon` lama.      | SEC-01, SEC-02, SEC-32 | P0        |
| AKT-31 | Baca tabel dan panggil fungsi SQL langsung dengan kunci publishable (tanpa dan dengan login). | SEC-03, SEC-04         | P0        |
| AKT-32 | Login asli dari GitHub Pages memanggil `kedai` (termasuk CORS).                               | SEC-33                 | P0        |
| AKT-33 | Pengaturan Auth: Confirm email mati, minimal password 8, Secure password change mati.         | SEC-28                 | P1        |
| AKT-34 | Email reset terkirim dan link membuka layar Buat password baru.                               | SEC-24                 | P0        |
| AKT-35 | Galat jaringan atau token kedaluwarsa menampilkan pesan umum Bahasa Indonesia.                | SEC-27                 | P1        |

## 8. PWA dan perangkat

| ID     | Tes                                  | Hasil yang benar                                                   | Prioritas |
| ------ | ------------------------------------ | ------------------------------------------------------------------ | --------- |
| AKT-36 | Setelah update, buka di HP Android.  | Versi baru muncul; layar akun terbaca dan tombol cukup besar.      | P1        |
| AKT-37 | Matikan internet lalu buka aplikasi. | Aplikasi terbuka dengan layar Offline; login tetap butuh internet. | P2        |
