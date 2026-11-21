/docs/pemisahan-code.md

# 🔀 pemisahan-code.md: Memisahkan Versi Aplikasi (Branch, Tag, dan Worker Uji)

> **Versi 1.0 (21 Nov 2026), hasil sesi strategi (final untuk sesi kode).** Cara tim menjaga **versi 1 tetap beku dan live**, sambil **mencicil versi 2 di jalur terpisah**, lalu menggabungkan fitur yang sudah jadi dan menaikkan nomor versi (v1.1, v1.2, dan seterusnya). Pemicu: ketua ingin tim non-IT terbiasa dengan alur ini lebih dulu, memakai fitur **Bagikan** (tanpa database) sebagai latihan.
> **Revisi 1.1 (21 Nov 2026, sesi strategi lanjutan):** PC12 berbalik (dokumen ditulis di `v2`), PC10 dan Alur A, B, C disesuaikan, PC18 (kerja serial) dan PCD.14 ditambah, K5 dijawab. Kode saat ini disebut **kandidat v1.0**; belum beku sampai PCD.01 dan PCD.02 dikerjakan di sesi kode.
> **Status:** Belum ada yang dikerjakan. Butir **(bawaan)** = pilihan penulis yang belum ditanyakan satu per satu; ketua boleh mengubahnya. **Bagian 3 memuat keputusan ketua 21 Nov 2026 dan pertanyaan yang masih terbuka (K1, K2, K3, K5; K4 sudah dijawab).**
> **Cara pakai sesi kode:** lampirkan **`AGENTS.md` + berkas ini + `wrangler.jsonc`**. Untuk PCD.13 tambah `supabase/functions/kedai/index.ts` (bagian `ASAL_DIIZINKAN`). Tambahan berguna: `migrasi.md` (pengaturan Workers Builds dan pola alamat tambahan) dan `bagikan.md`. `database.md` tidak dibutuhkan (tidak ada perubahan database); `security.md` hanya bila SEC-33 diulang. Sesi kode **tidak merapikan atau menulis ulang berkas ini**; hanya menambah blok di bagian 12.
> **Tanpa kode dan tanpa perintah.** Perintah git dan langkah dashboard dipandu AI **satu langkah per giliran**, dengan pagar `AGENTS.md` bagian 8. Nama di sini deskriptif; nama persisnya ditetapkan saat dikerjakan.
> **Selisih:** `AGENTS.md` menang atas berkas ini. Yang paling akhir menang.
> **Prefix sheet:** PCD (bawaan), sheet **TODO v2**.

---

## 1. Tujuan

Versi 1 akan dibekukan untuk peluncuran, tetapi para owner sudah meminta fitur baru (fitur pertama: Bagikan). Tim butuh cara **mengerjakan versi 2 tanpa mengganggu versi 1 yang dipakai warung**, dan cara **menggabungkan fitur jadi ke versi live dengan nomor versi naik**.

Caranya memakai git yang sudah dipakai tim, **tanpa menyalin folder** dan **tanpa repo kedua**:

- **Tag** menandai kondisi versi 1 yang beku.
- **Branch `v2`** menjadi jalur kerja versi 2. Branch `main` tetap versi live.
- **Worker kedua** di Cloudflare membangun branch `v2` ke alamat `workers.dev` sendiri, untuk uji. Domain `kedaichata.biz.id` tidak tersentuh sampai fitur digabung ke `main`.

Supabase **tidak dipisah** pada tahap awal (satu project, dipakai bersama). Itu sebabnya fitur pertama dipilih yang tidak menyentuh database.

---

## 2. Tabel Keputusan

