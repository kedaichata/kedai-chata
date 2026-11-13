/docs/stepper-visual.md

# 🎨 stepper-visual.md: Stepper Status di Detail Pesanan Customer

> **Versi 1.0 (13 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Fitur ini murni kosmetik: garis progress berisi titik-titik di detail pesanan customer, supaya status terbaca sekilas (mirip aplikasi ojek online) dan customer tidak perlu bertanya lewat WA. Isinya sengaja **ramping**: hanya menggambar dari data yang sudah dikirim server.
> **Status:** Belum ada yang dikerjakan. Butir **(bawaan)** = pilihan penulis yang belum ditanyakan satu per satu; ketua boleh mengubahnya sebelum dikerjakan.
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini + `desain.md`** (warna dan komponen tema) dan **`public/pesanan.js`**. Untuk contoh pola dan langkah sambungan, AI meminta di awal sesi: `public/foto.js`, `public/ringkasan.css`, `public/index.html`, `public/sw.js`. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 7.
> **Tanpa kode dan tanpa isi CSS.** Nama kelas dan fungsi di sini deskriptif; nama persisnya ditetapkan saat coding.
> **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Prefix sheet:** VIS (bawaan).
> **Fitur ini Low-Risk (P2):** tampilan saja, tanpa data, server, atau akses. Satu langkah menyentuh `sw.js` dan butuh "OK" ketua (VIS.03).

---

## 1. Tujuan

Di layar **Pesanan Saya, langkah detail** (`pesanan.js`), customer melihat **garis progress 5 titik** yang menunjukkan sampai mana pesanannya berjalan. Badge status di kartu tetap ada dan **tidak diganti**; stepper hanya menambah gambaran sekilas.

Fitur ini **hanya menggambar**. Tidak mengubah server, tidak menambah panggilan, dan tidak menyentuh daftar pesanan, layar owner, atau layar penjaga.

---

## 2. Tabel Keputusan

| No   | Keputusan                                                                                                                                                                                                                                                                                                                                                                    | Catatan                                                                                                                                                                                                  |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VS1  | **Hanya layar customer, hanya detail pesanan.** Daftar pesanan, layar owner, dan layar penjaga tidak berubah. **Badge status tetap dipakai dan tidak diganti.**                                                                                                                                                                                                              | Keputusan ketua, 13 Nov 2026.                                                                                                                                                                            |
| VS2  | **5 titik dengan garis penghubung horizontal**, mewakili jalur sukses: Menunggu, Disetujui, Diproses, Diantar/Siap diambil/Siap disajikan, Selesai.                                                                                                                                                                                                                          | `order.md` bagian 4 (jalur status per tipe).                                                                                                                                                             |
| VS3  | **Tidak ada teks di sekitar stepper.** Tidak ada teks status di bawahnya (badge sudah menampilkannya) dan tidak ada nama di bawah titik. Makna dibawa oleh ikon, ukuran, dan warna.                                                                                                                                                                                          | Keputusan ketua, 13 Nov 2026: teks di bawah stepper tidak perlu. Layar tetap lega di HP. `desain.md` DS11 (status selalu dengan tulisan dan warna) tetap terpenuhi karena badge menyimpan tulisannya.    |
| VS4  | **Letak:** di dalam **kartu utama** (kartu "Pesanan #..."), di bawah baris tipe, jam, dan alamat. Kartu foto bukti, pembatal, alasan, dan "Isi pesanan" tetap di bawah kartu utama seperti sekarang. **(bawaan)**                                                                                                                                                            | Di `renderDetail()`, stepper dipasang sebelum kartu utama ditambahkan ke layar. Urutan kartu lain tidak berubah.                                                                                         |
| VS5  | **Titik dibaca dari status saja, bukan dari tipe.** Menunggu = titik 1, Disetujui = 2, Diproses = 3, Diantar atau Siap diambil atau Siap disajikan = 4, Selesai = 5. Tipe order tidak dibaca.                                                                                                                                                                                | Tiga nama status titik 4 sama-sama titik 4, dan namanya sudah mengikuti tipe dari server. Karena tidak ada teks di titik (VS3), tidak perlu tabel per tipe.                                              |
| VS6  | **Tampilan titik:** **terlewati** = warna lencana Selesai dengan centang (✓); **aktif** = emas terang dengan pinggir tegas, sedikit lebih besar (marun pekat tidak dipakai untuk status, `desain.md` 4.2); **belum tercapai** = abu-abu redup tanpa tanda. Warna memakai **variabel tema yang sudah ada** (`desain.md`), tanpa warna baru bila variabelnya ada. **(bawaan)** | Centang dan ukuran membuat makna tidak bergantung pada warna saja. Emas terang di atas latar terang tipis kontrasnya, jadi nilai final dicek di HP (VIS.04), seperti warna lain di `desain.md` 4.1.      |
| VS7  | **Satu animasi saja:** garis penghubung **tepat setelah titik aktif** bergerak pelan (shimmer). **Hanya saat order masih berjalan.** Selesai, Ditolak, dan Dibatalkan **tanpa animasi**. **(bawaan: shimmer, bukan denyut)**                                                                                                                                                 | Menandakan "sedang berjalan". Satu animasi cukup dan ringan.                                                                                                                                             |
| VS8  | **Status bisa mundur.** Mundur satu langkah (`order.md` O10) dan Alih hari (kembali ke Disetujui) membuat status turun. Stepper **selalu digambar ulang dari status terkini**, tanpa mengingat "pernah sampai titik berapa" dan tanpa animasi perpindahan.                                                                                                                   | Jalur tidak selalu naik. Cara paling aman: tidak menyimpan apa pun di HP.                                                                                                                                |
| VS9  | **Ditolak:** stepper berhenti di **titik 1**, titik itu **merah dengan tanda ✕**, sisanya redup. **Dibatalkan oleh customer:** sama. Alasan: keduanya hanya terjadi saat Menunggu (O8, O9), jadi titik terakhirnya pasti titik 1. Merah memakai warna bahaya yang sudah ada (`--bahaya`).                                                                                    | Sesuai kartu alasan dan kartu pembatal yang sudah ada di detail.                                                                                                                                         |
| VS10 | **Dibatalkan oleh owner (atau pembatal tidak diketahui): stepper tidak ditampilkan.** Owner bisa membatalkan dari Disetujui, Diproses, atau Diantar/Siap, dan **customer tidak menerima riwayat status**, jadi titik terakhir tidak diketahui. Aplikasi **tidak menebak**. Badge merah dan kartu pembatal yang sudah ada tetap menjelaskan. **(bawaan)**                     | Menampilkan stepper dengan titik tebakan menyesatkan customer. Server tidak diubah (VS11), jadi tidak ada data asal yang bisa dipakai.                                                                   |
| VS11 | **100% frontend.** Tidak ada perubahan server, fungsi SQL, aksi `kedai`, atau tabel. Stepper memakai isian yang sudah dibaca layar dari `order_detail` (status dan pembatal). **Tanpa panggilan baru dan tanpa polling.**                                                                                                                                                    | `AGENTS.md` bagian 4 dan 7.                                                                                                                                                                              |
| VS12 | **Kode di berkas baru `public/stepper.js`** (pola `foto.js`: satu fungsi yang dipanggil `renderDetail()` dengan wadah dan data order). `pesanan.js` **hanya ditambah** satu blok pemanggilan berpagar (dilewati bila stepper belum termuat) dan komentar kepala; **tidak ada baris lama yang dihapus.** **(bawaan)**                                                         | `pesanan.js` sudah sekitar 985 baris, jauh di atas batas "sekitar 500 baris" per berkas (`AGENTS.md` bagian 6). Berkas dikirim utuh tiap giliran (aturan 3), jadi `pesanan.js` jangan gemuk lagi.        |
| VS13 | **CSS di berkas baru `public/stepper.css`**, kelas berawalan `stp-`, dimuat setelah `style.css`. Pengecualian dari "semua gaya di satu `style.css`", mengikuti pola `game.css` dan `ringkasan.css`. **Keputusan ketua, 13 Nov 2026: tidak menambah isi `style.css` lagi.**                                                                                                   | `style.css` sudah panjang dan ketua ingin tidak makin gemuk (blok `AGENTS.md` 13 Nov 2026). Pengecualian ini perlu dicatat sebagai blok baru di `AGENTS.md` bagian 12 (aturan 7), seperti dua yang lama. |
| VS14 | **Animasi hanya CSS sederhana** (keyframes pada satu garis), **mati bila HP meminta gerakan dikurangi** (`prefers-reduced-motion`, seperti lingkaran `.putaran`). Tanpa timer JS, tanpa `requestAnimationFrame`, tanpa animasi per bingkai.                                                                                                                                  | Hemat baterai HP customer; kebanyakan ibu-ibu memakai HP biasa.                                                                                                                                          |
| VS15 | **Aksesibilitas:** wadah stepper diberi **label teks yang terbaca pembaca layar**, misalnya "Langkah 3 dari 5: Diproses", "Ditolak", atau "Dibatalkan", dari status server. Stepper sendiri bukan tombol dan tidak bisa diketuk.                                                                                                                                             | Label dipasang sebagai atribut, bukan teks yang tampil, jadi VS3 tetap utuh.                                                                                                                             |
| VS16 | **Keamanan teks:** semua teks (termasuk ✓ dan ✕) dipasang lewat **`textContent`**, bukan `innerHTML`. Elemen dibangun dengan `createElement`. **Status di luar daftar yang dikenal: stepper tidak ditampilkan, tanpa pesan galat.**                                                                                                                                          | `AGENTS.md` bagian 7. Layar tidak boleh rusak karena satu status asing.                                                                                                                                  |

---

## 3. Alur

1. Customer membuka detail pesanan. `renderDetail()` menggambar kartu utama seperti biasa.
2. Sebelum kartu utama dipasang, `renderDetail()` memanggil stepper dengan data order yang sudah ada (status dan pembatal). Bila `stepper.js` belum termuat, langkah ini dilewati dan layar tampil seperti sekarang.
3. Stepper menentukan tampilan dari tabel di bawah, lalu menambahkan elemennya ke kartu utama.
4. Data baru (Segarkan, push, kembali ke layar) menggambar ulang detail, dan stepper ikut digambar ulang dari status terkini (VS8).

**Tampilan per status:**

| Status                                                    | Tampilan                                                                     |
| --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Menunggu                                                  | Titik 1 aktif, titik 2 sampai 5 redup, garis setelah titik 1 bergerak.       |
| Disetujui                                                 | Titik 1 ✓, titik 2 aktif, sisanya redup, garis setelah titik 2 bergerak.     |
| Diproses                                                  | Titik 1 sampai 2 ✓, titik 3 aktif, sisanya redup, garis setelahnya bergerak. |
| Diantar, Siap diambil, atau Siap disajikan                | Titik 1 sampai 3 ✓, titik 4 aktif, titik 5 redup, garis setelahnya bergerak. |
| Selesai                                                   | Kelima titik ✓, tanpa animasi.                                               |
| Ditolak                                                   | Titik 1 merah ✕, titik 2 sampai 5 redup, tanpa animasi.                      |
| Dibatalkan oleh customer                                  | Sama dengan Ditolak.                                                         |
| Dibatalkan oleh owner, pembatal kosong, atau status asing | Stepper tidak ditampilkan (VS10, VS16).                                      |

---

## 4. Aturan yang paling sering terlanggar

| Aturan                                                                                      | Akibat bila dilanggar                                                                   |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Menulis teks status atau nama titik di bawah stepper                                        | Layar sesak dan dobel dengan badge; melanggar VS3 dan keputusan ketua.                  |
| Mengganti badge status dengan stepper                                                       | Melanggar VS1; badge tetap ada.                                                         |
| Memasang teks atau tanda lewat `innerHTML`                                                  | Risiko skrip dari teks server (`AGENTS.md` bagian 7, VS16).                             |
| Membaca `tipe` order untuk menentukan titik                                                 | Kode berlebih dan salah baca bila nama status berubah; titik cukup dari status (VS5).   |
| Menampilkan stepper penuh atau titik tebakan untuk order Dibatalkan oleh owner              | Customer disesatkan; asal pembatalan tidak diketahui (VS10).                            |
| Menyimpan "titik terakhir yang dicapai" di HP, atau menganimasikan perpindahan antar status | Salah saat status mundur atau Alih hari (VS8).                                          |
| Menganimasikan banyak elemen, memakai timer JS atau `requestAnimationFrame`                 | Boros baterai (VS14).                                                                   |
| Animasi tetap jalan pada order Selesai, Ditolak, atau Dibatalkan                            | Terkesan masih berjalan; menyesatkan (VS7).                                             |
| Makna hanya lewat warna (tanpa ✓ dan ✕, tanpa label)                                        | Tidak terbaca bagi yang sulit membedakan warna (VS6, VS15).                             |
| Memakai marun pekat sebagai warna status (titik aktif atau gagal)                           | Melanggar `desain.md` 4.2; marun dipakai untuk bingkai dan tombol utama.                |
| Menambah panggilan server, mengubah `order_detail`, fungsi SQL, atau aksi `kedai`           | Merusak inti sistem demi kosmetik; fitur ini frontend saja (VS11).                      |
| Menambah kode stepper langsung memanjangkan `pesanan.js`                                    | Berkas makin jauh dari batas ukuran; kirim utuh makin mahal (VS12).                     |
| Menghapus atau menulis ulang kode lama di `pesanan.js`                                      | Melanggar `AGENTS.md` aturan 2; hanya boleh menambah.                                   |
| `stepper.js` dan `stepper.css` tidak didaftarkan di cache `sw.js`                           | Layar tidak terbuka offline (`AGENTS.md` bagian 7; perubahan `sw.js` butuh "OK" ketua). |

---

## 5. Urutan Pekerjaan (untuk TODO sheet)

| ID     | Pekerjaan                                                                                                                                                                                                                                                                                                                        | Tipe     | Prioritas |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------- |
| VIS.01 | `public/stepper.css`: titik, garis, tiga keadaan titik, keadaan gagal, satu animasi pada garis, mati bila gerakan dikurangi (VS6, VS7, VS9, VS14). Variabel tema yang ada. Catat pengecualian CSS di `AGENTS.md` bagian 12 (blok siap tempel, tunggu setuju ketua).                                                              | Low-Risk | P2        |
| VIS.02 | `public/stepper.js`: fungsi pembangun stepper dari status dan pembatal (tabel bagian 3, VS5, VS8 sampai VS10, VS15, VS16), lalu satu blok pemanggilan berpagar di `renderDetail()` `pesanan.js` (VS4, VS12). Berkas `pesanan.js` dikirim utuh; kode lama tidak berubah.                                                          | Low-Risk | P2        |
| VIS.03 | Sambungan aplikasi: link `stepper.css` setelah `style.css` dan script `stepper.js` sebelum `pesanan.js` di `index.html`; daftarkan dua berkas di cache `sw.js` dan naikkan versi cache seperti pola sebelumnya. **Butuh OK ketua** (`sw.js`).                                                                                    | Low-Risk | P2        |
| VIS.04 | Visual sanity check di HP Android dengan akun dan order dummy: Menunggu, Disetujui, Diproses, titik 4 untuk tiga tipe, Selesai; Ditolak; Dibatalkan oleh customer; Dibatalkan oleh owner (stepper tidak tampil); mundur satu langkah dan Alih hari; animasi hanya pada order berjalan; mode pesawat; tidak ada `innerHTML` baru. | Low-Risk | P2        |

Urutan: VIS.01, VIS.02, VIS.03, VIS.04. Mengubah status order dummy butuh akun owner atau penjaga dummy.

---

## 6. Ditunda

- **Stepper mini di kartu daftar pesanan:** susulan, tidak mengubah yang sudah jadi.
- **Nama titik, waktu per tahap, atau estimasi selesai:** butuh riwayat status, yang tidak dikirim ke customer; ditunda.
- **Tampilan khusus untuk order Dibatalkan oleh owner** (misalnya satu strip merah tanpa posisi titik): tetap di sisi aplikasi, tanpa ubah server. Ditambah bila "tidak tampil" (VS10) terasa kurang di pemakaian nyata (`LNC.05`).
- **Stepper di layar owner dan penjaga:** tidak diminta.
- **Animasi tambahan atau denyut pada titik:** tidak dikerjakan di versi 1.

---

## 7. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik`. Yang paling akhir menang.

---

<!-- Berkas tujuan: docs/stepper-visual.md, tempel PALING BAWAH bagian 7. Append-only. -->

### 2026-11-13: Denyut pada titik aktif ditambahkan (menimpa VS7)

Keputusan ketua (disampaikan lewat PIC, sesi VIS.01). Alasan ketua selain yang tertulis di bawah belum tercatat.

- **Titik aktif kini berdenyut** (cincin emas membesar lalu memudar, CSS saja). **Garis setelah titik aktif tetap bergerak (shimmer)**, tidak diganti. Dua animasi ini boleh jalan bersamaan.
- **Menimpa** VS7 ("satu animasi saja", "bukan denyut") dan butir Ditunda "animasi tambahan atau denyut pada titik" di bagian 6. Yang paling akhir menang.
- Aturan lain tetap: hanya saat order masih berjalan (Selesai, Ditolak, Dibatalkan tanpa animasi), hanya CSS tanpa timer JS atau requestAnimationFrame (VS14), dan mati bila HP meminta gerakan dikurangi.
- Dampak: sedikit tambahan kerja HP untuk satu elemen (hanya transform dan opacity). Cek kelancaran di HP biasa saat VIS.04.
