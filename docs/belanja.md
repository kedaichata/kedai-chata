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

### Handoff #4 | 2026-11-18 | [KETUA]

**Tugas:** BLJ.04 (layar Belanja Warung owner: item hamburger, daftar akordeon, rekap, saklar terkunci, tombol Kunci). Selesai, sudah di-push dan dites di production dengan akun owner dummy. Siap dicentang di sheet.

**File yang diubah (tanpa `[skip ci]`, sudah di-push ke `main`):**

- Baru: `public/belanja.js` (712 baris), `public/belanja.css` (319 baris).
- Diubah: `public/index.html` (hanya ditambah: satu `<link>`, satu item hamburger `gim-menu-belanja`, satu `<script>`; 0 baris lama hilang).
- Commit: `efba821` (layar awal), `a2d3e8f` (perbaikan bilah atas, tombol Segarkan terpotong), `45d5123` (jeda 5 detik).
- Tidak ada perubahan `kerangka.js`, `gimmenu.js`, `inbox.js`, `sw.js`, `kedai`, SQL, atau pengaturan.

**Keputusan baru:**

- Layar berupa layar penuh sendiri (pola `inbox.js`), bukan tab di `kerangka.js`. Item hamburger hanya tampil untuk owner, ditentukan dari `#nav-owner` (tampilan saja; server tetap menolak non-owner, BL16).
- **Jeda 5 detik** pada Segarkan, Coba lagi, dan saklar (permintaan PIC, pola `ringkasan.js`, alasan: hemat kuota free tier). Selama jeda layar digambar dari memori, tanpa panggilan server. Kunci tidak ditahan jeda. Menutup layar tidak membatalkan balasan yang masih di jalan. Angka 5 detik di kode (bawaan), bukan di `pengaturan`.
- Rekap memakai label "Total belum terkunci"; catatan terkunci tampil terpisah dengan tulisan "Terkunci, tidak ikut dijumlah di atas" dan total sendiri (menjalankan tafsir rekap 18 Nov).
- Dialog Kunci memuat arti tombol (BL10): "sudah dibahas bareng, jangan dihitung lagi". Batal = tombol utama, Ya, kunci = berpinggir merah.
- `belanja.css` memuat satu aturan umum `.gim-menu__item[hidden] { display: none }` supaya item hamburger bertanda `hidden` benar-benar tersembunyi.
- Persetujuan ketua atas rancangan layar BLJ.04: belum tercatat (Handoff #3 menyebutnya diminta saat dikerjakan). Teruskan ringkasan ke ketua lewat WA (aturan 12).

**Terbukti (layar, akun owner dummy, 18 Nov 2026; tidak disimpan):**

- Item hamburger muncul di bawah Kotak masuk; daftar, rekap per owner, akordeon, item Dibatalkan dicoret dan tidak ikut total (hitungan cocok dengan Rp 335.000).
- Saklar terkunci: catatan terkunci tampil terpisah dengan tanda dan total sendiri, tanpa tombol Kunci.
- Tombol Kunci: dialog tampil, "Ya, kunci" berhasil, layar dimuat ulang, rekap jadi Rp 0.
- Jeda 5 detik jalan (tombol "Tunggu sebentar"). Mode pesawat: muncul "Tidak ada internet" dan "Coba lagi".
- Dengan ini ketujuh aksi `kedai` belum semuanya terpakai: yang terbukti lewat layar hanya `belanja_daftar` dan `belanja_kunci`.

**Masalah yang belum beres:**

- Belum dicek: "Total belum terkunci" tetap Rp 0 saat saklar menyala; posisi gulir setelah Kunci di catatan yang letaknya jauh di bawah; jalur sesi habis (401); kunci dan tambah item bersamaan (dua tab).
- Belum dites: item hamburger di akun customer dan penjaga (harus tidak ada), dan di mode pesawat bagi non-owner (bergantung `belanja.css` termuat; `belanja.js` dan `belanja.css` belum ada di cache `sw.js`, BLJ.06).
- **`belanja.js` sudah 712 baris**, melewati patokan sekitar 500 baris (`AGENTS.md` bagian 6). BLJ.05 sebaiknya ditaruh di berkas baru (misalnya `belanjainput.js`), bukan ditambahkan ke `belanja.js`; berkas baru itu juga wajib didaftarkan di `sw.js` (BLJ.06, butuh "OK").
- Data uji dummy masih di database: sebagian catatan kini terkunci (setidaknya satu dikunci dari layar); jumlah pastinya tidak dicek. Dibersihkan di BLJ.08 dan LNC.01 dengan "OK" ketua. Karena kunci satu arah, tes BLJ.05 memakai catatan baru.
- Tulisan "Tunggu sebentar" turun dua baris di layar sempit; hanya tampilan, dibiarkan.
- Masih berlaku dari Handoff #3: belum diputuskan apakah rilis terbatas Senin 23 Nov jalan tanpa Belanja bila belum selesai (dibahas tim Sabtu 21 Nov); baris SEC baru Belanja belum ada di `security.md` (BLJ.07).

**Saran giliran berikutnya:**

1. Sesi BLJ.05 (layar input dan edit). Lampirkan `AGENTS.md`, `belanja.md`, `belanja.js`, `belanja.css`, `index.html`, `menu.js` (pola validasi harga dan pesan galat di tempat), dan `inbox.js` bila perlu. Rencana: tombol besar "Catatan baru", daftar item sementara di layar, satu tombol Simpan semua (`belanja_buat` dan `belanja_item_tambah`), peringatan "ada item belum disimpan", edit dan batalkan item di catatan milik sendiri (`belanja_item_ubah`, `belanja_item_batal`, `belanja_judul_ubah`). Kode galat ada di Handoff #2.
2. Lalu BLJ.06 (`sw.js`, butuh "OK" ketua; daftarkan semua berkas Belanja sekaligus), BLJ.07 (SEC baru), BLJ.08.
3. Commit yang menyentuh `public/` tanpa `[skip ci]`. Sebelum push, cek folder, `git remote -v`, dan email commit terakhir.

### Handoff #5 | 2026-11-18 | [KETUA]

**Tugas:** BLJ.05 giliran 1 (layar Catatan baru: tombol "+ Catatan baru", daftar sementara, Simpan sekali). Selesai, sudah di-push, dan dites di HP oleh ketua. **BLJ.05 belum boleh dicentang di sheet**: giliran 2 (mencicil, ubah item, batalkan item, ubah judul) belum dikerjakan.

**File yang diubah (commit `6d1b2be`, tanpa `[skip ci]`, sudah di-push ke `main`):**

- Baru: `public/belanjainput.js` (layar Catatan baru, aksi `belanja_buat`).
- Diubah: `public/belanja.js` (hanya ditambah 71 baris, 0 baris lama berubah; kini sekitar 783 baris), `public/index.html` (hanya ditambah satu komentar dan satu `<script src="belanjainput.js">` sebelum `belanja.js`; 0 baris lama hilang).
- Diubah: `public/belanja.css` (ditambah sekitar 100 baris di bagian bawah). **Satu baris lama dipindah**: `padding-bottom: env(safe-area-inset-bottom...)` di `.blj-layar` diganti `display: flex; flex-direction: column`, dan jarak aman bawah kini dipegang `.blj-bawah`. Dampak hanya tampilan; ketua menjalankannya setelah dijelaskan.
- Tidak ada perubahan `sw.js`, `kedai`, SQL, tabel, atau pengaturan. `belanjainput.js` **belum** ada di cache `sw.js` (BLJ.06).

**Keputusan baru (ketua, 18 Nov 2026):**

- **BL14: draft tidak disimpan di HP** (bawaan dipertahankan; "gas" ketua atas rekomendasi). Barang yang belum disimpan hilang bila aplikasi tertutup; penebusnya peringatan "Ada yang belum disimpan" saat Kembali atau Esc, dan konfirmasi peramban saat ditutup.
- Pilihan penulis giliran 1 (alasan ketua selain itu belum tercatat): tombol "+ Catatan baru" menempel di bawah layar dan baru tampil setelah daftar berhasil dimuat; judul ditaruh di bawah daftar barang (boleh kosong); tombol Simpan memasukkan otomatis nama dan harga yang sudah diketik tapi belum ditekan Tambah; "Total sementara" hanya tampilan (total resmi dihitung server); daftar sementara hanya punya Hapus (tanpa Ubah); harga memakai titik ribuan otomatis; batas panjang dan harga tidak ditulis di layar (server yang memutuskan); setelah Simpan, pemuatan ulang tidak ditahan jeda 5 detik dan catatan baru terbuka dan tergulir ke layar dengan pesan "Catatan tersimpan ✓".
- Persetujuan ketua atas rancangan layar BLJ.04: **masih belum tercatat jelas**. Rancangan layar BLJ.05 disetujui lewat "gas" ketua di sesi ini.
- Tidak ada pertentangan dengan blok lama.

**Terbukti (tes di HP, akun owner dummy, dilaporkan ketua 18 Nov 2026, tanpa screenshot; tidak disimpan):**

- Tujuh tes sesuai semua, ditambah dua poin lain yang ikut dihitung ketua (sembilan poin sesuai): simpan 3 barang, judul kosong terisi otomatis, isian belum ditambah ikut tersimpan saat Simpan, validasi nama dan harga, peringatan Kembali, Simpan saat tanpa internet, item hamburger tidak ada di akun non-owner.
- Hasil dilaporkan lisan oleh ketua (low-risk, aturan 10 butir 1); bukan bukti query atau balasan server.

**Kejadian (bahan belajar, aturan 10):** isi `belanja.js` baru sempat tertempel ke `public/bantuan.js`. Ketahuan dari `git status` dan `git diff --stat` sebelum commit, jadi tidak sampai produksi. Pemulihan: `belanja.js` diisi dari salinan yang tertempel salah, lalu `bantuan.js` dikembalikan dengan `git restore`; terbukti lewat `grep -c`, `git status --short`, dan `head -1` kedua berkas. Pencegahan: cek nama berkas di tab editor sebelum menempel, dan pastikan baris pertama isi berkas cocok dengan namanya (misalnya `// public/belanja.js`); sebelum commit selalu baca `git status` dan `git diff --stat`.

**Masalah yang belum beres:**

- **BLJ.05 giliran 2 belum ada:** tambah item ke catatan sendiri (mencicil, `belanja_item_tambah`), ubah item (`belanja_item_ubah`), batalkan item (`belanja_item_batal`), ubah judul (`belanja_judul_ubah`). Dari tujuh aksi `kedai`, yang sudah terbukti lewat layar: `belanja_daftar`, `belanja_kunci`, dan `belanja_buat`.
- Belum dites: sesi habis (401) saat Simpan, dua tab bersamaan, iPhone, layar sangat sempit, dan jumlah barang melewati batas server (pesan `item_terlalu_banyak`).
- **Data uji dummy bertambah** (tiap tes yang menyimpan membuat satu catatan; jumlah pastinya tidak dicek). Dibersihkan ketua di BLJ.08 dan LNC.01 dengan penjelasan dampak dan "OK".
- **BLJ.06 kini harus mendaftarkan empat berkas** ke cache `sw.js` sekaligus bila giliran 2 memakai `belanjaedit.js`: `belanja.js`, `belanja.css`, `belanjainput.js`, `belanjaedit.js` (butuh "OK" ketua).
- Masih berlaku dari handoff sebelumnya: belum diputuskan apakah rilis terbatas Senin 23 Nov 2026 jalan tanpa Belanja bila belum selesai (dibahas tim Sabtu 21 Nov); baris SEC baru Belanja belum ada di `security.md` (BLJ.07); belum diuji kunci dan tambah item bersamaan (dua tab); `_batal.sql` BLJ belum pernah dicoba.

**Saran giliran berikutnya:**

1. Sesi BLJ.05 giliran 2. Lampirkan `AGENTS.md`, `belanja.md` (termasuk handoff ini), `belanja.js`, `belanjainput.js`, `belanja.css`, `index.html`. Kontrak aksi ada di Handoff #3, kode galat ada di Handoff #2.
2. Rencana: berkas baru `belanjaedit.js` (agar `belanja.js` tidak makin gemuk). Di catatan milik sendiri yang belum terkunci: tombol "+ Tambah barang" (memakai ulang layar input tanpa kolom judul), tombol Ubah dan Batalkan per barang (Batalkan dengan konfirmasi yang jujur bahwa tidak bisa dihidupkan lagi), dan tombol Ubah judul. Berkas yang berubah: `belanjaedit.js` (baru), `belanja.js`, `belanja.css`, `index.html`.
3. Setelah giliran 2 lulus tes: centang BLJ.05 di sheet, lalu BLJ.06 (`sw.js`, "OK" ketua), BLJ.07 (SEC baru), BLJ.08.
4. Commit yang menyentuh `public/` tanpa `[skip ci]`. Sebelum push, tempel cek anti-nyasar (`pwd`, `git remote -v`, email commit terakhir). Sebelum commit, baca `git status` dan `git diff --stat`.

### Handoff #6 | 2026-11-18 | [KETUA]

**Tugas:** BLJ.05 giliran 2 (tambah barang, ubah barang, batalkan barang, ubah judul). Kode selesai dan sudah di-push. **Belum dites. BLJ.05 belum boleh dicentang di sheet**, tunggu tes lulus.

**File yang diubah (commit `97ef21d`, tanpa `[skip ci]`, sudah di-push ke `main`; 5 berkas, 657 baris bertambah, 12 dihapus):**

- Baru: `public/belanjaedit.js` (dialog ubah barang, batalkan barang, ubah judul; `window.KedaiBelanjaEdit`).
- Diubah: `public/belanja.js` (kini sekitar 893 baris; tombol Tambah barang, Ubah judul, serta Ubah dan Batalkan per barang). **Satu baris lama diganti:** `ul.appendChild(gambarItem(item[j]));` menjadi tiga baris (buat item, tambah tombol bila boleh, masukkan). Hasil sama untuk catatan yang bukan milik sendiri atau sudah terkunci.
- Diubah: `public/belanjainput.js` (kini sekitar 642 baris; mode "tambah" lewat `buka({mode: "tambah", id, judul, onSimpan})`). **11 baris lama dimodifikasi:** teks tombol Simpan lewat `labelSimpan`, aksi lewat variabel `aksi` (bawaan tetap `belanja_buat`), judul layar dan kalimat pengantar disimpan di variabel. Perilaku mode catatan baru tidak berubah.
- Diubah: `public/belanja.css` (hanya ditambah 28 baris), `public/index.html` (hanya ditambah satu `<script src="belanjaedit.js">` sebelum `belanja.js`).
- Tidak ada perubahan `sw.js`, `kedai`, SQL, tabel, atau pengaturan. **`belanjaedit.js` belum ada di cache `sw.js`** (BLJ.06).

**Keputusan baru (ketua, 18 Nov 2026):**

- **Satu kali push dan satu kali tes untuk giliran 2a dan 2b**, bukan per giliran. Alasan ketua: belum ada pengguna sungguhan, semua data dummy, dan sedang buru-buru. Karena `belanja.js` memuat 2a dan 2b sekaligus, hasilnya satu commit.
- Rancangan giliran 2 disetujui lewat "gas" ketua. Pilihan penulis (alasan ketua selain itu belum tercatat): barang dibatalkan memakai konfirmasi yang menjelaskan bahwa tidak bisa dihidupkan atau diubah lagi; Ubah judul memakai dialog; tombol hanya di catatan milik sendiri yang belum terkunci (server tetap yang memutuskan); kolom judul disembunyikan di mode tambah.
- Tidak ada pertentangan dengan blok lama.

**Terbukti:** hanya pemeriksaan sintaks (`node --check`), `git diff --stat`, dan cek anti-nyasar sebelum push (folder, remote, dan email commit milik ketua, kunci SSH khusus ChATA). Tidak ada bukti dari layar atau balasan server.

**Masalah yang belum beres:**

- **Keempat aksi belum pernah dipanggil dari layar:** `belanja_item_tambah`, `belanja_item_ubah`, `belanja_item_batal`, `belanja_judul_ubah`. Tes di HP (7 butir) belum dijalankan: tambah barang, ubah barang, harga kosong atau 0, batalkan barang, ubah judul (termasuk dikosongkan), tombol tidak ada di catatan terkunci atau milik owner lain, Esc dan ketuk area gelap hanya menutup dialog.
- **Belum diketahui:** perilaku server saat judul dikosongkan di `belanja_judul_ubah` (ditolak atau diisi otomatis). Layar hanya menampilkan jawaban server.
- Belum dites: sesi habis (401) saat menyimpan, dua tab bersamaan, iPhone, layar sangat sempit, jumlah barang melewati batas 50.
- **`belanja.js` sekitar 893 baris dan `belanjainput.js` sekitar 642 baris**, di atas patokan sekitar 500 baris (`AGENTS.md` bagian 6). Belum ada keputusan memecah. Memecah kode lama butuh penjelasan dampak dan "OK" ketua.
- **BLJ.06 harus mendaftarkan empat berkas** ke cache `sw.js` sekaligus: `belanja.js`, `belanja.css`, `belanjainput.js`, `belanjaedit.js` (versi cache naik dari `chata-v35`; butuh penjelasan dampak dan "OK" ketua).
- **Data uji dummy bertambah** (tiap tes membuat catatan baru; jumlah pastinya tidak dicek). Dibersihkan ketua di BLJ.08 dan LNC.01 dengan "OK".
- Masih berlaku dari handoff sebelumnya: belum diputuskan apakah rilis terbatas Senin 23 Nov 2026 jalan tanpa Belanja bila belum selesai (dibahas tim Sabtu 21 Nov); persetujuan ketua atas rancangan layar BLJ.04 belum tercatat; baris SEC baru Belanja belum ada di `security.md` (BLJ.07); belum diuji kunci dan tambah item bersamaan (dua tab); `_batal.sql` BLJ belum pernah dicoba.

**Saran giliran berikutnya:**

1. Tes 7 butir di atas di HP dengan akun owner dummy (catatan baru, karena kunci satu arah). Bila ada yang gagal, perbaiki dulu. Bila semua lulus, centang BLJ.05 di sheet.
2. BLJ.06: daftarkan keempat berkas ke `sw.js` (lampirkan `sw.js` terbaru; penjelasan dampak dan "OK" ketua; commit tanpa `[skip ci]`).
3. BLJ.07: tes keamanan dan baris SEC baru (lampirkan `AGENTS.md`, `belanja.md`, `security.md`). Aksi baru ikut dibuktikan lewat BLJ.07.
4. BLJ.08: entri Bantuan owner dan pembersihan data uji.
5. Sebelum push selalu tempel `pwd`, `git remote -v`, dan email commit terakhir, dan baca `git status` serta `git diff --stat` sebelum commit.

### Handoff #7 | 2026-11-18 | [RAC]

**Tugas:** tes BLJ.05 giliran 2 (7 butir) dan BLJ.06 (daftar cache `sw.js`). Keduanya selesai dan sudah dicentang di sheet (18 Nov).

**File yang diubah (commit `a63b232`, tanpa `[skip ci]`, sudah di-push ke `main`, `b06f39e..a63b232`):**

- Diubah: `public/sw.js` (6 baris bertambah, 1 berubah). Versi cache `chata-v35` naik ke `chata-v36`; baris v35 lama tidak dihapus, hanya diberi `//` (pola riwayat yang sudah ada). Empat berkas masuk `DAFTAR_CACHE`: `belanja.css`, `belanja.js`, `belanjainput.js`, `belanjaedit.js`.
- Tidak ada perubahan `kedai`, SQL, tabel, pengaturan, atau berkas lain di `public/`.

**Keputusan baru:**

- "OK" ketua untuk BLJ.06 diberikan lewat WA (PIC bukan ketua; ringkasan dampak diteruskan sesuai aturan 12). Alasan ketua di luar yang tertulis: belum tercatat.
- Hasil tes: `belanja_judul_ubah` dengan judul dikosongkan **mengisi otomatis** tanggal dan nama owner (bukan menolak). Menjawab butir "belum diketahui" di Handoff #6.
- Tidak ada pertentangan dengan blok lama.

**Terbukti:**

- Tes BLJ.05 giliran 2, 7 butir **sesuai semua** (tambah, ubah, ubah dengan harga kosong atau 0, batalkan, ubah judul termasuk dikosongkan, tombol tidak ada di catatan terkunci dan milik owner lain, Esc dan ketuk area gelap hanya menutup dialog). Dites di HP dan laptop; owner uji kedua dari laptop. Laporan lisan PIC (low-risk, aturan 10 butir 1), bukan balasan server.
- Screenshot daftar: total Rp 116.000 = Rp 30.000 + Rp 86.000, cocok dengan dua catatan; label "Total belum terkunci" dan saklar terkunci tampil sesuai rancangan.
- Cache Storage DevTools: `chata-v36` ada dan memuat keempat berkas `belanja*` (dilihat di chat, tidak disimpan). Di HP, mode pesawat menampilkan "Tidak ada internet", dan Coba lagi memulihkan tampilan (laporan lisan).
- Dengan ini ketujuh aksi `kedai` Belanja sudah terpakai dari layar, tetapi hanya jalur sah. **Penolakan oleh server belum dibuktikan** (BLJ.07).

**Masalah yang belum beres:**

- **BLJ.07 (P0) belum dimulai.** Belum ada bukti balasan server untuk: customer dan penjaga ditolak (403), tanpa token (401), owner B ke catatan owner A ditolak, harga tidak valid ditolak, catatan terkunci tidak bisa diubah, total dan peran dari aplikasi diabaikan. Baris SEC baru Belanja belum ada di `security.md`; di berkas yang dipegang nomor terakhir SEC-45, **cocokkan penomoran dengan sheet dulu**. Akun penjaga dummy belum dipastikan ada.
- Belum dites: sesi habis (401) saat Simpan, dua tab bersamaan (kunci dan tambah item), jalur `akun_nonaktif`, batas 50 item, iPhone, layar sangat sempit. `_batal.sql` BLJ belum pernah dicoba.
- `belanja.js` sekitar 893 baris dan `belanjainput.js` sekitar 642 baris, di atas patokan sekitar 500. Belum ada keputusan memecah (butuh penjelasan dampak dan "OK" ketua).
- **Data uji dummy menumpuk** (jumlah pastinya tidak dicek; sebagian terkunci). Dibersihkan ketua di BLJ.08 dan LNC.01 dengan "OK".
- Masih berlaku: belum diputuskan apakah rilis terbatas Senin 23 Nov 2026 jalan tanpa Belanja bila belum selesai (dibahas tim Sabtu 21 Nov); persetujuan ketua atas rancangan layar BLJ.04 belum tercatat.

**Saran giliran berikutnya:**

1. Sesi BLJ.07. Lampirkan `AGENTS.md`, `belanja.md`, `security.md`, dan `pemetaan-test.md`. Awali dengan mencocokkan status SEC dan penomoran dengan screenshot sheet.
2. Siapkan akun dummy: owner A, owner B, satu customer, satu penjaga. Pemanggilan `kedai` langsung dipandu satu langkah per giliran; token tidak boleh ditempel ke chat.
3. Setelah BLJ.07: BLJ.08 (entri Bantuan owner dan pembersihan data uji, butuh "OK" ketua).

### Handoff #8 | 2026-11-19 | [KETUA]

**Tugas:** tes BLJ.07 (keamanan Belanja Warung). Selesai: SEC-46 sampai SEC-49 lulus semua, dicentang di sheet (SEC-46, 47, 48 tanggal 18 Nov; SEC-49 dan BLJ.07 tanggal 19 Nov).

**File yang diubah (belum di-commit saat catatan ini ditulis):**

- `docs/security.md`: blok baru "2026-11-18: Keamanan Belanja Warung (SEC-46 sampai SEC-49)" di bagian 7 (11 baris bertambah).
- `docs/belanja.md`: handoff ini.
- Tidak ada perubahan `kedai`, SQL, tabel, pengaturan, atau berkas di `public/`.

**Keputusan baru:**

- Fitur susulan setelah tes SEC-01 sampai SEC-45 selesai dicatat sebagai baris SEC baru, bukan membuka ulang baris lama. BLJ.07 jadi payung yang dicentang setelah keempat SEC Belanja lulus. Nomor SEC berikutnya: **SEC-50**. Ketua menyetujui keempat butir (SEC-46 sampai SEC-49) dan menambahkannya sendiri di sheet. Alasan lain di luar yang tertulis: belum tercatat.
- Cara tes yang dipakai (untuk sesi berikutnya): Console browser di aplikasi yang sedang login, lewat `KedaiAkun.panggilKedai(aksi, data)` dari `akun.js`. Token dari sesi login, tidak pernah ditampilkan atau ditempel ke chat. Tes tanpa token memakai `fetch` manual ke alamat `kedai`, karena helper itu membalas 401 sendiri bila tidak ada sesi. Dites di Brave (jendela privat) dengan akun dummy: owner A, owner B, customer, penjaga.
- Tidak ada pertentangan dengan blok lama.

**Terbukti (balasan server, kecuali disebut lain):**

- **SEC-46:** customer dan penjaga: ketujuh aksi 403 "Aksi ini hanya untuk owner." Tanpa token: 401 `UNAUTHORIZED_NO_AUTH_HEADER`. Token palsu: 401 `UNAUTHORIZED_INVALID_JWT_FORMAT` (dibalas platform, boleh menurut aturan 3).
- **SEC-47:** owner B membaca catatan owner A (200, `milik_saya: false`), tetapi tambah item, ubah item, batalkan item, ubah judul, dan kunci pada catatan A semuanya 403 "Catatan ini milik owner lain. Kamu hanya bisa melihatnya."
- **SEC-48:** 19 isian salah ditolak: harga 0, minus, desimal, 1 triliun, huruf, nama kosong atau spasi atau 61 huruf, judul 61 huruf, 51 item, tanpa item (17 kali 400 dan 2 kali 409 untuk batas jumlah item). Harga 5.000.001: 400 "Harga melebihi batas." Total, `dibatalkan`, `dikunci_pada`, `penginput`, dan `akun` palsu dalam isi permintaan diabaikan; total dihitung server (2000, 3000, 4000), penginput tetap nama dari token. Jumlah catatan tidak bertambah dari isian yang ditolak.
- **SEC-49:** catatan terkunci menolak tambah, ubah item, batal item, ubah judul, dan kunci ulang (409), isinya tidak berubah. Item Dibatalkan menolak ubah dan batal ulang (409). Tiga nama aksi hapus (`belanja_hapus`, `belanja_item_hapus`, `belanja_delete`): 400 "Aksi tidak dikenal." Judul dan nama item berisi tag HTML (termasuk `<img onerror>`) tampil sebagai teks mentah di daftar, isi catatan, dialog Ubah barang, dan dialog Ubah judul, tanpa popup (screenshot, dilihat di chat, tidak disimpan).
- **SQL Editor (akun ketua, baca-saja):** sepuluh fungsi `belanja_*` semuanya SECURITY DEFINER dengan `search_path` kosong; EXECUTE hanya untuk `postgres` dan `service_role`; hak tabel `belanja` dan `belanja_item` untuk `service_role` hanya INSERT, SELECT, UPDATE (tanpa DELETE), tanpa baris untuk `anon` dan `authenticated`; RLS aktif di kedua tabel dan tidak ada policy. Query lain di kedua berkas cek sengaja tidak dijalankan ulang (sudah terbukti di BLJ.01 dan BLJ.02, atau isinya "kosong" yang kini tidak berlaku karena sudah ada data uji).
- Tidak ada temuan keamanan baru.

**Masalah yang belum beres:**

- Harga 1 triliun dibalas pesan umum "Harga harus angka bulat...", bukan "Harga melebihi batas." Tetap ditolak, jadi bukan celah. Penyebabnya tidak diselidiki. Batas 5.000.000 terbukti tepat lewat angka 5.000.001.
- **BLJ.08 (P2) belum dimulai:** entri Bantuan owner dan pembersihan data uji. Butuh "OK" ketua.
- **Data uji dummy menumpuk,** untuk dibersihkan di BLJ.08 dan LNC.01 dengan "OK": tiga catatan milik "Bu Owner 2" (satu "Uji SEC48" dan dua "Uji SEC48b"; salah satu "Uji SEC48b" sudah terkunci, satu lagi memuat item Dibatalkan), satu catatan berjudul `<i>judul miring</i>`, dan catatan milik "Owner Uji". Skrip tes SEC-48 bagian 2 terjalankan dua kali, itulah sebab dua "Uji SEC48b".
- Belum dites: sesi habis (401) saat Simpan di layar, dua tab bersamaan (kunci dan tambah item), jalur `akun_nonaktif`, iPhone, layar sangat sempit. `_batal.sql` BLJ belum pernah dicoba.
- `belanja.js` sekitar 893 baris dan `belanjainput.js` sekitar 642 baris, di atas patokan sekitar 500. Belum ada keputusan memecah (butuh penjelasan dampak dan "OK" ketua).
- Masih berlaku dari Handoff #7: belum diputuskan apakah rilis terbatas Senin 23 Nov 2026 jalan tanpa Belanja bila belum selesai (dibahas tim Sabtu 21 Nov); persetujuan ketua atas rancangan layar BLJ.04 belum tercatat.

**Saran giliran berikutnya:**

1. Commit dan push `docs/security.md` dan `docs/belanja.md` (hanya docs, boleh `[skip ci]`), setelah cek anti-nyasar (bagian 8).
2. BLJ.08: entri Bantuan owner dan pembersihan data uji (butuh "OK" ketua). Lampirkan `AGENTS.md`, `belanja.md`, `features.md`, dan `bantuan.md`.
3. Tes sisa yang belum terjamah: `akun_nonaktif`, sesi habis saat Simpan, dua tab bersamaan.

### Handoff #9 | 2026-11-19 | [KETUA]

**Tugas:** BLJ.08 (entri Bantuan owner untuk Belanja Warung). Selesai dan sudah dicentang di sheet (19 Nov). Bagian "pembersihan data uji belanja" yang masih tertulis di baris sheet BLJ.08 **tidak dikerjakan di sini**: dipegang LNC.01 (lihat keputusan baru).

**File yang diubah:**

- Tidak ada berkas di repo. Tidak ada perubahan `public/`, `kedai`, SQL, tabel, pengaturan, atau `sw.js`, dan tidak ada deploy.
- Lembar `bantuan-isi` (Google Sheet, BT7): empat baris baru `belanja-01` sampai `belanja-04`, bagian `Belanja Owner`, `urutan` 850, 860, 870, 880, peran `owner`, `aktif = ya`. Diimpor lewat SQL Editor; SQL impor tidak disimpan di repo.
- Docs: `docs/belanja.md` (handoff ini) dan `docs/bantuan.md` (blok catatan 19 Nov). **Status commit belum dikonfirmasi.** Handoff #8 (`docs/security.md` dan `docs/belanja.md`) juga belum dipastikan sudah di-commit.
  **Keputusan baru:**

- **Bagian khusus "Belanja Owner"** untuk entri Bantuan Belanja, bukan di "Tugas owner" (ketua, 19 Nov: bagian yang hanya dilihat owner). Alasan lain belum tercatat.
- **Pembersihan data uji belanja digabung ke LNC.01**, seperti fitur lain (ketua, 19 Nov). Ketua sudah menambah catatan di baris LNC.01 sheet: data belanja dihapus sebelum akun uji disentuh, urutan `belanja_item` dulu baru `belanja`. Alasan lain belum tercatat.
- **Pertentangan dengan catatan lama:** bagian 7 (baris BLJ.08) dan Handoff #8 menyebut pembersihan di BLJ.08 dan LNC.01. Kini pembersihan hanya di LNC.01. Yang paling akhir menang.
- Pilihan penulis (alasan belum tercatat): empat entri, bukan lima; topik rekap digabung ke entri 1 dan 4. Isi tanpa angka batas dan tanpa data pribadi. Nama tombol diambil dari handoff, lalu **dicocokkan ketua dengan layar asli (lisan, 19 Nov)**.
  **Terbukti:** layar Bantuan akun owner menampilkan bagian Belanja Owner dengan empat pertanyaan, dan akordeon terbuka (screenshot ketua, dilihat di chat, tidak disimpan).

**Masalah yang belum beres:**

- **Pembersihan data uji belanja belum dikerjakan** (LNC.01, High-Risk, butuh penjelasan dampak dan "OK" ketua). Daftar data uji ada di Handoff #8; jumlah pastinya belum dicek. Ekspor CSV dulu (adik ketua).
- Belum dicek dari akun customer dan penjaga bahwa bagian Belanja Owner tidak tampil untuk keduanya (khusus empat baris ini).
- Teks Bantuan memuat nama tombol dan perilaku layar. Bila layar Belanja berubah, catat sebagai butir "perbarui Bantuan".
- Masih berlaku dari Handoff #8: belum dites `akun_nonaktif`, sesi habis saat Simpan, dua tab bersamaan (kunci dan tambah item), iPhone, layar sangat sempit; `_batal.sql` BLJ belum pernah dicoba; harga 1 triliun dibalas pesan umum (tidak diselidiki); `belanja.js` sekitar 893 baris dan `belanjainput.js` sekitar 642 baris, di atas patokan sekitar 500 (butuh penjelasan dampak dan "OK" bila mau dipecah); persetujuan ketua atas rancangan layar BLJ.04 belum tercatat.
- Semua butir BLJ.00 sampai BLJ.08 kini dicentang, jadi pertanyaan "rilis Senin 23 Nov jalan tanpa Belanja" tidak lagi menyangkut fitur ini.
  **Butir baru yang perlu ditambah ke sheet:** tidak ada.

**Saran giliran berikutnya:**

1. Commit dan push docs (`docs/security.md`, `docs/belanja.md`, `docs/bantuan.md`) setelah cek anti-nyasar (`pwd`, `git remote -v`, email commit terakhir). Seluruh isinya docs, jadi `[skip ci]` boleh dipakai; bila ada berkas lain ikut, jangan.
2. Pastikan salinan terbaru lembar `bantuan-isi` dipegang adik ketua (BT7).
3. Sesi LNC.01: lampirkan `AGENTS.md`, `features.md`, `security.md`, `database.md`, `order.md`, `docs/menu.md`, dan migration, termasuk `20261118_02_belanja.sql` (untuk memastikan kunci asing dan urutan hapus, jangan menebak). Mulai dengan query baca-saja, lalu penjelasan dampak dan "OK" ketua.
4. Tes sisa Belanja yang belum terjamah (daftar di atas) bila waktunya ada.

### 2026-11-19: Data uji Belanja dihapus (LNC.01c)

Keputusan ketua (19 Nov 2026), dikerjakan di sesi LNC.01c. Alasan ketua melewati ekspor CSV: data uji dibuat untuk dibuang, jadi tidak ada gunanya disimpan. Alasan lain belum tercatat.

- **Dihapus satu kali oleh ketua di SQL Editor:** seluruh isi `belanja_item` (69 baris, 3 di antaranya Dibatalkan) lalu `belanja` (10 catatan, 5 di antaranya terkunci). Semua milik dua akun uji ("Bu Owner 2" dan "Owner Uji"); ketua mengonfirmasi keduanya akun uji. Tidak ada penginput lain di data itu.
- **Pengecualian tanpa-DELETE** yang dipakai: `security.md` aturan 12 (pembersihan data uji LNC.01). Tidak ada hak DELETE baru. Tabel, hak tabel, pengaturan, dan fungsi Belanja tidak disentuh; akun uji tidak disentuh (urusan LNC.01f).
- **Cara:** satu transaksi dengan pengaman yang membatalkan semuanya bila jumlah bukan 10 dan 69, ada penginput selain dua akun uji, atau jumlah terhapus tidak cocok. Urutan: `belanja_item` dulu, baru `belanja`.
- **Ekspor CSV dilewati** untuk data Belanja karena isinya data uji yang memang tidak dipakai lagi. Ini menyimpang dari saran Handoff #9 dan catatan baris LNC.01 di sheet (“ekspor dulu”); untuk Belanja, blok ini yang menang.
- **Berkas SQL di repo:** `supabase/templates/20261119_belanja_data_uji_cek.sql` (empat query baca-saja) dan `supabase/templates/20261119_belanja_data_uji_hapus.sql` (isi uji sudah terhapus, jadi pengamannya tidak akan lolos bila dijalankan ulang). Tanpa data nyata.
- **Terbukti (19 Nov 2026, dibaca bersama di chat, tidak disimpan):** sebelum hapus, query A sampai D cocok (10 dan 69, hanya dua akun uji, dibuat 18 sampai 19 Nov 2026). Sesudah hapus, `belanja` = 0 dan `belanja_item` = 0 (screenshot ketua).
- **Menutup** butir "data uji dummy menumpuk" di Handoff #8 dan #9 untuk tabel Belanja. Layar Belanja kini tampil kosong sampai owner asli mulai memakainya.
- **Belum terbukti:** `_batal.sql` BLJ tetap belum pernah dicoba; tes sisa (dua tab bersamaan, `akun_nonaktif`, sesi habis, iPhone, layar sangat sempit) tidak berubah dan kini harus memakai catatan baru.

---