| No   | Keputusan                                                                                                                                                                                                                                                                                                                               | Catatan                                                                                                                                                                                                                                                             |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PC1  | Pemisahan versi memakai **git (tag dan branch)**, bukan menyalin folder atau repo kedua.                                                                                                                                                                                                                                                | Ketua, 21 Nov 2026.                                                                                                                                                                                                                                                 |
| PC2  | **`main` = versi live.** Pekerjaan kode v2 hanya di branch **`v2`**, dibuat dari tag `v1.0`.                                                                                                                                                                                                                                            | Nama branch (bawaan).                                                                                                                                                                                                                                               |
| PC3  | Kondisi versi 1 yang beku diberi **tag `v1.0`**.                                                                                                                                                                                                                                                                                        | Ketua menyatakan v1 di-freeze; kapan persisnya: K1.                                                                                                                                                                                                                 |
| PC4  | **Worker terpisah `kedai-chata-v2`** hanya membangun branch `v2` dan dipakai lewat alamat `workers.dev`. Setelah fitur diyakini, baru digabung ke `main` (Worker utama).                                                                                                                                                                | Usul ketua, 21 Nov 2026. Nama Worker (bawaan).                                                                                                                                                                                                                      |
| PC5  | Satu repo dan satu `wrangler.jsonc`. Worker v2 memakai **environment Wrangler `v2`**; field `name` **tetap `kedai-chata`**.                                                                                                                                                                                                             | Bawaan teknis. OK ketua untuk mengubah `wrangler.jsonc` belum tercatat (K2).                                                                                                                                                                                        |
| PC6  | **Satu fitur = satu rilis.** Tiap penggabungan ke `main` diberi tag naik (v1.1, v1.2, dan seterusnya).                                                                                                                                                                                                                                  | Ketua menyebut contoh 1.1.                                                                                                                                                                                                                                          |
| PC7  | **Supabase tidak disentuh** pada tahap awal. Bagikan (tanpa database) menjadi latihan alur.                                                                                                                                                                                                                                             | Ketua, 21 Nov 2026.                                                                                                                                                                                                                                                 |
| PC8  | Fitur v2 berikutnya yang menyentuh Supabase: perubahan hanya boleh **menambah** (tabel atau kolom baru), tidak menghapus atau mengubah yang dipakai v1. Lewat sesi strategi.                                                                                                                                                            | Bawaan. Karena satu project Supabase dipakai v1 live dan v2 uji sekaligus.                                                                                                                                                                                          |
| PC9  | **Cek anti-nyasar jadi empat:** folder aktif, alamat tujuan, email commit terakhir, dan **nama branch aktif**.                                                                                                                                                                                                                          | Bawaan. Menambah `AGENTS.md` bagian 8.                                                                                                                                                                                                                              |
| PC10 | **Perbaikan darurat v1** dikerjakan di `main` (hanya kode), lalu `main` segera digabung ke `v2`. Sebelum menyentuh `main`, pastikan `v2` bersih (semua sudah di-commit dan dipush).                                                                                                                                                     | Bawaan. Catatan perbaikannya ditulis di `v2` (PC12). Bila laptop sedang tidak ada: rollback di dashboard Cloudflare (Worker `kedai-chata`) lebih dulu, perbaikan kode menunggu laptop.                                                                              |
| PC11 | Saat rilis, **nomor cache `sw.js` harus lebih tinggi dari yang sedang live** (per 21 Nov 2026: `chata-v37`).                                                                                                                                                                                                                            | Bawaan. Dua jalur bisa menaikkan ke angka yang sama dengan isi berbeda.                                                                                                                                                                                             |
| PC12 | **Dokumen (`docs/*`, `AGENTS.md`) ditulis di `v2`, bersama kodenya.** `main` hanya disentuh untuk perbaikan darurat kode (PC10) dan latihan PCD.08.                                                                                                                                                                                     | Ketua, 21 Nov 2026. **Menggantikan PC12 lama** ("dokumen hanya di `main`"). Alasan: `main` dijaga tidak berubah supaya gabungan mulus; tim kerja serial (PC18). Dokumen di `main` tertinggal sampai rilis; tidak mempengaruhi aplikasi live.                        |
| PC13 | Uji v2 memakai **akun dummy**; data uji dibersihkan sesudahnya (pola LNC.01).                                                                                                                                                                                                                                                           | Bawaan. Alamat v2 memakai Supabase yang sama dengan yang live.                                                                                                                                                                                                      |
| PC14 | **Tidak ada penggabungan ke `main`** sampai kira-kira seminggu setelah LNC.03 (rilis terbatas). Sebelum itu v1.x hanya dikerjakan di `v2` dan diuji di alamat Worker uji. Kapan waktunya digabung diukur ketua dan tim.                                                                                                                 | Ketua, 21 Nov 2026. **Bukan aturan di `AGENTS.md`.**                                                                                                                                                                                                                |
| PC15 | Alamat Worker uji didaftarkan **sebagai tambahan** di tiga tempat: hostname widget Turnstile, Redirect URLs Auth Supabase, dan `ASAL_DIIZINKAN` fungsi `kedai`. **Site URL Auth tidak diganti** (tetap alamat resmi). Setelan HTTPS Cloudflare dan Umami tidak perlu disentuh.                                                          | Pola aditif `migrasi.md` MG8. Alamat diperkirakan `https://kedai-chata-v2.kedaichata.workers.dev` (nama Worker + subdomain akun); dipastikan di PCD.06.                                                                                                             |
| PC16 | Perubahan `ASAL_DIIZINKAN` dibuat **di branch `v2`** saat v1.x akan diuji, lalu `kedai` di-deploy **dari `v2`** (setelah `main` disinkron ke `v2`).                                                                                                                                                                                     | Bawaan. `kedai` satu fungsi untuk v1 live dan v2 uji, dideploy dari folder: bila kelak dideploy dari `main`, entri itu hilang dan alamat uji berhenti jalan (v1 tetap normal). Berlaku selama `v2` tidak punya perubahan `kedai` lain (PC8).                        |
| PC17 | **Freeze v1.0 tanpa PCD.13.** Alamat uji didaftarkan di `kedai` (PCD.13), Turnstile, dan Redirect URLs (PCD.07) baru saat v1.x akan diuji pertama kali.                                                                                                                                                                                 | Ketua, 21 Nov 2026. Alasan: `main` tetap beku tanpa tambahan. Pendaftarannya hanya menambah; alamat resmi tetap terdaftar.                                                                                                                                          |
| PC18 | **Kerja serial.** Satu orang dan satu laptop pada satu waktu. Sebelum mulai, pesan MULAI di grup Telegram; sesudah selesai, pesan SELESAI; keduanya memuat **nama branch** dan posisi laptop (rumah atau kantor). Tidak ada `git pull`, tidak ada edit lewat situs GitHub atau perangkat lain. Bug di aplikasi live: kabari ketua dulu. | Ketua, 21 Nov 2026. Tidak ada jadwal tetap: siapa yang kosong dan memegang laptop, dia yang mengerjakan (pola yang sudah berjalan). Analisis alur di berkas ini bersandar pada asumsi ini; bila tim jadi paralel, tinjau ulang. Penolakan push oleh Git = berhenti. |

