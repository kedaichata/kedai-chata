# HANDOFF (gabungan): Teaser 30 detik "Kedai ChATA"

Status: **PAUSE** di tahap sensor rekaman layar. Dokumen ini menggantikan HANDOFF 2 dan HANDOFF 3 (sudah digabung, sesuai kondisi terakhir).

Upload file ini sebagai pesan pertama di chat baru, bareng `features.md`. Kalau mau AI menilai frame, upload juga screenshot preview CapCut (chat baru tidak bisa melihat file dari chat lama).

## Peran AI

Lanjutkan proyek dari status di bawah. Gaya: santai, bahasa Indonesia sehari-hari ("gw/lo" boleh), jujur soal yang tidak diketahui (jangan mengarang aturan harga atau fitur tool). Ini proyek coba-coba pertama, inkonsistensi kecil boleh, jangan perfeksionis.

## 1. Tujuan

- Video 9:16, maksimal 30 detik, **tanpa dialog** (teks tebal + musik, ditempel di CapCut).
- Live-action realistis, wajah Indonesia **fiktif** (bukan 3D cartoon, bukan orang nyata).
- Referensi "dracin" hanya untuk gaya aktor dan nuansa dramatis.

## 2. Tentang aplikasi (dari `features.md`)

Kedai ChATA adalah PWA order warung keluarga.

- **3 pihak:** Customer (±100), Owner (5), Penjaga (2+).
- **Status order:** Menunggu → Disetujui → Diproses → Diantar / Siap diambil / Siap disajikan → Selesai.
- **Tipe order:** Diantar (default), Diambil, Makan di warung. Fokus video hanya **Diantar**.
- Buku alamat customer maksimal 5 (alias + alamat). Pembayaran di luar aplikasi (WA).
- Owner menyetujui di **Order Masuk** (pilih metode bayar, lalu Setuju). Penjaga melihat **Antrean** (order Disetujui ke atas).
- **Warna brand:** marun gelap + emas. **Tagline:** "Pesan Rapi, Perut Tenang."
- `features.md` menandai fitur sebagai "rencana", tapi aplikasi sudah berjalan di rekaman layar. Tampilkan hanya layar yang benar-benar ada. Fitur Gelar, QRIS, dan Kotak masuk tidak masuk alur teaser.

**Larangan klaim di video:**

- Jangan sebut "real-time" (tanpa polling dan tanpa Realtime; data muncul saat dibuka atau tekan Segarkan).
- Jangan klaim aplikasi mencegah semua salah antar. Teks "Nggak ketukar lagi." **dibuang**.
- Jangan klaim bayar otomatis di aplikasi.
- Jangan tampilkan data pribadi di push atau layar (pakai data dummy atau blur).

## 3. Masalah nyata (jadi cerita)

- 90% order adalah makan siang anak sekolah. Warung persis di depan 3 sekolah, order diantar langsung ke sekolah.
- Alur lama: ibu kirim order ke WA owner (5 owner) → owner teruskan ke WA penjaga → penjaga scroll chat dan mencatat sendiri.
- Kalau satu catatan kelewat, anak tidak makan siang. Uang tidak dikembalikan, diganti hari lain.
- Bahan komedi: dua anak **nama sama** beda sekolah, kadang ketukar. Nama anak **Nanda** (netral gender). Alias alamat di app: **"SD Nanda"** dan **"SMP Nanda"**.

## 4. Tokoh

Semua wajah fiktif. Aset 3 sudut (depan, 34, badan), dibuat di Gemini.

- **Sari** (customer, ibu ±35): hijab krem polos, blus beige.
- **Bu Ratna** (owner ±45): hijab ungu, kacamata bulat tipis berbingkai hitam, apron marun di atas baju biru dongker.
- **Wulan** (penjaga ±25): hijab biru dongker, apron hitam di atas baju abu muda.
- **Anak SD** (perempuan, merah-putih, tas biru dongker) dan **anak SMP** (laki-laki, biru-putih, tas hitam): **selalu tanpa wajah**.

## 5. File di laptop (folder `teaserPWA`)

```
teaserPWA/
  klip/  adegan1a, adegan2a, adegan2a_scroll, adegan2a_catat, adegan3, adegan3b,
         adegan4_ratna, adegan5, layar_customer, layar_owner, layar_penjaga, layar_wa (.mp4)
  tokoh/ anak/ ratna/ sari/ wulan/
```

