/docs/wa-notif.md

# 📱 wa-notif.md: Notifikasi WhatsApp via Gateway Lokal (Sementara, Pelengkap Push)

> **Versi 1.0 (14 Nov 2026), draf hasil sesi strategi (final untuk sesi kode setelah ketua memeriksa butir "(bawaan)").** Permintaan owner, disetujui ketua, untuk memudahkan peralihan pelanggan dari WA ke aplikasi. Fitur ini **sementara** (sekitar 1 sampai 2 bulan sejak peluncuran ke customer), **pelengkap** push dan Kotak masuk, dan hanya untuk **4 kejadian**. Kegagalannya tidak boleh mengganggu order.
> **Peluncuran mundur lagi sekitar 2 sampai 3 hari** (dari Rabu ke akhir pekan berikutnya) atas permintaan owner, disetujui ketua. Total mundur dari rencana awal: belum tercatat.
> **Status:** Belum ada yang dikerjakan. Butir **(bawaan)** = pilihan penulis yang belum ditanyakan satu per satu; ketua boleh mengubahnya sebelum dikerjakan.
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini + `notifikasi.md`** (titik pemanggilan) + **`database.md`** dan **`security.md`** (menyentuh tabel `staf`, fungsi SQL, rahasia) + `supabase/functions/kedai/index.ts`, `inbox.ts`, `kirim_push.ts`. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 9.
> **Tanpa kode dan tanpa isi SQL.** Nama tabel, kolom, dan fungsi di sini deskriptif; nama persisnya ditetapkan saat SQL ditulis dan dicatat di berkas migration.
> **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Prefix sheet:** WAG (bawaan).

---

## 1. Tujuan

Pelanggan yang terbiasa dengan WA mendapat **kabar otomatis lewat WhatsApp** untuk kejadian tertentu, selama masa peralihan dari WA ke aplikasi. Ini pelengkap Push (VAPID) dan Kotak masuk, bukan jalur utama. Status yang pasti tetap ada di aplikasi (NT12).

Sifatnya **sementara**: dipakai sekitar 1 sampai 2 bulan sejak peluncuran ke customer, lalu **dievaluasi** (WAG01): dihentikan, atau, bila banyak pelanggan yang protes, owner berencana berlangganan WA resmi (kandidat, lihat bagian 8).

Fitur ini "tembak dan lupakan". **Owner menyadari dan menerima** bahwa pesan WA tidak dijamin terkirim (laptop gateway bisa mati, jalur ngrok bisa putus atau kena kuota, nomor pengirim tidak resmi dan bisa diblokir). **Kegagalan pengiriman tidak boleh membatalkan, menunda, atau mengubah aksi order.**

---

## 2. Tabel Keputusan