---

## 3. Keputusan Ketua (21 Nov 2026) dan yang Masih Terbuka

**Sudah diputuskan ketua:** PC1 (git, bukan salin folder), PC4 (Worker terpisah untuk uji v2), PC7 (Supabase tidak disentuh dulu, Bagikan jadi latihan), niat PC6 (versi naik per fitur), dan **PC14 (21 Nov 2026): tidak ada penggabungan ke `main` sampai kira-kira seminggu setelah LNC.03; v1.x hanya diuji di alamat Worker uji. Waktu pastinya diukur ketua dan adik-adik sendiri, tidak ditulis sebagai aturan di `AGENTS.md`.** Alasan ketua: tim non-IT perlu membiasakan diri dengan alur ini lebih dulu. Alasan lain belum tercatat. **PC17 (21 Nov 2026): freeze v1.0 tanpa PCD.13; alamat uji didaftarkan saat v1.x akan diuji pertama kali.**

**Terbuka:**

- **K1: Kapan v1 dinyatakan final dan diberi tag `v1.0`?** Bawaan: di commit yang dipakai untuk LNC.03 (rilis terbatas, target Senin 23 Nov 2026). Perbaikan sesudahnya memakai tag `v1.0.1`, `v1.0.2`, dan seterusnya.
- **K2: OK ketua** untuk menambah blok environment `v2` di `wrangler.jsonc` (PCD.04). Berkas ini berkategori berisiko (`AGENTS.md` bagian 7).
- **K3: OK ketua** untuk mendaftarkan alamat Worker uji di hostname Turnstile, Redirect URLs Auth Supabase, dan `ASAL_DIIZINKAN` fungsi `kedai` (PCD.07, PCD.13). Site URL tidak diganti. Menyangkut pengaturan login dan fungsi live. Dikerjakan saat v1.x akan diuji pertama kali (PC17).
- **K4: dijawab ketua 21 Nov 2026** (lihat PC14). Tidak ada tanggal baku; ketua dan tim yang mengukur.
- **K5: dijawab ketua 21 Nov 2026.** Nama bawaan dipakai: branch `v2`, Worker `kedai-chata-v2`, environment `v2`, tag `v1.1`; Worker uji dipertahankan setelah rilis pertama.
- **Tambahan 21 Nov 2026 (sesi lanjutan):** PC12 berbalik (dokumen di `v2`) dan PC18 (kerja serial). Kode saat ini disebut kandidat v1.0.

---

## 4. Cara Kerja Singkat (bahasa awam)

| Istilah                     | Artinya                                                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Tag**                     | Stempel permanen di satu titik kode. `v1.0` = "foto beku" versi 1. Tidak mengubah apa pun, hanya penanda.                |
| **Branch**                  | Jalur kerja paralel. `main` = yang live. `v2` = tempat mencicil fitur baru.                                              |
| **Gabung (merge)**          | Memasukkan hasil satu jalur ke jalur lain. `v2` ke `main` = **rilis** (Worker utama otomatis membangun dan menayangkan). |
| **Sinkron**                 | Gabung ke arah sebaliknya: `main` ke `v2`, supaya v2 tidak tertinggal perbaikan atau catatan di `main`. Arah ini aman.   |
| **Worker `kedai-chata`**    | Yang melayani `kedaichata.biz.id` (warung memakai ini). Hanya membangun `main`.                                          |
| **Worker `kedai-chata-v2`** | Tempat uji. Hanya membangun `v2`. Alamatnya `workers.dev`, bukan domain warung.                                          |

