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