| No    | Keputusan                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Catatan                                                                                                                                                                                                                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WAG01 | **Sementara dan ada titik evaluasi.** Dipakai sekitar 1 sampai 2 bulan **sejak peluncuran ke customer** (bukan sejak fitur menyala). Sesudahnya: stop total, atau beli paket WA resmi bila banyak yang protes (rencana owner). Keluhan dihitung di review pemakaian (`LNC.05`).                                                                                                                                                                                                 | Rencana owner. Tanggal tidak ditulis karena tanggal peluncuran masih bergeser.                                                                                                                                                     |
| WAG02 | **Non-blocking (fire and forget), jalan di latar belakang.** `kedai` mengirim setelah aksi order berhasil, memakai pola yang sama dengan pengirim push (`EdgeRuntime.waitUntil` bila ada), sehingga **balasan ke aplikasi tidak menunggu WA**. Kegagalan tidak membatalkan aksi.                                                                                                                                                                                                | Mengikuti NT4 (`notifikasi.md`). Bukan pengecualian tulis-database: ini panggilan HTTP keluar, tidak menulis database.                                                                                                             |
| WAG03 | **Timeout 3 detik per permintaan ke gateway.** Lewat 3 detik, permintaan dibatalkan dan dianggap gagal; aksi order tetap sukses. Timeout adalah batas sabar `kedai`, **bukan janji pesan sampai di HP**.                                                                                                                                                                                                                                                                        | Angka ini **tetap di kode** (pengecualian dari "angka di database", `AGENTS.md` bagian 1) karena fitur sementara; dicatat di blok susulan `AGENTS.md`. Karena jalan di latar belakang, customer tidak merasakannya.                |
| WAG04 | **Konfigurasi hanya di Secret dashboard fungsi `kedai`:** `WA_GATEWAY_URL` dan `WA_GATEWAY_API_KEY` (**rahasia**), serta `WA_URL_APLIKASI` (alamat aplikasi untuk link di pesan; **bukan rahasia**, tetapi dibuat variabel supaya bisa diganti tanpa deploy). Dilarang di `public/config.js`, kode, repo, md, atau chat. **Bila URL atau key kosong, `kirim_wa` dilewati diam-diam.**                                                                                           | Itulah cara mematikan fitur tanpa ubah kode. Tidak ada tombol aktif/nonaktif di aplikasi dan tidak ada kolom pengaturan di database. Bila `WA_URL_APLIKASI` kosong, link dilewati dan pesan tetap terkirim.                        |
| WAG05 | **Payload minimal dan satu arah:** hanya `number` (bentuk `62xxx`) dan `message`. Endpoint `POST /send-message` dengan header `x-api-key`, `Content-Type: application/json`, dan `ngrok-skip-browser-warning: true`. Aplikasi tidak membaca balasan WA dari pelanggan.                                                                                                                                                                                                          | Endpoint gambar tidak dipakai (bagian 8).                                                                                                                                                                                          |
| WAG06 | **Isi pesan: teks umum, tanpa data pribadi.** Urutan: kalimat kejadian, link aplikasi (bila ada), footer **"Jangan balas pesan ini ya"**. Boleh memuat **nomor order**. Link **umum, tanpa ID order atau parameter**. Tabel teks ada di bagian 4.1. **(bawaan untuk nomor order)**                                                                                                                                                                                              | Memperluas `security.md` aturan 16 ke WA (blok susulan). Pesan WA bisa tampil di layar kunci.                                                                                                                                      |
| WAG07 | **WA hanya untuk 4 kejadian** (bagian 4.1): order baru ke owner; disetujui ke customer; disetujui ke penjaga; status Diantar, Siap diambil, atau Siap disajikan ke customer. Kejadian lain (tolak, catatan, batal, alih hari, foto, Diproses, Selesai, mundur status) **tidak mengirim WA**.                                                                                                                                                                                    | Status **tujuan** menentukan, bukan nama kejadian `status` secara umum.                                                                                                                                                            |
| WAG08 | **Order wakil owner (O15) tidak mengirim WA** ke siapa pun, termasuk penjaga (push saja, seperti sekarang). **(bawaan)** Pemesan tanpa akun tidak dikirimi WA walau nomornya tersimpan.                                                                                                                                                                                                                                                                                         | Konsisten dengan O15 dan GL6: pemesan wakil tidak punya akun. Sengaja berbeda dari `setujui` biasa; ketua boleh mengubah.                                                                                                          |
| WAG09 | **Risiko yang diterima owner:** (a) pesan tidak terkirim bila laptop mati, ngrok putus atau kena kuota, atau script dimatikan; (b) nomor pengirim tidak resmi dan bisa diblokir; (c) antrean di laptop hilang bila script restart; (d) **nomor WA customer dan staf keluar dari sistem** ke laptop gateway lewat ngrok; (e) tidak ada opt-out per pelanggan; (f) balasan pelanggan masuk ke nomor pengirim dan **tidak dibaca siapa pun**. Order tetap jalan dalam semua kasus. | Persetujuan owner (permintaan owner, disetujui ketua).                                                                                                                                                                             |
| WAG10 | **Nomor pengirim anonim dan terpisah dari urusan order** (order hanya masuk lewat aplikasi, tidak lewat WA). Bila diblokir, order tidak terpengaruh; yang hilang hanya notifikasi WA.                                                                                                                                                                                                                                                                                           | Keterangan ketua: nomor dipegang adik ketua.                                                                                                                                                                                       |
| WAG11 | **Sumber nomor.** Customer: kolom nomor WA di `profil` (sudah ada, bentuk `62xxx`). Staf: **kolom baru `nomor_wa` di tabel `staf`** (teks, boleh kosong, bentuk `62xxx`), **diisi ketua lewat SQL Editor** dengan nomor yang diketik langsung di dashboard. Nomor kosong atau bentuk tidak sah: **pesan itu dilewati diam-diam**.                                                                                                                                               | Menambah kolom pada tabel yang sudah ada: berisiko, butuh penjelasan dampak dan "OK" ketua (`AGENTS.md` bagian 2 butir 5). Staf tetap hanya diubah ketua; `service_role` tetap hanya baca. Nomor tidak pernah dikirim ke aplikasi. |
| WAG12 | **Satu fungsi SQL baca-saja** (nama usulan `wa_nomor_ambil`) mengembalikan, untuk daftar akun, `{akun, peran, nomor}`; pola `push_langganan_ambil`. `SECURITY DEFINER`, `search_path` kosong, `EXECUTE` hanya `service_role`. Batas 100 akun per panggilan (usulan). Hasilnya hanya dipakai `kedai`, tidak dikirim ke aplikasi dan tidak ditulis di log.                                                                                                                        | **Tidak ada tulis-database baru** dan tidak ada pengecualian baru dari aturan bagian 7. Peran dikembalikan karena teks pesan beda untuk customer dan penjaga pada kejadian yang sama.                                              |
| WAG13 | **Urutan kirim: customer dulu, baru staf.** Staf sudah dapat push, jadi bila antrean lama, yang telat staf. **Bila satu pengiriman gagal karena timeout atau gateway tidak terjangkau, sisa penerima kejadian itu dilewati** (tidak menunggu 3 detik berkali-kali). **(bawaan)**                                                                                                                                                                                                | Menghindari latar belakang yang berlarut saat gateway mati.                                                                                                                                                                        |
| WAG14 | **Antrean dan jeda ada di gateway (jalur utama).** Gateway langsung membalas "diterima", lalu mengirim satu per satu dengan **jeda acak 3 sampai 8 detik**; antrean **maksimal 50 pesan**, penuh = ditolak dengan pesan jelas. Karena itu "berhasil" dari gateway berarti **diterima antrean**, bukan sudah masuk HP.                                                                                                                                                           | Jeda acak lebih mirip manusia daripada jeda tetap. Angka 3 sampai 8 dan 50 adalah usulan penulis yang disetujui ketua di sesi strategi; boleh diubah adik ketua.                                                                   |
| WAG15 | **Jalur cadangan bila gateway belum direvisi:** `kedai` mengirim berurutan di latar belakang dengan jeda kecil antar pesan. Lebih rapuh (satu kejadian bisa makan puluhan detik di latar belakang; batas waktu latar belakang platform **belum dicek**) dan risiko blokir lebih besar. Dipakai hanya bila revisi gateway telat.                                                                                                                                                 | Risiko ikut diterima di WAG09.                                                                                                                                                                                                     |
| WAG16 | **Pagar gateway (tugas adik ketua, di luar repo):** `x-api-key` wajib dan dibandingkan dengan aman, halaman QR (`/`) **hanya bisa dibuka dari laptop sendiri** (tidak lewat ngrok), server hanya mendengarkan `127.0.0.1`, nomor divalidasi `62xxx`, pesan divalidasi teks dengan batas panjang, `/send-image` dimatikan, reconnect memakai satu koneksi database dan jeda bertahap.                                                                                            | Rincian di `index.js` revisi yang diserahkan ke adik ketua (tidak masuk repo). Dibuktikan lewat SEC-45.                                                                                                                            |
| WAG17 | **Gateway dijalankan manual lewat script (on-demand), bukan service.** Tidak otomatis hidup setelah laptop restart. "Laptop selalu nyala" hanya janji untuk **masa tes**. Adik ketua yang menyalakan dan mematikan script.                                                                                                                                                                                                                                                      | Kondisi operasional, bukan galat.                                                                                                                                                                                                  |
| WAG18 | **Domain ngrok statis (`ngrok-free.dev`)**, jadi `WA_GATEWAY_URL` diisi sekali. **Dibuktikan** dengan restart script sekali di masa tes (URL harus sama). Kuota ngrok paket gratis (screenshot adik ketua 14 Nov 2026): transfer keluar 1 GB per bulan, 4.000 koneksi HTTP per menit. Penggunaan dicek di `LNC.05`. Kuota habis = sama dengan laptop mati.                                                                                                                      | Pesan teks sangat kecil, kuota diperkirakan longgar (perkiraan, bukan data pemakaian). URL ngrok tidak dibagikan di chat.                                                                                                          |
| WAG19 | **Script, sesi login WA, berkas `.env`, dan URI database gateway tidak masuk repo** (repo public). Sesi WA yang tersimpan di database gateway sama sensitifnya dengan rahasia.                                                                                                                                                                                                                                                                                                  | `AGENTS.md` bagian 7.                                                                                                                                                                                                              |
| WAG20 | **Cara mematikan:** kosongkan atau hapus `WA_GATEWAY_URL` dan `WA_GATEWAY_API_KEY` di dashboard (tanpa deploy ulang kode), lalu matikan script. Kolom `nomor_wa` di `staf` **dibiarkan** (tidak berpengaruh; berguna bila nanti pindah ke WA resmi).                                                                                                                                                                                                                            | Bila kode `kirim_wa` mau dicabut: butuh deploy `kedai` dan "OK".                                                                                                                                                                   |

