/docs/belanja.md

# Belanja Warung (prefix BLJ)

> **Versi 1.0 (18 Nov 2026), hasil sesi strategi.** Fitur diminta ibu ketua di awal proyek tetapi belum masuk md; tercatat di kertas ketua. **Versi rilis (V1 sebelum Peluncuran atau sebelum LNC.04) menunggu persetujuan ketua dan owner** (lihat bagian 6). Selisih dengan `AGENTS.md`: `AGENTS.md` menang. Yang paling akhir menang.

## 1. Tujuan

Memindahkan kebiasaan 5 owner menulis daftar belanja warung dan menghitungnya manual di WA ke aplikasi. **Aplikasi hanya mencatat dan menjumlahkan. Ini bukan keuangan warung**: tidak ada utang, lunas, atau "sudah diganti". Pada hari ngumpul (kadang Sabtu, kadang Minggu), owner melihat total belanja per owner untuk dihitung bareng. Fitur ini **hanya untuk owner**.

## 2. Tabel Keputusan

| No   | Keputusan                                                                                                                                                                                                                                                                                                                                                                                                    | Alasan                                                                            |
| :--- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------- |
| BL1  | Hanya **owner** yang melihat dan memakai. Customer dan penjaga ditolak server.                                                                                                                                                                                                                                                                                                                               | Urusan internal patungan.                                                         |
| BL2  | **Satu catatan = wadah belanja** (judul, penginput, item). Penginput bisa **mencicil**: tambah item hari ini, tambah lagi besok, selama belum dikunci.                                                                                                                                                                                                                                                       | Kebiasaan owner; ide ketua.                                                       |
| BL3  | **Satu item = nama + harga.** Harga adalah total baris itu; jumlah ditulis bebas di nama ("Ayam 2 kg"). Tiap item mencatat waktu tambah (jam server).                                                                                                                                                                                                                                                        | Mirip kebiasaan nulis di WA, input tercepat.                                      |
| BL4  | **Harga bilangan bulat rupiah, minimal 1, tanpa minus, tanpa desimal, tanpa huruf.** Divalidasi **di server**; layar hanya membantu pesan galat. Total **selalu dihitung server**, aplikasi tidak pernah mengirim total.                                                                                                                                                                                     | Aturan dasar sistem; keputusan ketua.                                             |
| BL5  | **Judul catatan bebas, boleh kosong.** Bila kosong, otomatis terisi tanggal dan nama penginput. Judul boleh diedit selama belum dikunci.                                                                                                                                                                                                                                                                     | Yang buru-buru tetap bisa lanjut.                                                 |
| BL6  | **Struk tidak diunggah.** Struk fisik jadi bukti saat ngumpul. Tidak ada Storage terpakai.                                                                                                                                                                                                                                                                                                                   | Struk sering bercampur belanja pribadi; keputusan ketua.                          |
| BL7  | **Hanya penginput yang boleh menambah, mengedit, membatalkan item, mengubah judul, dan mengunci** catatannya. Owner lain hanya melihat.                                                                                                                                                                                                                                                                      | Menghindari angka orang lain berubah diam-diam.                                   |
| BL8  | **Tanpa DELETE.** Item yang salah ditandai **Dibatalkan** (tetap tersimpan, tidak ikut total).                                                                                                                                                                                                                                                                                                               | Aturan bagian 7 `AGENTS.md`.                                                      |
| BL9  | **Kunci manual oleh penginput lewat tombol Kunci, tidak ada kunci otomatis.** Setelah dikunci, tidak bisa ditambah atau diedit siapa pun. **Kunci satu arah**: pembukaan hanya oleh ketua di SQL Editor (perubahan berisiko, wajib "OK" ketua).                                                                                                                                                              | Hari ngumpul tidak tetap; keputusan ada di owner.                                 |
| BL10 | Arti tombol Kunci: **"sudah dibahas bareng, jangan dihitung lagi"**, bukan "selesai input". Teks tombol dan Bantuan harus menjelaskan ini.                                                                                                                                                                                                                                                                   | Kunci dini membuat catatan hilang dari rekap dan tidak bisa dibuka dari aplikasi. |
| BL11 | **Rekap bawaan = semua catatan yang belum terkunci**, tanpa filter tanggal: total keseluruhan dan **total per owner**. Item Dibatalkan tidak dihitung. Yang tampil di daftar sama persis dengan yang dijumlah.                                                                                                                                                                                               | Ibu-ibu mudah bingung dengan tanggal; keputusan ketua.                            |
| BL12 | **Saklar "tampilkan juga yang terkunci"** menampilkan catatan terkunci, dibatasi **10 terbaru**. Angka 10 disimpan di database.                                                                                                                                                                                                                                                                              | Mengurangi risiko "catatan hilang".                                               |
| BL13 | **Tampilan akordeon:** tiap catatan satu baris (judul, penginput, total); diketuk membuka daftar item.                                                                                                                                                                                                                                                                                                       | Sederhana.                                                                        |
| BL14 | **Input item lewat daftar sementara di layar, dikirim sekali dengan tombol Simpan** (satu panggilan untuk banyak item). Peringatan "ada item belum disimpan" sebelum keluar layar. **Bawaan: draft tidak disimpan otomatis di HP** (tidak menambah data di `localStorage`); ketua boleh mengubah.                                                                                                            | Hemat panggilan ke server; menjaga aturan data di HP.                             |
| BL15 | **Tanpa push, tanpa inbox, tanpa polling.** Data diambil saat layar dibuka dan lewat tombol **Segarkan**.                                                                                                                                                                                                                                                                                                    | Aturan hemat free tier.                                                           |
| BL16 | Tempat menu: **menu hamburger**, item baru "Belanja Warung" di bawah Kotak masuk, **hanya tampil untuk owner** (di layar peran lain item tidak digambar). Menyembunyikan item hanya kenyamanan; yang menolak non-owner tetap server (BL1). Tanpa titik merah. Kode hamburger lama hanya **ditambah** satu item, tidak ada yang dihapus. Mengubah keputusan awal (Lainnya) atas permintaan ketua 18 Nov 2026. | Ketua ingin menu di hamburger.                                                    |

