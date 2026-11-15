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

### Handoff #2 | 2026-11-15 | ketua

**Tugas:** WAG.02 (fungsi SQL baca-saja `wa_nomor_ambil`). Selesai: fungsi sudah dijalankan di database dan terbukti lewat cek A sampai I serta uji jalur staf. Butir ini siap dicentang di sheet.

**File yang diubah** (semua berkas baru, tidak ada berkas lama yang diubah; status commit saat handoff ditulis belum dikonfirmasi, cek `git status`):

- `supabase/migrations/20261115_02_wa_nomor_ambil.sql`
- `supabase/migrations/20261115_02_wa_nomor_ambil_batal.sql`
- `supabase/templates/20261115_02_wa_nomor_ambil_cek.sql`
- `supabase/templates/20261115_02_wa_nomor_ambil_uji.sql`

Migration dijalankan di SQL Editor pada 15 Nov 2026 dengan "OK" ketua. Tidak ada perubahan di `public/`, tidak ada deploy `kedai`, dan tidak ada tabel, kolom, hak tabel, atau data yang disentuh. Satu-satunya objek baru: `public.wa_nomor_ambil(uuid[])`.

**Keputusan baru** (lima pilihan penulis, diterima ketua 15 Nov 2026 tanpa perubahan; alasan ketua selain itu belum tercatat):

1. Staf nonaktif: nomornya tidak dikembalikan, dan akun itu tidak jatuh menjadi customer walau punya profil.
2. Customer = punya baris di `profil` dan tidak punya baris di `staf`. Akun tanpa profil maupun staf dilewati. Tidak ada cek "aktif" untuk customer karena `profil` tidak punya kolom `aktif`.
3. Bentuk nomor dicek lagi di fungsi (`^628[0-9]{8,11}$`) sebagai pagar kedua.
4. Urutan kembalian tidak dijamin; `kedai` yang mengurutkan customer dulu (WAG13).
5. Satu akun muncul paling banyak sekali; elemen null di `p_akun` diabaikan.

- Kembalian: array `{akun, peran, nomor}`; `peran` = `customer`, `owner`, atau `penjaga`. Kosong bila tidak ada.
- Galat: `id_kosong` (daftar null) dan `daftar_terlalu_panjang` (lebih dari 100 elemen, dihitung dari panjang masuk termasuk duplikat). Keduanya tidak dipetakan ke layar, hanya tercatat di log `kedai` tanpa nomor.
- Pilihan penulis tanpa keputusan ketua: fungsi dibuat `STABLE`; kembalian diurutkan di dalam fungsi hanya demi keteraturan, bukan janji urutan.
- **Cara uji jalur staf:** awalnya direncanakan `BEGIN ... ROLLBACK` lalu sempat ditunda ke WAG.06; akhirnya dikerjakan di sesi yang sama (keputusan ketua 15 Nov 2026, "biar tuntas"). Bentuknya diganti satu blok `DO` yang selalu diakhiri galat sengaja, sehingga semua perubahan sementara (tiga baris `staf` dan dua baris `profil` dummy) dibatalkan otomatis dan tidak bisa tertinggal. Alasan penggantian: SQL Editor hanya menampilkan hasil statement terakhir, dan cara ini tidak bergantung pada `ROLLBACK` yang bisa terlupa.

**Terbukti** (diperiksa di chat, tidak disimpan; query baca-saja dan uji dummy, 15 Nov 2026):

- Satu fungsi, `p_akun uuid[]`, kembalian `jsonb`, `SECURITY DEFINER`, `search_path` kosong, sifat STABLE.
- `EXECUTE` hanya `service_role` (acl hanya `postgres` dan `service_role`, tanpa PUBLIC); `anon` dan `authenticated` false.
- Hak tabel `profil` (`service_role`: INSERT, SELECT, UPDATE) dan `staf` (`service_role`: SELECT) tidak berubah.
- Jalur customer: 6 dari 6 profil dikembalikan. Akun duplikat muncul sekali; uuid acak dan elemen null tidak menghasilkan apa-apa (tanpa galat); null dibalas `id_kosong`; 101 elemen dibalas `daftar_terlalu_panjang`; tepat 100 elemen diterima.
- Jalur staf (uji dummy): staf aktif bernomor dikembalikan dengan peran dari tabel `staf` (bukan customer) dan nomor yang benar; staf nonaktif (walau punya nomor dan profil) tidak dikembalikan; staf aktif tanpa nomor tidak dikembalikan; staf yang juga punya profil tidak jatuh menjadi customer.
- Cek pasca-uji: data kembali persis seperti sebelum uji (3 staf, 0 nomor terisi, 0 nonaktif, 6 profil, 0 profil milik staf, 0 nomor dummy tersisa).

**Belum beres:**