---

## 3. Alur

1. Aksi order berhasil di `kedai` (simpan database, `inbox_tulis`, push) dan aplikasi mendapat balasan.
2. Di titik yang sama dengan `tulisInbox` dan pengirim push, `kedai` mengecek: kejadian ini termasuk 4 kejadian WAG07? Untuk `status`, hanya bila status tujuan Diantar, Siap diambil, atau Siap disajikan.
3. Bila ya dan secret terisi, di latar belakang `kedai` memanggil `wa_nomor_ambil` untuk akun penerima, membuang nomor kosong atau bentuk tidak sah, mengurutkan customer lebih dulu, lalu mengirim satu per satu ke gateway (timeout 3 detik tiap permintaan).
4. Gateway membalas "diterima", menaruh pesan di antrean, dan mengirimnya ke WA dengan jeda acak 3 sampai 8 detik.
5. Timeout, galat, atau gateway mati: dicatat singkat di log `kedai` (tanpa nomor dan tanpa isi pesan), sisa penerima kejadian itu dilewati, dan **tidak ada efek ke order**.
6. Pelanggan tetap mendapat kabar lewat push, Kotak masuk, atau membuka aplikasi.

---

## 4. Yang dibuat

### 4.1 Kejadian, penerima, dan teks

Format tiap pesan: kalimat kejadian, baris kosong, `Buka aplikasi: <WA_URL_APLIKASI>` (dilewati bila kosong), baris kosong, `Ini pesan otomatis. Jangan balas pesan ini ya.` Teks di bawah adalah **contoh yang boleh disesuaikan ketua dan owner** sebelum dikode.