## 3. Alur Singkat

1. Owner membuka Belanja Warung: akordeon catatan belum terkunci, rekap di atas.
2. **Catatan baru:** isi judul (opsional), tambah item satu per satu ke daftar layar, tekan **Simpan** (satu panggilan).
3. **Mencicil:** buka catatan sendiri, tambah item, **Simpan** lagi.
4. **Salah input:** edit nama atau harga, atau tandai item **Dibatalkan**.
5. **Hari ngumpul:** semua melihat rekap. Setelah dibahas, tiap penginput menekan **Kunci** pada catatannya.

## 4. Rancangan Teknis (ringkas)

- **Tabel baru:** `belanja` (catatan: judul, penginput, dibuat, dikunci pada) dan `belanja_item` (nama, harga, dibatalkan, waktu tambah). Nama kolom final ditentukan di sesi kode. RLS aktif tanpa policy; hak `service_role` minimal, **tanpa DELETE**, UPDATE hanya yang diperlukan.
- **Fungsi SQL atomik** (`SECURITY DEFINER`, `search_path` kosong, `EXECUTE` hanya `service_role`): buat catatan dengan banyak item, tambah item (batch), ubah item, batalkan item, ubah judul, kunci, baca daftar plus rekap. Peran owner dan kepemilikan dicek di dalam fungsi dari identitas token login.
- **Aksi `kedai` baru** di berkas baru `supabase/functions/kedai/belanja.ts` (mengikuti blok 9 Nov 2026 di `AGENTS.md`). Hanya satu aksi baca untuk daftar dan rekap.
- **Pengaturan di database** (nilai awal usulan, ketua boleh mengubah): `belanja_harga_maks` 5.000.000; `belanja_nama_maks` 60 karakter; `belanja_judul_maks` 60; `belanja_item_maks` 50 item per catatan; `belanja_terkunci_tampil` 10.
- **Frontend:** `public/belanja.js` (satu berkas, di bawah ~500 baris), gaya di `public/belanja.css` (kelas `blj-`, pengecualian CSS mengikuti pola `game.css`; butuh dicatat). Semua teks lewat `textContent`. Berkas baru wajib didaftarkan di cache `sw.js` (butuh "OK").
- **Tidak ada pengecualian baru** dari aturan tulis-database: semua tulis lewat fungsi SQL atomik.