Belum dibuat: `audio/` (musik, efek suara) dan `final/` (hasil ekspor). **Jangan pindah/hapus folder ini**: proyek CapCut hanya me-link ke file asli.

## 6. Tool dan setup

- **CapCut Desktop di Mac**, versi 9.8.0 Beta (sempat crash sekali, lalu auto-update). Draft bernama **"1115"**, ada di Home CapCut. Simpan sering (Cmd+S).
- Proyek: **1080x1920, 30 fps**, Rec. 709 SDR, media "Stay in original location".
- **EditPilot** (AI chat Beta, pojok kanan bawah): pernah dicoba untuk blur, hasilnya setengah jalan (nomor WA lolos, status bar masih kelihatan).
- Jebakan yang pernah terjadi: mode razor tidak sengaja aktif (tiap klik memotong). Balikkan lewat dropdown di toolbar sebelah tombol `+` (pilih Select, atau tekan V). Handle di preview hanya muncul kalau klip terpilih sedang di bawah playhead.
- **Speed → Duration**: ketik durasi target untuk memadatkan klip.
- Blur: Effects → Gaussian Blur (gratis; yang berlian ungu = Pro). Mask Rectangle tidak bisa di-copy-paste rapi dan harus disesuaikan tiap frame kalau layar scroll.
- Generator klip: Kling (akun adik, mode hemat), Leonardo, Hailuo. Gambar tokoh: Gemini.

## 7. Status timeline (SUDAH JADI, total 29:20, dianggap pas)

Urutan dan teks sesuai rencana awal, tapi durasi nyata berbeda dari rencana. **Gunakan tabel ini, bukan tabel lama.**

| Klip              | Mulai (±dtk) | Catatan                                                                                                                       |
| ----------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `adegan1a`        | 0            | utuh ±5 dtk                                                                                                                   |
| `adegan2a`        | 5            | ±1,5 dtk                                                                                                                      |
| `adegan2a_scroll` | 6,5          | 1:12, sudah di-zoom, dagu hilang                                                                                              |
| `layar_wa`        | 8            | ±1 dtk, **sudah diblur penuh** (Gaussian Blur di track atas)                                                                  |
| `adegan2a_catat`  | 9            | ±2 dtk                                                                                                                        |
| `adegan3`         | 11           | ±3 dtk                                                                                                                        |
| `adegan3b`        | 14           | selesai di 18:21 (lebih panjang dari rencana)                                                                                 |
| `layar_customer`  | 18,7         | 2 potongan (Speed 5.7X dan 6.7X), ±1,6 dtk; "SD Nanda"/"SMP Nanda" masih terbaca                                              |
| `adegan4_ratna`   | 20,3         | 1:25. Audio bawaan **sengaja dipertahankan** (napas + noise warung). Saran: fade in/out ±0,2 dtk, musik direndahkan di ±20-22 |
| `layar_owner`     | 22           | 5 potongan: no order, alamat 1, setujui 1, alamat 2, setujui 2 (±3 dtk)                                                       |
| `layar_penjaga`   | 25           | 3 potongan: no order, alamat, momen klik "Mulai proses" (±1,9 dtk)                                                            |
| `adegan5`         | 27           | Speed 1.7X, 3:00, berakhir ±30                                                                                                |

Catatan: momen "Mulai proses" sengaja dipertahankan pengguna walau semula dilarang (status berubah Diproses). Tahan ±0,5 dtk dan jangan sampai layar status "Diproses" terbaca lama.

**Jadwal teks layar (disesuaikan dengan posisi nyata):**

| Detik     | Teks                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------ |
| 0-2,5     | "Anak dua, nama sama."                                                                           |
| 2,5-5     | "Sekolah beda."                                                                                  |
| 5-6,5     | "Nanda yang mana?"                                                                               |
| 6,5-8     | "Scroll."                                                                                        |
| 8-9       | "Tebak."                                                                                         |
| 9-11      | "Catat."                                                                                         |
| 11-14     | "Ketukar."                                                                                       |
| 14-18     | "Satu anak nggak makan siang."                                                                   |
| 18,7-20,3 | (tanpa teks, layar customer)                                                                     |
| 20,3-22   | (tanpa teks, Bu Ratna)                                                                           |
| 22-27     | tanpa teks, atau "Alamat beda, order beda." di ±25-27 (alternatif: "Tiap anak, alamat sendiri.") |
| 27,0-28,2 | "Pesan rapi."                                                                                    |
| 28,2-29,2 | "Perut tenang."                                                                                  |
| 29,2-30   | logo + tagline "Pesan Rapi, Perut Tenang." (boleh mulai 29,0; sederhana, langsung terbaca)       |

