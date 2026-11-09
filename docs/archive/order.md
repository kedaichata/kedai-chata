/docs/order.md

# 🧾 order.md: Order, Status, Setuju/Tolak, Catatan Berlapis, Order Wakil Owner

> **Versi 1.3 (4 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Perubahan 1.3: jam bebas tanpa daftar (O2); mundur satu langkah dan koreksi metode bayar (O5, O10, O23); tanpa tombol batal setelah Disetujui (O9); nomor order berjalan (O18); teks pembayaran setelah Kirim (O21); tampilan daftar (O22). **Perubahan 1.2:** (a) tabel catatan dan pelanggan tanpa akun dibuat di ORD.01, bukan ORD.09 dan ORD.11; (b) O6 diperjelas: uang tunai boleh dipegang penjaga secara fisik, tetapi hanya owner yang menyetujui. **Versi 1.1:** diagram alur dibuang (yang berlaku adalah md ini) dan daftar push dipindah ke `notifikasi.md` bagian 4.** Bergantung pada `akun.md` (peran) dan `menu.md` (menu dan harga). Notifikasi ada di `notifikasi.md`, foto di `foto-bukti.md`.
> **Status:** O1 sampai O23 disepakati ketua (sesi strategi 4 Nov 2026). Butir **(bawaan)** = pilihan penulis yang tidak ditanyakan satu per satu; ketua boleh mengubahnya sebelum dikerjakan. Belum ada yang dikerjakan.
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini** (+ `database.md` dan `security.md` untuk langkah tabel, fungsi, dan aturan akses). Kerjakan langkah di bagian 5. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 9.
> **Berkas yang diminta AI di awal sesi:** berkas migration terbaru, `supabase/functions/kedai/`, dan berkas JS order bila sudah ada.
> **Tanpa kode dan tanpa isi SQL.** **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Fitur ini High-Risk (P0):** harga, status order, hak antar peran, data pelanggan. Tes teliti dan wajib ada bukti.

---

## 1. Tujuan

Mengganti catatan order di WhatsApp dengan sistem yang bisa dilihat tiga pihak sekaligus. Customer memesan semudah mengirim pesan WA, owner memutuskan menerima atau menolak, penjaga mengerjakan dan mengantar, dan semua melihat status yang sama. Foto bukti antar (opsional) menjawab masalah utama: customer yang merasa tidak diantar.

---

## 2. Keputusan

| No  | Keputusan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Dasar                                                                                       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| O1  | **Tipe order ada tiga:** **Diantar (default)**, **Diambil**, **Makan di warung**. Sekitar 90% order adalah Diantar.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Keputusan ketua.                                                                            |
| O2  | **Hari dan jam:** customer memilih **Hari ini atau Besok** dan **jam antar/ambil yang diisi bebas** (pemilih jam bawaan HP, tanpa daftar pilihan; server hanya mengecek formatnya). "Hari ini" dan "Besok" dihitung **server (WIB)**. **Tanpa batas jam pesan** di versi 1: order di luar jam buka warung tetap bisa masuk dan sering tetap dilayani; bila tidak bisa (kesiangan atau menu habis), **owner menolak** lalu follow up lewat WA. Jam di kartu order ditulis sebagai permintaan ("Minta diantar jam 11.15"), bukan janji.                                                              | Keputusan ketua; waktu dari jam server (`security.md` aturan 6).                            |
| O3  | **Isi order:** satu atau beberapa menu **yang tersedia** dengan jumlah (batas `item_maks_per_order` dan `jumlah_maks_per_item`). **Harga dihitung server**; nama dan harga satuan **disalin ke order**. Total = jumlah harga semua item. **Tanpa ongkir, diskon, atau biaya lain** di versi 1. **(bawaan)**                                                                                                                                                                                                                                                                                        | `menu.md` MN4; kandidat ongkir dan diskon ada di `bonus.md`.                                |
| O4  | **Alamat:** untuk tipe Diantar customer memilih **satu dari alamat aktif** di buku alamatnya; **alias dan isi alamat disalin ke order**. Tipe Diambil dan Makan di warung **tanpa alamat**.                                                                                                                                                                                                                                                                                                                                                                                                        | Keputusan ketua; `akun.md` AK9.                                                             |
| O5  | **Status dan jalur per tipe** (tabel di bagian 4). Order lahir **Menunggu**. Cabang akhir: **Ditolak** dan **Dibatalkan**. Status **tidak bisa loncat**; **mundur hanya satu langkah** sesuai O10 (server menolak selain itu).                                                                                                                                                                                                                                                                                                                                                                     | Alur ketua; `security.md` SEC-15.                                                           |
| O6  | **Setujui berarti pembayaran sudah diterima.** Pembayaran selesai **di luar aplikasi** (transfer, QRIS, atau tunai; tunai boleh dititipkan ke penjaga secara fisik lalu dikabarkan ke owner lewat WA, koordinasinya di luar aplikasi). **Owner wajib memilih metode yang diterima** (Transfer, Tunai, atau QRIS) saat menekan Setujui; server menolak bila metode kosong. **Customer tidak memilih metode bayar.** **Penjaga tidak menyetujui atau mencatat pembayaran di aplikasi; hanya owner yang menekan Setujui.** Tidak ada bayar nanti atau utang di versi 1.                               | Keputusan ketua 4 Nov 2026; payment gateway dan utang masuk `bonus.md`.                     |
| O7  | **Dua owner menekan Setujui/Tolak bersamaan** pada order yang sama: server hanya menerima **satu**, yang lain mendapat pesan "sudah diproses". Order mencatat **nama owner yang memutuskan** dan waktunya.                                                                                                                                                                                                                                                                                                                                                                                         | Atomik (`security.md` aturan 4, SEC-10); 5 owner bergantian.                                |
| O8  | **Tolak:** owner boleh menulis **alasan (opsional, maks 200 karakter)** yang tampil ke customer. Follow up berikutnya lewat WA.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Keputusan ketua.                                                                            |
| O9  | **Batalkan:** customer hanya boleh membatalkan order **miliknya** saat status **Menunggu**. Setelah Disetujui **tidak ada tombol batal** untuk siapa pun; bila terjadi, diselesaikan kekeluargaan lewat WA (nominal kecil, belum pernah terjadi). Bila customer ingin order pengganti di hari berikutnya, owner membuat **order wakil** (O15).                                                                                                                                                                                                                                                     | Keputusan ketua 4 Nov 2026 (belum pernah terjadi; diselesaikan kekeluargaan).               |
| O10 | **Siapa mengubah status pengerjaan:** Diproses, Diantar/Siap diambil/Siap disajikan, Selesai diubah **penjaga** (dan **owner**, bawaan, bila penjaga tidak ada). Tiap perubahan tercatat di **riwayat status** (siapa, kapan). **Salah pencet:** penjaga dan owner boleh **mundur satu langkah** (Diproses ke Disetujui, atau Diantar/Siap diambil/Siap disajikan ke Diproses), **tidak dari Selesai**, tercatat di riwayat; mundur tidak mengirim push ke customer **(bawaan)**. **Owner** boleh **mengoreksi metode bayar** selama order belum Selesai (O23).                                    | Alur ketua; hak di `akun.md` bagian 4; mundur satu langkah: keputusan ketua 4 Nov 2026.     |
| O11 | **Visibilitas:** customer melihat **hanya order miliknya**. Owner melihat **semua**. Penjaga melihat order **Disetujui ke atas** (tidak melihat Menunggu, Ditolak, Dibatalkan). Penjaga dan owner melihat nomor WA dan alamat pemesan pada order yang terlihat **(bawaan: penjaga ikut melihat)**.                                                                                                                                                                                                                                                                                                 | Alur ketua; penjaga perlu menghubungi pemesan saat mengantar.                               |
| O12 | **Catatan berlapis:** satu order punya banyak catatan, tiap catatan **terikat waktu server dan nama penulis**. Catatan awal customer saat membuat order jadi catatan pertama. **Customer pemilik dan owner** boleh menambah **selama order belum Diproses** (status Menunggu atau Disetujui). **Penjaga hanya membaca.** Catatan **tidak bisa diedit atau dihapus**; berubah pikiran = tambah catatan baru. Batas: `catatan_maks_karakter` dan `catatan_maks_per_order`. Setelah Diproses, catatan **terkunci** (bila status dimundurkan ke Disetujui, catatan terbuka lagi).                      | Keputusan ketua (contoh: 1 cabe jadi 3 cabe, tanpa micin).                                  |
| O13 | **Tanpa chat di aplikasi.** Follow up lewat WA; hasilnya dicatat owner sebagai catatan di order. Owner punya tombol **"Chat WA"** pada order (membuka WA ke nomor pemesan). Chat di aplikasi masuk `bonus.md`.                                                                                                                                                                                                                                                                                                                                                                                     | Keputusan ketua (ragu soal chat, pilih WA + catatan).                                       |
| O14 | **Catatan baru memicu push** ke pihak lain yang berhak melihat order itu, penulis dikecualikan: customer menulis, maka owner (dan penjaga bila order sudah Disetujui); owner menulis, maka customer pemilik (dan penjaga bila sudah Disetujui) **(bawaan)**. **Penjaga tidak dikabari untuk order Menunggu** (O11). Kartu order diberi tanda **"Catatan baru"** sampai dibaca. Daftar lengkap penerima ada di `notifikasi.md` bagian 4.                                                                                                                                                            | Keputusan ketua: catatan yang tidak terlihat sama dengan tidak ada; disesuaikan dengan O11. |
| O15 | **Order wakil owner:** owner bisa membuat order untuk **pelanggan tanpa akun** lewat **wizard 5 langkah** (bagian 4). Hanya owner. Order langsung berstatus **Disetujui** (owner sendiri yang menerima pembayaran dan memilih metode di wizard), ditandai **"Dibuat oleh [nama owner]"**. Tidak ada push ke pemesan (tidak punya akun); penjaga tetap dapat push. Order wakil juga dipakai sebagai **order pengganti** (O9): untuk pemesan yang punya akun, owner mencatatnya dulu di daftar Pelanggan tanpa akun. **(bawaan)**                                                                    | Keputusan ketua.                                                                            |
| O16 | **Pelanggan tanpa akun disimpan sebagai daftar** (nama, keterangan, nomor WA opsional, alamat antar). Hanya **owner** yang melihat dan mengelola; **tidak bisa dihapus, hanya dinonaktifkan**. Isi **disalin ke order** saat dibuat. **Tidak digabung otomatis** dengan akun yang mendaftar kemudian di versi 1. Data pribadi: aturan sama dengan nomor WA customer.                                                                                                                                                                                                                               | Keputusan ketua (supaya nyokap tidak "alergi" memakai aplikasi).                            |
| O17 | **Order tidak bisa dihapus siapa pun**, hanya berubah status. Foto bukti dibersihkan setelah 14 hari, catatan dan order tetap.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | `AGENTS.md` bagian 7; `foto-bukti.md`.                                                      |
| O18 | **Nomor order berjalan terus** (tidak di-reset tiap hari, misalnya "#1042") ditampilkan di kartu untuk dipakai saat bicara lewat WA, supaya tidak ambigu antar hari.                                                                                                                                                                                                                                                                                                                                                                                                                               | Memudahkan owner dan customer menyebut order yang sama.                                     |
| O19 | **Penyegaran data tanpa polling:** daftar order diambil saat layar dibuka atau aplikasi kembali ke layar, saat push masuk (bila terbuka), dan lewat tombol **Segarkan**.                                                                                                                                                                                                                                                                                                                                                                                                                           | Keputusan ketua; `notifikasi.md`.                                                           |
| O20 | Semua aksi order lewat Edge Function `kedai`; logika (cek menu, hitung harga, setujui, ubah status, tambah catatan) di **fungsi SQL atomik**.                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `AGENTS.md` bagian 7; `database.md` bagian 5.                                               |
| O21 | **Teks tetap setelah Kirim dan di detail order Menunggu:** "Pesanan diterima. Perwakilan ChATA akan menghubungi lewat WhatsApp untuk pembayaran. Pesanan diproses setelah pembayaran dikonfirmasi." Info rekening dan QRIS tidak disimpan di aplikasi; owner menyampaikannya lewat WA (tombol Chat WA, O13).                                                                                                                                                                                                                                                                                       | Keputusan ketua 4 Nov 2026 (kata-kata dari ketua; penulisan "ChATA" mengikuti nama resmi).  |
| O22 | **Tampilan daftar:** daftar **owner dan penjaga** hanya menampilkan order dengan hari antar **Hari ini dan Besok**; order yang hari antarnya sudah lewat tidak tampil (tanpa tanda khusus dan tanpa tutup otomatis). Urutan: Hari ini dulu, lalu Besok; dalam tiap hari order yang sudah **Disetujui** (sudah dibayar) di atas, urut waktu disetujui (terlama dulu); order Selesai di bawah. **Owner** tetap bisa membuka hari lain lewat filter di Semua Order. **Customer** di Pesanan Saya melihat **riwayat lengkap** (foto bukti yang tersimpan 14 hari hanya bisa dibuka dari detail order). | Keputusan ketua 4 Nov 2026; ringkasan 7 hari untuk owner masuk `bonus.md` (B31).            |
| O23 | **Koreksi metode bayar:** hanya **owner**, selama order belum Selesai, lewat aksi tersendiri; tercatat di riwayat (metode lama dan baru, siapa, kapan). Penjaga tidak bisa.                                                                                                                                                                                                                                                                                                                                                                                                                        | Keputusan ketua 4 Nov 2026; O6, O10.                                                        |

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

**Alur dan push:** urutan umumnya customer mengirim order, owner memutuskan (Setujui dengan metode bayar, atau Tolak), penjaga mengerjakan sampai Selesai, dan ketiganya melihat status yang sama. Siapa dikabari lewat push pada kejadian apa (order baru, catatan, setujui, tolak, status, foto) ditetapkan di `notifikasi.md` bagian 4, bukan di sini, supaya tidak tumpang tindih.

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
6. **ORD.06** Layar owner: Order Masuk, Semua Order (Hari ini dan Besok, filter hari lain; urutan O22), detail order dengan tombol Setujui, Tolak, dan Chat WA.
7. **ORD.07 ⚠️** Aksi `order_status` untuk penjaga dan owner: jalur sesuai tipe, tanpa loncat, mundur hanya satu langkah dan tidak dari Selesai (O10), riwayat tercatat; ditambah aksi `order_metode_koreksi` untuk owner (O23).
8. **ORD.08** Layar penjaga: Antrean (Hari ini lalu Besok, O22), detail, tombol status berikutnya.
9. **ORD.09 ⚠️** Catatan berlapis: aksi `catatan_tambah` dan `catatan_dibaca` (tabelnya sudah dibuat di ORD.01), aturan kunci saat Diproses, batas karakter dan jumlah.
10. **ORD.10** Tampilan catatan di detail order dan tanda "Catatan baru" di kartu order.
11. **ORD.11 ⚠️** Pelanggan tanpa akun: aksi daftar, simpan, dan nonaktifkan (owner saja; tabel `pelanggan_luar` sudah dibuat di ORD.01).
12. **ORD.12 ⚠️** Aksi `order_buat_wakil` (atomik, langsung Disetujui, metode bayar, penanda pembuat).
13. **ORD.13** Wizard 5 langkah owner dan layar Kelola Pelanggan.
14. **ORD.14** Sesi tes order (dokumen `order-test.md` dibuat di sesi tes): 1 akun per peran + customer kedua, bukti untuk harga, hak, dobel-setujui, mundur satu langkah, dan koreksi metode bayar.

---

## 6. Aturan yang paling sering terlanggar

| Aturan                                                                            | Akibat bila dilanggar                                                                                            |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Menerima harga, total, status, atau peran dari aplikasi                           | Order dengan harga sendiri atau status sembarang (SEC-06, SEC-12, SEC-15).                                       |
| Order merujuk menu/alamat terbaru, bukan salinan                                  | Mengubah menu atau alamat mengacaukan order dan catatan lama.                                                    |
| Customer bisa melihat order, catatan, atau alamat customer lain                   | Data pelanggan bocor (SEC-05).                                                                                   |
| Penjaga bisa melihat order Menunggu atau memanggil Setujui/Tolak                  | Order lompat tanpa persetujuan owner (SEC-08).                                                                   |
| Setujui diproses tanpa metode bayar, atau bisa dobel                              | Pembayaran tidak tercatat atau order tercatat dua kali (SEC-10, SEC-11).                                         |
| Catatan bisa diedit, dihapus, atau ditambah setelah Diproses                      | Riwayat permintaan tidak bisa dipercaya; penjaga bekerja dengan catatan usang (SEC-16).                          |
| Hari atau jam dihitung dari jam HP                                                | "Hari ini/Besok" salah (SEC-19).                                                                                 |
| Memasang catatan, nama, alamat, atau alasan tolak lewat `innerHTML`               | Teks berisi tag bisa menjalankan skrip (SEC-18).                                                                 |
| Menulis data pelanggan nyata (nama, WA, alamat) di repo, md, chat, atau bukti tes | Data pribadi terbuka di repo public (`security.md` aturan 7).                                                    |
| Polling berkala untuk menyegarkan daftar order                                    | Kuota free tier cepat habis (`notifikasi.md`).                                                                   |
| Menyediakan tombol hapus order                                                    | Catatan order hilang; gunakan status.                                                                            |
| Membatasi pilihan jam atau menolak jam yang sudah lewat                           | Order di luar jam buka warung (yang sering tetap dilayani) tidak bisa dicatat; aplikasi jadi lebih kaku dari WA. |

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

_(belum ada blok)_

### 2026-11-07: Pintu "Pelanggan tanpa akun" ada di Home (owner)

**Berkas tujuan:** `docs/order.md`, Catatan Susulan di akhir berkas. Sumber: `home.md` HM7 dan HOM.04. Yang paling akhir menang.

Item **Pelanggan** ("Pelanggan tanpa akun", O16) untuk owner ada di **Home**, di bagian tersendiri sebelum Pengaturan akun. Tempatnya sudah dibuat dan tampil "Segera" (tidak bisa diketuk). ORD.11 tinggal mengaktifkannya dan membuat layar daftarnya. Wizard Buat Order tetap di tab Buat Order.

### 2026-11-07: Item order menyimpan pilihan menu

**Berkas tujuan:** `docs/order.md`, Catatan Susulan di akhir berkas. Sumber: blok `2026-11-07: Deskripsi, sheet detail, dan pilihan menu` di `docs/menu.md`. Menambah O3 dan O12. Yang paling akhir menang.

- `order_item` menyimpan **teks pilihan yang disalin** (nama grup dan nama opsi, misal "Tingkat pedas: Tidak pedas"), sama seperti nama dan harga menu disalin. Mengubah atau menonaktifkan grup atau opsi kemudian tidak mengubah order lama.
- Pilihan **selalu tersimpan eksplisit**, termasuk bila customer tidak mengubah bawaan, sehingga penjaga tidak perlu menebak.
- `order_buat` menerima **id menu, jumlah, dan id opsi** per item; server memvalidasi opsi terhadap grup yang terpasang di menu. Harga tetap dihitung server; pilihan gratis tidak mengubah total.
- **Item yang sama dengan pilihan berbeda = baris terpisah** (Mie Ayam Tidak pedas x1 dan Mie Ayam Pedas x1).
- Add-on berbayar adalah item menu biasa; tidak ada hubungan induk di order.
- Penjaga dan owner melihat pilihan di baris item pada detail order.
- Ganti pilihan setelah order dikirim: lewat **catatan baru** (O12) selama belum Diproses (bawaan, sejalan O12).
- Dampak ke urutan: ORD.01 dan ORD.02 memuat pilihan sejak awal, jadi `order_item` tidak perlu diubah setelah terisi.

### Handoff #1 | 2026-11-08 | KETUA

**Berkas tujuan:** `docs/order.md` bagian 9. Yang paling akhir menang.

**Tugas:** ORD.01 **selesai** (migration tabel order). **Silakan dicentang di sheet.** Migration dijalankan di SQL Editor dengan "OK" ketua (hasil "Success. No rows returned"), lalu dicek dengan `20261108_order_cek.sql` bagian 1 sampai 8: semuanya sesuai harapan (RLS aktif di 6 tabel, tanpa policy, hak `service_role` sesuai `database.md` bagian 3 tanpa DELETE, `anon` dan `authenticated` nol, urutan nomor otomatis tertutup, 4 pengaturan terisi, jumlah pagar per tabel cocok, kolom `pilihan` bertipe ARRAY dan wajib diisi, keenam tabel kosong). Bukti diperiksa di chat dan tidak disimpan. Sudah di-push ke GitHub.

**Berkas diubah (semuanya baru, tidak ada berkas lama yang diubah):**

- `supabase/migrations/20261108_order.sql`
- `supabase/migrations/20261108_order_batal.sql`
- `supabase/templates/20261108_order_cek.sql`
  `kedai/index.ts` dan berkas aplikasi tidak disentuh.

**Keputusan baru** (ketua menyetujui bentuk kolom pilihan; selebihnya pilihan penulis, alasan belum tercatat):

- **Pilihan menu di `order_item` = satu kolom daftar teks `pilihan`** (teks berformat "Nama grup: Nama opsi", tidak boleh kosong tetapi boleh daftar kosong). Alasan ketua: hanya catatan riwayat dan sederhana, sesuai kebutuhan warung. Tanpa tabel tambahan, dan tanpa aturan unik pada (order, menu) karena item sama dengan pilihan beda = baris terpisah.
- **Nama tabel `order` wajib ditulis `public."order"`** (kutip ganda) di semua SQL, karena `order` adalah kata yang dipakai SQL sendiri.
- **Nomor order mulai dari 1.** Order uji ikut memakai nomor; reset sebelum peluncuran masuk pembersihan LNC.01 (butuh "OK" ketua).
- **`jam_permintaan` wajib diisi** (jam saja, tanpa tanggal). Melonggarkannya kelak mudah, mengetatkannya sulit.
- **Pagar antar-kolom di tabel `order`** (pagar kedua di samping fungsi): tepat satu jenis pemesan (akun atau pelanggan tanpa akun); order wakil wajib punya pembuat owner; alamat hanya untuk tipe Diantar; metode bayar ada tepat saat status Disetujui ke atas; pemutus dan waktu diputuskan ada tepat saat status Ditolak atau Disetujui ke atas; alasan tolak hanya pada Ditolak. Untuk order wakil, **pemutus diisi owner pembuatnya** (O15).
- Panjang nama pemesan (salinan) dan nama pelanggan tanpa akun: 3 sampai 30 karakter; keterangan pelanggan tanpa akun 3 sampai 100 (opsional).
- Pelaku pada `riwayat_status`, `catatan_order`, dan `baca_catatan` merujuk ke **akun Supabase Auth** (bukan `profil` atau `staf`), karena pelakunya bisa customer atau staf.
- Batas panjang atas catatan tidak ada di tabel; dijaga fungsi dari `catatan_maks_karakter` dan `catatan_maks_per_order`.
  **Belum beres:**

- **Pagar antar-kolom baru terbukti keberadaannya** (jumlahnya cocok), belum diuji dengan data. Diuji lewat ORD.02 dan sesi tes order (ORD.14), misalnya order wakil dan kecocokan metode bayar dengan status.
- Pemanggilan `opsi_periksa` dan pemetaan kode galat `pilihan_rusak` di `kedai` **dikerjakan di ORD.02** (`order_buat`), bukan di ORD.01 yang hanya migration. Tombol pilih opsi di aplikasi di ORD.03. Ini meluruskan catatan di `docs/menu.md` Handoff #9 sampai #12 yang menyebut ORD.01.
- `order_buat` perlu mengubah hasil `opsi_periksa` (`grup_nama`, `opsi_nama`) menjadi teks "Nama grup: Nama opsi" untuk kolom `pilihan`. Aturan susunan teksnya belum dipaku.
- MT-23 dan MT-24 (`docs/menu-test.md`) menunggu ORD.02.
- Order uji tidak bisa dihapus; dibersihkan di LNC.01 bersama reset nomor order.
  **Saran giliran berikutnya:** ORD.02 (fungsi SQL dan aksi `order_buat`, `order_daftar`, `order_detail`; High-Risk, butuh "OK" ketua). Kemungkinan dua giliran seperti MNU.09: fungsi SQL lebih dulu (migration baru), lalu aksi di `kedai/index.ts`. Lampirkan `AGENTS.md` + `order.md` (sudah memuat handoff ini) + `database.md` + `security.md`, serta `supabase/functions/kedai/index.ts`, `20261108_order.sql`, `20261107_04_menu_grup_pilihan.sql` (memuat `opsi_periksa` dan `menu_daftar`), dan `20261105_akun.sql` (pola fungsi dan hak).

### Handoff #2 | 2026-11-08 | KETUA

**Berkas tujuan:** `docs/order.md` bagian 9. Yang paling akhir menang.

**Tugas:** ORD.02 **kode dan deploy selesai, tes belum.** Jangan dicentang di sheet dulu; pengingat centang menyusul setelah tes lolos.

- Giliran 1 (fungsi SQL `order_buat`, `order_daftar`, `order_detail`): dijalankan di SQL Editor dengan "OK" ketua (hasil "Success. No rows returned"), lalu dicek: SECURITY DEFINER dan `search_path` kosong, EXECUTE hanya `service_role` (`anon` dan `authenticated` nol), tidak ada fungsi kembar, tabel order masih kosong. Semuanya sesuai harapan. Bukti diperiksa di chat dan tidak disimpan. Sudah di-push.
- Giliran 2 (aksi `order_buat`, `order_daftar`, `order_detail` di `kedai`): di-deploy 8 Nov 2026 ke project ChATA **tanpa** `--no-verify-jwt`, lewat urutan aman `AGENTS.md` bagian 8. Token CLI sudah dibersihkan (dicek `[]`).

**Berkas diubah:**

- Baru: `supabase/migrations/20261108_02_order_fungsi.sql`, `supabase/migrations/20261108_02_order_fungsi_batal.sql`, `supabase/templates/20261108_02_order_fungsi_cek.sql`
- Diubah: `supabase/functions/kedai/index.ts` (hanya tambahan: komentar kepala, `PETA_GALAT_ORDER`, tiga fungsi aksi, tiga `case`; tidak ada baris lama yang dihapus atau diubah).

**Keputusan baru** (ketua menyetujui format teks pilihan "Nama grup: Nama opsi", disusun mengikuti urutan grup di menu; selebihnya pilihan penulis, alasan belum tercatat; rincian lengkap di kepala `20261108_02_order_fungsi.sql`):

- `order_buat` menerima `tipe`, `alamat_id`, `hari` (teks persis "Hari ini" atau "Besok"), `jam` (HH:MM; jam yang sudah lewat tidak ditolak, O2), `item` (daftar `{menu_id, jumlah, opsi_ids}`), dan `catatan`. Isian lain dari aplikasi dibuang. Tipe selain Diantar: `alamat_id` diabaikan.
- Menu nonaktif atau Habis = satu kode galat `menu_tidak_tersedia`. Item sama dengan pilihan sama yang dikirim dua kali = dua baris. Tidak ada penahan kirim ganda di server; tombol Kirim dikunci di layar (ORD.03). Fungsi tidak mengisi `baca_catatan`; tanda "Catatan baru" (ORD.10) menghitung catatan milik orang lain saja.
- `order_daftar`: baris ringkas (tanpa nomor WA dan isi alamat; teks `ringkas` "Nama x jumlah"). Filter hari (tanggal `YYYY-MM-DD`) hanya dipakai owner; filter status untuk semua peran. Urutan owner dan penjaga: hari antar, lalu kelompok (Disetujui sampai siap, Menunggu, Selesai, Ditolak dan Dibatalkan), lalu waktu diputuskan atau dibuat terlama dulu. Customer: terbaru dulu, tanpa pembagian halaman.
- `order_detail`: metode bayar tampil ke owner dan penjaga; nama pemutus dan riwayat status hanya owner. Order yang tidak ada dan yang tidak boleh dilihat memakai satu galat `order_tidak_ditemukan`. Urutan baris item: nama menu lalu pilihan (tabel tidak punya kolom urutan baris).
- Balasan `kedai`: `order_buat` memuat `order` (`id`, `nomor`, `status`, `total`, `hari_target`, `jam_permintaan`), `order_daftar` memuat `daftar`, `order_detail` memuat `order`.
- `pilihan_rusak` dan `opsi_tidak_valid` kini dipetakan di `kedai` (meluruskan Handoff #1). Kode `id_kosong`, `pengaturan_rusak`, dan `total_terlalu_besar` sengaja tidak dipetakan (galat umum 500).

**Belum beres:**

- **Tes ORD.02 belum jalan** (High-Risk, wajib bukti). Caranya: konsol browser di halaman aplikasi asli, dengan `window.KedaiAkun.panggilKedai(aksi, data)` dari `akun.js`. Butuh akun dummy: customer 1 (profil dan alamat aktif), customer 2, owner, penjaga, dan minimal satu menu Tersedia (idealnya dengan grup pilihan). Kesiapan akun dummy belum dikonfirmasi saat handoff ini.
- Rencana tes: order sah dan total benar; teks pilihan tersalin; harga dan status palsu dari aplikasi diabaikan (SEC-06, SEC-12); customer 2 tidak bisa membuka order customer 1 (SEC-05, SEC-09); owner dan penjaga ditolak di `order_buat` (403); penjaga tidak melihat order Menunggu (SEC-08); alamat orang lain dan menu Habis ditolak; waktu dari server (SEC-19).
- Pagar antar-kolom tabel order (Handoff #1) baru teruji untuk status Menunggu lewat `order_buat`; sisanya lewat ORD.05, ORD.12, dan ORD.14.
- MT-23 dan MT-24 (`docs/menu-test.md`) bisa dijalankan setelah tes ORD.02 lolos.
- `index.ts` sudah disalin ke repo dan di-deploy, tetapi **belum dikonfirmasi di-push**: cek `git status`.
- Komentar lama di `index.ts` (`PETA_GALAT_GRUP`) masih menyebut `pilihan_rusak` dipetakan di ORD.01; sengaja tidak diubah. Yang berlaku blok ini.
- Order uji tidak bisa dihapus; dibersihkan di LNC.01 bersama reset nomor order.

**Saran giliran berikutnya:**

1. Tes ORD.02 (lampirkan `AGENTS.md` + `order.md` yang sudah memuat handoff ini + `database.md` + `security.md`). Setelah lolos: butir ORD.02 selesai, silakan dicentang di sheet.
2. Lalu ORD.03 (layar Pesan): lampirkan juga `akun.js`, `menu.js`, `menu-detail.js`, `kerangka.js`, `style.css`, dan `sw.js`. Berkas JS baru wajib didaftarkan di cache `sw.js` (perubahan `sw.js` butuh "OK" ketua).
3. ORD.05 (`order_setuju` dan `order_tolak`) butuh penjelasan dampak dan "OK" ketua.

### Handoff #3 | 2026-11-08 | KETUA

**Berkas tujuan:** `docs/order.md` bagian 9, ditempel di bawah Handoff #2. Yang paling akhir menang.

**Pertentangan dengan Handoff #2:** butir "tes ORD.02 belum jalan" dan "`index.ts` belum dikonfirmasi di-push" sudah tidak berlaku. `index.ts` dan Handoff #2 sudah di-push (commit `50c1a86`, `main -> main`, lewat tiga cek aman). Butir Handoff #2 lain yang tidak disebut di sini tetap berlaku.

**Tugas:** ORD.02 **selesai dan sudah dicentang di sheet.** Tes dijalankan lewat konsol browser di aplikasi asli (`window.KedaiAkun.panggilKedai`), satu akun per peran ditambah customer kedua, semuanya dummy. Bukti diperiksa di chat dan tidak disimpan. Baris SEC di sheet **sengaja tidak ada yang dicentang** (jadwalnya setelah ORD.14, dan sebagian baru teruji sebagian).

**Berkas diubah:** tidak ada berkas kode yang diubah di sesi ini. Yang di-push hanya `docs/order.md` (Handoff #2) dan `supabase/functions/kedai/index.ts` (aksi ORD.02, isinya tidak berubah dari Handoff #2).

**Yang sudah lulus (ringkas):**

- `order_buat` sah: total dihitung server, status Menunggu, "Hari ini" dan "Besok" jadi tanggal dari server, nomor order berjalan, catatan awal jadi catatan pertama, catatan kosong boleh.
- Teks pilihan tersalin ("Level pedas: Sedang"), nama dan harga menu tersalin ke item. Harga menu diubah kemudian: order lama tetap harga lama, order baru memakai harga baru.
- Isian palsu (total, status, peran, metode bayar, harga dan subtotal di item) diabaikan.
- Customer kedua: detail order dan alamat milik customer lain dibalas 404, daftarnya kosong.
- Owner dan penjaga memanggil `order_buat`: 403. Owner melihat semua order (daftar ringkas tanpa nomor WA dan isi alamat; detail memuat nomor WA, alamat, dan riwayat). Penjaga tidak melihat order Menunggu (daftar kosong, detail 404). Customer melihat riwayat kosong.
- 11 kasus isian salah ditolak semua (tipe, hari berupa tanggal, jam, item kosong, jumlah nol, jumlah dan jumlah item melebihi batas, catatan terlalu panjang, Diantar tanpa alamat, menu tidak ada, opsi asing) dan tidak ada order yang lolos.
- Menu Habis ditolak, termasuk saat dicampur menu tersedia (seluruh order ditolak, nomor order tidak terpakai).

**Keputusan baru:**

- **Tes jam HP (SEC-19) digeser ke ORD.14**, dikerjakan di HP Android dummy setelah ORD.03 (layar Pesan) ada: geser tanggal HP, pesan lewat layar, cek `hari_target` di detail order. Usulan penulis sesi, disetujui PIC. Alasan: aplikasi tidak pernah mengirim jam HP, jadi tes lewat konsol tidak membuktikan apa pun; menggeser jam Mac bersama tidak disarankan (bisa mengganggu login dan SSH).
- **MT-23 dan MT-24 (`docs/menu-test.md`) dikerjakan adik ketua di sesi berikutnya** (keputusan PIC). Keduanya sudah bisa dijalankan karena tes ORD.02 lulus.

**Belum beres:**

- **SEC-19 jam HP** (digeser ke ORD.14, lihat di atas). Bagian "waktu catatan dari server" menunggu ORD.09.
- **SEC yang baru sebagian:** SEC-05 (catatan belum ada aksinya), SEC-06 (ID pengguna dan aksi selain `order_buat`), SEC-07 (customer memanggil aksi owner: aksinya belum ada), SEC-08 (aksi owner-only oleh penjaga, order Ditolak dan Dibatalkan), SEC-09 (`order_batal`, `catatan_tambah`, dan lainnya). Sesi tes nanti tidak perlu mengulang yang sudah lulus di atas.
- **Belum dites di aksi ORD.02:** customer memesan tipe Diambil atau Makan di warung (alamat diabaikan); filter hari dan filter status di `order_daftar` (termasuk galat filter status salah); urutan daftar untuk status Disetujui ke atas dan urutan terbaru dulu untuk customer; penjaga melihat order Disetujui (menunggu ORD.05).
- **Data uji (dummy):** order nomor 1 sampai 3 milik customer 1, tidak bisa dihapus, dibersihkan di LNC.01 bersama reset nomor order. Menu uji: Ayam Katsu diubah jadi Habis dan harga es teh manis diubah jadi 6000 (aslinya 5000); **sudah dikonfirmasi dikembalikan**, kembalikan lewat layar Menu owner sebelum ORD.03 atau MT-23 dan MT-24.
- Catatan teknis untuk layar (ORD.03 dan ORD.04): isian `order_detail` bernama **`id`** (bukan `order_id`); balasan konsol berbentuk `{status, data}`.

**Saran giliran berikutnya:**

1. **MT-23 dan MT-24** lampirkan `AGENTS.md` + `order.md` + `docs/menu-test.md`; akun dummy sudah ada.
2. **ORD.03** (layar Pesan; lampirkan juga `akun.js`, `menu.js`, `menu-detail.js`, `kerangka.js`, `style.css`, `sw.js`). Berkas JS baru wajib didaftarkan di cache `sw.js` (perubahan `sw.js` butuh "OK" ketua). Tombol Kirim dikunci di layar karena server tidak menahan kirim ganda (Handoff #2).
3. **ORD.05** (`order_setuju` dan `order_tolak`) butuh penjelasan dampak dan "OK" ketua.

### 2026-11-08: MT-23 dan MT-24 selesai dan lulus

**Berkas tujuan:** `docs/order.md` bagian 9 (tempel paling bawah, di bawah Handoff #3). Yang paling akhir menang. Rincian bukti dan hasil ada di Handoff #13 `docs/menu.md`.

- **MT-23 dan MT-24 (`docs/menu-test.md`) sudah dikerjakan dan lulus.** Butir 1 di "Saran giliran berikutnya" Handoff #3 **tidak berlaku lagi**. Tidak ada kode yang diubah.
- Yang terbukti lewat `order_buat`: isian palsu (`harga`, `total`, `status`, harga item) diabaikan; opsi di luar grup yang terpasang di menu dibalas 409 "Pilihan menu berubah atau tidak valid..." tanpa order terbentuk; harga menu diubah kemudian, order lama tetap harga lama dan order baru memakai harga baru.
- **Data uji (dummy) bertambah:** order nomor 4 dan 5 milik customer 1, tidak bisa dihapus, dibersihkan di LNC.01 bersama reset nomor order. Harga es teh manis sudah dikembalikan ke 5000.
- **ORD.03 belum dikerjakan** (status sheet Belum); saran Handoff #3 butir 2 tetap berlaku, begitu pula butir 3 (ORD.05 butuh penjelasan dampak dan "OK" ketua).

### Handoff #4 | 2026-11-08 | [RAC]

**Berkas tujuan:** `docs/order.md` bagian 9, ditempel paling bawah (di bawah blok "MT-23 dan MT-24 selesai dan lulus"). Yang paling akhir menang.

**Pertentangan dengan blok lama:** tidak ada. Saran Handoff #3 butir 2 (ORD.03) dijalankan; butir 1 sudah tidak berlaku (lihat blok MT-23 dan MT-24).

**Tugas:** ORD.03 (layar customer Pesan) **belum selesai, jangan dicentang di sheet.** Giliran 1 dari 3 sudah dikerjakan: keranjang, form pesanan, Kirim, dan layar selesai (teks O21). Yang belum ada: tombol Tambah di kartu menu dan pilihan menu di sheet detail, jadi layar pesanan belum bisa dicoba dari tampilan (keranjang masih kosong). Rencana tiga giliran: (1) `pesan.js` + `index.html` + `kerangka.js` (selesai), (2) `menu.js` + `menu-detail.js` + `style.css` bila perlu, (3) `sw.js` (sudah dikerjakan lebih awal, lihat di bawah).

**Berkas diubah:**

- Baru: `public/pesan.js` (765 baris).
- Diubah: `public/index.html` (panel Pesan dibungkus tiga langkah: menu, pesanan, selesai; tiga elemen daftar menu lama tidak berubah isinya, hanya dibungkus `#pesan-langkah-menu`; ditambah `<script src="pesan.js">` setelah `grup.js`).
- Diubah: `public/kerangka.js` (hanya tambahan: `KedaiPesan.tampil()` saat tab Pesan dibuka, `KedaiPesan.reset()` saat Keluar; tidak ada baris lama dihapus).
- Diubah: `public/sw.js` (`pesan.js` masuk daftar cache, versi cache `chata-v10` jadi `chata-v11`; baris lama dijadikan komentar). "OK" ketua untuk `sw.js` sudah diberikan lewat PIC.

**Keputusan baru** (pilihan penulis; alasan belum tercatat dari ketua kecuali disebut):

- Keranjang disimpan di `pesan.js` (bukan di daftar menu), karena `kerangka.js` memuat ulang daftar menu tiap tab Pesan dibuka. Baris keranjang: menu sama dengan kombinasi pilihan berbeda = baris terpisah; kombinasi sama digabung jumlahnya.
- Yang dikirim ke `order_buat`: `tipe`, `alamat_id` (hanya Diantar), `hari` ("Hari ini" atau "Besok"), `jam` (HH:MM), `item` (`menu_id`, `jumlah`, `opsi_ids`), `catatan`. Total di layar hanya perkiraan; angka resmi dari balasan server.
- Alamat antar diambil lewat aksi `status` (`h.data.alamat`), tanpa aksi baru. Satu alamat: langsung terpilih. Lebih dari satu: customer wajib memilih sendiri (hindari salah antar). Kembali dari Buku alamat, daftar alamat dimuat ulang otomatis.
- Jam wajib diisi (pemilih jam bawaan HP), tanpa daftar dan tanpa batas (O2). Label jam mengikuti tipe (Jam antar, Jam ambil, Jam datang).
- Tombol Kirim dikunci sejak ditekan sampai balasan datang; keranjang dikosongkan begitu order berhasil.
- Jaringan putus setelah permintaan terkirim (hasil tidak pasti): pesan "Belum bisa memastikan pesanan sudah terkirim. Jangan kirim ulang dulu: hubungi ChATA lewat WhatsApp untuk memastikan, supaya tidak dobel." Offline dari awal: pesan lain ("Pesanan belum terkirim"). Sesudah ORD.04 ada, pesan ini bisa diganti agar menyuruh cek di Pesanan Saya.
- Galat 404 atau 409 yang berisi "Muat ulang menu" membuat daftar menu dimuat ulang otomatis; galat alamat tidak ditemukan membuat daftar alamat dimuat ulang.
- Teks O21 ada di `pesan.js` dan dibuka lewat `window.KedaiPesan.teksBayar` supaya ORD.04 memakai teks yang sama.
- Temuan dari kode (bukan keputusan baru): satu menu boleh punya beberapa grup (`menu_grup_atur`, ada batas jumlah grup), dan tiap grup punya tepat satu pilihan bawaan, jadi customer memilih **satu opsi per grup**.
- Batas item, jumlah per item, dan panjang catatan **tidak terbaca di aplikasi**: `status` hanya mengirim `alamat_maks` (`PENGATURAN_AMAN` di `kedai/index.ts`). Server yang menolak dan pesannya ditampilkan. Menambah batas ke `PENGATURAN_AMAN` berarti mengubah dan men-deploy `kedai` (berisiko, butuh "OK" ketua); ditunda.

**Kontrak untuk giliran 2** (`window.KedaiPesan.tambah(menu, pilihan, jumlah)`, sudah ada di `pesan.js`):

- `menu`: `{ id (teks uuid), nama, harga }`. `pilihan`: daftar `{ id (uuid opsi), teks ("Nama grup: Nama opsi") }`, satu per grup, **urut seperti grup di menu**; menu tanpa grup memakai daftar kosong. `jumlah`: bilangan bulat >= 1 (kosong = 1). Mengembalikan `true` bila masuk keranjang, `false` bila bentuknya salah.
- Yang dikirim ke server dari `pilihan` hanya `id`-nya (`opsi_ids`). Teks hanya untuk tampilan di keranjang; susunan teks resmi disusun server.

**Yang perlu dikerjakan di giliran 2:**

- `menu.js`: `bacaGrupPelanggan` sekarang **membuang `id` grup dan id opsi**. Ubah agar id ikut terbawa (komentar di berkas ini menyebut bentuk dari server `[{ id, nama, opsi: [{ id, nama, bawaan }] }]`, **belum diverifikasi dengan balasan asli**; cek di tes). Di `buatKartuPelanggan` ("ORD: tombol pilih menu dan jumlah dipasang di sini"): tombol Tambah hanya untuk menu Tersedia. Menu tanpa grup langsung memanggil `KedaiPesan.tambah`; menu dengan grup membuka sheet detail untuk memilih. Ketukan pada tombol di dalam kartu sudah tidak membuka sheet (pengecekan `closest("button, a, input")` sudah ada).
- `menu-detail.js`: sheet kini hanya menampilkan. Tambah pilihan satu per grup (bawaan sudah terpilih), jumlah, dan tombol "Tambah ke pesanan" yang memanggil `KedaiPesan.tambah`, lalu menutup sheet. Menu Habis tanpa tombol. **Aturan Tab di `tekanTombol` menahan fokus di tombol X saja** (komentarnya sudah menyebut ini harus disesuaikan saat tombol pilih ditambah). Semua teks lewat `textContent`.
- `style.css`: hanya bila perlu (daftar pilihan di sheet, tampilan jumlah). Kelas yang sudah ada dan dipakai `pesan.js`: `.kartu`, `.menu-nama`, `.menu-harga`, `.isian*`, `.tombol*`, `.baris-tombol`.

**Belum beres:**

- **Belum dikonfirmasi:** (a) cek Keluar lalu Masuk lagi sebagai customer tanpa galat setelah giliran 1 (tab Pesan sudah tampil normal di HP uji); (b) keempat berkas di atas sudah di-push lewat tiga cek aman (`AGENTS.md` bagian 8); (c) tes PWA untuk `sw.js` `chata-v11`: versi baru muncul di HP, dan aplikasi tetap terbuka offline. `pesan.js` dan `sw.js` harus naik dalam satu commit (kalau `sw.js` naik duluan, pemasangan service worker baru gagal karena `pesan.js` belum ada).
- **`pesan.js` baru diperiksa sintaksisnya, belum pernah dijalankan.** Tes sungguhan baru bisa setelah giliran 2. Tes ORD.03 (High-Risk, di HP Android dummy): order sah menu tanpa grup dan menu dengan dua grup (cek id opsi terkirim dan teks pilihan di `order_detail`); tipe Diambil dan Makan di warung tanpa alamat; Diantar tanpa alamat dipilih ditolak di layar; jam kosong ditolak; Kirim ditekan dua kali cepat hanya membuat satu order; menu jadi Habis saat Kirim (pesan server tampil dan daftar menu dimuat ulang); offline; Keluar mengosongkan keranjang dan alamat. **SEC-19 (jam HP digeser, cek `hari_target`) tetap di ORD.14.**
- Tidak ada layar untuk melihat order yang baru dikirim (ORD.04 belum ada); verifikasi order lewat `order_daftar` dan `order_detail` di konsol (`window.KedaiAkun.panggilKedai`).
- Opsional (belum diputuskan): setelah galat "menu habis", baris keranjang yang bersangkutan belum ditandai. Customer harus mencarinya sendiri. Bisa diatasi dengan `KedaiMenu` membuka status menu terbaru ke `pesan.js`.
- `pesan.js` 765 baris, melewati kebiasaan "di bawah ~500 baris". Bila mau dipecah, bagian alamat paling mudah dipisah.
- **Data uji (dummy) akan bertambah** (order uji dari tes ORD.03), tidak bisa dihapus, dibersihkan di LNC.01 bersama reset nomor order.

**Saran giliran berikutnya:** giliran 2 ORD.03 (lampirkan `AGENTS.md` + `order.md` yang sudah memuat handoff ini + berkas terbaru dari repo: `pesan.js`, `menu.js`, `menu-detail.js`, `style.css`, `kerangka.js`). Mulai dengan konfirmasi tiga butir "Belum dikonfirmasi" di atas. Setelah giliran 2 dan tes lulus, ORD.03 selesai (pengingat centang di sheet). Berikutnya ORD.04 (Pesanan Saya), yang memakai `KedaiPesan.teksBayar` dan mengganti pesan "hasil tidak pasti" di `pesan.js`.

### Handoff #5 | 2026-11-08 | [FREN]

**Berkas tujuan:** `docs/order.md` bagian 9, ditempel paling bawah (di bawah Handoff #4). Yang paling akhir menang.

**Pertentangan dengan blok lama:** Handoff #4 menulis keadaan awal form "jam kosong". Untuk tipe **Diantar** itu **tidak berlaku lagi** (lihat keputusan ketua di bawah). Diambil dan Makan di warung tetap kosong. Jam tetap **wajib diisi** untuk semua tipe.

**Tugas:** ORD.03 (layar customer Pesan) giliran 2 selesai: tombol Tambah di kartu menu, pilihan dan jumlah di sheet detail, lalu masuk keranjang. Tiga butir "Belum dikonfirmasi" Handoff #4 (Keluar lalu Masuk, push empat berkas giliran 1 dengan email commit ketua, PWA `chata-v11` dan offline) sudah lulus.

**Berkas diubah** (semuanya di `public/`; tidak ada berkas baru, `sw.js` tidak diubah; tidak ada kode lama dihapus, baris yang diganti dijadikan komentar):

- `menu.js`: id grup dan id opsi ikut terbaca; tombol Tambah (menu tanpa grup, langsung masuk keranjang jumlah 1, lalu "Ditambahkan ✓" sebentar) atau Pilih (menu dengan grup, membuka sheet). Hanya menu Tersedia.
- `menu-detail.js`: satu pilihan per grup (bawaan terpilih), jumlah, tombol "Tambah ke pesanan" yang memanggil `KedaiPesan.tambah`, lalu sheet menutup. Menu Habis tetap hanya tampil. Tab berputar di antara kontrol sheet.
- `pesan.js` (788 baris; Handoff #4 menulis 765, selisih tidak dijelaskan): jam bawaan Diantar dan tombol pesanan melayang.
- `style.css`: tambahan di akhir berkas untuk tombol Tambah, pilihan, jumlah, dan tombol melayang.
- `kerangka.js` tidak diubah. Berkas `kerangka_1.js` hanya salinan identik, **jangan ikut di-push** (cek `git status`).

**Keputusan baru dari ketua:**

- **Jam bawaan Diantar 11:00 (WIB), terisi otomatis, customer tetap bisa mengubah.** Diambil dan Makan di warung kosong dan wajib diisi. Dikerjakan di frontend saja karena mengubahnya di server berarti merombak fungsi SQL; server tetap menerima jam apa pun (O2). Alasan lain belum tercatat.
- **Tombol pesanan bulat melayang dengan emoji keranjang, ikut layar saat digulir, di atas navigasi bawah.** Alasan ketua: supaya tidak menabrak tombol navigasi.

**Keputusan baru pilihan penulis** (alasan belum tercatat dari ketua):

- Jam bawaan 11:00 dikosongkan lagi saat tipe pindah ke Diambil atau Makan di warung, **selama customer belum menyentuh jamnya**. Jam yang diketik atau diubah customer tidak pernah ditimpa. Pindah balik ke Diantar dengan jam kosong: terisi 11:00 lagi. Setelah order terkirim atau Keluar: kembali ke Diantar dengan 11:00.
- Angka 11:00 ditulis di kode (`JAM_BAWAAN_ANTAR` di `pesan.js`) atas permintaan ketua. AGENTS bagian 1 menyebut angka yang bisa berubah idealnya di database; memindahkannya butuh ubah dan deploy `kedai` (berisiko, butuh "OK" ketua), jadi **ditunda**.
- Tombol melayang dipasang dari `pesan.js` ke dalam panel Pesan, tampil hanya di langkah menu dan bila keranjang tidak kosong, dengan lencana jumlah item. Tombol "Lihat pesanan" lama di `index.html` **disembunyikan, bukan dihapus**; teks ringkasan keranjang tetap tampil. Posisi: 76 px di atas dasar layar, z-index 12 (di bawah sheet detail, 30).
- Sheet detail: satu opsi per grup (bawaan terpilih), jumlah 1 sampai 9999 (hanya bentuk data; batas sebenarnya di server).

**Hasil tes** (bukti diperiksa di chat, tidak disimpan):

- Server: harga dan total dihitung server dengan benar; tipe Diantar punya alamat, Diambil dan Makan di warung tanpa alamat; jam bawaan 11:00 tersimpan; `hari_target` benar. Pilihan menu tersimpan di `order_detail`, termasuk opsi **non-bawaan** ("Sedang") dan bawaan ("Tidak pedas"); menu tanpa grup pilihannya kosong.
- Layar: tombol Tambah, sheet, jam bawaan, dan tombol melayang dites ketua di Android dan dilaporkan jalan.

**Belum beres:**

- Butir High-Risk ORD.03 yang **belum dibuktikan satu per satu di chat** (ketua melaporkan "semuanya works" di Android, tanpa bukti rinci): Kirim ditekan dua kali cepat hanya membuat satu order; menu jadi Habis saat Kirim (pesan server tampil, menu dimuat ulang); offline; Diantar tanpa alamat ditolak; jam kosong ditolak; Keluar mengosongkan keranjang dan alamat. **Pengingat centang ORD.03 di sheet setelah PIC memastikan butir ini.** SEC-19 tetap di ORD.14.
- Hasil tiga cek aman (folder, `git remote -v`, email commit) untuk push empat berkas giliran 2 **tidak ditempel** ke chat sesi ini; aplikasi sudah dites di production, jadi berkasnya terbit.
- "Hari ini" dipesan setelah jam 11: jam bawaan 11:00 sudah lewat. Sistem tetap menerima; customer mengubah sendiri. Tidak diubah (sesuai aturan ketua).
- Masih terbuka dari Handoff #4: baris keranjang belum ditandai saat galat "menu habis"; `pesan.js` melewati ~500 baris (bagian alamat paling mudah dipisah); batas item, jumlah, dan catatan tidak terbaca di aplikasi (ditunda).
- **Data uji (dummy) bertambah:** order uji nomor 6 sampai 10 (mungkin lebih) di akun customer dummy. Tidak bisa dihapus, dibersihkan di LNC.01 bersama reset nomor order.

**Saran giliran berikutnya:** ORD.04 (Pesanan Saya). Lampirkan `AGENTS.md` + `order.md` (sudah memuat handoff ini) + berkas terbaru dari repo: `pesan.js`, `kerangka.js`, `index.html`, `style.css`. ORD.04 memakai `KedaiPesan.teksBayar` dan mengganti pesan "hasil tidak pasti" di `pesan.js` agar menyuruh cek Pesanan Saya. Konsol `order_daftar` dan `order_detail` sudah terbukti bentuknya (isian `order_detail` bernama `id`). ORD.05 tetap butuh penjelasan dampak dan "OK" ketua.

### 2026-11-08: ORD.03 lulus

**Berkas tujuan:** `docs/order.md` bagian 9 (tempel paling bawah, di bawah Handoff #5). Yang paling akhir menang.

**Pertentangan dengan blok lama:** butir "Belum beres" Handoff #5 tentang butir High-Risk ORD.03 yang belum dibuktikan **tidak berlaku lagi** untuk kirim dobel dan menu Habis saat Kirim (lihat di bawah). Butir lain di Handoff #5 tetap berlaku.

- **ORD.03 selesai dan lulus.** Pengingat: butir ini sudah selesai, silakan dicentang di sheet.
- **Terbukti dengan balasan server** (diperiksa di chat, tidak disimpan):
  - Kirim ditekan tiga kali beruntun lewat konsol hanya membuat **satu** order (#13), tidak ada #14.
  - Menu jadi Habis saat Kirim: server menolak dengan pesan "Ada menu yang sedang habis atau tidak tersedia. Muat ulang menu lalu coba lagi.", **tidak ada order terbentuk** (nomor berikutnya tidak loncat), daftar menu dimuat ulang otomatis, dan menu Habis tampil tanpa tombol Tambah.
  - Pilihan menu tersimpan di `order_detail`, termasuk opsi **non-bawaan** ("Sedang") dan bawaan ("Tidak pedas"); menu tanpa grup pilihannya kosong.
  - Harga dan total dihitung server; tipe Diantar punya alamat, Diambil dan Makan di warung tanpa alamat; jam bawaan Diantar 11:00 dan hari target benar.
- **Dilaporkan ketua jalan di Android, tanpa bukti rinci di chat** (butir layar): offline, Diantar tanpa alamat ditolak, jam kosong ditolak, Keluar mengosongkan keranjang dan alamat, tombol pesanan melayang. Tidak diulang.
- **Data uji (dummy) bertambah sampai order #14.** Tidak bisa dihapus, dibersihkan di LNC.01 bersama reset nomor order. Es teh manis sudah dikembalikan ke Tersedia.
- **Masih terbuka (tidak berubah):** baris keranjang belum ditandai saat galat menu habis; `pesan.js` melewati ~500 baris; SEC-19 tetap di ORD.14.
- **Berikutnya:** ORD.04 (Pesanan Saya), lihat saran giliran berikutnya di Handoff #5.

### 2026-11-08: Owner boleh membatalkan setelah Disetujui, dan aksi Alih hari

**Berkas tujuan:** `docs/order.md` bagian 9 (tempel paling bawah). Sumber: keputusan ketua lewat PIC, 8 Nov 2026. Push: lihat juga blok "Push untuk batal oleh owner dan alih hari" di `docs/notifikasi.md` bagian 9. Yang paling akhir menang.

**Pertentangan dengan blok lama:**

- O9, bagian 7, dan bagian 8 poin 3 ("setelah Disetujui tanpa tombol batal untuk siapa pun") **tidak berlaku lagi untuk owner**. Customer dan penjaga tetap tanpa tombol batal setelah Disetujui.
- Tabel jalur status dan O5: Dibatalkan kini juga bisa dari Disetujui, Diproses, dan Diantar/Siap diambil/Siap disajikan (oleh owner), tidak hanya dari Menunggu.
- O10: mundur satu langkah tetap berlaku. Alih hari adalah pengecualian tersendiri (lihat di bawah).
- ORD.04 sebelumnya hanya layar. Kini juga memuat fungsi SQL dan aksi `order_batal` (belum pernah dibuat) dan menjadi ⚠️.

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

**Belum beres:**

- Pagar antar-kolom tabel `order` (Handoff #1) membatasi metode bayar, pemutus, dan alasan menurut status. **Belum dicek** apakah menolak order Dibatalkan yang sudah punya metode bayar, pemutus, atau alasan. Bila menolak, perlu migration baru (⚠️, butuh "OK" ketua). Dicek di awal ORD.04 dengan `20261108_order.sql`.
- "Hanya Besok" dihitung dari tanggal server saat aksi (bawaan): order yang hari targetnya sudah Besok tidak bisa dialihkan lagi. Perlu konfirmasi ketua.
- Penjaga yang sedang membuka detail order lalu menekan tombol status saat order sudah dibatalkan: balasan server mengikuti kode yang ada (order tidak ditemukan); perilaku persisnya diuji di ORD.14.
- Alasan keputusan di luar yang disebut di atas: alasan belum tercatat.

- **Catatan nama berkas:** `supabase/migrations/20261108_order_batal.sql` (Handoff #1) adalah SQL pembatalan migration ORD.01, **bukan** fungsi `order_batal`. Fungsi dan aksi `order_batal` belum ada dan dikerjakan di ORD.04.

### Handoff #6 | 2026-11-08 | KETUA

**Berkas tujuan:** `docs/order.md` bagian 9, ditempel paling bawah (di bawah blok "Owner boleh membatalkan setelah Disetujui, dan aksi Alih hari"). Yang paling akhir menang.

**Pertentangan dengan blok lama:** butir "Belum beres" pertama pada blok "Owner boleh membatalkan setelah Disetujui" (pagar antar-kolom tabel `order` belum dicek untuk order Dibatalkan) **sudah tidak berlaku**: sudah dicek, pagar memang menolak, dan sudah dilonggarkan (lihat di bawah). Butir lain pada blok itu tetap berlaku.

**Tugas:** ORD.04 **belum selesai, jangan dicentang di sheet.** Bagian server selesai dan lulus tes: fungsi SQL `order_batal` (giliran 1) dan aksi `order_batal` di `kedai` (giliran 2). **Yang tersisa: layar Pesanan Saya (giliran 3), diteruskan ke adik ketua.**

**Berkas diubah:**

- Baru: `supabase/migrations/20261108_03_order_batal_fungsi.sql`, `supabase/migrations/20261108_03_order_batal_fungsi_batal.sql`, `supabase/templates/20261108_03_order_batal_fungsi_cek.sql`. Dijalankan di SQL Editor dengan "OK" ketua ("Success. No rows returned"), dicek lulus empat bagian. Di-push (commit `9e257c0`).
- Diubah: `supabase/functions/kedai/index.ts` (hanya tambahan 72 baris: komentar kepala, `PETA_GALAT_ORDER_BATAL`, `aksiOrderBatal`, satu `case`; tidak ada baris lama dihapus atau diubah). Di-deploy ke project ChATA **tanpa** `--no-verify-jwt` lewat urutan aman bagian 8, token CLI sudah dibersihkan (dicek `[]`). Di-push (commit `429d1a0`).

**Keputusan baru** (ketua menyetujui keempatnya; alasan belum tercatat):

- **Tiga pagar di tabel `order` dilonggarkan** (`order_metode_status_cek`, `order_pemutus_cek`, `order_alasan_cek`). Dibatalkan boleh membawa metode bayar dan pemutus (keduanya sama-sama ada atau sama-sama kosong), dan alasan boleh ada pada Ditolak dan Dibatalkan. Aturan lain tidak berubah.
- **Alasan batal disimpan di kolom `alasan_tolak` yang sudah ada** (bukan kolom baru), sehingga `order_daftar` dan `order_detail` tidak diubah dan alasannya langsung tampil ke customer. Isi kolom itu kini bisa alasan tolak **atau** alasan batal.
- **Order yang dibatalkan owner tetap menyimpan metode bayar dan pemutus** (berguna untuk pengembalian uang lewat WA). Siapa yang membatalkan dan dari status apa ada di `riwayat_status` (hanya terlihat owner).
- **Alasan dari customer diabaikan** (O8: alasan hanya untuk owner). Alasan owner juga disalin ke `riwayat_status.keterangan`.

Pilihan penulis tanpa keputusan ketua (alasan belum tercatat): `order_batal` tidak mengembalikan id pemesan (bahan push NTF.06 ditambahkan nanti bila perlu); kode galat baru `peran_tidak_boleh`, `alasan_terlalu_panjang`, `sudah_diproses`, `tidak_bisa_dibatalkan`.

**Kontrak untuk layar (giliran 3):**

- Aksi `kedai`: `order_batal` dengan isian `{ id, alasan }` (`id` = id order; `alasan` hanya dipakai owner). Balasan sukses `{ ok: true, order: { id, nomor, status: "Dibatalkan", status_asal, oleh_peran } }`. Balasan galat `{ ok: false, pesan }`; **tampilkan `pesan` apa adanya** lewat `textContent`.
- Galat yang mungkin untuk customer: **409** "Pesanan sudah diproses..." (order sudah bukan Menunggu; sebaiknya layar menyegarkan daftar), **404** "Pesanan tidak ditemukan." (bukan miliknya atau tidak ada), 400 id rusak.
- `order_daftar` (isian kosong `{}` untuk customer) membalas `{ ok, daftar }`, terbaru dulu, riwayat lengkap, baris ringkas: `id`, `nomor`, `tipe`, `status`, `hari_target`, `jam_permintaan`, `total`, `alasan_tolak`, `ringkas`. `order_detail` memakai isian bernama **`id`** (bukan `order_id`) dan membalas `{ ok, order }` dengan item, pilihan, catatan, dan `alasan_tolak`. Customer **tidak** menerima `metode_bayar`, `pemutus_nama`, dan riwayat status. Balasan konsol berbentuk `{status, data}`.
- Teks pembayaran O21: `window.KedaiPesan.teksBayar` (dari `pesan.js`), dipakai di detail order Menunggu.
- Alasan tolak dan alasan batal sama-sama ada di `alasan_tolak`; pembedanya adalah `status` (Ditolak atau Dibatalkan).

**Belum beres:**

- **Layar Pesanan Saya belum ada** (ORD.04 giliran 3): daftar riwayat lengkap (O22), detail, status, alasan tolak atau batal, teks O21 pada order Menunggu, tombol Batalkan hanya saat Menunggu (usulan: dengan konfirmasi dulu). Ganti juga pesan "hasil tidak pasti" di `pesan.js` agar menyuruh cek Pesanan Saya (janji Handoff #4). **Berkas JS baru wajib didaftarkan di cache `sw.js`**; perubahan `sw.js` butuh "OK" ketua (lewat WA bila yang giliran bukan ketua, AGENTS.md aturan 12). Berkas JS baru dan `sw.js` harus naik **dalam satu commit** (pelajaran Handoff #4).
- **Layar customer tidak bisa membedakan "dibatalkan customer" dan "dibatalkan owner"**: riwayat status hanya terlihat owner. Petunjuk yang ada: alasan terisi hanya bila owner yang membatalkan. Bila perlu pembeda, itu keputusan ketua.
- **Belum teruji** (menunggu ORD.05 dan ORD.15, masuk ORD.14): owner membatalkan dari Disetujui, Diproses, Diantar/Siap (termasuk alasan tampil ke customer dan pagar baru yang membawa metode bayar dan pemutus); Batal dan Setujui bersamaan (SEC-10). **Pengingat untuk ORD.05:** `order_setuju` dan `order_tolak` wajib mengunci order dengan `SELECT ... FOR UPDATE` seperti `order_batal`, kalau tidak jaminan "satu pemenang" tidak berlaku.
- **Push batal** (customer, owner, penjaga) dipasang di NTF.06, bukan di ORD.04. Sebelum itu, pembatalan berjalan tanpa push.
- **Data uji (dummy):** order #14 sekarang Dibatalkan (milik customer 1). Order uji tidak bisa dihapus; dibersihkan di LNC.01 bersama reset nomor order.

**Hasil tes server** (bukti diperiksa di chat lewat konsol, tidak disimpan; satu akun per peran dan customer kedua, semuanya dummy): customer batal order sendiri saat Menunggu lulus (status Dibatalkan, asal Menunggu, peran customer); alasan palsu dari customer diabaikan (`alasan_tolak` kosong); batal ulang order yang sudah Dibatalkan ditolak 409; id rusak ditolak 400; customer 2 batal order customer 1 dibalas 404 dan daftarnya kosong; penjaga ditolak 403; owner batal order Menunggu ditolak 409 dan order tidak berubah.

**Saran giliran berikutnya:** ORD.04 giliran 3 (layar Pesanan Saya). Lampirkan `AGENTS.md` + `order.md` (sudah memuat handoff ini) + berkas terbaru dari repo: `pesan.js`, `kerangka.js`, `index.html`, `style.css`, `sw.js`, `akun.js`. Setelah layar jadi dan lulus tes (High-Risk untuk tombol Batalkan; layar lain Low-Risk), butir ORD.04 selesai dan baru boleh dicentang di sheet. Berikutnya ORD.05 (`order_setuju` dan `order_tolak`) yang butuh penjelasan dampak dan "OK" ketua.

### Handoff #7 | 2026-11-08 | RAC

**Berkas tujuan:** `docs/order.md` bagian 9, ditempel paling bawah (di bawah Handoff #6). Yang paling akhir menang.

**Pertentangan dengan blok lama:** butir "Belum beres" pertama pada Handoff #6 ("Layar Pesanan Saya belum ada") **sudah tidak berlaku**: layar sudah jadi dan lulus tes. Janji Handoff #4 (mengganti pesan "hasil tidak pasti" di `pesan.js`) juga sudah dipenuhi. Butir lain pada Handoff #6 tetap berlaku.

**Tugas:** ORD.04 **selesai dan lulus tes** (High-Risk untuk tombol Batalkan, bukti diperiksa di chat). Boleh dicentang di sheet.

**Berkas diubah** (semua di `public/`, satu commit `885b3d9`, sudah di-push; "OK" ketua untuk `sw.js` lewat WA):

- Baru: `pesanan.js` (layar Pesanan Saya: daftar, detail, alasan, teks O21, Batalkan dengan konfirmasi). Mengekspor `window.KedaiPesanan` (`tampil`, `reset`).
- Diubah: `index.html` (tambah `panel-pesanan` dan `<script src="pesanan.js">`), `kerangka.js` (tab Pesanan Saya memakai panel baru; `tampil` dipanggil saat tab dibuka dan lewat Segarkan, `reset` saat Keluar), `pesan.js` (`PESAN_TIDAK_PASTI` kini menyuruh cek Pesanan Saya lalu Segarkan), `sw.js` (`pesanan.js` masuk `DAFTAR_CACHE`, `chata-v11` naik ke `chata-v12`). Baris lama dijadikan komentar, tidak ada yang dihapus.
- `style.css` tidak diubah (semua kelas yang dipakai sudah ada).

**Keputusan baru:**

- Tombol Batalkan memakai kartu konfirmasi "Yakin batalkan?" dulu (disetujui RAC; alasan: pembatalan tidak bisa dihidupkan lagi).
- Pilihan penulis tanpa keputusan ketua (alasan belum tercatat): tombol Batalkan hanya pada status Menunggu; nomor WA pemesan tidak ditampilkan; teks O21 hanya pada Menunggu; layar tidak mengurutkan ulang daftar (mengikuti urutan server); Segarkan pada halaman detail menyegarkan detail itu.

**Belum beres (usulan, keputusan ketua):**

- **Pesan galat 409 menyesatkan.** Saat customer membatalkan order yang sudah Dibatalkan (tes dua tab), server membalas "Pesanan sudah diproses, jadi tidak bisa dibatalkan dari sini. Segarkan daftar pesanan atau hubungi ChATA lewat WhatsApp." Untuk order yang sudah Dibatalkan, kata "diproses" keliru. Teks ini berasal dari server, bukan dari layar. Usulan: balasan terpisah untuk order yang sudah Dibatalkan, misalnya "Pesanan ini sudah dibatalkan.", sedangkan Disetujui dan seterusnya tetap "sudah diproses". Perubahannya di `supabase/functions/kedai/index.ts` (`PETA_GALAT_ORDER_BATAL`) dan/atau fungsi SQL `order_batal`; perlu "OK" ketua dan deploy lewat urutan aman bagian 8. Layar tidak perlu diubah.
- **Urutan daftar customer.** Sekarang semua status terbaru dulu, urutannya datang dari server (`order_daftar`); layar tidak mengurutkan. Usulan: Dibatalkan (dan Ditolak, bila ketua setuju) ditaruh paling akhir, di bawah order aktif dan Selesai. Ini menyentuh keputusan O22, jadi perlu keputusan ketua. Dua jalan: (a) ubah `ORDER BY` di `order_daftar` untuk peran customer (migration baru ⚠️, "OK" ketua), atau (b) pisahkan di `pesanan.js` tanpa menyentuh server (cepat, tetapi aturan urutan jadi tersebar di dua tempat). Disarankan (a) supaya aturan urutan tetap di server seperti untuk owner dan penjaga.
- **Pembeda "dibatalkan customer" dan "dibatalkan owner"** di layar customer masih belum ada (sama seperti Handoff #6; petunjuk hanya alasan terisi atau kosong).
- **Catatan** (`catatan`) belum ditampilkan di detail; menunggu ORD.10.
- **Belum teruji:** pesan galat khusus Pesanan Saya saat koneksi putus ketika layar sudah terbuka (tes offline hanya memunculkan layar "Tidak ada internet" bawaan aplikasi, tanpa crash); owner membatalkan dari Disetujui sampai Diantar/Siap dan alasannya tampil ke customer (menunggu ORD.05 dan ORD.15, masuk ORD.14).
- Kosmetik: variabel `pernahMuatDaftar` di `pesanan.js` tidak terpakai, boleh dibersihkan kapan saja.
- **Data uji (dummy):** order #11, #12, #13, #14 kini Dibatalkan (milik customer 1). Dibersihkan di LNC.01 bersama reset nomor order.

**Hasil tes** (bukti di chat): batal order Menunggu sendiri lulus (kartu konfirmasi, status Dibatalkan, tombol dan teks O21 hilang; #12 dan #13); batal dari tab basi ditolak server dan status di layar ikut tersegarkan (#11); customer 2 mendapat 404 untuk `order_detail` dan `order_batal` milik customer 1 dan daftarnya kosong; offline tidak crash; Keluar lalu masuk sebagai customer 1 menampilkan 14 pesanan miliknya saja; `chata-v12` aktif, `chata-v11` terbuang, `pesanan.js` ada di cache, aplikasi tetap terbuka saat offline.

**Saran giliran berikutnya:** (1) keputusan ketua untuk dua usulan di atas (teks 409 dan urutan daftar); keduanya kecil dan bisa dikerjakan sebelum atau bersama ORD.05. (2) ORD.05 (`order_setuju` dan `order_tolak`), yang butuh penjelasan dampak dan "OK" ketua, dan **wajib** mengunci order dengan `SELECT ... FOR UPDATE` seperti `order_batal`. Lampirkan `AGENTS.md` + `order.md` (sudah memuat handoff ini) + `supabase/functions/kedai/index.ts` + migration terbaru.

### 2026-11-08: Perbaikan pesan 409 `order_batal` dan urutan daftar customer

**Berkas tujuan:** `docs/order.md`, ditempel paling bawah (di bawah Handoff #7). Yang paling akhir menang.

**Pertentangan dengan blok lama:** dua butir "Belum beres" pada Handoff #7 ("Pesan galat 409 menyesatkan" dan "Urutan daftar customer") **sudah diputuskan ketua**, lihat di bawah. Butir lain pada Handoff #7 tetap berlaku.

**Keputusan ketua:**

- **Pesan 409 diperbaiki.** Order yang sudah **Dibatalkan** dibalas "Pesanan ini sudah dibatalkan." (customer dan owner). Order yang sudah **Ditolak** (customer) dibalas "Pesanan ini sudah ditolak sebelumnya, jadi tidak bisa dibatalkan lagi. Hubungi tim ChATA lewat WhatsApp bila perlu." Disetujui sampai Selesai (customer) dan status lain (owner) tetap memakai pesan lama.
- **Urutan daftar customer dibiarkan seperti sekarang** (semua status, terbaru dulu, urutan dari server). Usulan memindahkan Dibatalkan dan Ditolak ke bawah **tidak dikerjakan**; O22 tidak berubah. Alasan belum tercatat (ketua menyebut "dulu", jadi boleh dibuka lagi nanti).

**Yang dikerjakan:**

- Diubah: `supabase/functions/kedai/index.ts` (hanya tambahan: dua pemetaan `sudah_dibatalkan` dan `sudah_ditolak` di `PETA_GALAT_ORDER_BATAL`, plus komentar kepala). Di-deploy ke project ChATA tanpa `--no-verify-jwt` lewat urutan aman bagian 8; token CLI sudah dibersihkan (dicek `[]`). Commit `9ea7cc9`.
- Baru: `supabase/migrations/20261108_04_order_batal_pesan.sql` (fungsi `order_batal` versi baru: kode galat `sudah_dibatalkan` untuk customer dan owner, `sudah_ditolak` untuk customer; baris lama dijadikan komentar), `supabase/migrations/20261108_04_order_batal_pesan_batal.sql` (pembatal: kembali ke fungsi versi 20261108_03), `supabase/templates/20261108_04_order_batal_pesan_cek.sql`. Dijalankan di SQL Editor dengan "OK" ketua ("Success. No rows returned"). Commit `92b6252`.
- Tidak berubah: siapa boleh membatalkan, urutan pengecekan (order milik orang lain dicek paling dulu), penguncian `FOR UPDATE`, riwayat status, hak `EXECUTE` (hanya `service_role`), semua tabel dan data. Layar tidak diubah.
- Pilihan penulis (alasan belum tercatat): nama kode galat `sudah_dibatalkan` dan `sudah_ditolak`.

**Hasil tes** (bukti di chat): cek SQL bagian 1 sampai 4 lulus (fungsi `SECURITY DEFINER` dengan `search_path` kosong, `EXECUTE` hanya `service_role`, isi fungsi memuat kode baru dan lama serta `FOR UPDATE`, jumlah order per status tidak berubah); customer membatalkan order yang sudah Dibatalkan dari tab basi mendapat "Pesanan ini sudah dibatalkan." dan status di layar tetap Dibatalkan (#10); customer 2 membatalkan order milik customer 1 mendapat 404 "Pesanan tidak ditemukan." (tidak ada kebocoran status); owner (lewat konsol) membatalkan order yang sudah Dibatalkan mendapat 409 "Pesanan ini sudah dibatalkan."; membatalkan order Menunggu dengan fungsi baru tetap sukses.

**Belum teruji:** pesan untuk order **Ditolak** (customer), karena order Ditolak baru ada setelah ORD.05. Masukkan ke tes ORD.05.

**Data uji (dummy):** order #10 sampai #14 kini Dibatalkan (milik customer 1). Dibersihkan di LNC.01 bersama reset nomor order.

### Handoff #8 | 2026-11-08 | [Ketua]

**Berkas tujuan:** `docs/order.md` bagian 9, ditempel paling bawah (di bawah blok "2026-11-08: Perbaikan pesan 409..."). Yang paling akhir menang.

**Pertentangan dengan blok lama:** dua butir "Belum beres" pertama pada Handoff #7 (pesan 409 dan urutan daftar customer) sudah diputuskan dan selesai, lihat blok 2026-11-08 di atas. Butir lain pada Handoff #7 tetap berlaku.

**Tugas:** perbaikan pesan 409 `order_batal` **selesai dan lulus tes**. ORD.04 tetap selesai. Tidak ada butir sheet baru yang perlu dicentang.

**Berkas diubah** (commit `9ea7cc9`, `92b6252`, `39e92b1`, semua sudah di-push): `supabase/functions/kedai/index.ts` (sudah dideploy), `supabase/migrations/20261108_04_order_batal_pesan.sql` (sudah dijalankan), `..._batal.sql` (pembatal), `supabase/templates/20261108_04_order_batal_pesan_cek.sql`, dan `docs/order.md`. Tidak ada berkas di `public/` yang berubah.

**Keputusan baru:** wording pesan 409 untuk Dibatalkan dan Ditolak; urutan daftar customer dibiarkan seperti sekarang. Rincian di blok 2026-11-08 di atas.

**Perhatian untuk ORD.05:**

- Versi terbaru fungsi `order_batal` ada di **`20261108_04_order_batal_pesan.sql`**, bukan versi 03. Bila ORD.05 menyentuhnya, pakai versi 04 sebagai dasar.
- `order_setuju` dan `order_tolak` **wajib** mengunci order dengan `SELECT ... FOR UPDATE` seperti `order_batal` (O7, SEC-10).
- Order Ditolak akan mulai ada setelah ORD.05. Pesan "sudah ditolak sebelumnya" (`sudah_ditolak`) **belum pernah dites**; masukkan ke tes ORD.05 (customer membatalkan dari tab basi setelah owner menolak).
- Perubahan berisiko (fungsi SQL, `kedai`) butuh "OK" ketua. Bila yang bertugas bukan ketua, AI memberi ringkasan untuk diteruskan lewat WA (AGENTS.md aturan 12).

**Masih terbuka (tidak menghalangi ORD.05):** pembeda "dibatalkan customer" dan "dibatalkan owner" di layar customer (usul: putuskan bersama ORD.15); catatan di detail menunggu ORD.10; tes owner membatalkan dari Disetujui sampai Diantar/Siap masuk ORD.14; tes pesan galat saat koneksi putus (P2, opsional); kosmetik variabel `pernahMuatDaftar` di `pesanan.js` (tidak terpakai).

**Data uji (dummy):** order #10 sampai #14 Dibatalkan (milik customer 1), dibersihkan di LNC.01.

**Saran giliran berikutnya:** ORD.05 (`order_setuju` dan `order_tolak`). Lampirkan `AGENTS.md` + `order.md` (sudah memuat handoff ini) + `supabase/functions/kedai/index.ts` + migration terbaru (`20261108_04_order_batal_pesan.sql`).

### Handoff #9 | 2026-11-08 | [RAC]

**Berkas tujuan:** `docs/order.md` bagian 9, ditempel paling bawah (di bawah Handoff #8). Yang paling akhir menang.

**Pertentangan dengan blok lama:**

- Butir "Perhatian untuk ORD.05" pada Handoff #8 **sudah terpenuhi**: `order_setuju` dan `order_tolak` mengunci order dengan `SELECT ... FOR UPDATE`, dan pesan `sudah_ditolak` (customer membatalkan order Ditolak) **sudah dites dan lulus**. Butir "belum teruji" untuk pesan order Ditolak pada blok 2026-11-08 (perbaikan pesan 409) **tidak berlaku lagi**.
- Pengingat "ORD.05 wajib FOR UPDATE" pada Handoff #6 dan #7 **terpenuhi**.
- Butir lain pada Handoff #8 tetap berlaku.

**Tugas:** ORD.05 **selesai dan lulus tes** (High-Risk, bukti diperiksa di chat). Sudah dicentang di sheet. Baris SEC di sheet **sengaja belum dicentang** (jadwalnya setelah ORD.14; ORD.05 baru menutup sebagian SEC-07, SEC-08, SEC-10, SEC-11).

**Berkas diubah** (commit `8c01d34`, dengan `[skip ci]` sesuai instruksi ketua karena tidak ada berkas `public/` yang berubah; sudah di-push lewat tiga cek aman):

- Baru: `supabase/migrations/20261108_05_order_setuju_tolak.sql` (fungsi `order_setuju` dan `order_tolak`), `supabase/migrations/20261108_05_order_setuju_tolak_batal.sql` (pembatal: hanya menghapus kedua fungsi), `supabase/templates/20261108_05_order_setuju_tolak_cek.sql` (lima bagian cek).
- Diubah: `supabase/functions/kedai/index.ts` (hanya tambahan 106 baris: komentar kepala, `PETA_GALAT_ORDER_KEPUTUSAN`, `aksiOrderSetuju`, `aksiOrderTolak`, dua `case`; tidak ada baris lama yang dihapus atau diubah). Sudah di-deploy ke project ChATA **tanpa** `--no-verify-jwt` lewat urutan aman `AGENTS.md` bagian 8; token CLI sudah dibersihkan (dicek `[]`).
- Migration dijalankan di SQL Editor dengan "OK" ketua (lewat PIC), hasil "Success. No rows returned", lalu dicek lima bagian: SECURITY DEFINER dan `search_path` kosong, `EXECUTE` hanya `service_role` (`anon` dan `authenticated` nol), tidak ada fungsi kembar, keduanya memuat `FOR UPDATE`, data order tidak berubah. Bukti diperiksa di chat dan tidak disimpan.
- Pagar tabel `order` versi `20261108_03` sudah cocok; **tidak ada perubahan tabel**.
- Catatan: query cek bagian 1 awalnya salah menilai `search_path` (false negatif karena tanda kutip escape); sudah diperbaiki di `_cek.sql` (memakai `proconfig @> ARRAY[...]`). Fungsinya sendiri benar.

**Kontrak untuk layar owner (ORD.06):**

- `order_setuju` dengan isian `{ id, metode }` (`metode` persis "Transfer", "Tunai", atau "QRIS"). Sukses: `{ ok: true, order: { id, nomor, status: "Disetujui", status_asal: "Menunggu", metode_bayar } }`.
- `order_tolak` dengan isian `{ id, alasan }` (`alasan` opsional, maks 200 karakter, boleh kosong). Sukses: `{ ok: true, order: { id, nomor, status: "Ditolak", status_asal: "Menunggu" } }`.
- Galat `{ ok: false, pesan }`: tampilkan `pesan` apa adanya lewat `textContent`. Kode yang mungkin: 400 (metode tidak valid, alasan terlalu panjang, id rusak), 403 (bukan owner, akun nonaktif), 404 (order tidak ditemukan), 409 (sudah diproses, sudah ditolak, sudah dibatalkan; layar sebaiknya menyegarkan daftar).
- Customer menerima `alasan_tolak` di daftar dan detail; `metode_bayar`, `pemutus_nama`, dan `riwayat` hanya untuk owner (penjaga melihat `metode_bayar` saja).

**Keputusan baru** (semuanya pilihan penulis; alasan belum tercatat dari ketua):

- Galat order yang bukan Menunggu dibedakan: Disetujui ke atas = `sudah_diproses` (sesuai SEC-10), Ditolak = `sudah_ditolak`, Dibatalkan = `sudah_dibatalkan`. Pesan: "Pesanan sudah diproses. Segarkan daftar pesanan.", "Pesanan ini sudah ditolak.", "Pesanan ini sudah dibatalkan."
- `riwayat_status.keterangan` pada Setujui berisi "Metode bayar: <metode>"; pada Tolak berisi alasan (kosong bila tanpa alasan). **ORD.07 (`order_metode_koreksi`, O23) sebaiknya memakai format keterangan yang sama** supaya metode lama dan baru terbaca konsisten.
- `pemutus_nama` disalin dari `staf.nama_tampilan` saat keputusan (salinan).
- Metode bayar dipangkas spasi lalu dicocokkan persis (huruf besar-kecil dibedakan); alasan tolak yang hanya spasi disimpan kosong.
- Fungsi tidak mengembalikan id pemesan (bahan push ditambahkan di NTF bila perlu).
- Lapis kedua peran di `kedai`: selain owner aktif (customer dan penjaga) dibalas 403 "Aksi ini hanya untuk owner."

**Yang sudah terbukti** (ringkas): customer dan penjaga memanggil setuju/tolak = 403 dan order tidak berubah; penjaga tidak melihat order Menunggu (404) dan melihat order Disetujui dengan metode bayar tanpa nama pemutus dan riwayat; metode kosong, spasi, asing, huruf kecil, bukan teks, dan tanpa isian = 400; id rusak = 400, id tidak ada = 404; setuju sah, setuju dan tolak ulang = 409, metode tidak tertimpa; tolak dengan alasan, alasan 201 karakter = 400, alasan spasi disimpan kosong; setuju atas order Dibatalkan = 409; empat permintaan bersamaan (tiga Setujui, satu Tolak) pada dua order: tepat satu menang, riwayat 2 baris; customer melihat alasan tolak tanpa metode, pemutus, dan riwayat; customer membatalkan order Ditolak, Dibatalkan, dan Disetujui mendapat pesan yang benar.

**Belum beres:**

- **Belum ada layar** untuk Setujui dan Tolak (ORD.06); keduanya baru bisa dipakai lewat konsol (`window.KedaiAkun.panggilKedai`).
- **Push belum ada** untuk setuju dan tolak (NTF); pembatalan, setuju, dan tolak berjalan tanpa push sampai NTF dikerjakan.
- **Masuk ORD.14:** customer Batal dan owner Setujui bersamaan (SEC-10, butuh dua sesi login); skenario Tolak yang menang saat bersamaan (di dua putaran tes yang menang selalu Setujui); owner membatalkan dari Diproses dan Diantar/Siap (menunggu ORD.07 dan ORD.15; dari Disetujui sudah terbukti pada order #9, lihat di bawah).
- Terbukti tidak sengaja: owner membatalkan order **Disetujui** (#9) lewat `order_batal` berhasil, status Dibatalkan, pagar tabel baru menerima order Dibatalkan yang membawa metode bayar dan pemutus.
- Masih terbuka dari blok lama: pembeda "dibatalkan customer" dan "dibatalkan owner" di layar customer (putuskan bersama ORD.15); catatan di detail menunggu ORD.10; pesan galat saat koneksi putus (P2, opsional); variabel `pernahMuatDaftar` di `pesanan.js` tidak terpakai; `pesan.js` melewati ~500 baris.
- **Data uji (dummy) yang berubah** dari tes ORD.05, tidak bisa dihapus, dibersihkan di LNC.01 bersama reset nomor order: #1, #4, #5 Disetujui; #2, #3 Ditolak; #9 Dibatalkan oleh owner. Order lain: #6 sampai #8 Menunggu; #10 sampai #14 Dibatalkan.

**Saran giliran berikutnya:**

1. **ORD.06** (layar owner: Order Masuk, Semua Order, detail dengan Setujui, Tolak, Chat WA; bergantung pada DSN.04). Lampirkan `AGENTS.md` + `order.md` (sudah memuat handoff ini) + berkas terbaru dari repo: `pesanan.js`, `kerangka.js`, `index.html`, `style.css`, `sw.js`, `akun.js`. Berkas JS baru wajib didaftarkan di cache `sw.js` (perubahan `sw.js` butuh "OK" ketua, lewat WA bila yang giliran bukan ketua) dan naik dalam satu commit dengan berkas barunya.
2. **ORD.07** ⚠️ (`order_status`, `order_metode_koreksi`, `order_alih_hari`): butuh penjelasan dampak dan "OK" ketua. Lampirkan `AGENTS.md` + `order.md` + `database.md` + `security.md` + `supabase/functions/kedai/index.ts` + `20261108_05_order_setuju_tolak.sql` (pola terbaru fungsi keputusan owner) + `20261108_04_order_batal_pesan.sql`.

### Handoff #10 | 2026-11-09 | [RAC]

**Berkas tujuan:** `docs/order.md` bagian 9, ditempel paling bawah (di bawah Handoff #9). Yang paling akhir menang.

**Pertentangan dengan blok lama:**

- Saran Handoff #9 butir 1 (ORD.06) **dikerjakan**. Butir 2 (ORD.07) **ditunda ke sesi ketua** (keputusan ketua).
- Catatan sheet ORD.06 menyebut Semua Order "Hari ini dan Besok, filter hari lain". Kini tampilan awalnya memakai **filter bawaan** (lihat Keputusan baru). Hapus filter tetap mengembalikan Hari ini dan Besok.
- `AGENTS.md` bagian 7 dan `security.md` aturan 6 ("waktu hanya dari jam server"): ada **satu pengecualian disengaja**, jam HP hanya dipakai mengisi bawaan kolom filter (lihat Keputusan baru).
- Usul awal "Order Masuk berisi semua order Menunggu dari hari apa pun" **tidak bisa tanpa mengubah server**: `order_daftar` untuk owner tanpa filter hari hanya mengembalikan Hari ini dan Besok (O22). Order Menunggu yang hari antarnya sudah lewat hanya terlihat lewat filter hari di Semua Order. Server tidak diubah.

**Tugas:** ORD.06 (layar owner) **kode selesai dan sudah terpasang di production**, tes sebagian besar lulus. **Belum dicentang di sheet**: tunggu tes "dua owner bersamaan di layar" (lihat Belum beres). Hash commit belum dicatat.

**Berkas diubah** (semuanya di `public/`; tidak ada perubahan SQL, migration, atau `kedai/index.ts`):

- Baru: `public/orderowner.js` (layar Order Masuk dan Semua Order; satu pabrik `buatLayar` dipakai dua kali; ~1080 baris, melewati batas ~500 baris).
- Diubah: `public/index.html` (panel `panel-ordermasuk` dan `panel-semuaorder`, tag `<script src="orderowner.js">` setelah `pesanan.js`), `public/kerangka.js` (tab Order Masuk dan Semua Order ke panel baru, `PANEL`, pemanggilan `tampilMasuk`, `tampilSemua`, dan `reset`), `public/sw.js` (`orderowner.js` masuk daftar cache, `chata-v12` naik ke `chata-v13`; "OK" ketua sudah ada).
- Tidak ada baris lama yang dihapus; baris yang diganti dijadikan komentar.

**Perilaku layar (ringkas):**

- **Order Masuk:** `order_daftar` dengan `{ status: "Menunggu" }` (server membatasi ke Hari ini dan Besok). Detail dari `order_detail`: pemesan, nomor WA, alamat, isi order dan pilihan, **catatan (baca saja)**, dan kartu Keputusan (metode bayar dan nama pemutus) bila sudah diputuskan.
- **Setuju:** wajib pilih Transfer, Tunai, atau QRIS (tombol mati sebelum dipilih), kirim `order_setuju` `{ id, metode }`. **Tolak:** alasan opsional maks 200 karakter, kirim `order_tolak` `{ id, alasan }`. Tombol dikunci sebelum permintaan berangkat. Setelah sukses, detail dimuat ulang dari server. Galat 409 dan 404 menampilkan pesan server lalu memuat ulang detail.
- **Chat WA:** tautan `https://wa.me/<angka>`; tombol tidak tampil bila nomor kosong. Nomor WA tersimpan sudah berawalan 62; normalisasi awalan 0 atau 8 hanya cadangan.
- **Semua Order:** filter Hari (satu tanggal) dan Status (9 status), dikirim ke `order_daftar` hanya saat **Terapkan** atau Segarkan. **Hapus filter** mengosongkan semuanya.
- Order selain Menunggu belum punya tombol aksi (menunggu ORD.07 dan ORD.15). Daftar, detail, nomor WA, alamat, dan isian filter dikosongkan saat Keluar.

**Keputusan baru:**

- **Filter bawaan Semua Order** (ketua, 9 Nov 2026): saat tab dibuka pertama kali sesudah masuk, **Hari = tanggal hari ini menurut jam HP** dan **Status = Menunggu**; owner bebas mengganti. Alasan: tidak mengubah server (dari ketua). Konsekuensi: order **Besok** tidak tampil di bawaan, tetapi tetap terlihat di tab Order Masuk dan lewat Hapus filter. Bawaan terisi sekali sejak masuk dan terisi lagi setelah Keluar. Jam HP tidak dipakai menghitung apa pun di order; server tetap memvalidasi dan menyaring.
- **Nama tombol "Setuju"** (bukan "Setujui") di layar owner, atas permintaan ketua.
- **Pilihan penulis, alasan belum tercatat:** catatan order ikut ditampilkan baca-saja di detail owner (sedikit mendahului ORD.10; menambah catatan dan tanda "Catatan baru" tetap ORD.09 dan ORD.10); waktu catatan ditulis WIB hanya untuk tampilan; layar Order Masuk dan Semua Order memakai kode detail yang sama.

**Yang sudah terbukti** (ringkas, di aplikasi asli dengan akun dummy; bukti diperiksa di chat):

- Order Masuk memuat order Menunggu; detail memuat alamat (Diantar) dan tidak (Diambil); kartu Catatan dan jamnya cocok; Chat WA membuka nomor yang benar.
- Setuju: tombol mati sebelum metode dipilih; QRIS tercatat dengan pemutus; status ikut ke daftar owner (hilang dari filter Menunggu) dan ke customer.
- Tolak dengan alasan: customer melihat alasan tanpa metode bayar, pemutus, dan riwayat; tidak ada tombol Batalkan dan teks O21 setelah Disetujui atau Ditolak.
- Filter bawaan dan filter manual (Hari, Status, Terapkan, Hapus filter, pesan "Tidak ada order yang cocok").
- Customer dan penjaga memanggil `order_setuju` dan `order_tolak` lewat konsol: keduanya **403** "Aksi ini hanya untuk owner."; penjaga hanya melihat order Disetujui ke atas.
- Setelah Keluar: detail dan daftar kedua panel 0, filter kosong, tidak ada nomor WA atau alamat tersisa.

**Belum beres:**

- **Belum dites:** dua owner menekan Setuju bersamaan di layar (pesan 409 di layar owner adalah kode baru; servernya sudah terbukti di ORD.05). Caranya: order baru (#17), dua jendela login owner (satu biasa, satu privat), keduanya buka detail; jendela A Setuju sampai selesai, jendela B Setuju. Yang benar di jendela B: muncul pesan "Pesanan sudah diproses...", lalu detail dimuat ulang menjadi Disetujui tanpa tombol aksi. **ORD.06 dicentang setelah tes ini lulus.**
- **Belum dites (P1 dan P2):** Tolak tanpa alasan, metode Transfer dan Tunai, alasan lebih dari 200 karakter, pesan saat koneksi putus, dan tampilan di HP Android sungguhan (cek sekilas).
- **SEC di sheet sengaja belum dicentang** (jadwal setelah ORD.14). Yang bertambah bukti: SEC-07 dan SEC-08 untuk `order_setuju` dan `order_tolak` oleh customer dan penjaga; SEC-10 sisa tes bersamaan di layar.
- Masih terbuka dari Handoff #9 dan sebelumnya: pembeda "dibatalkan customer" dan "dibatalkan owner" di layar customer (putuskan bersama ORD.15), push belum ada untuk setuju, tolak, dan batal (NTF), variabel `pernahMuatDaftar` di `pesanan.js` tidak terpakai, `pesan.js` dan `orderowner.js` melewati ~500 baris.
- **Data uji (dummy) yang berubah**, tidak bisa dihapus, dibersihkan di LNC.01 bersama reset nomor order: #15 Disetujui (QRIS, diputuskan Owner Uji), #16 Ditolak (alasan dummy). Order lain tidak berubah dari Handoff #9 (#1, #4, #5 Disetujui; #2, #3 Ditolak; #6 sampai #8 Menunggu; #9 sampai #14 Dibatalkan).

**Saran giliran berikutnya:**

1. **Selesaikan tes 409 ORD.06** (singkat, lalu centang ORD.06 di sheet). Lampirkan `AGENTS.md` + `order.md` (sudah memuat handoff ini).
2. **ORD.07** ⚠️ (`order_status`, `order_metode_koreksi`, `order_alih_hari`), **dikerjakan di sesi ketua**: butuh penjelasan dampak dan "OK" ketua. Lampirkan `AGENTS.md` + `order.md` + `database.md` + `security.md` + `supabase/functions/kedai/index.ts` + `20261108_05_order_setuju_tolak.sql` + `20261108_04_order_batal_pesan.sql`. Format keterangan koreksi metode sebaiknya sama dengan "Metode bayar: <metode>" (Handoff #9). "Hanya Besok" untuk alih hari masih perlu konfirmasi ketua (blok 8 Nov).
3. Setelah ORD.07: ORD.15 (tombol aksi owner di layar) dan ORD.08 (layar penjaga).

### Handoff #11 | 2026-11-09 | FREN

**Berkas tujuan:** `docs/order.md` bagian 9, ditempel paling bawah (di bawah Handoff #10). Yang paling akhir menang.

**Pertentangan dengan blok lama:**

- Butir "Belum dites: dua owner menekan Setuju bersamaan" pada Handoff #10 **tidak berlaku lagi**: tes sudah lulus (lihat di bawah). Syarat "ORD.06 dicentang setelah tes ini lulus" terpenuhi.
- Butir "Belum dites (P1 dan P2)" pada Handoff #10: **Tolak tanpa alasan** dan **alasan 200 karakter** sudah dites dan lulus. Yang masih belum: metode Transfer, pesan saat koneksi putus, dan tampilan di HP Android sungguhan.
- Handoff #10 menyebut tidak ada perubahan selain JS dan `sw.js`; kini ada satu perubahan CSS kecil (lihat Berkas diubah). Butir lain pada Handoff #10 tetap berlaku.

**Tugas:** menutup tes ORD.06 dan merapikan tampilan alasan yang panjang. **ORD.06 selesai**, silakan dicentang di sheet bila belum. Baris SEC di sheet tetap belum dicentang (jadwal setelah ORD.14).

**Berkas diubah:**

- `public/style.css`: dua baris tambahan di `.kartu__isi` (satu komentar dan `overflow-wrap: anywhere`). Tidak ada baris lama yang dihapus atau diubah. Berlaku juga untuk catatan dan teks metode bayar yang memakai kelas yang sama.
- Tidak ada perubahan SQL, migration, `kedai/index.ts`, `sw.js` (`style.css` sudah ada di daftar cache), `orderowner.js`, atau `pesanan.js`.
- Sudah terpasang di production dan dicek visual di layar owner dan customer. Hash commit belum dicatat.

**Keputusan baru** (pilihan PIC; alasan belum tercatat dari ketua selain tampilan kepotong):

- Teks alasan panjang tanpa spasi diperbaiki lewat CSS. Kartu tetap selebar layar seperti kartu lain; yang menyesuaikan adalah tingginya (teks turun baris). Alasan pendek tetap satu baris.

**Yang sudah terbukti** (ringkas, di aplikasi asli dengan akun dummy; bukti diperiksa di chat):

- **Dua owner bersamaan (order #17):** jendela A Setuju (Tunai) sukses; jendela B yang masih membuka tab lama menekan Setuju (QRIS) dan mendapat "Pesanan sudah diproses. Segarkan daftar pesanan.", lalu detail dimuat ulang menjadi Disetujui tanpa tombol aksi. Metode bayar tetap Tunai dan pemutus tetap Owner Uji (tidak tertimpa).
- **Tolak dengan alasan:** #18 (191 karakter) dan #19 (tepat 200 karakter, dihitung dengan alat) tersimpan utuh dan tampil di layar owner dan customer.
- **Kolom alasan** membatasi ketikan di 200 karakter (karakter ke-201 tidak masuk). Penolakan server untuk 201 karakter tidak dites lewat layar; sudah terbukti di ORD.05 lewat konsol.
- **Tolak tanpa alasan (#20):** status Ditolak tanpa galat, kartu "Alasan ditolak" tidak tampil.
- **Teks panjang tanpa spasi** turun baris di dalam kartu, di layar owner (#18) dan customer (#19).
- Catatan proses: teks uji pertama ternyata 191 karakter, bukan 201 (salah hitung penulis, bukan temuan aplikasi). Teks uji panjang dihitung dengan alat sebelum dipakai.

**Belum beres:**

- **Belum dites:** tampilan di HP Android sungguhan (bagian ketua), metode Transfer (P1; Tunai dan QRIS sudah terbukti), pesan galat saat koneksi putus (P2, opsional).
- **SEC di sheet belum dicentang.** Bukti bertambah: SEC-10 untuk tes bersamaan di layar owner.
- Masih terbuka dari Handoff #10 dan sebelumnya: pembeda "dibatalkan customer" dan "dibatalkan owner" di layar customer (putuskan bersama ORD.15), push belum ada untuk setuju, tolak, dan batal (NTF), variabel `pernahMuatDaftar` di `pesanan.js` tidak terpakai, `pesan.js` dan `orderowner.js` melewati ~500 baris.
- Order #20 punya hari antar Besok sehingga tidak tampil di Semua Order bawaan (filter hari ini); tetap terlihat di Order Masuk dan lewat Hapus filter. Sesuai keputusan Handoff #10.
- **Data uji (dummy) yang berubah**, tidak bisa dihapus, dibersihkan di LNC.01 bersama reset nomor order: #17 Disetujui (Tunai), #18 Ditolak (alasan 191 karakter), #19 Ditolak (alasan 200 karakter), #20 Ditolak (tanpa alasan, hari antar Besok). Order lain tidak berubah dari Handoff #10 (#15 Disetujui; #16 Ditolak; #1, #4, #5 Disetujui; #2, #3 Ditolak; #6 sampai #8 Menunggu; #9 sampai #14 Dibatalkan).

**Saran giliran berikutnya:**

1. **ORD.07** ⚠️ (`order_status`, `order_metode_koreksi`, `order_alih_hari`), dikerjakan di sesi ketua: butuh penjelasan dampak dan "OK" ketua. Lampirkan `AGENTS.md` + `order.md` (sudah memuat handoff ini) + `database.md` + `security.md` + `supabase/functions/kedai/index.ts` + `20261108_05_order_setuju_tolak.sql` + `20261108_04_order_batal_pesan.sql`. Format keterangan koreksi metode sebaiknya sama dengan "Metode bayar: <metode>" (Handoff #9). "Hanya Besok" untuk alih hari masih perlu konfirmasi ketua.
2. Setelah ORD.07: ORD.15 (tombol aksi owner di layar) dan ORD.08 (layar penjaga).
3. Tes ORD.06 di HP Android oleh ketua (cek sekilas, tidak menghalangi giliran lain).

---