## 5. Aturan yang Paling Sering Terlanggar

1. Aplikasi tidak pernah mengirim total atau peran. Server yang menjumlah dan memeriksa owner.
2. Harga divalidasi di server (bulat, minimal 1, tanpa minus atau desimal), bukan hanya di layar.
3. Tidak ada DELETE: salah input = Dibatalkan.
4. Setelah dikunci, tidak ada tambah atau edit apa pun, termasuk ubah judul.
5. Hanya penginput yang boleh mengubah catatannya; owner lain hanya membaca.
6. Rekap harus cocok dengan daftar di layar (yang belum terkunci tampil semua, tanpa batas 10).
7. Batas dan angka yang bisa berubah ada di `pengaturan`, bukan di kode.
8. Data nyata (nama owner, isi belanja asli) tidak masuk chat, md, atau repo; contoh dan tes pakai dummy.

## 6. Versi Rilis dan Jadwal (menunggu ketua dan owner)

- Kecenderungan: ibu ketua kemungkinan memilih **versi 1 sebelum Peluncuran** (ia sendiri menanyakan fitur ini saat sesi input menu). **Belum final.**
- Opsi **A**: V1 sebelum Peluncuran, jadwal rilis terbatas (rencana Senin 23 Nov 2026) bisa mundur lagi. Opsi **C**: V1 dikerjakan saat uji coba terbatas dan harus selesai sebelum LNC.04; jadwal Senin tidak bergeser, tetapi fitur dikerjakan di production yang sudah dipakai.
- **Kuota:** cek 18 Nov 2026 menunjukkan pemakaian sangat rendah (Edge Function sekitar 5.300 panggilan dari batas sekitar 500.000, database 27,85 MB dari 500 MB). Fitur ini kecil (5 owner, teks pendek, tanpa file), bukan penentu upgrade. Dipantau di LNC.02 dan LNC.05.

## 7. Urutan Pekerjaan (untuk sheet)

| ID     | Pekerjaan                                                                                                                  | Prioritas | Risiko |
| :----- | :------------------------------------------------------------------------------------------------------------------------- | :-------- | :----- |
| BLJ.00 | Keputusan ketua dan owner: versi rilis (V1 sebelum Peluncuran atau sebelum LNC.04) dan OK untuk `belanja.css`              | P0        | High   |
| BLJ.01 | Migration tabel `belanja`, `belanja_item`, dan baris `pengaturan`; penjelasan dampak dan "OK" ketua                        | P0        | High   |
| BLJ.02 | Fungsi SQL (buat, tambah batch, ubah, batalkan, judul, kunci, baca plus rekap)                                             | P0        | High   |
| BLJ.03 | Aksi `kedai` di `belanja.ts`                                                                                               | P0        | High   |
| BLJ.04 | Item "Belanja Warung" di hamburger (owner saja), layar daftar akordeon, rekap, saklar terkunci                             | P1        | Low    |
| BLJ.05 | Layar input (daftar sementara, Simpan, peringatan) dan edit                                                                | P1        | Low    |
| BLJ.06 | Daftar `belanja.js` dan `belanja.css` di cache `sw.js`; penjelasan dampak dan "OK"                                         | P1        | High   |
| BLJ.07 | Tes keamanan: SEC baru (non-owner ditolak, bukan penginput ditolak, harga tidak valid ditolak, terkunci tidak bisa diubah) | P0        | High   |
| BLJ.08 | Entri Bantuan owner, dan pembersihan data uji di LNC.01                                                                    | P2        | Low    |

## 8. Ditunda

