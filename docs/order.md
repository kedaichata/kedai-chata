/docs/order.md

# 🧾 order.md: Order, Status, Setuju/Tolak, Catatan Berlapis, Order Wakil Owner

> **Versi 1.3 (4 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Perubahan 1.1 sampai 1.3: diagram alur dibuang (yang berlaku adalah md ini) dan daftar push dipindah ke `notifikasi.md` bagian 4 (1.1); tabel catatan dan pelanggan tanpa akun dibuat di ORD.01, bukan ORD.09 dan ORD.11, dan O6 diperjelas: uang tunai boleh dipegang penjaga secara fisik, tetapi hanya owner yang menyetujui (1.2); jam bebas tanpa daftar (O2), mundur satu langkah dan koreksi metode bayar (O5, O10, O23), tanpa tombol batal setelah Disetujui (O9), nomor order berjalan (O18), teks pembayaran setelah Kirim (O21), tampilan daftar (O22) (1.3). Bergantung pada `akun.md` (peran) dan `menu.md` (menu dan harga). Notifikasi ada di `notifikasi.md`, foto di `foto-bukti.md`.
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

### 2026-11-07: Pintu "Pelanggan tanpa akun" ada di Home (owner)

Sumber: `home.md` HM7 dan HOM.04. Item **Pelanggan** ("Pelanggan tanpa akun", O16) untuk owner ada di **Home**, di bagian tersendiri sebelum Pengaturan akun. Tempatnya sudah dibuat dan tampil "Segera" (tidak bisa diketuk). ORD.11 tinggal mengaktifkannya dan membuat layar daftarnya. Wizard Buat Order tetap di tab Buat Order.

### 2026-11-07: Item order menyimpan pilihan menu

Sumber: blok `2026-11-07: Deskripsi, sheet detail, dan pilihan menu` di `docs/menu.md`. Menambah O3 dan O12.

- `order_item` menyimpan **teks pilihan yang disalin** (nama grup dan nama opsi, misal "Tingkat pedas: Tidak pedas"), sama seperti nama dan harga menu disalin. Mengubah atau menonaktifkan grup atau opsi kemudian tidak mengubah order lama.
- Pilihan **selalu tersimpan eksplisit**, termasuk bila customer tidak mengubah bawaan, sehingga penjaga tidak perlu menebak.
- `order_buat` menerima **id menu, jumlah, dan id opsi** per item; server memvalidasi opsi terhadap grup yang terpasang di menu. Harga tetap dihitung server; pilihan gratis tidak mengubah total.
- **Item yang sama dengan pilihan berbeda = baris terpisah** (Mie Ayam Tidak pedas x1 dan Mie Ayam Pedas x1).
- Add-on berbayar adalah item menu biasa; tidak ada hubungan induk di order.
- Penjaga dan owner melihat pilihan di baris item pada detail order.
- Ganti pilihan setelah order dikirim: lewat **catatan baru** (O12) selama belum Diproses (bawaan, sejalan O12).
- Dampak ke urutan: ORD.01 dan ORD.02 memuat pilihan sejak awal, jadi `order_item` tidak perlu diubah setelah terisi.

### Handoff #1 | 2026-11-08 | KETUA

**Tugas:** ORD.01 selesai (migration tabel order): `20261108_order.sql`, pembatal `20261108_order_batal.sql`, dan cek `supabase/templates/20261108_order_cek.sql`. RLS aktif di 6 tabel tanpa policy, hak `service_role` sesuai `database.md` bagian 3 tanpa DELETE, `anon` dan `authenticated` nol, 4 pengaturan terisi.

**Catatan nama berkas:** `20261108_order_batal.sql` adalah SQL pembatalan migration ORD.01, **bukan** fungsi `order_batal` (fungsi itu ada di ORD.04).

**Keputusan baru** (ketua menyetujui bentuk kolom pilihan; selebihnya pilihan penulis, alasan belum tercatat):

- **Pilihan menu di `order_item` = satu kolom daftar teks `pilihan`** (berformat "Nama grup: Nama opsi", tidak boleh kosong tetapi boleh daftar kosong). Alasan ketua: hanya catatan riwayat dan sederhana, sesuai kebutuhan warung. Tanpa tabel tambahan, dan tanpa aturan unik pada (order, menu) karena item sama dengan pilihan beda = baris terpisah.
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

- `order_buat` menerima `tipe`, `alamat_id`, `hari` (teks persis "Hari ini" atau "Besok"), `jam` (HH:MM; jam yang sudah lewat tidak ditolak, O2), `item` (daftar `{menu_id, jumlah, opsi_ids}`), dan `catatan`. Isian lain dari aplikasi dibuang. Tipe selain Diantar: `alamat_id` diabaikan.
- Menu nonaktif atau Habis = satu kode galat `menu_tidak_tersedia`. Item sama dengan pilihan sama yang dikirim dua kali = dua baris. **Tidak ada penahan kirim ganda di server**; tombol Kirim dikunci di layar (ORD.03). Fungsi tidak mengisi `baca_catatan`; tanda "Catatan baru" (ORD.10) menghitung catatan milik orang lain saja.
- `order_daftar`: baris ringkas (tanpa nomor WA dan isi alamat; teks `ringkas` "Nama x jumlah"). Filter hari (tanggal `YYYY-MM-DD`) hanya dipakai owner; filter status untuk semua peran. Urutan owner dan penjaga: hari antar, lalu kelompok (Disetujui sampai siap, Menunggu, Selesai, Ditolak dan Dibatalkan), lalu waktu diputuskan atau dibuat terlama dulu. Customer: terbaru dulu, tanpa pembagian halaman.
- `order_detail`: metode bayar tampil ke owner dan penjaga; nama pemutus dan riwayat status hanya owner. Order yang tidak ada dan yang tidak boleh dilihat memakai satu galat `order_tidak_ditemukan`. Urutan baris item: nama menu lalu pilihan.
- Balasan `kedai`: `order_buat` memuat `order` (`id`, `nomor`, `status`, `total`, `hari_target`, `jam_permintaan`), `order_daftar` memuat `daftar`, `order_detail` memuat `order`.
- `pilihan_rusak` dan `opsi_tidak_valid` dipetakan di `kedai`. Kode `id_kosong`, `pengaturan_rusak`, dan `total_terlalu_besar` sengaja tidak dipetakan (galat umum 500).

### Handoff #3 | 2026-11-08 | KETUA

**Tugas:** ORD.02 **selesai dan lulus tes** (lewat konsol `window.KedaiAkun.panggilKedai`, satu akun per peran + customer kedua, dummy): order sah dengan total dari server, teks pilihan tersalin, isian palsu (total, status, peran, metode bayar, harga) diabaikan, customer kedua tidak bisa melihat order customer lain (404), owner dan penjaga memanggil `order_buat` dibalas 403, penjaga tidak melihat order Menunggu, 11 kasus isian salah ditolak, menu Habis menolak seluruh order tanpa memakai nomor order.

**Keputusan baru:**

- **Tes jam HP (SEC-19) digeser ke ORD.14**, dikerjakan di HP Android dummy setelah ORD.03: geser tanggal HP, pesan lewat layar, cek `hari_target` di detail order. Alasan: aplikasi tidak pernah mengirim jam HP, jadi tes lewat konsol tidak membuktikan apa pun; menggeser jam Mac bersama tidak disarankan (bisa mengganggu login dan SSH).
- Catatan teknis untuk layar: isian `order_detail` bernama **`id`** (bukan `order_id`); balasan konsol berbentuk `{status, data}`.

### 2026-11-08: MT-23 dan MT-24 selesai dan lulus

`docs/menu-test.md` MT-23 dan MT-24 sudah dikerjakan dan lulus lewat `order_buat` (isian palsu diabaikan, opsi di luar grup dibalas 409 tanpa order terbentuk, harga menu diubah kemudian: order lama tetap harga lama). Rincian bukti ada di Handoff #13 `docs/menu.md`. Tidak ada kode yang diubah.

### Handoff #4 | 2026-11-08 | [RAC]

**Tugas:** ORD.03 giliran 1 (layar customer Pesan: keranjang, form pesanan, Kirim, layar selesai dengan teks O21): `public/pesan.js` baru; `index.html`, `kerangka.js`, `sw.js` diubah.

**Keputusan baru** (pilihan penulis; alasan belum tercatat dari ketua kecuali disebut):

- Keranjang disimpan di `pesan.js` (bukan di daftar menu), karena `kerangka.js` memuat ulang daftar menu tiap tab Pesan dibuka. Baris keranjang: menu sama dengan kombinasi pilihan berbeda = baris terpisah; kombinasi sama digabung jumlahnya.
- Yang dikirim ke `order_buat`: `tipe`, `alamat_id` (hanya Diantar), `hari`, `jam` (HH:MM), `item` (`menu_id`, `jumlah`, `opsi_ids`), `catatan`. Total di layar hanya perkiraan; angka resmi dari balasan server.
- Alamat antar diambil lewat aksi `status` (`h.data.alamat`), tanpa aksi baru. Satu alamat: langsung terpilih. Lebih dari satu: customer wajib memilih sendiri (hindari salah antar). Kembali dari Buku alamat, daftar alamat dimuat ulang otomatis.
- Jam wajib diisi (pemilih jam bawaan HP), tanpa daftar dan tanpa batas (O2). Label jam mengikuti tipe (Jam antar, Jam ambil, Jam datang).
- Tombol Kirim dikunci sejak ditekan sampai balasan datang; keranjang dikosongkan begitu order berhasil.
- Jaringan putus setelah permintaan terkirim (hasil tidak pasti): pesan menyuruh cek Pesanan Saya lalu Segarkan, jangan kirim ulang dulu. Offline dari awal: "Pesanan belum terkirim".
- Galat 404 atau 409 yang berisi "Muat ulang menu" membuat daftar menu dimuat ulang otomatis; galat alamat tidak ditemukan membuat daftar alamat dimuat ulang.
- Teks O21 ada di `pesan.js` dan dibuka lewat `window.KedaiPesan.teksBayar` supaya layar lain memakai teks yang sama.
- Satu menu boleh punya beberapa grup (`menu_grup_atur`, ada batas jumlah grup), dan tiap grup punya tepat satu pilihan bawaan, jadi customer memilih **satu opsi per grup**.
- Batas item, jumlah per item, dan panjang catatan **tidak terbaca di aplikasi**: `status` hanya mengirim `alamat_maks` (`PENGATURAN_AMAN` di `kedai/index.ts`). Server yang menolak dan pesannya ditampilkan. Menambah batas ke `PENGATURAN_AMAN` berarti mengubah dan men-deploy `kedai` (berisiko, butuh "OK" ketua); ditunda.
- Kontrak `window.KedaiPesan.tambah(menu, pilihan, jumlah)`: `menu` = `{ id, nama, harga }`; `pilihan` = daftar `{ id (uuid opsi), teks ("Nama grup: Nama opsi") }`, satu per grup, urut seperti grup di menu (menu tanpa grup: daftar kosong); `jumlah` bilangan bulat >= 1. Mengembalikan `true` bila masuk keranjang. Yang dikirim ke server dari `pilihan` hanya `id`-nya; susunan teks resmi disusun server.
- Berkas JS baru dan `sw.js` harus naik **dalam satu commit**: kalau `sw.js` naik duluan, pemasangan service worker baru gagal karena berkas barunya belum ada.

### Handoff #5 | 2026-11-08 | [FREN]

**Tugas:** ORD.03 giliran 2: tombol Tambah di kartu menu, pilihan dan jumlah di sheet detail, lalu masuk keranjang. Perubahan di `menu.js` (id grup dan id opsi ikut terbaca; tombol Tambah untuk menu tanpa grup yang langsung masuk keranjang jumlah 1 lalu "Ditambahkan ✓" sebentar, atau Pilih untuk menu dengan grup yang membuka sheet; hanya menu Tersedia), `menu-detail.js` (satu pilihan per grup dengan bawaan terpilih, jumlah 1 sampai 9999 sebagai bentuk data saja, tombol "Tambah ke pesanan" yang memanggil `KedaiPesan.tambah` lalu menutup sheet; Tab berputar di antara kontrol sheet), `pesan.js`, dan `style.css`.

**Keputusan baru dari ketua:**

- **Jam bawaan Diantar 11:00 (WIB), terisi otomatis, customer tetap bisa mengubah.** Diambil dan Makan di warung kosong dan wajib diisi. Dikerjakan di frontend saja karena mengubahnya di server berarti merombak fungsi SQL; server tetap menerima jam apa pun (O2).
- **Tombol pesanan bulat melayang dengan emoji keranjang, ikut layar saat digulir, di atas navigasi bawah.** Alasan ketua: supaya tidak menabrak tombol navigasi.

**Keputusan baru pilihan penulis** (alasan belum tercatat dari ketua):

- Jam bawaan 11:00 dikosongkan lagi saat tipe pindah ke Diambil atau Makan di warung, **selama customer belum menyentuh jamnya**. Jam yang diketik atau diubah customer tidak pernah ditimpa. Pindah balik ke Diantar dengan jam kosong: terisi 11:00 lagi. Setelah order terkirim atau Keluar: kembali ke Diantar dengan 11:00.
- Angka 11:00 ditulis di kode (`JAM_BAWAAN_ANTAR` di `pesan.js`) atas permintaan ketua. `AGENTS.md` bagian 1 menyebut angka yang bisa berubah idealnya di database; memindahkannya butuh ubah dan deploy `kedai` (berisiko, butuh "OK" ketua), jadi ditunda.
- Tombol melayang dipasang dari `pesan.js` ke panel Pesan, tampil hanya di langkah menu dan bila keranjang tidak kosong, dengan lencana jumlah item. Tombol "Lihat pesanan" lama di `index.html` disembunyikan, bukan dihapus; teks ringkasan keranjang tetap tampil. Posisi: 76 px di atas dasar layar, z-index 12 (di bawah sheet detail, 30).
- "Hari ini" dipesan setelah jam 11: jam bawaan sudah lewat, sistem tetap menerima dan customer mengubah sendiri (sesuai aturan ketua).

### 2026-11-08: ORD.03 lulus

ORD.03 selesai dan lulus. Terbukti dengan balasan server (bukti di chat, tidak disimpan):

- Kirim ditekan tiga kali beruntun lewat konsol hanya membuat **satu** order.
- Menu jadi Habis saat Kirim: server menolak dengan pesan "Ada menu yang sedang habis atau tidak tersedia. Muat ulang menu lalu coba lagi.", tidak ada order terbentuk (nomor tidak loncat), daftar menu dimuat ulang otomatis, dan menu Habis tampil tanpa tombol Tambah.
- Pilihan menu tersimpan di `order_detail`, termasuk opsi non-bawaan ("Sedang") dan bawaan ("Tidak pedas"); menu tanpa grup pilihannya kosong. Harga dan total dihitung server; Diantar punya alamat, Diambil dan Makan di warung tanpa alamat; jam bawaan Diantar 11:00 dan hari target benar.

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

**Belum diputuskan:** "hanya Besok" dihitung dari tanggal server saat aksi (bawaan): order yang hari targetnya sudah Besok tidak bisa dialihkan lagi. Perlu konfirmasi ketua. Alasan keputusan di luar yang disebut di atas: alasan belum tercatat.

### Handoff #6 | 2026-11-08 | KETUA

**Tugas:** ORD.04 bagian server selesai: fungsi SQL `order_batal` (`20261108_03_order_batal_fungsi.sql`, pembatal, dan cek) dan aksi `order_batal` di `kedai` (tambahan: `PETA_GALAT_ORDER_BATAL`, `aksiOrderBatal`, satu `case`). Layar Pesanan Saya di Handoff #7.

**Keputusan baru** (ketua menyetujui keempatnya; alasan belum tercatat):

- **Tiga pagar di tabel `order` dilonggarkan** (`order_metode_status_cek`, `order_pemutus_cek`, `order_alasan_cek`). Dibatalkan boleh membawa metode bayar dan pemutus (keduanya sama-sama ada atau sama-sama kosong), dan alasan boleh ada pada Ditolak dan Dibatalkan. Aturan lain tidak berubah.
- **Alasan batal disimpan di kolom `alasan_tolak` yang sudah ada** (bukan kolom baru), sehingga `order_daftar` dan `order_detail` tidak diubah dan alasannya langsung tampil ke customer. Isi kolom itu bisa alasan tolak **atau** alasan batal; pembedanya adalah `status` (Ditolak atau Dibatalkan).
- **Order yang dibatalkan owner tetap menyimpan metode bayar dan pemutus** (berguna untuk pengembalian uang lewat WA). Siapa yang membatalkan dan dari status apa ada di `riwayat_status` (hanya terlihat owner).
- **Alasan dari customer diabaikan** (O8: alasan hanya untuk owner). Alasan owner juga disalin ke `riwayat_status.keterangan`.
- Pilihan penulis: `order_batal` tidak mengembalikan id pemesan (bahan push NTF.06 ditambahkan nanti bila perlu); kode galat baru `peran_tidak_boleh`, `alasan_terlalu_panjang`, `sudah_diproses`, `tidak_bisa_dibatalkan`.

**Kontrak untuk layar:**

- `order_batal` dengan isian `{ id, alasan }` (`id` = id order; `alasan` hanya dipakai owner). Sukses `{ ok: true, order: { id, nomor, status: "Dibatalkan", status_asal, oleh_peran } }`. Galat `{ ok: false, pesan }`; tampilkan `pesan` apa adanya lewat `textContent`. Galat untuk customer: **409** (order sudah bukan Menunggu; sebaiknya layar menyegarkan daftar), **404** "Pesanan tidak ditemukan." (bukan miliknya atau tidak ada), 400 id rusak.
- `order_daftar` (isian `{}` untuk customer) membalas `{ ok, daftar }`, terbaru dulu, riwayat lengkap, baris ringkas: `id`, `nomor`, `tipe`, `status`, `hari_target`, `jam_permintaan`, `total`, `alasan_tolak`, `ringkas`. `order_detail` (isian `id`) membalas `{ ok, order }` dengan item, pilihan, catatan, dan `alasan_tolak`. Customer **tidak** menerima `metode_bayar`, `pemutus_nama`, dan riwayat status.

### Handoff #7 | 2026-11-08 | RAC

**Tugas:** ORD.04 **selesai**: layar Pesanan Saya (daftar riwayat lengkap, detail, status, alasan tolak atau batal, teks O21 pada order Menunggu, tombol Batalkan hanya saat Menunggu). `public/pesanan.js` baru (mengekspor `window.KedaiPesanan`: `tampil`, `reset`); `index.html`, `kerangka.js` (`tampil` saat tab dibuka dan lewat Segarkan, `reset` saat Keluar), `pesan.js`, dan `sw.js` (cache `chata-v12`) diubah. `style.css` tidak berubah.

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
- `riwayat_status.keterangan` pada Setujui berisi "Metode bayar: <metode>"; pada Tolak berisi alasan (kosong bila tanpa alasan). **ORD.07 (`order_metode_koreksi`, O23) memakai format keterangan yang sama** supaya metode lama dan baru terbaca konsisten.
- `pemutus_nama` disalin dari `staf.nama_tampilan` saat keputusan (salinan).
- Metode bayar dipangkas spasi lalu dicocokkan persis (huruf besar-kecil dibedakan); alasan tolak yang hanya spasi disimpan kosong.
- Fungsi tidak mengembalikan id pemesan (bahan push ditambahkan di NTF bila perlu).
- Lapis kedua peran di `kedai`: selain owner aktif (customer dan penjaga) dibalas 403 "Aksi ini hanya untuk owner."

### Handoff #10 | 2026-11-09 | [RAC]

**Tugas:** ORD.06 (layar owner) kode selesai dan terpasang di production; tidak ada perubahan SQL, migration, atau `kedai/index.ts`. Perubahan: `public/orderowner.js` baru (Order Masuk dan Semua Order; satu pabrik `buatLayar` dipakai dua kali), `index.html` (panel `panel-ordermasuk` dan `panel-semuaorder`, script `orderowner.js` setelah `pesanan.js`), `kerangka.js`, `sw.js` (`chata-v13`).

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

**Terbukti** (akun dummy; bukti di chat, tidak disimpan): dua owner menekan Setuju bersamaan, jendela kedua dengan tab lama mendapat "Pesanan sudah diproses. Segarkan daftar pesanan.", lalu detail dimuat ulang menjadi Disetujui tanpa tombol aksi, dan metode bayar serta pemutus tidak tertimpa; Tolak dengan alasan 191 dan tepat 200 karakter tersimpan utuh dan tampil di layar owner dan customer; kolom alasan menahan ketikan di 200 karakter; Tolak tanpa alasan tidak menampilkan kartu alasan.

**Masih terbuka (konsolidasi seluruh handoff):**

- Tes ORD.06 di HP Android (ketua), metode Transfer (Tunai dan QRIS sudah terbukti), dan pesan galat saat koneksi putus ketika layar sudah terbuka (P2, opsional).
- Baris SEC di sheet sengaja belum dicentang; jadwalnya setelah ORD.14. Yang sudah punya bukti sebagian: SEC-07 dan SEC-08 (aksi `order_setuju`, `order_tolak`, `order_batal` oleh customer dan penjaga), SEC-09 (`order_batal`), SEC-10 (dua owner di layar). Yang masih menunggu: SEC-05 (catatan belum ada aksinya), SEC-06 (aksi selain `order_buat`), SEC-19 (jam HP, digeser ke ORD.14: di HP Android dummy geser tanggal HP, pesan lewat layar, cek `hari_target`; bagian "waktu catatan dari server" menunggu ORD.09).
- Dimasukkan ke ORD.14: customer batal vs owner setuju bersamaan (SEC-10, dua sesi login); skenario Tolak yang menang saat bersamaan; owner membatalkan dari Diproses dan Diantar/Siap (menunggu ORD.07 dan ORD.15; dari Disetujui sudah terbukti); penjaga menekan tombol status pada order yang sudah Dibatalkan; urutan daftar owner dan penjaga menurut O22 belum tercatat dibuktikan.
- Pagar antar-kolom tabel `order` baru teruji untuk Menunggu, Disetujui, Ditolak, dan Dibatalkan lewat fungsi yang ada; sisanya (order wakil, kecocokan metode bayar dengan status) lewat ORD.12 dan ORD.14.
- Push belum ada untuk setuju, tolak, dan batal (NTF; pembatalan, setuju, dan tolak berjalan tanpa push sampai itu).
- Layar customer tidak bisa membedakan "dibatalkan customer" dan "dibatalkan owner" (riwayat status hanya terlihat owner; petunjuk yang ada hanya alasan terisi atau kosong). Bila perlu pembeda, keputusan ketua, usul: putuskan bersama ORD.15.
- "Hanya Besok" untuk alih hari dihitung dari tanggal server saat aksi (bawaan); perlu konfirmasi ketua.
- Catatan belum tampil di detail customer (ORD.10).
- Baris keranjang belum ditandai saat galat "menu habis"; customer mencarinya sendiri.
- `pesan.js` dan `orderowner.js` melewati ~500 baris (bagian alamat `pesan.js` paling mudah dipisah).
- Batas item, jumlah, dan catatan tidak terbaca di aplikasi; jam bawaan 11:00 ada di kode. Memindahkan keduanya ke database butuh ubah dan deploy `kedai` ("OK" ketua).
- Kosmetik: variabel `pernahMuatDaftar` di `pesanan.js` tidak terpakai.
- Order uji tidak bisa dihapus; dibersihkan di LNC.01 bersama reset nomor order.

**Saran giliran berikutnya:**

1. **ORD.07** ⚠️ (`order_status`, `order_metode_koreksi`, `order_alih_hari`), dikerjakan di sesi ketua: butuh penjelasan dampak dan "OK" ketua. Lampirkan `AGENTS.md` + `order.md` + `database.md` + `security.md` + `supabase/functions/kedai/index.ts` + `20261108_05_order_setuju_tolak.sql` + `20261108_04_order_batal_pesan.sql`. Format keterangan koreksi metode sama dengan "Metode bayar: <metode>" (Handoff #9).
2. Setelah ORD.07: ORD.15 (tombol aksi owner di layar) dan ORD.08 (layar penjaga). Berkas JS baru wajib didaftarkan di `sw.js` (butuh "OK" ketua) dan naik dalam satu commit dengan berkas barunya.

# Siap tempel (2 blok)

Blok 1 ditempel di **paling bawah `docs/order.md` bagian 9**. Blok 2 ditempel di **`AGENTS.md` bagian 12**, di bawah garis (teks "(belum ada blok)" dibiarkan, append-only).

---

## BLOK 1: tempel di `docs/order.md` bagian 9

### Handoff #12 | 2026-11-09 | KETUA

**Tugas:** ORD.07 ⚠️ kode selesai dan **sudah ter-deploy di production**. **Tes belum dijalankan** dan **belum commit atau push**, jadi ORD.07 belum boleh dicentang di sheet.

**Berkas:**

- `supabase/migrations/20261109_01_order_status_alih_hari.sql` (+ `_batal.sql`, dan `supabase/templates/20261109_01_order_status_alih_hari_cek.sql`). Sudah dijalankan di SQL Editor dan lulus cek: 3 fungsi ada, `SECURITY DEFINER`, `search_path` kosong, `anon` dan `authenticated` tanpa `EXECUTE`, pagar tabel tidak berubah. Tidak ada tabel atau data yang berubah.
- `supabase/functions/kedai/order_status.ts` (baru) dan `index.ts` (hanya tambahan: catatan kepala, 1 import, 1 blok sambungan, 3 `case`; **0 baris lama dihapus**). Deploy `kedai --use-api` sukses; ini deploy multi-berkas pertama dan terbukti jalan. Token CLI sudah dibersihkan.

**Keputusan baru (ketua):**

- **"Hanya Besok" untuk alih hari** dihitung dari tanggal server saat aksi (menutup butir "Belum diputuskan" di blok 8 Nov). Order yang hari targetnya sudah Besok atau lebih ditolak (`sudah_besok`); hari ini atau yang sudah lewat boleh dialihkan ke Besok.
- **Pilihan C:** alasan alih hari **hanya masuk `riwayat_status.keterangan`**, tidak masuk `alasan_tolak` (pagar `order_alasan_cek` hanya mengizinkan Ditolak dan Dibatalkan). Ini menunda bagian "alasan tampil ke customer" di blok 8 Nov; jadi butir baru sheet.
- **Kode baru `kedai` di berkas terpisah** mulai ORD.07; kode lama tidak dipindah dan tidak ada refactor yang direncanakan. Alat bantu diberikan lewat parameter `buatAksiOrderStatus(alat)`. Alasan ketua: `index.ts` sudah sangat panjang. Aman untuk free tier (hitungan panggilan dan batas ukuran tidak terpengaruh).
- **Lima pilihan penulis yang disetujui ketua:** (1) alasan alih hari maks 100 karakter, format keterangan "Alih hari 2026-11-09 ke 2026-11-10[, jam 11:00 ke 12:30][. Alasan: ...]" (karena `keterangan` maks 200); (2) koreksi metode berketerangan "Metode bayar: <baru> (sebelumnya <lama>)", metode sama ditolak (`metode_sama`); (3) alih hari ditolak bila hari target sudah Besok atau lebih; (4) dari Diantar/Siap, Disetujui tidak bisa dicapai lewat `order_status` (hanya lewat alih hari), **sedangkan mundur Diproses ke Disetujui tetap boleh (O10)**; butir ini sempat tertulis terlalu luas dan yang berlaku mengikuti O10; (5) `order_status` menerima `status_dilihat` hanya sebagai pembanding (beda dengan server: 409 `status_berubah`), status tujuan selalu ditentukan server.
- **Pilihan penulis lain** (alasan belum tercatat): mundur berketerangan "Mundur satu langkah"; penjaga yang memanggil `order_status` pada order Menunggu, Ditolak, atau Dibatalkan dibalas `order_tidak_ditemukan` (O11); koreksi metode hanya untuk Disetujui sampai Diantar/Siap (Dibatalkan dikecualikan, supaya metode dan pemutusnya tetap jadi bahan pengembalian uang lewat WA); alih hari boleh untuk order wakil owner; fungsi tidak mengembalikan id pemesan.

**Kontrak untuk layar (ORD.15 dan ORD.08):** balasan `{ status, data }` dari `panggilKedai`; sukses `data = { ok: true, order: {...} }`, galat `data = { ok: false, pesan }` (tampilkan `pesan` lewat `textContent`; 409 sebaiknya menyegarkan daftar atau detail).

- `order_status` (penjaga dan owner), isian `{ id, arah: "maju" | "mundur", status_dilihat }` (status yang sedang tampil di layar). Sukses: `order = { id, nomor, status, status_asal, arah, oleh_peran }`. Galat: 400 (data rusak), 403, 404, 409 (`status_berubah`, belum disetujui, sudah ditolak, dibatalkan, atau selesai, tidak bisa mundur).
- `order_metode_koreksi` (owner), isian `{ id, metode }`. Sukses: `order = { id, nomor, status, metode_bayar, metode_sebelumnya }`.
- `order_alih_hari` (owner), isian `{ id, jam?, alasan? }` (jam `JJ:MM`, kosong = jam lama; alasan maks 100). Sukses: `order = { id, nomor, status: "Disetujui", status_asal, hari_lama, hari_baru, jam_permintaan, oleh_peran }`. Hari tujuan tidak pernah dikirim aplikasi.

**Masalah yang belum beres:**

- **Tes ORD.07 belum jalan** (lihat saran di bawah). Sampai ada bukti, SEC-07, SEC-08, SEC-10, SEC-11, SEC-15 (bagian ORD.07), dan SEC-19 (hari dari aplikasi diabaikan) belum boleh dicentang.
- **Belum commit dan push.** Kondisi terakhir `git status`: `index.ts` modified; `order_status.ts` dan tiga berkas SQL untracked; tidak ada berkas lain.
- Alasan alih hari belum tampil ke customer: **butir baru sheet** "Tampilkan alasan alih hari ke customer" (kerjakan bersama ORD.15; butuh perubahan tabel atau fungsi, jadi ⚠️).
- Push belum ada untuk status, koreksi, dan alih hari (NTF.04, NTF.06, NTF.08 menyesuaikan).
- Belum dikonfirmasi: logout dashboard Supabase dan GitHub di Mac bersama setelah deploy.
- Butir terbuka dari Handoff #11 yang tidak berubah: tes ORD.06 di Android, pembeda "dibatalkan customer atau owner" di layar customer, dan lainnya.

**Saran giliran berikutnya:**

1. **Tes ORD.07** (sesi tes; lampirkan `AGENTS.md` + `order.md` + `security.md` + berkas cek). Lewat konsol `window.KedaiAkun.panggilKedai(aksi, data)` dengan akun dummy (owner, penjaga, customer; tambah customer kedua bila perlu). Siapkan **beberapa order dummy**, karena order Selesai tidak bisa dikembalikan. Kasus:
   - Jalur maju per tipe (Diantar, Diambil: Siap diambil, Makan di warung: Siap disajikan) dan mundur satu langkah oleh penjaga dan owner; riwayat tercatat.
   - Ditolak: loncat, `status_dilihat` basi atau dobel pencet (409), mundur dari Selesai, mundur dari Disetujui, `arah` salah.
   - Hak: customer memanggil ketiga aksi (403); penjaga memanggil koreksi metode dan alih hari (403); penjaga `order_status` pada order Dibatalkan (404).
   - Koreksi metode oleh owner (keterangan riwayat benar); metode sama atau asing (400); order Selesai atau Dibatalkan ditolak.
   - Alih hari dari Disetujui, Diproses, Diantar/Siap: hari target jadi Besok dari server, status Disetujui, jam berubah atau tidak, alasan 100 lolos dan 101 ditolak; order yang sudah Besok (409); dari Selesai (409); isian `hari` palsu diabaikan.
   - Bukti: balasan server dan query baca-saja `riwayat_status` (bagian 4 berkas cek). Bukti tidak disimpan.
2. Setelah lulus: git dengan pagar `AGENTS.md` bagian 8 (folder aktif, `git remote -v`, email commit, semuanya milik ketua), **satu commit** untuk `index.ts`, `order_status.ts`, dan tiga berkas SQL. Lalu centang ORD.07 di sheet.
3. Berikutnya ORD.15 (tombol aksi owner di layar) dan ORD.08 (layar penjaga). Berkas JS baru wajib didaftarkan di `sw.js` (butuh "OK" ketua) dan naik satu commit dengan berkasnya.

---

### Handoff #13 | 2026-11-09 | [FREN]

**Tugas:** tes ORD.07 ⚠️ (lanjutan Handoff #12, sesi ketua) dijalankan dan **lulus**. ORD.07 sudah dicentang di sheet. Commit `0d9cb2e` sudah di-push ke repo ChATA (pagar `AGENTS.md` bagian 8 lolos: folder, `git remote -v`, email noreply). Tidak ada kode yang diubah di sesi ini.

**Berkas:** tidak ada yang diubah. Yang ter-commit hanya hasil sesi ketua: `index.ts`, `order_status.ts`, dua SQL migration (+ pembatal), berkas cek, dan blok catatan di `AGENTS.md` dan `docs/order.md`. Satu baris terhapus: placeholder `_(belum ada blok)_` di `AGENTS.md` bagian 12, diganti blok catatan ketua (sudah dicek, tidak ada aturan lama yang hilang).

**Terbukti** (konsol, akun dummy; bukti di chat, tidak disimpan):

- Jalur maju dan mundur satu langkah untuk tiga tipe (Diambil, Diantar, Makan di warung sampai Selesai), oleh owner dan penjaga; `oleh_peran` tercatat benar.
- Ditolak: mundur dari Disetujui (409), `arah` salah (400), status basi dan dobel pencet (409), semua aksi pada order Selesai (409), ketiga aksi pada order Menunggu, Ditolak, dan Dibatalkan (409).
- Hak: customer memanggil ketiga aksi (403); penjaga memanggil koreksi metode dan alih hari (403); penjaga `order_status` pada order Menunggu, Ditolak, dan Dibatalkan (404).
- Koreksi metode: sukses, metode sama (400), metode asing (400).
- Alih hari: dari Disetujui, Diproses, dan Diantar; alasan 100 karakter lolos dan 101 ditolak (400); jam berubah bila dikirim dan tetap bila tidak; isian `hari` palsu diabaikan (hari baru dari server); order yang sudah Besok ditolak (409).
- Riwayat (query baca-saja bagian 4 berkas cek, `LIMIT` dinaikkan ke 30 hanya di editor): keterangan "Mundur satu langkah", "Metode bayar: Transfer (sebelumnya Tunai)", dan "Alih hari ... ke ..." (jam dan alasan bila ada) sesuai. Aksi yang ditolak tidak meninggalkan baris (id riwayat berurutan, tanpa lubang).
- Mundur dari Diantar mendarat di Diproses, bukan Disetujui; kembali ke Disetujui dari Diantar hanya lewat alih hari (SEC-15).
  **Keputusan baru:** tidak ada.

**Masalah yang belum beres:**

- Belum terbukti: dua sesi menekan tombol bersamaan untuk `order_status` (SEC-10) dan jam HP digeser (SEC-19). Keduanya dikerjakan di ORD.14. Baris SEC di sheet belum dicentang.
- Alasan alih hari belum tampil ke customer: butir baru sheet **ORD.16** "Tampilkan alasan alih hari ke customer" (⚠️, P1, bareng ORD.15), dari Handoff #12.
- Push belum ada untuk status, koreksi, dan alih hari (NTF.04, NTF.06, NTF.08).
- Order dummy tersisa: #21 (Diantar, Disetujui, hari Besok) dan #24 (Diambil, Menunggu) dipakai ulang di ORD.14; #17 dan #22 Selesai; #23 Dibatalkan. Order uji tidak bisa dihapus; dibersihkan di LNC.01.
- Logout dashboard Supabase dan GitHub di Mac bersama setelah deploy belum dikonfirmasi.
- Butir terbuka dari Handoff #11 tidak berubah (tes ORD.06 di Android, pembeda "dibatalkan customer atau owner" di layar customer, dan lainnya).
  **Saran giliran berikutnya:**

1. **ORD.15** ⚠️ (tombol aksi owner di layar) memakai kontrak balasan `{ status, data }` di Handoff #12. Lalu **ORD.08** (layar penjaga). Berkas JS baru wajib didaftarkan di `sw.js` (butuh "OK" ketua) dan naik dalam satu commit dengan berkas barunya.
2. Setelahnya ORD.09 (catatan berlapis), lalu ORD.14 untuk sisa tes yang digeser di atas.

# Siap tempel: paling bawah `docs/order.md` bagian 9

### Handoff #14 | 2026-11-09 | RAC

**Tugas:** ORD.08 (layar penjaga Antrean) **selesai**: terpasang di production, tes lulus (termasuk di HP Android ketua dan mode offline), sudah dicentang di sheet. Ditambah permintaan ketua setelah tes: **badge tipe order berwarna** di layar customer, owner, dan penjaga. Tidak ada perubahan SQL, migration, atau `kedai`.

**Commit:**

- Layar Antrean: `21cdd81`, sudah di-push (pagar `AGENTS.md` bagian 8 lolos: folder, `git remote -v`, email noreply, semuanya milik ketua).
- Badge tipe: 'f0ea828'.

**Berkas:**

- ORD.08 (`21cdd81`): `public/orderpenjaga.js` (baru; `window.KedaiOrderPenjaga` dengan `tampil` dan `reset`), `public/index.html` (hanya tambahan: panel `panel-antrean` dan satu tag script), `public/kerangka.js` (tab Antrean penjaga ke panel `antrean`, hook `tampil` dan `reset`; baris lama jadi komentar), `public/style.css` (blok ORD.08 di akhir; warna tab di variabel `--antrean-*`), `public/sw.js` (`chata-v14`, `orderpenjaga.js` masuk daftar cache; baris lama jadi komentar).
- Badge tipe: `public/orderpenjaga.js`, `public/orderowner.js`, `public/pesanan.js` (helper `badgeTipe` dan `barisTipe`; dua baris tulisan tipe lama di tiap berkas dijadikan komentar), dan `public/style.css` (blok badge di akhir; warna di variabel `--tipe-*`). `sw.js` tidak berubah (tanpa berkas baru).

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
- **Badge tipe** berwarna di tiga layar, dengan warna yang konsisten antar peran, tanpa keterangan warna (alasan: tipe yang hanya dibedakan font kurang jelas).

**Pilihan penulis** (alasan belum tercatat):

- Judul pemisah di tiap tab memakai **tanggal dari server** ("Senin, 9 Nov 2026"), bukan "Hari ini/Besok". Label itu butuh tahu hari ini menurut server; jam HP tidak dipakai (`AGENTS.md` bagian 7). Bila ingin label "Hari ini/Besok", butuh field dari server atau keputusan ketua.
- Kartu daftar penjaga tidak menampilkan harga. Detail menampilkan jumlah, pilihan, dan Total tanpa harga satuan.
- Warna badge tipe (ungu, pink magenta, tosca) usulan penulis; ketua boleh mengganti lewat variabel `--tipe-*`.

**Terbukti** (akun dummy; bukti di chat, tidak disimpan):

- Daftar penjaga terisi dengan isian `{}`, termasuk order Selesai. Order Menunggu tidak terlihat penjaga sampai owner menekan Setuju (O11).
- Jalur maju untuk tiga tipe: Diantar sampai Selesai, Diambil sampai Siap, Makan di warung sampai Selesai; label tombol sesuai tipe.
- Mundur Siap ke Diproses dan Diproses ke Baru, kartu pindah tab. Tombol mundur tidak ada di Baru dan Selesai.
- Angka tab dan pesan sukses mengikuti tiap perubahan. Detail menampilkan pilihan menu, Total, catatan baca-saja, dan alamat hanya untuk Diantar.
- Keluar lalu masuk lagi: layar kembali ke tab Baru dengan data hasil muat ulang dari server.
- Tes ketua di HP Android: semua jalan, termasuk mode offline.
- **Badge tipe sudah dites tampilannya** di tiga layar (penjaga, owner, customer); cek satu order per tipe dan warna badge sama di ketiganya.

**Masalah yang belum beres:**

- **Owner membatalkan order lalu hilang dari Antrean** setelah Segarkan: belum teruji, karena tombol batal owner baru ada di ORD.15.
- **Dua penjaga menekan tombol yang sama bersamaan** (SEC-10, order_status) dan penjaga menekan tombol pada order yang sudah Dibatalkan: dikerjakan di ORD.14. Baris SEC di sheet belum dicentang.
- Push untuk status, koreksi, batal, dan alih hari belum ada (NTF.04, NTF.06, NTF.08).
- `orderpenjaga.js` sekitar 880 baris, melewati patokan ~500 baris (bagian pembantu yang sama dengan `orderowner.js` bisa dipisah bila nanti diputuskan; butuh penjelasan dampak dan "OK" ketua).
- Order dummy tersisa: **#25** (Diambil, Disetujui, hari ini) dan **#21** (Diantar, Disetujui, Selasa 10 Nov) dipakai ulang di ORD.14; **#24** (Diambil, Menunggu); #15 dan #26 sudah Selesai. Order uji tidak bisa dihapus; dibersihkan di LNC.01.
- Butir terbuka dari Handoff #11, #12, dan #13 tidak berubah (pembeda "dibatalkan customer atau owner" di layar customer, ORD.16 alasan alih hari ke customer, logout dashboard Supabase dan GitHub di Mac bersama, dan lainnya).

**Saran giliran berikutnya:**

1. **ORD.15** ⚠️ (tombol aksi owner di layar: Batalkan, Alihkan hari, koreksi metode bayar, tombol status dan mundur), memakai kontrak balasan `{ status, data }` di Handoff #12; kerjakan bersama **ORD.16** (alasan alih hari ke customer, perlu perubahan tabel atau fungsi, jadi butuh "OK" ketua). Lampirkan `AGENTS.md` + `order.md` + `database.md` + `security.md` + `supabase/functions/kedai/index.ts` + `order_status.ts` + `orderowner.js` + `index.html` + `kerangka.js` + `style.css`. Berkas JS baru wajib didaftarkan di `sw.js` dan naik satu commit dengan berkasnya.
2. Setelah ORD.15: tes owner membatalkan order dan hilang dari Antrean penjaga (sisa ORD.08).
3. Lalu ORD.09 (catatan berlapis), kemudian ORD.14 untuk sisa tes (SEC-10, SEC-19, dan lainnya).

---