```
main :  ──●(v1.0)────────────────────●(rilis, v1.1)────────●(rilis, v1.2)──
           \                         /                     /
v2   :      ●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──●──
            (nyicil, diuji di alamat Worker uji)
```

---

## 5. Penomoran dan Penamaan

| Hal                            | Aturan                                                                                                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tag fitur                      | `v1.1`, `v1.2`, dan seterusnya, satu per fitur yang dirilis.                                                                                                                |
| Tag perbaikan tanpa fitur      | `v1.0.1`, `v1.0.2` (pola yang sama untuk `v1.1.1`).                                                                                                                         |
| `v2.0`                         | Hanya bila ketua memutuskan.                                                                                                                                                |
| Branch                         | `main` (live), `v2` (kerja).                                                                                                                                                |
| Worker                         | `kedai-chata` (live), `kedai-chata-v2` (uji).                                                                                                                               |
| Environment Wrangler           | `v2`.                                                                                                                                                                       |
| **Bukan** nomor versi aplikasi | Nomor cache `sw.js` (`chata-vNN`). Angkanya naik hanya saat berkas baru didaftarkan atau `sw.js` berubah. Label versi di aplikasi masih kandidat (`bonus.md`, blok 21 Nov). |

---

## 6. Alur

**A. Kerja harian di v2**

_Sekali saja, sebelum uji pertama di alamat Worker uji: kerjakan PCD.13 dan PCD.07 (PC17)._

1. Kirim pesan **MULAI** di grup Telegram (branch, butir yang dikerjakan, posisi laptop). Lanjut hanya bila tidak ada yang sedang bekerja (PC18).
2. Cek **nama branch aktif = `v2`** bersama tiga cek lama (PC9).
3. Edit dan commit. Commit yang menyentuh `public/`, `wrangler.jsonc`, `supabase/`, atau `.github/` **tanpa `[skip ci]`**.
4. Push ke `v2`. Worker `kedai-chata-v2` membangun. Buka alamat `workers.dev` v2 di HP.
5. Uji dengan akun dummy. Bersihkan data uji (PC13).
6. Tulis catatan dan handoff di md fitur dan dokumen terkait, **di `v2`** (PC12).
7. Kirim pesan **SELESAI**: sudah commit dan push, tidak ada yang menggantung, posisi laptop (PC18).

**B. Rilis satu fitur (gabung ke `main`)**

_Waktunya diukur ketua dan tim (bawaan: kira-kira seminggu setelah LNC.03). Sebelum itu v1.x hanya diuji di alamat Worker uji (PC14)._

1. Fitur lulus uji di alamat v2 (Low-Risk: cek visual; High-Risk: uji terstruktur, `AGENTS.md` bagian 7).
2. **Sinkron dulu:** gabungkan `main` ke `v2`, uji ulang singkat.
3. Pastikan nomor cache `sw.js` lebih tinggi dari yang live (PC11).
4. ⚠️ Penjelasan dampak dan **OK ketua**.
5. Gabungkan `v2` ke `main`, push. Worker `kedai-chata` membangun otomatis.
6. Cek di `kedaichata.biz.id` dari HP (tutup lalu buka aplikasi).
7. Beri tag naik (misalnya `v1.1`) dan push tag.
8. Catat di blok md fitur (bagian 12) dan `AGENTS.md` bila ada keputusan baru. Ditulis di `v2` (PC12); ikut ke `main` lewat rilis berikutnya.

**Mundur bila rilis bermasalah:** rollback di Cloudflare pada Worker `kedai-chata` (sesuai `AGENTS.md`, blok 21 Nov), **bukan** menghidupkan lagi GitHub Pages.

**C. Perbaikan darurat v1**

_Bila laptop sedang tidak ada: rollback di dashboard Cloudflare (Worker `kedai-chata`) lebih dulu; perbaikan kode menunggu laptop (PC10)._

1. Pastikan `v2` bersih (semua sudah di-commit dan dipush), lalu pindah ke `main` dan cek branch aktif = `main`. Perbaiki **kode** saja, push (terbit live).
2. Beri tag perbaikan (`v1.0.1`).
3. **Segera gabungkan `main` ke `v2`.** Bentrok paling mungkin di `sw.js` (nomor cache). Bentrok di berkas berisiko (`sw.js`, `kedai/index.ts`, `wrangler.jsonc`): AI menjelaskan dua versinya dan menunggu OK ketua; bentrok di md boleh dipilih AI lalu dilaporkan.
4. Kembali ke `v2`, cek branch aktif, lalu tulis catatan perbaikan di md (PC12).

**D. Mulai fitur v2 berikutnya**

Sinkron `main` ke `v2` dulu, supaya mulai dari kondisi yang sama dengan yang live.

---

## 7. Yang Dibuat