- Status **"sudah diganti"** per owner dan konsep utang atau lunas (kandidat versi 2).
- **Kunci semua** oleh owner mana pun saat ngumpul.
- Filter tanggal, ekspor atau cetak rekap, foto struk, kategori belanja, jumlah dan harga satuan terpisah.
- Draft tersimpan otomatis di HP.

---

## 9. Catatan Susulan (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik`. Yang paling akhir menang.

### 2026-11-18: Versi rilis diputuskan (BLJ.00)

Keputusan ketua (18 Nov 2026), setelah berdiskusi dengan ibu ketua. Alasan keputusan di luar yang tertulis belum tercatat.

- **Versi rilis: Opsi A.** Belanja Warung dikerjakan sebagai V1 **sebelum Peluncuran**, bukan Opsi C. Preferensi ketua: dikerjakan sekarang, bukan saat data nyata sudah masuk. Tim dinilai bisa mengejar (Turnstile dan batas order selesai cepat).
- **Jadwal:** ibu ketua meminta rilis terbatas tetap **Senin 23 Nov 2026**; target itu dipertahankan, tetapi tidak dijamin.
- **Belum diputuskan:** bila fitur belum selesai saat Senin, apakah rilis tetap jalan tanpa fitur ini atau mundur. Strategi uji coba terbatas dibahas tim **Sabtu 21 Nov 2026**.
- **`belanja.css` disetujui** (pengecualian CSS mengikuti pola `game.css`). Pendaftaran `belanja.css` dan `belanja.js` di cache `sw.js` tetap butuh "OK" terpisah (BLJ.06).
- **Pertentangan dengan catatan lama:** bagian 6 ("kecenderungan, belum final") dan Opsi C diganti oleh blok ini.

### Handoff #1 | 2026-11-18 | (KETUA)

**Tugas:** BLJ.00 (keputusan versi rilis dan `belanja.css`) dan BLJ.01 (migration tabel `belanja`, `belanja_item`, dan lima baris pengaturan). BLJ.00 selesai. BLJ.01 selesai dan terbukti. BLJ.02 baru dijelaskan dampaknya, belum ada SQL-nya.

**File yang diubah:**

- Baru di `supabase/migrations/`: `20261118_02_belanja.sql` dan `20261118_02_belanja_batal.sql`.
- Baru di `supabase/templates/`: `20261118_02_belanja_cek.sql`.
- Ketiganya sudah disimpan di repo dan migration sudah dijalankan di SQL Editor. **Status commit dan push belum dikonfirmasi.** Jangan pakai `[skip ci]` karena commit menyentuh `supabase/`.
- Tidak ada perubahan `kedai`, `sw.js`, atau `public/`.

**Keputusan baru (ketua, 18 Nov 2026):**

- **Versi rilis: Opsi A.** Belanja Warung dikerjakan sebagai V1 sebelum Peluncuran. Preferensi ketua: dikerjakan sekarang, bukan saat data nyata sudah masuk.
- Target rilis terbatas tetap **Senin 23 Nov 2026**, atas permintaan ibu ketua.
- **`belanja.css` disetujui.**
- **BLJ.01:** rancangan tabel disetujui ("OK" ketua). Pilihan penulis yang ikut disetujui: nama penginput disalin ke `belanja`, tanda dibatalkan satu boolean tanpa siapa dan kapan, id memakai uuid.
- Alasan ketua di luar yang tertulis: alasan belum tercatat.

**Terbukti (query cek A sampai G, 18 Nov 2026, dibaca bersama di chat):**

- RLS aktif di kedua tabel, tanpa policy.
- `service_role` hanya `INSERT, SELECT, UPDATE` (tanpa DELETE); `anon` dan `authenticated` nol.
- Lima pagar dan dua kunci asing terpasang. Lima pengaturan bernilai 5000000, 60, 60, 50, 10. Kedua tabel kosong.

**Masalah yang belum beres:**

