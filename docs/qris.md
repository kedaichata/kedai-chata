/docs/qris.md

# 💳 qris.md: Tombol QRIS di Home

> **Versi 1.0 (14 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Usulan owner setelah demo progres: **tombol QRIS warung di tab Home, tepat di atas tombol Bantuan, untuk semua peran.** Owner meminta fitur ini ikut **versi 1**.
> **Status:** Belum ada yang dikerjakan. Butir **(bawaan)** = pilihan penulis yang belum ditanyakan satu per satu; ketua boleh mengubahnya sebelum dikerjakan.
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini + `home.md` + `desain.md`**, serta `public/index.html`, `public/kerangka.js`, `public/style.css`, dan `public/sw.js`. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 9.
> **Tanpa kode.** **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Prefix sheet:** QRS (bawaan).

---

## 1. Tujuan

Customer, owner, dan penjaga bisa **menampilkan QRIS warung dengan satu ketukan dari Home**, misalnya saat customer akan membayar sesuai arahan perwakilan ChATA lewat WA, atau saat ada pembeli langsung di warung.

Fitur ini **hanya menampilkan satu gambar tetap**. Tidak ada tabel, fungsi SQL, aksi `kedai`, atau panggilan server baru. Alur pembayaran **tidak berubah**: pembayaran diselesaikan di luar aplikasi, customer tidak memilih metode bayar, dan hanya owner yang menekan Setujui (`AGENTS.md` bagian 1).

---

## 2. Tabel Keputusan

| No   | Keputusan                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Catatan                                                                                                                              |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| QR1  | **Gambar QRIS disimpan sebagai berkas di `public/img/`** (seperti logo), bukan di database. Nama berkas **`qris.png`** (huruf kecil, tanpa spasi). Formatnya boleh diganti (misalnya `.jpg`) selama namanya dicatat di blok susulan.                                                                                                                                                                                                                                                | Keputusan ketua 14 Nov 2026. Tanpa database, tanpa Storage.                                                                          |
| QR2  | **Semua peran** (customer, owner, penjaga) melihat tombolnya dan gambarnya. Tidak ada pembatasan peran, jadi tidak ada aksi server yang perlu menolak.                                                                                                                                                                                                                                                                                                                              | Keputusan ketua. QRIS memang informasi publik warung.                                                                                |
| QR3  | **Letak: tombol di Home, tepat di atas tombol Bantuan**, dengan gaya tombol yang sama (berpinggir marun, DS12 tidak berlaku karena bukan aksi berbahaya). Label **"Bayar dengan QRIS" (bawaan)**. Tombol selalu tampil dan selalu bisa diketuk. **Urutan di Home customer (bawaan): kartu sapaan, Gelar Saya, QRIS, Bantuan.** Ini menggeser Gelar Saya dari "tepat di atas Bantuan" di `gelar.md` GL18 (yang paling akhir menang); owner dan penjaga: kartu sapaan, QRIS, Bantuan. | Keputusan ketua soal letak. Label bawaan penulis.                                                                                    |
| QR4  | **Tampil sebagai pop-up di atas Home (opsi A)**: gambar besar, kalimat petunjuk, dan tombol **Tutup**. Pop-up bisa ditutup dengan tombol Tutup, ketuk area gelap di luar kotak, atau tombol Esc, mengikuti pola kotak konfirmasi Keluar (DSN.08). Tidak ada layar baru dan tidak ada tombol Kembali ke Home.                                                                                                                                                                        | Keputusan ketua (opsi A). Pop-up tidak mengubah tab aktif dan tidak ikut sub-layar.                                                  |
| QR5  | **Kalimat di bawah gambar (bawaan):** "Bayar sesuai total pesanan, lalu kabari lewat WA. Pesanan diproses setelah pembayaran dikonfirmasi." Kalimat ini ditulis di kode, bukan di database (teks tetap, tanpa angka).                                                                                                                                                                                                                                                               | QRIS statis tidak membawa nominal, dan pembayaran tidak otomatis lunas. Selaras teks setelah Kirim di `order.md`.                    |
| QR6  | **Tombol "Simpan gambar" di pop-up (bawaan)**, berupa tautan unduh biasa ke berkas yang sama. Alasan: customer yang membayar dari HP yang sama tidak bisa memindai layar sendiri, jadi perlu menyimpan gambar lalu mengunggahnya di aplikasi bayarnya.                                                                                                                                                                                                                              | Bila ketua menganggap berlebihan, butir ini boleh dibuang tanpa mengubah yang lain. Dites di Android; iPhone diasumsikan jalan.      |
| QR7  | **Gambar harus tajam dan siap dipindai:** latar putih di sekeliling kode, kode tidak terpotong, resolusi cukup (saran sisi terpanjang sekitar 800 sampai 1000 px), ukuran berkas wajar (target di bawah sekitar 200 KB). Teks alternatif gambar: "QRIS Kedai ChATA".                                                                                                                                                                                                                | Dicek ketua di HP sungguhan dan dipindai dengan satu aplikasi bayar sebelum dianggap selesai.                                        |
| QR8  | **Repo ini public, jadi gambar QRIS bisa dilihat siapa saja yang membuka alamatnya.** Ini diterima: QRIS memang dipasang terbuka di warung. Yang dilarang masuk gambar atau berkas: data pribadi nyata di luar QRIS (nomor WA, alamat, nama perorangan).                                                                                                                                                                                                                            | Ketua sudah diberi tahu dan setuju (14 Nov 2026). `AGENTS.md` bagian 7 (data pribadi) tetap berlaku untuk hal lain.                  |
| QR9  | **Mengganti QRIS dilakukan ketua atau adik ketua:** ganti berkas `qris.png` dengan nama sama, lalu push (aturan anti-nyasar bagian 8 `AGENTS.md` berlaku). Karena `sw.js` memakai network first, gambar baru muncul di HP begitu online. Tidak perlu mengubah `sw.js` untuk penggantian berkas bernama sama.                                                                                                                                                                        | Keputusan ketua: perubahan ditangani ketua atau adiknya, bukan owner. Owner mengganti sendiri dari aplikasi adalah kandidat versi 2. |
| QR10 | **Berkas `qris.png` dan `qris.js` wajib didaftarkan di daftar cache `sw.js`** (agar QRIS tetap tampil saat offline), dan nama cache dinaikkan (sekarang `chata-v27`, menjadi `chata-v28`). Menyentuh `sw.js` butuh "OK" ketua.                                                                                                                                                                                                                                                      | `AGENTS.md` bagian 7.                                                                                                                |
| QR11 | **Gaya pop-up ditaruh di `public/style.css`, tanpa `qris.css` baru**, memakai ulang gaya kotak konfirmasi yang sudah ada bila memungkinkan. Kelas baru berawalan `qrs-`.                                                                                                                                                                                                                                                                                                            | Keputusan ketua 14 Nov 2026. Menghindari berkas dan pengecualian CSS baru untuk hal sederhana.                                       |
| QR12 | **Kode di berkas kecil `public/qris.js`** (membuka dan menutup pop-up, memasang gambar dan teks). Tombol ditambah di `public/index.html`. Teks dipasang lewat `textContent`.                                                                                                                                                                                                                                                                                                        | `AGENTS.md` bagian 3 dan 7.                                                                                                          |
| QR13 | **Pop-up ikut ditutup saat Keluar** (HP dipakai bergantian), seperti kewajiban layar lain pada `kerangka.js` `reset()`. Gambar QRIS tidak berisi data pengguna, jadi tidak ada data yang perlu dihapus.                                                                                                                                                                                                                                                                             | Konsistensi dengan DSN.08.                                                                                                           |

---

## 3. Alur

1. Pengguna (peran apa pun) membuka Home dan mengetuk **Bayar dengan QRIS**.
2. Pop-up muncul di atas Home: gambar QRIS, kalimat petunjuk (QR5), tombol **Simpan gambar** dan **Tutup**.
3. Pengguna memindai atau menyimpan gambar, lalu menutup pop-up dan kembali ke Home di posisi semula.

Tidak ada panggilan server di seluruh alur.

---

## 4. Yang dibuat

| Komponen                | Isi                                                                                 |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `public/img/qris.png`   | Gambar QRIS warung, disiapkan ketua (QR7).                                          |
| `public/index.html`     | Tombol di atas tombol Bantuan dan wadah pop-up (hanya tambahan).                    |
| `public/qris.js` (baru) | Buka dan tutup pop-up, tutup saat Keluar.                                           |
| `public/style.css`      | Gaya pop-up, kelas `qrs-` (hanya tambahan).                                         |
| `public/kerangka.js`    | Hanya bila perlu: pemanggilan tutup pop-up di `reset()` (hanya tambahan).           |
| `public/sw.js`          | Daftar cache bertambah `qris.png` dan `qris.js`, versi cache naik (**butuh "OK"**). |

---

## 5. Urutan Pekerjaan (untuk TODO sheet, prefix QRS)

| ID     | Pekerjaan                                                                                                                                                                                                                         | Tipe     | Prioritas |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------- |
| QRS.01 | Siapkan gambar QRIS sesuai QR7 dan taruh sebagai `public/img/qris.png` (bagian ketua).                                                                                                                                            | Low-Risk | P1        |
| QRS.02 | Tombol di Home dan pop-up: tombol, gambar, kalimat, Simpan gambar, Tutup (tombol, ketuk luar, Esc), tutup saat Keluar. Menyentuh `index.html`, `style.css`, berkas baru `qris.js`.                                                | Low-Risk | P1        |
| QRS.03 | ⚠️ Daftarkan `qris.png` dan `qris.js` di cache `sw.js`, naikkan versi cache (**butuh "OK"**). Dipush bersama QRS.02 agar tidak ada berkas yang belum terdaftar.                                                                   | Low-Risk | P1        |
| QRS.04 | Tes tampilan dengan akun dummy tiga peran: tombol di atas Bantuan; pop-up terbuka dan tertutup tiga cara; mode pesawat tetap menampilkan QRIS; QRIS terpindai di aplikasi bayar; Simpan gambar di Android; Keluar menutup pop-up. | Low-Risk | P1        |

Urutan: QRS.01, QRS.02 bersama QRS.03, QRS.04.

---

## 6. Aturan yang paling sering terlanggar

| Aturan                                                              | Akibat bila dilanggar                                                 |
| ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Menyimpan QRIS di database atau Storage, atau membuat aksi `kedai`  | Menambah panggilan server dan risiko tanpa perlu (QR1).               |
| Mengesankan QRIS otomatis melunasi atau mengubah status order       | Customer mengira sudah lunas; hanya owner yang menekan Setujui (QR5). |
| Berkas `qris.png` atau `qris.js` tidak didaftarkan di cache `sw.js` | QRIS gagal tampil saat offline (QR10, `AGENTS.md` bagian 7).          |
| Gambar buram, terpotong, atau tanpa latar putih                     | Gagal dipindai; customer bingung dan bertanya lewat WA (QR7).         |
| Menaruh data pribadi nyata di gambar atau berkas lain               | Repo public (QR8, `AGENTS.md` bagian 7).                              |
| Menambah `qris.css` atau gaya langsung di JS tanpa keputusan        | Pengecualian CSS baru yang tidak dicatat (QR11).                      |
| Pop-up tetap terbuka setelah Keluar                                 | Layar tertinggal saat HP dipakai bergantian (QR13).                   |
| Menyentuh `sw.js` tanpa "OK" ketua                                  | Melanggar `AGENTS.md` bagian 7.                                       |

---

## 7. Dampak dan Pembatalan

- **Tidak menyentuh data:** tidak ada tabel, fungsi, atau Edge Function baru. Dibatalkan dengan push ulang berkas lama dan menghapus `qris.png` dan `qris.js` dari daftar cache `sw.js`.
- **Perubahan tampilan:** Home bertambah satu tombol di atas Bantuan; layar sedikit lebih panjang.
- **Dokumen lain yang perlu blok susulan:** `AGENTS.md` (peta bagian 5 dan rencana versi; bila QR11 diubah, pengecualian CSS), `home.md` (tombol QRIS di atas Bantuan), `features.md` (layar per peran dan urutan versi 1), `desain.md` (pop-up QRIS), `bonus.md` (kandidat versi 2). Bantuan (BTN.05) boleh menambah satu jawaban singkat tentang cara membayar dengan QRIS.
- **Peluncuran:** tidak mundur berarti; fitur ini kecil dan dikerjakan sebelum LNC.04.

---

## 8. Ditunda

- **Owner mengganti QRIS sendiri dari aplikasi** (butuh Storage atau tulis-database; kandidat versi 2, mirip B28).
- **QRIS dinamis dengan nominal otomatis** dan **payment gateway** (B6, versi 3).
- **Beberapa QRIS atau pilihan rekening bank.**
- **Zoom atau cetak gambar dari dalam pop-up.**

**Tidak dikerjakan:** perubahan status order otomatis setelah customer membayar.

---

## 9. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

_(belum ada blok)_
