/docs/order.md

# 🧾 order.md: Order, Status, Setuju/Tolak, Catatan Berlapis, Order Wakil Owner

> **Versi 1.3 (4 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Bergantung pada `akun.md` (peran) dan `menu.md` (menu, harga). Notifikasi di `notifikasi.md`, foto di `foto-bukti.md`. Perubahan 1.1 sampai 1.3: diagram alur dibuang dan daftar push dipindah ke `notifikasi.md` bagian 4 (1.1); tabel catatan dan pelanggan tanpa akun dibuat di ORD.01 (bukan ORD.09 dan ORD.11), O6 diperjelas: tunai boleh dipegang penjaga secara fisik, tetapi hanya owner yang menyetujui (1.2); jam bebas tanpa daftar (O2), mundur satu langkah dan koreksi metode bayar (O5, O10, O23), tanpa tombol batal setelah Disetujui (O9), nomor order berjalan (O18), teks pembayaran setelah Kirim (O21), tampilan daftar (O22) (1.3).
> **Status:** O1 sampai O23 disepakati ketua (sesi strategi 4 Nov 2026). Butir **(bawaan)** = pilihan penulis yang tidak ditanyakan satu per satu; ketua boleh mengubahnya sebelum dikerjakan.
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini** (+ `database.md` dan `security.md` untuk langkah tabel, fungsi, aturan akses). Kerjakan langkah bagian 5. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 9. AI meminta di awal sesi: migration terbaru, `supabase/functions/kedai/`, dan berkas JS order bila sudah ada.
> **Tanpa kode dan isi SQL.** **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Fitur ini High-Risk (P0):** harga, status order, hak antar peran, data pelanggan. Tes teliti dan wajib ada bukti.

---

## 1. Tujuan

Mengganti catatan order di WhatsApp dengan sistem yang bisa dilihat tiga pihak sekaligus. Customer memesan semudah mengirim pesan WA, owner memutuskan menerima atau menolak, penjaga mengerjakan dan mengantar, dan semua melihat status yang sama. Foto bukti antar (opsional) menjawab masalah utama: customer yang merasa tidak diantar.

---

## 2. Keputusan

| No  | Keputusan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Dasar                                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| O1  | **Tipe order:** **Diantar (default)**, **Diambil**, **Makan di warung**. Sekitar 90% order Diantar.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Keputusan ketua.                                                                            |
| O2  | **Hari dan jam:** customer memilih **Hari ini atau Besok** dan **jam antar/ambil bebas** (pemilih jam bawaan HP, tanpa daftar; server hanya cek format). "Hari ini" dan "Besok" dihitung **server (WIB)**. **Tanpa batas jam pesan** di versi 1: order di luar jam buka tetap bisa masuk dan sering tetap dilayani; bila tidak bisa (kesiangan, menu habis), **owner menolak** lalu follow up lewat WA. Jam di kartu ditulis sebagai permintaan ("Minta diantar jam 11.15"), bukan janji.                                                                               | Keputusan ketua; waktu dari jam server (`security.md` aturan 6).                            |
| O3  | **Isi order:** satu atau beberapa menu **tersedia** dengan jumlah (batas `item_maks_per_order`, `jumlah_maks_per_item`). **Harga dihitung server**; nama dan harga satuan **disalin ke order**. Total = jumlah harga semua item. **Tanpa ongkir, diskon, atau biaya lain** di versi 1. **(bawaan)**                                                                                                                                                                                                                                                                     | `menu.md` MN4; kandidat ongkir dan diskon di `bonus.md`.                                    |
| O4  | **Alamat:** tipe Diantar: customer memilih **satu dari alamat aktif** di buku alamatnya; **alias dan isi alamat disalin ke order**. Diambil dan Makan di warung **tanpa alamat**.                                                                                                                                                                                                                                                                                                                                                                                       | Keputusan ketua; `akun.md` AK9.                                                             |
| O5  | **Status dan jalur per tipe** (tabel di bagian 4). Order lahir **Menunggu**. Cabang akhir: **Ditolak** dan **Dibatalkan**. Status **tidak bisa loncat**; **mundur hanya satu langkah** sesuai O10 (server menolak selain itu).                                                                                                                                                                                                                                                                                                                                          | Alur ketua; `security.md` SEC-15.                                                           |
| O6  | **Setujui = pembayaran sudah diterima.** Pembayaran selesai **di luar aplikasi** (transfer, QRIS, atau tunai; tunai boleh dititipkan ke penjaga secara fisik lalu dikabarkan ke owner lewat WA). **Owner wajib memilih metode** (Transfer, Tunai, QRIS) saat Setujui; server menolak bila kosong. **Customer tidak memilih metode bayar.** **Penjaga tidak menyetujui atau mencatat pembayaran di aplikasi; hanya owner yang menekan Setujui.** Tidak ada bayar nanti atau utang di versi 1.                                                                            | Keputusan ketua 4 Nov 2026; payment gateway dan utang di `bonus.md`.                        |
| O7  | **Dua owner menekan Setujui/Tolak bersamaan** pada order yang sama: server hanya menerima **satu**, yang lain mendapat pesan "sudah diproses". Order mencatat **nama owner pemutus** dan waktunya.                                                                                                                                                                                                                                                                                                                                                                      | Atomik (`security.md` aturan 4, SEC-10); 5 owner bergantian.                                |
| O8  | **Tolak:** owner boleh menulis **alasan (opsional, maks 200 karakter)** yang tampil ke customer. Follow up lewat WA.                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Keputusan ketua.                                                                            |
| O9  | **Batalkan:** customer hanya boleh membatalkan order **miliknya** saat **Menunggu**. Setelah Disetujui **tidak ada tombol batal** untuk siapa pun; bila terjadi, diselesaikan kekeluargaan lewat WA (nominal kecil, belum pernah terjadi). Order pengganti di hari berikutnya: owner membuat **order wakil** (O15).                                                                                                                                                                                                                                                     | Keputusan ketua 4 Nov 2026.                                                                 |
| O10 | **Pengubah status pengerjaan:** Diproses, Diantar/Siap diambil/Siap disajikan, Selesai diubah **penjaga** (dan **owner**, bawaan, bila penjaga tidak ada). Tiap perubahan tercatat di **riwayat status** (siapa, kapan). **Salah pencet:** penjaga dan owner boleh **mundur satu langkah** (Diproses→Disetujui, atau Diantar/Siap diambil/Siap disajikan→Diproses), **tidak dari Selesai**, tercatat; mundur tidak mengirim push ke customer **(bawaan)**. **Owner** boleh **mengoreksi metode bayar** selama belum Selesai (O23).                                      | Alur ketua; hak di `akun.md` bagian 4; mundur satu langkah: keputusan ketua 4 Nov 2026.     |
| O11 | **Visibilitas:** customer hanya order **miliknya**. Owner **semua**. Penjaga order **Disetujui ke atas** (tidak melihat Menunggu, Ditolak, Dibatalkan). Penjaga dan owner melihat nomor WA dan alamat pemesan pada order yang terlihat **(bawaan: penjaga ikut melihat)**.                                                                                                                                                                                                                                                                                              | Alur ketua; penjaga perlu menghubungi pemesan saat mengantar.                               |
| O12 | **Catatan berlapis:** satu order banyak catatan, tiap catatan **terikat waktu server dan nama penulis**. Catatan awal customer jadi catatan pertama. **Customer pemilik dan owner** boleh menambah **selama belum Diproses** (Menunggu atau Disetujui). **Penjaga hanya membaca.** Catatan **tidak bisa diedit atau dihapus**; berubah pikiran = tambah catatan baru. Batas: `catatan_maks_karakter`, `catatan_maks_per_order`. Setelah Diproses catatan **terkunci** (bila status dimundurkan ke Disetujui, terbuka lagi).                                             | Keputusan ketua (contoh: 1 cabe jadi 3 cabe, tanpa micin).                                  |
| O13 | **Tanpa chat di aplikasi.** Follow up lewat WA; hasilnya dicatat owner sebagai catatan di order. Owner punya tombol **"Chat WA"** (membuka WA ke nomor pemesan). Chat di aplikasi di `bonus.md`.                                                                                                                                                                                                                                                                                                                                                                        | Keputusan ketua (ragu soal chat, pilih WA + catatan).                                       |
| O14 | **Catatan baru memicu push** ke pihak lain yang berhak melihat order itu, penulis dikecualikan: customer menulis → owner (dan penjaga bila sudah Disetujui); owner menulis → customer pemilik (dan penjaga bila sudah Disetujui) **(bawaan)**. **Penjaga tidak dikabari untuk order Menunggu** (O11). Kartu diberi tanda **"Catatan baru"** sampai dibaca. Daftar penerima di `notifikasi.md` bagian 4.                                                                                                                                                                 | Keputusan ketua: catatan yang tidak terlihat sama dengan tidak ada; disesuaikan dengan O11. |
| O15 | **Order wakil owner:** owner membuat order untuk **pelanggan tanpa akun** lewat **wizard 5 langkah** (bagian 4). Hanya owner. Langsung **Disetujui** (owner menerima pembayaran dan memilih metode di wizard), ditandai **"Dibuat oleh [nama owner]"**. Tanpa push ke pemesan (tidak punya akun); penjaga tetap dapat push. Juga dipakai sebagai **order pengganti** (O9): untuk pemesan yang punya akun, owner mencatatnya dulu di daftar Pelanggan tanpa akun. **(bawaan)**                                                                                           | Keputusan ketua.                                                                            |
| O16 | **Pelanggan tanpa akun disimpan sebagai daftar** (nama, keterangan, nomor WA opsional, alamat antar). Hanya **owner** yang melihat dan mengelola; **tidak bisa dihapus, hanya dinonaktifkan**. Isi **disalin ke order** saat dibuat. **Tidak digabung otomatis** dengan akun yang mendaftar kemudian di versi 1. Data pribadi: aturan sama dengan nomor WA customer.                                                                                                                                                                                                    | Keputusan ketua (supaya nyokap tidak "alergi" memakai aplikasi).                            |
| O17 | **Order tidak bisa dihapus siapa pun**, hanya berubah status. Foto bukti dibersihkan setelah 14 hari, catatan dan order tetap.                                                                                                                                                                                                                                                                                                                                                                                                                                          | `AGENTS.md` bagian 7; `foto-bukti.md`.                                                      |
| O18 | **Nomor order berjalan terus** (tidak di-reset harian, mis. "#1042") tampil di kartu untuk dipakai saat bicara lewat WA.                                                                                                                                                                                                                                                                                                                                                                                                                                                | Memudahkan owner dan customer menyebut order yang sama.                                     |
| O19 | **Penyegaran tanpa polling:** daftar diambil saat layar dibuka atau aplikasi kembali ke layar, saat push masuk (bila terbuka), dan lewat tombol **Segarkan**.                                                                                                                                                                                                                                                                                                                                                                                                           | Keputusan ketua; `notifikasi.md`.                                                           |
| O20 | Semua aksi order lewat Edge Function `kedai`; logika (cek menu, hitung harga, setujui, ubah status, tambah catatan) di **fungsi SQL atomik**.                                                                                                                                                                                                                                                                                                                                                                                                                           | `AGENTS.md` bagian 7; `database.md` bagian 5.                                               |
| O21 | **Teks tetap setelah Kirim dan di detail order Menunggu:** "Pesanan diterima. Perwakilan ChATA akan menghubungi lewat WhatsApp untuk pembayaran. Pesanan diproses setelah pembayaran dikonfirmasi." Info rekening dan QRIS tidak disimpan di aplikasi; owner menyampaikannya lewat WA (tombol Chat WA, O13).                                                                                                                                                                                                                                                            | Keputusan ketua 4 Nov 2026 (kata-kata dari ketua; "ChATA" mengikuti nama resmi).            |
| O22 | **Tampilan daftar:** daftar **owner dan penjaga** hanya menampilkan order dengan hari antar **Hari ini dan Besok**; yang hari antarnya sudah lewat tidak tampil (tanpa tanda khusus, tanpa tutup otomatis). Urutan: Hari ini dulu, lalu Besok; dalam tiap hari yang sudah **Disetujui** (sudah dibayar) di atas, urut waktu disetujui (terlama dulu); Selesai di bawah. **Owner** bisa membuka hari lain lewat filter di Semua Order. **Customer** di Pesanan Saya melihat **riwayat lengkap** (foto bukti yang tersimpan 14 hari hanya bisa dibuka dari detail order). | Keputusan ketua 4 Nov 2026; ringkasan 7 hari owner di `bonus.md` (B31).                     |
| O23 | **Koreksi metode bayar:** hanya **owner**, selama belum Selesai, lewat aksi tersendiri; tercatat di riwayat (metode lama dan baru, siapa, kapan). Penjaga tidak bisa.                                                                                                                                                                                                                                                                                                                                                                                                   | Keputusan ketua 4 Nov 2026; O6, O10.                                                        |

---

## 3. Prasyarat

`akun.md` (peran dan buku alamat) dan `menu.md` (menu dan harga) selesai. Foto bukti dikerjakan di `foto-bukti.md`, push di `notifikasi.md`; order bisa berjalan lebih dulu tanpa keduanya.

---

## 4. Yang dibuat

**Jalur status per tipe:**

| Tipe                | Jalur                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------- |
| **Diantar**         | Menunggu → Disetujui → Diproses → **Diantar** → Selesai                                |
| **Diambil**         | Menunggu → Disetujui → Diproses → **Siap diambil** → Selesai                           |
| **Makan di warung** | Menunggu → Disetujui → Diproses → **Siap disajikan** → Selesai                         |
| Cabang              | Menunggu → **Ditolak** (owner, alasan opsional) · Menunggu → **Dibatalkan** (customer) |

Order wakil owner (O15) dibuat langsung di **Disetujui**, lalu mengikuti jalur sesuai tipenya.

**Alur dan push:** customer mengirim order, owner memutuskan (Setujui dengan metode bayar, atau Tolak), penjaga mengerjakan sampai Selesai, ketiganya melihat status yang sama. Siapa dikabari push pada kejadian apa (order baru, catatan, setujui, tolak, status, foto) ada di `notifikasi.md` bagian 4, bukan di sini, supaya tidak tumpang tindih.

**Wizard order wakil owner (5 langkah, satu layar per langkah):**

1. **Pemesan:** cari dan pilih dari daftar Pelanggan tanpa akun, atau tambah baru di tempat (nama wajib; keterangan, nomor WA, alamat antar opsional). Pelanggan terpilih mengisi langkah berikutnya otomatis.
2. **Menu:** pilih menu dan jumlah (harga dihitung server).
3. **Pengiriman:** tipe, hari (Hari ini/Besok), jam (bebas diisi). Bila Diantar, alamat antar wajib: tampil alamat tersimpan pelanggan dan boleh diubah **untuk order ini saja**; mengubah alamat tersimpan lewat layar Kelola Pelanggan. **(bawaan)**
4. **Pembayaran:** metode yang diterima (Transfer, Tunai, QRIS).
5. **Ringkasan:** cek semua isian, lalu Simpan. Order langsung Disetujui dan penjaga mendapat push.

**Komponen:**

| Komponen                   | Isi                                                                                                                                                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tabel order dan turunannya | `order`, `order_item`, `riwayat_status`, `catatan_order`, `baca_catatan`, `pelanggan_luar`. Skema di `database.md`.                                                                                                                                                      |
| Fungsi SQL order           | Atomik: buat order, setujui, tolak, batalkan, ubah status, tambah catatan, buat order wakil. Pola keamanan `AGENTS.md` bagian 7.                                                                                                                                         |
| Aksi `kedai`               | `order_buat`, `order_daftar`, `order_detail`, `order_batal`, `order_setuju`, `order_tolak`, `order_status`, `order_metode_koreksi`, `catatan_tambah`, `catatan_dibaca`, `order_buat_wakil`, `pelanggan_luar_daftar`, `pelanggan_luar_simpan`, `pelanggan_luar_nonaktif`. |
| Layar customer             | Pesan (menu, tipe, alamat, hari, jam, catatan, Kirim, lalu teks pembayaran O21) dan Pesanan Saya (daftar, detail, status, catatan, tombol Batalkan saat Menunggu; riwayat lengkap, O22).                                                                                 |
| Layar owner                | Order Masuk, Semua Order (filter hari dan status), detail order (Setujui, Tolak, catatan, Chat WA), Buat Order (wizard), Pelanggan.                                                                                                                                      |
| Layar penjaga              | Antrean (Hari ini lalu Besok, urutan O22), detail order (catatan hanya baca), tombol status berikutnya, foto bukti (`foto-bukti.md`).                                                                                                                                    |

---

## 5. Urutan pekerjaan (untuk TODO sheet, prefix ORD)

Langkah ⚠️ butuh penjelasan dampak dan "OK" ketua.

1. **ORD.01 ⚠️** Migration: tabel `order`, `order_item`, `riwayat_status`, `catatan_order`, `baca_catatan`, `pelanggan_luar`, baris `pengaturan` (batas item, batas jumlah, batas catatan), hak minimal, RLS. SQL disalin ke repo dulu; cek hak `service_role`.
2. **ORD.02 ⚠️** Fungsi SQL dan aksi `order_buat` (atomik: cek menu tersedia, hitung harga, hari dan jam dari server, simpan order dan item, simpan catatan awal sebagai catatan pertama bila diisi, catat riwayat), plus `order_daftar` dan `order_detail` dengan aturan visibilitas O11.
3. **ORD.03** Layar customer Pesan: menu, tipe, alamat, hari, jam (bebas diisi), catatan awal, kirim, lalu teks pembayaran (O21).
4. **ORD.04** Layar Pesanan Saya: daftar, detail, status, alasan tolak, teks pembayaran pada order Menunggu (O21), tombol Batalkan saat Menunggu (`order_batal`); daftar menampilkan riwayat lengkap (O22).
5. **ORD.05 ⚠️** Aksi owner `order_setuju` (wajib metode) dan `order_tolak`, atomik, aman dari dobel (O7).
6. **ORD.06** Layar owner: Order Masuk, Semua Order (Hari ini dan Besok, filter hari lain; urutan O22), detail order dengan tombol Setujui, Tolak, Chat WA.
7. **ORD.07 ⚠️** Aksi `order_status` untuk penjaga dan owner: jalur sesuai tipe, tanpa loncat, mundur hanya satu langkah dan tidak dari Selesai (O10), riwayat tercatat; plus `order_metode_koreksi` untuk owner (O23).
8. **ORD.08** Layar penjaga: Antrean (Hari ini lalu Besok, O22), detail, tombol status berikutnya.
9. **ORD.09 ⚠️** Catatan berlapis: aksi `catatan_tambah` dan `catatan_dibaca` (tabel sudah dibuat di ORD.01), aturan kunci saat Diproses, batas karakter dan jumlah.
10. **ORD.10** Tampilan catatan di detail order dan tanda "Catatan baru" di kartu order.
11. **ORD.11 ⚠️** Pelanggan tanpa akun: aksi daftar, simpan, nonaktifkan (owner saja; tabel `pelanggan_luar` sudah dibuat di ORD.01).
12. **ORD.12 ⚠️** Aksi `order_buat_wakil` (atomik, langsung Disetujui, metode bayar, penanda pembuat).
13. **ORD.13** Wizard 5 langkah owner dan layar Kelola Pelanggan.
14. **ORD.14** Sesi tes order (`order-test.md` dibuat di sesi tes): 1 akun per peran + customer kedua, bukti untuk harga, hak, dobel-setujui, mundur satu langkah, dan koreksi metode bayar.

---

## 6. Aturan yang paling sering terlanggar

| Aturan                                                                            | Akibat bila dilanggar                                                                                       |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Menerima harga, total, status, atau peran dari aplikasi                           | Order dengan harga sendiri atau status sembarang (SEC-06, SEC-12, SEC-15).                                  |
| Order merujuk menu/alamat terbaru, bukan salinan                                  | Mengubah menu atau alamat mengacaukan order dan catatan lama.                                               |
| Customer bisa melihat order, catatan, atau alamat customer lain                   | Data pelanggan bocor (SEC-05).                                                                              |
| Penjaga bisa melihat order Menunggu atau memanggil Setujui/Tolak                  | Order lompat tanpa persetujuan owner (SEC-08).                                                              |
| Setujui diproses tanpa metode bayar, atau bisa dobel                              | Pembayaran tidak tercatat atau order tercatat dua kali (SEC-10, SEC-11).                                    |
| Catatan bisa diedit, dihapus, atau ditambah setelah Diproses                      | Riwayat permintaan tidak bisa dipercaya; penjaga bekerja dengan catatan usang (SEC-16).                     |
| Hari atau jam dihitung dari jam HP                                                | "Hari ini/Besok" salah (SEC-19).                                                                            |
| Memasang catatan, nama, alamat, atau alasan tolak lewat `innerHTML`               | Teks berisi tag bisa menjalankan skrip (SEC-18).                                                            |
| Menulis data pelanggan nyata (nama, WA, alamat) di repo, md, chat, atau bukti tes | Data pribadi terbuka di repo public (`security.md` aturan 7).                                               |
| Polling berkala untuk menyegarkan daftar order                                    | Kuota free tier cepat habis (`notifikasi.md`).                                                              |
| Menyediakan tombol hapus order                                                    | Catatan order hilang; gunakan status.                                                                       |
| Membatasi pilihan jam atau menolak jam yang sudah lewat                           | Order di luar jam buka warung (yang sering tetap dilayani) tidak bisa dicatat; aplikasi lebih kaku dari WA. |

---

## 7. Dampak dan pembatalan

- **Migration order (ORD.01):** tabel baru (order, item, riwayat, catatan, pelanggan tanpa akun), tidak menyentuh data akun atau menu. Bisa dibatalkan dengan SQL pembatalan tertulis di repo (dibuat sebelum dijalankan).
- **Fungsi order salah:** order bisa gagal dibuat atau status macet; perbaiki dan jalankan ulang fungsi. Pastikan perubahan fungsi tidak mengubah data order yang sudah ada.
- **Salah memilih metode bayar saat Setujui:** owner mengoreksi lewat aksi koreksi metode (O23); tercatat di riwayat.
- **Salah pencet status:** mundur satu langkah (O10). Push yang sudah terkirim ke customer tidak bisa ditarik; status di aplikasi mengikuti koreksi.
- **Pembatalan setelah Disetujui:** tanpa tombol; kekeluargaan lewat WA, bila perlu order wakil pengganti (O9, O15).
- **Order uji sebelum peluncuran:** dibersihkan di `LNC.01` (`features.md`).

---

## 8. Ditunda & Diputuskan (dulu "Belum diputuskan")

**Ditunda (`bonus.md`):** chat di aplikasi, order H+x fleksibel, batas jam pesan dan kuota menu, utang atau bayar nanti, rekap harian dan pendapatan, ongkir dan diskon, penggabungan pelanggan tanpa akun, payment gateway, foto bukti transfer, ringkasan order 7 hari untuk owner.

**Sudah diputuskan (sesi strategi 4 Nov 2026), tidak ada lagi yang menggantung:**

1. **Koreksi salah pencet:** mundur satu langkah oleh penjaga dan owner (tidak dari Selesai); owner boleh mengoreksi metode bayar (O10, O23).
2. **Order yang menggantung:** tanpa tanda dan tanpa tutup otomatis; order yang hari antarnya sudah lewat tidak ditampilkan di daftar owner dan penjaga (O22). Ringkasan 7 hari untuk owner masuk `bonus.md` (B31).
3. **Pembatalan setelah Disetujui:** tanpa tombol batal; kekeluargaan lewat WA, dan bila perlu owner membuat order wakil pengganti (O9, O15).

---

## 9. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

### 2026-11-07: Pintu "Pelanggan tanpa akun" ada di Home (owner)

Sumber: `home.md` HM7 dan HOM.04. Item **Pelanggan** ("Pelanggan tanpa akun", O16) untuk owner ada di **Home**, di bagian tersendiri sebelum Pengaturan akun. Tempatnya sudah dibuat dan tampil "Segera" (tidak bisa diketuk). ORD.11 tinggal mengaktifkannya dan membuat layar daftarnya. Wizard Buat Order tetap di tab Buat Order.

### 2026-11-07: Item order menyimpan pilihan menu

Sumber: blok `2026-11-07: Deskripsi, sheet detail, dan pilihan menu` di `docs/menu.md`. Menambah O3 dan O12.

- `order_item` menyimpan **teks pilihan yang disalin** (nama grup dan nama opsi, mis. "Tingkat pedas: Tidak pedas"), seperti nama dan harga menu disalin. Mengubah atau menonaktifkan grup atau opsi kemudian tidak mengubah order lama.
- Pilihan **selalu tersimpan eksplisit**, termasuk bila customer tidak mengubah bawaan, supaya penjaga tidak perlu menebak.
- `order_buat` menerima **id menu, jumlah, dan id opsi** per item; server memvalidasi opsi terhadap grup yang terpasang di menu. Harga tetap dihitung server; pilihan gratis tidak mengubah total.
- **Item yang sama dengan pilihan berbeda = baris terpisah** (Mie Ayam Tidak pedas x1 dan Mie Ayam Pedas x1).
- Add-on berbayar adalah item menu biasa; tidak ada hubungan induk di order.
- Penjaga dan owner melihat pilihan di baris item pada detail order.
- Ganti pilihan setelah order dikirim: lewat **catatan baru** (O12) selama belum Diproses (bawaan).
- Dampak ke urutan: ORD.01 dan ORD.02 memuat pilihan sejak awal, jadi `order_item` tidak perlu diubah setelah terisi.

### Handoff #1 | 2026-11-08 | KETUA

**Tugas:** ORD.01 selesai (migration tabel order): `20261108_order.sql`, pembatal `20261108_order_batal.sql`, dan cek `supabase/templates/20261108_order_cek.sql`. RLS aktif di 6 tabel tanpa policy, hak `service_role` sesuai `database.md` bagian 3 tanpa DELETE, `anon` dan `authenticated` nol, 4 pengaturan terisi.

**Catatan nama berkas:** `20261108_order_batal.sql` adalah SQL pembatalan migration ORD.01, **bukan** fungsi `order_batal` (fungsi itu ada di ORD.04).

**Keputusan baru** (ketua menyetujui bentuk kolom pilihan; selebihnya pilihan penulis, alasan belum tercatat):

- **Pilihan menu di `order_item` = satu kolom daftar teks `pilihan`** ("Nama grup: Nama opsi"; tidak boleh kosong tetapi boleh daftar kosong). Alasan ketua: hanya catatan riwayat dan sederhana, sesuai kebutuhan warung. Tanpa tabel tambahan dan tanpa aturan unik pada (order, menu), karena item sama dengan pilihan beda = baris terpisah.
- **Nama tabel `order` wajib ditulis `public."order"`** (kutip ganda) di semua SQL, karena `order` adalah kata yang dipakai SQL sendiri.
- **Nomor order mulai dari 1.** Order uji ikut memakai nomor; reset sebelum peluncuran masuk pembersihan LNC.01 (butuh "OK" ketua).
- **`jam_permintaan` wajib diisi** (jam saja, tanpa tanggal). Melonggarkannya kelak mudah, mengetatkannya sulit.
- **Pagar antar-kolom di tabel `order`** (pagar kedua di samping fungsi): tepat satu jenis pemesan (akun atau pelanggan tanpa akun); order wakil wajib punya pembuat owner; alamat hanya untuk tipe Diantar; metode bayar ada tepat saat status Disetujui ke atas; pemutus dan waktu diputuskan ada tepat saat status Ditolak atau Disetujui ke atas; alasan tolak hanya pada Ditolak. Untuk order wakil, **pemutus diisi owner pembuatnya** (O15). Tiga pagar terakhir dilonggarkan untuk Dibatalkan di Handoff #6.
- Panjang nama pemesan (salinan) dan nama pelanggan tanpa akun: 3 sampai 30 karakter; keterangan pelanggan tanpa akun 3 sampai 100 (opsional).
- Pelaku pada `riwayat_status`, `catatan_order`, dan `baca_catatan` merujuk ke **akun Supabase Auth** (bukan `profil` atau `staf`), karena pelakunya bisa customer atau staf.
- Batas panjang atas catatan tidak ada di tabel; dijaga fungsi dari `catatan_maks_karakter` dan `catatan_maks_per_order`.

### Handoff #2 | 2026-11-08 | KETUA

**Tugas:** ORD.02 selesai: fungsi SQL `order_buat`, `order_daftar`, `order_detail` (`20261108_02_order_fungsi.sql`, pembatal, dan cek di `supabase/templates/`) dan tiga aksinya di `kedai` (hanya tambahan: `PETA_GALAT_ORDER`, tiga fungsi aksi, tiga `case`).

**Keputusan baru** (ketua menyetujui format teks pilihan "Nama grup: Nama opsi", disusun mengikuti urutan grup di menu; selebihnya pilihan penulis, alasan belum tercatat; rincian lengkap di kepala `20261108_02_order_fungsi.sql`):

- `order_buat` menerima `tipe`, `alamat_id`, `hari` (teks persis "Hari ini" atau "Besok"), `jam` (HH:MM; jam yang sudah lewat tidak ditolak, O2), `item` (daftar `{menu_id, jumlah, opsi_ids}`), dan `catatan`. Isian lain dibuang. Tipe selain Diantar: `alamat_id` diabaikan.
- Menu nonaktif atau Habis = satu kode galat `menu_tidak_tersedia`. Item sama dengan pilihan sama yang dikirim dua kali = dua baris. **Tidak ada penahan kirim ganda di server**; tombol Kirim dikunci di layar (ORD.03). Fungsi tidak mengisi `baca_catatan`; tanda "Catatan baru" (ORD.10) menghitung catatan milik orang lain saja.
- `order_daftar`: baris ringkas (tanpa nomor WA dan isi alamat; teks `ringkas` "Nama x jumlah"). Filter hari (`YYYY-MM-DD`) hanya untuk owner; filter status untuk semua peran. Urutan owner dan penjaga: hari antar, lalu kelompok (Disetujui sampai siap, Menunggu, Selesai, Ditolak dan Dibatalkan), lalu waktu diputuskan atau dibuat terlama dulu. Customer: terbaru dulu, tanpa pembagian halaman.
- `order_detail`: metode bayar tampil ke owner dan penjaga; nama pemutus dan riwayat status hanya owner. Order yang tidak ada dan yang tidak boleh dilihat memakai satu galat `order_tidak_ditemukan`. Urutan baris item: nama menu lalu pilihan.
- Balasan `kedai`: `order_buat` memuat `order` (`id`, `nomor`, `status`, `total`, `hari_target`, `jam_permintaan`), `order_daftar` memuat `daftar`, `order_detail` memuat `order`.
- `pilihan_rusak` dan `opsi_tidak_valid` dipetakan di `kedai`. Kode `id_kosong`, `pengaturan_rusak`, dan `total_terlalu_besar` sengaja tidak dipetakan (galat umum 500).

### Handoff #3 | 2026-11-08 | KETUA

**Tugas:** ORD.02 **selesai dan lulus tes** (lewat konsol `window.KedaiAkun.panggilKedai`, satu akun per peran + customer kedua, dummy): order sah dengan total dari server, teks pilihan tersalin, isian palsu (total, status, peran, metode bayar, harga) diabaikan, customer kedua tidak bisa melihat order customer lain (404), owner dan penjaga memanggil `order_buat` dibalas 403, penjaga tidak melihat order Menunggu, 11 kasus isian salah ditolak, menu Habis menolak seluruh order tanpa memakai nomor order.

**Keputusan baru:**

- **Tes jam HP (SEC-19) digeser ke ORD.14**, dikerjakan di HP Android dummy setelah ORD.03: geser tanggal HP, pesan lewat layar, cek `hari_target` di detail order. Alasan: aplikasi tidak pernah mengirim jam HP, jadi tes lewat konsol tidak membuktikan apa pun; menggeser jam Mac bersama tidak disarankan (bisa mengganggu login dan SSH).
- Catatan teknis untuk layar: isian `order_detail` bernama **`id`** (bukan `order_id`); balasan konsol berbentuk `{status, data}`.

### 2026-11-08: MT-23 dan MT-24 selesai dan lulus

`docs/menu-test.md` MT-23 dan MT-24 dikerjakan dan lulus lewat `order_buat` (isian palsu diabaikan, opsi di luar grup dibalas 409 tanpa order terbentuk, harga menu diubah kemudian: order lama tetap harga lama). Rincian bukti ada di Handoff #13 `docs/menu.md`. Tidak ada kode yang diubah.

### Handoff #4 | 2026-11-08 | [RAC]

**Tugas:** ORD.03 giliran 1 (layar customer Pesan: keranjang, form pesanan, Kirim, layar selesai dengan teks O21): `public/pesan.js` baru; `index.html`, `kerangka.js`, `sw.js` diubah.

**Keputusan baru** (pilihan penulis; alasan belum tercatat dari ketua kecuali disebut):

- Keranjang disimpan di `pesan.js` (bukan di daftar menu), karena `kerangka.js` memuat ulang daftar menu tiap tab Pesan dibuka. Menu sama dengan kombinasi pilihan berbeda = baris terpisah; kombinasi sama digabung jumlahnya.
- Yang dikirim ke `order_buat`: `tipe`, `alamat_id` (hanya Diantar), `hari`, `jam` (HH:MM), `item` (`menu_id`, `jumlah`, `opsi_ids`), `catatan`. Total di layar hanya perkiraan; angka resmi dari balasan server.
- Alamat antar diambil lewat aksi `status` (`h.data.alamat`), tanpa aksi baru. Satu alamat: langsung terpilih. Lebih dari satu: customer wajib memilih sendiri (hindari salah antar). Kembali dari Buku alamat, daftar alamat dimuat ulang otomatis.
- Jam wajib diisi (pemilih jam bawaan HP), tanpa daftar dan tanpa batas (O2). Label jam mengikuti tipe (Jam antar, Jam ambil, Jam datang).
- Tombol Kirim dikunci sejak ditekan sampai balasan datang; keranjang dikosongkan begitu order berhasil.
- Jaringan putus setelah permintaan terkirim (hasil tidak pasti): pesan menyuruh cek Pesanan Saya lalu Segarkan, jangan kirim ulang dulu. Offline dari awal: "Pesanan belum terkirim".
- Galat 404 atau 409 yang berisi "Muat ulang menu" membuat daftar menu dimuat ulang otomatis; galat alamat tidak ditemukan membuat daftar alamat dimuat ulang.
- Teks O21 ada di `pesan.js` dan dibuka lewat `window.KedaiPesan.teksBayar` supaya layar lain memakai teks yang sama.
- Satu menu boleh punya beberapa grup (`menu_grup_atur`, ada batas jumlah grup), tiap grup punya tepat satu pilihan bawaan, jadi customer memilih **satu opsi per grup**.
- Batas item, jumlah per item, dan panjang catatan **tidak terbaca di aplikasi**: `status` hanya mengirim `alamat_maks` (`PENGATURAN_AMAN` di `kedai/index.ts`). Server yang menolak dan pesannya ditampilkan. Menambah batas ke `PENGATURAN_AMAN` berarti mengubah dan men-deploy `kedai` (berisiko, butuh "OK" ketua); ditunda.
- Kontrak `window.KedaiPesan.tambah(menu, pilihan, jumlah)`: `menu` = `{ id, nama, harga }`; `pilihan` = daftar `{ id (uuid opsi), teks ("Nama grup: Nama opsi") }`, satu per grup, urut seperti grup di menu (menu tanpa grup: daftar kosong); `jumlah` bilangan bulat >= 1. Mengembalikan `true` bila masuk keranjang. Yang dikirim ke server dari `pilihan` hanya `id`-nya; susunan teks resmi disusun server.
- Berkas JS baru dan `sw.js` harus naik **dalam satu commit**: kalau `sw.js` naik duluan, pemasangan service worker baru gagal karena berkas barunya belum ada.

### Handoff #5 | 2026-11-08 | [FREN]

**Tugas:** ORD.03 giliran 2: tombol Tambah di kartu menu, pilihan dan jumlah di sheet detail, lalu masuk keranjang. Perubahan di `menu.js` (id grup dan id opsi ikut terbaca; menu tanpa grup: Tambah langsung masuk keranjang jumlah 1 lalu "Ditambahkan ✓" sebentar; menu dengan grup: Pilih membuka sheet; hanya menu Tersedia), `menu-detail.js` (satu pilihan per grup dengan bawaan terpilih, jumlah 1 sampai 9999 sebagai bentuk data saja, "Tambah ke pesanan" memanggil `KedaiPesan.tambah` lalu menutup sheet; Tab berputar di antara kontrol sheet), `pesan.js`, dan `style.css`.

**Keputusan baru dari ketua:**

- **Jam bawaan Diantar 11:00 (WIB), terisi otomatis, customer tetap bisa mengubah.** Diambil dan Makan di warung kosong dan wajib diisi. Dikerjakan di frontend saja karena mengubahnya di server berarti merombak fungsi SQL; server tetap menerima jam apa pun (O2).
- **Tombol pesanan bulat melayang dengan emoji keranjang, ikut layar saat digulir, di atas navigasi bawah.** Alasan ketua: supaya tidak menabrak tombol navigasi.

**Keputusan baru pilihan penulis** (alasan belum tercatat dari ketua):

- Jam bawaan 11:00 dikosongkan lagi saat tipe pindah ke Diambil atau Makan di warung, **selama customer belum menyentuh jamnya**. Jam yang diketik atau diubah customer tidak pernah ditimpa. Pindah balik ke Diantar dengan jam kosong: terisi 11:00 lagi. Setelah order terkirim atau Keluar: kembali ke Diantar dengan 11:00.
- Angka 11:00 ditulis di kode (`JAM_BAWAAN_ANTAR` di `pesan.js`) atas permintaan ketua. `AGENTS.md` bagian 1 menyebut angka yang bisa berubah idealnya di database; memindahkannya butuh ubah dan deploy `kedai` (berisiko, butuh "OK" ketua), jadi ditunda.
- Tombol melayang dipasang dari `pesan.js` ke panel Pesan, tampil hanya di langkah menu dan bila keranjang tidak kosong, dengan lencana jumlah item. Tombol "Lihat pesanan" lama di `index.html` disembunyikan, bukan dihapus; teks ringkasan keranjang tetap tampil. Posisi: 76 px di atas dasar layar, z-index 12 (di bawah sheet detail, 30).
- "Hari ini" dipesan setelah jam 11: jam bawaan sudah lewat, sistem tetap menerima dan customer mengubah sendiri (sesuai aturan ketua).

### 2026-11-08: ORD.03 lulus

ORD.03 selesai dan lulus (bukti di chat, tidak disimpan): Kirim ditekan tiga kali beruntun lewat konsol hanya membuat **satu** order; menu jadi Habis saat Kirim ditolak server tanpa membuat order (nomor tidak loncat), daftar menu dimuat ulang otomatis, dan menu Habis tampil tanpa tombol Tambah; pilihan menu (non-bawaan dan bawaan), harga, total, alamat per tipe, jam bawaan Diantar 11:00, dan hari target benar.

Dilaporkan ketua jalan di Android, tanpa bukti rinci di chat: offline, Diantar tanpa alamat ditolak, jam kosong ditolak, Keluar mengosongkan keranjang dan alamat, tombol pesanan melayang. SEC-19 tetap di ORD.14.

### 2026-11-08: Owner boleh membatalkan setelah Disetujui, dan aksi Alih hari

Sumber: keputusan ketua lewat PIC, 8 Nov 2026. Push: lihat juga blok "Push untuk batal oleh owner dan alih hari" di `docs/notifikasi.md` bagian 9.

**Menimpa:**

- O9, bagian 7, dan bagian 8 poin 3 ("setelah Disetujui tanpa tombol batal untuk siapa pun") tidak berlaku lagi untuk owner. Customer dan penjaga tetap tanpa tombol batal setelah Disetujui.
- Tabel jalur status dan O5: Dibatalkan kini juga bisa dari Disetujui, Diproses, dan Diantar/Siap diambil/Siap disajikan (oleh owner), tidak hanya dari Menunggu.
- O10: mundur satu langkah tetap berlaku. Alih hari adalah pengecualian tersendiri (lihat di bawah).
- ORD.04 kini juga memuat fungsi SQL dan aksi `order_batal` dan menjadi ⚠️.

**Keputusan baru (ketua):**

- **Order Selesai tidak bisa dibatalkan atau dialihkan siapa pun.**
- **Batal oleh owner:** hanya owner, dari status Disetujui, Diproses, dan Diantar/Siap diambil/Siap disajikan. **Alasan opsional dan tampil ke customer** seperti alasan tolak (O8; batas 200 karakter: bawaan). Statusnya tetap satu, Dibatalkan; riwayat mencatat siapa yang membatalkan (customer atau owner) dan dari status apa (bawaan).
- **Customer** tetap hanya boleh membatalkan order miliknya saat Menunggu.
- **Tanpa guard di sistem:** owner sudah berkoordinasi dengan penjaga lewat WA sebelum membatalkan atau mengalihkan, jadi sistem tidak menambah pengecekan status pengerjaan. O11 tidak berubah: penjaga tidak melihat order Dibatalkan, sehingga order hilang dari Antrean saat daftar disegarkan.
- **Uang yang sudah diterima** dikembalikan owner di luar aplikasi lewat WA; tidak dicatat di aplikasi.
- **Alih hari:** aksi owner terpisah dari batal (`order_alih_hari`, dikerjakan di ORD.07). Nomor order dan pembayaran tetap, hari antar berubah, status kembali ke **Disetujui** (pengecualian atas aturan mundur satu langkah O10, termasuk dari Diantar/Siap), tercatat di riwayat (hari lama dan baru, siapa, kapan, alasan). Boleh dari Disetujui, Diproses, dan Diantar/Siap. **Hari tujuan hanya Besok.** **Jam boleh diisi owner; bila tidak diisi, memakai jam yang sudah ada di order.** Alasan opsional dan tampil ke customer (bawaan). Karena status kembali ke Disetujui, catatan terbuka lagi (O12). Tanpa order baru dan tanpa order wakil.
- **Customer tidak bisa mengubah hari atau jam sendiri** setelah order terkirim; perubahan lewat catatan (O12) atau owner.
- **Push (keputusan ketua):** customer dikabari saat order dibatalkan owner atau dialihkan; owner dikabari saat customer membatalkan; **penjaga dikabari saat owner membatalkan order yang sudah Disetujui ke atas dan saat order dialihkan**. Penjaga tidak dikabari untuk order yang dibatalkan saat Menunggu (O11, O14). Isi push tanpa data pemesan dan tanpa alasan (NT2); notifikasi batal yang ditekan penjaga membuka Antrean, bukan detail order. Untuk order wakil (pemesan tanpa akun), hanya penjaga yang dikabari. Rincian di `notifikasi.md` bagian 9.
- **Batal dan Setujui bersamaan:** satu yang berhasil, dijaga di fungsi SQL atomik (cek status di dalam fungsi), seperti O7.

**Dampak pada langkah kerja:**

- **ORD.04** menjadi ⚠️ dan memuat fungsi SQL dan aksi `order_batal` (customer saat Menunggu, owner dari Disetujui sampai Diantar/Siap).
- **ORD.07** memuat aksi `order_alih_hari`.
- **ORD.15 (baru):** layar owner untuk Batalkan, Alihkan hari, koreksi metode bayar, dan tombol status/mundur. Sebelumnya aksi ORD.07 belum punya langkah layar. Setelah ORD.06 dan ORD.07.
- **ORD.14** diperluas dan menunggu ORD.15: batal vs setujui bersamaan, owner batal dari tiap status (Selesai ditolak), customer batal setelah Disetujui ditolak, alih hari dari tiap status (Selesai dan selain Besok ditolak), aksi owner oleh customer dan penjaga ditolak, penjaga menekan tombol status pada order yang sudah Dibatalkan.
- **NTF.04, NTF.06, NTF.08** menyesuaikan (lihat `notifikasi.md` bagian 9).

Alasan keputusan di luar yang disebut di atas: alasan belum tercatat.

### Handoff #6 | 2026-11-08 | KETUA

**Tugas:** ORD.04 bagian server selesai: fungsi SQL `order_batal` (`20261108_03_order_batal_fungsi.sql`, pembatal, dan cek) dan aksi `order_batal` di `kedai` (tambahan: `PETA_GALAT_ORDER_BATAL`, `aksiOrderBatal`, satu `case`). Layar Pesanan Saya di Handoff #7.

**Keputusan baru** (ketua menyetujui keempatnya; alasan belum tercatat):

- **Tiga pagar di tabel `order` dilonggarkan** (`order_metode_status_cek`, `order_pemutus_cek`, `order_alasan_cek`). Dibatalkan boleh membawa metode bayar dan pemutus (sama-sama ada atau sama-sama kosong), dan alasan boleh ada pada Ditolak dan Dibatalkan. Aturan lain tidak berubah.
- **Alasan batal disimpan di kolom `alasan_tolak` yang sudah ada** (bukan kolom baru), sehingga `order_daftar` dan `order_detail` tidak diubah dan alasannya langsung tampil ke customer. Isi kolom itu bisa alasan tolak **atau** alasan batal; pembedanya adalah `status` (Ditolak atau Dibatalkan).
- **Order yang dibatalkan owner tetap menyimpan metode bayar dan pemutus** (berguna untuk pengembalian uang lewat WA). Siapa yang membatalkan dan dari status apa ada di `riwayat_status` (hanya terlihat owner).
- **Alasan dari customer diabaikan** (O8: alasan hanya untuk owner). Alasan owner juga disalin ke `riwayat_status.keterangan`.
- Pilihan penulis: `order_batal` tidak mengembalikan id pemesan (bahan push NTF.06 ditambahkan nanti bila perlu); kode galat baru `peran_tidak_boleh`, `alasan_terlalu_panjang`, `sudah_diproses`, `tidak_bisa_dibatalkan`.

**Kontrak untuk layar:**

- `order_batal` dengan isian `{ id, alasan }` (`id` = id order; `alasan` hanya dipakai owner). Sukses `{ ok: true, order: { id, nomor, status: "Dibatalkan", status_asal, oleh_peran } }`. Galat `{ ok: false, pesan }`; tampilkan `pesan` apa adanya lewat `textContent`. Galat untuk customer: **409** (order sudah bukan Menunggu; layar sebaiknya menyegarkan daftar), **404** "Pesanan tidak ditemukan." (bukan miliknya atau tidak ada), 400 id rusak.
- `order_daftar` (isian `{}` untuk customer) membalas `{ ok, daftar }`, terbaru dulu, riwayat lengkap, baris ringkas: `id`, `nomor`, `tipe`, `status`, `hari_target`, `jam_permintaan`, `total`, `alasan_tolak`, `ringkas`. `order_detail` (isian `id`) membalas `{ ok, order }` dengan item, pilihan, catatan, dan `alasan_tolak`. Customer **tidak** menerima `metode_bayar`, `pemutus_nama`, dan riwayat status.

### Handoff #7 | 2026-11-08 | RAC

**Tugas:** ORD.04 **selesai**: layar Pesanan Saya (daftar riwayat lengkap, detail, status, alasan tolak atau batal, teks O21 pada order Menunggu, tombol Batalkan hanya saat Menunggu). `public/pesanan.js` baru (`window.KedaiPesanan`: `tampil` saat tab dibuka dan lewat Segarkan, `reset` saat Keluar); `index.html`, `kerangka.js`, `pesan.js`, dan `sw.js` (cache `chata-v12`) diubah; `style.css` tidak.

**Keputusan baru:**

- Tombol Batalkan memakai kartu konfirmasi "Yakin batalkan?" dulu (disetujui RAC; alasan: pembatalan tidak bisa dihidupkan lagi).
- Pilihan penulis (alasan belum tercatat): nomor WA pemesan tidak ditampilkan; teks O21 hanya pada Menunggu; layar tidak mengurutkan ulang daftar (mengikuti urutan server); Segarkan pada halaman detail menyegarkan detail itu.

### 2026-11-08: Perbaikan pesan 409 `order_batal` dan urutan daftar customer

**Keputusan ketua:**

- **Pesan 409 diperbaiki.** Order yang sudah **Dibatalkan** dibalas "Pesanan ini sudah dibatalkan." (customer dan owner). Order yang sudah **Ditolak** (customer) dibalas "Pesanan ini sudah ditolak sebelumnya, jadi tidak bisa dibatalkan lagi. Hubungi tim ChATA lewat WhatsApp bila perlu." Disetujui sampai Selesai (customer) dan status lain (owner) tetap memakai pesan lama ("sudah diproses").
- **Urutan daftar customer dibiarkan seperti sekarang** (semua status, terbaru dulu, urutan dari server); O22 tidak berubah. Alasan belum tercatat (ketua menyebut "dulu", jadi boleh dibuka lagi nanti).

**Yang dikerjakan:** fungsi `order_batal` versi baru dengan kode galat `sudah_dibatalkan` (customer dan owner) dan `sudah_ditolak` (customer), dipetakan di `PETA_GALAT_ORDER_BATAL` di `kedai` (migration `20261108_04_order_batal_pesan.sql`, pembatal, dan cek). Tidak berubah: siapa boleh membatalkan, urutan pengecekan (order milik orang lain dicek paling dulu), penguncian `FOR UPDATE`, riwayat status, hak `EXECUTE`, tabel dan data. Layar tidak diubah.

### Handoff #8 | 2026-11-08 | [Ketua]

**Tugas:** perbaikan pesan 409 `order_batal` selesai dan lulus tes; ORD.04 tetap selesai. Versi terbaru fungsi `order_batal` ada di **`20261108_04_order_batal_pesan.sql`** (bukan versi 03); bila disentuh lagi, pakai versi itu sebagai dasar.

### Handoff #9 | 2026-11-08 | [RAC]

**Tugas:** ORD.05 selesai (`order_setuju` dan `order_tolak`): `20261108_05_order_setuju_tolak.sql`, pembatal, cek, dan dua aksi di `kedai` (tambahan: `PETA_GALAT_ORDER_KEPUTUSAN`, `aksiOrderSetuju`, `aksiOrderTolak`, dua `case`). Tidak ada perubahan tabel. Kedua fungsi mengunci order dengan `SELECT ... FOR UPDATE` seperti `order_batal` (O7, SEC-10). Terbukti: customer dan penjaga memanggil keduanya = 403; metode kosong, asing, atau huruf kecil = 400; setuju dan tolak ulang = 409 tanpa menimpa; empat permintaan bersamaan pada dua order: tepat satu menang; customer melihat alasan tolak tanpa metode, pemutus, dan riwayat; customer membatalkan order Ditolak dan Dibatalkan mendapat pesan yang benar. Owner membatalkan order Disetujui lewat `order_batal` berhasil (pagar tabel baru menerima order Dibatalkan yang membawa metode bayar dan pemutus).

**Kontrak untuk layar owner:**

- `order_setuju` dengan isian `{ id, metode }` (`metode` persis "Transfer", "Tunai", atau "QRIS"). Sukses `{ ok: true, order: { id, nomor, status: "Disetujui", status_asal: "Menunggu", metode_bayar } }`.
- `order_tolak` dengan isian `{ id, alasan }` (`alasan` opsional, maks 200 karakter, boleh kosong). Sukses `{ ok: true, order: { id, nomor, status: "Ditolak", status_asal: "Menunggu" } }`.
- Galat `{ ok: false, pesan }`: tampilkan `pesan` apa adanya lewat `textContent`. Kode: 400 (metode tidak valid, alasan terlalu panjang, id rusak), 403 (bukan owner, akun nonaktif), 404 (order tidak ditemukan), 409 (sudah diproses, sudah ditolak, sudah dibatalkan; layar sebaiknya menyegarkan daftar).
- Customer menerima `alasan_tolak` di daftar dan detail; `metode_bayar`, `pemutus_nama`, dan `riwayat` hanya untuk owner (penjaga melihat `metode_bayar` saja).

**Keputusan baru** (pilihan penulis; alasan belum tercatat dari ketua):

- Galat order yang bukan Menunggu dibedakan: Disetujui ke atas = `sudah_diproses` (sesuai SEC-10), Ditolak = `sudah_ditolak`, Dibatalkan = `sudah_dibatalkan`. Pesan: "Pesanan sudah diproses. Segarkan daftar pesanan.", "Pesanan ini sudah ditolak.", "Pesanan ini sudah dibatalkan."
- `riwayat_status.keterangan` pada Setujui berisi "Metode bayar: <metode>"; pada Tolak berisi alasan (kosong bila tanpa alasan). Koreksi metode (O23) memakai format keterangan serupa (rincian di Handoff #12).
- `pemutus_nama` disalin dari `staf.nama_tampilan` saat keputusan (salinan).
- Metode bayar dipangkas spasi lalu dicocokkan persis (huruf besar-kecil dibedakan); alasan tolak yang hanya spasi disimpan kosong.
- Fungsi tidak mengembalikan id pemesan (bahan push ditambahkan di NTF bila perlu).
- Lapis kedua peran di `kedai`: selain owner aktif (customer dan penjaga) dibalas 403 "Aksi ini hanya untuk owner."

### Handoff #10 | 2026-11-09 | [RAC]

**Tugas:** ORD.06 (layar owner) kode selesai dan terpasang di production; tidak ada perubahan SQL, migration, atau `kedai/index.ts`. Perubahan: `public/orderowner.js` baru (satu pabrik `buatLayar` dipakai untuk Order Masuk dan Semua Order), `index.html`, `kerangka.js`, `sw.js` (`chata-v13`).

**Perilaku layar:**

- **Order Masuk:** `order_daftar` dengan `{ status: "Menunggu" }` (server membatasi ke Hari ini dan Besok, O22; Menunggu yang hari antarnya sudah lewat hanya terlihat lewat filter hari di Semua Order, server tidak diubah). Detail dari `order_detail`: pemesan, nomor WA, alamat, isi order dan pilihan, catatan (baca saja), dan kartu Keputusan (metode bayar dan nama pemutus) bila sudah diputuskan.
- **Setuju:** wajib pilih Transfer, Tunai, atau QRIS (tombol mati sebelum dipilih), kirim `order_setuju` `{ id, metode }`. **Tolak:** alasan opsional maks 200 karakter, kirim `order_tolak` `{ id, alasan }`. Tombol dikunci sebelum permintaan berangkat. Setelah sukses, detail dimuat ulang dari server. Galat 409 dan 404 menampilkan pesan server lalu memuat ulang detail.
- **Chat WA:** tautan `https://wa.me/<angka>`; tombol tidak tampil bila nomor kosong. Nomor WA tersimpan sudah berawalan 62.
- **Semua Order:** filter Hari (satu tanggal) dan Status (9 status), dikirim ke `order_daftar` hanya saat **Terapkan** atau Segarkan. **Hapus filter** mengosongkan semuanya (kembali ke Hari ini dan Besok).
- Order selain Menunggu belum punya tombol aksi (menunggu ORD.07 dan ORD.15). Daftar, detail, nomor WA, alamat, dan isian filter dikosongkan saat Keluar.

**Keputusan baru:**

- **Filter bawaan Semua Order** (ketua, 9 Nov 2026): saat tab dibuka pertama kali sesudah masuk, **Hari = tanggal hari ini menurut jam HP** dan **Status = Menunggu**; owner bebas mengganti. Alasan: tidak mengubah server (dari ketua). Order **Besok** tidak tampil di bawaan, tetapi tetap terlihat di tab Order Masuk dan lewat Hapus filter. Bawaan terisi sekali sejak masuk dan terisi lagi setelah Keluar. Ini **satu pengecualian disengaja** atas aturan "waktu hanya dari jam server" (`AGENTS.md` bagian 7, `security.md` aturan 6): jam HP hanya dipakai mengisi bawaan kolom filter, tidak dipakai menghitung apa pun di order; server tetap memvalidasi dan menyaring.
- **Nama tombol "Setuju"** (bukan "Setujui") di layar owner, atas permintaan ketua.
- Pilihan penulis, alasan belum tercatat: catatan order ikut ditampilkan baca-saja di detail owner (sedikit mendahului ORD.10; menambah catatan dan tanda "Catatan baru" tetap ORD.09 dan ORD.10); waktu catatan ditulis WIB hanya untuk tampilan.

### Handoff #11 | 2026-11-09 | FREN

**Tugas:** ORD.06 **selesai** (tes penutup lulus). Perubahan terakhir hanya CSS: dua baris tambahan di `.kartu__isi` di `style.css` (`overflow-wrap: anywhere`) supaya alasan atau catatan panjang tanpa spasi turun baris; kartu tetap selebar layar dan tingginya menyesuaikan. Berlaku juga untuk catatan dan teks metode bayar yang memakai kelas itu.

**Terbukti** (akun dummy; bukti di chat): dua owner menekan Setuju bersamaan, yang kedua mendapat "Pesanan sudah diproses. Segarkan daftar pesanan.", detail dimuat ulang menjadi Disetujui, metode bayar dan pemutus tidak tertimpa; alasan Tolak 191 dan 200 karakter tersimpan utuh dan tampil di layar owner dan customer, kolom menahan ketikan di 200; Tolak tanpa alasan tidak menampilkan kartu alasan.

**Masih terbuka:**

- Tes ORD.06 di HP Android (ketua), metode Transfer (Tunai dan QRIS sudah terbukti), dan pesan galat saat koneksi putus ketika layar sudah terbuka (P2, opsional).
- Baris SEC di sheet sengaja belum dicentang; jadwalnya setelah ORD.14. Bukti sebagian: SEC-07 dan SEC-08 (`order_setuju`, `order_tolak`, `order_batal` oleh customer dan penjaga), SEC-09 (`order_batal`), SEC-10 (dua owner di layar). Menunggu: SEC-05 (catatan belum ada aksinya), SEC-06 (aksi selain `order_buat`), SEC-19 (jam HP, digeser ke ORD.14: di HP Android dummy geser tanggal HP, pesan lewat layar, cek `hari_target`; bagian "waktu catatan dari server" menunggu ORD.09).
- Dimasukkan ke ORD.14: customer batal vs owner setuju bersamaan (SEC-10, dua sesi login); skenario Tolak yang menang saat bersamaan; owner membatalkan dari Diproses dan Diantar/Siap (dari Disetujui sudah terbukti); urutan daftar owner dan penjaga menurut O22 belum tercatat dibuktikan.
- Pagar antar-kolom tabel `order` baru teruji untuk Menunggu, Disetujui, Ditolak, dan Dibatalkan lewat fungsi yang ada; sisanya (order wakil, kecocokan metode bayar dengan status) lewat ORD.12 dan ORD.14.
- Push belum ada untuk setuju, tolak, dan batal (NTF); ketiganya berjalan tanpa push sampai itu.
- Catatan belum tampil di detail customer (ORD.10).
- Baris keranjang belum ditandai saat galat "menu habis"; customer mencarinya sendiri.
- `pesan.js` dan `orderowner.js` melewati ~500 baris (bagian alamat `pesan.js` paling mudah dipisah).
- Batas item, jumlah, dan catatan tidak terbaca di aplikasi; jam bawaan 11:00 ada di kode. Memindahkan keduanya ke database butuh ubah dan deploy `kedai` ("OK" ketua).
- Kosmetik: variabel `pernahMuatDaftar` di `pesanan.js` tidak terpakai.
- Order uji tidak bisa dihapus; dibersihkan di LNC.01 bersama reset nomor order.

### Handoff #12 | 2026-11-09 | KETUA

**Tugas:** ORD.07 ⚠️ kode selesai dan **ter-deploy di production** (tes dan commit di Handoff #13).

**Berkas:** `supabase/migrations/20261109_01_order_status_alih_hari.sql` (+ `_batal.sql`, cek di `supabase/templates/20261109_01_order_status_alih_hari_cek.sql`), sudah dijalankan di SQL Editor dan lulus cek (3 fungsi, `SECURITY DEFINER`, `search_path` kosong, `anon` dan `authenticated` tanpa `EXECUTE`, pagar tabel tidak berubah; tabel dan data tidak berubah); `supabase/functions/kedai/order_status.ts` (baru) dan `index.ts` (hanya tambahan, **0 baris lama dihapus**). Deploy `kedai --use-api` sukses (deploy multi-berkas pertama, terbukti jalan); token CLI sudah dibersihkan.

**Keputusan baru (ketua):**

- **"Hanya Besok" untuk alih hari** dihitung dari tanggal server saat aksi. Order yang hari targetnya sudah Besok atau lebih ditolak (`sudah_besok`); hari ini atau yang sudah lewat boleh dialihkan ke Besok.
- **Pilihan C:** alasan alih hari **hanya masuk `riwayat_status.keterangan`**, tidak masuk `alasan_tolak` (pagar `order_alasan_cek` hanya mengizinkan Ditolak dan Dibatalkan). Ini menunda bagian "alasan tampil ke customer" di blok 8 Nov; diselesaikan di ORD.16 (Handoff #16).
- **Kode baru `kedai` di berkas terpisah** mulai ORD.07; kode lama tidak dipindah dan tidak ada refactor yang direncanakan. Alat bantu diberikan lewat parameter `buatAksiOrderStatus(alat)`. Alasan ketua: `index.ts` sudah sangat panjang. Aman untuk free tier (hitungan panggilan dan batas ukuran tidak terpengaruh).
- **Lima pilihan penulis yang disetujui ketua:** (1) alasan alih hari maks 100 karakter, format keterangan "Alih hari 2026-11-09 ke 2026-11-10[, jam 11:00 ke 12:30][. Alasan: ...]" (karena `keterangan` maks 200); (2) koreksi metode berketerangan "Metode bayar: <baru> (sebelumnya <lama>)", metode sama ditolak (`metode_sama`); (3) alih hari ditolak bila hari target sudah Besok atau lebih; (4) dari Diantar/Siap, Disetujui tidak bisa dicapai lewat `order_status` (hanya lewat alih hari), sedangkan mundur Diproses ke Disetujui tetap boleh (O10); (5) `order_status` menerima `status_dilihat` hanya sebagai pembanding (beda dengan server: 409 `status_berubah`), status tujuan selalu ditentukan server.
- **Pilihan penulis lain** (alasan belum tercatat): mundur berketerangan "Mundur satu langkah"; penjaga yang memanggil `order_status` pada order Menunggu, Ditolak, atau Dibatalkan dibalas `order_tidak_ditemukan` (O11); koreksi metode hanya untuk Disetujui sampai Diantar/Siap (Dibatalkan dikecualikan, supaya metode dan pemutusnya tetap jadi bahan pengembalian uang lewat WA); alih hari boleh untuk order wakil owner; fungsi tidak mengembalikan id pemesan.

**Kontrak untuk layar (ORD.15 dan ORD.08):** balasan `{ status, data }` dari `panggilKedai`; sukses `data = { ok: true, order: {...} }`, galat `data = { ok: false, pesan }` (tampilkan `pesan` lewat `textContent`; 409 sebaiknya menyegarkan daftar atau detail).

- `order_status` (penjaga dan owner), isian `{ id, arah: "maju" | "mundur", status_dilihat }` (status yang sedang tampil di layar). Sukses: `order = { id, nomor, status, status_asal, arah, oleh_peran }`. Galat: 400 (data rusak), 403, 404, 409 (`status_berubah`, belum disetujui, sudah ditolak, dibatalkan, atau selesai, tidak bisa mundur).
- `order_metode_koreksi` (owner), isian `{ id, metode }`. Sukses: `order = { id, nomor, status, metode_bayar, metode_sebelumnya }`.
- `order_alih_hari` (owner), isian `{ id, jam?, alasan? }` (jam `JJ:MM`, kosong = jam lama; alasan maks 100). Sukses: `order = { id, nomor, status: "Disetujui", status_asal, hari_lama, hari_baru, jam_permintaan, oleh_peran }`. Hari tujuan tidak pernah dikirim aplikasi.

**Masalah yang belum beres:** push belum ada untuk status, koreksi, dan alih hari (NTF.04, NTF.06, NTF.08 menyesuaikan). Butir terbuka Handoff #11 tidak berubah.

### Handoff #13 | 2026-11-09 | [FREN]

**Tugas:** tes ORD.07 ⚠️ (lanjutan Handoff #12) dijalankan dan **lulus**. ORD.07 sudah dicentang di sheet. Commit `0d9cb2e` sudah di-push ke repo ChATA (pagar `AGENTS.md` bagian 8 lolos). Tidak ada kode yang diubah di sesi ini.

**Berkas:** tidak ada yang diubah; yang ter-commit hanya hasil sesi ketua. Satu baris terhapus: placeholder `_(belum ada blok)_` di `AGENTS.md` bagian 12, diganti blok catatan ketua (tidak ada aturan lama yang hilang).

**Terbukti** (konsol, akun dummy; bukti di chat): jalur maju dan mundur satu langkah untuk tiga tipe sampai Selesai oleh owner dan penjaga (`oleh_peran` benar). Ditolak: mundur dari Disetujui (409), `arah` salah (400), status basi dan dobel pencet (409), semua aksi pada order Selesai, Menunggu, Ditolak, dan Dibatalkan (409). Hak: customer memanggil ketiga aksi (403); penjaga memanggil koreksi metode dan alih hari (403) dan `order_status` pada order Menunggu, Ditolak, Dibatalkan (404). Koreksi metode sama atau asing (400). Alih hari dari Disetujui, Diproses, Diantar: alasan 100 karakter lolos dan 101 ditolak (400), jam berubah hanya bila dikirim, isian `hari` palsu diabaikan, order yang sudah Besok ditolak (409). Riwayat (query baca-saja bagian 4 berkas cek, `LIMIT` dinaikkan ke 30 hanya di editor) berketerangan "Mundur satu langkah", "Metode bayar: Transfer (sebelumnya Tunai)", "Alih hari ... ke ..."; aksi yang ditolak tidak meninggalkan baris. Mundur dari Diantar mendarat di Diproses; kembali ke Disetujui hanya lewat alih hari (SEC-15).

**Keputusan baru:** tidak ada.

**Masalah yang belum beres:**

- Belum terbukti: dua sesi menekan tombol bersamaan untuk `order_status` (SEC-10) dan jam HP digeser (SEC-19). Keduanya dikerjakan di ORD.14. Baris SEC di sheet belum dicentang.
- Push belum ada untuk status, koreksi, dan alih hari (NTF.04, NTF.06, NTF.08).
- Logout dashboard Supabase dan GitHub di Mac bersama setelah deploy belum dikonfirmasi.
- Butir terbuka dari Handoff #11 tidak berubah.

### Handoff #14 | 2026-11-09 | RAC

**Tugas:** ORD.08 (layar penjaga Antrean) **selesai**: terpasang di production, tes lulus (termasuk di HP Android ketua dan mode offline), sudah dicentang di sheet. Ditambah permintaan ketua setelah tes: **badge tipe order berwarna** di layar customer, owner, dan penjaga. Tidak ada perubahan SQL, migration, atau `kedai`.

**Commit:** layar Antrean `21cdd81` (sudah di-push; pagar `AGENTS.md` bagian 8 lolos: folder, `git remote -v`, email noreply, semuanya milik ketua); badge tipe `f0ea828`.

**Berkas:** ORD.08 (`21cdd81`): `public/orderpenjaga.js` (baru; `window.KedaiOrderPenjaga`: `tampil`, `reset`), `index.html`, `kerangka.js`, `style.css` (warna tab di variabel `--antrean-*`), `sw.js` (`chata-v14`, `orderpenjaga.js` masuk daftar cache). Badge tipe: `orderpenjaga.js`, `orderowner.js`, `pesanan.js` (helper `badgeTipe` dan `barisTipe`), `style.css` (warna di variabel `--tipe-*`); `sw.js` tidak berubah. Baris lama yang diganti dijadikan komentar, bukan dihapus.

**Perilaku layar Antrean:**

- Empat tab: **Baru** (Disetujui), **Diproses**, **Siap** (Diantar, Siap diambil, Siap disajikan), **Selesai**, masing-masing dengan angka jumlah order. Satu panggilan `order_daftar` dengan isian `{}` (server menyaring menurut peran, O11 dan O22), lalu dibagi ke tab di layar; pindah tab tanpa panggilan server. Di dalam tab, order dikelompokkan per tanggal antar, urutan dari server.
- **Tombol langkah berikutnya langsung di kartu, tanpa dialog konfirmasi** (keputusan ketua; salah pencet ditutup mundur satu langkah, O10). Label ikut tipe: `Mulai proses`; dari Diproses: `Antar sekarang` (Diantar), `Siap diambil` (Diambil), `Siap disajikan` (Makan di warung); dari Siap: `Tandai selesai`. Label hanya tulisan; status tujuan ditentukan server.
- **Mundur satu langkah** hanya di detail, tombol kecil: `Kembalikan ke Baru` (dari Diproses) dan `Kembalikan ke Diproses` (dari Siap). Tidak ada di tab Baru dan Selesai (server menolaknya, Handoff #13).
- Aplikasi hanya mengirim `order_status` `{ id, arah, status_dilihat }`. Setelah sukses, daftar atau detail dimuat ulang dari server dan muncul pesan, misalnya "Order #15 pindah ke Diproses." Galat 409 dan 404 menampilkan pesan server lalu memuat ulang. Tombol dikunci sebelum permintaan berangkat.
- Detail: nama pemesan, nomor WA (teks), tipe, jam, alamat (hanya Diantar), isi order dengan pilihan menu, Total, dan catatan baca-saja. Tanpa tombol Chat WA (khusus owner, O13).
- Keluar mengosongkan daftar, detail, angka tab, dan mengembalikan layar ke tab Baru.

**Perilaku badge tipe:** tulisan tipe kecil di kartu daftar dan detail diganti badge (kotak bulat, warna pekat, tulisan putih), **warna sama di tiga peran**: Diantar ungu, Diambil pink magenta, Makan di warung tosca; tipe tak dikenal abu. Tanpa keterangan warna. Sengaja berbeda dari lencana status (pil pucat) dan warna tab Antrean. Layar Pesan customer (`pesan.js`) tidak diubah.

**Keputusan baru (ketua, dibicarakan lewat PIC):**

- Nama tab **Baru, Diproses, Siap, Selesai**; nama tab berwarna tegas (biru tua, oranye tua, hijau tua, abu tua) dan isi di bawahnya warna lembut senada.
- Tombol langkah berikutnya **tanpa dialog konfirmasi**.
- Perubahan `sw.js` (v14 dan daftar cache) disetujui ketua.
- **Badge tipe** berwarna di tiga layar, warna konsisten antar peran, tanpa keterangan warna (alasan: tipe yang hanya dibedakan font kurang jelas).

**Pilihan penulis** (alasan belum tercatat):

- Judul pemisah di tiap tab memakai **tanggal dari server** ("Senin, 9 Nov 2026"), bukan "Hari ini/Besok". Label itu butuh tahu hari ini menurut server; jam HP tidak dipakai (`AGENTS.md` bagian 7). Bila ingin label "Hari ini/Besok", butuh field dari server atau keputusan ketua.
- Kartu daftar penjaga tidak menampilkan harga. Detail menampilkan jumlah, pilihan, dan Total tanpa harga satuan.
- Warna badge tipe (ungu, pink magenta, tosca) usulan penulis; ketua boleh mengganti lewat variabel `--tipe-*`.

**Terbukti** (akun dummy; bukti di chat): daftar penjaga dengan isian `{}` (order Menunggu tak terlihat sampai owner menekan Setuju, O11), jalur maju tiga tipe dengan label tombol sesuai tipe, mundur Siap ke Diproses dan Diproses ke Baru (tombol mundur tidak ada di Baru dan Selesai), angka tab dan pesan sukses, detail (pilihan, Total, catatan, alamat hanya Diantar), Keluar-masuk kembali ke tab Baru, HP Android ketua termasuk offline, dan badge tipe di tiga layar.

**Masalah yang belum beres:**

- Dua penjaga menekan tombol yang sama bersamaan (SEC-10, `order_status`): dikerjakan di ORD.14. Baris SEC di sheet belum dicentang.
- Push untuk status, koreksi, batal, dan alih hari belum ada (NTF.04, NTF.06, NTF.08).
- `orderpenjaga.js` sekitar 880 baris, melewati patokan ~500 baris (bagian pembantu yang sama dengan `orderowner.js` bisa dipisah bila diputuskan; butuh penjelasan dampak dan "OK" ketua).
- Butir terbuka dari Handoff #11 sampai #13 tidak berubah.

### Handoff #15 | 2026-11-09 | FREN

**Tugas:** ORD.15 (tombol aksi owner di detail order) **selesai**: terpasang di production, tes lulus, sudah dicentang di sheet. ORD.16 dikerjakan terpisah (keputusan ketua, alasan belum tercatat). Tidak ada perubahan SQL, migration, `kedai`, `style.css`, atau `kerangka.js`.

**Commit** (pagar `AGENTS.md` bagian 8 lolos dua kali): `c7e4b04` kartu aksi owner; `c100ae1` info sukses tidak lagi menggulung layar ke atas (lihat keputusan).

**Berkas:** `public/orderowneraksi.js` (baru, `window.KedaiOrderOwnerAksi.buat(alat)`): tampilan dan isian aksi owner, tidak memanggil server sendiri (pengiriman lewat `kirim` milik `orderowner.js`); dipisah supaya `orderowner.js` tidak makin gemuk (permintaan ketua). `orderowner.js` (sambungan saja; baris lama dijadikan komentar, tidak ada kode yang hilang; guard `kirim` hanya mewajibkan Menunggu untuk Setuju dan Tolak), `index.html`, dan `sw.js` (`chata-v15`, disetujui ketua).

**Perilaku layar** (Order Masuk dan Semua Order, status Disetujui, Diproses, Diantar/Siap diambil/Siap disajikan):

- **Langkah berikutnya** (label ikut tipe: Mulai proses; Antar sekarang, Siap diambil, atau Siap disajikan; Tandai selesai) dan **mundur satu langkah** (Kembalikan ke Disetujui dari Diproses; Kembalikan ke Diproses dari Siap; tidak dari Disetujui dan Selesai). Kirim `order_status` `{ id, arah, status_dilihat }`.
- **Koreksi metode bayar** (`order_metode_koreksi`): metode sekarang tidak bisa dipilih; Simpan baru aktif setelah memilih metode lain.
- **Alihkan ke Besok** (`order_alih_hari`): jam dan alasan (maks 100) opsional, kartu konfirmasi; hari tujuan tidak dikirim.
- **Batalkan order** (`order_batal`): alasan opsional (maks 200, tampil ke customer), kartu konfirmasi.
- Menunggu tetap Setuju dan Tolak. Selesai, Ditolak, Dibatalkan: tanpa aksi, hanya Chat WA.

**Keputusan baru:**

- Ketua (9 Nov, lewat PIC): **ORD.15 dan ORD.16 dipisah**; kode owner baru ditaruh di berkas terpisah; pendaftaran di `sw.js` disetujui.
- Pilihan penulis (alasan belum tercatat): langkah maju dan mundur **tanpa dialog konfirmasi**, mengikuti layar penjaga (Handoff #14). Tombol Alihkan **selalu tampil** di status yang boleh; bila order sudah Besok, server menolak dan pesannya tampil (tanggal HP tidak dipakai, `AGENTS.md` bagian 7). Formulir yang terbuka ditutup dan isiannya dikosongkan bila detail dimuat ulang atau pindah order.
- Atas permintaan FREN setelah tes: **pesan galat menggulung layar ke atas, info sukses tidak**. Alasan: menggulung saat tiap pindah status mengganggu urutan langkah.

**Terbukti** (akun dummy, lewat layar; bukti di chat): maju dan mundur, koreksi metode, Batalkan dengan alasan (order hilang dari Antrean penjaga setelah Segarkan), alih hari dengan jam kosong dan jam diisi termasuk dari Siap diambil, dan alih hari kedua pada order yang sudah Besok ditolak server.

**Masalah yang belum beres:**

- **Belum terbukti:** ketuk dua kali cepat pada tombol status (tidak bisa dites manual: tombol langsung berganti ke langkah berikutnya); server sudah menolak dobel-pencet (Handoff #13), SEC-10 dua sesi tetap di ORD.14. Revisi gulung layar (`c100ae1`) belum dicek di layar.
- **Tandai selesai tanpa konfirmasi dan tidak bisa dimundurkan** (layar owner dan penjaga). Butuh keputusan ketua bila ingin dialog konfirmasi khusus tombol itu.
- Push untuk status, koreksi, batal, dan alih hari belum ada (NTF.04, NTF.06, NTF.08).
- Kosmetik (P2): tulisan "Simpan koreksi" turun dua baris di HP kecil. `orderowner.js` 1194 baris, melewati patokan ~500 (bagian pembantu bisa dipisah bila diputuskan; butuh penjelasan dampak dan "OK" ketua).
- Order dummy: #21 (Diantar), #25 (Diambil, jam 12.30), #27 (Diantar) semuanya Disetujui, hari Selasa 10 Nov, dipakai ulang di ORD.14; #24 (Diambil, Menunggu); #28 dan #23 Dibatalkan; #29, #26, #15, #17, #22 Selesai. Order uji tidak bisa dihapus; dibersihkan di LNC.01.
- Butir terbuka Handoff #11 sampai #14 yang tidak disebut di atas tidak berubah.

### Handoff #16 | 2026-11-09 | KETUA

**Tugas:** ORD.16 ⚠️ (alasan alih hari tampil ke customer) **selesai**: terpasang di production, tes lulus (termasuk di HP Android), sudah dicentang di sheet. Commit `ce7b614` sudah di-push (pagar `AGENTS.md` bagian 8 lolos). Tidak ada perubahan tabel, `kedai`, `sw.js`, atau `orderowneraksi.js`.

**Berkas:** `supabase/migrations/20261109_02_order_detail_alasan_alih.sql` (`order_detail` diganti dengan `CREATE OR REPLACE`; nama, parameter, dan tipe kembalian sama; selebihnya persis versi `20261108_02_order_fungsi.sql` ditambah isian `alasan_alih`), pembatal `..._batal.sql` (mengembalikan versi lama persis), dan cek `supabase/templates/20261109_02_order_detail_alasan_alih_cek.sql`; sudah dijalankan di SQL Editor dan lulus cek. `public/pesanan.js` (hanya tambahan: kartu "Alasan alih hari").

**Perilaku:** `order_detail` mengirim `alasan_alih` **hanya ke customer pemilik order**, **hanya saat status Disetujui, Diproses, Diantar, Siap diambil, atau Siap disajikan**, dan **hanya dari alih hari terakhir** (bila alih terakhir tanpa alasan, kosong). Penjaga dan owner menerima `null` (penjaga tidak melihat alasan sesuai `security.md`; owner sudah punya alasannya di `riwayat`). Nilainya dibaca dari teks `riwayat_status.keterangan`, yaitu sesudah ". Alasan: " pada baris berformat "Alih hari YYYY-MM-DD ke ".

**Keputusan baru:**

- **Opsi A (ketua):** tanpa ubah tabel; alasan dibaca dari keterangan riwayat. Opsi B (kolom baru di tabel `order`) tidak dipilih.
- Disetujui ketua: hanya alih hari terakhir yang tampil, hanya selama order berjalan, dan hanya untuk customer pemilik.
- **Keterkaitan yang harus diingat:** bila format keterangan di `order_alih_hari` diubah, `order_detail` harus ikut diubah (ada komentar peringatan di migration). Bila tidak, kartu di layar customer rusak tanpa pesan galat.
- `orderowneraksi.js` tidak diubah: form Alihkan owner sudah bertuliskan alasan tampil ke customer.

**Terbukti** (akun dummy; bukti di chat): cek SQL 1 sampai 8 lolos; customer pemilik menerima alasan pada #27, order Selesai, Ditolak, Dibatalkan `null`; penjaga dan owner menerima `alasan_alih` null; layar customer dan Android lolos.

**Masalah yang belum beres:**

- Kasus alih hari terakhir tanpa alasan belum dites eksplisit lewat layar (#21 dan #25 menerima null, konsisten tetapi belum dibuktikan).
- Push untuk alih hari belum ada (NTF.08).
- Logout dashboard Supabase dikonfirmasi ketua; GitHub belum disebut.
- Order dummy #21, #25, dan #27 (Disetujui, hari Selasa 10 Nov) kini sudah Besok, jadi alih hari lagi ditolak server (`sudah_besok`) sampai harinya lewat. Untuk tes alih hari baru, buat order dummy Hari ini. Order uji tidak bisa dihapus; dibersihkan di LNC.01.
- Butir terbuka dari Handoff #11 sampai #15 yang tidak disebut di atas tidak berubah (ketuk dua kali pada tombol status, Tandai selesai tanpa konfirmasi, `orderowner.js` 1194 baris, push alih hari NTF.08, dan lainnya).

### Handoff #17 | 2026-11-09 | KETUA

**Tugas:** ORD.17 ⚠️ (pembeda batal customer atau owner di layar customer) **selesai**: terpasang di production, tes lulus, sudah dicentang di sheet. Commit `f04b787` sudah di-push (pagar `AGENTS.md` bagian 8 lolos). Tidak ada perubahan tabel, `order_batal`, `kedai`, `sw.js`, atau `orderowneraksi.js`.

**Berkas:** `supabase/migrations/20261109_03_order_detail_pembatal.sql` (`order_detail` diganti dengan `CREATE OR REPLACE`, dibangun di atas versi ORD.16 sehingga `alasan_alih` tetap ada; sudah dijalankan dan lulus cek), pembatal `..._pembatal_batal.sql` (mengembalikan ke versi ORD.16 persis, bukan versi asli; untuk itu jalankan `20261109_02_order_detail_alasan_alih_batal.sql` sesudahnya), cek `supabase/templates/20261109_03_order_detail_pembatal_cek.sql`, dan `public/pesanan.js` (hanya tambahan).

**Perilaku:** `order_detail` mengirim `dibatalkan_oleh` (`customer` atau `owner`) dan `dibatalkan_oleh_nama` (nama tampilan owner; kosong bila pembatalnya customer) **hanya ke customer pemilik order yang berstatus Dibatalkan**. Peran lain menerima `null`. Nilainya dibaca dari baris `riwayat_status` pembatalan terakhir (`order_batal` selalu mencatat `oleh` = akun pembatal): `customer` bila `oleh` sama dengan pemesan order, selain itu `owner`. Layar customer menampilkan kartu "Dibatalkan oleh customer" atau "Dibatalkan oleh pihak ChATA (nama)", **walau alasan pembatalan kosong**; kartu "Alasan pembatalan" yang sudah ada tidak berubah.

**Keputusan baru:**

- **Ketua: nama owner yang membatalkan tampil ke customer pemilik order.** Alasan: ada 5 owner; tanpa nama, customer tidak tahu siapa yang harus dihubungi. Teks mengikuti sheet.
- **Pertentangan dengan catatan lama (yang paling akhir menang):** (1) komentar kepala `pesanan.js` "Customer tidak bisa melihat siapa yang membatalkan" tidak berlaku lagi; (2) Handoff #6 (siapa yang membatalkan di `riwayat_status`, hanya terlihat owner) kini hanya berlaku untuk riwayat lengkap, sebab **nama pembatal** juga sampai ke customer pemilik order itu. Yang **tetap tertutup untuk customer**: `pemutus_nama`, riwayat lengkap, dan metode bayar.
- **Nama diambil dari riwayat pembatalan, bukan dari `order.pemutus_nama`.** `pemutus_nama` adalah owner yang dulu menekan Setujui (tetap disimpan pada order Dibatalkan untuk bahan pengembalian uang), jadi memakainya akan menampilkan nama owner yang salah.
- Pilihan penulis (alasan belum tercatat): nama mengikuti nama tampilan owner **saat ini** (bukan salinan saat pembatalan); bila tidak ada baris riwayat pembatalan, layar tidak menampilkan kartu pembatal.
- **Untuk sesi berikutnya:** versi `order_detail` yang aktif di production adalah `20261109_03_order_detail_pembatal.sql`. Perubahan `order_detail` berikutnya harus berangkat dari berkas itu, bukan dari `20261108_02_order_fungsi.sql` atau versi ORD.16, supaya `alasan_alih` dan isian pembatal tidak hilang.

**Terbukti** (akun dummy; bukti di chat): cek SQL 1 sampai 9 lolos (termasuk tidak ada order Dibatalkan tanpa baris riwayat pembatalan); customer menerima pembatal yang benar untuk 8 order Dibatalkan (6 oleh customer, 2 oleh owner dengan nama dummy); penjaga dan owner menerima isian pembatal null (penjaga tidak melihat order Dibatalkan); layar customer menampilkan kartu pada #28 (owner) dan #13 (customer).

**Masalah yang belum beres:**

- Tes ORD.17 di HP Android belum dijalankan (P2; kartunya memakai kelas yang sama dengan kartu lain, ORD.16 sudah lolos di Android).
- Owner pembatal tanpa nama tampilan belum diuji; layar akan menulis "Dibatalkan oleh pihak ChATA" tanpa kurung.
- Push untuk pembatalan belum ada (NTF.06).
- Logout dashboard Supabase untuk sesi ORD.17 belum dikonfirmasi.
- Butir terbuka dari Handoff #11 sampai #16 yang tidak disebut di atas tidak berubah (ketuk dua kali pada tombol status, Tandai selesai tanpa konfirmasi, `orderowner.js` 1194 baris, push alih hari NTF.08, dan lainnya).
- Order dummy tidak berubah dari Handoff #16. Order uji tidak bisa dihapus; dibersihkan di LNC.01.

**Saran giliran berikutnya:**

1. **ORD.09** ⚠️ (catatan berlapis: `catatan_tambah` dan `catatan_dibaca`, aturan kunci saat Diproses, batas karakter dan jumlah), sesi ketua: butuh penjelasan dampak dan "OK" ketua. Lampirkan `AGENTS.md` + `order.md` + `database.md` + `security.md` + `supabase/functions/kedai/index.ts` + `order_status.ts` + `20261109_03_order_detail_pembatal.sql` + migration tabel catatan (`20261108_order.sql`). Aksi baru `kedai` ditaruh di berkas terpisah sesuai `AGENTS.md` bagian 12.
2. Lalu ORD.10, ORD.11 sampai ORD.13, dan **ORD.14** (sisa tes: SEC-10, SEC-19, batal vs setuju bersamaan).

### Handoff #18 | 2026-11-09 | [RAC]

**Tugas:** ORD.09 ⚠️ (catatan berlapis: `catatan_tambah` dan `catatan_dibaca`) kode selesai dan **ter-deploy di production**; tes konsol **sebagian** lulus (di bawah). **Belum dicentang di sheet** dan **belum di-commit atau di-push**.

**Berkas:** `supabase/migrations/20261109_04_catatan_fungsi.sql` (+ `_batal.sql`, cek di `supabase/templates/20261109_04_catatan_fungsi_cek.sql`), sudah dijalankan di SQL Editor dan cek 1 sampai 7 lulus. `supabase/functions/kedai/catatan.ts` (baru) dan `index.ts` (hanya tambahan, **0 baris lama dihapus**: komentar kepala, satu import, satu blok sambungan, dua `case`). Deploy `kedai --use-api` sukses (tiga berkas terunggah), token CLI sudah dibersihkan, logout dashboard Supabase dikonfirmasi. Tabel, hak tabel, pengaturan, dan `order_detail` tidak diubah.

**Kontrak untuk layar (ORD.10):** balasan `{ status, data }` dari `panggilKedai`; galat `data = { ok: false, pesan }` (tampilkan `pesan` lewat `textContent`).

- `catatan_tambah` isian `{ id, isi }`. Sukses: `{ ok: true, catatan: { id, nama_penulis, peran_penulis, isi, waktu }, order: { id, nomor, status }, jumlah_catatan }`. Galat: 400 (isi kosong, terlalu panjang, data rusak), 403 (penjaga), 404 (order tidak ada atau bukan milik customer itu), 409 (batas jumlah, atau status Diproses ke atas, Ditolak, Dibatalkan, Selesai; layar sebaiknya menyegarkan detail).
- `catatan_dibaca` isian `{ id }`. Sukses: `{ ok: true, order_id, catatan_terakhir_id }` (null bila order belum punya catatan). Galat: 403, 404.

**Terbukti** (akun dummy lewat konsol; bukti di chat, tidak disimpan):

- Cek SQL 1 sampai 7: hak `EXECUTE` hanya `service_role`; `catatan_order` tanpa ubah dan hapus; `baca_catatan` tanpa hapus; `anon` dan `authenticated` nol; batas 200 dan 10 terbaca; nama staf dan profil di dalam 3 sampai 30; tidak ada penunjuk silang antar order.
- Owner dan customer pemilik menambah catatan; isian palsu (`peran`, `nama_penulis`, `waktu`) diabaikan (peran dan nama dari server, waktu hari ini); spasi di tepi dipangkas.
- Isi kosong atau spasi saja, 201 dan 501 karakter, bukan teks, tanpa isi, dan id rusak ditolak 400; tepat 200 karakter lolos.
- Batas 10 catatan per order (catatan awal dihitung): percobaan ke-10 pada #25 ditolak 409.
- Order Selesai, Dibatalkan, Ditolak ditolak 409; id tidak ada 404.
- `catatan_dibaca`: penunjuk naik ke catatan terbaru, dipanggil ulang tidak berubah, isian palsu `catatan_id` diabaikan, order tanpa catatan sukses dengan null.
- Customer kedua: tambah dan dibaca pada order orang lain 404 (termasuk order Selesai, tidak bocor status); kepanjangan di order orang lain 400.

**Keputusan baru** (ketua menyetujui ringkasan dampak dan deploy; selebihnya pilihan penulis, alasan belum tercatat):

- Batas `catatan_maks_per_order` menghitung **semua** catatan order itu, termasuk catatan awal dari `order_buat`.
- Isi dipangkas seperti `order_buat` (spasi, tab, baris kosong di tepi). Cek urutan: akun, peran, pengaturan, isi, kepemilikan, baru status (customer tidak bisa menebak status order orang lain).
- `catatan_tambah` mengunci baris order (`FOR UPDATE`) tetapi tidak mengubah kolom order dan tidak menulis `riwayat_status`.
- `catatan_dibaca`: penunjuk hanya maju dan dihitung server dari catatan terbaru; order tanpa catatan sukses tanpa menulis (kolom penunjuk wajib terisi).
- Kode galat baru dipetakan di `catatan.ts`: `catatan_kosong`, `catatan_terlalu_panjang`, `catatan_terlalu_banyak`, `catatan_terkunci`, `peran_tidak_boleh`; `sudah_ditolak` dan `sudah_dibatalkan` memakai kode lama. `id_kosong` dan `pengaturan_rusak` sengaja tidak dipetakan (500 umum).
- Pagar kasar di `kedai`: isi lebih dari `BATAS_TEKS` (500) ditolak 400 sebelum ke SQL.

**Masalah yang belum beres:**

- **Tes belum selesai:** (1) penjaga (tambah 403; dibaca 404 untuk Menunggu dan Dibatalkan, 200 untuk Disetujui dan Selesai) belum dijalankan; (2) catatan terbuka lagi setelah status dimundurkan ke Disetujui atau dialihkan; (3) owner menambah catatan di order wakil (menunggu ORD.12); (4) dua sesi bersamaan, catatan vs "Mulai proses" (SEC-10, ORD.14); (5) query cek 8 dan 9 diulang sesudah tes selesai; (6) teks berisi tag HTML tampil sebagai teks biasa (SEC-18, menunggu layar ORD.10). Baris SEC di sheet belum dicentang.
- **Belum di-commit dan di-push:** satu commit untuk tiga berkas migration (fungsi, pembatal, cek), `catatan.ts`, dan `index.ts`; pagar `AGENTS.md` bagian 8 (folder, `git remote -v`, email commit milik ketua) wajib lolos dulu.
- Order dummy: #25 sudah penuh 10 dari 10 catatan (tidak bisa ditambah lagi, tidak bisa dihapus); #24 berisi 5 catatan; #21 belum punya catatan. Customer dummy punya penunjuk baca di #24. Dibersihkan di LNC.01.
- Push catatan (O14) belum ada (NTF). Logout GitHub di Mac bersama belum dikonfirmasi.
- Butir terbuka Handoff #11 sampai #17 yang tidak disebut di atas tidak berubah.

**Saran giliran berikutnya:**

1. Selesaikan tes yang tersisa (daftar di atas), jalankan ulang query cek 8 dan 9, lalu commit dan push. Setelah itu butir ORD.09 bisa dicentang di sheet.
2. **ORD.10:** layar catatan dan tanda "Catatan baru". Catatan: `order_detail` dan `order_daftar` **belum membawa penunjuk baca** milik pemanggil, jadi tanda itu belum bisa dihitung. Kemungkinan butuh perubahan fungsi SQL (⚠️, "OK" ketua). Bila `order_detail` diubah, berangkat dari `20261109_03_order_detail_pembatal.sql` (versi aktif).

### Handoff #19 | 2026-11-09 | RAC

**Tugas:** lanjutan Handoff #18: tes ORD.09 ⚠️ yang bisa dikerjakan sekarang selesai dan lulus. Commit `19ca148` sudah di-push (pagar `AGENTS.md` bagian 8 lolos). Butir ORD.09 dicentang di sheet. Tidak ada kode yang diubah. Handoff ini menggantikan "Masalah yang belum beres" dan "Saran giliran berikutnya" di Handoff #18; selebihnya Handoff #18 tetap berlaku.

**Terbukti** (akun dummy, bukti di chat):

- Penjaga: `catatan_tambah` 403 di order Disetujui, Selesai, dan Menunggu; `catatan_dibaca` 200 di Disetujui dan Selesai, 404 di Menunggu dan Dibatalkan. Daftar penjaga (8 order) tidak memuat Menunggu dan Dibatalkan.
- Kunci catatan: tambah saat Disetujui 200, maju ke Diproses lalu tambah 409, mundur ke Disetujui lalu tambah 200.
- Customer kedua: tambah dan dibaca di order orang lain 404; kepanjangan 400.
- Cek SQL 1 sampai 9 lulus semua (bagian 8: penulis hanya customer dan owner, waktu dari server; bagian 9: penunjuk baca tidak pernah melewati catatan terbaru).

**Keputusan baru:** tidak ada.

**Masalah yang belum beres:**

- Tes yang menunggu tugas lain: catatan di order wakil (ORD.12), dua sesi bersamaan catatan vs "Mulai proses" (SEC-10, ORD.14), teks bertag HTML tampil sebagai teks biasa (SEC-18, ORD.10). Ulangi query cek 8 dan 9 setelah ketiganya. Baris SEC di sheet belum dicentang.
- Push catatan (O14) belum ada (NTF).
- Order dummy: #25 penuh 10 dari 10 catatan, #21 punya 2, #24 punya 5. Dibersihkan di LNC.01.
- Logout dashboard Supabase dan GitHub di Mac bersama sudah dikonfirmasi.

**Saran giliran berikutnya:** ORD.10 ⚠️ (layar catatan dan tanda "Catatan baru"). `order_detail` dan `order_daftar` belum membawa penunjuk baca milik pemanggil, jadi kemungkinan butuh perubahan fungsi SQL ("OK" ketua); berangkat dari `20261109_03_order_detail_pembatal.sql` (versi aktif). Lalu ORD.11 sampai ORD.13, dan ORD.14.

### Handoff #20 | 2026-11-09 | [FREN]

**Tugas:** ORD.10 selesai dengan **versi B**: catatan tampil di detail order customer dan owner, dan customer serta owner bisa menambah catatan (O12). **Tanda "Catatan baru" di kartu daftar tidak dikerjakan**; ditunda ke NTF.07 bersama push catatan (keputusan ketua, lihat blok `2026-11-09: Tanda "Catatan baru" digeser dari ORD.10 ke NTF.07` di `docs/notifikasi.md` bagian 9, sudah ditempel). Tidak ada perubahan SQL, migration, tabel, atau `kedai`.

**Commit:** `214dcf1` (inti ORD.10) sudah di-push, pagar `AGENTS.md` bagian 8 lolos. Susulan sesudahnya: perapihan jarak kartu Catatan (`style.css`, kelas `kartu--catatan`) sudah tayang di production (dikonfirmasi lewat layar). **Perbaikan galat kolom kosong di layar owner** (`orderownercatatan.js`, `orderowner.js`) sudah dibuat tetapi **sudah dicommit, push, belum dites**: `c13cd77`.

**Berkas:**

- `public/orderownercatatan.js` (baru, `window.KedaiOrderOwnerCatatan.buat(alat)`): kartu form "Tambah catatan" owner dan penanda sudah dibaca. Tidak memanggil server untuk `catatan_tambah` sendiri; lewat `kirim` milik `orderowner.js`, jadi kunci tombol, 409, 404, dan muat ulang detail memakai jalur yang sama dengan Setuju dan Tolak.
- `public/pesanan.js` (layar customer): `bacaDetail` membaca `catatan`; kartu Catatan, form tambah catatan, `catatan_dibaca`.
- `public/orderowner.js`: hanya sambungan (`ambilCatatan`, kartu form sesudah kartu Catatan, `tandaiDibaca`, pengosongan isian, kelas `kartu--catatan`, dua isian alat `info` dan `render`). Baris lama tidak dihapus.
- `public/index.html`: `orderownercatatan.js` dimuat sebelum `orderowner.js`.
- `public/sw.js` (OK ketua): `chata-v16`, `orderownercatatan.js` masuk daftar cache. Berkas JS baru, `index.html`, dan `sw.js` harus naik satu commit.
- `public/style.css`: blok baru di paling bawah (pemisah antar catatan, garis pemisah form). Aturan lama tidak disentuh.
- `docs/notifikasi.md`: blok catatan tanda "Catatan baru".

**Perilaku:**

- **Customer** (Pesanan Saya, detail): kartu "Catatan" (penulis, waktu WIB, isi) dan form tambah catatan **hanya saat Menunggu atau Disetujui** (O12). Setelah sukses detail dimuat ulang dari server dan muncul "Catatan terkirim.". Kolom kosong ditolak di layar ("Tulis catatannya dulu.") tanpa panggilan server.
- **Owner** (Order Masuk dan Semua Order, detail): daftar Catatan (baca saja, sudah ada dari ORD.06) dan kartu terpisah "Tambah catatan" **hanya saat Menunggu atau Disetujui**. Galat dari server (mis. 409) tampil di atas dan menggulung layar, sama seperti aksi owner lain. Kolom kosong: galat tampil di dalam kartu (perbaikan, belum dites).
- **Penjaga:** tidak berubah (catatan baca-saja, O12).
- `catatan_dibaca` dipanggil saat detail customer dan owner tampil, **hanya bila isi catatan berubah sejak terakhir ditandai** (kunci: id order, jumlah catatan, waktu catatan terakhir). Gagal diam-diam. Layar penjaga tidak memanggilnya.
- Isian yang belum terkirim bertahan saat layar digambar ulang; dikosongkan saat pindah order, kembali ke daftar, setelah terkirim (atau ditolak 409 atau 404), dan saat Keluar. Penanda sudah dibaca dikosongkan saat Keluar.

**Keputusan baru:**

- **Ketua:** opsi B (tanpa tanda "Catatan baru" di ORD.10). Alasan ketua: tanda tanpa push belum berguna di tahap ini, karena daftar hanya dimuat saat layar dibuka, kembali ke layar, atau Segarkan. Ketua juga OK mengubah `sw.js`, dan meminta blok catatan di `notifikasi.md` serta Handoff ini.
- Pilihan penulis (alasan belum tercatat): tanpa angka batas karakter di layar (batas ada di database dan tidak terbaca aplikasi, Handoff #4; server yang menolak dan pesannya ditampilkan); form owner di kartu terpisah (bukan di dalam kartu Catatan); form owner di berkas baru karena `orderowner.js` sudah panjang; label form owner "Catatan tampil ke customer pemilik order".

**Pertentangan dengan catatan lama (yang paling akhir menang):** langkah 10 di bagian 5 (ORD.10 "dan tanda 'Catatan baru' di kartu order") tidak berlaku lagi untuk bagian tanda; tanda ada di NTF.07. Komentar kepala `pesanan.js` ("Catatan berlapis belum ditampilkan di sini") dan `orderowner.js` ("hanya DITAMPILKAN") tidak berlaku lagi; keterangannya ditambahkan di kode, barisnya tidak dihapus. Handoff #17 dan #19 ("ORD.10 butuh perubahan fungsi SQL") tidak berlaku untuk versi B.

**Terbukti** (akun dummy, lewat layar; bukti di chat, tidak disimpan): customer melihat kartu Catatan di order Menunggu, mengirim catatan, catatan tampil dengan penulis dan waktu WIB, kolom kosong ditolak dengan pesan di dalam kartu; owner melihat kartu "Tambah catatan", mengirim catatan, catatan tampil di daftar; customer menerima catatan owner; jarak dan pemisah kartu di layar customer.

**Masalah yang belum beres:**

- **Belum dites:** perbaikan galat kolom kosong owner (kolom kosong menampilkan galat di dalam kartu, tanpa tulisan "Catatan terkirim." yang usang); form pada order **Disetujui** (customer dan owner); form **tidak ada** pada Diproses dan Selesai; 409 saat status berubah di layar; batas 10 catatan dan batas karakter lewat layar; HP Android.
- **Belum diverifikasi:** `catatan_dibaca` benar-benar menggeser penunjuk (cek dengan query baca-saja di SQL Editor). Teks catatan berisi tag HTML tampil sebagai teks biasa (**SEC-18**, sekarang bisa dites lewat layar). Tes lain dari Handoff #19 tidak berubah: catatan di order wakil (ORD.12), dua sesi bersamaan catatan vs "Mulai proses" (SEC-10, ORD.14); ulangi query cek 8 dan 9 sesudahnya. Baris SEC di sheet belum dicentang.
- Layar penjaga belum memakai kelas `kartu--catatan`, jadi catatan di sana masih tampil rapat (P2, satu baris di `orderpenjaga.js`).
- Kosmetik (P2): label form owner turun dua baris di HP; `PESAN_TIDAK_PASTI` di `orderowner.js` berbunyi "keputusan sudah tersimpan" dan dipakai semua aksi owner, termasuk catatan.
- `orderowner.js` (sekitar 1230 baris) dan `pesanan.js` (sekitar 935 baris) melewati patokan ~500 baris; memecahnya butuh penjelasan dampak dan "OK" ketua.
- Push catatan (O14) dan tanda "Catatan baru" belum ada (NTF.06 dan NTF.07). Penjaga memakai tanda atau tidak belum diputuskan.
- Order dummy #7 (Menunggu, Makan di warung) kini punya catatan dari customer dan owner. #25 masih penuh 10 dari 10 catatan. Order uji tidak bisa dihapus; dibersihkan di LNC.01.
- Butir terbuka Handoff #11 sampai #19 yang tidak disebut di atas tidak berubah.

**Saran giliran berikutnya:**

1. Pastikan perbaikan galat owner sudah di-commit dan di-push (pagar bagian 8), lalu tes kolom kosong di layar owner dan form di order Disetujui. Setelah itu ORD.10 bisa dicentang di sheet; tes yang tersisa digabung ke ORD.14.
2. Tes SEC-18 lewat layar (catatan berisi tag HTML harus tampil sebagai teks biasa) dan verifikasi `catatan_dibaca` lewat query baca-saja.
3. Lanjut **ORD.11** ⚠️ (pelanggan tanpa akun: aksi daftar, simpan, nonaktifkan; item "Pelanggan" di Home sudah disiapkan, lihat blok 2026-11-07), lalu ORD.12, ORD.13, dan ORD.14. Lampirkan `AGENTS.md` + `order.md` + `database.md` + `security.md` + `supabase/functions/kedai/index.ts` + berkas `kedai` yang relevan + migration `20261108_order.sql`. Aksi baru `kedai` ditaruh di berkas terpisah (`AGENTS.md` bagian 12).

### Handoff #21 | 2026-11-09 | [RAC]

**Tugas:** lanjutan Handoff #20: tes ORD.10 di layar owner, customer, dan penjaga, plus perbaikan layar loncat ke atas. **ORD.10 sudah dicentang di sheet.** Tidak ada perubahan SQL, migration, tabel, `kedai`, atau `sw.js`. Handoff ini melengkapi "Masalah yang belum beres" dan "Saran giliran berikutnya" di Handoff #20; selebihnya #20 tetap berlaku.

**Commit:** sudah di-push (pagar `AGENTS.md` bagian 8 lolos), hash: `26b5645`.

**Berkas:**

- `public/orderowner.js`: `renderDetail()` kini membungkus `gambarDetail()` (isi lama, hanya ganti nama) dan mengembalikan posisi gulung. Sebelumnya tiap aksi owner di bagian bawah detail menarik layar ke atas.
- `public/orderownercatatan.js`: kolom kosong memasang pesan galat langsung di kartu tanpa gambar ulang (`alat.render()` lama dikomentari).
- `AGENTS.md` bagian 12: blok bahan belajar layar loncat (penyebab, perbaikan, pencegahan).

**Keputusan baru:** tidak ada. Blok bahan belajar ditaruh di `AGENTS.md` (bukan `order.md`) atas permintaan penguji, supaya terbawa ke semua sesi.

**Terbukti** (akun dummy, lewat layar, HP Android; bukti di chat, tidak disimpan):

- Owner: kolom kosong menampilkan galat di dalam kartu tanpa layar loncat; Setuju, Tolak, Kembali ke daftar, tombol status maju, dan kirim catatan tidak loncat; form ada di order Disetujui, hilang di Diproses, muncul lagi saat dimundurkan.
- Customer: form di order Disetujui, catatan terkirim.
- Penjaga: catatan tampil baca-saja tanpa form (#25 dan #21).
- SEC-18: catatan berisi tag HTML tampil sebagai teks biasa di tiga layar.
- `catatan_dibaca`: query 9 (baca-saja), semua penunjuk sama dengan catatan terbaru, tidak ada yang lebih besar.

**Masalah yang belum beres:**

- Belum dites: 409 saat status berubah di layar, batas 10 catatan dan batas karakter lewat layar, Android penuh. Digabung ke ORD.14 bersama catatan di order wakil (ORD.12) dan dua sesi bersamaan (SEC-10); ulangi query cek 8 dan 9 sesudahnya. Baris SEC di sheet belum dicentang.
- Layar penjaga (`orderpenjaga.js`) belum dicek untuk pola layar loncat yang sama.
- Order #7 (hari antar Minggu 8 Nov) disetujui sesudah harinya lewat, jadi tidak tampil di Antrean penjaga (sesuai O22, bukan bug). Belum ada keputusan untuk kasus ini.
- P2 kosmetik tidak berubah: label form owner turun dua baris di HP, catatan di layar penjaga masih rapat, `PESAN_TIDAK_PASTI` memakai kalimat umum.
- Order dummy: #25 penuh 10 dari 10 catatan, #21 berisi catatan bertag HTML, #7 kini Disetujui dengan 4 catatan. Dibersihkan di LNC.01.
- Push catatan dan tanda "Catatan baru" (NTF.06, NTF.07) belum ada.

**Saran giliran berikutnya:** **ORD.11** ⚠️ (pelanggan tanpa akun: aksi daftar, simpan, nonaktifkan), lalu ORD.12 sampai ORD.14. Lampirkan `AGENTS.md` + `order.md` + `database.md` + `security.md` + `supabase/functions/kedai/index.ts` + berkas `kedai` yang relevan + migration `20261108_order.sql`. Aksi baru `kedai` ditaruh di berkas terpisah (`AGENTS.md` bagian 12).

### Handoff #22 | 2026-11-09 | KETUA

**Tugas:** ORD.11 ⚠️ (pelanggan tanpa akun, sisi server) **kode selesai dan ter-deploy di production; tes aksi baru belum dimulai.** Belum dicentang di sheet. **Belum di-commit dan di-push.**

**Berkas:**

- `supabase/migrations/20261109_05_pelanggan_luar_fungsi.sql` (tiga fungsi SQL: `pelanggan_luar_daftar`, `pelanggan_luar_simpan`, `pelanggan_luar_nonaktif`), pembatal `20261109_05_pelanggan_luar_fungsi_batal.sql`, dan cek `supabase/templates/20261109_05_pelanggan_luar_fungsi_cek.sql`. Sudah dijalankan di SQL Editor dan cek 1 sampai 5 lulus (tiga fungsi `SECURITY DEFINER`, `search_path` kosong, `EXECUTE` hanya `service_role`; hak tabel tetap INSERT, SELECT, UPDATE tanpa DELETE; tidak ada fungsi yang menghapus baris; tabel masih kosong). Tabel dan data tidak berubah.
- `supabase/functions/kedai/pelanggan_luar.ts` (baru, pola sama dengan `catatan.ts`) dan `index.ts` (hanya tambahan: 32 baris, **0 baris lama dihapus**, dibuktikan dengan `diff` terhadap versi sebelumnya). Deploy `kedai --use-api` sukses (4 berkas terunggah), token CLI sudah dibersihkan (`[]`), logout dashboard Supabase dikonfirmasi.
- **Belum ter-commit:** keempat berkas baru, `index.ts`, dan `docs/order.md` (edit ketua soal nama PIC, bukan dari AI). Pagar `AGENTS.md` bagian 8 wajib lolos sebelum push; cek `git status` dulu supaya tidak ada berkas nyasar.

**Kontrak untuk layar (ORD.13):** balasan `{ status, data }` dari `panggilKedai`; galat `data = { ok: false, pesan }` (tampilkan `pesan` lewat `textContent`). Semua aksi **hanya owner** (customer dan penjaga 403).

- `pelanggan_luar_daftar` isian `{ semua? }` (`true` = ikut yang nonaktif, bawaan `false`). Sukses `{ ok: true, daftar: [ { id, nama, keterangan, nomor_wa, alamat_antar, aktif } ] }`, urut abjad nama (yang aktif di atas bila ikut nonaktif), tanpa pembagian halaman. Pencarian dilakukan di layar, bukan di server.
- `pelanggan_luar_simpan` isian `{ id?, nama, keterangan, nomor_wa, alamat_antar, aktifkan? }`. `id` kosong = tambah baru; terisi = ubah. **`keterangan`, `nomor_wa`, `alamat_antar` wajib ada di isian** (teks atau `null`; kosong = dikosongkan); tidak dikirim = 400. `aktifkan: true` mengaktifkan lagi yang nonaktif (diabaikan saat tambah baru). Sukses `{ ok: true, pelanggan: { id, nama, keterangan, nomor_wa, alamat_antar, aktif } }`.
- `pelanggan_luar_nonaktif` isian `{ id }`. Sukses `{ ok: true, pelanggan: {...} }`; pelanggan yang sudah nonaktif: sukses tanpa perubahan.
- Galat: 400 (nama 3 sampai 30; keterangan 3 sampai 100 atau kosong; nomor WA tidak valid; alamat 10 sampai 200 atau kosong; data rusak), 403 (bukan owner, akun nonaktif), 404 (pelanggan tidak ditemukan), 409 (`pelanggan_sudah_ada`: nama dan keterangan sama persis dengan pelanggan aktif lain, huruf besar-kecil dianggap sama).

**Keputusan baru (ketua):**

- **Opsi A:** ORD.11 hanya server. Layar daftar, layar Kelola Pelanggan, dan pengaktifan item **Pelanggan** di Home dikerjakan di **ORD.13** bersama wizard.
- **Boleh diaktifkan lagi** lewat `pelanggan_luar_simpan` dengan `aktifkan: true` (pola sama dengan `menu_simpan`). Alasan ketua: nonaktif dipakai saat pelanggan yang tadinya dicatat owner akhirnya mendaftar akun sendiri; salah nonaktif atau pelanggan kembali minta dicatat tidak boleh buntu. Pelanggan tanpa akun **tidak digabung otomatis** dengan akun baru (O16 tetap).
- **Satu alamat antar per pelanggan** (sesuai `database.md`). Banyak alamat per pelanggan ditunda; kandidat `bonus.md`, dilihat dulu apakah sering dibutuhkan di pemakaian nyata.
- **Nama kembar boleh;** yang ditolak hanya nama dan keterangan yang sama persis di antara pelanggan aktif (berlaku juga saat mengaktifkan lagi).
- **Pilihan penulis, disetujui ketua lewat OK** (alasan belum tercatat): (1) nomor WA: spasi dan tanda hubung dibuang dulu, jadi sedikit lebih longgar daripada `buat_profil`; (2) `pelanggan_luar_simpan` mengembalikan baris pelanggannya (termasuk id) supaya wizard "tambah baru di tempat" langsung memakainya; (3) penulisan diserialkan dengan `pg_advisory_xact_lock` supaya dua owner yang menyimpan nama sama bersamaan tidak sama-sama lolos; (4) `pelanggan_luar_nonaktif` pada yang sudah nonaktif tidak galat.

**Pertentangan dengan catatan lama (yang paling akhir menang):** blok `2026-11-07: Pintu "Pelanggan tanpa akun" ada di Home (owner)` menyebut ORD.11 "tinggal mengaktifkannya dan membuat layar daftarnya". **Tidak berlaku lagi:** keduanya digeser ke ORD.13. Item Pelanggan di Home tetap "Segera" sampai ORD.13 selesai. Selain itu, tabel aksi di `database.md` hanya menyebut daftar, simpan, nonaktif; "aktifkan lagi" adalah tambahan dari keputusan di atas.

**Terbukti:** deploy `kedai` tidak merusak aksi lama (layar owner Semua Order: daftar dan detail order tampil normal). Cek SQL 1 sampai 5 lulus (di atas).

**Masalah yang belum beres:**

- **Tes aksi baru lewat konsol belum dimulai.** Tertahan karena bentuk pemanggilan `window.KedaiAkun.panggilKedai` (urutan isian) belum ada di chat. Dapatkan lewat `console.log(String(window.KedaiAkun.panggilKedai))` di konsol (login owner dummy), atau tempel satu contoh perintah dari tes ORD.07.
- **Belum dicentang di sheet** dan **belum di-commit atau di-push.**
- Query cek 4 dan 5 di `20261109_05_pelanggan_luar_fungsi_cek.sql` diulang sesudah tes (butuh login dashboard Supabase, lalu logout).
- Logout GitHub di Mac bersama dicek saat commit dan push.
- Order wakil (ORD.12) belum ada: pastikan nanti menolak pelanggan **nonaktif** dan menyalin nama, WA, dan alamat pelanggan ke order.
- Butir terbuka Handoff #11 sampai #21 tidak berubah.

**Saran giliran berikutnya:**

1. **Selesaikan tes ORD.11 lewat konsol** (akun dummy; bukti diperiksa di chat, tidak disimpan): tambah hanya dengan nama; tambah lengkap (nomor `0812 3456 7890` tersimpan `62...`); daftar; ubah; nonaktifkan lalu `semua: true`; aktifkan lagi; nonaktifkan dua kali; batas panjang (nama 2 dan 31, keterangan 2 dan 101, alamat 9 dan 201); nomor WA salah; kolom tidak dikirim = 400; id rusak = 400; id tidak ada = 404; nama kembar = 409 (termasuk beda huruf besar-kecil) tetapi nama sama dengan keterangan beda boleh; aktifkan lagi yang membuat kembar = 409; isian palsu (`aktif`, `dibuat_oleh`) diabaikan; dua simpan bersamaan nama sama: tepat satu lolos; customer dan penjaga memanggil ketiga aksi = 403 (SEC-07, SEC-14). Lalu ulangi query cek 4 dan 5.
2. **Commit dan push** (satu commit: tiga SQL, `pelanggan_luar.ts`, `index.ts`, dan `docs/order.md`; pagar bagian 8), lalu ORD.11 bisa dicentang di sheet.
3. Lanjut **ORD.12** ⚠️ (`order_buat_wakil`), lalu **ORD.13** dan **ORD.14**. Lampirkan `AGENTS.md` + `order.md` + `database.md` + `security.md` + `supabase/functions/kedai/index.ts` (versi terbaru) + `pelanggan_luar.ts` + berkas JS yang memuat `window.KedaiAkun` (nama berkas belum dipastikan; minta ke user) + migration `20261108_order.sql` dan `20261109_05_pelanggan_luar_fungsi.sql`. Aksi baru `kedai` ditaruh di berkas terpisah (`AGENTS.md` bagian 12).
4. **Pesan ketua untuk ORD.13:** kemudahan layar bagi owner yang tidak terbiasa aplikasi (nyokap ketua, pemakai utama wizard dan Kelola Pelanggan di fase awal) harus dirancang sebaik mungkin supaya mereka kerasan memakainya; itu bukan urusan ORD.11.

### Handoff #23 | 2026-11-10 | FREN

**Tugas:** ORD.11 ⚠️ (pelanggan tanpa akun, sisi server) **selesai**: tes lulus, sudah di-commit dan di-push, dicentang di sheet (10 Nov 2026). Handoff ini menggantikan "Masalah yang belum beres" dan "Saran giliran berikutnya" di Handoff #22; selebihnya Handoff #22 tetap berlaku. Tidak ada kode yang diubah di sesi ini.

**Commit** (pagar `AGENTS.md` bagian 8 lolos; `index.ts` 32 baris tambah, 0 hapus): `eb5548e` ORD.11 (tiga SQL, `pelanggan_luar.ts`, `index.ts`, `docs/order.md`); `ef8e009` md edit ketua (`AGENTS.md`, `docs/bonus.md`, `docs/desain.md`, `docs/gim.md`, bukan dari AI).

**Terbukti** (konsol, akun dummy; bukti di chat, tidak disimpan):

- Tambah hanya dengan nama; tambah lengkap (nomor `0812 3456 7890` tersimpan `6281234567890`); daftar urut abjad; ubah (id tetap); nonaktifkan; daftar biasa hanya yang aktif, `semua: true` memuat keduanya; aktifkan lagi; nonaktifkan dua kali tanpa galat.
- Ditolak 400: nama 2 dan 31, keterangan 2 dan 101, alamat 9 dan 201, nomor WA salah, tiga kolom tidak dikirim, id rusak. 404: id tidak ada.
- Nama kembar 409 (termasuk beda huruf besar-kecil); nama sama dengan keterangan beda lolos; aktifkan lagi yang membuat kembar 409.
- `aktif: false` palsu diabaikan; dua simpan bersamaan dengan nama sama: tepat satu lolos, satu 409.
- Customer dan penjaga memanggil ketiga aksi: 403 "Aksi ini hanya untuk owner."
- Cek SQL 4: total 4, aktif 2; cek 5: 0 baris (tidak ada kembar aktif). Cek 1 sampai 3 sudah lulus di Handoff #22.

**Keputusan baru:** tidak ada.

**Masalah yang belum beres:**

- Isian palsu `dibuat_oleh` belum terbukti (balasan server tidak memuatnya); `aktif` palsu sudah terbukti. Bisa dicek lewat query baca-saja di SQL Editor bila perlu.
- Baris SEC di sheet belum dicentang; jadwalnya setelah ORD.14. Bukti sebagian untuk ORD.11: tiga aksi dibalas 403 untuk customer dan penjaga (SEC-07, SEC-14).
- Layar daftar, layar Kelola Pelanggan, dan pengaktifan item **Pelanggan** di Home belum ada (digeser ke ORD.13, Handoff #22); item tetap "Segera".
- ORD.12 harus menolak pelanggan **nonaktif** dan menyalin nama, WA, dan alamat pelanggan ke order.
- Data dummy `pelanggan_luar` (4 baris, tidak bisa dihapus, dibersihkan di LNC.01): "Dummy Satu Ubah" (aktif, keterangan "Anak dummy"), "Dummy Dua" (nonaktif), "Dummy Satu Ubah" kedua (nonaktif, keterangan "Anak dummy"), "Dummy Kembar" (aktif).
- Logout dashboard Supabase & GitHub sudah dikonfirmasi.
- Pesan ketua untuk ORD.13 tetap: layar wizard dan Kelola Pelanggan harus mudah bagi owner yang tidak terbiasa aplikasi.
- Butir terbuka Handoff #11 sampai #22 yang tidak disebut di atas tidak berubah.

**Saran giliran berikutnya:**

1. **ORD.12** ⚠️ (`order_buat_wakil`: atomik, langsung Disetujui, metode bayar, penanda pembuat), **sesi ketua**: butuh penjelasan dampak dan "OK" ketua. Lampirkan `AGENTS.md` + `order.md` + `database.md` + `security.md` + `supabase/functions/kedai/index.ts` + `pelanggan_luar.ts` + `catatan.ts` + migration `20261108_order.sql`, `20261108_02_order_fungsi.sql`, dan `20261109_05_pelanggan_luar_fungsi.sql`. Aksi baru `kedai` ditaruh di berkas terpisah (`AGENTS.md` bagian 12).
2. Lalu **ORD.13** (wizard dan Kelola Pelanggan) dan **ORD.14** (sesi tes order).

<!-- Berkas tujuan: docs/order.md, tempel PALING BAWAH bagian 9 (di bawah Handoff #23). Append-only. -->

### Handoff #24 | 2026-11-10 | KETUA

**Tugas:** ORD.12 ⚠️ (`order_buat_wakil`, sisi server): SQL sudah dijalankan dan lulus cek, aksi `kedai` sudah ter-deploy di production, **tes aksi baru baru separuh jalan** (lihat "Terbukti" dan "Sisa tes"). **Belum di-commit dan di-push. Belum dicentang di sheet.** Handoff ini tidak mengubah Handoff #23 kecuali bagian ORD.12 (yang di #23 disebut "harus menolak pelanggan nonaktif dan menyalin nama, WA, alamat": sudah dikerjakan di fungsi).

**Berkas (semua baru kecuali `index.ts`; belum ter-commit):**

- `supabase/migrations/20261110_06_order_wakil_fungsi.sql` (fungsi `public.order_buat_wakil(uuid, uuid, text, text, text, text, jsonb, text)`), pembatal `_batal.sql`, cek `supabase/templates/20261110_06_order_wakil_fungsi_cek.sql`. Sudah dijalankan di SQL Editor; cek 1 sampai 4 lulus (SECURITY DEFINER, `search_path` kosong, EXECUTE hanya `service_role`, hak tabel tidak berubah dan tanpa DELETE). Cek 5 (order wakil) saat itu 0 baris, **diulang sesudah tes**.
- `supabase/functions/kedai/order_wakil.ts` (baru, `buatAksiOrderWakil(alat)`, pola sama dengan `pelanggan_luar.ts`) dan `index.ts` (tambahan saja: 26 baris, **0 baris lama dihapus**, dibuktikan `git diff --stat`: `26 insertions(+)`). Deploy `kedai --use-api` sukses (5 berkas terunggah), token CLI sudah dibersihkan (`[]`). Dashboard Supabase sudah logout sebelum deploy.
- Pagar `AGENTS.md` bagian 8: `git status --short` bersih selain berkas ORD.12; lanjut cek folder, `git remote -v`, dan email commit saat push.

**Kontrak untuk layar (ORD.13):** `panggilKedai("order_buat_wakil", isian)` mengembalikan `{ status, data }`; galat `data = { ok: false, pesan }` (tampilkan `pesan` lewat `textContent`). **Hanya owner** (customer dan penjaga 403).

- Isian: `{ pelanggan_id, tipe, alamat?, hari, jam, item: [{ menu_id, jumlah, opsi_ids? }], metode }`. `hari` persis "Hari ini" atau "Besok"; `jam` "HH:MM"; `metode` Transfer, Tunai, atau QRIS. Isian lain (harga, total, status, pemutus, `dibuat_oleh`) diabaikan.
- Sukses: `{ ok: true, order: { id, nomor, status: "Disetujui", total, hari_target, jam_permintaan, metode_bayar } }`.
- **Alamat (tipe Diantar):** layar menampilkan alamat tersimpan pelanggan (dari `pelanggan_luar_daftar`) sebagai bawaan. Bila `alamat` dikirim, itu yang dipakai **untuk order ini saja**; bila tidak dikirim, server memakai alamat tersimpan; bila tidak ada keduanya: 400 "Alamat antar wajib diisi." Jadi layar **wajib meminta alamat bila pelanggan belum punya alamat tersimpan**. Alamat 10 sampai 200 karakter (dipangkas; spasi saja dianggap tidak dikirim). Tipe Diambil dan Makan di warung: alamat dikirim pun diabaikan.
- Galat: 400 (metode, hari, jam, tipe, item, alamat wajib atau tidak valid, data rusak), 403 (bukan owner, akun nonaktif), 404 (pelanggan atau menu tidak ditemukan), 409 (pelanggan nonaktif, menu habis atau nonaktif, pilihan menu berubah, batas item atau jumlah).
- Tanpa catatan awal (wizard tidak punya isiannya). Tanpa push (NTF). Tanpa penahan kirim ganda: tombol Simpan wizard wajib dikunci di layar.

**Keputusan baru (ketua):**

- **Alamat:** alamat yang sudah ada di server dipakai sebagai bawaan; di layar baru wajib diisi bila server tidak punya. Owner boleh menimpa alamat di wizard, **berlaku untuk order ini saja**, alamat tersimpan pelanggan tidak berubah (diubah lewat `pelanggan_luar_simpan` di Kelola Pelanggan). Sejalan dengan wizard langkah 3 di bagian 4, jadi **tidak ada pertentangan** dengan catatan lama.
- **Pilihan penulis, disetujui ketua lewat "gas"** (alasan belum tercatat): (1) tanpa catatan awal; (2) riwayat satu baris (status asal kosong, tujuan Disetujui, keterangan "Order wakil. Metode bayar: <metode>"); (3) yang disalin dari pelanggan hanya nama, nomor WA, dan alamat, **bukan keterangan** (tabel `order` belum punya kolom keterangan); (4) baris pelanggan dikunci `FOR SHARE` selama transaksi, jadi nonaktifkan yang bersamaan menunggu; (5) tanpa penahan kirim ganda; (6) `bacaItemKiriman` dan `PETA_GALAT_ORDER` dari `index.ts` dipakai ulang lewat alat bantu (tidak ditulis ulang).

**Terbukti** (konsol, akun owner dummy; bukti di chat, tidak disimpan):

- Sesudah deploy, `menu_daftar` dan `pelanggan_luar_daftar` masih 200.
- Sukses Diantar tanpa alamat dikirim: alamat disalin dari alamat tersimpan; total 35000 dari harga server (isian palsu `total: 1`, harga item palsu, `status: "Selesai"`, `pemutus` dan `dibuat_oleh` "palsu" **diabaikan**); status Disetujui; pemutus dan dibuat oleh = nama owner; alias alamat kosong; pilihan bawaan "Level pedas: Tidak pedas" tersalin; satu baris riwayat.
- Alamat ditimpa, hari Besok, QRIS: order memakai alamat timpaan; alamat tersimpan pelanggan **tetap** (dibaca ulang lewat `pelanggan_luar_daftar`). Hari dihitung server (WIB).

**Sisa tes (urutan yang disarankan):**

1. **Enam kasus gagal alamat dan pelanggan** (perintah sudah diberikan di chat, hasil belum ditempel): pelanggan nonaktif 409; id tidak ada 404; Diantar tanpa alamat pada pelanggan tanpa alamat tersimpan 400 "Alamat antar wajib diisi."; alamat 9 dan 201 karakter 400; alamat spasi saja 400 "Alamat antar wajib diisi." Tidak satu pun boleh membuat order baru.
2. Metode kosong atau salah (huruf kecil `tunai`) 400; hari atau jam salah 400; tipe salah 400; item kosong 400; menu habis 409 (set Habis lewat `menu_stok`, kembalikan sesudahnya); jumlah di atas batas (10) 409; Diambil dengan alamat dikirim: `isi_alamat` kosong (diabaikan).
3. **Customer dan penjaga** memanggil `order_buat_wakil`: 403 "Aksi ini hanya untuk owner." (SEC-07, SEC-08, SEC-13).
4. Order wakil tampil di **Antrean penjaga** (hanya hari ini dan besok, O22) dan di Semua Order owner; owner **menambah catatan** di order wakil lewat `catatan_tambah` (tes yang tertunda dari Handoff #19 sampai #21).
5. Ulangi **cek SQL 5** (login dashboard, lalu logout): tiap baris `tanpa_akun` = true, `pemutus_sama_pembuat` = true, status Disetujui ke atas, metode terisi.
6. Pastikan layar **Semua Order** owner masih normal sesudah deploy (hasilnya belum dilaporkan).
7. **Commit dan push** (satu commit: `index.ts`, `order_wakil.ts`, tiga SQL, `docs/order.md`; pagar bagian 8), lalu ORD.12 bisa dicentang di sheet.

**Masalah yang belum beres:**

- Tes di atas belum selesai; belum commit dan push; ORD.12 dan baris SEC (SEC-07, SEC-08, SEC-13) belum dicentang.
- **Data dummy baru** (tidak bisa dihapus, dibersihkan di LNC.01): order **#30** (Dummy Kembar, Diantar, Hari ini 10 Nov, Tunai, 35000) dan **#31** (Dummy Kembar, Diantar, Besok 11 Nov, QRIS, 12000, alamat timpaan). **Dummy Kembar kini punya alamat tersimpan** ("Jl. Dummy No. 1, Kota Dummy"); Handoff #23 mencatatnya tanpa alamat. Order #30 hari antarnya 10 Nov, jadi tes Antrean penjaga paling mudah hari ini; sesudahnya buat order baru "Hari ini".
- **Keterangan pelanggan tidak tersalin ke order:** dua pelanggan bernama sama dengan keterangan beda tampil sama di order. Butir untuk ORD.13 atau `bonus.md`; menambah kolom di tabel `order` butuh penjelasan dampak dan "OK".
- **Blok catatan `database.md`** (fungsi `order_buat_wakil`, kode galat baru `pelanggan_tidak_aktif`, `alamat_wajib` dan `alamat_tidak_valid` di aksi baru, `metode_tidak_valid`) **belum ditempel**; tanya ketua dulu (aturan 7).
- Butir terbuka Handoff #11 sampai #23 yang tidak disebut di atas tidak berubah.

**Data dummy untuk tes (semuanya dummy, id boleh dipakai di konsol):**

- Pelanggan: Dummy Kembar `8e2ff764-4c13-4348-99af-16bfc93a7d30` (aktif, **beralamat**); Dummy Satu Ubah `b0d8076b-79ca-4b25-82e8-e1f486cb705a` (aktif, **tanpa alamat**); Dummy Dua `d7da24fd-525d-4aca-9692-acd4df303ce4` (nonaktif); Dummy Satu Ubah kedua `1ea99f38-88b0-49d5-8274-3973fefe9518` (nonaktif).
- Menu: ayam karage `e013e969-c16d-4847-bbe9-74a864c578ed` (15000, grup Level pedas), Ayam Katsu `41b3fc91-4f9e-4314-bdc6-41432d14b2aa` (12000), es teh manis `35887069-209b-4663-99c6-b2cbb20dbd48` (5000), menu tanpa gambar `86c7addf-9548-4329-998f-84e61998ec6b` (1000).
- Konsol: `window.KedaiAkun.panggilKedai(aksi, data)` mengembalikan `{ status, data }`. Bungkus perintah tes dalam fungsi `(async () => { ... })()` supaya `const` tidak bentrok saat dijalankan berulang.

**Saran giliran berikutnya:**

1. **Lanjutkan tes ORD.12** dari "Sisa tes" nomor 1 (sesi ketua atau PIC lain yang punya akun owner, penjaga, dan customer dummy). Lampirkan `AGENTS.md` + `order.md` (dengan Handoff #24) + `database.md` + `security.md` + `supabase/functions/kedai/index.ts` + `order_wakil.ts` + `pelanggan_luar.ts` + `20261110_06_order_wakil_fungsi.sql` dan `_cek.sql`. Tes tidak mengubah kode kecuali ada temuan.
2. Sesudah tes lulus: commit dan push, centang ORD.12, lalu **ORD.13** (wizard 5 langkah dan layar Kelola Pelanggan, kontrak di atas; **pesan ketua tetap**: mudah bagi owner yang tidak terbiasa aplikasi) dan **ORD.14** (sesi tes order).

### Handoff #25 | 2026-11-10 | KETUA

**Tugas:** ORD.12 ⚠️ (`order_buat_wakil`, sisi server) **selesai**: semua sisa tes lulus, sudah di-commit dan di-push (`3ae033d`; pagar `AGENTS.md` bagian 8 lolos: folder ChATA, remote `kedaichata/kedai-chata`, email noreply milik ketua), dan dicentang di sheet. Handoff ini menggantikan "Sisa tes", "Masalah yang belum beres", dan "Saran giliran berikutnya" di Handoff #24; selebihnya Handoff #24 (termasuk **kontrak untuk layar**) tetap berlaku.

**Berkas:** tidak ada yang berubah di sesi ini selain yang ter-commit: `supabase/functions/kedai/order_wakil.ts` (baru), `supabase/functions/kedai/index.ts` (26 baris tambah, **0 dihapus**), tiga SQL `20261110_06_order_wakil_fungsi` (migration, pembatal, cek), dan `docs/order.md`. Blok catatan `database.md` disiapkan di sesi ini dan ditempel ketua terpisah.

**Terbukti** (konsol dan layar, akun dummy; bukti di chat, tidak disimpan): enam kasus pelanggan dan alamat (nonaktif 409, id tidak ada 404, Diantar tanpa alamat 400, alamat 9 dan 201 karakter 400, alamat spasi 400); tujuh isian salah (metode kosong dan huruf kecil, hari, jam, tipe, item kosong semuanya 400; jumlah 11 = 409); Diambil dengan alamat dikirim: order sukses dan alamat diabaikan; customer dan penjaga memanggil = 403 "Aksi ini hanya untuk owner."; menu Habis = 409 tanpa membuat order; order wakil tampil di Antrean penjaga (Hari ini lalu Besok, O22); owner menambah catatan di order wakil (penulis dari server, isian palsu diabaikan); cek SQL 5: #30, #31, #32 semuanya `tanpa_akun` dan `pemutus_sama_pembuat` true; layar Semua Order dan detail order owner normal sesudah deploy. Tidak ada order yang kebentuk dari kasus gagal (nomor lanjut #32 tanpa loncat).

**Keputusan baru:**

- **Ketua (10 Nov): ORD.13 dikerjakan adik ketua.** Alasan ketua: fungsi order wakil adalah **inti peralihan owner dari kebiasaan memakai WA ke aplikasi ini**. Kalau wizard terasa lebih ribet daripada mengetik di WA, owner kembali ke WA dan tujuan proyek (merapikan catatan order) tidak tercapai. Karena itu wizard harus dibuat **seintuitif mungkin**, lebih penting daripada fitur tambahan.
- **Ketua (10 Nov): jam bawaan wizard = 11:00.** Mengikuti layar customer (Handoff #5): tipe **Diantar** terisi 11:00 dan owner tetap bisa mengubahnya; **Diambil dan Makan di warung kosong dan wajib diisi**; 11:00 dikosongkan lagi saat tipe pindah ke Diambil atau Makan di warung **selama jam belum disentuh**, dan jam yang sudah diubah owner tidak pernah ditimpa. Alasan belum tercatat. Dikerjakan di frontend saja; server tetap menerima jam apa pun (O2). Angka 11:00 ditulis di kode seperti `JAM_BAWAAN_ANTAR` di `pesan.js` (pengecualian "angka di database" yang sama, Handoff #5); pakai ulang nilai itu bila bisa, atau tulis satu konstanta dan catat. Bila maksud ketua semua tipe terisi 11:00, ubah blok ini.
- Pilihan penulis, alasan belum tercatat: tidak ada keputusan teknis lain di sesi ini.

**Pesan untuk ORD.13 (wizard 5 langkah dan Kelola Pelanggan):**

- **Pemakai sebenarnya:** owner yang tidak terbiasa memakai aplikasi (Handoff #22), sering mengisi dengan **satu tangan, di HP, sambil mengerjakan hal lain**. Ukuran berhasil: owner bisa membuat satu order wakil **tanpa dipandu siapa pun**.
- **Pegangan** (diturunkan dari keputusan yang sudah ada, bukan keputusan baru): satu layar satu tujuan (`order.md` bagian 4); tombol besar dan mobile-first (`AGENTS.md` bagian 3); bahasa sehari-hari, urutan dan istilah sedekat mungkin dengan cara owner menulis pesanan di WA (siapa, pesan apa, kapan, bayar apa); alamat tersimpan pelanggan muncul sebagai bawaan dan **hanya diminta bila pelanggan belum punya** (Handoff #24); pelanggan baru bisa ditambah **di tempat** tanpa keluar dari wizard (langkah 1, bagian 4); pencarian pelanggan dilakukan di layar, bukan di server (Handoff #22).
- **Saran penulis (bukan keputusan, adik ketua dan ketua boleh mengubah):** (1) langkah 1 menampilkan **keterangan** pelanggan di samping nama, karena nama kembar boleh dan keterangan tidak tersalin ke order (lihat "Masalah yang belum beres"); (2) pesan galat server tampil apa adanya lewat `textContent` dan **tidak menghapus isian** langkah-langkah sebelumnya; (3) tombol Simpan **dikunci** sejak ditekan sampai balasan datang, karena server tidak punya penahan kirim ganda (Handoff #24); (4) sesudah sukses, tampilkan **nomor order yang jelas** dan jalan keluar yang mudah (kembali ke Order Masuk atau buat order lagi); (5) tidak ada pilihan atau isian yang tidak dibutuhkan fungsi (tanpa catatan awal, tanpa harga).
- **Uji bersama:** tes ORD.13 sebaiknya meminta **owner yang paling tidak terbiasa aplikasi** mencoba tanpa penjelasan, dan hasilnya (di mana ia berhenti atau bingung) dicatat sebagai bahan perbaikan. Ini saran penulis.
- Layar baru wajib mengikuti pagar yang sudah ada: berkas JS baru ditaruh terpisah (patokan ~500 baris) dan **didaftarkan di cache `sw.js`** (butuh "OK" ketua, `AGENTS.md` bagian 7); item **Pelanggan** di Home diaktifkan, dan wizard tetap di tab Buat Order (blok `2026-11-07` di bagian ini). Perubahan di server (misalnya menyalin keterangan pelanggan ke order) butuh penjelasan dampak dan "OK" ketua; bila yang bertugas bukan ketua, ringkasan bisa diteruskan lewat WA (`AGENTS.md` aturan 12).

**Masalah yang belum beres:**

- **Keterangan pelanggan tidak tersalin ke order** (tabel `order` belum punya kolom keterangan): dua pelanggan bernama sama dengan keterangan beda tampil sama di order. Butir baru untuk sheet: "Salin keterangan pelanggan ke order wakil". Kolom baru butuh "OK" ketua.
- Baris SEC (SEC-07, SEC-08, SEC-13 untuk `order_buat_wakil`) belum dicentang; jadwalnya setelah ORD.14. Bukti 403 untuk customer dan penjaga sudah ada.
- Push untuk order wakil ke penjaga belum ada (NTF; O15). Pemesan tanpa akun memang tidak dapat push.
- Query cek 8 dan 9 (Handoff #19 dan #21) diulang sesudah semua tes ORD.14 selesai; butir ORD.14 lain tidak berubah.
- Logout GitHub di Mac bersama belum dikonfirmasi. Push memakai kunci SSH khusus proyek ini; pastikan tidak ada sesi GitHub terbuka di browser.
- **Data dummy:** order #30 (Diantar, Tunai, 35000), #31 (Diantar, Besok, QRIS, 12000, alamat timpaan), dan **#32** (Diambil, Hari ini 10 Nov, QRIS, 5000, ada satu catatan owner, id `9fb19795-e8b0-4346-b4fd-8c8c5b1acda0`) untuk Dummy Kembar; semuanya dibersihkan di LNC.01. Menu "menu tanpa gambar" sudah dikembalikan ke Tersedia. Data dummy lain di Handoff #24 tidak berubah (Dummy Kembar beralamat; Dummy Satu Ubah tanpa alamat, cocok untuk menguji dua cabang alamat di wizard).
- Butir terbuka Handoff #11 sampai #24 yang tidak disebut di sini tidak berubah.

**Saran giliran berikutnya:**

1. **ORD.13** (adik ketua): wizard 5 langkah dan layar Kelola Pelanggan, dengan kontrak `order_buat_wakil` di Handoff #24 dan kontrak `pelanggan_luar_*` di Handoff #22. Lampirkan `AGENTS.md` + `order.md` + `desain.md` + `home.md` + `akun.js` (tempat `window.KedaiAkun.panggilKedai`) + `index.html` + `kerangka.js` + `style.css` + `sw.js` + `orderowner.js` (sebagai contoh pola layar owner). AI meminta berkas lain di awal sesi bila perlu; tidak ada perubahan SQL atau `kedai` yang direncanakan.
2. Lalu **ORD.14** (sesi tes order): sisa tes ada di Handoff #11, #13, #14, #15, dan #21.

### 2026-11-10: Keterangan pelanggan sengaja tidak disalin ke order wakil

Keputusan ketua (10 Nov 2026, setelah Handoff #25). Alasan ketua: nomor WA dan alamat di order sudah cukup untuk membedakan pelanggan yang namanya sama, dan kejadian nama kembar jarang.

- **Keterangan pelanggan tidak disalin ke order.** Tabel `order` tidak ditambah kolom keterangan dan `order_buat_wakil` tidak diubah.
- **Menimpa Handoff #25 dan #24:** butir "Salin keterangan pelanggan ke order wakil" **tidak dibuat di sheet** dan bukan lagi masalah yang belum beres; keadaan sekarang disengaja.
- **Dibuka lagi bila** di pemakaian nyata warung nama kembar sering membingungkan (perubahan tabel dan fungsi butuh penjelasan dampak dan "OK" ketua). Saran penulis di Handoff #25 tetap berlaku: wizard langkah 1 menampilkan keterangan di samping nama pelanggan, karena keterangan masih tersimpan di daftar Pelanggan tanpa akun.

### Handoff #26 | 2026-11-10 | [FREN]

**Tugas:** ORD.13 (wizard 5 langkah Buat Order wakil dan layar Kelola Pelanggan) **kode selesai, belum dites**. Status saat handoff: pagar `AGENTS.md` bagian 8 baru dicek sebagian (folder, `git remote -v`, email commit lolos; `git status --short` belum dicek), **belum di-commit dan di-push**, **belum dicentang di sheet**. Tidak ada perubahan SQL, migration, atau `kedai`.

**Berkas** (satu commit):

- `public/orderwakil.js` (baru, `window.KedaiOrderWakil`: `tampil`, `reset`): wizard 5 langkah. Isi panel dibuat dari JS.
- `public/pelangganluar.js` (baru, `window.KedaiPelangganLuar`: `tampil`, `reset`, `buatForm`, `ambilDaftar`): layar Kelola Pelanggan, dan form pelanggan yang dipakai ulang wizard langkah 1.
- `public/kerangka.js`: tab Buat Order owner memakai panel `buatorder`; tab tersembunyi `pelanggan` (tanpa tombol di navigasi bawah, menandai Home sebagai aktif); aksi Home `pelanggan`; reset kedua layar saat Keluar. Baris lama dijadikan komentar.
- `public/index.html`: item Pelanggan di Home diganti tombol aktif (blok "Segera" lama disimpan di komentar), dua panel kosong `panel-buatorder` dan `panel-pelanggan`, dua tag `<script>` sebelum `kerangka.js`.
- `public/sw.js`: `chata-v17`, dua berkas JS baru masuk daftar cache. Berkas JS baru, `index.html`, dan `sw.js` harus naik **dalam satu commit**.
- `style.css` tidak diubah (memakai komponen yang ada).

**Perilaku:**

- **Wizard:** (1) Pemesan: cari di layar, atau Pelanggan baru di tempat (setelah simpan langsung terpilih); keterangan tampil di samping nama. (2) Menu: hanya menu aktif dan Tersedia; menu dengan grup pilihan dibuka lewat Pilih (bawaan terpilih), menu tanpa grup langsung Tambah; jumlah bisa dikurangi, ditambah, dihapus. (3) Pengiriman: tipe, Hari ini/Besok, jam, alamat. Alamat tersimpan jadi bawaan, bisa ditimpa untuk order ini saja; pelanggan tanpa alamat wajib mengisi (10 sampai 200 karakter). (4) Pembayaran: Transfer, Tunai, atau QRIS. (5) Ringkasan: tombol Ubah per bagian (Lanjut kembali ke ringkasan), lalu Simpan. Semua langkah dicek ulang saat Simpan.
- Yang dikirim ke `order_buat_wakil`: `pelanggan_id`, `tipe`, `alamat` (hanya Diantar dan bila diisi), `hari`, `jam`, `item` (`menu_id`, `jumlah`, `opsi_ids`), `metode`. Tanpa harga, total, status, atau catatan awal (Handoff #24).
- Tombol Simpan dikunci sejak ditekan sampai balasan datang. Jaringan putus setelah kirim: pesan menyuruh cek Semua Order dulu, jangan simpan ulang. Offline sejak awal: "Order belum tersimpan." Galat server tampil apa adanya dan **tidak menghapus isian**; 404 atau 409 memuat ulang daftar menu dan pelanggan.
- Layar selesai: nomor dan total dari server, lencana Disetujui, tombol Buat order lagi, dan pengingat bahwa belum ada notifikasi otomatis ke penjaga.
- **Kelola Pelanggan** (Home, item Pelanggan, owner): cari, Tambah, Ubah, Nonaktifkan (dengan konfirmasi), Aktifkan lagi (`pelanggan_luar_simpan` dengan `aktifkan: true`), tombol Tampilkan atau Sembunyikan yang nonaktif. Kontrak aksi di Handoff #22.
- Redraw menjaga posisi gulung (pelajaran `AGENTS.md` bagian 12). Isian wizard bertahan saat Segarkan; semua dikosongkan saat Keluar.

**Keputusan baru:**

- **Ketua (10 Nov):** OK perubahan `sw.js` (v17 dan daftar cache). OK `orderwakil.js` (sekitar 1500 baris) dan `pelangganluar.js` (sekitar 780 baris) melewati patokan ~500 baris, karena memang panjang; tidak perlu dipecah. Alasan lain belum tercatat.
- Jam bawaan wizard 11:00 untuk Diantar, ditulis di kode (`JAM_BAWAAN_ANTAR` di `orderwakil.js`), mengikuti keputusan ketua di Handoff #25.
- Pilihan penulis (alasan belum tercatat): Kelola Pelanggan berupa tab tersembunyi di `kerangka.js`, bukan layar terpisah di `akun.js` (supaya `akun.js` tidak disentuh); pencarian pelanggan di layar; dari ringkasan, Ubah lalu Lanjut kembali ke ringkasan.

**Terbuka dan belum diverifikasi:**

- **Asumsi `grup`:** wizard membaca grup pilihan menu dari `m.grup` di balasan `menu_daftar` untuk owner. Belum dipastikan balasan owner memuat `grup`. Cek: `window.KedaiAkun.panggilKedai("menu_daftar")` di konsol owner dummy. Bila tidak ada, menu bergrup terkirim dengan `opsi_ids` kosong, dan hasilnya bergantung pada server mengisi pilihan bawaan. Bila bermasalah, perbaikannya di wizard (atau di `kedai`, butuh "OK" ketua).
- **Belum dites sama sekali** (kode hanya lolos cek sintaks): wizard lengkap untuk tiga tipe; dua cabang alamat (Dummy Kembar beralamat, Dummy Satu Ubah tanpa alamat); pelanggan nonaktif tidak muncul; order tampil di Antrean penjaga dan Semua Order; tambah dan kurangi jumlah tanpa layar loncat; Kelola Pelanggan (tambah, ubah, nonaktif, aktifkan lagi, nama kembar 409); tidak ada data pelanggan tersisa setelah Keluar; HP Android dan mode offline; update `sw.js` muncul di HP.
- **Tes pemakai:** minta owner yang paling tidak terbiasa memakai aplikasi mencoba membuat satu order wakil tanpa dipandu, lalu catat di mana ia bingung (ukuran berhasil, Handoff #25).
- Penjaga belum dapat push untuk order wakil (NTF; O15). Data dummy tes ORD.13 akan menambah order dan pelanggan; dibersihkan di LNC.01.
- Butir terbuka Handoff #11 sampai #25 yang tidak disebut di sini tidak berubah.

**Saran giliran berikutnya:**

1. Selesaikan pagar `AGENTS.md` bagian 8 (`git status --short` harus hanya lima berkas di atas), commit dan push satu commit, lalu tes ORD.13 di HP dengan akun dummy, mulai dari cek `menu_daftar` owner. Setelah lulus, ORD.13 bisa dicentang di sheet.
2. Lalu **ORD.14** (sesi tes order); sisa tes ada di Handoff #11, #13, #14, #15, #21, dan #24.

### Handoff #27 | 2026-11-10 | [RAC]

**Tugas:** ORD.13 (wizard 5 langkah Buat Order wakil dan layar Kelola Pelanggan) **selesai**: tes lulus di desktop dan HP Android (termasuk offline dan update `sw.js` v17), sudah di-push, dicentang di sheet. Menggantikan "Terbuka dan belum diverifikasi" dan "Saran giliran berikutnya" di Handoff #26; selebihnya #26 tetap berlaku. Tidak ada perubahan SQL, migration, `kedai`, atau `sw.js` di sesi ini.

**Commit** (pagar `AGENTS.md` bagian 8 lolos): `b1a7e36` ORD.13 (enam berkas dari Handoff #26); `105c190` tombol Kembali dan Batalkan order di wizard (pesan commit salah tulis "ORD.11"; yang benar lanjutan ORD.13).

**Berkas yang diubah:** hanya `public/orderwakil.js` (sekitar 1603 baris; 74 baris tambah, 0 hapus).

**Keputusan baru:**

- **Wizard punya jalan keluar** (usul penulis, disetujui lewat "gas"; ditemukan saat tes HP: owner buntu di ringkasan, isian nyangkut sampai Keluar). Langkah 5 kini punya tombol **Kembali** (ke langkah 4). Langkah 2 sampai 5 punya tombol **Batalkan order** dengan kartu konfirmasi "Batalkan pesanan ini?" (Tidak / Ya, batalkan). Ya = semua isian dikosongkan, kembali ke langkah 1, tanpa panggilan server (order belum dibuat). Langkah 1 tanpa tombol itu. Tombol mati selama Simpan berjalan.
- Alasan lain belum tercatat.

**Pertentangan dengan catatan lama:** Handoff #26 ("isian wizard dikosongkan saat Keluar") kini juga berlaku lewat Batalkan order. Butir "layar penjaga belum dicek untuk layar loncat" (Handoff #21) **beres**.

**Terbukti** (akun dummy; bukti di chat, tidak disimpan):

- Balasan `menu_daftar` owner memuat `grup` (asumsi Handoff #26 benar).
- Wizard untuk tiga tipe dan tiga metode bayar: order sah dengan total dari server, pilihan menu tersalin, nomor order lanjut tanpa loncat, tampil di Semua Order, detail owner, dan Antrean penjaga sampai Selesai.
- Alamat: pelanggan tanpa alamat tersimpan wajib isi (9 karakter ditolak); pelanggan beralamat memakai alamat tersimpan sebagai bawaan; alamat timpaan berlaku untuk order itu saja dan alamat tersimpan tidak berubah.
- Jam bawaan 11:00 hanya Diantar; Diambil dan Makan di warung kosong dan wajib; kembali kosong saat tipe berpindah.
- Pelanggan nonaktif tidak muncul di langkah 1; Pelanggan baru di tempat langsung terpilih; Simpan ditekan dua kali cepat hanya membuat satu order.
- Kelola Pelanggan: tambah, ubah (nomor WA tersimpan berawalan 62), nonaktifkan dengan konfirmasi, aktifkan lagi, nama kembar ditolak server, validasi nama, nomor WA, dan alamat tampil di dekat kolom; kolom nama menahan ketikan di 30 karakter.
- Keluar mengosongkan daftar dan wizard.
- Catatan: kolom kosong ditolak tanpa layar loncat, owner menambah catatan di order wakil, catatan terkunci saat Diproses dan terbuka lagi bila dimundurkan.
- Layar penjaga: status maju (Diproses, Siap diambil, Selesai) tanpa layar loncat pada detail panjang; catatan baca-saja.
- Tombol Batalkan order: berfungsi di HP, tampilan OK, offline tetap ada peringatan.

**Masalah yang belum beres:**

- **Tes pemakai belum dilakukan** (ukuran berhasil dari ketua, Handoff #25): minta owner yang paling tidak terbiasa aplikasi membuat satu order wakil tanpa dipandu, lalu catat di mana ia bingung.
- Belum dites lewat wizard: tambah, kurangi, dan hapus jumlah menu tanpa layar loncat; hari **Besok**; Segarkan saat wizard terisi; order ber-pilihan menu non-bawaan di HP.
- Tombol Batalkan order memakai kelas `tombol--bahaya` (tebakan nama). Belum dicek tampil merah atau tidak; cuma urusan warna.
- Butir baru untuk sheet: "Wizard: tombol Kembali di ringkasan dan Batalkan order".
- Baris SEC (SEC-07, SEC-08, SEC-13 untuk `order_buat_wakil`, SEC-18, SEC-19) belum dicentang; jadwalnya setelah ORD.14.
- Push untuk order wakil ke penjaga belum ada (NTF; O15). Jam bawaan 11:00 ada di kode (`JAM_BAWAAN_ANTAR`).
- **Data dummy baru** (dibersihkan di LNC.01): order #33 (Selesai, Diambil, QRIS, 20000, 5 catatan), #34 (Diantar, Transfer, 20000, alamat timpaan), #35 (Diantar, Transfer, 15000, alamat timpaan), #36 (Makan di warung, Tunai, 15000), #37 (Diantar, Transfer, 5000), semuanya hari Selasa 10 Nov; #34 sampai #37 masih Disetujui. Pelanggan dummy baru: Dummy Tiga (aktif, WA dummy, tanpa alamat) dan Dummy Empat (aktif). Dummy Satu Ubah sudah dikembalikan ke nama aslinya.
- Butir terbuka Handoff #11 sampai #26 yang tidak disebut di sini tidak berubah.

**Saran giliran berikutnya:**

1. **Tes pemakai** wizard (di atas). Bila ia berhenti di langkah tertentu, catat sebagai bahan perbaikan.
2. **ORD.14** (sesi tes order, `order-test.md` dibuat di sesi tes): sisa tes ada di Handoff #11, #13, #14, #15, #21, dan #24 (SEC-10 dua sesi bersamaan, SEC-19 jam HP digeser, batal vs setuju bersamaan, ketuk dua kali tombol status, urutan daftar O22). Ulangi query cek 8 dan 9 sesudahnya, lalu centang baris SEC.

### Handoff #28 | 2026-11-10 | [AIK]

**Tugas:** ORD.14 (sesi tes order) **dimulai, belum selesai**. Sesi ini hanya tes tanpa Android (dua jendela, akun dummy, lewat konsol dan layar). **Tidak ada kode, SQL, atau `kedai` yang diubah.** Berkas baru: `docs/order-test.md` (kasus uji, tanpa hasil). Log status ada di `docs/pemetaan-test.md` bagian 5.

**Baris SEC yang sudah lengkap dan diingatkan untuk dicentang di sheet:** SEC-07, SEC-08, SEC-13, SEC-14 (teks barisnya sudah dicocokkan dengan sheet).

**Baris ORD.14 di sheet** sempat tampil **Selesai** (10 Nov). ORD.14 belum selesai: kembalikan ke Belum sampai semua butir di bawah beres.

**Terbukti** (bukti ditempel dan diperiksa di chat, tidak disimpan):

- **K1:** customer dan penjaga memanggil aksi owner-only = 403 (termasuk `menu_*` dan `order_alih_hari`); customer `order_batal` setelah Disetujui = 409 dan status tidak berubah; penjaga `order_batal` = 403; penjaga `order_detail` dengan id langsung pada order Menunggu, Ditolak, Dibatalkan = 404; penjaga membuka order wakil melihat salinan nama, WA, alamat tanpa id pelanggan, dan `pelanggan_luar_daftar` = 403.
- **K2:** customer Batal vs owner Setuju bersamaan, 4 kali, tepat satu menang, riwayat bersih; customer Batal vs owner Tolak, 1 kali, owner menang, customer mendapat pesan "sudah ditolak sebelumnya"; dua sesi `order_status` maju pada order yang sama: satu 200, satu 409, riwayat hanya satu baris maju.

**Keputusan baru:** tidak ada.

**Temuan:**

- Pada 5 dari 5 benturan customer vs owner, **owner selalu menang**, apa pun jendelanya dan walau dikirim 150 ms lebih lambat. Dugaan "soal jendela" sudah **salah** (jendela ditukar, hasil sama). Penyebabnya belum diketahui. Bukan celah keamanan: tepat satu menang dan yang kalah mendapat pesan benar.
- WA kosong di order wakil lama (#37 dan sebelumnya) **bukan bug**: WA pelanggan baru diisi sesudah order itu dibuat. Order wakil baru (#43) menyalin nama, WA, alamat.

**Masalah yang belum beres (sisa ORD.14):**

- **SEC-10 belum boleh dicentang:** sisi "customer menang" belum teramati (tidak bisa dipaksa dari konsol); ketuk dua kali tombol di layar belum bisa dites; teks baris SEC-10 juga meminta query baca-saja `order`, yang belum dijalankan.
- **K10:** owner batal dari Diproses dan Diantar/Siap, dan Selesai ditolak lewat `order_batal` (dari Disetujui sudah terbukti). #40 sudah Diproses dan siap dipakai.
- **K5 (SEC-18):** tag HTML di alasan tolak, batal, alih hari, nama pemesan, alias, alamat, nama menu, nama pelanggan tanpa akun.
- **K6 (SEC-06, SEC-12):** isian palsu pada aksi selain `order_buat`; query baca-saja `order` dan `order_item` (login dashboard oleh ketua, lalu logout).
- **K8:** `alamat_simpan` dengan id alamat orang lain (SEC-09, butuh dua customer).
- **K9 (SEC-17):** query baca-saja hak tabel dan daftar aksi `kedai`.
- **K7 (SEC-11), K3 (SEC-15), K4 (SEC-16):** dicocokkan dulu dengan teks baris di sheet; sebagian bukti masih dari handoff lama. K4: catatan terbuka lagi setelah alih hari, batas lewat layar.
- **Non-SEC:** urutan daftar O22, wizard hari Besok, jumlah menu, Segarkan saat terisi, pilihan non-bawaan di HP; query cek 8 dan 9 (paling akhir); tes pemakai (setelah semua lulus).
- **Menunggu Android:** SEC-19, `sw.js` v17 di HP.
- Logout dashboard Supabase dan GitHub: tidak ada kerja dashboard di sesi ini.
- Butir terbuka Handoff #11 sampai #27 yang tidak disebut di sini tidak berubah.

**Data dummy baru** (tidak bisa dihapus, dibersihkan di LNC.01): order #38 sampai #42 (customer, es teh manis, Diambil): #38, #39, #40 (Diproses), #41 (Disetujui) berujung Disetujui atau Diproses; #42 Ditolak. **#43:** order wakil Dummy Tiga (Diantar, Tunai, berWA dan beralamat), Disetujui.

**Saran giliran berikutnya:** lampirkan `AGENTS.md` + `order.md` + `security.md` + `pemetaan-test.md` + `order-test.md`. Mulai dari K10 (cepat, #40 siap), lalu K6, K5, K8, K9 dan SEC-12 (dashboard ketua), lalu sisa K3, K4, K7 dan non-SEC. Android belakangan. Hanya sebut SEC yang lengkap bila semua aksi di barisnya terbukti dan jenis buktinya sesuai kolom Catatan sheet.

### Handoff #29 | 2026-11-10 | [FREN]

**Tugas:** ORD.14 (sesi tes order) **lanjutan, belum selesai**. Sesi tes tanpa Android, lewat konsol dan layar, akun dummy. **Tidak ada kode, SQL, atau `kedai` yang diubah.** Menambah Handoff #28; selebihnya #28 tetap berlaku.

**Baris SEC yang sudah lengkap dan diingatkan untuk dicentang di sheet:** SEC-06 dan SEC-18. Baris ORD.14 di sheet tetap **Belum**.

**Terbukti** (bukti diperiksa di chat, tidak disimpan):

- **K10:** owner `order_batal` dari Diproses, Diantar, Siap diambil, dan Siap disajikan = 200 Dibatalkan, `oleh_peran` owner, `status_asal` benar, alasan tersimpan, riwayat mencatat asal dan tujuan (dari Disetujui sudah terbukti di H#9). `order_batal` pada order Selesai = 409, status tetap, riwayat tidak bertambah.
- **K6 (SEC-06):** isian palsu (peran, id pengguna, status, total, harga, pemutus, waktu, `oleh_peran`, `status_asal`, `hari`) diabaikan server pada `catatan_tambah`, `order_setuju`, `order_status` (owner dan penjaga), `order_tolak`, `order_metode_koreksi`, `order_alih_hari` (hari tujuan tetap Besok), `order_batal`, dan `catatan_dibaca` (owner dan customer pada order ber-10-catatan: penunjuk = id catatan terbaru, bukan isian palsu). Bersama H#3 dan H#24 (`order_buat`, `order_buat_wakil`), semua aksi yang menerima isian sudah teruji.
- **K5 (SEC-18):** teks berisi tag HTML tampil sebagai teks biasa untuk: catatan (H#21); alasan tolak dan alasan batal (owner dan customer); alasan alih hari (customer, satu-satunya layar yang menampilkannya); nama pelanggan tanpa akun dan alamatnya (Kelola Pelanggan, wizard, owner, penjaga); alias dan alamat customer (Buku alamat, lalu order di customer, owner, penjaga); nama menu (Kelola Menu, tab Pesan, keranjang, lalu order di customer, owner, penjaga). **Nama profil customer ditolak di input** (3 sampai 20 karakter, hanya huruf, angka, spasi, garis bawah), jadi buktinya berupa penolakan, bukan tampilan teks.
- Layar customer menampilkan kartu "Dibatalkan oleh pihak ChATA (nama owner)" pada order yang dibatalkan owner (ORD.17 terkonfirmasi lagi).

**Keputusan baru:** tidak ada.

**Masalah yang belum beres (sisa ORD.14):**

- **SEC-10:** sisi customer menang belum teramati; ketuk dua kali di layar belum bisa dites; query baca-saja `order` belum (butuh dashboard ketua).
- **SEC-12:** query baca-saja `order` dan `order_item` (dashboard ketua, lalu logout). **SEC-17 (K9):** query hak tabel dan daftar aksi `kedai`.
- **SEC-05 dan SEC-09 (K8):** `alamat_simpan` dengan id alamat milik orang lain.
- **SEC-11, SEC-15, SEC-16 (K7, K3, K4):** cocokkan dulu dengan teks sheet. K4 sisa: catatan terbuka lagi setelah alih hari, batas 10 dan karakter lewat layar, 409 saat status berubah di layar.
- **TC-K10-03:** penjaga menekan tombol status pada order Dibatalkan lewat layar.
- **Non-SEC:** urutan daftar O22, wizard hari Besok, jumlah menu, Segarkan saat terisi, pilihan non-bawaan di HP; query cek 8 dan 9 paling akhir; tes pemakai setelah semua lulus.
- **Android:** SEC-19, `sw.js` v17 di HP.
- Bukti `catatan_dibaca` oleh penjaga lemah (order tanpa catatan, hasil null); logika server sama dengan owner dan customer yang sudah kuat.
- Temuan #28 belum berubah: pada benturan customer vs owner, owner selalu menang; penyebab belum diketahui.
- Tidak ada kerja dashboard Supabase atau GitHub di sesi ini.

**Data dummy baru** (tidak bisa dihapus, dibersihkan di LNC.01):

- Order #44 sampai #51. #44, #47: Dibatalkan. #45, #46: Ditolak. #48, #49 (order wakil), #50, #51: Disetujui.
- #34, #36, #40, #41: Dibatalkan. #35: Diproses.
- #37 dan #39: dialihkan ke Besok (11 Nov); alih hari lagi akan ditolak `sudah_besok`.
- Pelanggan tanpa akun `<b>x</b>` (alamat `<b>x</b> Jl Dummy 1`), alamat customer beralias `<b>x</b>`, dan menu `<b>x</b>` (Rp 1.000, **belum dinonaktifkan**).

**Saran giliran berikutnya:** (1) nonaktifkan menu `<b>x</b>`; (2) K8 `alamat_simpan` orang lain (butuh dua customer dummy); (3) cocokkan K7, K3, K4 dengan teks sheet lalu tes sisanya; (4) K9 dan SEC-12 bersama ketua (dashboard); (5) sisa SEC-10 dan non-SEC; (6) Android belakangan. Lampirkan `AGENTS.md` + `order.md` + `security.md` + `pemetaan-test.md` + `order-test.md`.
---