- **Belum diputuskan:** bila Belanja Warung belum selesai saat Senin 23 Nov, apakah rilis terbatas tetap jalan tanpa fitur ini atau mundur lagi. Dibahas tim Sabtu 21 Nov 2026.
- Tiga blok catatan (`belanja.md` bagian 9, `AGENTS.md` bagian 12, `features.md` bagian 11) tentang BLJ.00 **belum dipastikan sudah ditempel**.
- `20261118_02_belanja_batal.sql` belum pernah dicoba.
- BLJ.02 menunggu "OK" ketua atas rancangannya. Tiga pilihan penulis yang masih bisa diubah: item Dibatalkan tidak bisa diaktifkan lagi, batas 50 item dihitung termasuk yang dibatalkan, catatan tanpa item tidak boleh dibuat. Belum diputuskan juga apakah berkas uji SQL dummy ikut dibuat.

**Saran giliran berikutnya:**

1. Pastikan tiga blok BLJ.00 sudah ditempel, centang BLJ.00 dan BLJ.01 di sheet, lalu commit dan push dengan pengecekan anti-nyasar.
2. Sesi BLJ.02: lampirkan `AGENTS.md`, `belanja.md`, `database.md`, `security.md`, `20261105_akun.sql`, `20261108_order.sql`, `20261118_order_batas_harian.sql`, dan `20261118_02_belanja.sql`. Awali dengan jawaban ketua atas tiga pilihan penulis di atas, lalu SQL ditulis.
3. Sesudah BLJ.02, urutan berikutnya BLJ.03 (aksi `kedai` di `belanja.ts`; deploy sesuai urutan aman), lalu BLJ.04 dan BLJ.05 (layar), BLJ.06 (`sw.js`, butuh "OK"), dan BLJ.07 (tes keamanan SEC baru).

### Handoff #2 | 2026-11-18 | (RAC)

**Tugas:** BLJ.02 (fungsi SQL Belanja Warung). Selesai, terbukti, dan sudah dicentang di sheet.

**File yang diubah:**

- Baru di `supabase/migrations/`: `20261118_03_belanja_fungsi.sql` dan `20261118_03_belanja_fungsi_batal.sql`.
- Baru di `supabase/templates/`: `20261118_03_belanja_fungsi_cek.sql` dan `20261118_03_belanja_fungsi_uji.sql`. Berkas uji di repo berisi id nol; salinan di SQL Editor yang berisi id akun dummy **tidak boleh disimpan ke repo**.
- Migration sudah dijalankan di SQL Editor. **Status commit dan push belum dikonfirmasi** (git status terakhir: keempat berkas masih untracked). Commit menyentuh `supabase/`, jadi tanpa `[skip ci]` sesuai aturan 12 Nov; keputusan memakainya tetap di ketua.
- Tidak ada perubahan `kedai`, `sw.js`, `public/`, tabel, hak tabel, atau pengaturan (dua baris pengaturan diubah sementara oleh berkas uji, lalu dikembalikan; terbukti).

**Keputusan baru:**

- Empat pilihan penulis disetujui lewat "gas" PIC (18 Nov 2026): item Dibatalkan tidak bisa diaktifkan lagi dan tidak bisa diedit; batas 50 item dihitung termasuk yang Dibatalkan; catatan tanpa item ditolak; berkas uji dummy dibuat.
- Pilihan penulis tambahan (alasan belum tercatat dari ketua): **rekap hanya menjumlah catatan belum terkunci, juga saat saklar "tampilkan yang terkunci" menyala** (menafsirkan BL11; tiap catatan membawa totalnya sendiri); ubah item mengirim nama dan harga sekaligus; batal dua kali atau mengedit item Dibatalkan = `item_sudah_batal`; judul kosong diisi "DD-MM-YYYY Nama penginput"; daftar tidak membawa id akun, hanya `milik_saya`; urutan item satu kiriman dijaga lewat `clock_timestamp()`; tiga fungsi pembantu baca-saja (`belanja_angka`, `belanja_owner`, `belanja_item_periksa`).
- Tidak ada pertentangan dengan blok lama.

**Terbukti (18 Nov 2026, dibaca bersama di chat, tidak disimpan):**

