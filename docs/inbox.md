/docs/inbox.md

# 📥 inbox.md: Kotak Masuk (Jalur Kabar Cadangan Tanpa Push)

> **Versi 1.0 (11 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Bergantung pada `notifikasi.md` (bagian 4.1: siapa dapat kabar kapan), `gim.md` dan `desain.md` (hamburger dan bilah atas), `order.md` (kejadian order), dan `AGENTS.md`.
> **Status:** IB1 sampai IB14 disepakati ketua (sesi strategi 11 Nov 2026). Butir **(bawaan)** = pilihan penulis, ketua boleh mengubahnya sebelum dikerjakan. Belum ada yang dikerjakan.
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini + `notifikasi.md`** (+ `database.md` dan `security.md` untuk tabel, fungsi, dan aturan akses; + `gim.md` dan `desain.md` untuk hamburger). Kerjakan langkah di bagian 5. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 9.
> **Berkas yang diminta AI di awal sesi:** berkas migration terbaru, `supabase/functions/kedai/index.ts` dan berkas kelompok yang relevan (misalnya `order_status.ts`), `public/index.html` (utuh, satu giliran khusus), `public/gimmenu.js`, `public/game.css`, `public/sw.js`, serta berkas JS yang memanggil `kedai` saat aplikasi dibuka (AI menanyakan namanya, jangan menebak).
> **Tanpa kode dan tanpa isi SQL.** **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Fitur ini High-Risk (P0)** untuk tabel, fungsi SQL, dan aksi `kedai` (data pelanggan dan aksi order yang sudah live). Layar dan tampilan Low-Risk; langkah yang menyentuh `sw.js` butuh "OK" ketua.
> **Prefix sheet:** INB. **Urutan versi 1: Foto Bukti, lalu Inbox, lalu Notifikasi (push).**

---

## 1. Tujuan

Ibu-ibu yang notifikasinya diblokir (atau HP-nya tidak mendukung push) tetap **tahu ada kabar** tentang pesanannya. Kabar disimpan di server dan dibaca lewat menu **Kotak masuk** di hamburger. Titik merah di ikon hamburger memberi tahu ada yang belum dibaca. Kotak masuk adalah **jalur cadangan, bukan pengganti push**, dan **bukan inti sistem**: kalau gagal, order tetap jalan.

---

## 2. Keputusan

| No   | Keputusan                                                                                                                                                                                                                                                                                                                                                 | Dasar                                                                             |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| IB1  | **Kotak masuk disimpan di server**, jadi tetap ada walau notif diblokir, HP diganti, atau push gagal terkirim.                                                                                                                                                                                                                                            | Ide ketua 11 Nov 2026 (workaround ibu-ibu yang notifnya diblokir).                |
| IB2  | **Letak:** item **"Kotak masuk"** di menu hamburger, tepat di bawah "Arithmetics", plus **titik merah di ikon hamburger** bila ada yang belum dibaca. **Tidak ada ikon baru** di bilah atas (sudah penuh) dan **tidak ada kartu di Home**. Hamburger tetap hanya di tab utama, tidak di sub-layar (GM4, GM5).                                             | Keputusan ketua 11 Nov 2026; menimpa GM6 di `gim.md`.                             |
| IB3  | **Semua peran** (customer, owner, penjaga). **Daftar kejadian dan penerima persis sama dengan `notifikasi.md` bagian 4.1** (termasuk tambahan 8 Nov: batal owner dan alih hari). Tidak ada tabel kedua. Aturan di sana ikut: pelaku tidak dikabari atas aksinya sendiri; penjaga tidak dikabari order Menunggu; order wakil tidak ke pemesan.             | Keputusan ketua 11 Nov 2026; `notifikasi.md` 4.1 tetap satu-satunya daftar.       |
| IB4  | **Teks item sama dengan teks push** (satu sumber teks), tanpa nama, alamat, nomor WA, isi catatan, nama menu, atau alasan. Boleh memuat **nomor order**.                                                                                                                                                                                                  | `notifikasi.md` NT2; `security.md` aturan 16 (berlaku juga untuk inbox).          |
| IB5  | **Tiap item: teks, nomor order bila ada, dan waktu kejadian dalam WIB dari jam server** (contoh tampil: "11 Nov, 08.33 WIB"). **Item hanya teks, tidak bisa diketuk, tidak mengarahkan ke order.** Bila membingungkan, ibu-ibu bertanya lewat WA; pengarahan jadi kandidat versi 2 (`bonus.md`).                                                          | Keputusan ketua 11 Nov 2026; waktu: `AGENTS.md` bagian 7.                         |
| IB6  | **Tampil 14 hari terakhir.** Lama tampil ada di `pengaturan` (`inbox_simpan_hari`, nilai awal 14), tidak ditulis mati di kode. Baris **tidak dihapus oleh aplikasi**.                                                                                                                                                                                     | Keputusan ketua 11 Nov 2026 (khawatir batas free tier); `AGENTS.md` bagian 1.     |
| IB7  | **Pembersihan manual oleh ketua** lewat dashboard Supabase (Table Editor atau SQL Editor), saat ingat atau dengan pengingat kalender. **Tidak ada pembersihan otomatis dan tidak ada pengecualian DELETE baru.** AI menyiapkan **SQL template hapus** di `supabase/templates/` (lihat INB.06). Baris lama yang belum dihapus tidak tampil (IB6).          | Keputusan ketua 11 Nov 2026 (memilih opsi tanpa pembersihan otomatis).            |
| IB8  | **Penanda dibaca disimpan di HP, bukan di server:** satu angka "nomor item terakhir yang dilihat" di `localStorage`, **per akun**. **Nol panggilan server untuk menandai dibaca.** Akibatnya status dibaca **per HP**: HP baru atau data browser dibersihkan = semua item tampil belum dibaca sekali. Hanya tampilan, data tidak rusak.                   | Keputusan ketua 11 Nov 2026 (hemat kuota Edge Function); pola seperti GM9.        |
| IB9  | **Urutan tampil:** yang **belum dibaca di atas dan diberi tanda**, sisanya urut terbaru dulu. Penanda lama dipakai untuk menggambar daftar, **baru setelah itu** digeser ke item terbaru, jadi pembukaan berikutnya semuanya sudah dibaca dan titik merah hilang. Di dalam kelompok belum dibaca, terbaru dulu **(bawaan)**.                              | Keputusan ketua 11 Nov 2026 (belum dibaca di atas).                               |
| IB10 | **Titik merah numpang di panggilan buka aplikasi yang sudah ada:** server menambah satu angka di balasan yang sama, yaitu nomor item inbox terbaru milik akun itu (hanya dari item dalam 14 hari; kosong bila tidak ada). Aplikasi membandingkan dengan penanda lokal. **Tidak ada panggilan tambahan.** Dicek di kode saat sesi kode.                    | Keputusan ketua 11 Nov 2026; `AGENTS.md` bagian 4 (tanpa polling).                |
| IB11 | **Isi inbox tidak disimpan di HP.** Daftar diambil dari server tiap Kotak masuk dibuka (satu panggilan per pembukaan). Offline: pesan umum "Perlu internet untuk membuka Kotak masuk". Saat **Keluar**, layar Kotak masuk dan menu ditutup (GM14); hanya angka penanda yang tersisa (tanpa data pribadi).                                                 | Keputusan ketua 11 Nov 2026; HP dipakai bergantian.                               |
| IB12 | **Penulisan lewat satu fungsi SQL baru `inbox_tulis`**, dipanggil `kedai` **setelah aksi order berhasil**, di titik yang sama dengan pengirim push (NTF.06). **Kegagalan menulis inbox tidak membatalkan aksi**; satu pesan inbox bisa hilang tanpa suara. Fungsi order yang sudah live **tidak diubah**. Penerima dihitung server (bukan dari aplikasi). | Keputusan ketua 11 Nov 2026 (inbox bukan core, boleh gagal asal order aman); NT4. |
| IB13 | **Tanda "Catatan baru" di kartu order dibatalkan** (diganti Kotak masuk: item "Ada catatan baru di order #N."). `order_daftar` tidak perlu diubah. Pertanyaan "penjaga pakai tanda atau tidak" ikut selesai.                                                                                                                                              | Keputusan ketua 11 Nov 2026; menimpa blok 9 Nov di `notifikasi.md` dan NTF.07.    |
| IB14 | **Urutan kerja: setelah Foto Bukti (FTO.06 dan SEC-20, SEC-21, SEC-29), sebelum Notifikasi.** Push (NTF.06) kelak menumpang titik pemanggilan dan daftar penerima yang sama, jadi penerima tidak dihitung dua kali.                                                                                                                                       | Keputusan ketua 11 Nov 2026 (rekomendasi AI diterima; Foto Bukti tetap duluan).   |
| IB15 | **Batas jumlah item per tampilan** disimpan di `pengaturan` (nilai awal ditetapkan di sesi kode). Owner menerima tiap order baru, jadi 14 hari bisa ratusan baris. Item belum dibaca didahulukan. **(bawaan)**                                                                                                                                            | Penulis; angka bisa berubah (`AGENTS.md` bagian 1).                               |

**Belum diputuskan (ditanyakan ke ketua di sesi kode, jangan ditebak):** nama tabel dan kolom final; nilai awal batas jumlah item (IB15); nama kunci `localStorage`; tempat gaya layar Kotak masuk (di `game.css` bersama hamburger, atau cara lain; aturan "semua gaya di `style.css`" punya pengecualian game saja); berkas JS mana yang memegang panggilan buka aplikasi.

---

## 3. Prasyarat

Foto Bukti selesai dan lulus tes (FTO.06, SEC-20, SEC-21, SEC-29). Hamburger dan menunya ada (`gim.md`, GIM.01 sampai GIM.04). Aksi order sudah live (ORD.01 sampai ORD.18), jadi semua kejadian di `notifikasi.md` 4.1 sudah punya titik pemanggilan.

---

## 4. Yang dibuat

### 4.1 Alur ringkas

1. **Kejadian:** aksi order berhasil di `kedai` → server menghitung penerima menurut `notifikasi.md` 4.1 → `inbox_tulis` menulis satu baris per penerima. (Nanti push NTF.06 dipasang di titik yang sama.)
2. **Aplikasi dibuka:** balasan panggilan yang sudah ada memuat nomor inbox terbaru → dibandingkan dengan penanda lokal → titik merah muncul bila lebih besar.
3. **Kotak masuk dibuka:** satu panggilan `inbox_daftar` → daftar digambar memakai penanda lama (belum dibaca di atas) → penanda digeser ke nomor terbaru → titik merah hilang.

### 4.2 Komponen

| Komponen                           | Isi                                                                                                                                                                                                                                                          |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tabel inbox + pengaturan           | Satu baris per kejadian per penerima: penerima, nomor berjalan, teks, nomor order (boleh kosong), waktu server. Pengaturan `inbox_simpan_hari` dan batas jumlah tampil. RLS aktif tanpa policy; hak minimal, **tanpa DELETE**. Skema final di `database.md`. |
| Fungsi SQL `inbox_tulis`           | Atomik, `SECURITY DEFINER`, `search_path` kosong, `EXECUTE` hanya `service_role`. Menerima kejadian dan order, menghitung penerima sendiri dari order dan tabel `staf`.                                                                                      |
| Fungsi SQL dan aksi `inbox_daftar` | Mengembalikan hanya inbox milik pemanggil (akun dari token login), 14 hari terakhir dari jam server. Aksi ada di **berkas baru `inbox.ts`** di folder `kedai` (blok `AGENTS.md` 9 Nov 2026).                                                                 |
| Angka inbox terbaru                | Ditambahkan ke balasan panggilan buka aplikasi yang sudah ada (menyentuh aksi live, ⚠️).                                                                                                                                                                     |
| Layar Kotak masuk                  | Item di hamburger, daftar teks + waktu WIB, tanda belum dibaca, pesan kosong, pesan offline, tombol Segarkan tidak diperlukan (dibuka = diambil). Teks lewat `textContent`.                                                                                  |
| Titik merah                        | Di ikon hamburger; `aria-label` hamburger ikut menyebut ada pesan baru.                                                                                                                                                                                      |
| Berkas JS (dan CSS) baru           | Didaftarkan di cache `sw.js` (butuh "OK" ketua).                                                                                                                                                                                                             |
| SQL template hapus                 | `supabase/templates/`, dua tahap (lihat INB.06), tanpa data nyata.                                                                                                                                                                                           |

---

## 5. Urutan pekerjaan (untuk TODO sheet, prefix INB)

Langkah ⚠️ butuh penjelasan dampak dan "OK" ketua.

1. **INB.01 ⚠️** Migration: tabel inbox, baris `pengaturan` inbox, hak minimal tanpa DELETE, RLS. Salin SQL ke repo dulu; cek hak `service_role` setelahnya.
2. **INB.02 ⚠️** Fungsi SQL `inbox_tulis` dan `inbox_daftar`.
3. **INB.03 ⚠️** Aksi `inbox_daftar` di `inbox.ts`, plus angka inbox terbaru di panggilan buka aplikasi yang sudah ada. Cek dulu di kode bahwa panggilan itu ada dan layak ditumpangi; bila tidak, tanya ketua.
4. **INB.04 ⚠️** Pasang `inbox_tulis` di `kedai` per kejadian tabel 4.1, dibagi beberapa giliran per kelompok kejadian (1 sampai 3 berkas per giliran). Kegagalan tidak membatalkan aksi (IB12).
5. **INB.05 ⚠️** Layar Kotak masuk: item hamburger, titik merah, penanda lokal per akun, urutan tampil, waktu WIB, offline, tutup saat Keluar. Daftarkan berkas baru di `sw.js` dan naikkan versi cache.
6. **INB.06 ⚠️** SQL template hapus inbox lama di `supabase/templates/`: tahap 1 `SELECT` yang menampilkan jumlah dan contoh baris yang akan terhapus; tahap 2 `DELETE` dengan kondisi persis sama. Batas hari dibaca dari `pengaturan`, hitungan dari jam server. Hanya menyentuh tabel inbox. Ketua menjalankan manual dan membaca hasil tahap 1 dulu.
7. **INB.07** Sesi tes inbox (dokumen `inbox-test.md` dibuat di sesi tes): tiap peran hanya melihat miliknya; penerima sesuai tabel 4.1; pelaku tidak dikabari; penjaga tidak dapat order Menunggu; order wakil tidak ke pemesan; titik merah muncul dan hilang; penanda per akun (HP bergantian); offline; Keluar menutup; aksi order tetap berhasil bila penulisan inbox gagal.
8. **SEC-34 dan SEC-35** (lihat `security.md`, blok 11 Nov 2026).

---

## 6. Aturan yang paling sering terlanggar

| Aturan                                                                                        | Akibat bila dilanggar                                                 |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Isi inbox memuat nama, alamat, nomor WA, isi catatan, nama menu, atau alasan                  | Data pribadi terbaca bila HP dipinjam (SEC-35).                       |
| `inbox_daftar` menerima id akun atau peran dari aplikasi                                      | Inbox orang lain bocor (SEC-34). Akun selalu dari token login.        |
| Menyimpan isi inbox di HP                                                                     | Teks tertinggal di HP bersama (IB11).                                 |
| Menandai dibaca ke server, polling, atau panggilan khusus untuk titik merah                   | Kuota Edge Function terpakai tanpa perlu (IB8, IB10).                 |
| Kegagalan `inbox_tulis` membatalkan aksi order                                                | Order macet gara-gara memo gagal (IB12, NT4).                         |
| Memakai pola `inbox_tulis` (tulis dari Edge Function) untuk aksi selain inbox                 | Melanggar `AGENTS.md` bagian 7; pengecualian hanya untuk inbox.       |
| Memberi hak DELETE (atau UPDATE) ke `service_role` pada tabel inbox                           | Melanggar "tanpa DELETE"; penghapusan hanya manual oleh ketua (IB7).  |
| Membuat daftar penerima kedua di berkas ini atau di kode terpisah dari tabel 4.1              | Dua daftar bisa bertentangan; `notifikasi.md` 4.1 satu-satunya (IB3). |
| Mengabari pelaku atas aksinya sendiri, penjaga untuk order Menunggu, atau pemesan order wakil | Sinyal bocor (O11, O15).                                              |
| Teks inbox lewat `innerHTML`                                                                  | Melanggar aturan keamanan (SEC-18).                                   |
| Hamburger atau Kotak masuk muncul di sub-layar, atau tetap terbuka setelah Keluar             | Melanggar GM5 dan GM14.                                               |
| Mengubah `order_daftar` untuk tanda "Catatan baru"                                            | Tidak perlu (IB13); menambah risiko pada fitur live.                  |
| Mengubah `kerangka.js` tanpa "OK"                                                             | GM14 melarangnya; bila titik merah memaksa, laporkan ke ketua.        |
| Berkas JS atau CSS baru tidak didaftarkan di cache `sw.js`                                    | Aplikasi offline tampil tanpa gaya atau layar tidak terbuka.          |

---

## 7. Dampak dan pembatalan

- **Migration:** tabel baru, tidak menyentuh data lain; bisa dibatalkan dengan SQL pembatalan tertulis di repo.
- **Pemasangan `inbox_tulis`:** fungsi order lama tidak diubah; yang diubah hanya titik pemanggilan di `kedai`. Pembatalan = cabut pemanggilan itu dan deploy ulang `kedai`.
- **Salah kirim ke orang yang keliru:** perbaiki aturan penerima dan deploy ulang; baris yang sudah tertulis tidak bisa ditarik oleh aplikasi, ketua bisa menghapusnya manual. Isinya teks umum, tanpa data pribadi.
- **Tabel membesar:** hapus manual (IB7). Perkiraan kasar (asumsi): sekitar 200 baris per hari, sekitar 150 byte per baris, jadi belasan MB per tahun, jauh di bawah 500 MB database.
- **Kuota:** satu panggilan per pembukaan Kotak masuk. Perkiraan kasar: 100 customer × 5 pembukaan × 30 hari = 15.000 panggilan per bulan, sekitar 3% dari batas 500.000. Penulisan `inbox_tulis` terjadi di dalam panggilan `kedai` yang sama, tidak menambah panggilan.
- **Pembatalan layar:** sembunyikan item di hamburger dan titik merah; tidak ada data yang hilang.

---

## 8. Ditunda

- Item bisa diketuk dan membuka order (penjaga: Antrean untuk order batal). Kandidat versi 2.
- Pembersihan otomatis inbox (fungsi SQL oleh `pg_cron`, tanpa Edge Function), bila hapus manual merepotkan.
- Kartu Kotak masuk di Home.
- Status dibaca per akun di server (lintas HP).
- Titik merah ikut diperbarui saat kembali ke layar (butuh panggilan tambahan).
- Penyaringan atau pengelompokan item; pengaturan jenis kabar.

**Tidak dikerjakan:** tanda "Catatan baru" di kartu order (IB13); pengecualian DELETE baru (IB7).

---

## 9. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

### 2026-11-11: INB.01 dikerjakan sebelum SEC-29 lulus, dan batas tampil 30

Keputusan ketua (sesi kode INB.01, 11 Nov 2026).

- **Urutan:** INB.01 (migration tabel inbox) boleh dikerjakan dan dijalankan sebelum FTO.06, FTO.07, dan SEC-29 lulus. Ini bertentangan dengan IB14 dan bagian 3 (Inbox setelah Foto Bukti lulus tes); yang paling akhir menang. Alasan ketua: sesi tes lanjutan foto baru Minggu 15 Nov 2026, jadi lebih baik mengerjakan yang bisa dikerjakan. INB.01 hanya menambah tabel baru dan tidak menyentuh tabel foto.
- **Yang belum diputuskan:** apakah INB.02 dan seterusnya juga boleh mendahului SEC-29. Sampai ada keputusan, ikuti IB14.
- **IB15 ditetapkan:** batas jumlah item per tampilan, nilai awal **30** (`inbox_maks_tampil` di `pengaturan`), belum dibaca didahulukan. Usulan awal penulis 50; ketua memilih 30, alasan belum tercatat.
- **Nama tabel dan kolom** final dicatat di `database.md` setelah migration dijalankan.

### Handoff #1 | 2026-11-11 | ketua

**Tugas:** INB.01 (migration tabel inbox) dan INB.02 (fungsi SQL inbox). Keduanya selesai dan lulus cek; sudah dicentang di sheet.

**File yang diubah (semua baru, tidak ada yang lama disentuh):**

- `supabase/migrations/20261111_05_inbox.sql` (+ `_batal.sql`), `supabase/templates/20261111_05_inbox_cek.sql`
- `supabase/migrations/20261111_06_inbox_fungsi.sql` (+ `_batal.sql`), `supabase/templates/20261111_06_inbox_fungsi_cek.sql`
  Dijalankan dan dicek 11 Nov 2026 di SQL Editor.

**Keputusan baru:**

- INB.02 juga dikerjakan sebelum SEC-29 lulus (melanjutkan blok urutan 11 Nov, yang awalnya hanya mencakup INB.01). Bertentangan dengan IB14 dan bagian 3; yang paling akhir menang. INB.03 dan seterusnya belum diputuskan: sampai ada keputusan, ikuti IB14.
- Batas tampil 30 (`inbox_maks_tampil`); lama tampil 14 (`inbox_simpan_hari`). Keduanya di `pengaturan`.
- Fungsi tambahan di luar teks sheet: `inbox_terbaru(p_akun)`, supaya titik merah (INB.03) tidak mengubah fungsi `status` yang sudah live. `inbox_daftar` juga mengembalikan `terbaru`.
- `inbox_tulis` melempar galat bila status order tidak cocok dengan kejadian (menulis nol baris), supaya salah pasang kelihatan di log saat INB.04. Kode kejadian: order_baru, catatan_customer, catatan_owner, batal_customer, batal_owner, setujui, tolak, status, foto_setelah_selesai, order_wakil, alih_hari.
- Teks catatan baru dari owner ke penjaga: "Ada catatan baru di order #N." (notifikasi.md hanya menulis "idem"). Alasan ketua belum tercatat.

**Yang belum beres / belum terbukti:**

- Kedua `_batal.sql` belum pernah dicoba.
- Isi `inbox_tulis` dengan data nyata dan urutan `inbox_daftar` belum teruji; baru bisa lewat `kedai` (INB.04, INB.07).
- Batas yang diterima fungsi (hari 1 sampai 365, jumlah 1 sampai 200) adalah pilihan penulis, alasan belum tercatat.

**Saran giliran berikutnya (INB.03, ⚠️ menyentuh aksi live, butuh penjelasan dampak dan "OK" ketua):**

- Lampirkan `AGENTS.md`, `inbox.md`, `notifikasi.md`, `database.md`, `security.md`.
- AI meminta: `kedai/index.ts` (utuh), `order_status.ts`, `foto.ts`, dan berkas JS yang memanggil `kedai` saat aplikasi dibuka (tanyakan namanya).
- Cek dulu di kode apakah panggilan buka aplikasi (aksi `status`) layak ditumpangi `inbox_terbaru`; bila tidak, tanya ketua.
- Untuk INB.04: `kedai` jangan memanggil `inbox_tulis` pada mundur satu langkah (tanpa kabar, sesuai notifikasi.md 4.1), dan kegagalannya tidak boleh membatalkan aksi (IB12).

### 2026-11-11: Syarat "Inbox setelah SEC-29 lulus" dicabut; kejadian foto menunggu

Keputusan ketua (sesi kode INB.03, 11 Nov 2026). Yang paling akhir menang.

- **Pencabutan:** INB.03 sampai INB.07 boleh dikerjakan tanpa menunggu FTO.06, FTO.07, dan SEC-29 lulus. Ini menimpa IB14 dan bagian 3 (Inbox setelah Foto Bukti lulus tes), dan menjawab Handoff #1 yang menyebut INB.03 dan seterusnya belum diputuskan.
- **Pengecualian:** pemasangan `inbox_tulis` untuk kejadian "foto diunggah setelah Selesai" (INB.04, berkas `foto.ts`) menunggu SEC-29 lulus. Alasan: `foto.ts` sedang diuji, jadi bila tes menemukan masalah, penyebabnya tidak tercampur dengan perubahan inbox. Kejadian lain di INB.04 tidak menunggu.
- **Alasan pencabutan:** syarat urutan itu dibuat agar pekerjaan runut, tanpa alasan teknis. SEC-29 baru bisa dites setelah pembersihan mingguan berjalan (Minggu 02.00 WIB), sehingga syarat itu menahan pekerjaan yang tidak terkait.

### Handoff #2 | 2026-11-11 | ketua

**Tugas:** INB.03 (angka inbox terbaru di balasan `status` dan aksi `inbox_daftar`). Selesai: dideploy, dites, di-push (commit 388d5b4), dan sudah dicentang di sheet.

**File yang diubah:**

- `supabase/functions/kedai/index.ts`: fungsi pembantu `bacaInboxTerbaru`, field `inbox_terbaru` di dua balasan `aksiStatus` (customer dan staf), satu import, satu blok sambungan, satu `case`. Tidak ada baris lama yang dihapus.
- `supabase/functions/kedai/inbox.ts` (baru): aksi `inbox_daftar`.
- `docs/inbox.md`: blok pencabutan syarat SEC-29 (11 Nov).
- `public/akun.js` TIDAK diubah (dibaca saja untuk memastikan titik sambung).

**Keputusan baru:**

- INB.03 sampai INB.07 boleh jalan tanpa menunggu SEC-29 (blok 11 Nov di atas). Pengecualian tetap: kejadian "foto diunggah setelah Selesai" di `foto.ts` menunggu SEC-29 lulus.
- Field di balasan `status` bernama `inbox_terbaru` (angka, atau null bila tidak ada atau pengambilannya gagal). Kegagalan tidak menggagalkan `status` (IB12). Nama field adalah pilihan penulis, alasan belum tercatat.
- Titik sambung INB.05: `isiSementara()` di `public/akun.js`, di samping panggilan `KedaiKerangka.atur`. Balasan `status` yang sama juga dipanggil `akunmenu.js`, `alamat.js`, dan `pesan.js` lewat `panggilKedai`; tiap panggilan itu kini menjalankan satu kueri `inbox_terbaru` tambahan di dalam panggilan Edge Function yang sama (bukan panggilan baru).
- `inbox_daftar` hanya menerima `penanda` berupa bilangan bulat nol atau lebih (kosong dianggap 0); tipe lain dibalas 400. Akun selalu dari token.
- Usulan (belum diputuskan ketua): tidak ada deploy `kedai` dari Sabtu 14 Nov sampai tes foto Minggu 15 Nov selesai, supaya hasil tes foto tidak tercampur.

**Terbukti (bukti ditempel di chat, tidak disimpan):** `status` 200 dengan `inbox_terbaru: null` untuk akun dummy; `inbox_daftar` dibalas `butir: []`, `terbaru: null`, `maks: 30`; isian `akun` dan `peran` palsu diabaikan; penanda negatif dibalas 400; tanpa token dan token palsu dibalas 401.

**Belum beres / belum terbukti:**

- SEC-34 baru terbukti separuh. Bagian "hanya inbox milik sendiri yang tampil" butuh inbox berisi, jadi tuntas di INB.07.
- Isi `inbox_tulis` dan urutan `inbox_daftar` dengan data nyata belum teruji (menunggu INB.04).
- Kedua `_batal.sql` (migration 05 dan 06) belum pernah dicoba.
- INB.04 dan seterusnya belum dikerjakan; sheet INB.04 sampai INB.07 masih Belum.

**Saran giliran berikutnya (INB.04, ⚠️ menyentuh aksi order yang live, butuh penjelasan dampak dan "OK" ketua):**

- Lampirkan `AGENTS.md`, `inbox.md`, `notifikasi.md`, `database.md`, `security.md`. AI meminta berkas kelompok sesuai giliran: `index.ts` (utuh), `order_status.ts`, `catatan.ts`, `order_wakil.ts`, `inbox.ts`. Berkas `catatan.ts` dan `order_wakil.ts` belum pernah ditempel di sesi ini.
- Pasang `inbox_tulis` setelah aksi berhasil, dibagi per kelompok kejadian (1 sampai 3 berkas per giliran): `order_baru`; `catatan_customer` dan `catatan_owner`; `batal_customer` dan `batal_owner` (dibedakan dari peran yang dibaca server); `setujui` dan `tolak`; `status` (hanya maju, mundur satu langkah TIDAK memanggil); `order_wakil`; `alih_hari`; `foto_setelah_selesai` terakhir dan menunggu SEC-29.
- Pelaku selalu id dari token. Pemanggilan dibungkus penangkap galat, kegagalan hanya dicatat jenisnya di log dan tidak membatalkan aksi (IB12). `status_tidak_cocok` dari `inbox_tulis` berarti salah pasang dan harus terlihat di log.
- Setelah INB.04: INB.05 (layar Kotak masuk, menyentuh `sw.js`, butuh "OK" ketua), INB.06 (SQL template
