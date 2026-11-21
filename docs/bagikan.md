/docs/bagikan.md

# 📣 bagikan.md: Bagikan ke Sosmed (Banner dan Caption dari Template)

> **Versi 1.0 (21 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Permintaan para owner, dan **fitur pertama yang dikerjakan di versi 2**. Owner dan customer membuat **banner gambar plus caption** dari **template yang sudah disediakan**, lalu membagikannya ke sosmed (WA Status, Instagram, Facebook, dan lainnya).
> **Status:** Belum ada yang dikerjakan. Butir **(bawaan)** = pilihan penulis yang belum ditanyakan satu per satu; ketua boleh mengubahnya. **Bagian 3 memuat keputusan ketua 21 Nov 2026: K2, K3, K4 disetujui, K1 (penjaga) masih menunggu.**
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini + `home.md` + `desain.md`**. Tambahan berguna: `menu.md` (bagian foto menu), `kerangka.js`, `index.html`, `style.css`, `sw.js` (untuk SHR.06), serta contoh pola: `gelar.js` (canvas, Bagikan, Unduh PNG), `pengenalan-isi.js` (berkas data teks), dan `cari.js` (kotak Cari menu). `database.md` dan `security.md` tidak dibutuhkan karena fitur ini tanpa server. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 12.
> **Tanpa kode dan tanpa isi SQL.** Fitur ini memang tidak punya SQL. Nama berkas dan kelas di sini deskriptif; nama persisnya ditetapkan saat kode ditulis.
> **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Prefix sheet:** SHR (bawaan).

---

## 1. Tujuan

Warung ingin pelanggan dan owner ikut menyebarkan menu ke sosmed. Owner membuat **banner promo, menu baru, atau event**. Customer membuat **banner testimoni** untuk menu favoritnya. Keduanya memilih dari template yang disediakan, sehingga hasilnya seragam, rapi, dan terkendali. Caption ditutup tautan ke aplikasi, jadi fitur ini juga membantu arah proyek: memindahkan pelanggan dari WA ke aplikasi.

Fitur ini **100% di HP**. Tidak ada tabel, fungsi SQL, aksi `kedai`, atau tulis-database baru. Banner digambar di canvas, mengikuti pola banner Gelar.

---

## 2. Tabel Keputusan

| No   | Keputusan                                                                                                                                                                                                                                                                                                                 | Catatan                                                                                                                                                                                                                                                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SH1  | **Pengguna: customer dan owner.** **Penjaga: belum diputuskan, ketua bertanya dulu ke owner** (bagian 3, K1). Bawaan teknis sementara: penjaga tidak melihat tombol.                                                                                                                                                      | Penjaga belum punya instruksi lebih lanjut.                                                                                                                                                                                                                                                                                   |
| SH2  | **Hasil = banner (gambar) plus caption**, menyatu dengan template yang dipilih.                                                                                                                                                                                                                                           | Pilihan sesi strategi 21 Nov 2026.                                                                                                                                                                                                                                                                                            |
| SH3  | **Banner digambar di HP (canvas), tanpa server dan tanpa pustaka.** Tiga tombol: **Bagikan** (berkas gambar lewat fitur bagikan bawaan HP; disembunyikan bila HP tidak mendukung), **Unduh PNG**, dan **Salin caption**.                                                                                                  | Pola Gelar (`gelar.md` GL19, GL20). Tombol Salin caption sendiri perlu karena sebagian aplikasi tujuan diduga membuang teks saat menerima berkas (dugaan, dibuktikan di tes Android).                                                                                                                                         |
| SH4  | **Tidak ada tabel, fungsi SQL, aksi `kedai`, tulis-database, atau baris SEC baru.** Fitur memakai data `menu_daftar` yang sudah ada. Tidak ada pengecualian baru dari `AGENTS.md` bagian 7.                                                                                                                               | Menu yang tampil di Bagikan hanya yang memang sudah bisa dilihat peran itu.                                                                                                                                                                                                                                                   |
| SH5  | **Satu menu per banner.** Paket (misalnya nasi ayam bakar plus es teh) dibuat sebagai **menu tersendiri** di Kelola Menu, lengkap dengan foto dan harga sendiri. Tidak ada logika menggabung beberapa menu.                                                                                                               | Sejalan blok `menu.md` 17 Nov 2026: topping yang mengubah harga = menu baru sendiri.                                                                                                                                                                                                                                          |
| SH6  | **Menu muncul di pilihan Bagikan bila memenuhi tiga syarat: aktif, Tersedia, dan punya foto.** Aturan sama untuk owner dan customer. Layar menampilkan satu baris kecil: "Menu tanpa foto tidak ditampilkan di sini".                                                                                                     | Habis dan nonaktif tidak tampil supaya banner tidak mempromosikan yang tidak bisa dipesan. Menu baru otomatis Tersedia (`menu.md` Handoff #2).                                                                                                                                                                                |
| SH7  | **Foto menu dipakai apa adanya** dari `public/img/<nama berkas>` (satu domain dengan aplikasi). **Ketajaman dinilai di sesi kode (SHR.03)** dengan 3 sampai 4 menu. Bila foto gagal dimuat (berkas belum terbit atau nama salah), layar menampilkan pesan ramah ("Foto menu ini belum tersedia") dan banner tidak dibuat. | Foto sekitar 30 sampai 50 KB mungkin kurang tajam di banner 1080 × 1350 (belum terbukti). Bila kurang tajam, target ukuran foto diputuskan lewat blok susulan `menu.md` (K5).                                                                                                                                                 |
| SH8  | **Harga hanya tampil di banner owner, dan selalu harga menu dari server** (data `menu_daftar`). Tidak ada isian harga bebas. Promo harga dibuat dengan membuat menu paketnya dulu.                                                                                                                                        | Banner adalah gambar mati; harga di banner lama tidak ikut berubah bila harga menu naik.                                                                                                                                                                                                                                      |
| SH9  | **Customer hanya memilih dari daftar wording tetap.** Tanpa teks bebas, tanpa nama customer, tanpa harga. Banner customer = foto, nama menu, dan kalimat testimoni.                                                                                                                                                       | Alasan (sesi strategi 21 Nov 2026): menghindari klaim atas nama warung yang tidak terkontrol (kampanye hitam). Nama customer juga data pribadi.                                                                                                                                                                               |
| SH10 | **Owner hanya mengisi deskripsi.** Judul promo menjadi bagian template (memilih template = memilih jenis banner, misalnya Promo Ramadan atau Menu Baru). Batas panjang deskripsi ada di berkas data (SH19).                                                                                                               | Keputusan sesi strategi 21 Nov 2026.                                                                                                                                                                                                                                                                                          |
| SH11 | **Teks owner tidak disimpan di server.** Draf deskripsi terakhir boleh diingat di HP (**bawaan**), hanya teks promo tanpa data pribadi, dan dikosongkan saat Keluar.                                                                                                                                                      | Bila owner kelak sering mengulang teks, penyimpanan promo naik sebagai kandidat (bagian 11). `localStorage` disetujui ketua 21 Nov 2026 (K4).                                                                                                                                                                                 |
| SH12 | **Dua set template terpisah: set owner dan set customer.** Owner hanya melihat set owner, customer hanya set customer. Desain visual boleh satu keluarga (tema sama), tetapi tiap set punya kontrak sendiri (bagian 4).                                                                                                   | Pemisahan hanya di layar. Aman karena banner hanyalah gambar dari data yang memang bisa dilihat peran itu; tidak ada server yang perlu menolak.                                                                                                                                                                               |
| SH13 | **Template = gambar latar dari Canva, rasio 4:5, ukuran 1080 × 1350 px.** Semua template satu ukuran.                                                                                                                                                                                                                     | 4:5 sekitar 30% lebih ringan dari 9:16 (1080 × 1920), cocok untuk feed Instagram dan Facebook; di WA Status tampil utuh dengan pinggiran. Ramah HP lama.                                                                                                                                                                      |
| SH14 | **Kode menempel foto dan teks di area yang disediakan template.** Posisi area dicatat sebagai angka per template di berkas data. Aturan desain ada di **kontrak template** (bagian 4).                                                                                                                                    | Satu template boleh beda tata letak asalkan angkanya dicatat.                                                                                                                                                                                                                                                                 |
| SH15 | **Berkas latar berformat JPG di `public/img/`**, nama huruf kecil, angka, dan strip (mengikuti aturan nama foto menu). Target ukuran kasar **100 sampai 150 KB per berkas** (bawaan disetujui ketua, K5).                                                                                                                 | Motif datar menekan ukuran JPG.                                                                                                                                                                                                                                                                                               |
| SH16 | **Berkas latar template tidak didaftarkan di `DAFTAR_CACHE` `sw.js`**; diunduh saat dipakai. Ini **pengecualian dari aturan bagian 7, disetujui ketua 21 Nov 2026 (K2).**                                                                                                                                                 | Alasan: tidak mengubah `sw.js` tiap template baru, dan keuntungan offline hampir tidak terpakai karena daftar menu butuh server. Perilaku cache otomatis perlu dibuktikan (SHR.03).                                                                                                                                           |
| SH17 | **Wording dan data template ada di satu berkas JS data di `public/`** (nama bawaan `bagikan-isi.js`, hanya teks dan angka, mengikuti pola `pengenalan-isi.js`). Isi: wording customer, caption per template, daftar template (set, nama, berkas latar, angka area), batas panjang deskripsi, dan alamat tautan.           | Revisi kata-kata = edit satu berkas lalu push, bukan lewat lembar atau SQL. Berkas ini **wajib** di `DAFTAR_CACHE` (butuh "OK").                                                                                                                                                                                              |
| SH18 | **Caption = teks dasar template (owner) atau wording terpilih (customer), ditutup tautan `https://kedaichata.biz.id/` tanpa parameter.** Alamat ditulis di satu tempat saja (berkas data), bukan tercetak di gambar template.                                                                                             | Alamat di gambar sulit diganti bila domain berubah. Pelacakan asal kunjungan lewat tautan bertanda masih kandidat Analitik fase 2.                                                                                                                                                                                            |
| SH19 | **Angka di kode, bukan database:** batas panjang deskripsi owner, jumlah wording, dan posisi area ada di berkas data. Ini **pengecualian dari "angka di database" (`AGENTS.md` bagian 1)**; alasan: fitur tanpa server.                                                                                                   | Pola yang sama dengan timer game. Disetujui ketua 21 Nov 2026 (K4); dicatat di blok susulan `AGENTS.md`.                                                                                                                                                                                                                      |
| SH20 | **Letak: tombol lebar "Bagikan" di Home, di atas baris Gelar, QRIS, Bantuan**, untuk customer dan owner. Baris tiga tombol lama **tidak disentuh**. Tombol membuka layar baru (tab tersembunyi dengan tombol Kembali ke Home, pola Gelar Saya dan Ringkasan). Tanpa pintasan di sheet detail menu.                        | Keputusan sesi strategi: perubahan kode sekecil mungkin. `menu-detail.js` tidak disentuh. Home owner (kabar dari anggota tim, belum dilihat langsung): di bawah tombol Aktifkan notifikasi hanya 2 tombol bergambar, QRIS dan Bantuan. Tombol lebar Bagikan tetap di atas baris itu; dicek langsung saat dikerjakan (SHR.05). |
| SH21 | **Layar Bagikan:** pilih menu, pilih template, lalu deskripsi (owner) atau wording (customer), pratinjau banner, dan tiga tombol (SH3). Daftar menu boleh memakai kotak **Cari menu** yang sudah ada (`cari.js`) karena menu sudah 38 (**bawaan**).                                                                       | Menu yang tidak memenuhi SH6 tidak muncul.                                                                                                                                                                                                                                                                                    |
| SH22 | **Teks digambar dengan font bawaan sistem**, warna teks diatur per template supaya kontras. Tanpa font sendiri dan tanpa CDN.                                                                                                                                                                                             | `AGENTS.md` bagian 3. Bagian dekoratif (ornamen, bingkai, pita) tetap di gambar latar.                                                                                                                                                                                                                                        |
| SH23 | **Tanpa panggilan server baru.** Daftar menu dari data yang sudah ada di memori; bila belum ada, satu `menu_daftar` saat layar dibuka (**bawaan**). Tanpa polling dan tanpa timer.                                                                                                                                        | Hemat free tier (`AGENTS.md` bagian 4).                                                                                                                                                                                                                                                                                       |
| SH24 | **Banner dan caption tidak memuat data pribadi:** tanpa nama customer, nomor WA, alamat, atau isi catatan order. Gambar latar juga tanpa harga, tanggal, nomor WA, atau alamat yang bisa usang.                                                                                                                           | `AGENTS.md` bagian 2 butir 11 dan bagian 7.                                                                                                                                                                                                                                                                                   |
| SH25 | **Gaya di `public/bagikan.css` (kelas berawalan `shr-`)**, dimuat setelah `style.css`, mengikuti pola `game.css` dan `gelar.css` (disetujui ketua 21 Nov 2026, K4; catat di blok susulan `AGENTS.md`). Berkas JS dan CSS baru wajib di `DAFTAR_CACHE` (butuh "OK").                                                       | `AGENTS.md` bagian 3, 6, dan 7.                                                                                                                                                                                                                                                                                               |
| SH26 | **Jumlah awal (bawaan): 2 sampai 3 template per set, 6 sampai 10 wording customer.** Wording diperkaya bertahap lewat edit berkas data.                                                                                                                                                                                   | Template dicicil di Canva, beberapa template digabung dalam satu push.                                                                                                                                                                                                                                                        |
| SH27 | **Dites di Android.** iPhone diasumsikan jalan (`AGENTS.md` bagian 10 butir 7). Bila HP tidak mendukung bagikan berkas, tombol Bagikan disembunyikan dan Unduh PNG menjadi jalur utama.                                                                                                                                   | Pola Gelar (`gelar.md` Handoff #4).                                                                                                                                                                                                                                                                                           |
| SH28 | **Urutan:** dikerjakan setelah peluncuran terbatas (LNC.03 dan LNC.04), tidak mengganggu keduanya (**bawaan**). Ini fitur pertama di versi 2 atas permintaan owner, disetujui ketua 21 Nov 2026 (K3).                                                                                                                     | `bonus.md` semula menyatakan urutan versi 2 ditentukan setelah `LNC.05`.                                                                                                                                                                                                                                                      |

---

## 3. Keputusan Ketua (21 Nov 2026) dan yang Masih Terbuka

Ketua memutuskan langsung di sesi strategi 21 Nov 2026: **K2, K3, dan K4 disetujui; K1 masih menunggu; K5 dan K6 bawaannya disetujui, pengecekannya tetap dikerjakan.** Persetujuan ini untuk rancangan. **Perubahan `sw.js` dan `index.html` tetap butuh penjelasan dampak dan "OK" ketua saat berkasnya diubah** (SHR.06).

| No  | Hal                                                                                                                                                                                                                                                                        | Status                                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| K1  | **Apakah penjaga ikut melihat tombol Bagikan?** Ketua perlu bertanya dulu ke para owner.                                                                                                                                                                                   | **Masih menunggu.** Bawaan sementara: penjaga tidak melihat tombol.                                                                               |
| K2  | **Berkas latar template tidak didaftarkan di cache `sw.js`** (SH16). Pengecualian dari aturan bagian 7 (foto menu sudah ditambahkan lewat blok 17 Nov).                                                                                                                    | **Disetujui ketua 21 Nov 2026.** Bila kelak dibatalkan: daftarkan di `DAFTAR_CACHE`, satu commit bersama `sw.js`.                                 |
| K3  | **Fitur ini yang pertama di versi 2.** `bonus.md` semula menyebut urutan ditentukan setelah `LNC.05`.                                                                                                                                                                      | **Disetujui ketua 21 Nov 2026.** Dikerjakan setelah LNC.03 dan LNC.04.                                                                            |
| K4  | **Tiga catatan di `AGENTS.md`:** pengecualian "angka di database" (SH19), pengecualian CSS `bagikan.css` (SH25), dan draf teks di `localStorage` (SH11).                                                                                                                   | **Disetujui ketua 21 Nov 2026.** Ditulis sebagai blok susulan `AGENTS.md`.                                                                        |
| K5  | **Target ukuran berkas template (SH15) dan ukuran foto menu.** Ketajaman foto menu dinilai di SHR.03 dengan satu pertanyaan: "cukup tajam atau tidak". Bila tidak, target ukuran foto menu diputuskan lewat blok susulan `menu.md` (sekaligus menjawab butir lama "zoom"). | **Bawaan disetujui** (foto menu apa adanya, template kasar 100 sampai 150 KB). Hasil penilaian ketajaman menunggu SHR.03.                         |
| K6  | **Lisensi elemen Canva** (foto, ilustrasi, dan font di gambar latar) **belum dicek.** Repo ini public, jadi gambar latar bisa diunduh siapa saja.                                                                                                                          | **Bawaan disetujui:** hanya elemen yang boleh dipakai sebagai berkas yang dibagikan; yang ragu jangan dipakai. **Pengecekannya belum dilakukan.** |

---

## 4. Kontrak Template (untuk yang mendesain di Canva)

Aturan ini membuat satu kode bisa menyesuaikan semua template.

1. **Ukuran satu untuk semua:** 1080 × 1350 px, ekspor JPG. Nama berkas huruf kecil, angka, strip.
2. **Satu set = satu kontrak.**
   - **Set owner:** area **foto**, area **nama menu** (satu baris, dipotong dengan "..." bila panjang), area **harga**, dan area **deskripsi** (teks dibungkus beberapa baris). **Tanpa area judul**, karena judul tercetak di template.
   - **Set customer:** area **foto**, area **nama menu**, dan area **kalimat testimoni** (kapasitas lebih besar dari deskripsi). **Tanpa harga dan tanpa nama customer.**
3. **Bingkai foto digambar di latar.** Foto menu berlatar bawaan (bukan foto tanpa latar), jadi harus masuk **bingkai** (persegi bersudut membulat, lingkaran, atau lengkung). Kode memotong foto sesuai bentuknya.
4. **Ornamen hanya di tepi.** Lentera, lengkung, pita, dan motif tidak boleh menutupi area foto atau area teks, karena kode menempel isi **di atas** latar.
5. **Margin aman** di tepi kanvas (sekitar 60 px, **bawaan**) supaya tidak terpotong aplikasi sosmed.
6. **Kontras teks:** tiap area teks punya latar yang cukup terang atau gelap untuk warna teks yang dicatat di berkas data.
7. **Kapasitas deskripsi:** area deskripsi tiap template wajib muat batas karakter global (SH19). Bila tidak muat, template diberi batas sendiri di berkas data (**bawaan**).
8. **Angka per template** yang dicatat di berkas data: posisi (x, y), lebar, tinggi tiap area; bentuk bingkai foto; rata teks; warna teks; ukuran font terbesar; jumlah baris maksimal.
9. **Latar tanpa isi yang bisa usang:** tanpa harga, tanggal, nomor WA, atau alamat (SH24). Judul tema (misalnya "Promo Ramadan") boleh, tetapi berarti itu **template musiman**; ganti tema = template baru.
10. **Orisinal.** Tiga gambar referensi dari sesi strategi (gaya Ramadan, restoran Vietnam, dan menu bermotif marun) hanya acuan gaya. **Aset, logo, dan teks dari referensi tidak disalin.** Lisensi elemen Canva dicek (K6).
11. **Ukuran berkas** dijaga kecil (SH15); motif datar dan warna terbatas membantu.

---

## 5. Pedoman Wording

Wording customer (dan caption owner) ditulis di berkas data (SH17). Karena customer tidak mengetik sendiri, **kualitas wording menentukan fitur ini.**

- Suara **pelanggan umum**, tanpa nama.
- **Nada positif**; tidak menyebut atau membandingkan dengan pesaing.
- **Tanpa janji yang bisa salah:** harga, diskon, jam buka, atau klaim seperti halal, sehat, dan bahan, kecuali owner memastikannya benar.
- **Tanpa data pribadi:** tidak menyebut anak, sekolah, kelas, atau orang tertentu.
- **Generik terhadap menu:** nama menu tampil di areanya sendiri, jadi kalimat tidak menyebut menu tertentu (satu kalimat bisa dipakai semua menu).
- Ditulis owner, disetujui ketua (**bawaan**). Revisi = edit berkas data lalu push.

---

## 6. Alur

**Customer:**

1. Home: ketuk **Bagikan**. Layar terbuka.
2. Pilih **menu** (hanya yang aktif, Tersedia, dan berfoto), lalu pilih **template** set customer dan **wording** dari daftar.
3. Pratinjau banner tampil (digambar di HP). Ketuk **Bagikan** (menu bagikan HP), **Unduh PNG**, atau **Salin caption**.

**Owner:**

1. Home: ketuk **Bagikan**. Pilih **menu** dan **template** set owner (judul sudah ada di template).
2. Ketik **deskripsi** (batas karakter dari berkas data). Draf terakhir bisa muncul dari HP.
3. Pratinjau, lalu Bagikan, Unduh PNG, atau Salin caption. Harga di banner otomatis harga menu saat ini.

**Gagal:** foto menu tidak termuat atau menu berubah saat layar terbuka (misalnya jadi Habis): pesan ramah, banner tidak dibuat, tanpa galat mentah.

---

## 7. Yang Dibuat

| Komponen                  | Isi                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Template di `public/img/` | Gambar latar Canva (1080 × 1350 JPG), 2 sampai 3 per set di awal.                                            |
| `public/bagikan-isi.js`   | Data teks dan angka: daftar template, posisi area, wording, caption, batas, alamat tautan.                   |
| `public/bagikan.js`       | Layar Bagikan, penggambaran banner di canvas, Bagikan, Unduh PNG, Salin caption, draf di HP.                 |
| `public/bagikan.css`      | Gaya layar dan tombol (kelas `shr-`).                                                                        |
| Home                      | Satu tombol lebar "Bagikan" (customer dan owner). Menyentuh `kerangka.js` dan `index.html` (hanya tambahan). |
| `sw.js`                   | Daftar cache bertambah tiga berkas aplikasi; versi cache naik (butuh "OK").                                  |

---

## 8. Urutan Pekerjaan (untuk TODO sheet, prefix SHR)

Langkah ⚠️ butuh penjelasan dampak dan "OK" ketua.

| ID     | Pekerjaan                                                                                                                                                                                                                                    | Tipe                          | Prioritas |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | --------- |
| SHR.01 | Sepakati kontrak template (bagian 4) dan buat **template pertama di Canva**: 1 set owner dan 1 set customer, ekspor JPG 1080 × 1350. Dikerjakan PIC desain.                                                                                  | Low-Risk                      | P1        |
| SHR.02 | Berkas data awal `bagikan-isi.js` (daftar template, angka area, wording awal, caption, batas, alamat) dan template masuk `public/img/`. Commit tanpa `[skip ci]`.                                                                            | Low-Risk                      | P1        |
| SHR.03 | Penggambar banner (canvas): latar, foto menu terpotong sesuai bingkai, teks. **Review ketajaman foto dengan 3 sampai 4 menu (K5)**, foto gagal dimuat, dan **cek apakah template ikut tersimpan di cache otomatis (SH16)**.                  | Low-Risk                      | P1        |
| SHR.04 | Layar Bagikan: pilihan menu (tiga syarat dan baris keterangan, kotak Cari), pilihan template, deskripsi atau wording, pratinjau, Bagikan, Unduh PNG, Salin caption, draf di HP.                                                              | Low-Risk                      | P1        |
| SHR.05 | Home: tombol lebar **Bagikan** (customer dan owner) di atas baris tiga tombol, plus `bagikan.css`. Home owner dikabarkan hanya punya 2 tombol (QRIS, Bantuan); minta screenshot Home owner dulu (data dummy) sebelum mengubah `kerangka.js`. | Low-Risk                      | P1        |
| SHR.06 | ⚠️ Daftarkan `bagikan.js`, `bagikan-isi.js`, dan `bagikan.css` di `sw.js`, naikkan versi cache (**butuh "OK"**). Template gambar tidak didaftarkan (K2 disetujui ketua 21 Nov 2026). Commit tanpa `[skip ci]`.                               | High-Risk                     | P1        |
| SHR.07 | Sesi tes (Android, akun dummy): lihat bagian 9 daftar tes. Dokumen `bagikan-test.md` dibuat belakangan.                                                                                                                                      | Low-Risk (`sw.js`: High-Risk) | P1        |
| SHR.08 | Template tambahan dan wording diperkaya, dicicil (beberapa template per push; template gambar tidak masuk cache (K2), jadi `sw.js` tidak ikut tiap push).                                                                                    | Low-Risk                      | P2        |
| SHR.09 | Isi Bantuan tentang Bagikan (bersama BTN).                                                                                                                                                                                                   | Low-Risk                      | P2        |
| SHR.10 | Keputusan penjaga (K1) dan penyesuaian tombolnya bila ketua memutuskan penjaga ikut.                                                                                                                                                         | Low-Risk                      | P2        |

Urutan: SHR.01, SHR.02, SHR.03, SHR.04, SHR.05, SHR.06, SHR.07, lalu SHR.08 sampai SHR.10.

**Daftar tes SHR.07:** Bagikan ke WA Status; Unduh PNG; Salin caption (dan caption tidak hilang); menu tanpa foto, Habis, dan nonaktif tidak tampil; foto menu gagal dimuat (nama salah); nama menu panjang; deskripsi sampai batas; HP lama dan layar sempit; mode pesawat (layar tidak rusak); set owner dan set customer terpisah; Keluar lalu masuk akun lain tidak meninggalkan draf; baris tiga tombol lama di Home tidak berubah; ketajaman foto menu.

---

## 9. Aturan yang paling sering terlanggar

| Aturan                                                             | Akibat bila dilanggar                                                                    |
| ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Menyediakan isian harga bebas di banner owner                      | Banner bisa menampilkan harga yang beda dari harga order (SH8).                          |
| Customer boleh mengetik teks bebas                                 | Klaim atas nama warung tidak terkontrol (SH9).                                           |
| Nama customer atau data pribadi masuk banner atau caption          | Data pribadi tersebar lewat sosmed (SH24).                                               |
| Banner memuat menu Habis, nonaktif, atau tanpa foto                | Promosi sesuatu yang tidak bisa dipesan, atau banner jelek (SH6).                        |
| Ornamen template menutupi area foto atau teks                      | Kode menempel isi di atas ornamen; hasil berantakan (bagian 4).                          |
| Menyalin aset, logo, atau teks dari gambar referensi               | Masalah hak cipta; repo public (bagian 4 butir 10).                                      |
| Harga, tanggal, nomor WA, atau alamat tercetak di gambar latar     | Cepat usang dan salah; data pribadi nyata di repo public (SH24).                         |
| Menaruh alamat tautan di banyak tempat atau di gambar              | Domain berubah, semua template harus dibuat ulang (SH18).                                |
| Teks owner atau wording dipasang lewat `innerHTML`                 | Tag HTML bisa menjalankan skrip; gunakan teks biasa (`security.md` aturan 10).           |
| Berkas JS dan CSS baru tidak didaftarkan di `sw.js`                | Layar tidak terbuka offline (`AGENTS.md` bagian 7; butuh "OK").                          |
| Menambah template tanpa memperhatikan K2                           | Salah paham soal cache; satu berkas salah nama dapat membuat cache gagal bila terdaftar. |
| Commit yang menyentuh `public/` memakai `[skip ci]`                | Perubahan tidak terbit (blok `AGENTS.md` 12 Nov 2026).                                   |
| Mengubah baris tiga tombol Home (Gelar, QRIS, Bantuan) tanpa perlu | Merusak tampilan yang sudah teruji (SH20).                                               |
| Satu menu per banner dilanggar dengan menggabung menu di kode      | Harga jadi tidak satu angka dari server; buat menu paket sebagai menu sendiri (SH5).     |

---

## 10. Dampak dan Pembatalan

- **Tidak ada perubahan database, aksi `kedai`, atau fungsi SQL.** Tidak ada baris SEC baru.
- **Berkas baru di `public/`:** `bagikan.js`, `bagikan-isi.js`, `bagikan.css`, dan gambar template. **Berkas lama yang berubah (hanya tambahan):** `kerangka.js`, `index.html`, `sw.js`.
- **Pembatalan:** push ulang berkas lama dan buang tombol di Home. Tidak ada data di server yang perlu dibersihkan. Draf di HP tidak berbahaya dan hilang saat Keluar.
- **Beban jaringan:** tanpa panggilan server tambahan selain kemungkinan satu `menu_daftar` per pembukaan layar (SH23). Tiap template diunduh saat dipakai (SH16).
- **Dokumen lain yang perlu blok susulan:** `AGENTS.md` (peta bagian 5, pengecualian angka di database, pengecualian CSS, urutan versi 2, dan K2 yang sudah disetujui), `bonus.md` (urutan versi 2), `home.md` (tombol Bagikan), `menu.md` (foto menu dipakai Bagikan, K5), `bantuan.md` (SHR.09), dan `features.md` (layar customer dan owner).

---

## 11. Ditunda

- **Penyimpanan promo atau kampanye di database** (judul, teks, tanggal berlaku, daftar bersama antar owner). Butuh tulis-database baru dan sesi strategi sendiri; naik bila owner sering mengulang teks.
- **Customer mengetik kalimat sendiri**, atau **memilih nama menu plus kata sifat dari daftar**.
- **Nama customer di banner** (opsional dengan centang, bawaan mati).
- **Harga di banner customer.**
- **Lebih dari satu menu per banner** (saat ini paket = menu sendiri).
- **Pintasan Bagikan di sheet detail menu.**
- **Rasio 9:16** untuk Story, **font sendiri**, dan **foto khusus banner** (butuh kolom baru di tabel `menu`).
- **Pelacakan asal kunjungan lewat tautan bertanda** (Analitik fase 2, `bonus.md`).
- **Template musiman otomatis** (aktif hanya pada tanggal tertentu).

**Tidak dikerjakan:** banner dari teks bebas tanpa template, dan penyimpanan gambar banner di server.

---

## 12. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

_(belum ada blok)_