Geser ±0,5 detik boleh.

## 8. Pembersihan klip

**Selesai:**

- Semua audio bawaan di-mute, kecuali `adegan4_ratna`.
- `adegan2a_scroll` di-zoom (dagu hilang). Cek ulang sepanjang durasi.
- `layar_wa`: blur penuh (ada dua nomor HP orang dan link di isinya). Cek frame pertama dan terakhir, pastikan efek blur pas selebar klip.
- `layar_owner` potongan 1 (no order): status bar dicrop lewat Scale/Position, nama akun di kartu #103 dan #104 diblur.

**BELUM (alasan proyek dipause):**

- `layar_owner` potongan lain (alamat 1, setujui 1, alamat 2, setujui 2): status bar, nomor WA ("WA: 6281200000003" terlihat di detail #103), baris alamat dummy, nama akun. Efek Mosaic buatan EditPilot di klip ini belum diperiksa tuntas.
- `layar_penjaga` dan `layar_customer`: belum disentuh (crop status bar, nama akun "akun test 03 hom", baris alamat dummy "sd test 03 kelas 4-test03" dan "Smp 400 kota dummy", nomor WA). Alias "SD Nanda"/"SMP Nanda" harus tetap terbaca.
- Latar marun/emas di belakang rekaman layar (pita hitam kiri-kanan; rekaman ±572x1280, jangan di-stretch).
- Teks, logo, tagline, filter warna, musik, efek suara, ekspor ke `final/`.

## 9. Keputusan tetap

- Tanpa dialog. Anak tanpa wajah. Wajah fiktif saja. Nama anak: Nanda.
- Layar hp di klip AI tidak ditampilkan; tampilan app dan WA pakai rekaman layar asli.
- Teks, logo, dan tagline ditambah di CapCut. Tutup watermark Kling/Hailuo dengan teks atau logo (cek saat diputar).
- Filter tipis untuk menyamakan warna (rumah terang-sejuk, warung hangat).
- Font tebal (Montserrat/Poppins Bold), teks krem/emas, maksimal 2 baris, 1,5-2 detik per teks, margin dari UI TikTok/Reels.
- Musik: satu instrumental gratis (CapCut atau YouTube Audio Library), tegang sampai ±17 detik lalu hangat; rendahkan di ±20-22 supaya napas Bu Ratna terdengar. Efek suara opsional: swipe scroll (6,5-8), pena (9-11), "ting" saat owner setuju (±23).
- Ekspor 1080x1920, 30 fps, simpan di `final/`, cek di HP.

## 10. Rekomendasi untuk lanjut

1. **Rekam ulang 3 layar PWA dengan data bersih** (rekomendasi utama, ±10 menit, tanpa blur): nama akun customer netral, tanpa nomor WA di profil/detail, alamat dummy polos, alias tetap "SD Nanda" dan "SMP Nanda". Hindari bagian awal `layar_customer` lama (ada tulisan "<b>x</b>" di menu uji) dan bagian "Mulai proses" yang berlebihan. Ganti klip layar di timeline, atur ulang durasi (pola: owner 5 potongan, penjaga 3, customer 2).
2. Alternatif tanpa rekam ulang: zoom/crop agar data sensitif keluar frame, atau tutup dengan kotak warna marun per potongan (bukan mask blur).
3. Setelah layar bersih: latar marun/emas, teks, logo + tagline, filter, musik, efek suara, ekspor.
4. Opsional: klip Sari tersenyum di akhir adegan 5; ulang adegan 3 supaya kotak makan terlihat kosong; judul final (pernah dipakai "Jangan Sampai Kelewat").

**Aturan keras sebelum ekspor/publikasi:** tidak boleh ada frame yang menampilkan nomor WA, nama akun test/asli, nomor HP orang di `layar_wa`, atau teks "real-time"/"nggak ketukar lagi"/bayar otomatis. Cek dengan pause dan zoom di tiap potongan layar.

## 11. Pembuka chat baru

Tanya pengguna: sudah rekam ulang layar, atau mau lanjut dengan zoom/kotak marun? Lalu minta screenshot preview CapCut di potongan yang mau dikerjakan.
