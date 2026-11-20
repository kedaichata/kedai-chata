/docs/analitik.md

# 📊 analitik.md: Analitik Kunjungan (Umami Cloud), Fase 1

> **Versi 1.0 (20 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Asal usul: saran teman ketua di bidang IT (Cloudflare Web Analytics Beacon). Setelah melihat struktur aplikasi (satu `index.html`, layar tidak mengubah alamat), dipilih **Umami Cloud** supaya layar bisa dibedakan. Tujuan ketua: tahu **berapa yang membuka** dan **berapa yang mendaftar**. Fase 1 sengaja kecil: **layar Masuk, Pengenalan, Bantuan, dan Belanja**.
> **Status:** Belum ada yang dikerjakan. Butir **(bawaan)** = pilihan penulis yang belum ditanyakan satu per satu; ketua boleh mengubahnya sebelum dikerjakan.
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini + `security.md`**, serta `public/index.html`, `public/sw.js`, dan berkas JS layar yang disentuh bila ada (Pengenalan, Bantuan, Belanja, `akun.js`). Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 9.
> **Tanpa kode.** **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Prefix sheet:** ANL (bawaan).

---

## 1. Tujuan

Ketua dan owner bisa melihat **angka kunjungan nyata** pada fase awal pemakaian: berapa orang membuka layar Masuk, berapa yang membuka layar Daftar, dan apakah layar Pengenalan, Bantuan, dan Belanja dipakai. Angka **"yang daftar"** tidak diambil dari Umami, melainkan dari data akun di Supabase (AN10).

Fitur ini **hanya mengirim penanda anonim "layar ini dibuka" ke layanan luar**. Tidak ada tabel, fungsi SQL, atau aksi `kedai` baru. Alur order, pembayaran, dan peran **tidak berubah**.

---

## 2. Tabel Keputusan

| No   | Keputusan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Catatan                                                                                                                                                                                                                                                                                                                                                                        |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AN1  | **Alat: Umami Cloud, paket Hobby (gratis).** Akun Umami milik **ketua**, satu website. Batas Hobby (screenshot ketua, 20 Nov 2026): 100 ribu event per bulan, 1 website, riwayat 6 bulan. **Self-host dilarang** (`AGENTS.md` bagian 3). Cloudflare Web Analytics tidak dipilih.                                                                                                                                                                                                                                                                                                                                                                              | Keputusan ketua 20 Nov 2026. Alasan: aplikasi satu `index.html` tanpa ubah alamat, jadi penghitung per alamat tidak membedakan layar. Alasan lain belum tercatat.                                                                                                                                                                                                              |
| AN2  | **Cakupan fase 1: layar Masuk, Pengenalan, Bantuan, Belanja.** Home, alur order, dan layar lain **tidak dilacak** di fase ini.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Keputusan ketua (rencana "fase Umami 1").                                                                                                                                                                                                                                                                                                                                      |
| AN3  | **Layar Masuk = kunjungan otomatis** dari script (tanpa kode tambahan). **Event kustom (bawaan):** `buka-daftar`, `buka-pengenalan`, `buka-bantuan`, `buka-belanja`. Event **tanpa isian tambahan**.                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Corong yang disetujui ketua: buka Masuk, buka Daftar, akun jadi (dihitung di Supabase). Masuk dan Daftar adalah **dua layar terpisah** (`akun.md` AK6, AKN.05).                                                                                                                                                                                                                |
| AN4  | **Tidak ada data pribadi di event.** Dilarang mengirim: id akun, nama, email, nomor WA, alamat, peran, nama item atau nominal Belanja, isi pertanyaan Bantuan. **`umami.identify()` tidak dipakai.** Event hanya berupa nama layar.                                                                                                                                                                                                                                                                                                                                                                                                                           | `AGENTS.md` bagian 2 butir 11 dan bagian 7. Belanja khusus owner dan menyangkut uang, jadi hanya "dibuka".                                                                                                                                                                                                                                                                     |
| AN5  | **Pengaturan script (bawaan):** `data-exclude-hash="true"` (link reset password membawa token di bagian `#`), `data-exclude-search="true"`, dan `data-domains` berisi **hostname GitHub Pages saja** (supaya uji dari komputer sendiri tidak ikut terhitung). `data-do-not-track` **tidak dipasang** supaya angka tidak berkurang.                                                                                                                                                                                                                                                                                                                            | Nama opsi dicek di dokumentasi Umami 20 Nov 2026. Ketua boleh memasang Do Not Track bila mau. `akun.js` membaca bagian `#` link reset lalu membersihkan alamat peramban (`akun.md` Handoff AKN.09); apakah script analitik sempat membaca alamat sebelum dibersihkan **belum diketahui** dan bergantung urutan muat, jadi `data-exclude-hash` tetap wajib dan dites di SEC-50. |
| AN6  | **Script disalin ke `public/lib/`** dan dikirim ke Umami Cloud lewat `data-host-url`, supaya **versinya dipatok** (security.md aturan 14) dan tidak butuh pengecualian "tanpa CDN". **Belum dicek apakah Cloud menerima data dari salinan lokal; diuji di ANL.02.** Bila gagal: muat dari domain Umami dengan pengecualian khusus (blok susulan).                                                                                                                                                                                                                                                                                                             | Dokumentasi Umami: alamat script resmi tidak bernomor versi (isinya bisa berubah sewaktu-waktu).                                                                                                                                                                                                                                                                               |
| AN7  | **Satu berkas pembungkus `public/analitik.js`** dengan satu fungsi (`KedaiAnalitik.lacak("nama")`). Bila script Umami tidak ada (offline, ad-blocker, gagal dimuat), fungsi **diam saja**: tanpa galat di layar, tanpa menahan alur, tanpa menunggu balasan. Layar memanggilnya dengan **satu baris tambahan**. **Pilihan pertama (bawaan): tanpa menyentuh berkas layar sama sekali**, memakai pengamat atribut `hidden` seperti pola `qris.js` (Handoff #2 `qris.md`); satu baris di berkas layar hanya bila pengamat tidak memungkinkan. Khusus layar Daftar yang dikelola `akun.js` (kategori login), pengamat lebih disukai daripada mengubah `akun.js`. | `AGENTS.md` bagian 7 (galat tidak tampil). Ibu-ibu tidak boleh terjebak karena analitik.                                                                                                                                                                                                                                                                                       |
| AN8  | **Tag script ditambah di `public/index.html`** (hanya tambahan, kode lama tidak dihapus). Karena menyentuh layar Masuk, ini **kategori login**: wajib penjelasan dampak dan konfirmasi singkat.                                                                                                                                                                                                                                                                                                                                                                                                                                                               | `AGENTS.md` bagian 7. Preseden: blok Turnstile dan Pengenalan.                                                                                                                                                                                                                                                                                                                 |
| AN9  | **`analitik.js` dan salinan script wajib didaftarkan di cache `sw.js`, versi cache naik dari versi terakhir** (**butuh "OK"**). `sw.js` tetap hanya menangani berkas dari domain sendiri; **panggilan ke Umami tidak boleh dicegat atau di-cache**.                                                                                                                                                                                                                                                                                                                                                                                                           | `AGENTS.md` bagian 7, security.md aturan 11.                                                                                                                                                                                                                                                                                                                                   |
| AN10 | **"Yang daftar" dihitung dari Supabase**, bukan Umami: jumlah akun customer baru dalam periode, **tanpa akun staf dan akun dummy**. **Pelanggan tanpa akun yang dicatat owner lewat wizard tidak ikut dihitung.** Query baca-saja dijalankan ketua di SQL Editor saat review. Tidak ada tabel atau aksi baru.                                                                                                                                                                                                                                                                                                                                                 | Keputusan ketua: daftar bisa dilihat dari data Supabase.                                                                                                                                                                                                                                                                                                                       |
| AN11 | **Cara membaca angka:** Umami menghitung **pengunjung, bukan orang** (satu orang bisa dua kali dari WA lalu Chrome); ad-blocker membuat angka sedikit lebih rendah; yang sudah punya akun dan masuk ulang ikut terhitung. Angka dipakai sebagai **gambaran kasar**, bukan angka konversi murni.                                                                                                                                                                                                                                                                                                                                                               | Penjelasan sesi strategi 20 Nov 2026.                                                                                                                                                                                                                                                                                                                                          |
| AN12 | **Data tes ikut masuk Umami.** Catat tanggal tes. Angka yang dianalisis **dimulai dari tanggal LNC.03** (bawaan). Cara menghapus data tes di Umami **belum diketahui**.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `data-domains` (AN5) mengurangi, tidak menghilangkan, data tes dari alamat asli.                                                                                                                                                                                                                                                                                               |
| AN13 | **Jadwal: dikejar sebelum LNC.03 (Senin 23 Nov 2026)**, keputusan ketua. **Bila ANL.06 belum lulus sebelum LNC.03, fitur ditunda; LNC.03 tidak menunggu fitur ini (bawaan).**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Ketua yang memutuskan bila ragu.                                                                                                                                                                                                                                                                                                                                               |
| AN14 | **Tetap di paket gratis.** Perkiraan kasar fase 1 sekitar belasan ribu event per bulan, jauh di bawah 100 ribu. Bila mendekati batas, **kurangi event, bukan beralih ke paket berbayar**. Apa yang terjadi bila melewati batas **belum dicek**.                                                                                                                                                                                                                                                                                                                                                                                                               | `AGENTS.md` bagian 4 (free tier).                                                                                                                                                                                                                                                                                                                                              |
| AN15 | **Pemantauan 2 sampai 4 minggu**, lalu dibahas di **LNC.05** (review pemakaian), termasuk persentase pengguna iPhone dari data OS (bahan butir iPhone di `AGENTS.md` bagian 10) dan bahan evaluasi pindah hosting (blok `bonus.md` 18 Nov).                                                                                                                                                                                                                                                                                                                                                                                                                   | Angka OS memberi jumlah nyata pengguna iPhone; sebelumnya hanya dihitung dari keluhan.                                                                                                                                                                                                                                                                                         |

---

## 3. Alur

1. Pengunjung membuka alamat aplikasi, layar Masuk tampil, script mengirim satu kunjungan anonim (alamat tanpa bagian `#` dan `?`).
2. Pengunjung membuka layar Daftar: `analitik.js` mengirim event `buka-daftar`. Akun yang jadi tercatat di Supabase seperti biasa (tanpa perubahan).
3. Pengguna membuka Pengenalan, Bantuan, atau Belanja: satu event bernama layar itu dikirim. Tidak ada isian lain.
4. Ketua membuka dashboard Umami untuk melihat kunjungan, asal, perangkat, OS, dan jumlah event per layar.
5. Saat review, ketua menjalankan query baca-saja di Supabase untuk jumlah akun customer baru (AN10), lalu membandingkannya dengan kunjungan.

Bila script gagal dimuat, alur 1 sampai 3 tetap berjalan normal tanpa pesan apa pun.

---

## 4. Yang dibuat

| Komponen                                             | Isi                                                                                                                                      |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Akun dan website Umami                               | Dibuat ketua (profil browser terpisah, `AGENTS.md` bagian 8). Website ID bukan rahasia, tetapi tidak ditempel ke chat tanpa perlu.       |
| `public/lib/` (salinan script Umami)                 | Salinan berkas script, tanggal salinan dicatat di blok susulan (AN6).                                                                    |
| `public/analitik.js` (baru)                          | Pembungkus `lacak(nama)` yang aman bila script tidak ada (AN7).                                                                          |
| `public/index.html`                                  | Tag script dengan pengaturan AN5 (hanya tambahan, kategori login).                                                                       |
| Berkas JS Pengenalan, Bantuan, Belanja, layar Daftar | Pilihan pertama: tidak disentuh (pengamat di `analitik.js`, AN7). Bila perlu: satu baris pemanggilan `lacak` per layar (hanya tambahan). |
| `public/sw.js`                                       | Daftar cache bertambah dua berkas, versi cache naik (**butuh "OK"**).                                                                    |

---

## 5. Urutan Pekerjaan (untuk TODO sheet, prefix ANL)

| ID     | Pekerjaan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Tipe      | Prioritas |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------- |
| ANL.01 | Siapkan akun Umami Cloud milik ketua dan satu website; catat Website ID. Cek di situs resmi: perilaku bila melewati 100 ribu event, cara menghapus data tes, dan alamat script untuk disalin (bagian ketua).                                                                                                                                                                                                                                                                                             | Low-Risk  | P1        |
| ANL.02 | Salinan script ke `public/lib/` dan `public/analitik.js`; tag script di `index.html` (kategori login, konfirmasi singkat). Uji kecil dengan akun dummy: kunjungan muncul di dashboard dari salinan lokal. Bila gagal, putuskan cadangan (AN6) sebelum lanjut.                                                                                                                                                                                                                                            | High-Risk | P1        |
| ANL.03 | ⚠️ Daftarkan `analitik.js` dan salinan script di cache `sw.js`, naikkan versi cache (**butuh "OK"**). Dipush bersama ANL.02 agar tidak ada berkas yang belum terdaftar.                                                                                                                                                                                                                                                                                                                                  | High-Risk | P1        |
| ANL.04 | Pasang pemanggilan `lacak` di layar Pengenalan, Bantuan, dan Belanja (satu baris per layar, hanya tambahan, tanpa data tambahan).                                                                                                                                                                                                                                                                                                                                                                        | Low-Risk  | P1        |
| ANL.05 | Pasang event `buka-daftar` saat layar Daftar tampil, lewat pengamat di `analitik.js` (AN7); satu baris di `akun.js` hanya bila pengamat tidak memungkinkan (kategori login, konfirmasi singkat).                                                                                                                                                                                                                                                                                                         | Low-Risk  | P1        |
| ANL.06 | Tes: kunjungan dan keempat event muncul bernama layar saja; uji dari komputer sendiri tidak terhitung; link reset password dummy (cara salin-tempel, AK12) tidak membawa bagian `#` ke Umami; script diblokir atau mode pesawat tidak memunculkan galat; Keluar dan masuk normal (Turnstile tetap jalan). Akun uji sudah dinonaktifkan di LNC.01f: layar Daftar dan Pengenalan cukup dibuka tanpa membuat akun; Bantuan dan Belanja dibuka dengan akun asli yang sudah bisa login (hanya membuka layar). | High-Risk | P1        |
| ANL.07 | Catat tanggal tes dan tanggal mulai angka dianalisis (tanggal LNC.03). Catatan manusia, tidak ada kode.                                                                                                                                                                                                                                                                                                                                                                                                  | Low-Risk  | P2        |
| ANL.08 | Review 2 sampai 4 minggu bersama LNC.05: kunjungan, perangkat dan OS (hitung iPhone), event per layar, dibandingkan jumlah akun customer baru dari Supabase (AN10). Putuskan lanjut ke fase 2 atau berhenti.                                                                                                                                                                                                                                                                                             | Low-Risk  | P2        |

Urutan: ANL.01, ANL.02 bersama ANL.03, ANL.04 dan ANL.05, ANL.06, ANL.07. ANL.08 setelah LNC.04. Target ANL.06 lulus: sebelum LNC.03 (AN13).

---

## 6. Aturan yang paling sering terlanggar

| Aturan                                                                                | Akibat bila dilanggar                                                      |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Mengirim data pribadi atau isian layar (nama item, nominal, pertanyaan) di event      | Data pribadi keluar ke layanan luar (AN4, `AGENTS.md` bagian 2 butir 11).  |
| Memakai `umami.identify()` atau id akun                                               | Kunjungan jadi bisa dihubungkan ke orang (AN4).                            |
| Lupa `data-exclude-hash`                                                              | Token link reset password ikut terkirim ke Umami (AN5).                    |
| Memanggil `Umami` langsung dari layar, bukan lewat `analitik.js`                      | Galat saat script diblokir atau offline; ibu-ibu terjebak (AN7).           |
| Berkas baru tidak didaftarkan di cache `sw.js`, atau `sw.js` mencegat panggilan Umami | Gagal saat offline, atau data kunjungan aneh (AN9, security.md aturan 11). |
| Menyentuh `index.html` atau `sw.js` tanpa penjelasan dampak dan "OK"                  | Melanggar `AGENTS.md` bagian 7 (AN8, AN9).                                 |
| Mencampur akun staf, dummy, dan pelanggan tanpa akun ke angka "yang daftar"           | Angka konversi menyesatkan (AN10).                                         |
| Membuka dashboard atau membuat akun Umami di sesi browser adik ketua                  | Melanggar aturan anti-nyasar (`AGENTS.md` bagian 8).                       |
| Beralih ke paket berbayar atau self-host tanpa keputusan baru                         | Melanggar batas gratis dan larangan self-host (AN1, AN14).                 |

---

## 7. Dampak dan Pembatalan

- **Tidak menyentuh data:** tidak ada tabel, fungsi, atau Edge Function baru. Kegagalan analitik tidak boleh mengubah order, login, atau status apa pun.
- **Fitur lain yang berubah sifatnya:** Pengenalan sebelumnya dicatat "tanpa panggilan jaringan"; sekarang layar itu mengirim satu event anonim ke Umami. Dicatat di blok susulan (yang paling akhir menang).
- **Pembatalan:** hapus tag script dari `index.html`, hapus pemanggilan `lacak` (atau biarkan: tanpa script, fungsi diam), keluarkan dua berkas dari cache `sw.js`, lalu nonaktifkan website di dashboard Umami. Data yang sudah terkirim tetap di Umami sampai dihapus ketua.
- **Dokumen lain yang perlu blok susulan:** `AGENTS.md` (peta bagian 5, rencana versi, bagian 4 batas Umami), `features.md` (urutan versi 1 dan LNC.05), `security.md` (SEC baru), `akun.md` (layar Masuk memuat script), `pengenalan.md`, `bantuan.md`, `belanja.md` (satu event per layar), `bonus.md` (kandidat fase 2 dan bahan evaluasi hosting).
- **Peluncuran:** tidak boleh memundurkan LNC.03 (AN13).

---

## 8. Ditunda

- **Fase 2:** Home, langkah di alur order (buka menu, kirim order), dan layar lain.
- **Corong lebih rinci** dan perbandingan sumber kunjungan (WA, Instagram, lainnya) lewat tautan bertanda.
- **Kebijakan pembatasan data** bila kuota 100 ribu event mendekati batas.
- **Pembersihan data tes di Umami** bila ternyata ada caranya (AN12).
- **Domain sendiri** dan **pindah hosting**: keputusan terpisah (blok `bonus.md` 18 Nov); angka kunjungan hanya bahan pertimbangan.
- **Content Security Policy:** bila kelak dipasang, domain Umami perlu diizinkan.

**Tidak dikerjakan:** pelacakan per orang, `umami.identify()`, rekaman layar atau peta panas, dan self-host Umami.

---

## 9. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

_(belum ada blok)_

### 2026-11-20: Akun untuk tes Umami (ANL.06, SEC-50, SEC-51)

Keputusan ketua (20 Nov 2026), disetujui seluruhnya oleh ketua. Saat blok ini ditulis belum ada kode Umami dan belum ada tes Umami yang dikerjakan. Alasan ketua selain yang tertulis belum tercatat.

- **Akun tes: dua akun asli, tanpa akun dummy baru.** (1) Akun customer asli milik ketua (email asli, tidak ditulis di md), **sudah dibuat 20 Nov 2026 dan login-nya sudah dicoba berhasil**. (2) Akun owner ibu ketua (sudah pernah login, recovery sudah dikirim).
- **Tanpa order.** Fase 1 hanya melacak lima layar (AN2), jadi tes tidak membuat order. Tes juga tidak membuat catatan Belanja (data Belanja baru dibersihkan di LNC.01c); layar Belanja hanya dibuka.
- **Pembagian tes:**
  - Tanpa akun: Masuk, Daftar (dibuka, tidak disubmit), Pengenalan, uji dari komputer sendiri, script diblokir atau mode pesawat.
  - Akun customer ketua: Bantuan, keluar dan masuk dengan Turnstile, link reset password (SEC-50), offline dan versi cache baru.
  - Akun owner ibu ketua: Belanja, dibuka satu kali lalu logout.
- **Link reset password dites dengan akun customer ketua, bukan akun owner.** Link sekali pakai, dan bila `data-exclude-hash` bocor, token yang terkirim ke Umami milik akun customer, bukan akun owner. Ini menggantikan kata "dummy" di ANL.06 dan SEC-50, karena akun dummy sudah tidak ada.
- **Angka "yang daftar" (AN10):** akun customer ketua bukan dummy dan bukan staf, jadi tidak otomatis terkecualikan. Ia dibuat 20 Nov 2026, **sebelum LNC.03**, sehingga di luar rentang analisis (AN12). Tetap dicatat di ANL.07 agar tidak lupa bila rentang analisis berubah. Akun ini **tidak dibersihkan** sebagai akun dummy (baris "bersihkan sebelum LNC.04" di SEC-50 tidak berlaku untuknya).
- **Data tes ikut masuk Umami** dan cara menghapusnya belum diketahui (AN12). Jumlah tes dibatasi; tanggal dan jam tiap tes dicatat.
- **Dua tes tambahan untuk ANL.06:** satu kali buka layar harus menjadi satu event (pengamat `hidden` bisa menembak ganda); dan karena `sw.js` disentuh, cek versi cache baru muncul serta aplikasi tetap terbuka offline (`AGENTS.md` bagian 10 butir 6).
- **Bukti** mengikuti SEC-50 dan SEC-51 (dashboard Umami atau permintaan jaringan, pencarian kode, screenshot). Email dan data pribadi disamarkan sebelum ditempel ke chat (`AGENTS.md` bagian 2 butir 11). Bukti tidak disimpan di md.
- **Pertentangan dengan catatan lama:** kata "dummy" di ANL.06 dan SEC-50 (link reset, akun) tidak berlaku; yang dipakai akun asli di atas. Yang paling akhir menang.

### Handoff #1 | 2026-11-20 | Ketua

**Tugas:** ANL.01 (siapkan akun Umami Cloud dan satu website). **Selesai.** Ditulis dari sesi tanya jawab singkat dengan ketua; tidak ada kode dan tidak ada berkas repo yang diubah.

**Hasil:**

- Akun Umami Cloud milik ketua, dibuat di jendela privat (aturan anti-nyasar, `AGENTS.md` bagian 8). Wilayah data **United States** (tidak bisa diubah setelah dipilih), paket **Hobby**. Alasan memilih United States belum tercatat.
- Satu website "Kedai ChATA", domain `kedaichata.github.io` (hostname saja, tanpa path). Website ID disimpan ketua di password manager, tidak di repo, md, atau chat.
- Alamat script untuk disalin: `https://cloud.umami.is/script.js` (tanpa nomor versi, jadi isinya bisa berubah; sesuai AN6 perlu dipatok saat disalin).
- Lewat 100 ribu event: FAQ Umami hanya menjelaskan paket berbayar (event tambahan ditagih, data tidak terputus). **Perilaku Hobby belum jelas.** AN14 tetap berlaku: mendekati batas, kurangi event, jangan upgrade.
- Cara hitung usage menurut FAQ Umami: pageview + event kustom + tiap properti event yang disimpan.
- Menghapus data tes: **ada tombol "Reset" di Settings website** (semua statistik terhapus, pengaturan tetap). Belum dipakai.

**Keputusan baru:** tidak ada keputusan baru dari ketua di sesi ini. Pilihan Hobby sudah sesuai AN1.

**Pertentangan dengan isi lama (yang paling akhir menang):**

- AN12 menulis cara menghapus data tes "belum diketahui". Kini diketahui: tombol Reset di Settings website. Kapan Reset dipakai (misalnya sebelum LNC.03) belum diputuskan.
- AN2 membatasi pelacakan ke empat layar, tetapi script Umami mencatat pageview otomatis tiap `index.html` dibuka, termasuk pengguna yang sudah login membuka aplikasi. Perkiraan "belasan ribu event per bulan" di AN14 jadi perlu dicek ulang dengan angka usage nyata di dashboard setelah jalan.

**Belum beres:**

- Perilaku paket Hobby saat lewat 100 ribu event.
- Apakah Umami Cloud menerima data dari salinan script lokal di `public/lib/` (AN6), diuji di ANL.02.
- Apakah `data-host-url` perlu diisi untuk salinan lokal, diuji di ANL.02.
- Keputusan kapan memakai Reset untuk data tes.

**Saran giliran berikutnya:** ANL.02 dan ANL.03 dikerjakan bersama (satu push). Lampirkan `AGENTS.md`, `analitik.md`, `security.md`, `public/index.html`, `public/sw.js`, dan `public/akun.js`. Salinan script dari alamat di atas dibuat ketua dengan versi dipatok, tanggal salinan dicatat. `index.html` (kategori login) dan `sw.js` tetap butuh penjelasan dampak dan "OK" ketua sebelum diubah. Website ID ditempel ke chat hanya saat dibutuhkan di ANL.02.

### Handoff #2 | 2026-11-20 | Ketua

**Tugas:** ANL.02 dan ANL.03 (kode). Sudah di-push (commit 5d4731a, tanpa `[skip ci]`). **Tes belum dikerjakan.**

**Posisi:** kode selesai dan sudah terbit. Tinggal tes ANL.02 (kunjungan dari salinan lokal muncul di dashboard), lalu ANL.06. ANL.04 dan ANL.05 kodenya ikut ada di `analitik.js` (pengamat), tetapi belum dites, jadi belum dicentang.

**Berkas yang berubah:** `public/analitik.js` (baru), `public/lib/umami.js` (baru, salinan unduhan 20 Nov 2026), `public/index.html` (hanya tambah dua tag script), `public/sw.js` (cache `chata-v37`, dua berkas masuk daftar cache).

**Keputusan baru:**

- OK ketua untuk perubahan `index.html` (kategori login) dan `sw.js`: diberikan 20 Nov 2026 di sesi ini.
- Opsi pembatas event dipilih A+B: (A) pantau usage di dashboard tiap minggu, (B) tiap nama event dikirim maksimal sekali per tab (di memori, bukan localStorage). Pageview otomatis Umami tidak dibatasi; opsi C (`data-auto-pageview="false"`) ada bila kelak dibutuhkan.
- Tag Umami: `data-domains` = hostname GitHub Pages, `data-exclude-hash` dan `data-exclude-search` = true. `data-host-url` tidak diisi (bawaan script: gateway.umami.is). `data-errors` tidak dipasang (script ini punya pelacakan error; bila dinyalakan, pesan error ikut terkirim).

**Pertentangan dengan isi lama (yang paling akhir menang):**

- AN7 menyebut semua layar lewat pengamat `hidden`. Belanja memakai pendengar klik pada `#gim-menu-belanja`, karena layarnya baru dibuat `belanja.js` saat pertama dibuka.
- AN3 tidak membatasi jumlah event; kini maksimal satu kali per nama per tab.

**Belum beres:**

- Asumsi belum terbukti: `layar-pengenalan` dan `panel-bantuan` berganti lewat atribut `hidden` (berkas `pengenalan.js`, `bantuan.js`, `kerangka.js` belum dibaca). Bila event tidak muncul di tes, kirim berkas itu.
- Apakah Umami Cloud menerima data dari salinan lokal: belum diuji.
- SEC-50 dan SEC-51, serta tes tambahan (satu buka layar = satu event; cache v37 muncul dan offline tetap jalan): belum.
- Salah copas `index.html` ke `inbox.js` sempat terjadi di Mac; dipulihkan dengan `git restore`, tidak ikut commit.

**Saran giliran berikutnya:** lampirkan `AGENTS.md`, `analitik.md`, `security.md`. Mulai tes ANL.02 dari alamat Pages asli (jendela privat, belum login): buka Daftar, Masuk, Pengenalan; cek Realtime dan Events di Umami (harus 1 kunjungan, buka-daftar 1, buka-pengenalan 1). Lalu ANL.06 sesuai blok akun tes 20 Nov.

### Handoff #3 | 2026-11-20 | Ketua

**Tugas:** tes ANL.02 sampai ANL.05 dan sebagian ANL.06 / SEC-51. Tidak ada kode dan tidak ada berkas repo yang diubah di sesi ini. **ANL.01 sampai ANL.05 sudah dicentang di sheet.** ANL.06, ANL.07, SEC-50, dan SEC-51 belum.

**Hasil tes (di production, jendela privat, tanpa bukti disimpan):**

- ANL.02: kunjungan masuk dashboard dari salinan lokal `public/lib/umami.js`. Terbukti **Umami Cloud menerima data dari salinan lokal** dan **`data-host-url` tidak perlu diisi**.
- ANL.03: cache `chata-v37` berisi `analitik.js` dan `lib/umami.js`. Dengan Offline dicentang, aplikasi tetap terbuka dan menampilkan layar "Tidak ada internet"; setelah Offline dimatikan, aplikasi kembali normal.
- ANL.04 dan ANL.05: keempat event muncul dengan nama layar saja: `buka-daftar`, `buka-pengenalan` (tanpa akun), `buka-bantuan` (akun customer ketua), `buka-belanja` (akun owner ibu ketua, dibuka satu kali lalu logout). Pengamat `hidden` terbukti jalan untuk Daftar, Pengenalan, dan Bantuan; pendengar klik terbukti jalan untuk Belanja.
- Script diblokir (SEC-51, sebagian): layar Daftar dan Pengenalan tetap normal tanpa pesan galat di layar, dan tidak ada event baru masuk ke Umami. Console hanya menampilkan baris blokir DevTools dan baris CSP/font dari bingkai Turnstile; tidak ada baris yang menyebut `analitik.js`. Bahwa baris Turnstile itu sudah ada sebelum Umami dipasang adalah dugaan, belum dibandingkan.

**Keputusan baru:** tidak ada keputusan baru dari ketua.

**Pertentangan dengan isi lama (yang paling akhir menang):**

- Butir "belum beres" Handoff #2 sudah terjawab: Umami Cloud menerima salinan lokal, `data-host-url` tidak perlu, dan asumsi atribut `hidden` benar untuk `layar-pengenalan` dan `panel-bantuan`.
- Tes blokir script lewat DevTools **hanya mempan bila "Bypass for network" dicentang** (Application, Service workers). Tanpa itu, `sw.js` menyajikan `umami.js` dari cache, aturan Block tertulis "0 affected", dan Umami tetap mencatat satu pageview (itu sebabnya sempat ada Views 2 di tes blokir).
- Setelah pemblokiran dimatikan, event baru (`buka-bantuan`) baru muncul **setelah halaman di-reload**.

**Data tes di Umami:** sekitar 09:12 sampai 09:56 (jam dashboard), 20 Nov 2026. Posisi akhir: Visitors 2, Visits 2, Events 4. Tombol Reset di Settings website tersedia (AN12), **kapan dipakai belum diputuskan**. Catat di ANL.07.

**Belum beres:**

- **SEC-50 (P0) belum dikerjakan.** Dites dengan akun customer asli ketua sesuai blok akun tes 20 Nov. Langkah rinci ada di `akun.md` AK12 (salin-tempel link di tab baru).
- Sisa SEC-51: mode pesawat; uji dari alamat selain GitHub Pages (tidak boleh terhitung); pencarian di kode memastikan `umami.identify` tidak dipanggil di mana pun; pastikan `sw.js` tidak mencegat atau menyimpan panggilan ke Umami (aturan 11, perlu membaca `sw.js`).
- Tes "Keluar dan masuk normal dengan Turnstile" untuk ANL.06 belum dicatat hasilnya.
- Belum diuji: membuka layar yang sama dua kali di tab yang sama harus tetap 1 event (pembatas maksimal sekali per nama per tab menutupi kemungkinan pengamat menembak ganda).
- ANL.06 dan ANL.07 menunggu hal-hal di atas.

**Saran giliran berikutnya:** lampirkan `AGENTS.md`, `analitik.md`, `security.md`, **`akun.md`**, `public/analitik.js`, `public/sw.js`, dan `public/akun.js`. Mulai dari SEC-50 (jendela privat baru, akun customer ketua, tanpa Bypass atau Block), lalu sisa SEC-51, lalu centang ANL.06 dan catat ANL.07. Dashboard Umami dibuka hanya di jendela privat, bukan sesi adik ketua. Email dan data pribadi disamarkan sebelum ditempel ke chat.

### Handoff #4 | 2026-11-20 | Ketua

**Tugas:** tes SEC-50 dan sebagian SEC-51 / ANL.06. Tidak ada kode dan tidak ada berkas repo yang diubah di sesi ini. **SEC-50 lulus dan sudah dicentang di sheet.** ANL.06, ANL.07, dan SEC-51 belum dicentang.

**Hasil tes (di production, jendela Incognito, bukti diperiksa di chat dan tidak disimpan):**

- **SEC-50 (P0) lulus.** Link reset password asli dari akun customer ketua ditempel di tab baru (DevTools sudah terbuka sebelum link ditempel, jadi `akun.js` benar-benar membaca token). Layar "Buat password baru" tampil. Payload request `send` ke Umami: `url` = alamat aplikasi saja, tanpa `#`, `access_token`, `type=recovery`, maupun `?`; `referrer` kosong; tidak ada token, email, atau id akun. Password tidak diganti, link tidak terpakai.
- **SEC-51, pencarian kode (hanya `.js` dan `.html` di `public/`, di luar `lib/`):** `identify` hanya muncul di dua komentar (`index.html:2380`, `analitik.js:20`), tidak ada pemanggilan. `umami` di luar `analitik.js` hanya muncul di komentar yang sama. Tidak ada layar yang memanggil Umami langsung. Event hanya nama layar (`POLA_NAMA` di `analitik.js`).
- **SEC-51, `sw.js`:** dibaca dari berkas. Hanya menangani GET dari domain sendiri; panggilan data ke Umami (POST, lintas domain) tidak dicegat dan tidak disimpan. Yang masuk cache hanya salinan `lib/umami.js`.
- **Mode offline (Network, Offline):** layar Masuk, Daftar, dan Pengenalan tampil normal tanpa pesan galat di layar. `umami.js` dimuat dari ServiceWorker. Request `send` gagal dengan `ERR_INTERNET_DISCONNECTED` (wajar). Tidak ada baris Console yang menyebut `analitik.js`.
- **Layar yang sama dibuka dua kali di satu tab:** Daftar dan Pengenalan tetap 1 event (jumlah request `send` tidak bertambah). Bantuan dan Belanja **belum** dites dua kali.

**Keputusan baru:** tidak ada keputusan baru dari ketua. Tes alamat selain GitHub Pages memakai server file sementara di Mac (`python3 -m http.server 8000` dari folder `public/`), sudah dimatikan (Ctrl+C). Tidak ada perubahan pada repo.

**Pertentangan dengan isi lama (yang paling akhir menang):** tidak ada pertentangan baru.

**Data tes di Umami:** menambah pageview dan event dari sesi ini (setelah catatan Handoff #3), sampai sekitar pukul 10:41 (jam Mac ketua). Angka akhir di dashboard tidak dicek. Tombol Reset di Settings website tersedia (AN12), **kapan dipakai belum diputuskan**. Catat di ANL.07.

**Belum beres:**

- **SEC-51, uji alamat selain GitHub Pages: hasilnya belum sah.** Di `http://localhost:8000/` (Daftar dan Pengenalan dibuka) tidak ada request `send`, tetapi baris `umami.js` juga tidak muncul di Network. Mungkin DevTools baru dibuka atau log dibersihkan setelah halaman termuat; mungkin script memang tidak termuat. Ulangi: buka DevTools (Network, Keep log, filter `umami`) **sebelum** membuka alamat; yang benar ada `umami.js` tetapi tidak ada `send`. Jangan login atau menekan Daftar/Masuk di localhost (tetap tersambung ke Supabase asli). Turnstile di localhost menampilkan galat dan `400 (Bad Request)` dari `challenges.cloudflare.com`: wajar, hostname localhost tidak didaftarkan di widget.
- **Tes "Keluar dan masuk normal dengan Turnstile"** (akun customer ketua) belum dikerjakan.
- **Bantuan dan Belanja dua kali di satu tab** belum dites (opsional; pembatas per nama per tab sudah terbukti untuk Daftar dan Pengenalan).
- **Baris merah dan kuning di Console dari bingkai Turnstile** (`challenges.cloudflare.com`: "Fetch API cannot load data:", "OTS parsing error", "No available adapters", "Turnstile Widget seem to have hung" saat offline) tidak menyebut Umami atau `analitik.js`. Bahwa baris itu sudah ada sebelum Umami dipasang masih dugaan, belum dibandingkan.
- ANL.06 menunggu SEC-51 dan tes Keluar-masuk. ANL.07 menunggu ANL.06.

**Saran giliran berikutnya:** lampirkan `AGENTS.md`, `analitik.md`, `security.md`. Tidak perlu berkas kode kecuali ada temuan. Urutan: (1) ulangi tes localhost dengan DevTools dibuka lebih dulu; (2) Keluar lalu masuk dengan Turnstile memakai akun customer ketua (di alamat GitHub Pages asli); (3) opsional Bantuan dan Belanja dua kali. Bila semuanya lulus: SEC-51 boleh dicentang, lalu ANL.06; setelah itu ANL.07 (tanggal tes 20 Nov 2026, tanggal mulai analisis = tanggal LNC.03, dan keputusan Reset). Dashboard Umami hanya dibuka di jendela privat. Email dan data pribadi disamarkan sebelum ditempel ke chat.

### Handoff #5 | 2026-11-20 | (Ketua)

**Tugas:** tes sisa SEC-51 dan ANL.06. Tidak ada kode dan tidak ada berkas repo yang diubah di sesi ini. **ANL.06, SEC-50, dan SEC-51 sudah dicentang di sheet.** Tinggal ANL.07 dan ANL.08.

**Hasil tes (di production, jendela Incognito, bukti diperiksa di chat dan tidak disimpan):**

- **SEC-51, alamat selain GitHub Pages: lulus.** Di `http://localhost:8000/` (server file sementara, DevTools dibuka lebih dulu), `umami.js` termuat (200, dari ServiceWorker) tetapi tidak ada request `send` setelah Daftar dan Pengenalan dibuka. Artinya `data-domains` bekerja. Server sudah dimatikan (Ctrl+C). Baris merah 400 dan peringatan `postMessage` dari `challenges.cloudflare.com` di localhost wajar (hostname localhost tidak didaftarkan di Turnstile) dan tidak menyebut Umami atau `analitik.js`.
- **Keluar lalu masuk dengan Turnstile: lulus.** Akun customer ketua di alamat GitHub Pages asli, dua kali masuk, Home tampil dengan badge CUSTOMER, Console kosong. Filter `umami` hanya `umami.js` dan satu `send`; login tidak memicu `send` baru (pageview hanya saat halaman dimuat).

**Keputusan baru:** tidak ada keputusan baru dari ketua.

**Pertentangan dengan isi lama (yang paling akhir menang):** tidak ada pertentangan baru.

**Data tes di Umami:** menambah pageview dan event dari sesi ini sampai sekitar pukul 11:00 (jam Mac ketua), 20 Nov 2026. Angka akhir di dashboard tidak dicek. Tombol Reset di Settings website tersedia (AN12), **kapan dipakai belum diputuskan**.

**Belum beres:**

- **ANL.07** (catatan manusia, tanpa kode): tanggal tes 20 Nov 2026, tanggal mulai analisis = tanggal LNC.03 (rencana Senin 23 Nov 2026), dan keputusan kapan memakai Reset. Akun customer ketua tidak dibersihkan sebagai akun dummy, dan dibuat sebelum LNC.03 sehingga di luar rentang analisis (blok akun tes 20 Nov).
- **ANL.08:** review 2 sampai 4 minggu bersama LNC.05, setelah LNC.04.
- Bantuan dan Belanja dibuka dua kali di satu tab belum dites (opsional; pembatas per nama per tab sudah terbukti untuk Daftar dan Pengenalan).
- Layar Masuk setelah Keluar tidak terlihat di screenshot, hanya laporan lisan.
- Baris merah dan kuning di Console dari bingkai Turnstile belum dibandingkan dengan kondisi sebelum Umami dipasang (dugaan: sudah ada sebelumnya).
- Perilaku paket Hobby saat lewat 100 ribu event masih belum jelas (AN14: mendekati batas, kurangi event, jangan upgrade). Pantau usage di dashboard tiap minggu (opsi A, Handoff #2).

**Saran giliran berikutnya:** tidak perlu berkas kode. Putuskan Reset Umami (disarankan sebelum LNC.03 supaya angka bersih, keputusan ketua), catat ANL.07, lalu centang. Sebelum menutup: logout, tutup jendela Incognito, pastikan dashboard Umami tidak tertinggal terbuka (aturan anti-nyasar, `AGENTS.md` bagian 8). Setelah LNC.04, kerjakan ANL.08 bersama LNC.05.

### 2026-11-20: Reset data Umami dijadwalkan Minggu 22 Nov 2026

Keputusan ketua (20 Nov 2026, disampaikan langsung di sesi tes ANL.06). Alasan: owner lain belum sempat mencoba login, jadi kunjungan mereka ikut terhapus sekalian dan data tes bersih sebelum LNC.03.

- **Reset di Settings website Umami dilakukan Minggu 22 Nov 2026**, setelah semua owner selesai mencoba login dan **sebelum LNC.03 (Senin 23 Nov 2026)**. Reset menghapus semua statistik website, pengaturan tetap (AN12).
- **Tanggal mulai angka dianalisis = tanggal LNC.03 (23 Nov 2026).** Tanggal tes: 20 Nov 2026 (ANL.07).
- **Syarat:** Reset tidak boleh terlewat. Bila terlewat, data tes ikut terhitung di angka kunjungan awal dan merusak perbandingan kunjungan dengan jumlah akun baru (AN10, AN11).
- **Dilakukan oleh ketua**, di jendela privat (`AGENTS.md` bagian 8), lalu logout dan tutup.
- **Pertentangan dengan catatan lama:** menutup butir "kapan Reset dipakai belum diputuskan" di Handoff #3, #4, dan #5. Yang paling akhir menang.