| Kejadian                    | Penerima                   | Kalimat kejadian (contoh)                    |
| --------------------------- | -------------------------- | -------------------------------------------- |
| Order baru masuk (Menunggu) | Owner (yang punya nomor)   | "Kedai ChATA: ada order baru."               |
| Setujui                     | Customer pemilik           | "Kedai ChATA: pesananmu #N sudah disetujui." |
| Setujui                     | Penjaga (yang punya nomor) | "Kedai ChATA: ada order disetujui."          |
| Status jadi Diantar         | Customer pemilik           | "Kedai ChATA: pesananmu #N sedang diantar."  |
| Status jadi Siap diambil    | Customer pemilik           | "Kedai ChATA: pesananmu #N siap diambil."    |
| Status jadi Siap disajikan  | Customer pemilik           | "Kedai ChATA: pesananmu #N siap disajikan."  |

Aturan tambahan: pelaku aksi tidak dikabari atas aksinya sendiri (sama dengan push). Penerima dihitung dengan aturan yang sama dengan `inbox_tulis`, tidak ada hitungan kedua. **Tidak ada** WA untuk: tolak, catatan, batal, alih hari, foto, Diproses, Selesai, mundur satu langkah, order wakil (WAG08).

### 4.2 Komponen

| Komponen                         | Isi                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kolom `nomor_wa` di `staf`       | Teks, boleh kosong, bentuk `62xxx` (pagar bentuk di tabel). Migration berisiko (WAG11). Cek hak setelahnya: `service_role` pada `staf` tetap hanya baca.                                                                                                                            |
| Template isi nomor staf          | Di `supabase/templates/`, isian placeholder, **diisi di SQL Editor saja**; nomor nyata tidak disimpan di repo.                                                                                                                                                                      |
| Fungsi SQL baca-saja             | WAG12.                                                                                                                                                                                                                                                                              |
| Berkas baru `kirim_wa.ts`        | Di `supabase/functions/kedai/` (blok `AGENTS.md` 9 Nov 2026): daftar kejadian aktif, pembuatan teks, pengambilan nomor, pengiriman berurutan dengan timeout 3 detik. Bagian "mengirim ke gateway" dibuat mudah diganti (bila nanti pindah ke WA resmi). `index.ts` hanya sambungan. |
| Secret dashboard                 | `WA_GATEWAY_URL`, `WA_GATEWAY_API_KEY`, `WA_URL_APLIKASI` (WAG04).                                                                                                                                                                                                                  |
| Gateway di laptop (di luar repo) | Revisi `index.js` (WAG14, WAG16), dikerjakan adik ketua.                                                                                                                                                                                                                            |

