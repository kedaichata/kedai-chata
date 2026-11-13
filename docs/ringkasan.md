/docs/ringkasan.md

# 📊 ringkasan.md: Ringkasan Order 7 Hari untuk Owner

> **Versi 1.0 (13 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Fitur ini sebelumnya kandidat **B31** di `bonus.md`. Owner meminta fitur ini ikut **versi 1** supaya rilis tidak menunggu. Karena itu isinya sengaja **ramping**: hanya membaca data order yang sudah ada.
> **Status:** Belum ada yang dikerjakan. Butir **(bawaan)** = pilihan penulis yang belum ditanyakan satu per satu; ketua boleh mengubahnya sebelum dikerjakan.
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini + `database.md`** (menyentuh fungsi SQL dan aksi server) dan **`security.md`** (aturan akses). Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 8.
> **Tanpa kode dan tanpa isi SQL.** Nama fungsi dan kolom di sini deskriptif; nama persisnya ditetapkan saat SQL ditulis dan dicatat di berkas migration.
> **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Prefix sheet:** RKS (bawaan).

---

## 1. Tujuan

Owner bisa melihat **seberapa ramai warung dalam 7 hari terakhir** dengan sekali buka: berapa order, berapa nilai uangnya, hari apa paling ramai, hari apa paling sepi. Tampilannya grafik batang sederhana (angka di atas batang, label hari di bawah), cukup dibaca sekilas di HP.

Fitur ini **hanya membaca**. Tidak mengubah order, tidak menambah tabel, dan bukan laporan keuangan (lihat RK6 dan bagian 6).

---

## 2. Tabel Keputusan

| No   | Keputusan                                                                                                                                                                                                                                                                                                                                                                     | Catatan                                                                                                                                                                                                                                                         |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RK1  | **Hanya owner.** Penjaga dan customer tidak melihat item ini, dan bila memanggil aksinya dibalas 403 (`security.md` aturan 8).                                                                                                                                                                                                                                                | Semua owner setara, semua melihat angka yang sama.                                                                                                                                                                                                              |
| RK2  | **Letak:** item **"Ringkasan order 7 hari"** di menu **Lainnya** (owner). Item ini sudah ada sebagai penanda "Segera"; penanda diganti panah dan item bisa diketuk.                                                                                                                                                                                                           | Satu layar, tanpa sub-menu.                                                                                                                                                                                                                                     |
| RK3  | **Isi layar (versi 1):** (a) kartu angka: **total order**, **total nilai uang**, **rata-rata order per hari**; (b) grafik batang **jumlah order per hari**; (c) grafik batang **nilai uang per hari**; (d) kartu **hari terlaris** dan **hari tersepi**.                                                                                                                      | Per tipe order dan menu terlaris **ditunda** (bagian 6).                                                                                                                                                                                                        |
| RK4  | **Rentang:** **hari ini plus 6 hari sebelumnya** = 7 batang, urut dari yang terlama ke hari ini. Hari dihitung **server** (jam database, WIB). Hari tanpa order **tetap tampil dengan nilai 0**.                                                                                                                                                                              | Warung buka 7 hari seminggu (`AGENTS.md` bagian 1), jadi tidak ada hari yang dilewati.                                                                                                                                                                          |
| RK5  | **Order dimasukkan ke hari antarnya (hari target)**, bukan tanggal dibuat. Order untuk Besok **tidak** ikut ke hari ini dan tidak masuk rentang.                                                                                                                                                                                                                              | Cocok dengan cara warung berpikir ("Senin laku berapa").                                                                                                                                                                                                        |
| RK6  | **Order yang dihitung: semua status kecuali Ditolak dan Dibatalkan.** Jadi Menunggu, Disetujui, Diproses, Diantar, Siap diambil, Siap disajikan, dan Selesai ikut. Keputusan ketua, 13 Nov 2026.                                                                                                                                                                              | **Akibat yang disadari:** order Menunggu yang kemudian ditolak membuat angka turun sendiri. Order menggantung (hari antar sudah lewat, masih Menunggu atau Disetujui) **tetap ikut** karena tidak ditutup otomatis (B29). Layar memuat keterangan kecil (RK12). |
| RK7  | **Nilai uang = jumlah `total` order yang dihitung** (RK6), rupiah bulat, tampil seperti "Rp 1.250.000". Ini **bukan bukti pembayaran**: pembayaran diselesaikan di luar aplikasi dan metode bayar tidak dipakai di sini.                                                                                                                                                      | Order wakil owner dan pelanggan tanpa akun **ikut dihitung** (semua order).                                                                                                                                                                                     |
| RK8  | **Rata-rata order per hari = total order dibagi 7**, satu angka di belakang koma ("12,3"). Hari kosong dan hari ini ikut dibagi.                                                                                                                                                                                                                                              | Hari ini belum selesai, jadi rata-rata cenderung sedikit rendah. Cukup.                                                                                                                                                                                         |
| RK9  | **Hari terlaris dan tersepi dinilai dari jumlah order.** Bila seri, **nilai uang** yang menentukan (terlaris: yang lebih besar, tersepi: yang lebih kecil). Bila masih seri, hari yang **lebih baru** yang ditampilkan. **Hari ini tidak dinilai** (harinya belum selesai, pasti tampak sepi); yang dinilai **6 hari yang sudah lewat**.                                      | Hari ini tetap tampil di grafik. Hari tanpa order bisa menjadi tersepi. Bila keenam hari itu sama persis (termasuk semuanya 0), kedua kartu menampilkan "Belum ada perbedaan". Isi kartu: nama hari, tanggal, jumlah order.                                     |
| RK10 | **Semua angka dihitung server** dalam satu aksi baru `ringkasan_7hari` (owner saja) yang membalas angka jadi. Aplikasi hanya menggambar; tidak menjumlah, tidak menentukan hari, dan tidak menentukan terlaris atau tersepi.                                                                                                                                                  | `AGENTS.md` bagian 7. Fungsi SQL **baca-saja**, `SECURITY DEFINER`, `search_path` kosong, `EXECUTE` hanya `service_role`.                                                                                                                                       |
| RK11 | **Kapan data diambil:** saat layar dibuka dan lewat tombol **Segarkan**. **Tanpa polling dan tanpa timer** (`AGENTS.md` bagian 4). Satu panggilan per pembukaan. Tanpa internet: pesan offline seperti layar lain.                                                                                                                                                            | Hemat kuota panggilan `kedai`.                                                                                                                                                                                                                                  |
| RK12 | **Tampilan:** mengikuti tema marun dan emas (`desain.md`). Grafik digambar dengan **CSS atau SVG sendiri, tanpa pustaka dan tanpa CDN**. Angka di atas tiap batang, label hari di bawah (misalnya "Sen 9"), tinggi batang sebanding dengan nilai terbesar. Keterangan kecil di bawah grafik: **"Tidak termasuk order Ditolak dan Dibatalkan. Order Menunggu ikut dihitung."** | Gaya di `style.css`. Semua teks dari server lewat `textContent`. Makna tidak bergantung pada warna saja (angka selalu tertulis).                                                                                                                                |
| RK13 | **Keadaan khusus:** belum ada order sama sekali dalam 7 hari: teks "Belum ada order dalam 7 hari terakhir" (tanpa grafik kosong). Gagal memuat: pesan umum dan tombol Segarkan; galat mentah tidak tampil.                                                                                                                                                                    | `security.md` aturan 9.                                                                                                                                                                                                                                         |
| RK14 | **Angka 7 hari tetap di fungsi (bawaan), bukan di `pengaturan`.** Alasan: judul fitur memang "7 hari" dan mengubahnya berarti mengubah judul dan tampilan juga. Ini pengecualian dari aturan "angka yang bisa berubah ada di database" (`AGENTS.md` bagian 1), sama seperti angka timer game.                                                                                 | Ketua boleh meminta jadi pengaturan; biayanya satu kunci baru dan perubahan tampilan.                                                                                                                                                                           |
| RK15 | **Data pribadi: tidak ada.** Balasan hanya angka dan tanggal; tanpa nama, nomor WA, alamat, atau isi catatan (`security.md` aturan 18).                                                                                                                                                                                                                                       | Aman ditampilkan di layar owner dan aman dipakai screenshot uji.                                                                                                                                                                                                |

---

## 3. Alur

1. Owner membuka menu **Lainnya** lalu mengetuk **Ringkasan order 7 hari**.
2. Aplikasi memanggil `ringkasan_7hari`. Server memeriksa token login dan peran owner (selain itu: 401 atau 403).
3. Server menghitung per hari (7 hari, hari ini ke belakang) dari order yang berstatus bukan Ditolak dan bukan Dibatalkan: jumlah order dan jumlah `total`. Server juga menyiapkan total, rata-rata, serta hari terlaris dan tersepi (RK9).
4. Aplikasi menggambar kartu angka, dua grafik, dan dua kartu hari. Tombol **Segarkan** mengulang langkah 2.

---

## 4. Aturan yang paling sering terlanggar

| Aturan                                                                          | Akibat bila dilanggar                                                             |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Aplikasi menjumlah, menentukan hari, atau menentukan terlaris dan tersepi di HP | Angka beda antar HP; melanggar "logika di server" (RK10).                         |
| Memakai jam HP untuk menentukan "hari ini"                                      | Rentang salah bila jam HP keliru (`security.md` aturan 6).                        |
| Ikut menghitung order Ditolak atau Dibatalkan                                   | Nilai uang membengkak dan menyesatkan owner (RK6).                                |
| Memakai tanggal dibuat, bukan hari target                                       | Order Besok tercampur ke hari ini (RK5).                                          |
| Hari ini ikut dinilai untuk terlaris atau tersepi                               | Hari ini hampir selalu tampil "tersepi" (RK9).                                    |
| Menyembunyikan hari tanpa order                                                 | Grafik bukan 7 batang dan hari sepi tidak terlihat (RK4).                         |
| Penjaga atau customer bisa memanggil aksi (hanya tombol yang disembunyikan)     | Omzet warung bisa dilihat yang tidak berhak (RK1, SEC-36).                        |
| Balasan memuat nama, WA, atau alamat                                            | Data pribadi bocor tanpa perlu (RK15).                                            |
| Menambah timer atau memanggil server berulang                                   | Kuota panggilan `kedai` boros (RK11).                                             |
| Mengubah tabel `order` atau fungsi order lama demi fitur ini                    | Merusak inti sistem; fitur ini hanya membaca (bagian 1).                          |
| Berkas JS baru tidak didaftarkan di cache `sw.js`                               | Layar tidak terbuka offline (`AGENTS.md` bagian 7; perubahan `sw.js` butuh "OK"). |

---

## 5. Urutan Pekerjaan (untuk TODO sheet)

| ID     | Pekerjaan                                                                                                                                                                                                                                               | Tipe      | Prioritas |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------- |
| RKS.01 | Fungsi SQL baca-saja untuk ringkasan 7 hari (RK4 sampai RK9), salinan di `supabase/migrations/`, query cek hak. **Butuh OK ketua** (fungsi baru, tidak menyentuh tabel).                                                                                | High-Risk | P0        |
| RKS.02 | Aksi `ringkasan_7hari` (owner saja) di berkas baru `supabase/functions/kedai/ringkasan.ts`, sambung ke `index.ts`, lalu deploy `kedai` (urutan aman `AGENTS.md` bagian 8). **Butuh OK ketua.**                                                          | High-Risk | P0        |
| RKS.03 | Layar Ringkasan: kartu angka, dua grafik, kartu terlaris dan tersepi, keadaan kosong dan offline (RK12, RK13); ubah item "Segera" di Lainnya; gaya di `style.css`; daftarkan berkas baru di cache `sw.js` (**butuh OK ketua**).                         | Low-Risk  | P1        |
| RKS.04 | Sesi tes dengan akun dan data dummy: hitungan cocok dengan hitung manual; Ditolak dan Dibatalkan tidak ikut; order Besok tidak ikut; hari kosong tampil 0; hari ini tidak dinilai; seri; keadaan kosong. Dokumen `ringkasan-test.md` dibuat belakangan. | High-Risk | P0        |
| SEC-36 | Customer atau penjaga memanggil `ringkasan_7hari`: 403; tanpa token: 401. Bukti: balasan server.                                                                                                                                                        | High-Risk | P0        |
| SEC-37 | Isi balasan `ringkasan_7hari` hanya angka dan tanggal, tanpa data pribadi. Bukti: balasan server dengan data dummy.                                                                                                                                     | High-Risk | P0        |

Urutan: RKS.01, RKS.02, SEC-36 dan SEC-37, RKS.03, RKS.04.

---

## 6. Ditunda

- **Pembagian per tipe order** (Diantar, Diambil, Makan di warung): susulan, tidak mengubah yang sudah jadi; urutan ditentukan ketua.
- **Menu terlaris 7 hari:** susulan, butuh hitungan dari `order_item`; urutan ditentukan ketua.
- **Pembagian per status**, **rentang lain atau pilih tanggal**, **perbandingan dengan minggu lalu**, dan **ekspor**: kandidat versi 2.
- **Rekap harian dan pendapatan (B22):** **tetap kandidat** di `bonus.md`. Fitur ini bukan pendapatan final karena memuat order Menunggu dan order menggantung (RK6, RK7).
- **Penutupan otomatis order menggantung (B29):** tetap tidak dikerjakan di versi 1. Bila angka lama terasa menyesatkan di pemakaian nyata, ditinjau di `LNC.05`.

---

## 7. Catatan Data (untuk dibaca sebelum menilai angka)

- Angka ini **perkiraan kesibukan**, bukan pembukuan. Pembayaran terjadi di luar aplikasi dan tidak dilacak di sini.
- Order Menunggu dan order menggantung ikut dihitung (RK6). Sebaliknya, order menggantung tidak tampil di daftar owner dan penjaga (`order.md` O22), jadi angka ringkasan bisa sedikit lebih besar dari yang tampak di daftar. Ini wajar dan disadari.

---

## 8. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik`. Yang paling akhir menang.

---

### 2026-11-13: Jeda tombol Segarkan

Keputusan ketua (sesi strategi 13 Nov 2026). Menambah RK11.

- Setelah Segarkan ditekan, tombol **mati sekitar 5 detik** (tulisan "Tunggu sebentar") dan layar tetap menampilkan hasil terakhir dari memori, tanpa memanggil server.
- Hasil **tidak disimpan** di `localStorage` atau tempat lain di HP; hanya di memori selama layar terbuka.
- Ini pengaman kenyamanan, bukan keamanan. Pembatasan khusus tetap ditunda (`security.md` bagian 6, B21).
- Angka 5 detik di kode layar (bawaan), bukan di `pengaturan`, karena layar ini tidak punya tabel pengaturannya sendiri; ketua boleh meminta lain.
- Masuk pekerjaan RKS.03; tes: ketuk berulang tidak menambah panggilan di Network browser.

### Handoff #1 | 2026-11-13 | ketua

**Tugas:** RKS.01, fungsi SQL baca-saja `ringkasan_7hari`.

**File yang diubah (baru semua, tabel dan data lama tidak disentuh):**

- `supabase/migrations/20261113_02_ringkasan_7hari.sql`
- `supabase/migrations/20261113_02_ringkasan_7hari_batal.sql`
- `supabase/templates/20261113_02_ringkasan_7hari_cek.sql`

**Status:** migration dijalankan di SQL Editor 13 Nov 2026. Cek A sampai G lulus (fungsi dan pola keamanan benar, EXECUTE hanya `service_role`, hak tabel `order` tidak berubah, owner dapat hasil 7 hari yang cocok dengan hitungan langsung, penjaga ditolak `bukan_owner`). Bukti tidak disimpan.

**Keputusan baru:** tidak ada.

**Kontrak untuk RKS.02:**

- Fungsi: `public.ringkasan_7hari(p_akun uuid)` mengembalikan jsonb: `hari_ini`, `total_order`, `total_nilai`, `rata_rata_order`, `per_hari` (7 elemen: `tanggal`, `hari` 1 sampai 7 dengan 1 = Senin, `jumlah`, `nilai`), `belum_ada_perbedaan`, `terlaris`, `tersepi` (`tanggal`, `hari`, `jumlah`, atau null).
- Kode galat: `id_kosong`, `akun_nonaktif`, `bukan_owner`. Pemetaan `bukan_owner` ke 403 dikerjakan di RKS.02 (SEC-36).
- Pilihan penulis di header migration (kode `hari` dari server, tafsir "sama persis" RK9, kode galat `bukan_owner`): alasan belum tercatat dari ketua.

**Belum beres:**

- `git push` commit `3939295` belum terkonfirmasi, dan tab Actions GitHub belum dicek.
- `_batal.sql` belum pernah dicoba.
- CEK F baru dites dengan akun penjaga; akun customer belum (opsional, dites di SEC-36).

**Saran giliran berikutnya:** RKS.02. Lampirkan `AGENTS.md`, `ringkasan.md`, `database.md`, `security.md`, `index.ts`, dan `order_status.ts` (contoh pola `buatAksi...(alat)`). Aksi baru ditaruh di `supabase/functions/kedai/ringkasan.ts`. Deploy `kedai` butuh OK ketua dan urutan aman AGENTS.md bagian 8.