- Cek A sampai E: 10 fungsi ada, `SECURITY DEFINER`, `search_path` kosong; `EXECUTE` hanya `postgres` dan `service_role`; lima pengaturan utuh; hak tabel `INSERT, SELECT, UPDATE` tanpa DELETE; tabel kosong sebelum uji.
- Berkas uji dummy: **104 dari 104 lulus** (peran, kepemilikan, validasi harga dan nama, batas 50 item, kunci satu arah, rekap, `pengaturan_rusak`, balasan tanpa id akun).

**Kode galat untuk BLJ.03 (dipetakan ke status HTTP dan pesan ramah, tanpa angka):** baru di fitur ini: `belanja_tidak_ditemukan`, `item_tidak_ditemukan`, `bukan_penginput`, `belanja_terkunci`, `item_sudah_batal`, `judul_tidak_valid`, `nama_item_tidak_valid`, `harga_tidak_valid`, `harga_terlalu_besar`. Dipakai ulang: `id_kosong`, `peran_tidak_boleh`, `akun_nonaktif`, `item_kosong`, `item_tidak_valid`, `item_terlalu_banyak`. `pengaturan_rusak` tidak dipetakan (galat umum 500).

**Masalah yang belum beres:**

- **Persetujuan ketua** atas rancangan BLJ.02 (termasuk tafsir rekap di atas) belum tercatat jelas; "gas" datang dari PIC. Teruskan ringkasan ke ketua lewat WA (aturan 12).
- Blok catatan `docs/database.md` bagian 9 (fungsi baru dan kode galatnya) **belum ditulis**.
- **Data uji dummy masih di database:** 3 catatan, 56 item, 2 catatan terkunci. Dibersihkan ketua di BLJ.08 dan LNC.01 dengan penjelasan dampak dan "OK", sebelum layar Belanja dipakai owner.
- Belum terbukti: dua kiriman bersamaan (kunci dan tambah item); jalur `akun_nonaktif`; jalur token `kedai` (BLJ.07); `_batal.sql` belum pernah dicoba.
- Butir baru yang perlu ditambah ke sheet: "Uji tangan kunci dan tambah item bersamaan (dua tab)".
- Baris SEC baru untuk Belanja belum ada di `security.md` (BLJ.07).
- Dari Handoff #1, masih berlaku: belum diputuskan apakah rilis terbatas Senin 23 Nov tetap jalan bila Belanja belum selesai (dibahas tim Sabtu 21 Nov).

**Saran giliran berikutnya:**

1. Commit dan push keempat berkas dengan cek anti-nyasar (folder aktif, `git remote -v`, email commit terakhir, semuanya ditempel ke chat).
2. Sesi BLJ.03 (aksi `kedai` di `belanja.ts`). Lampirkan `AGENTS.md`, `belanja.md`, `database.md`, `security.md`, `20261118_03_belanja_fungsi.sql`, `supabase/functions/kedai/index.ts`, serta satu berkas kelompok aksi sebagai contoh pola (`ringkasan.ts` untuk aksi khusus owner, dan `order_status.ts` untuk `buatAksi...(alat)`). Awali dengan keputusan ketua soal tafsir rekap, lalu kode ditulis.
3. Deploy `kedai` sesuai urutan aman bagian 8 (tanpa `--no-verify-jwt`, token ketua, satu langkah per giliran). Setelah itu BLJ.04 dan BLJ.05 (layar), BLJ.06 (`sw.js`, butuh "OK"), dan BLJ.07 (tes keamanan).

### 2026-11-18: Tafsir rekap saat saklar "tampilkan yang terkunci" menyala

Keputusan ketua (18 Nov 2026), setelah penjelasan di sesi BLJ.03. Alasan ketua selain yang tertulis di bawah: alasan belum tercatat.