- **Di GitHub:** tag `v1.0` dan tag rilis berikutnya; branch `v2`. Tidak ada berkas baru.
- **Di Cloudflare:** Worker baru `kedai-chata-v2` (dashboard akun ketua, profil browser terpisah, logout setelah selesai). Pengaturan sama dengan Worker utama (`migrasi.md`): build command kosong, preview builds mati, watch paths Exclude `docs/*` dan `AGENTS.md`, tanpa variabel atau rahasia. **Bedanya:** hanya branch `v2`, dan deploy command ditambah penunjuk environment `v2`.
- **Di `wrangler.jsonc`:** satu blok environment `v2` (ditambahkan di branch `v2`; ikut ter-gabung ke `main` saat rilis dan tidak dipakai Worker utama). Alasannya: menurut dokumentasi Cloudflare, nama Worker di dashboard harus sama dengan `name` di berkas Wrangler. Dokumentasi yang sama memberi contoh Worker bernama `my-worker-staging` yang dideploy dari berkas bernama `my-worker` memakai blok environment dan penunjuk environment di deploy command. Mengganti `name` menjadi `kedai-chata-v2` **tidak boleh**, karena ikut ter-gabung dan merusak Worker live. Blok itu juga menuliskan `workers_dev` aktif secara eksplisit, supaya alamat uji tidak ikut mati bila `workers_dev` kelak dimatikan di tingkat atas (MG14).
- **Di dashboard Turnstile dan Supabase (PCD.07):** alamat Worker uji ditambahkan ke hostname widget Turnstile dan ke Redirect URLs Auth (format entri sama dengan yang lama: dengan garis miring, tanpa wildcard). **Site URL tidak diganti.**
- **Di kode `kedai` (PCD.13):** satu entri tambahan di `ASAL_DIIZINKAN` (`supabase/functions/kedai/index.ts`), dibuat **di branch `v2`** saat v1.x akan diuji (setelah `main` disinkron ke `v2`), lalu `kedai` di-deploy dari `v2` sesuai urutan `AGENTS.md` bagian 8. Tanpa entri ini Masuk dan semua aksi gagal dari alamat uji karena pembatas asal permintaan (SEC-33). Pembatas asal bukan satu-satunya pengaman: token login tetap diperiksa. Sesudah deploy: tes preflight dari alamat uji dan alamat resmi, dan cek Masuk di aplikasi live.
- **Tidak ada:** berkas baru di `public/`, perubahan database, aksi `kedai` baru, SQL, atau CLI baru (`wrangler` tetap tidak dipasang di Mac).
- **Tidak perlu:** setelan HTTPS Cloudflare (itu milik domain `kedaichata.biz.id`; alamat `workers.dev` sudah HTTPS dan alamat uji lama terbuka tanpa setelan itu) dan perubahan Umami (`data-domains` hanya berisi alamat resmi dan alamat lama, jadi kunjungan dari alamat uji tidak ikut tercatat).
- **Tidak berubah:** Worker `kedai-chata`, domain `kedaichata.biz.id`, `pages.yml` (tetap nonaktif, **jangan diaktifkan**).

**Belum dibuktikan (cek saat dikerjakan):**

- Apakah `assets` di `wrangler.jsonc` diwariskan ke environment `v2` atau harus ditulis ulang di dalam blok.
- Apakah push tag memicu build di Cloudflare (PCD.02 mengeceknya).
- Apakah alamat Worker uji benar `https://kedai-chata-v2.kedaichata.workers.dev` (diturunkan dari pola alamat uji lama `kedai-chata.kedaichata.workers.dev`).
- Apakah `workers_dev` diwariskan ke environment atau harus ditulis ulang di dalam blok.
- Apakah Redirect URL alamat uji benar-benar dibutuhkan untuk Masuk (di migrasi ditambahkan sebagai kebiasaan aditif, belum terbukti perlu).
- Dulu Cloudflare punya fitur yang membuat **pull request otomatis** untuk memperbaiki ketidakcocokan nama di berkas Wrangler (changelog Feb 2025). Belum dicek apakah masih aktif.
- Apakah Workers Builds menghormati `[skip ci]` (belum dicek sejak 21 Nov; jangan diandalkan).
- Batas jumlah Worker dan permintaan di paket gratis Cloudflare: cek situs resmi sebelum diandalkan.
- Apakah toggle `workers.dev` yang dimatikan lewat dashboard bertahan setelah deploy berikutnya (`wrangler.jsonc` tidak menyebutnya). Apakah `preview_urls` diwariskan ke environment `v2`.
- **Cek dashboard 21 Nov 2026 (Worker `kedai-chata`):** toggle Production dan Preview di tab Domains menyala; Deployments hanya memuat versi dari `main` dan "Dashboard", tidak ada versi dari branch lain. Dua entri "Manually deployed" bertanggal sama dengan pekerjaan domain (dugaan, belum terbukti).
- Cloudflare punya fitur **Previews** (preview per branch di bawah Worker yang sama). Belum dicek apakah cukup sebagai pengganti Worker kedua (batas paket gratis, format alamat). Putuskan lewat sesi strategi sebelum PCD.05.