---

## 5. Urutan Pekerjaan (untuk TODO sheet, prefix WAG)

Langkah ⚠️ butuh penjelasan dampak dan "OK" ketua.

| ID     | Pekerjaan                                                                                                                                                                                              | Tipe      | Prioritas |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | --------- |
| WAG.01 | ⚠️ Migration kolom `nomor_wa` di `staf` (pagar bentuk, boleh kosong), salinan dan pembatal di `supabase/migrations/`, query cek hak. Cek skema `staf` lebih dulu (jangan menebak kolom).               | High-Risk | P0        |
| WAG.02 | ⚠️ Fungsi SQL baca-saja `wa_nomor_ambil`, salinan dan pembatal di repo, query cek hak, uji dengan data dummy.                                                                                          | High-Risk | P0        |
| WAG.03 | ⚠️ Pasang tiga secret di dashboard fungsi `kedai` (`WA_GATEWAY_URL`, `WA_GATEWAY_API_KEY`, `WA_URL_APLIKASI`). Dua yang pertama rahasia: diketik langsung di dashboard, tidak lewat chat.              | High-Risk | P0        |
| WAG.04 | **Tugas adik ketua (di luar repo):** revisi gateway (antrean, jeda acak, `/` hanya dari laptop, listen `127.0.0.1`, validasi, `/send-image` mati, reconnect aman) dan tes sendiri dengan nomor tester. | High-Risk | P0        |
| WAG.05 | ⚠️ `kirim_wa.ts` dan sambungan di `index.ts` dan `inbox.ts` (hanya tambahan), 4 kejadian, deploy `kedai` dengan urutan aman `AGENTS.md` bagian 8 (tanpa `--no-verify-jwt`).                            | High-Risk | P0        |
| WAG.06 | Ketua mengisi `nomor_wa` staf aktif lewat SQL Editor (nomor diketik di dashboard) dan nomor tester di profil akun dummy (diisi lewat aplikasi, tidak ditempel ke chat).                                | Low-Risk  | P1        |
| WAG.07 | Tes skenario normal dengan akun dan nomor tester: 4 kejadian, urutan customer dulu, teks sesuai tabel 4.1; restart script sekali dan pastikan URL ngrok tetap sama (WAG18).                            | Low-Risk  | P1        |
| WAG.08 | ⚠️ Tes skenario gagal: script dimatikan. Order tetap sukses dalam waktu normal, tanpa galat di layar. Ini tes terpenting.                                                                              | High-Risk | P0        |
| WAG.09 | Evaluasi sekitar 1 sampai 2 bulan sejak peluncuran: stop, atau lanjut ke WA resmi (butir baru di `bonus.md`). Cek penggunaan ngrok, jumlah keluhan, dan nomor pengirim masih aman (bersama `LNC.05`).  | Low-Risk  | P2        |

Urutan: WAG.01, WAG.02, WAG.03, WAG.04 (paralel, adik ketua), SEC-44 dan SEC-45, WAG.05, WAG.06, WAG.07, WAG.08, SEC-40 sampai SEC-43, WAG.09.

---

## 6. Aturan yang paling sering terlanggar