- **Rekap (total keseluruhan dan total per owner) selalu hanya menjumlah catatan belum terkunci**, juga saat saklar "tampilkan juga yang terkunci" menyala. Ini sesuai perilaku `belanja_daftar` yang sudah jalan. **Tidak ada perubahan SQL** dan tidak ada migration baru.
- Catatan terkunci yang ikut tampil membawa totalnya sendiri dan tidak masuk rekap.
- **Pertentangan dengan teks lama:** BL11 ("yang tampil di daftar sama persis dengan yang dijumlah") dan aturan 6 bagian 5 dibaca hanya untuk **kondisi saklar mati**. Untuk saklar menyala, blok ini yang menang.
- **Kewajiban layar (BLJ.04):** rekap diberi label jelas bahwa ia hanya menghitung catatan belum terkunci (contoh: "Total belum terkunci"). Catatan terkunci ditampilkan terpisah dan tampak berbeda (ada tanda terkunci dan totalnya sendiri), supaya tidak disangka ikut dijumlah.
- Menutup butir "persetujuan ketua atas tafsir rekap" di Handoff #2.
- **Persetujuan ketua atas pilihan penulis BLJ.02** (disampaikan ketua di sesi BLJ.03, 18 Nov 2026; ia menyetujuinya di sesi sebelumnya): item Dibatalkan tidak bisa diaktifkan lagi dan tidak bisa diedit; batas 50 item dihitung termasuk yang Dibatalkan; catatan tanpa item ditolak; judul kosong diisi "DD-MM-YYYY Nama penginput". Alasan ketua selain itu belum tercatat. Menutup butir "persetujuan ketua belum tercatat jelas" di Handoff #2.

### Handoff #3 | 2026-11-18 | (KETUA)

**Tugas:** BLJ.03 (aksi `kedai` Belanja Warung). Selesai, sudah di-deploy dan di-push. Sudah dicentang di sheet.

**File yang diubah (commit 3f3d759, tanpa `[skip ci]`, sudah di-push ke `main`):**

- Baru: `supabase/functions/kedai/belanja.ts`.
- Diubah: `supabase/functions/kedai/index.ts` (hanya ditambah: catatan header, satu import, satu blok sambungan, tujuh `case`; tidak ada baris lama yang berubah, terbukti diff 0 baris hilang).
- Diubah: `docs/belanja.md` (blok catatan sesi ini).
- Tidak ada perubahan SQL, tabel, pengaturan, `sw.js`, atau `public/`.
- `kedai` sudah dideploy sesuai urutan aman bagian 8 (tanpa `--no-verify-jwt`, token ketua dibersihkan, logout dashboard dilakukan).

**Keputusan baru (ketua, 18 Nov 2026):**

- **Tafsir rekap: pilihan A, SQL tidak diubah.** Rekap (total dan per owner) selalu hanya menjumlah catatan belum terkunci, juga saat saklar "tampilkan yang terkunci" menyala. Catatan terkunci yang tampil membawa totalnya sendiri. BL11 dan aturan 6 bagian 5 dibaca hanya untuk saklar mati.
- **Kewajiban layar (BLJ.04):** rekap diberi label jelas ("Total belum terkunci" atau sejenisnya); catatan terkunci tampil terpisah dengan tanda terkunci dan total sendiri.
- Ketua menyatakan empat pilihan penulis BLJ.02 sudah ia setujui di sesi sebelumnya (item Dibatalkan tidak bisa diaktifkan lagi, batas 50 item termasuk yang Dibatalkan, catatan tanpa item ditolak, judul kosong diisi tanggal dan nama). Alasan ketua selain itu belum tercatat.

**Kontrak aksi `kedai` (untuk BLJ.04 dan BLJ.05; semua owner saja, akun dari token):**