---

## 8. Urutan Pekerjaan (untuk TODO sheet, prefix PCD)

Langkah ⚠️ butuh penjelasan dampak dan "OK" ketua.

| ID     | Pekerjaan                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Tipe      | Prioritas |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------- |
| PCD.01 | Ketua menyatakan versi 1 final (beku). Pastikan semua commit v1 sudah ada di `main` dan terpush, tidak ada berkas yang berhenti di tengah, lalu tempel empat cek anti-nyasar ke chat (folder, alamat tujuan, email commit, nama branch = main).                                                                                                                                                                                                                                                                                          | Low-Risk  | P1        |
| PCD.02 | Beri tag `v1.0` di commit beku dan push tag ke GitHub. Cek di riwayat build Cloudflare bahwa push tag tidak memicu build.                                                                                                                                                                                                                                                                                                                                                                                                                | Low-Risk  | P1        |
| PCD.03 | Buat branch `v2` dari tag `v1.0` dan push. Mulai saat ini semua pekerjaan kode v2 hanya di branch ini.                                                                                                                                                                                                                                                                                                                                                                                                                                   | Low-Risk  | P1        |
| PCD.04 | ⚠️ Tambah blok environment `v2` ke `wrangler.jsonc` di branch `v2` saja. Field `name` tetap `kedai-chata`. Tulis `workers_dev` aktif secara eksplisit di blok itu. Cek apakah `assets` diwariskan ke environment atau harus ditulis ulang. Butuh penjelasan dampak dan OK ketua. Commit tanpa [skip ci].                                                                                                                                                                                                                                 | High-Risk | P1        |
| PCD.05 | ⚠️ Buat Worker `kedai-chata-v2` di dashboard Cloudflare (profil browser terpisah, logout setelah selesai): sambungkan ke repo yang sama, hanya branch `v2`, build command kosong, deploy command `npx wrangler deploy --env v2`, preview builds mati, watch paths Exclude `docs/*` dan `AGENTS.md`, tanpa variabel atau rahasia. Jangan menyentuh Worker `kedai-chata`. Butuh OK ketua.                                                                                                                                                  | High-Risk | P1        |
| PCD.06 | Push pertama ke branch `v2`. Pastikan Worker `kedai-chata-v2` berhasil membangun dan alamat workers.dev terbuka di HP (perkiraan: kedai-chata-v2.kedaichata.workers.dev). Pastikan Worker `kedai-chata` dan kedaichata.biz.id tidak ikut membangun (cek riwayat build kedua Worker).                                                                                                                                                                                                                                                     | High-Risk | P1        |
| PCD.07 | ⚠️ Daftarkan alamat Worker uji sebagai tambahan di hostname widget Turnstile dan di Redirect URLs Auth Supabase (format entri sama dengan yang lama: dengan garis miring, tanpa wildcard). Site URL tidak diganti. Lalu tes Masuk dan Daftar dengan akun dummy.                                                                                                                                                                                                                                                                          | High-Risk | P1        |
| PCD.08 | Latihan sinkron: buat satu perubahan md kecil di `main`, lalu gabungkan `main` ke `v2` dan push. Tim berlatih memeriksa branch aktif dan membaca hasil gabung.                                                                                                                                                                                                                                                                                                                                                                           | Low-Risk  | P1        |
| PCD.09 | Tempel blok catatan keputusan: AGENTS.md (peta bagian 5, bagian 3 hosting, bagian 8 cek anti-nyasar jadi empat), lalu blok pendek ke migrasi.md, bonus.md, dan bagikan.md. Isi dari bagian 10 pemisahan-code.md.                                                                                                                                                                                                                                                                                                                         | Low-Risk  | P1        |
| PCD.10 | ⚠️ Rilis fitur pertama (Bagikan) ke main: gabungkan `main` ke `v2` dan tes singkat, pastikan nomor cache `sw.js` lebih tinggi dari yang live, minta OK ketua, gabungkan `v2` ke `main`, push, cek di kedaichata.biz.id dari HP, beri tag `v1.1`.                                                                                                                                                                                                                                                                                         | High-Risk | P1        |
| PCD.11 | Siapkan langkah perbaikan darurat v1: pastikan `v2` bersih, perbaiki kode di `main`, beri tag `v1.0.1`, gabungkan `main` ke `v2`, lalu kembali ke `v2` dan tulis catatan di md. Latih dengan simulasi sebelum dibutuhkan sungguhan.                                                                                                                                                                                                                                                                                                      | Low-Risk  | P2        |
| PCD.12 | Evaluasi alur di review LNC.05: apa yang membingungkan tim. Putuskan perlu tidaknya Supabase kedua untuk uji (B25) sebelum fitur v2 yang menyentuh database.                                                                                                                                                                                                                                                                                                                                                                             | Low-Risk  | P2        |
| PCD.13 | ⚠️ Dikerjakan saat v1.x akan diuji pertama kali, setelah PCD.06. Tambah alamat Worker uji (perkiraan `https://kedai-chata-v2.kedaichata.workers.dev`) ke `ASAL_DIIZINKAN` di `supabase/functions/kedai/index.ts` di branch `v2` (setelah `main` disinkron ke `v2`), di samping alamat yang sudah ada, lalu deploy `kedai` dari `v2` sesuai urutan AGENTS.md bagian 8. Sesudah deploy, tes preflight dari alamat uji dan dari alamat resmi, dan cek Masuk di aplikasi live. Butuh penjelasan dampak dan OK ketua. Commit tanpa [skip ci]. | High-Risk | P1        |
| PCD.14 | Kabari semua anggota aturan kerja: jangan ubah `main` (termasuk lewat situs GitHub), semua kerja kode dan dokumen di `v2`, bug di aplikasi live dikabarkan ke ketua dulu, dan pesan MULAI dan SELESAI di grup Telegram memuat nama branch dan posisi laptop.                                                                                                                                                                                                                                                                             | Low-Risk  | P1        |

