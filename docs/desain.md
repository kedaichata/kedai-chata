/docs/desain.md

# 🎨 desain.md: Antarmuka, Tema Marun dan Emas, Navigasi, dan Komponen

> **Versi 1.2 (5 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Perubahan 1.2: DS10 menambah Bantuan di Akun dan Lainnya, DS15 baru (layar Bantuan), komponen daftar tanya-jawab (`bantuan.md`). Perubahan 1.1: logo menjadi wordmark (DS5), ikon sementara (DS6), "Lainnya" khusus owner (DS10), kartu order memakai nomor berjalan dan jam permintaan. Bergantung pada `fondasi.md` (struktur `public/`, `style.css`, `sw.js`). Dipakai semua dokumen fitur untuk tampilan layar.
> **Status:** DS1 sampai DS15 sebagian dari keputusan ketua (tema marun gelap, aksen emas, logo dari HTML/CSS, bilah navigasi emas); sisanya **(bawaan)** = pilihan penulis, ketua boleh mengubahnya sebelum dikerjakan. Belum ada yang dikerjakan.
> **Referensi:** tampilan aplikasi teman (bilah atas, navigasi bawah, kartu) dipakai sebagai **inspirasi struktur**; aset, teks, dan gamifikasinya tidak disalin.
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini** bersama dokumen fitur yang sedang dikerjakan. Kerjakan langkah di bagian 5. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 9.
> **Berkas yang diminta AI di awal sesi:** `public/style.css`, `public/index.html`, dan berkas JS layar yang sedang dikerjakan.
> **Tanpa kode.** **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Fitur ini Low-Risk (P2)** untuk tampilan. Pengecualian: tombol aksi berisiko (Setujui, Tolak, Batalkan) dan teks dari pengguna tetap mengikuti `security.md` (aturan 9 dan 10).
> **Prefix sheet:** DSN.

---

## 1. Tujuan

Aplikasi terasa **sesederhana WA** untuk ibu-ibu, tetap rapi untuk owner dan penjaga, dan **nyambung dengan identitas warung** (marun gelap dan emas, logo ChATA). Satu gaya dipakai di semua layar supaya tidak ada layar yang terasa berbeda aplikasi.

---

## 2. Keputusan

| No   | Keputusan                                                                                                                                                                                                                                                                                                                                                                                                  | Dasar                                                                                         |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| DS1  | **Tema: marun gelap dengan aksen emas**, mengikuti warna logo warung. Marun dibuat **lebih gelap dari logo** supaya logo tetap menonjol.                                                                                                                                                                                                                                                                   | Keputusan ketua 4 Nov 2026.                                                                   |
| DS2  | **Marun gelap untuk bingkai** (bilah atas, navigasi bawah, kartu sampul). **Latar isi terang** (krem atau putih) supaya mudah dibaca di bawah matahari. **(bawaan)**                                                                                                                                                                                                                                       | Ibu-ibu tidak boleh dipersulit (`features.md` bagian 9).                                      |
| DS3  | **Emas untuk aksen:** ikon dan teks di navigasi, garis, lencana, tanda aktif. **Bukan untuk teks kecil di latar terang** (emas di atas putih sulit dibaca).                                                                                                                                                                                                                                                | Keterbacaan.                                                                                  |
| DS4  | **Navigasi bawah memakai emas:** menu aktif **emas terang dan tebal** dengan garis penanda; menu tidak aktif **emas redup**. Semua dengan ikon **dan tulisan**.                                                                                                                                                                                                                                            | Keputusan ketua 4 Nov 2026.                                                                   |
| DS5  | **Wordmark** (tulisan "Kedai ChATA" bergaya logo) dibuat dari HTML dan CSS, tanpa berkas gambar, sebagai komponen di `style.css`: lingkaran, tulisan, dan hiasan. Dipakai di layar Masuk, Daftar, dan kartu sampul. Logo asli ada tetapi berkasnya belum ketemu; bila ketemu, tukar berkas di `public/img/` (atau ganti komponen) tanpa mengubah layar lain.                                               | Keputusan ketua; berkas logo belum ketemu.                                                    |
| DS6  | **Ikon PWA (manifest) tetap butuh berkas gambar** (F14). Sementara dipakai **ikon sementara** (misalnya huruf "C" emas di lingkaran marun) yang dibuat di FND.08; DSN.06 menyempurnakannya dari wordmark, atau menggantinya dengan logo asli bila berkasnya ketemu (ukuran 192 dan 512 px), disimpan di `public/img/`.                                                                                     | `fondasi.md` F14, FND.08.                                                                     |
| DS7  | **Font bawaan sistem, CSS ditulis sendiri, tanpa CDN** (tanpa Bootstrap, Tailwind, atau Google Fonts). **Semua gaya di satu berkas `public/style.css`.**                                                                                                                                                                                                                                                   | `AGENTS.md` bagian 3.                                                                         |
| DS8  | **Satu tujuan per layar, bahasa sehari-hari, tombol dan font besar.** Ukuran teks isi sekitar 16 sampai 18 px, tombol aksi tinggi minimal sekitar 48 px. **(bawaan)**                                                                                                                                                                                                                                      | `features.md` bagian 9.                                                                       |
| DS9  | **Bilah atas:** judul layar di kiri, tombol **Segarkan** di kanan (ikon penyegaran, tidak ada timer). Tombol Keluar ada di menu Akun, bukan di bilah atas. **(bawaan)**                                                                                                                                                                                                                                    | NT3; `notifikasi.md` bagian 4.2.                                                              |
| DS10 | **Navigasi bawah per peran, langsung tampil (customer dan penjaga tanpa menu tersembunyi; satu menu "Lainnya" hanya untuk owner):** Customer: Pesan, Pesanan Saya, Akun. Penjaga: Antrean, Akun. Owner: Order Masuk, Semua Order, Buat Order, Menu, dan **Lainnya** (berisi Pelanggan, Bantuan, dan Akun).                                                                                                 | `features.md` bagian 9 (layar per peran); menu hamburger berisi banyak pilihan tidak dipakai. |
| DS11 | **Status order selalu tampil dengan tulisan dan warna** (tidak hanya warna): lencana kecil di kartu dan detail. Warna di bagian 4.                                                                                                                                                                                                                                                                         | Aksesibilitas; buta warna.                                                                    |
| DS12 | **Tombol berbahaya (Tolak, Batalkan) memakai tombol berpinggir dengan teks jelas**, bukan isian marun, supaya tidak tertukar dengan tombol aksi utama. **Setujui** memakai tombol isian. **(bawaan)**                                                                                                                                                                                                      | Marun sebagai warna utama bentrok dengan merah sebagai tanda bahaya.                          |
| DS13 | **Keadaan khusus punya tampilan sendiri:** memuat, daftar kosong, galat, dan offline (pesan jelas bahwa login dan aksi butuh internet). Pesan Bahasa Indonesia, umum, tanpa galat mentah.                                                                                                                                                                                                                  | `security.md` aturan 9; F10.                                                                  |
| DS14 | **Tampil benar di HP kecil dan orientasi tegak** (mobile-first). Semua teks dari server dan input pengguna lewat `textContent`.                                                                                                                                                                                                                                                                            | `AGENTS.md` bagian 3; `security.md` aturan 10.                                                |
| DS15 | **Layar Bantuan** (tanya-jawab, `bantuan.md`) **tidak masuk navigasi bawah**; pintu masuknya item **Bantuan** di layar **Akun** (customer dan penjaga) dan di **Lainnya** (owner). Bilah atas memakai judul "Bantuan" dan tombol Segarkan (DS9). Pertanyaan dikelompokkan per bagian dan dilipat; keadaan khusus (memuat, "Belum ada bantuan", galat, offline) mengikuti DS13. **(bawaan untuk letaknya)** | `bantuan.md` BT1, BT9, BT12; DS9, DS10, DS13.                                                 |

---

## 3. Prasyarat

`fondasi.md` selesai sampai `index.html`, `config.js`, dan `sw.js` (FND.04 sampai FND.08). Berkas `style.css` didaftarkan di cache `sw.js`.

---

## 4. Yang dibuat

### 4.1 Warna (titik awal, nilai final dicek di HP)

| Peran warna        | Contoh nilai | Dipakai untuk                            |
| ------------------ | ------------ | ---------------------------------------- |
| Marun sangat gelap | `#3B0A14`    | Bilah atas, navigasi bawah, kartu sampul |
| Marun              | `#6B1020`    | Tombol aksi utama, judul penting         |
| Emas terang        | `#E2B84A`    | Menu aktif, ikon aktif, lencana          |
| Emas redup         | `#B8923A`    | Menu tidak aktif, garis tipis            |
| Krem               | `#FFF8EC`    | Latar isi                                |
| Teks gelap         | `#2A1A1A`    | Teks isi di latar krem                   |
| Teks terang        | `#FFF4DC`    | Teks di atas marun                       |

Kontras teks emas di atas marun gelap cukup tinggi; teks isi di latar krem memakai teks gelap. **Cek keterbacaan di HP sungguhan** sebelum dikunci.

### 4.2 Warna lencana status

| Status                                  | Warna       |
| --------------------------------------- | ----------- |
| Menunggu                                | Oranye      |
| Disetujui                               | Biru        |
| Diproses                                | Kuning tua  |
| Diantar / Siap diambil / Siap disajikan | Hijau muda  |
| Selesai                                 | Hijau       |
| Ditolak                                 | Merah pucat |
| Dibatalkan                              | Abu-abu     |

Marun pekat **tidak dipakai** untuk status.

### 4.3 Komponen

| Komponen           | Isi                                                                                                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bilah atas         | Judul layar dan tombol Segarkan (DS9).                                                                                                                                                                                |
| Navigasi bawah     | Tiga sampai lima menu per peran (DS10), emas aktif dan redup (DS4).                                                                                                                                                   |
| Wordmark HTML/CSS  | Komponen wordmark ChATA (DS5), dua ukuran: besar (Masuk, Daftar) dan kecil (kartu sampul).                                                                                                                            |
| Kartu              | Pinggir bulat, satu isi pokok per kartu. Dipakai untuk kartu order, menu, dan alamat.                                                                                                                                 |
| Kartu order        | Nomor order ("#1042"), pemesan, jam permintaan ("Minta diantar jam 11.15"), tipe, total, lencana status, tanda "Catatan baru".                                                                                        |
| Tombol             | Aksi utama (isian marun), aksi sekunder (berpinggir), berbahaya (berpinggir, DS12).                                                                                                                                   |
| Isian dan daftar   | Isian besar dengan label jelas; daftar yang bisa digulir.                                                                                                                                                             |
| Keadaan khusus     | Memuat, kosong, galat, offline (DS13).                                                                                                                                                                                |
| Daftar tanya-jawab | Judul kelompok (bagian); pertanyaan dilipat dan dibuka dengan satu ketukan (akordeon bawaan peramban); isi berupa teks biasa, baris baru menjadi paragraf baru (DS15). Dibuat di BTN.03 (`bantuan.md`), bukan di DSN. |

---

## 5. Urutan pekerjaan (untuk TODO sheet, prefix DSN)

Dikerjakan **setelah `fondasi.md` dan sebelum `akun.md`**, karena layar pertama (Daftar dan Masuk, AKN.05) membutuhkan gaya dasar.

1. **DSN.01** Warna, font sistem, dan ukuran dasar di `public/style.css`; daftarkan di cache `sw.js` (butuh "OK" karena menyentuh `sw.js`).
2. **DSN.02** Wordmark HTML/CSS (DS5) dan halaman contoh yang menampilkannya.
3. **DSN.03** Bilah atas dan navigasi bawah per peran (DS9, DS10, DS4).
4. **DSN.04** Komponen dasar: kartu, tombol, isian, daftar, lencana status.
5. **DSN.05** Keadaan khusus: memuat, kosong, galat, offline.
6. **DSN.06** Ikon PWA disempurnakan dari wordmark, atau dari logo asli bila ketemu (DS6), menggantikan ikon sementara dari FND.08.
7. **DSN.07** Cek tampilan di HP sungguhan (Android dan layar kecil): keterbacaan emas dan marun, ukuran tombol.

---

## 6. Aturan yang paling sering terlanggar

| Aturan                                                            | Akibat bila dilanggar                                           |
| ----------------------------------------------------------------- | --------------------------------------------------------------- |
| Memakai CDN atau Google Fonts untuk gaya dan font                 | Melanggar `AGENTS.md` bagian 3; aplikasi bergantung pihak luar. |
| Menaruh gaya di banyak berkas atau langsung di JS                 | Tampilan tidak seragam dan sulit diperbaiki.                    |
| Memasang teks pengguna lewat `innerHTML` demi tampilan            | Teks berisi tag bisa menjalankan skrip (SEC-18).                |
| Teks emas kecil di latar krem atau putih                          | Tidak terbaca, terutama di bawah matahari.                      |
| Status hanya dibedakan warna                                      | Pengguna buta warna atau layar pucat salah paham.               |
| Tombol Tolak atau Batalkan berwarna sama dengan tombol utama      | Salah pencet yang berdampak ke order dan pembayaran.            |
| Menu tersembunyi (hamburger) berisi banyak pilihan untuk customer | Ibu-ibu tidak menemukannya.                                     |
| Berkas `style.css` baru tidak didaftarkan di cache `sw.js`        | Aplikasi offline tampil tanpa gaya.                             |
| Menyalin aset atau teks dari aplikasi referensi                   | Pelanggaran hak dan tampilan tidak khas ChATA.                  |

---

## 7. Dampak dan pembatalan

- **Gaya salah:** hanya tampilan; perbaiki `style.css` dan push ulang. Tidak ada data hilang.
- **Perubahan `sw.js`** (daftar cache) tetap butuh penjelasan dan "OK" ketua (`fondasi.md` bagian 7).
- **Warna kurang terbaca:** ubah nilai warna di satu tempat (`style.css`); berlaku ke semua layar.

---

## 8. Ditunda

- Mode gelap penuh sebagai pilihan (sekarang latar isi krem dengan bingkai marun).
- Ringkasan order 7 hari untuk owner di menu Lainnya (`bonus.md` B31).
- Animasi dan transisi yang berat.
- Ilustrasi atau foto dekoratif.
- Pengaturan ukuran font oleh pengguna.

---

## 9. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

### Handoff #1 | 2026-11-05 | [Ketua]

**Tugas selesai:** DSN.01 (tinggal dicentang di sheet). Butir sheet "Tes update muncul di HP" (tertunda dari FND.08) juga terbukti lulus lewat push ini dan bisa dicentang.

**File yang diubah:** `public/style.css` (baru), `public/index.html` (ditambah satu komentar dan satu `<link>` ke `style.css`; kode lama tidak diubah), `public/sw.js` (nama cache `chata-v1` jadi `chata-v2`, dan `style.css` masuk daftar cache; kode lain tidak diubah). Satu commit `1f61971` di `main`. Tiga cek anti-nyasar lolos sebelum push. Workflow Pages hijau (40 detik).

**Isi `style.css`:** warna di variabel `:root` sesuai desain.md bagian 4.1 (marun sangat gelap, marun, emas terang, emas redup, krem, teks gelap, teks terang), font bawaan sistem, teks isi 17 px, tinggi minimal tombol dan isian 48 px, latar krem, judul marun. Belum ada komponen.

**Keputusan baru:** tidak ada. `index.html` ikut diubah karena `style.css` belum tersambung ke halaman; itu bagian dari DSN.01.

**Hasil tes:** tampilan benar di Chrome Mac. Di HP Android, aplikasi terpasang di layar utama memuat tampilan baru tanpa hapus data dan tanpa pasang ulang (update muncul). Dengan mode pesawat tampilan tetap sama (`style.css` ada di cache). Bukti diperiksa di chat dan tidak disimpan. Catatan: status "belum dites" di `docs/fondasi.md` (catatan FND.08 dan Handoff #4) sudah tidak berlaku; yang paling akhir menang.

**Belum beres:**

- Nilai warna masih titik awal. Keterbacaan emas dan marun di HP sungguhan dicek lengkap di DSN.07.
- Ikon PWA masih sementara; disempurnakan di DSN.06.
- Komponen (wordmark, bilah, kartu, tombol, lencana, keadaan khusus) belum ada; itu DSN.02 sampai DSN.05.

**Saran giliran berikutnya:** DSN.02 (wordmark HTML/CSS per DS5 dan halaman contoh yang menampilkannya; Low-Risk). Gaya wordmark ditambah di `style.css`, bukan di berkas lain. Bila halaman contoh berupa **berkas baru** di `public/`, berkas itu wajib didaftarkan di daftar cache `sw.js` dan nama cache dinaikkan ke `chata-v3` (menyentuh `sw.js`, butuh "OK" ketua); bila halaman contoh ditaruh di `index.html`, `sw.js` tidak perlu disentuh. Lampirkan `AGENTS.md` + `desain.md` + versi terbaru `public/style.css` dan `public/index.html` (+ `public/sw.js` bila berkas baru). Sebelum push, cek tiga hal anti-nyasar. Logout GitHub dan Supabase di profil browser setelah selesai.

### Handoff #2 | 2026-11-05 | [RAC]

**Tugas selesai:** DSN.02 dan DSN.03 (tinggal dicentang di sheet).

**File yang diubah:**

- DSN.02 (commit `fe81f6a`): `public/img/chata-logo.png` (baru), `public/style.css`, `public/index.html`, `public/sw.js` (nama cache `chata-v2` jadi `chata-v3`, logo masuk daftar cache; kode lain tidak diubah).
- DSN.03 (commit `b2cec93`): `public/style.css`, `public/index.html`. `sw.js` tidak disentuh.
- Kode lama tidak ada yang dihapus; semuanya tambahan.

**Isi:** komponen wordmark besar dan kecil dari logo asli, bilah atas (judul + tombol Segarkan), navigasi bawah per peran dengan ikon SVG langsung di HTML (tanpa pustaka ikon atau CDN). `index.html` untuk sementara berisi halaman contoh: wordmark, navigasi Customer yang menempel di bawah, dan contoh navigasi Penjaga dan Owner yang statis.

**Keputusan baru:**

- Logo asli (ditemukan ibu ketua) dipakai sebagai gambar di komponen wordmark, bukan wordmark HTML/CSS. Ini bertentangan dengan kalimat awal DS5 ("dibuat dari HTML dan CSS"); DS5 sendiri membolehkan tukar bila logo ketemu, dan yang paling akhir menang. "OK" ketua untuk perubahan `sw.js` diberikan di chat.
- Tidak ada keputusan soal kartu sampul (lihat "Belum beres").

**Hasil tes:** Actions hijau di kedua commit. Di HP Android (aplikasi terpasang di layar utama): update muncul tanpa hapus data, dan tampilan tetap sama dalam mode pesawat. Tulisan menu bawah terbaca nyaman di HP ketua. Bukti diperiksa di chat dan tidak disimpan.

**Belum beres:**

- Blok `.contoh-sampul` (bilah marun berisi wordmark kecil) masih ada di `index.html` dan `style.css`. Itu tambahan penulis kode untuk memperlihatkan wordmark kecil, bukan keputusan ketua; kartu sampul di desain.md (DS2) berstatus (bawaan). Ketua belum memutuskan dipakai atau tidak. Diputuskan saat atau setelah DSN.04; bila dibuang, penghapusan kode butuh "OK" dan dicatat satu blok keputusan.
- Halaman contoh di `index.html` sementara; digantikan layar Masuk (AKN.05). Tombol Segarkan dan menu belum berfungsi (belum ada JS).
- Logo 500 px, kurang sedikit dari 512 px yang dibutuhkan ikon PWA; diurus di DSN.06.
- Tulisan menu bawah sekitar 13 px; dicek lengkap di DSN.07. Tampilan di layar lebar (laptop) belum dibahas; baru dilihat sekali di Chrome, selebihnya HP.

**Saran giliran berikutnya:** DSN.04 (kartu, tombol utama/sekunder/berbahaya, isian, daftar, lencana status; Low-Risk). Gaya ditambah di `style.css`; halaman contoh tetap di `index.html` agar `sw.js` tidak perlu disentuh. Lampirkan `AGENTS.md` + `desain.md` + versi terbaru `public/style.css` dan `public/index.html`. Sebelum push, cek tiga hal anti-nyasar. Logout GitHub dan Supabase di profil browser setelah selesai.

### Handoff #3 | 2026-11-05 | [Fren]

**Tugas selesai:** DSN.04 dan DSN.05 (tinggal dicentang di sheet).

**File yang diubah:**

- DSN.04 (commit `24bacc2`): `public/style.css`, `public/index.html`, `docs/desain.md` (hanya ganti nama PIC).
- DSN.05 (commit `8200625`): `public/style.css`, `public/index.html`.
- `sw.js` tidak disentuh (cache tetap `chata-v3`). Kode lama tidak ada yang dihapus; semuanya tambahan.

**Isi:**

- DSN.04: kartu, kartu order, tombol (utama, sekunder, berbahaya, nonaktif), isian (normal dan galat), daftar (bisa digulir), tujuh lencana status, tanda "Catatan baru". Empat variabel warna tambahan di `style.css`: `--bahaya`, `--putih`, `--garis-tipis`, `--teks-samar`.
- DSN.05: bentuk dasar `.keadaan` untuk Memuat, Kosong, Galat, dan Offline; lingkaran putar `.putaran` (berhenti bila HP mengurangi animasi). Pesan Bahasa Indonesia, tanpa galat mentah.
- Halaman contoh di `index.html` bertambah "Contoh komponen" dan "Contoh keadaan khusus" (data dummy, statis).

**Keputusan baru:** Offline dibuat sebagai blok layar penuh seperti keadaan lain (pita tipis bisa dipertimbangkan saat ada JS). Empat warna tambahan di atas dipilih penulis kode, alasan belum tercatat dari ketua.

**Hasil tes:** Di HP Android (terpasang di layar utama): update muncul tanpa hapus data, tampilan DSN.04 dan DSN.05 sesuai deskripsi; mode pesawat dites untuk DSN.04 dan tampilan tetap utuh. Bukti diperiksa di chat dan tidak disimpan.

**Belum beres:**

- `.contoh-sampul` masih ada; ketua belum memutuskan dipakai atau dibuang (Handoff #2).
- Halaman contoh sementara, digantikan layar Masuk (AKN.05). Tombol dan menu belum berfungsi; belum ada JS yang mendeteksi offline atau memuat data (menyusul di layar yang butuh).
- Warna lencana masih titik awal; tulisan lencana dan bantuan sekitar 14 sampai 15 px, dicek lengkap di DSN.07.

**Saran giliran berikutnya:** DSN.06 (ikon PWA 192 dan 512 px dari logo asli). Logo 500 px, kurang dari 512; bahas dulu caranya. Menyentuh `sw.js` bila daftar cache berubah, jadi butuh "OK" ketua. Lampirkan `AGENTS.md` + `desain.md` + `public/sw.js` + `public/manifest.json`. Sebelum push, cek tiga hal anti-nyasar.

### Handoff #4 | 2026-11-05 | [KEN]

**Tugas selesai:** DSN.06 dan DSN.07 (tinggal dicentang di sheet). Dengan ini seluruh DSN (01 sampai 07) tuntas.

**File yang diubah:** `public/img/icon-192.png` dan `public/img/icon-512.png` (ditimpa, nama sama). Commit `2c7770a` (versi pertama) dan satu commit susulan untuk versi logo lebih kecil (hash belum dicatat). `sw.js` dan `manifest.json` tidak disentuh (cache tetap `chata-v3`); tidak butuh "OK" ketua. Tiga cek anti-nyasar lolos sebelum push pertama.

**Isi:** ikon PWA dibuat dari logo asli (`chata-logo.png`, 500 px) di atas kanvas marun `#3B0A14`, logo di tengah dengan diameter sekitar 54% dari kanvas. Logo tidak ditarik membesar. Menggantikan ikon sementara huruf "C" dari FND.08.

**Keputusan baru:**

- Ikon `any` dan `maskable` memakai satu gambar yang sama (keputusan ketua di chat). Alasan: paling sederhana dan tidak menambah berkas yang harus didaftarkan di `sw.js` dan `manifest.json`.
- Ukuran logo 54%, bukan 78% (ruang aman standar). Versi 78% terpotong di HP ketua. Alasan ukuran tepat 54% belum tercatat dari ketua; dipilih penulis kode dari simulasi potongan sekitar 60% tengah.

**Temuan di lapangan:** pemasangan lewat **Brave** hanya membuat pintasan biasa (ada lencana Brave di ikon) dan memotong ikon lebih dalam, sehingga logo terpotong walau ukurannya sudah aman. Pemasangan lewat **Chrome** menampilkan ikon utuh. Di layar Install Chrome dan Brave ikon terlihat benar; yang terpotong hanya ikon pintasan Brave. Ikon di layar utama HP yang sudah terpasang tidak berganti sendiri: hapus lalu pasang ulang.

**Hasil tes:** DSN.06: ikon utuh di layar utama Android (dipasang lewat Chrome). DSN.07: di HP ketua, teks isi, menu bawah (termasuk menu Owner lima item), emas di marun, tujuh lencana status, tombol, isian (normal dan galat), daftar bisa digulir, dan keadaan khusus (Memuat, Galat, Offline) terbaca jelas, tidak ada yang meluber atau terpotong. Bukti diperiksa di chat dan tidak disimpan.

**Belum beres:**

- `.contoh-sampul` di `index.html` dan `style.css`: ketua belum memutuskan dipakai atau dibuang (Handoff #2 dan #3). Penghapusan kode butuh "OK" dan satu blok keputusan.
- Halaman contoh di `index.html` masih sementara; digantikan layar Masuk (AKN.05). Tombol dan menu belum berfungsi (belum ada JS).
- Tombol "Aksi sekunder" (pinggir marun) dan "Batalkan" (pinggir merah) cukup mirip warnanya; tulisannya jelas jadi dianggap lulus. Perhatikan saat Setujui/Tolak dipakai di layar order (DS12); bila ada salah tekan, tambahkan pembeda (ikon atau pinggir lebih tebal).
- Tampilan di layar lebar (laptop) belum dibahas, baru dilihat sekali di Chrome Mac. Ikon dites di HP ketua saja, belum di HP anggota lain atau pelanggan.

**Saran giliran berikutnya:** mulai `akun.md` (prefix AKN). AKN.01 dan AKN.02 (pengaturan Auth dan SMTP di dashboard) berisiko tinggi (P0) dan butuh "OK" ketua; siapkan ringkasan untuk diteruskan lewat WA bila yang bertugas bukan ketua. Lampirkan `AGENTS.md` + `akun.md` + `database.md` + `security.md` + versi terbaru `public/index.html`, `public/style.css`, dan `public/sw.js`. Sebelum push, cek tiga hal anti-nyasar. Logout GitHub dan Supabase di profil browser setelah selesai.

### 2026-11-07: Home menggantikan Lainnya dan Akun, Bantuan pindah ke Home, kartu sampul dipakai

**Berkas tujuan:** `docs/desain.md` bagian 9. Menimpa DS10, DS15, dan butir "Ringkasan order 7 hari di menu Lainnya" di bagian 8. Sumber: `home.md` (HM1 sampai HM12, Handoff #1 dan #2). Yang paling akhir menang.

- **DS10 diganti:** tab **Home** ada di **paling kiri** untuk tiga peran, menggantikan Lainnya (owner) dan Akun (customer, penjaga). Owner: Home, Order Masuk, Semua Order, Buat Order, Menu. Customer: Home, Pesan, Pesanan Saya. Penjaga: Home, Antrean. Home juga **halaman pertama setelah masuk**. Alasan belum tercatat.
- **DS15 diganti:** pintu Bantuan adalah **tombol di Home** untuk semua peran, bukan lagi item di Akun atau Lainnya. Tampil "Segera" dan tidak bisa diketuk sampai `bantuan.md` selesai.
- **Kartu sampul dipakai (DS2, DS5, HM3):** komponen `.kartu-sampul` (logo ChATA di marun gelap) di `style.css`. Pertanyaan terbuka soal `.contoh-sampul` (Handoff #2 sampai #4) terjawab: blok `.contoh-sampul` dihapus dari `style.css` di HOM.05 dengan "OK" ketua.
- **Lencana peran** (`.lencana-peran`: Owner, Penjaga, Customer) berpinggir marun, bukan warna lencana status (DS11).
- **Isi Home dari atas:** kartu sampul, sapaan "Halo, {nama}, selamat datang di Kedai ChATA" dengan lencana peran, tombol Bantuan, bagian Pelanggan (owner, "Segera"), daftar (Ringkasan order 7 hari untuk owner "Segera", Pengaturan akun, Buku alamat untuk customer), lalu Keluar di paling bawah.
- **Bagian 8:** pintu Ringkasan order 7 hari adalah tombol di Home, bukan menu Lainnya (isi layar tetap di `bonus.md` B31).

# Blok susulan siap tempel (hasil sesi strategi GIM, 10 Nov 2026)

Tiap blok ditempel di bagian **Catatan Susulan** di akhir berkas tujuannya (append-only). Perubahan `AGENTS.md` dan `desain.md` butuh persetujuan ketua. Yang paling akhir menang.

---

### 2026-11-10: Menu hamburger untuk game, dan CSS game terpisah

**Berkas tujuan:** `docs/desain.md` bagian 9. Menimpa sebagian DS10, DS7, dan baris "Menu tersembunyi (hamburger)..." di bagian 6. Sumber: `docs/gim.md` (GM4 sampai GM7, GM12). Yang paling akhir menang.

- **DS10 sebagian ditimpa:** bilah atas semua tab utama kini punya **tombol hamburger di kiri judul**, hanya berisi game (satu item "Arithmetics"). Navigasi kerja tetap di bilah bawah, tidak ada yang dipindah ke hamburger. Hamburger tidak muncul di sub-layar (Pengaturan akun, Buku alamat, Kelola grup pilihan, Masuk, Daftar).
- **Bagian 6 (aturan yang sering terlanggar):** larangan "menu hamburger berisi banyak pilihan untuk customer" tetap berlaku untuk navigasi kerja. Hamburger game isinya satu item dan bukan jalan menuju fitur order, jadi tidak melanggar.
- **DS7 pengecualian:** gaya hamburger dan game ada di **`public/game.css`** (kelas berawalan `gim-`), dimuat setelah `style.css`. Semua gaya lain tetap di `style.css`. Alasan rinci dari ketua belum tercatat (kekhawatiran gaya game menempel ke CSS yang ada).

### 2026-11-10: Bilah atas berisi ?, Segarkan, Keluar (dengan konfirmasi)

**Berkas tujuan:** `docs/desain.md` bagian 9. Menimpa DS9, DS15, dan bagian "Bantuan tetap di Home" pada blok hamburger 10 Nov. Sumber: keputusan ketua 10 Nov 2026 setelah tes dengan owner. Yang paling akhir menang.

- **Alasan:** saat tes, owner menanyakan di mana tombol Bantuan dan mengeluhkan harus ke Home dulu dari layar order (order, Home, Bantuan). Keluar juga tidak praktis bila harus ke Home.
- **DS9 diganti:** bilah atas (tab utama saja) dari kiri ke kanan: hamburger (bila ada, `gim.md`), judul, **ikon ?**, **Segarkan**, **Keluar**. Tidak tampil di sub-layar (Pengaturan akun, Buku alamat, Kelola grup pilihan, Lengkapi profil, Buat password baru), Masuk, dan Daftar (sama seperti aturan hamburger GM5).
- **Keluar:** ikon dalam **lingkaran merah**, ikon terang di dalamnya (acuan: PWA biru milik ketua, dengan warna merah). Bila diketuk muncul konfirmasi:
  > **Yakin mau keluar?**
  > Nanti masuk lagi perlu password.
  > [ Batal ] [ Keluar ]
  > **Batal = tombol utama (isian marun)**, **Keluar = berpinggir merah** (DS12), supaya salah ketuk lebih mudah berakhir di Batal. Kalimat "kecuali sudah menyimpan password" sengaja tidak dipakai (tergantung browser, tidak bisa dijamin).
- **DS15 diganti:** pintu Bantuan adalah **ikon ?** di bilah atas, satu ketukan dari tab utama mana pun. Tombol Bantuan di Home tetap ada ("Segera" sampai BTN.03), lalu membuka layar yang sama.
- **Hamburger** tetap di kiri judul dan isinya tetap hanya game (`gim.md` tidak berubah, tidak ada garis pemisah).
- **Risiko diterima ketua:** Keluar bersebelahan dengan Segarkan (salah pencet) dan DS9 lama yang menaruh Keluar di Akun. Diredam oleh konfirmasi di atas.
- **Keluar tetap harus menutup** layar game dan menu hamburger, serta menghapus nama dan sapaan (HP dipakai bergantian; `gim.md` GM14, `home.md` bagian 6).

### Handoff #5 | 2026-11-10 | [Ketua]

**Tugas selesai:** DSN.08 dan DSN.09 (tinggal dicentang di sheet).

**File yang diubah:** `public/index.html`, `public/kerangka.js`, `public/style.css` (hanya menambah di akhir). `akun.js` dan `sw.js` tidak disentuh (tidak ada berkas JS baru, cache tetap `chata-v17`). Hash commit belum dicatat.

**Isi:**

- Ikon Keluar di bilah atas, di kanan Segarkan: lingkaran merah, ikon terang berbentuk pintu dengan panah keluar (mengikuti acuan PWA milik ketua).
- Diketuk memunculkan konfirmasi "Yakin mau keluar? / Nanti masuk lagi perlu password." Batal = tombol utama (isian marun), Keluar = berpinggir merah (DS12). Ketuk area gelap di luar kotak atau tekan Esc juga membatalkan.
- Keluar memanggil `KedaiAkun.keluar` yang sudah ada di `akun.js` (sesi, nama, dan sapaan terhapus lewat jalur itu). `kerangka.js` `reset()` juga menutup kotak konfirmasi.
- Tombol Keluar di Home disembunyikan (`hidden`), kodenya tidak dihapus; id `tombol-keluar` tetap ada untuk `akun.js`.
- Kode lama tidak ada yang dihapus. Satu baris lama di `index.html` berubah (pembungkus Keluar di Home ditambah `hidden`); selebihnya tambahan.

**Keputusan baru:**

- Warna lingkaran Keluar `#c62828` (variabel `--keluar-bulat`), dipilih penulis kode; alasan belum tercatat dari ketua.
- Bentuk ikon (pintu dan panah keluar) mengikuti contoh ketua; detail garisnya dipilih penulis kode.
- Judul bilah atas kini mengisi ruang kosong (`flex: 1`) supaya Segarkan dan Keluar rapat di kanan.
- Tab Pelanggan (owner, dibuka dari Home) tetap menampilkan ikon Keluar di bilah atas, demi konsistensi dengan tab utama lain. Keputusan ketua (10 Nov 2026); dianggap minor. Alasan lain belum tercatat.

**Hasil tes:** dites di laptop dan HP, semua berfungsi sesuai. Bukti diperiksa di chat dan tidak disimpan.

**Belum beres:**

- Pembersihan kode Keluar di Home (yang kini `hidden`) ditunda; butuh "OK" tersendiri dan satu blok catatan.
- Hamburger dan layar game belum ada di kode. Kewajiban Keluar menutupnya dan menghapus data (`gim.md` GM14) harus dikerjakan di sesi GIM.
- Bila ada keluhan salah pencet Keluar di dekat Segarkan, tambah jarak atau pembeda.

**Saran giliran berikutnya:** BTN.01 (migration tabel `bantuan`, High-Risk; butuh penjelasan dampak dan "OK" ketua). Lampirkan `AGENTS.md` + `bantuan.md` + `database.md` + `security.md`. Sebelum push, cek tiga hal anti-nyasar. Logout GitHub dan Supabase di profil browser setelah selesai.
---