- `belanja_daftar` {terkunci?: boolean} membalas `{ok, daftar: {rekap: {total, per_owner: [{nama, total}]}, catatan: [{id, judul, nama_penginput, milik_saya, dibuat_pada, dikunci_pada, total, item: [{id, nama, harga, dibatalkan, ditambah_pada}]}], terkunci_tampil_maks}}`.
- `belanja_buat` {judul?, item: [{nama, harga}]} membalas `{ok, belanja: {id, judul, jumlah_item}}`.
- `belanja_item_tambah` {id, item: [{nama, harga}]} membalas `{ok, belanja: {id, jumlah_item}}`.
- `belanja_item_ubah` {id (item), nama, harga} membalas `{ok, item: {id, nama, harga}}`.
- `belanja_item_batal` {id (item)} membalas `{ok, item: {id}}`.
- `belanja_judul_ubah` {id, judul} membalas `{ok, belanja: {id, judul}}`.
- `belanja_kunci` {id} membalas `{ok, belanja: {id, dikunci_pada}}`.
- Harga dikirim sebagai **angka JSON** (bukan teks). Pesan galat dari server sudah ramah dan tanpa angka; layar tinggal menampilkannya. Hanya `item_kosong`, `item_tidak_valid`, dan sejenisnya yang pesannya umum.
- Di `belanja.ts`, `nama_item_tidak_valid` sengaja ditaruh sebelum `item_tidak_valid` di peta galat, karena `galatDariDb` memakai `includes` dan kunci pertama yang cocok. Jangan diubah urutannya.

**Terbukti (diperiksa di chat, tidak disimpan):**

- Deploy `kedai` berhasil di project yang benar; `belanja.ts` ikut terunggah; tanpa galat.
- Diff `index.ts`: 0 baris lama hilang, 46 baris tambahan, 7 `case` baru.

**Masalah yang belum beres:**

- **Ketujuh aksi belum pernah dipanggil sungguhan.** Deploy sukses belum membuktikan perilakunya; pembuktian di BLJ.04, BLJ.05, dan BLJ.07. Butir sheet sudah tercakup di BLJ.07, tidak perlu butir baru.
- Blok BLJ.00 di `AGENTS.md`, `belanja.md`, dan `features.md` sudah dikonfirmasi ada oleh ketua (18 Nov 2026). Blok `database.md` untuk fungsi BLJ.02 sudah ditempel.
- **Data uji dummy masih di database:** 3 catatan, 56 item, 2 catatan terkunci. Layar BLJ.04 akan menampilkannya. Pembersihan di BLJ.08 dan LNC.01 dengan penjelasan dampak dan "OK" ketua, sebelum layar dipakai owner.
- Belum terbukti: dua kiriman bersamaan (kunci dan tambah item, uji dua tab), jalur `akun_nonaktif`, dan ketiga `_batal.sql` BLJ (belum pernah dicoba).
- Baris SEC baru untuk Belanja belum ada di `security.md` (BLJ.07).
- Belum diputuskan: bila Belanja Warung belum selesai saat Senin 23 Nov 2026, apakah rilis terbatas tetap jalan tanpa fitur ini atau mundur. Dibahas tim Sabtu 21 Nov 2026.
- Persetujuan ketua atas rancangan layar (BLJ.04, BLJ.05) belum ada; penjelasan dampak dan "OK" diminta saat dikerjakan.

**Saran giliran berikutnya:**

1. Sesi BLJ.04. Lampirkan `AGENTS.md`, `belanja.md`, `docs/desain.md`, berkas JS hamburger, `index.html`, satu layar owner sebagai contoh pola (`ringkasan.js` dan `ringkasan.css`), dan `docs/gim.md` bila rincian hamburger ada di sana. Bila nama berkas hamburger belum jelas, minta daftar isi `public/`.
2. BLJ.04: item "Belanja Warung" di hamburger di bawah Kotak masuk, hanya digambar untuk owner, tanpa titik merah, kode hamburger lama hanya ditambah (BL16). Kode baru `public/belanja.js` (di bawah ~500 baris) dan `public/belanja.css` (kelas `blj-`, sudah disetujui ketua). Semua teks lewat `textContent`.
3. BLJ.05 (layar input dan edit, peringatan "ada item belum disimpan"), lalu BLJ.06 (`sw.js`, butuh penjelasan dampak dan "OK" ketua), lalu BLJ.07 (SEC baru), lalu BLJ.08.
4. Commit yang menyentuh `public/` dan `supabase/` jangan memakai `[skip ci]`. Sebelum push, tempel cek anti-nyasar (folder aktif, `git remote -v`, email commit terakhir). Bila yang bertugas bukan ketua, kirim ringkasan perubahan berisiko ke ketua lewat WA dan tunggu "OK" (aturan 12).

---