Urutan: PCD.01 dan PCD.02, lalu **PCD.14** (kabari tim), lalu PCD.03 sampai PCD.06 dan PCD.08, PCD.09 (freeze dan penyiapan, tidak menyentuh yang live kecuali dashboard Cloudflare Worker baru). Lalu **saat v1.x akan diuji: PCD.13 dan PCD.07**. Lalu PCD.10 (saat rilis), PCD.11, PCD.12. **SHR.01 (desain template Canva) tidak bergantung pada pekerjaan ini dan boleh jalan paralel; SHR.02 dan seterusnya menunggu PCD.08.**

**Cek lulus PCD.06 (isolasi):** riwayat build Worker `kedai-chata-v2` menunjukkan build dari branch `v2`; riwayat Worker `kedai-chata` **tidak** menunjukkan build baru dari push itu. Tanpa bukti jangan diberi lulus.

---

## 9. Aturan yang paling sering terlanggar

1. **Mengedit atau push saat branch aktif salah.** Cek nama branch dulu, tiap kali (PC9).
2. **Mengganti `name` di `wrangler.jsonc` menjadi `kedai-chata-v2`.** Tetap `kedai-chata`; bedanya lewat environment (PC5).
3. **Menggabung pull request otomatis dari Cloudflare yang mengganti `name`.** Jangan, bisa merusak Worker live.
4. **Mengerjakan fitur v2 langsung di `main`.** `main` terbit live otomatis.
5. **Deploy fungsi Supabase dari branch yang salah.** `bersihkan` tidak pernah dari `v2`. `kedai` dari `v2` **hanya** untuk entri alamat uji (PCD.13) dan hanya setelah `main` disinkron ke `v2`; selain itu `kedai` dari `main`. Fungsi live memakai kode dari folder yang dipakai saat deploy.
6. **Perubahan database v2 yang menghapus atau mengubah yang dipakai v1** (PC8).
7. **Nomor cache `sw.js` sama atau lebih rendah dari yang live saat rilis** (PC11).
8. **Lupa sinkron `main` ke `v2`** setelah perbaikan darurat (PC10).
9. **Mengubah md di `main`.** Md ditulis di `v2` (PC12); `main` hanya untuk perbaikan darurat kode (PC10) dan latihan PCD.08.
10. **Lupa memberi tag setelah rilis,** sehingga versi live tidak bisa ditelusuri.
11. **Order uji di alamat v2 tidak dibersihkan.** Datanya masuk Supabase yang nyata (PC13).
12. **Mengaktifkan kembali `pages.yml` atau GitHub Pages.** Dinonaktifkan sengaja (migrasi).
13. **Mengandalkan `[skip ci]`** di Cloudflare. Belum terbukti; commit md aman karena watch paths, bukan karena `[skip ci]`.
14. **Mengganti Site URL Auth untuk alamat uji.** Site URL tetap alamat resmi; alamat uji hanya ditambah di Redirect URLs (PC15).
15. **Mendeploy `kedai` dari `main` selama masa uji.** Entri alamat uji hilang dan alamat uji gagal CORS (PC16). Pulihnya: sinkron `main` ke `v2`, lalu deploy ulang `kedai` dari `v2`.
16. **Membuka alamat uji sebelum PCD.13 dan PCD.07 selesai.** Masuk dan semua aksi gagal (CORS), dan widget Turnstile gagal terus mengulang.
17. **Edit lewat situs GitHub atau dari perangkat lain.** Semua kerja lewat laptop bersama (PC18).
18. **Berhenti atau memindahkan laptop dengan perubahan menggantung.** Commit dan push dulu, baru kirim pesan SELESAI (PC18).