| Aturan                                                                     | Akibat bila dilanggar                                                  |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| URL ngrok atau API key di `public/config.js`, kode, repo, md, atau chat    | Siapa pun bisa menembak gateway; repo public tidak lagi aman (SEC-41). |
| Menunggu (await) gateway di jalur balasan ke aplikasi                      | Order terasa macet; WAG02 mewajibkan latar belakang.                   |
| Menggagalkan atau menunda order karena WA gagal                            | Melanggar WAG02 dan WAG09. Order inti, WA pelengkap.                   |
| Pesan memuat nama, alamat, isi catatan, nama menu, atau alasan             | Terbaca di layar kunci; melanggar aturan 16 yang diperluas (SEC-42).   |
| Link di pesan memuat ID order atau parameter                               | Data order ikut ke jalur pihak ketiga (WAG06).                         |
| WA untuk kejadian di luar 4 kejadian WAG07 (termasuk Diproses dan Selesai) | Beban dan risiko blokir bertambah; melanggar keputusan owner (SEC-43). |
| Mengirim nomor staf atau customer ke aplikasi, atau mencatatnya di log     | Data pribadi bocor lewat layar atau log (SEC-44).                      |
| Memberi `service_role` hak tulis pada `staf`                               | Peran bisa dimanipulasi; `staf` hanya diubah ketua lewat SQL Editor.   |
| Menuliskan nomor nyata di berkas SQL, template, md, atau chat              | Repo public; melanggar `AGENTS.md` aturan 11.                          |
| Tombol aktif/nonaktif WA di aplikasi atau kolom pengaturan baru            | Kompleksitas tidak perlu; cukup kosongkan secret (WAG04, WAG20).       |
| Halaman QR gateway bisa dibuka lewat URL ngrok                             | Orang lain bisa mengambil alih nomor pengirim (WAG16, SEC-45).         |
| Memakai nomor pengirim yang sama dengan nomor yang menerima order          | Bila diblokir, jalur order ikut mati (WAG10).                          |

---

## 7. Dampak dan Pembatalan

- **Skema:** satu kolom baru di `staf` (boleh kosong, data lama tidak berubah) dan satu fungsi SQL baca-saja. Dibatalkan dengan SQL pembatal di repo (fungsi dibuang sebelum kolom). Tidak ada tabel baru.
- **Pengecualian dari "dilarang self-host"** (`AGENTS.md` bagian 3): gateway di laptop adik ketua lewat ngrok. **Hanya untuk fitur ini**, tidak berlaku untuk hal lain (blok susulan `AGENTS.md`).
- **Jumlah pesan:** order baru ke semua owner aktif yang punya nomor (rencana 5), disetujui ke customer dan semua penjaga aktif yang punya nomor, status ke customer. Bisa sekitar 10 pesan per order. Banyak pesan ke nomor tidak resmi menambah risiko blokir; jeda acak di gateway mengurangi, tidak menghilangkan.
- **Panggilan ke server:** panggilan HTTP keluar dari `kedai` tidak menambah jumlah panggilan Edge Function. `wa_nomor_ambil` menambah satu panggilan database per kejadian WA.
- **Gateway mati, kuota ngrok habis, nomor diblokir:** WA tidak masuk, order dan push tidak terpengaruh.
- **Nomor staf berubah (ganti penjaga akhir pekan):** nomor diisi seperlunya; staf tanpa nomor tidak dikirimi WA dan tetap dapat push.
- **Pembatalan penuh:** WAG20.
- **Dokumen lain yang perlu blok susulan:** `AGENTS.md`, `database.md`, `security.md`, `notifikasi.md`, dan `bonus.md` (kandidat WA resmi). Isi siap tempel ada di `blok-susulan-wa.md`.

---

## 8. Ditunda

- **WA resmi** (WhatsApp Business API atau penyedia resmi): kandidat bila banyak pelanggan protes setelah masa sementara (WAG01). Bila jadi, yang diganti hanya bagian "mengirim ke gateway" di `kirim_wa.ts`; titik pemanggilan dan kolom `nomor_wa` tetap.
- Pengiriman gambar atau foto bukti lewat WA (`/send-image`).
- Menangani balasan pelanggan lewat webhook (sistem satu arah).
- Menambah kejadian WA lain (tolak, catatan, batal, alih hari, foto).
- Opt-out per pelanggan.
- Menjalankan gateway sebagai service otomatis.
- Mengecek apakah nomor terdaftar di WA sebelum kirim.

**Tidak dikerjakan:** WA untuk order wakil owner dan pemesan tanpa akun.

---

## 9. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

### Handoff #1 | 2026-11-15 | ketua

**Tugas:** WAG.01 (kolom `nomor_wa` di tabel `staf`). Selesai dan sudah dicentang di sheet.

**File yang diubah** (tiga berkas baru, tidak ada berkas lama yang diubah; saat handoff ditulis belum di-commit dan belum di-push, `git status` 15 Nov 2026 menunjukkan ketiganya "untracked"):

