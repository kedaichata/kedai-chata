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

---