---

## 10. Dampak dan Pembatalan

- **Dampak ke versi live:** tidak ada sampai v1.x akan diuji. Saat itu dua hal menyentuh yang live, keduanya hanya menambah: deploy `kedai` dengan satu entri baru (PCD.13) dan penambahan alamat di dashboard Turnstile dan Auth (PCD.07). Sesudah deploy `kedai`, tes alamat resmi tetap jalan. Selain itu tidak ada sampai rilis (PCD.10).
- **Berkas lama yang berubah:** `wrangler.jsonc` (blok tambahan) dan `supabase/functions/kedai/index.ts` (satu entri di `ASAL_DIIZINKAN`, di branch `v2`). Tidak ada berkas baru, perubahan database, aksi `kedai` baru, atau SQL. Tidak ada baris SEC baru; SEC-33 (CORS dari alamat) dijalankan lagi untuk alamat uji di PCD.07.
- **Pembatalan:** hapus Worker `kedai-chata-v2` di dashboard, buang blok environment `v2` dari `wrangler.jsonc`, cabut alamat uji dari Redirect URLs, hostname Turnstile, dan `ASAL_DIIZINKAN` (deploy `kedai`). Branch dan tag boleh dibiarkan (tidak berbahaya). Tidak ada data di server yang perlu dibersihkan, selain data uji (PC13).
- **Dokumen lain yang perlu blok susulan** (ditempel di jalur yang aktif: sebelum PCD.03 di `main`, sesudahnya di `v2`):
  - `AGENTS.md`: peta bagian 5 (baris `docs/pemisahan-code.md`, prefix **PCD**); bagian 3 (hosting: ada Worker uji kedua, Worker utama tetap hanya `main`); bagian 8 (cek anti-nyasar jadi empat). **Tidak ada aturan waktu rilis di `AGENTS.md`** (keputusan ketua 21 Nov).
  - `migrasi.md`: Worker kedua dan blok environment.
  - `bonus.md`: **B25 (lingkungan uji terpisah) terpenuhi sebagian**, yaitu untuk kode saja; Supabase tetap satu.
  - `bagikan.md`: Bagikan dikerjakan di branch `v2` dan diuji di alamat Worker uji; urutan pekerjaan mengikuti bagian 8 berkas ini.
- **Pertentangan dengan catatan lama:** `AGENTS.md` (blok 21 Nov, Bagikan) menyebut Bagikan "dikerjakan setelah LNC.03 dan LNC.04". Untuk **pengerjaan** di branch `v2`, berkas ini membolehkan lebih awal. Untuk **rilis ke `main`**, waktunya kira-kira seminggu setelah LNC.03 dan diukur ketua dan tim (PC14), tanpa menunggu LNC.04 secara otomatis. Bagian 8 `AGENTS.md` menyebut tiga cek anti-nyasar; kini empat (PC9). **PC12 diubah 21 Nov (sesi lanjutan):** dokumen kini ditulis di `v2`, PC12 lama tidak berlaku. Yang paling akhir menang.

---

## 11. Ditunda

- **Supabase kedua khusus uji** (kandidat B25). Naik bila ada fitur v2 yang menyentuh database (PCD.12).
- **Proteksi branch `main` di GitHub** (wajib lewat pull request). Naik setelah tim terbiasa.
- **Branch per fitur** (bukan satu `v2` untuk semuanya) dan preview per branch.
- **Menghapus `pages.yml`** (tetap ditunda, sesuai keputusan 21 Nov).
- **Label versi aplikasi dan banner "versi baru tersedia"** (`bonus.md`, blok 21 Nov).
- **Fitur Previews Cloudflare** sebagai pengganti Worker kedua (bagian 7, belum dicek).
- **Membersihkan alamat lama (github.io) di `ASAL_DIIZINKAN` dan `data-domains`, serta mematikan Preview URLs dan `workers.dev`:** dibiarkan dulu, keputusan ketua 21 Nov (blok di `migrasi.md`). Alamat lama di `ASAL_DIIZINKAN` boleh dibuang sekalian saat PCD.13 menyentuh baris yang sama.

**Tidak dikerjakan:** salin folder sebagai versi, repo kedua, dan Docker atau setup lokal Supabase (dilarang `AGENTS.md`).

---

## 12. Catatan Susulan dan Handoff (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik` atau `### Handoff #N | tanggal | nama PIC`. Yang paling akhir menang.

---

_(belum ada blok)_