- `_batal.sql` belum pernah dicoba. Urutan bila perlu dibatalkan: buang fungsi ini lebih dulu, baru kolom `staf.nomor_wa` (`20261115_staf_nomor_wa_batal.sql`).
- Di WAG.06 (setelah nomor staf asli diisi), jalankan ulang CEK E sebagai konfirmasi dengan nomor asli: `staf_kembali` harus sama dengan jumlah staf aktif yang nomornya terisi. Jalur staf sendiri tidak perlu dibuktikan ulang. Template isian nomor staf (dari Handoff #1) belum dibuat; nomor nyata hanya diketik di SQL Editor, tidak masuk repo.
- **Kecelakaan di berkas cek (sudah diperbaiki):** query F versi pertama memakai `min(id)` pada kolom `uuid`, yang tidak ada di Postgres, sehingga galat sebelum fungsi dipanggil. Diganti dengan `ORDER BY ... LIMIT 1`; berkas di repo harus versi perbaikan. Pencegahan: jangan memakai `min` atau `max` pada `uuid`.
- Belum ada blok susulan di `database.md` untuk fungsi ini (blok usulan 14 Nov masih menyebut nama sebagai "usulan"); tempel hanya bila ketua minta.
- Commit berkas ini **tanpa `[skip ci]`** (menyentuh `supabase/`); cek anti-nyasar (folder aktif, `git remote -v`, email commit terakhir) sebelum push. Ingat logout dashboard Supabase.

**Saran giliran berikutnya:**

- WAG.03 (⚠️ High-Risk, butuh "OK" ketua): pasang tiga secret di dashboard fungsi `kedai` (`WA_GATEWAY_URL`, `WA_GATEWAY_API_KEY`, `WA_URL_APLIKASI`), diketik langsung di dashboard, tidak lewat chat. Tanpa kode, jadi bisa dikerjakan paralel dengan WAG.04 (tugas adik ketua, di luar repo).
- Lalu SEC-44 dan SEC-45, baru WAG.05 (`kirim_wa.ts`). Lampirkan `AGENTS.md`, `wa-notif.md` (dengan Handoff #1 dan #2), `database.md`, `security.md`, `supabase/functions/kedai/index.ts`, `inbox.ts`, dan `kirim_push.ts`.

### Handoff #3 | 2026-11-15 | ketua

**Tugas:** WAG.03 (pasang secret di dashboard fungsi `kedai`). Selesai dan sudah dicentang di sheet. Yang dipasang **dua secret, bukan tiga** (lihat keputusan baru).

**File yang diubah:** tidak ada. Tidak ada perubahan di repo, `public/`, database, maupun kode `kedai`, dan tidak ada deploy. Satu-satunya perubahan ada di dashboard Supabase (Edge Functions → Secrets), dikerjakan 15 Nov 2026 dengan "OK" ketua.

**Keputusan baru** (yang paling akhir menang atas `wa-notif.md` WAG04, WAG06, dan bagian 4.1):

- **`WA_URL_APLIKASI` sengaja tidak dipasang.** Gateway adik ketua sudah menambahkan footer sendiri yang berisi kalimat "hanya notifikasi, mohon tidak dibalas" dan link umum aplikasi (tanpa ID order atau parameter, jadi tetap sesuai WAG06). Bila `kedai` juga menempel link, pesan jadi punya dua link. WAG04 membolehkan secret ini kosong (link dilewati, pesan tetap terkirim). Alasan ketua: mengikuti alur; footer dan link sudah ditambahkan gateway oleh adik ketua, jadi `kedai` tidak menambah lagi supaya tidak dobel.
- **Akibat untuk WAG.05:** `kirim_wa.ts` hanya mengirim **kalimat kejadian**, tanpa footer, tanpa link, tanpa kalimat "jangan balas". Kalimat footer di gateway beda dari contoh di bagian 4.1, maknanya sama dan diterima.
- **Bila nanti pindah ke WA resmi (WAG01):** footer dan link harus dipindah ke `kirim_wa.ts`. Bila link mau ditangani `kedai` lagi, pasang `WA_URL_APLIKASI` dan hapus footer di gateway; tidak perlu deploy ulang.

**Terbukti** (screenshot dashboard, diperiksa di chat, tidak disimpan):

- Daftar Custom secrets berisi tujuh nama: empat lama (`KUNCI_SECRET_KEDAI`, `RAHASIA_PENJADWAL`, `VAPID_PUBLIK`, `VAPID_PRIVAT`), `VAPID_KONTAK` (sudah ada sejak 13 Nov), dan dua baru: `WA_GATEWAY_URL` dan `WA_GATEWAY_API_KEY`.
- Kolom Updated: dua secret baru bertanggal 15 Nov 2026 (selisih sekitar 35 detik); enam lainnya bertanggal lama, jadi tidak ada secret lama yang tertimpa.

**Belum beres:**

- **Isi kedua secret belum terbukti benar** (dashboard hanya menampilkan nama dan digest). Baru ketahuan saat tes pengiriman di WAG.07. Bila typo, timpa dengan nama yang sama.
- **Asumsi bentuk `WA_GATEWAY_URL`:** alamat dasar saja, tanpa `/send-message` dan tanpa `/` di ujung. Di WAG.05, kode menambahkan `/send-message` sendiri. Bila ternyata adik ketua memasukkan path, sesuaikan di kode, bukan di dashboard.
- **WAG.04 (tugas adik ketua, di luar repo) belum dicentang.** Footer di `index.js` menunjukkan revisi sudah dimulai, tetapi poin lainnya belum dikonfirmasi: antrean maks 50, jeda acak 3 sampai 8 detik, `/` hanya dari laptop, listen `127.0.0.1`, validasi, `/send-image` mati, reconnect aman.
- Teks tugas WAG.03 di sheet masih menyebut tiga secret; boleh dibiarkan.
- Status commit berkas Handoff #1 dan #2 dan lima docs hasil sesi strategi belum dikonfirmasi (cek `git status`). Commit yang hanya berisi docs/md boleh memakai `[skip ci]`; bila ikut memuat `supabase/`, jangan. Lakukan cek anti-nyasar sebelum push.
- Logout dashboard Supabase dan tutup jendela privat.

**Saran giliran berikutnya:**

- Tunggu WAG.04 selesai (adik ketua), lalu SEC-44 dan SEC-45 (bukti keamanan, termasuk halaman QR tidak bisa dibuka lewat ngrok).
- Baru WAG.05 (⚠️ High-Risk, butuh penjelasan dampak dan "OK" ketua): `kirim_wa.ts` dan sambungan di `index.ts` dan `inbox.ts`, deploy `kedai` dengan urutan aman bagian 8 tanpa `--no-verify-jwt`, commit tanpa `[skip ci]`.
- Lampirkan `AGENTS.md`, `wa-notif.md` (dengan Handoff #1 sampai #3), `database.md`, `security.md`, `supabase/functions/kedai/index.ts`, `inbox.ts`, dan `kirim_push.ts`.

## Handoff #4 | 2026-11-15 | [RAC]

**Tugas:** WAG.04 (revisi dan tes gateway WA, tugas adik ketua, di luar repo). Selesai dan sudah dicentang di sheet.

**File yang diubah** (semua di folder gateway di laptop, **tidak ada yang masuk repo**, WAG19). Tidak ada perubahan di repo, `public/`, database, Supabase, maupun kode `kedai`, dan tidak ada deploy:

- `index.js` (revisi 15 Nov 2026 di atas revisi 14 Nov)
- `startwagw-ngrok.sh` dan `stopwagw-ngrok.sh`
- `package.json` (dan `package-lock.json`)
  **Keputusan baru** (yang paling akhir menang atas WAG14 dan WAG16 bila ada selisih):

- **Urutan cek di gateway:** halaman `/` didaftarkan lebih dulu (tanpa API key, hanya dari laptop sendiri); semua route lain cek API key **sebelum** parser JSON, jadi tanpa key selalu 401 walau body rusak. Halaman `/` mengecek loopback, tanpa header `x-forwarded-*`, **dan** header `Host` lokal.
- **Regex nomor gateway** disamakan dengan database: `^628\d{8,11}$` (sebelumnya `^62\d{9,13}$`). Pesan galatnya menyebut "628xxx".
- **Batas:** body 10 KB (lebih dari itu dibalas 413), pesan maksimal 1000 karakter, antrean maksimal 50 (penuh = 429), jeda acak 3 sampai 8 detik. Route yang tidak dikenal, termasuk `/send-image`, dibalas 404 JSON (tambahan penulis, tanpa keputusan ketua).
- **Footer tetap tulis mati di `index.js`** (kalimat "tidak dibalas" dan link umum). Baris `FOOTERENV` di `.env.example` dan baris yang dikomentari di `index.js` **dibiarkan, belum dipakai** (permintaan PIC, untuk persiapan bila nanti dipakai versi env). Bila pindah ke versi env, link harus ikut masuk ke nilai `FOOTERENV`, atau pasang `WA_URL_APLIKASI` di `kedai` dan hapus link dari footer gateway; jangan sampai dobel (Handoff #3).
- **Script start/stop:** mematikan proses lewat berkas PID (`logs/node.pid`, `logs/ngrok.pid`), **tidak memakai `pkill`**, karena laptop dipakai bersama. Keduanya `nohup`; script start langsung selesai dan Terminal boleh ditutup. `PORT` dibaca dari `.env`. ngrok tidak dinyalakan bila node gagal start. `NGROK_DOMAIN` diisi manual di script dan tidak dibagikan di chat.
- **`package.json`:** `@whiskeysockets/baileys` dipatok `7.0.0-rc14` dan `mongodb` dicatat sendiri `7.8.0` (sebelumnya hanya menumpang lewat `mongoose`). Node yang dipakai v24.20.0. Pustaka yang tidak dipakai (`multer`, `mongoose`, `socket.io`, `qrcode-terminal`) **belum dibuang**, supaya penyebab tetap satu bila ada masalah di WAG.07 dan WAG.08.
- **Untuk `kirim_wa.ts` (WAG.05):** **202 = sukses (diterima antrean)**; 400, 401, 413, 429, 503, dan timeout = gagal (sisa penerima dilewati, WAG13). Kirim ke `<WA_GATEWAY_URL>/send-message` dengan header `x-api-key`, `Content-Type: application/json`, dan `ngrok-skip-browser-warning: true`. Isi hanya `number` (`628xxx`) dan `message` berupa kalimat kejadian; footer dan link ditambah gateway.
  **Terbukti** (diperiksa di chat, tidak disimpan; 15 Nov 2026):

- Lewat ngrok: `/` dibalas 404 tanpa QR dan tanpa status; tanpa key, key salah, dan JSON rusak tanpa key semuanya 401.
- Dengan key benar: nomor ngawur 400, pesan kosong 400, body lebih dari 10 KB 413, `/send-image` 404.
- Kirim ke nomor tester: 202 dan pesan masuk dengan footer. Antrean penuh: 55 kali 202 dan 15 kali 429. Pesan masuk berurutan.
- Jeda acak: pesan pertama langsung keluar, lalu selisih 8, 6, dan 3 detik (dari penghitung `terkirim` di `/status`).
- Restart sekali: URL ngrok sama (WAG18) dan WA balik `connected` tanpa scan QR.
- Server hanya mendengarkan `127.0.0.1`: akses lewat alamat WiFi laptop ditolak, lewat localhost 200.
- Setelah `package.json` diganti: `npm ls` menunjukkan `baileys 7.0.0-rc14` dan `mongodb 7.8.0` sejajar di tingkat atas; start dingin, status `connected`, satu pesan ke tester 202 dan masuk dengan footer.
- Inspector ngrok kosong, jendela Terminal ditutup (variabel key dan nomor hilang).
  **Belum beres:**

- **Belum dites langsung:** reconnect saat WiFi putus di tengah jalan (kode lolos review), dan cek `Host` untuk halaman `/` sebagai pagar tersendiri (yang terbukti baru 404 lewat ngrok).
- **Butir baru yang perlu ditambah ke sheet:** "Rapikan pustaka gateway yang tidak terpakai" (P2, setelah WAG.07 dan WAG.08; `mongodb` sudah dicatat sendiri, jadi membuang `mongoose` aman) dan "Tes reconnect gateway saat WiFi putus" (P1).
- Antrean ada di memori: sisa pesan hilang bila script dihentikan (WAG09 butir c).
- Inspector ngrok (`localhost:4040`) menyimpan header `x-api-key`, nomor, dan isi pesan dari semua request yang lewat ngrok. Setiap sesi tes: Clear, atau matikan gateway sesudahnya.
- Berkas `package.json.bak` dan `package-lock.json.bak` boleh dihapus setelah WAG.07 dan WAG.08 selesai.
- Status commit lima docs hasil sesi strategi dan berkas Handoff sebelumnya belum dikonfirmasi (cek `git status`). Commit yang hanya berisi docs/md boleh memakai `[skip ci]`; commit yang ikut menyentuh `supabase/` atau kode tidak.
- Baris SEC-44 dan SEC-45 belum dicentang oleh AI: bukti "halaman QR tidak bisa dibuka lewat ngrok" sudah ada, tetapi centang hanya bila semua aksi di barisnya terbukti dan jenis buktinya cocok dengan kolom Catatan sheet.
  **Saran giliran berikutnya:**

- SEC-44 dan SEC-45, lalu **WAG.05** (⚠️ High-Risk, butuh penjelasan dampak dan "OK" ketua): `kirim_wa.ts` dan sambungan di `index.ts` dan `inbox.ts`, 4 kejadian, deploy `kedai` dengan urutan aman bagian 8 (tanpa `--no-verify-jwt`), commit tanpa `[skip ci]`. Bila yang bertugas bukan ketua, AI memberi ringkasan untuk diteruskan lewat WA (aturan 12).
- Isi `WA_GATEWAY_URL` dan `WA_GATEWAY_API_KEY` belum terbukti benar (Handoff #3). Gateway sekarang sudah siap menerima, jadi bukti baru muncul di tes pengiriman WAG.07.
- **Gateway harus dinyalakan** lewat `./startwagw-ngrok.sh` sebelum tes WAG.07 dan WAG.08, dan dimatikan lewat `./stopwagw-ngrok.sh` sesudahnya (WAG17).
- Lampirkan `AGENTS.md`, `wa-notif.md` (dengan Handoff #1 sampai #4), `database.md`, `security.md`, `supabase/functions/kedai/index.ts`, `inbox.ts`, dan `kirim_push.ts`.

### Handoff #5 | 2026-11-15 | [RAC]

**Tugas:** WAG.04b (tes reconnect gateway saat WiFi putus, di luar repo). Selesai dan sudah dicentang di sheet.

**File yang diubah:** tidak ada. Tidak ada perubahan di repo, `public/`, database, Supabase, kode `kedai`, maupun `index.js` gateway, dan tidak ada deploy. Tes hanya menyalakan gateway, mematikan WiFi laptop sekitar 3 menit (10.45 sampai 10.48), lalu mengecek pulihnya.

**Keputusan baru:** tidak ada.

**Terbukti** (diperiksa di chat, tidak disimpan; 15 Nov 2026):

- Log Node memuat empat kali "Koneksi terputus" (satu kode 428, tiga kode 408) dengan jeda coba ulang bertahap 4, 8, 16, 32 detik (sesuai WAG16), lalu "Berhasil Terhubung" lagi tanpa scan QR dan tanpa start ulang.
- Setelah WiFi pulih dan halaman di-refresh: status `connected`, antrean 0, tanpa QR.
- Jalur lengkap: curl ke `/send-message` dibalas "Diterima antrean" (202) dan satu pesan ke nomor tester masuk di HP lengkap dengan footer gateway.
- Catatan proses: screenshot pertama (sebelum refresh) sempat ditolak sebagai bukti karena halaman tidak auto-refresh; bukti yang dipakai adalah screenshot setelah refresh, log, dan pesan masuk.

**Belum beres:**

- Yang diuji hanya putus WiFi sekitar 3 menit (pulih dalam rentang backoff sampai 32 detik). Putus lama (berjam-jam) belum diuji.
- Cek `Host` untuk halaman `/` sebagai pagar tersendiri belum dites langsung (tetap dari Handoff #4; yang terbukti baru 404 lewat ngrok).
- URL ngrok sempat tampil utuh di output Terminal yang ditempel ke chat (domain statis, tidak bisa diganti). Key tidak ikut tampil, jadi gateway tetap terlindungi oleh `x-api-key`.
- WAG.04a (buang pustaka tidak terpakai) tetap ditunda sampai WAG.07 dan WAG.08 selesai; butuh `index.js` dengan key, URI database, dan nomor sudah dibuang.
- Status commit lima docs hasil sesi strategi dan berkas Handoff sebelumnya belum dikonfirmasi (cek `git status`). Commit yang hanya berisi docs/md boleh memakai `[skip ci]`; commit yang ikut menyentuh `supabase/` atau kode tidak. Lakukan cek anti-nyasar (folder aktif, `git remote -v`, email commit terakhir) sebelum push.

**Saran giliran berikutnya:**

- SEC-44 dan SEC-45 (bukti keamanan; baris belum dicentang oleh AI sampai semua aksi di barisnya terbukti dan jenis buktinya cocok dengan kolom Catatan sheet).
- Lalu WAG.05 (⚠️ High-Risk, butuh penjelasan dampak dan "OK" ketua): `kirim_wa.ts` dan sambungan di `index.ts` dan `inbox.ts`, 4 kejadian, deploy `kedai` urutan aman bagian 8 tanpa `--no-verify-jwt`, commit tanpa `[skip ci]`. Isi `WA_GATEWAY_URL` dan `WA_GATEWAY_API_KEY` belum terbukti benar; bukti baru muncul di tes pengiriman WAG.07.
- Gateway harus dinyalakan (`./startwagw-ngrok.sh`) sebelum WAG.07 dan WAG.08, dan dimatikan (`./stopwagw-ngrok.sh`) sesudahnya (WAG17).
- Lampirkan `AGENTS.md`, `wa-notif.md` (dengan Handoff #1 sampai #5), `database.md`, `security.md`, `supabase/functions/kedai/index.ts`, `inbox.ts`, dan `kirim_push.ts`.

### Handoff #6 | 2026-11-15 | [RAC]

**Tugas:** WAG.04a (rapikan pustaka gateway yang tidak terpakai, di luar repo). Selesai dan sudah dicentang di sheet.

**File yang diubah** (semua di folder gateway di laptop, **tidak ada yang masuk repo**, WAG19). Tidak ada perubahan di repo, `public/`, database, Supabase, kode `kedai`, maupun `index.js`, dan tidak ada deploy:

- `package.json` dan `package-lock.json` (empat pustaka dibuang lewat `npm uninstall`)
- Cadangan baru: `package.json.bak2` dan `package-lock.json.bak2` (kondisi sebelum pembuangan)

**Keputusan baru** (yang paling akhir menang atas catatan "ditunda sampai WAG.07 dan WAG.08" di Handoff #4 dan sheet):

- **04a dikerjakan SEBELUM tes SEC, bukan setelah WAG.07 dan WAG.08.** Disetujui ketua 15 Nov 2026. Alasan ketua: supaya sesi tes SEC sudah menyentuh gateway versi terakhir dan tidak perlu mengulang.
- Prinsip yang dicatat: pekerjaan yang mengubah artefak yang akan diuji dituntaskan sebelum tes keamanannya; butir "rapikan" yang ikut mengubah berkas jangan ditaruh sesudah tes.
- Pilihan penulis tanpa keputusan ketua: peringatan `npm warn install-scripts` (baileys dan protobufjs) **tidak ditindaklanjuti** (`npm install-scripts approve` tidak dijalankan), karena di luar lingkup 04a. Bila mau dibahas, jadikan butir terpisah.

**Terbukti** (diperiksa di chat, tidak disimpan; 15 Nov 2026):

- Dasar pembuangan: `index.js` revisi 15 Nov hanya memakai baileys, mongodb, express, pino, qrcode, dotenv (plus `http` dan `crypto` bawaan Node). `npm ls` menunjukkan multer, mongoose, socket.io, dan qrcode-terminal hanya terpasang langsung di `package.json` (tidak ada pustaka lain yang memakainya).
- `npm uninstall`: 35 paket dihapus, 0 kerentanan, tanpa galat.
- `npm ls --depth=0`: tepat enam pustaka (`baileys 7.0.0-rc14`, `dotenv 18.0.10`, `express 5.3.0`, `mongodb 7.8.0`, `pino 10.4.0`, `qrcode 1.5.4`); keempat yang dibuang tidak muncul.
- Start dingin: tanpa galat, status `connected`, tanpa QR.
- Lewat ngrok: `/` dibalas 404 (tanpa QR dan tanpa status), tanpa key dibalas 401.
- Server hanya mendengarkan `127.0.0.1`: akses lewat alamat WiFi laptop ditolak, lewat `127.0.0.1` 200.
- Dengan key: 202 "Diterima antrean" dan pesan masuk di HP tester lengkap dengan footer.
- **Pagar `Host` terbukti** (menutup butir "belum dites langsung" dari Handoff #4): curl dari `127.0.0.1` dengan header `Host` palsu dibalas 404.
- Inspector ngrok dibersihkan, gateway dimatikan, jendela Terminal ditutup.

**Belum beres:**

- Dua tes dengan key tidak diulang di versi final: `/send-image` (404) dan validasi nomor atau pesan (400). Terbukti di Handoff #4 pada versi sebelum pembuangan; `index.js` tidak berubah. Ulang bila baris SEC-45 di sheet mensyaratkannya.
- Baris **SEC-44 dan SEC-45 belum dinyatakan siap centang oleh AI** (isi kolom Catatan sheet tidak dibagikan ke AI); dicocokkan oleh ketua atau PIC.
- Reconnect saat putus lama (berjam-jam) belum diuji (dari Handoff #5).
- `package.json.bak2` dan `package-lock.json.bak2` boleh dihapus setelah WAG.07 dan WAG.08 selesai.
- Status commit lima docs hasil sesi strategi dan berkas Handoff sebelumnya belum dikonfirmasi (cek `git status`). Commit yang hanya berisi docs/md boleh memakai `[skip ci]`; commit yang ikut menyentuh `supabase/` atau kode tidak. Lakukan cek anti-nyasar (folder aktif, `git remote -v`, email commit terakhir) sebelum push.

**Saran giliran berikutnya:**

- Cocokkan SEC-44 dan SEC-45 dengan kolom Catatan sheet, lalu **WAG.05** (⚠️ High-Risk, butuh penjelasan dampak dan "OK" ketua): `kirim_wa.ts` dan sambungan di `index.ts` dan `inbox.ts`, 4 kejadian, deploy `kedai` urutan aman bagian 8 tanpa `--no-verify-jwt`, commit tanpa `[skip ci]`. Isi `WA_GATEWAY_URL` dan `WA_GATEWAY_API_KEY` belum terbukti benar; bukti baru muncul di WAG.07.
- Gateway harus dinyalakan (`./startwagw-ngrok.sh`) sebelum WAG.07 dan WAG.08, dan dimatikan (`./stopwagw-ngrok.sh`) sesudahnya (WAG17).
- Lampirkan `AGENTS.md`, `wa-notif.md` (dengan Handoff #1 sampai #6), `database.md`, `security.md`, `supabase/functions/kedai/index.ts`, `inbox.ts`, dan `kirim_push.ts`.

### 2026-11-15: Urutan tes SEC diubah (SEC-45, lalu WAG.05, lalu SEC-44)

Keputusan ketua (15 Nov 2026, disampaikan lewat PIC [RAC]). Alasan ketua: tiap SEC dites saat artefak yang diuji sudah ada.

- **Urutan baru: SEC-45, lalu WAG.05, lalu SEC-44.** Yang paling akhir menang atas urutan di bagian 5 (SEC-44 dan SEC-45 sama-sama sebelum WAG.05). Bagian 5 tidak diubah.
- **Penerapan:** SEC-45 menguji gateway, yang sudah final sesudah WAG.04a (Handoff #6). SEC-44 menguji nomor tidak bocor ke aplikasi atau log, dan hanya bisa dibuktikan penuh setelah `kirim_wa.ts` ada dan jalan (WAG.05).
- **SEC-45 dites resmi di sesi tes**, bukan dianggap lulus dari tes WAG.04 hari ini. Bukti gateway 15 Nov 2026 (Handoff #4 sampai #6) boleh dipakai ulang di sesi itu selama gateway tidak berubah lagi. Bila `index.js`, `package.json`, atau `.env` gateway berubah sebelum sesi SEC-45, tes ringan diulang.
- **SEC-40 sampai SEC-43** tidak terpengaruh: tetap sesudah WAG.08.
- **Sesi tes SEC-45** melampirkan `AGENTS.md`, `security.md`, `wa-notif.md` (dengan Handoff #1 sampai #6), dan `pemetaan-test.md`.

### Handoff #7 | 2026-11-15 | (FREN)

**Tugas:** SEC-45 (tes resmi gateway WA, sesuai urutan baru 15 Nov: SEC-45, lalu WAG.05, lalu SEC-44). Selesai dan sudah dicentang di sheet (15 Nov 2026).

**File yang diubah:** tidak ada. Tidak ada perubahan di repo, `public/`, database, Supabase, kode `kedai`, maupun gateway, dan tidak ada deploy.

**Keputusan baru:** tidak ada. Dasar pemakaian ulang bukti: PIC mengonfirmasi `index.js` terakhir berubah di WAG.04, `package.json` di WAG.04a, dan `.env` tidak berubah, jadi bukti Handoff #6 sah dipakai ulang.

**Terbukti** (diperiksa di chat, tidak disimpan; 15 Nov 2026):

- Hari ini, lewat ngrok: `/send-image` dengan key 404; nomor tidak sah 400; pesan kosong 400; key salah 401; `/` 404; `/status` dengan key 200.
- Hari ini, dari laptop: `/` (`localhost:3000`) tampil, status `connected`, antrean 0, tanpa QR.
- Dipakai ulang dari Handoff #6 (versi final): tanpa key 401; hanya mendengarkan `127.0.0.1` (IP WiFi ditolak, localhost 200); header `Host` palsu 404.
- Inspector ngrok sebelum dibersihkan hanya memuat request tes hari ini, tanpa request lain.
  **Belum beres:**

- Pesan lebih dari 1000 karakter dan body lebih dari 10 KB (413) tidak diulang di versi final; terbukti di Handoff #4 sebelum pembuangan pustaka. Tidak menghalangi SEC-45.
- Isi secret `WA_GATEWAY_URL` dan `WA_GATEWAY_API_KEY` di `kedai` belum terbukti benar (Handoff #3). Tes hari ini memakai nilai yang diketik di Terminal, bukan secret di dashboard. Bukti baru muncul di WAG.07.
- Reconnect saat putus lama (berjam-jam) belum diuji (Handoff #5).
- **SEC-44 belum bisa dibuktikan penuh** sebelum `kirim_wa.ts` ada dan jalan (WAG.05).
- Status commit lima docs hasil sesi strategi dan berkas Handoff sebelumnya belum dikonfirmasi (cek `git status`). Commit yang hanya berisi docs/md boleh `[skip ci]`; yang menyentuh kode atau `supabase/` tidak. Lakukan cek anti-nyasar (folder aktif, `git remote -v`, email commit terakhir) sebelum push.
- Penutupan sesi sudah beres: inspector ngrok di-Clear, gateway dimatikan (`./stopwagw-ngrok.sh`), Terminal ditutup, `GW_KEY` terbukti kosong.
  **Saran giliran berikutnya:**

- **WAG.05** (⚠️ High-Risk, butuh penjelasan dampak dan "OK" ketua): `kirim_wa.ts` dan sambungan di `index.ts` dan `inbox.ts`, 4 kejadian, deploy `kedai` urutan aman bagian 8 tanpa `--no-verify-jwt`, commit tanpa `[skip ci]`. Bila yang bertugas bukan ketua, AI memberi ringkasan untuk diteruskan lewat WA (aturan 12).
- Lalu SEC-44, WAG.06, WAG.07 (gateway dinyalakan lewat `./startwagw-ngrok.sh` dan dimatikan sesudahnya, WAG17), WAG.08, SEC-40 sampai SEC-43, WAG.09.
- Lampirkan `AGENTS.md`, `wa-notif.md` (dengan Handoff #1 sampai #7), `database.md`, `security.md`, `supabase/functions/kedai/index.ts`, `inbox.ts`, dan `kirim_push.ts`.

### Handoff #8 | 2026-11-15 | ketua

**Tugas:** WAG.05 (`kirim_wa.ts` dan sambungan di `inbox.ts`, deploy `kedai`). Selesai dan sudah dicentang di sheet. Kode sudah live, tetapi **belum pernah mengirim pesan sungguhan** (gateway mati; tes ada di WAG.07 dan WAG.08).

**File yang diubah** (satu commit `1bf5151`, sudah di-push ke `main` 15 Nov 2026, tanpa `[skip ci]`; cek anti-nyasar lulus: folder CHATA, remote `kedaichata/kedai-chata`, email noreply milik kedaichata):

- `supabase/functions/kedai/kirim_wa.ts` (baru)
- `supabase/functions/kedai/inbox.ts` (hanya tambahan: `git diff --numstat` = 27 baris ditambah, 0 dihapus; satu import, satu baris pembuatan pengirim, satu blok di `tulisInbox`)
  `index.ts` dan `order_status.ts` **tidak berubah**. Tidak ada migration, tidak ada perubahan di `public/` (daftar cache `sw.js` tidak berubah). `kedai` di-deploy 15 Nov 2026 (13 berkas, project yang benar, tanpa `--no-verify-jwt`, "OK" ketua sudah ada). Token deploy dibersihkan (`[]`) dan dashboard sudah logout.

**Keputusan baru** (yang paling akhir menang atas `wa-notif.md` bila ada selisih):

- **Status tujuan dibaca dari TEKS penerima yang dikembalikan `inbox_tulis`, bukan dari argumen baru di `tulisInbox`.** Alasan teknis: pembungkus `tulisInbox` di `index.ts` hanya meneruskan tiga isian, jadi argumen baru akan hilang di tengah jalan, dan mengubahnya berarti menyentuh `index.ts` dan `order_status.ts` yang sudah teruji. Hanya tiga teks yang dikenali (`Pesananmu sedang diantar.`, `Pesananmu siap diambil.`, `Pesananmu siap disajikan.`); Diproses dan Selesai tidak cocok sehingga tidak kirim WA (WAG07). Bila teks di SQL `inbox_tulis` diubah, WA berhenti terkirim (arah aman), jadi ubah `STATUS_WA` di `kirim_wa.ts` bersamaan. Ini menjawab catatan sheet WAG.05 "cek inbox.ts menyerahkan status tujuan" dan menggantikan rencana "argumen opsional status tujuan". Pilihan penulis, tidak ditolak ketua.
- **Blok WA dipasang SEBELUM blok push di `tulisInbox`**, bukan sesudahnya, karena blok push punya `return` dini yang akan melewati kode sesudahnya. Blok push tidak diubah. Keduanya jalan di latar belakang (`EdgeRuntime.waitUntil`). Tanpa `EdgeRuntime`, WA sengaja **tidak ditunggu** supaya push tidak tertunda. Pilihan penulis, tidak ditolak ketua.
- **Kalimat pesan** mengikuti tabel 4.1, disetujui ketua 15 Nov 2026: order baru ke owner "Kedai ChATA: ada order baru."; setujui ke customer "Kedai ChATA: pesananmu #N sudah disetujui." dan ke penjaga "Kedai ChATA: ada order disetujui." (tanpa nomor); status ke customer "Kedai ChATA: pesananmu #N sedang diantar." / "siap diambil." / "siap disajikan.". Tanpa footer dan tanpa link (Handoff #3).
- **Pilihan penulis, tidak ditolak ketua, alasan belum tercatat:** `WA_GATEWAY_URL` dirapikan di kode (tanda "/" di ujung dan "/send-message" dibuang, lalu "/send-message" ditambah sendiri; wajib diawali `http://` atau `https://`, selain itu WA dilewati dan dicatat di log); 202 = sukses, selain itu gagal dan sisa penerima kejadian itu dilewati (Handoff #4, WAG13); nomor dicek lagi `^628[0-9]{8,11}$` sebelum kirim; peran dan nomor dari `wa_nomor_ambil`, urutan customer dulu dibuat di `kirim_wa.ts`; timeout 3000 ms tetap di kode (WAG03).
- **Format log** (tanpa nomor, tanpa isi pesan, tanpa URL dan key): `kedai wa: <kejadian> | terkirim N | gagal 0`, atau saat gagal `... | terkirim N | gagal 1 (<alasan>) | dilewati M` dengan alasan `timeout`, `tidak terjangkau`, atau `http <kode>`. Kejadian di luar tiga yang dikenali tidak mencatat apa-apa.
  **Terbukti** (diperiksa di chat, tidak disimpan; 15 Nov 2026):

- `git status` sebelum commit: hanya `inbox.ts` modified dan `kirim_wa.ts` untracked.
- `git diff --numstat inbox.ts`: 27 ditambah, 0 dihapus (kode lama utuh).
- Commit `1bf5151`: 2 berkas, 299 baris tambahan. Push `cd7bf2e..1bf5151` berhasil.
- Deploy: tiga belas berkas terunggah (termasuk `kirim_wa.ts` dan `inbox.ts`), "Deployed Functions on project ... : kedai", project cocok dengan dashboard. Token bersih setelahnya.
  **Belum beres:**

- **Perilaku pengiriman belum pernah jalan.** Kode belum diperiksa sintaksnya oleh alat (tidak ada Deno di sesi penulis); deploy berhasil, tetapi bukti kerja baru muncul di WAG.07 dan WAG.08. Cek log `kedai wa:` saat tes.
- **Isi `WA_GATEWAY_URL` dan `WA_GATEWAY_API_KEY` di dashboard belum terbukti benar** (tetap dari Handoff #3). Bila ternyata URL berisi path lain, sesuaikan di `alamatKirim` di `kirim_wa.ts`, bukan di dashboard.
- **WAG.06 belum dikerjakan:** nomor staf aktif (`nomor_wa` di `staf`) belum diisi. Ketua menanyakan nomornya dulu ke ibu ketua. Nomor diketik langsung di SQL Editor, tidak ditempel ke chat atau repo. Template isian nomor staf (dari Handoff #1) **belum dibuat**; AI siap membuat template placeholder bila diminta. Nomor tester di profil akun dummy diisi lewat menu Akun di aplikasi.
- Setelah WAG.06: jalankan ulang CEK E dari `20261115_02_wa_nomor_ambil_cek.sql` (Handoff #2): `staf_kembali` harus sama dengan jumlah staf aktif yang nomornya terisi.
- **Sampai nomor staf diisi, hanya customer ber-nomor yang bisa dapat WA.** Selama masa tes, pastikan hanya akun dummy dengan nomor tester yang ikut memesan.
- Penerima WA untuk `setujui` dan `order_baru` bergantung pada `inbox_tulis` (pelaku tidak dikabari, owner aktif, penjaga aktif); belum diamati di lapangan.
- **Gateway harus dinyalakan** (`./startwagw-ngrok.sh`) sebelum WAG.07 dan WAG.08 dan dimatikan (`./stopwagw-ngrok.sh`) sesudahnya (WAG17). Selama gateway mati, order tetap normal dan log hanya mencatat `gagal 1 (tidak terjangkau)`.
- SEC-44 belum bisa dibuktikan penuh sebelum `kirim_wa.ts` terbukti jalan (WAG.07); SEC-40 sampai SEC-43 tetap sesudah WAG.08.
- Status Actions Pages untuk commit `1bf5151` belum dikonfirmasi (commit tidak menyentuh `public/`, jadi aplikasi tidak berubah).
- Status commit lima docs hasil sesi strategi dan berkas Handoff #1 sampai #8 belum dikonfirmasi (cek `git status`). Commit yang hanya berisi docs/md boleh memakai `[skip ci]`; yang ikut menyentuh kode atau `supabase/` tidak. Lakukan cek anti-nyasar (folder aktif, `git remote -v`, email commit terakhir) sebelum push.
- Dashboard Supabase sudah logout.
  **Saran giliran berikutnya:**

- **WAG.06** (Low-Risk): isi nomor staf aktif di SQL Editor dan nomor tester di profil akun dummy; lalu CEK E. Opsional: minta AI membuat template isian nomor staf (placeholder saja).
- **WAG.07:** nyalakan gateway, tes 4 kejadian dengan akun dummy (order baru ke owner, setujui ke customer dan penjaga, status Diantar atau Siap diambil atau Siap disajikan ke customer), cek urutan customer dulu, teks sesuai tabel 4.1, dan log `kedai wa:`; restart script sekali dan pastikan URL ngrok tetap sama. Pastikan Diproses dan Selesai **tidak** mengirim WA. Bersihkan inspector ngrok dan matikan gateway sesudahnya.
- **WAG.08** (⚠️ P0, butuh "OK" ketua): gateway dimatikan, order tetap sukses dalam waktu normal tanpa galat di layar.
- Lalu SEC-44, WAG.06 sebagai prasyarat nomor staf, SEC-40 sampai SEC-43, WAG.09.
- Lampirkan `AGENTS.md`, `wa-notif.md` (dengan Handoff #1 sampai #8), `database.md`, `security.md`, `supabase/functions/kedai/inbox.ts`, dan `kirim_wa.ts`. Untuk membuat template nomor staf, tambahkan `supabase/migrations/20261115_02_wa_nomor_ambil.sql` dan `supabase/templates/20261115_02_wa_nomor_ambil_cek.sql`.