- `supabase/migrations/20261115_staf_nomor_wa.sql`
- `supabase/migrations/20261115_staf_nomor_wa_batal.sql`
- `supabase/templates/20261115_staf_nomor_wa_cek.sql`
  Migration dijalankan di SQL Editor pada 15 Nov 2026 dengan "OK" ketua. Tidak ada perubahan di `public/`, tidak ada deploy `kedai`, dan tidak ada tabel atau fungsi lain yang disentuh.

**Keputusan baru:**

- Pagar `nomor_wa` disamakan dengan `profil.nomor_wa`: `^628[0-9]{8,11}$`, boleh kosong (NULL). Disetujui ketua 15 Nov 2026; alasan ketua selain itu belum tercatat.
- **Koreksi untuk dokumen (yang paling akhir menang):** `wa-notif.md` dan blok usulan di `database.md` menulis panjang nomor "11 sampai 13". Yang benar menurut `20261105_akun.sql` adalah **11 sampai 14 digit** (`628` ditambah 8 sampai 11 angka). Kodenya benar, dokumennya yang keliru.
- **Pilihan penulis, tidak ditolak ketua, alasan belum tercatat:** nama constraint `staf_wa_cek`; kolom tanpa nilai bawaan; tidak ada GRANT atau REVOKE baru karena hak `service_role` tingkat tabel (`SELECT` saja) otomatis mencakup kolom baru.
  **Terbukti (diperiksa di chat, tidak disimpan; query baca-saja 15 Nov 2026):**

- Skema `staf` sebelum migration: lima kolom (`id`, `nama_tampilan`, `peran`, `aktif`, `dibuat_pada`), sama dengan `20261105_akun.sql`; grep migration hanya menemukan `20261105_akun.sql` (itu baris `ENABLE ROW LEVEL SECURITY`, bukan perubahan kolom).
- Setelah migration, cek A sampai G cocok semua: `nomor_wa` bertipe `text`, boleh kosong, tanpa nilai bawaan; constraint `staf_wa_cek` terpasang; `service_role` hanya `SELECT`; `anon` dan `authenticated` nol hak; RLS aktif, 0 policy; 3 baris staf, 0 nomor terisi; tidak ada hak tingkat kolom yang bocor.
  **Belum beres:**

- `_batal.sql` belum pernah dicoba; **sengaja tidak dites** (keputusan ketua 15 Nov 2026, alasan ketua: pengetesan mengharuskan memasang ulang kolomnya). Isinya hanya `DROP COLUMN IF EXISTS`.
- Ketiga berkas SQL sudah di-commit dan di-push `a64c476`. Commit **tanpa `[skip ci]`** (memuat folder `supabase/`); lakukan cek anti-nyasar (`pwd`, `git remote -v`, email commit terakhir) sebelum push. Lima docs hasil sesi strategi (`AGENTS.md`, `database.md`, `notifikasi.md`, `security.md`, `wa-notif.md`) juga masih belum di-commit.
- Template isian nomor staf (komponen di `wa-notif.md` bagian 4.2, dipakai di WAG.06) belum dibuat. Nomor nyata hanya diketik di SQL Editor, tidak masuk repo.
- Dashboard Supabase sudah logout.
- Tidak berubah dari rencana: WAG.02 sampai WAG.09 belum dikerjakan.
  **Saran giliran berikutnya (WAG.02, ⚠️ High-Risk, butuh penjelasan dampak dan "OK" ketua):**

- Fungsi SQL baca-saja `wa_nomor_ambil(p_akun uuid[])` (WAG12): `SECURITY DEFINER`, `search_path` kosong, `public.` eksplisit, `EXECUTE` hanya `service_role`, batas 100 akun per panggilan, mengembalikan `{akun, peran, nomor}` (customer dari `profil`, staf aktif dari `staf`; nomor kosong tidak dikembalikan).
- Lampirkan `AGENTS.md`, `wa-notif.md` (dengan Handoff #1), `database.md`, `security.md`, `supabase/migrations/20261113_inbox_tulis_penerima.sql` dan `supabase/templates/20261113_inbox_tulis_penerima_cek.sql` (pola `push_langganan_ambil`), `supabase/migrations/20261105_akun.sql`, dan tiga berkas `20261115_staf_nomor_wa*`.
- Salinan SQL dan pembatal ditulis di repo sebelum dijalankan; uji dengan data dummy; `wa_nomor_ambil` dibuang lebih dulu bila kolom `nomor_wa` mau dibatalkan.
- Commit yang hanya berisi docs/md boleh memakai `[skip ci]`; commit yang menyentuh kode atau `supabase/` tidak.
