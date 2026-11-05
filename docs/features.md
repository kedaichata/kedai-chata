/docs/features.md

# Features & UI Modules — Kedai ChATA

Peta besar semua fitur dan layar **Kedai ChATA** (PWA). Dibaca sekali di awal sesi untuk orientasi. Detail kerja tiap fitur ada di dokumen fitur masing-masing (satu fitur = satu md + satu md tes, dokumen tes dibuat belakangan di sesi tes).

Status: **(ada)** = sudah diimplementasi, **(rencana)** = sudah diputuskan tapi belum dikerjakan, **(ditunda)** = sengaja belum dikerjakan.

> **Versi 1.2 (5 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Perubahan 1.2: bagian 6a (Bantuan), layar per peran memuat Bantuan, LNC.01 dan LNC.03 menyebut isi Bantuan. Perubahan 1.1: bagian 7a (desain) ditambah; jam bebas; mundur satu langkah; aturan tampilan daftar; backup. Semua fitur masih **(rencana)**. Perubahan status dan keputusan baru dari sesi kode dicatat sebagai blok di bagian 11 (append-only), bukan dengan menyunting bagian di atasnya. Struktur data ada di `docs/database.md`, aturan keamanan di `docs/security.md`.

---

## 1. Tujuan & Tiga Pihak

PWA sistem order untuk warung keluarga, sekaligus merapikan catatan order yang selama ini di WhatsApp. Tiga pihak melihat status order yang sama:

| Pihak        | Jumlah      | Peran singkat                                                                           |
| :----------- | :---------- | :-------------------------------------------------------------------------------------- |
| **Customer** | ±100        | Memesan, melihat status, menambah catatan, membatalkan selama Menunggu. Daftar sendiri. |
| **Owner**    | 5 (setara)  | Menyetujui atau menolak, mengelola menu, mencatat order untuk pelanggan tanpa akun.     |
| **Penjaga**  | 2+ (setara) | Memproses dan mengantar order yang sudah disetujui, mengunggah foto bukti bila perlu.   |

Hak lengkap tiap peran ada di `akun.md` bagian 4. Warung buka 7 hari; penjaga di akhir pekan orang yang berbeda, jadi akun penjaga bisa lebih dari 2.

## 2. Akun & Peran (rencana) → `akun.md`

- Daftar dan login email + password lewat Supabase Auth; **tanpa verifikasi email** (email asal-asalan diterima).
- Daftar customer wajib: **nama tampilan, nomor WA, satu alamat** (alias + alamat). Buku alamat **maksimal 5**.
- Owner dan penjaga **dibuatkan ketua** di dashboard, perannya dicatat di tabel `staf`. Tidak ada jalur dari aplikasi untuk menjadi staf.
- Ganti password (minta password lama). Lupa password lewat **link email** yang ditekan ketua dari dashboard (Gmail SMTP tim).

## 3. Menu (rencana) → `menu.md`

- Owner mengelola menu: nama, harga, foto (opsional), tombol **Tersedia/Habis**. Customer dan penjaga hanya melihat.
- Harga **selalu dihitung server**; harga saat order dicatat di order.

## 4. Order (rencana) → `order.md`

- Customer: pilih menu, **tipe (Diantar default, Diambil, Makan di warung)**, alamat, **hari (Hari ini/Besok)**, jam (bebas diisi, tanpa daftar), catatan awal, kirim. Setelah Kirim muncul teks: "Pesanan diterima. Perwakilan ChATA akan menghubungi lewat WhatsApp untuk pembayaran. Pesanan diproses setelah pembayaran dikonfirmasi."
- Status: Menunggu → **Disetujui** (owner terima bayar di luar aplikasi, pilih metode) → Diproses → Diantar / Siap diambil / Siap disajikan → Selesai. Cabang: Ditolak, Dibatalkan (oleh customer saat Menunggu). Salah pencet status boleh dimundurkan satu langkah (bukan dari Selesai). Tanpa tombol batal setelah Disetujui; bila terjadi, diselesaikan kekeluargaan lewat WA.
- **Catatan berlapis** (waktu dan penulis, tidak bisa diedit atau dihapus) selama belum Diproses. Follow up lewat WA; **tidak ada chat di aplikasi**.
- Owner bisa **membuat order untuk pelanggan tanpa akun** lewat wizard 5 langkah, dengan daftar "Pelanggan tanpa akun".

## 5. Foto Bukti Antar (rencana) → `foto-bukti.md`

- Opsional, hanya untuk tipe **Diantar**; penjaga yang menilai perlu atau tidak. Tujuan utama: **bukti bila customer merasa tidak diantar**. Pengunggah boleh mengganti foto bila salah atau buram.
- Dikompres di HP, disimpan di bucket privat, **dibersihkan otomatis setelah 14 hari** (catatan order tetap).

## 6. Notifikasi & Penyegaran (rencana) → `notifikasi.md`

- **Push notification (VAPID)** untuk kejadian penting, termasuk saat aplikasi ditutup. Teks push tidak memuat data pribadi.
- Data diambil saat aplikasi dibuka/kembali ke layar, saat push masuk (bila terbuka), dan lewat tombol **Segarkan**. **Tanpa polling dan tanpa Realtime** (hemat free tier).
- Android (Chrome) didukung penuh. iPhone hanya iOS 16.4 ke atas dan aplikasinya harus dipasang ke layar utama.

## 6a. Bantuan (rencana) → `bantuan.md`

- Layar **tanya-jawab** untuk semua peran: cara memesan, arti status, memasang ke layar utama, notifikasi, lupa password, dan tugas tiap peran. Dibuka dari menu **Akun** (customer, penjaga) dan **Lainnya** (owner); tanpa menu hamburger.
- Isi **ditulis ketua di Google Sheet**, lalu diimpor ke database lewat SQL Editor, jadi mengubah bantuan tidak perlu mengubah kode. Aplikasi tidak bisa mengubah isi. Teks biasa saja; server hanya memberi isi yang sesuai peran pemanggil.
- Dikerjakan **paling akhir**, setelah fitur lain selesai, supaya jawabannya cocok dengan aplikasi yang final.

## 7. Fondasi, Terbit, & PWA (rencana) → `fondasi.md`

- Repo public (akun GitHub ketua), GitHub Pages lewat GitHub Actions, `manifest.json` dan `sw.js` network first. Nama "Kedai ChATA" (pendek "ChATA").
- Pagar **anti-nyasar** untuk laptop bersama: git dan deploy tidak boleh menyentuh akun adik.
- Offline: berkas aplikasi terbuka, tapi login dan semua aksi butuh internet (pesan jelas).
- Semua path relatif terhadap `public/`.

## 7a. Desain (rencana) → `desain.md`

- Tema marun gelap dengan aksen emas; latar isi krem supaya mudah dibaca. Navigasi bawah per peran.
- Tulisan "Kedai ChATA" bergaya logo (wordmark) dari HTML/CSS; logo asli menggantikan bila berkasnya ketemu. Ikon PWA sementara dulu.

## 8. Bonus / Versi 2 dan 3 (ditunda) → `bonus.md`

Daftar kandidat (chat di aplikasi, integrasi LLM, order H+x fleksibel, editor bantuan di aplikasi, gambar dan pencarian di bantuan, rekap dan pendapatan, batas jam dan kuota menu, utang, penggabungan pelanggan, payment gateway, foto bukti transfer, dll). **Belum berurutan**; urutan ditentukan setelah review pemakaian versi 1.

## 9. Aturan Umum Tampilan & Pemeliharaan

- **Sesederhana WA untuk customer:** font dan tombol besar, satu tujuan per layar, bahasa sehari-hari. Ibu-ibu tidak boleh merasa dipersulit.
- Semua teks dari server dan input pengguna lewat `textContent`, bukan `innerHTML`.
- Bahasa UI dan komentar kode: Bahasa Indonesia.
- Teks dan angka yang bisa berubah (batas jumlah dan ukuran, lama simpan, menu) disimpan di database, bukan di kode.
- Fitur yang sudah selesai dites dicatat statusnya lewat blok di bagian 11, bukan dengan menimpa isi bagian di atas.

**Layar per peran (ringkas):**

| Peran    | Layar utama                                                                                                              |
| :------- | :----------------------------------------------------------------------------------------------------------------------- |
| Customer | Pesan (menu), Pesanan Saya (daftar dan detail), Akun (nama, WA, alamat, password, notifikasi, Bantuan).                  |
| Owner    | Order Masuk (Menunggu), Semua Order (filter hari/status), Buat Order (wizard), Menu, Lainnya (Pelanggan, Bantuan, Akun). |
| Penjaga  | Antrean (order Disetujui ke atas; Hari ini lalu Besok), Akun (termasuk Bantuan). Tombol Segarkan di semua layar daftar.  |

**Aturan daftar:** daftar owner dan penjaga hanya menampilkan order dengan hari antar **Hari ini dan Besok**, Hari ini dulu; yang sudah Disetujui (sudah dibayar) di atas, urut waktu disetujui, Selesai di bawah. Order yang hari antarnya sudah lewat tidak tampil. Owner bisa membuka hari lain lewat filter di Semua Order. **Customer tetap melihat riwayat lengkap** di Pesanan Saya. Rinciannya di `order.md` O22.

## 10. Peluncuran (prefix LNC)

Karena hanya ada satu environment (production) dan aplikasi dipakai nyata, peluncuran dibuat bertahap:

1. **LNC.01 ⚠️ Bersihkan data uji** (akun dummy, order uji, foto uji, isi uji Bantuan) sebelum dipakai nyata. Dijelaskan dampaknya dan dibuat bisa dipulihkan.
2. **LNC.02 Cek kuota:** perkirakan panggilan dan ukuran file per hari terhadap batas free tier. Siapkan juga **backup data rutin** (paket gratis tanpa backup otomatis; dipegang adik ketua).
3. **LNC.03 Uji coba terbatas:** owner, penjaga, dan 5 sampai 10 customer pilihan. Order berjalan berdampingan dengan WA. Isi Bantuan sudah terisi sebelum mulai.
4. **LNC.04 Buka untuk semua:** bagikan tautan dan panduan singkat memasang di layar utama (bawaan: lewat WA).
5. **LNC.05 Review pemakaian (sekitar 2 minggu):** catat apa yang paling dibutuhkan, lalu isi kolom alasan di `bonus.md`. Hitung juga keluhan pengguna iPhone (push).

---

## 11. Catatan Susulan (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini bila ada keputusan baru atau kejadian di lapangan. Format: `### YYYY-MM-DD: topik`. Yang paling akhir menang. Aturan lengkap: `AGENTS.md` bagian 2, aturan 7.

_(belum ada blok)_
