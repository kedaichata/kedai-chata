# AGENTS.md — Kedai ChATA (PWA)

Panduan utama & aturan interaksi AI Agent untuk repository ini.

> 💡 **PENTING UNTUK AI AGENT**:
>
> 1. Dokumen ini adalah **Entry Point ringkas**. Isinya hanya aturan yang stabil. Status pekerjaan (sudah/belum jalan) tidak dicatat di sini.
> 2. Detail fitur ada di folder `docs/`. Buka dokumen yang relevan dengan fitur yang sedang dikerjakan; tim melampirkannya di awal sesi.
> 3. **Daftar pekerjaan (TODO) dipegang tim di Google Sheet berupa ringkasan, dan tidak dibagikan ke AI** (kecuali berupa screenshot). **Sheet tidak menerima catatan tambahan dari sesi kode: semua catatan masuk ke md** (aturan 7). Kerjakan apa yang diminta di chat saja.
> 4. Konteks: aplikasi ini **dipakai nyata oleh warung keluarga**, bukan aplikasi komersial berskala besar. Sesuaikan rekomendasi dengan skala kecil dan free tier. Usahakan jawaban **ramping** supaya hemat token.
> 5. Bila ada selisih antara dokumen fitur dan `AGENTS.md`, `AGENTS.md` yang menang.
> 6. **Dokumen fitur sudah final dari sesi strategi.** Sesi kode **tidak merapikan, menulis ulang, atau menambah panjang md**. Md hanya ditambah blok catatan bila ada keputusan baru atau kejadian di lapangan (aturan 7).

---

## 1. Latar Belakang Tim & Tujuan

- Tim 4 orang **bukan programmer** (ketua, adik ketua, dan dua anggota lain, semuanya non-IT). Tidak ada yang paham coding. Semua kode ditulis AI, manusia hanya copas dan menjalankan langkah yang dipandu.
- Tujuan: **PWA sistem order untuk "Kedai ChATA"** (nama pendek "ChATA"), sekaligus **merapikan catatan order yang selama ini ada di WhatsApp**. Tiga pihak melihat status order yang sama: **customer**, **owner**, dan **penjaga**.
- Konteks warung (menentukan banyak keputusan):
  - Sekitar 100 customer. Kebanyakan **ibu dari anak sekolah** yang memesan makan siang untuk anaknya; sebagian kecil siswa SMA memesan sendiri (kebanyakan siswa langsung datang ke warung). Ada juga pelanggan umum lain (misalnya tukang), jadi sistem tidak boleh hanya cocok untuk kasus anak sekolah.
  - Sekitar 90% order **diantar**. Masalah utama yang mau diselesaikan: customer kadang **merasa tidak diantar**. Karena itu ada **foto bukti antar** (opsional, penjaga yang menilai perlu atau tidak).
  - **5 owner** (usaha patungan keluarga) dan **penjaga** warung (sekitar 2 orang di hari biasa, orang berbeda di akhir pekan, jadi akun penjaga bisa lebih dari 2). Semua owner setara, semua penjaga setara. Warung buka 7 hari seminggu; order di akhir pekan tetap ada (misalnya ekskul), dan pesanan di luar jam buka sering tetap dilayani.
  - Customer harus dibuat **sesederhana memakai WA**: ibu-ibu tidak boleh "alergi" memakai aplikasi ini.
- Rencana versi: **versi 1** = inti sistem order (dokumen ini dan `docs/`). **Versi 2 dan 3** = daftar kandidat di `docs/bonus.md`, urutannya ditentukan setelah review pemakaian versi 1.
- Aturan dasar sistem (keputusan ketua):
  - Order punya tipe **Diantar (default), Diambil, Makan di warung**, hari **Hari ini atau Besok**, dan **jam bebas** yang diisi customer (tanpa daftar pilihan dan tanpa batas jam; order di luar jam buka tetap bisa masuk dan owner yang memutuskan).
  - **Pembayaran diselesaikan di luar aplikasi.** Uang tunai boleh dititipkan ke penjaga secara fisik dan dikoordinasikan lewat WA, tetapi **hanya owner yang menekan Setujui**, sambil memilih metode (Transfer, Tunai, QRIS). Customer tidak memilih metode bayar. Payment gateway adalah kandidat versi 3.
  - **Tanpa chat di aplikasi.** Follow up lewat WA. Perubahan permintaan dicatat sebagai **catatan berlapis** (ada waktu dan penulis) selama order belum Diproses.
  - Harga **selalu dihitung server** dari menu. Aplikasi tidak pernah mengirim harga, total, status, atau peran.
  - Pembaruan status lewat **push notification (VAPID)** ditambah ambil data saat aplikasi dibuka. **Tanpa polling terus-menerus.**
  - Pelanggan yang belum punya akun dicatat owner lewat wizard, dengan daftar "Pelanggan tanpa akun".
  - Semua angka yang bisa berubah (batas alamat, lama simpan foto, batas catatan, batas jumlah item) **disimpan di database, tidak ditulis mati di kode**. Nilai awal ada di `docs/database.md`.

## 2. ⚠️ Aturan Interaksi AI (WAJIB)

1. **Dilarang menulis kode tanpa permintaan eksplisit.** Jangan menghasilkan blok kode, SQL, atau implementasi lengkap kecuali user meminta (contoh: "buatkan kodenya", "gas"). Fokus awal sesi: diskusi singkat.
2. **Dilarang menghapus atau menimpa kode lama.** Jangan hapus _dead code_, komentar, atau variabel tidak terpakai tanpa perintah eksplisit. Bila perubahan memang butuh menghapus, sebut bagian mana dan kenapa, lalu tunggu "OK".
3. **Metode share code: 1 file utuh** berdasarkan versi _latest_ yang ditempel user (berlaku untuk kode, SQL, dan konfigurasi). Tanpa placeholder seperti `// ...kode lain tetap sama...`. Satu file = satu berkas, diawali path lengkapnya. Di awal jawaban, sebut daftar file yang berubah (idealnya 1 sampai 3 per giliran). **Kirim sebagai berkas/artifak yang bisa dibuka di panel samping, bukan ditulis panjang di jendela chat.** Kode **wajib dicopas dari berkas itu**, tidak ditulis langsung di editor.
4. **Jangan menebak isi file.** Bila butuh file yang belum ditempel, minta ke user di awal sesi (sebut nama dan alasannya sekaligus).
5. **Konfirmasi sebelum eksekusi.** Perubahan berisiko (skema tabel, fungsi SQL, RLS, Edge Function, penjadwal pembersihan foto, kunci VAPID dan rahasia lain, `sw.js`, `pages.yml`, login, pengaturan di database, penghapusan data) wajib dijelaskan dampaknya dalam bahasa awam, lalu tunggu "OK".
6. **Bahasa UI & komentar kode: Bahasa Indonesia.**
7. **Dokumen (`docs/`) final dari sesi strategi dan tidak dirapikan di sesi kode.** Dokumen hanya ditambah bila ada **keputusan baru atau kejadian di lapangan** saat sesi kode. Caranya: AI **bertanya atau meringkas dulu**, lalu setelah user setuju menulis **satu blok pendek siap tempel** berjudul `### YYYY-MM-DD: topik`, lengkap dengan nama file tujuan, yang ditempel di bagian **Catatan Susulan** di akhir file itu (append-only). Bila blok baru bertentangan dengan isi lama, **yang paling akhir menang**, dan AI menyebut pertentangannya ke user. Jangan mengarang alasan keputusan; bila tidak tahu, tulis "alasan belum tercatat".
8. **Pekerjaan selesai = pengingat centang.** AI cukup menyebut: "butir ini sudah selesai, silakan dicentang di sheet". Pekerjaan lanjutan disebut "butir baru yang perlu ditambah ke sheet" dengan **judul pendek saja**. AI tidak menulis catatan untuk sheet; semua catatan masuk ke md (aturan 7).
9. **Handoff** dibuat hanya bila user memintanya ("handoff" atau "update sesi"), misalnya saat pekerjaan akan diteruskan anggota lain. Format: `### Handoff #N | tanggal | nama PIC`; isi: tugas, file yang diubah, keputusan baru, masalah yang belum beres, saran giliran berikutnya. Ringkas, tanpa log tes panjang. Ditempel di bagian akhir dokumen fitur terkait.
10. **Crash di produksi dicatat sebagai bahan belajar.** Bila aplikasi rusak, AI membantu memperbaikinya, lalu menulis satu blok catatan singkat: apa yang rusak, penyebab, perbaikan, dan cara mencegahnya.
11. **Data pribadi nyata tidak boleh masuk chat, md, atau kode.** Nomor WA, alamat, nama customer, dan email nyata tidak ditulis. Contoh dan data uji selalu **dummy**. Bila user menempel screenshot yang berisi data pelanggan nyata, AI meminta datanya disamarkan dulu.
12. **Persetujuan "OK" untuk perubahan berisiko dipegang ketua.** Bila yang sedang giliran bukan ketua, AI memberi ringkasan singkat yang bisa diteruskan lewat WA (apa yang berubah, dampaknya, bisa dibatalkan atau tidak), lalu menunggu kabar persetujuan.

## 3. Tech Stack

- **Frontend**: Vanilla HTML + JS + CSS. **Tanpa build tool, tanpa npm, tanpa framework.** Tampilan **mobile-first** (HP orang tegak), tombol besar, satu tujuan per layar.
- **Backend & DB**: **Supabase cloud, paket gratis, wilayah Singapura**: Postgres, Auth (email + password), RLS, Storage, Edge Functions, dan penjadwal `pg_cron`. Password dikelola Supabase, tidak pernah disimpan sendiri. **Akun Supabase milik ketua** (bukan akun lain).
- **Edge Function:** dua saja. **`kedai`** (semua aksi aplikasi, banyak aksi, hanya untuk pengguna yang login) dan **`bersihkan`** (pembersihan foto bukti, hanya dipanggil penjadwal). Rincian di `docs/database.md`.
- **Kunci API Supabase memakai sistem baru:** kunci **publishable** (`sb_publishable_...`, pengganti `anon`) di aplikasi, dan kunci **secret** (`sb_secret_...`, pengganti `service_role`) hanya di dalam Edge Function. **Kunci lama (`anon` dan `service_role`) dilarang dipakai** karena Supabase sedang menghentikannya (jadwal terakhir yang dicek ketua, 5 Nov 2026: masa transisi sampai akhir Februari 2027; cek ulang di situs Supabase sebelum diandalkan); bila ada tutorial atau jawaban yang menyuruh menyalin kunci panjang berawalan `eyJ`, itu kunci lama. Bila dashboard menampilkan tombol "Create new API keys", buat dulu kunci barunya. Peran Postgres tetap bernama `service_role`, jadi hak tabel tidak berubah.
- **Push notification:** Web Push dengan kunci **VAPID**, ditangani `sw.js` dan Edge Function. Rincian di `docs/notifikasi.md`.
- **Foto:** Supabase Storage, bucket **privat**, dikompres di HP sebelum diunggah. Rincian di `docs/foto-bukti.md`.
- **Hosting**: **GitHub Pages lewat GitHub Actions** (`.github/workflows/pages.yml` menerbitkan folder `public/`). Semua path **relatif** terhadap `public/`, tidak diawali `/`. Nama berkas huruf kecil, tanpa spasi. **Akun GitHub milik ketua.**
- **PWA**: `manifest.json` + `sw.js` strategi **network first**. Nama aplikasi **"Kedai ChATA"**, nama pendek **"ChATA"**.
- **Pustaka Supabase dan pustaka push** dipakai dengan **versi dipatok** (bukan "latest"). Pustaka Supabase untuk aplikasi disimpan sebagai **salinan berkas di `public/lib/`** (bukan dimuat dari CDN), supaya aplikasi tetap terbuka offline.
- **Satu environment saja: production** (keputusan bawaan, mengikuti pola proyek adik). Karena itu perubahan berisiko wajib dijelaskan dulu dan ada salinan SQL di repo sebelum dijalankan. Data uji dibersihkan sebelum peluncuran (`docs/features.md`, bagian Peluncuran).
- **Dilarang menyarankan Docker, VPS, atau self-host.** Tidak ada setup lokal Supabase. Semua kerja langsung ke project Supabase cloud lewat dashboard.
- **CLI:** hanya **`supabase functions deploy <nama> --use-api --project-ref ...`**, dengan urutan aman di bagian 8. Flag `--no-verify-jwt` dipakai **hanya untuk `bersihkan`**, tidak untuk `kedai` (bagian 7). Migration CLI (misal `supabase db push`) dilarang.
- **Git lewat terminal** di Mac bersama (`git status`, `git add .`, `commit`, `push`), dengan pagar di bagian 8.
- Tampilan: CSS/SVG, **CSS ditulis sendiri tanpa CDN** (tanpa Bootstrap, Tailwind, atau Google Fonts; font bawaan sistem), **semua gaya terpusat di satu berkas `public/style.css`**.

## 4. Skala & Rekomendasi

- **Asumsi skala:** sekitar 100 customer, 7 sampai 9 staf (5 owner + penjaga, termasuk tim akhir pekan), puluhan order per hari. Gunakan free tier. Jangan menyarankan arsitektur kompleks atau berbayar.
- **Batas free tier Supabase (dicek Nov 2026, cek ulang di situs resmi sebelum diandalkan):** sekitar 500.000 panggilan Edge Function per bulan, 5 GB egress, 1 GB file, 500 MB database, 50.000 pengguna aktif per bulan, 2 project aktif per organisasi.
- **Hemat panggilan ke server:** **tanpa polling dan tanpa Realtime.** Data diambil saat aplikasi dibuka atau kembali ke layar, saat push masuk (bila aplikasi terbuka), dan lewat tombol **Segarkan**. Tidak ada timer yang memanggil server terus-menerus.
- **Hemat kuota file:** foto dikompres di HP (sekitar 100 sampai 200 KB), foto bukti dibersihkan otomatis setelah **14 hari**, catatan order tetap.
- **Project Supabase gratis dijeda otomatis bila sekitar 1 minggu tanpa aktivitas.** Warung dipakai tiap hari, tetapi **saat libur sekolah atau warung tutup lebih dari beberapa hari**, buka aplikasi atau dashboard rutin. Cek aturan gratis terbaru di situs resmi.
- Simpan salinan SQL (skema, fungsi, pengaturan) di `supabase/` sebagai cadangan. Isi bantuan dikecualikan: cadangannya adalah lembar Google Sheet bantuan (`docs/bantuan.md`).
- **Paket gratis Supabase tidak punya backup otomatis.** Ekspor data rutin (misalnya CSV dari dashboard) menjadi tugas adik ketua; cara dan jadwalnya dibahas di sesi kode. Hasil ekspor memuat data pelanggan, jadi **tidak masuk repo**.

## 5. Peta Dokumentasi

Pola: **satu fitur = satu dokumen md + satu dokumen tes** (hanya dilampirkan di sesi tes; dibuat belakangan, setelah kodenya jalan).

| Dokumen                    | Isi & Fungsi                                                                                     | Prefix ID sheet |
| :------------------------- | :----------------------------------------------------------------------------------------------- | :-------------- |
| **`docs/features.md`**     | Peta besar fitur, layar per peran, versi, peluncuran. Dibaca sekali untuk orientasi.             | LNC             |
| **`docs/fondasi.md`**      | Repo, Supabase, terbit online, PWA dasar, CLI, pagar anti-nyasar.                                | FND             |
| **`docs/desain.md`**       | Tema marun dan emas, navigasi per peran, komponen layar, logo HTML/CSS, keadaan khusus.          | DSN             |
| **`docs/home.md`**         | Kerangka utama tampilan aplikasi                                                                 | HOM             |
| **`docs/akun.md`**         | Daftar, login, tiga peran, profil, buku alamat, password, pembuatan akun staf.                   | AKN             |
| **`docs/menu.md`**         | Daftar menu, harga, Tersedia/Habis, dikelola owner.                                              | MNU             |
| **`docs/order.md`**        | Order customer, status, setuju/tolak, catatan berlapis, order wakil owner, pelanggan tanpa akun. | ORD             |
| **`docs/foto-bukti.md`**   | Foto bukti antar, kompres, penyimpanan, pembersihan 14 hari.                                     | FTO             |
| **`docs/notifikasi.md`**   | Push (VAPID), penyegaran data tanpa polling.                                                     | NTF             |
| **`docs/bantuan.md`**      | Layar Bantuan (tanya-jawab per peran), isi ditulis di Google Sheet, diimpor lewat SQL Editor.    | BTN             |
| **`docs/bonus.md`**        | Kandidat versi 2 dan 3 (belum berurutan).                                                        | BNS             |
| **`docs/[fitur]-test.md`** | Kasus uji per fitur (tanpa hasil dan bukti). Hanya dilampirkan di sesi tes.                      | —               |
| **`docs/database.md`**     | Skema Supabase, RLS, pengaturan, fungsi server, workflow SQL.                                    | —               |
| **`docs/security.md`**     | Aturan keamanan wajib dan tes keamanan SEC-01 dst.                                               | SEC             |

Tiap dokumen fitur memuat tabel keputusan bernomor, alur, **"aturan yang paling sering terlanggar"**, urutan pekerjaan (untuk TODO sheet), dan ditunda. Daftar pekerjaan ada di Google Sheet tim (ringkasan, tanpa catatan dari sesi kode), bukan di repo. **Lembar isi bantuan** (`bantuan-isi.xlsx`, rincian di `docs/bantuan.md`) adalah Google Sheet **terpisah** dari sheet TODO; ia bukan tempat catatan sesi kode dan tidak memuat data pelanggan.

## 6. Struktur Repo

```text
/AGENTS.md
/.gitignore                    (wajib memuat supabase/.temp dan berkas rahasia)
/.github/workflows/pages.yml   (penerbitan folder public/ ke GitHub Pages)
/public            (root web; semua file aplikasi)
├── index.html, manifest.json, sw.js, config.js
├── style.css      (CSS terpusat semua layar, ditulis sendiri, tanpa CDN)
├── *.js           (satu fitur = satu berkas kecil, usahakan di bawah ~500 baris)
├── lib/           (salinan pustaka pihak ketiga, versi dipatok)
└── img/           (ikon dan aset gambar)
/docs              (md fitur, database, security, tes)
/supabase          (salinan SQL dan Edge Function)
├── migrations/    (SQL tabel dan fungsi, berurutan, dijalankan manual)
├── templates/     (SQL yang dijalankan berulang dengan mengisi isian, tanpa data nyata)
└── functions/     (kode Edge Function, satu subfolder per fungsi: kedai, bersihkan)
```

## 7. Larangan Khusus (Keamanan)

- **Tabel tertutup total untuk aplikasi.** RLS aktif tanpa policy untuk aplikasi. Semua akses lewat Edge Function (kunci secret yang masuk sebagai role `service_role`, hak per tabel seminimal mungkin, **tanpa DELETE**; satu-satunya pengecualian adalah pembersihan foto bukti, lihat `docs/foto-bukti.md`). Jangan membuat aturan RLS yang rumit.
- **Peran (customer, owner, penjaga) ditentukan server** dari tabel `staf` (ada baris = staf, tidak ada = customer). Aplikasi tidak pernah mengirim peran. Tabel `staf` hanya diubah ketua lewat SQL Editor.
- **Logika dihitung di server**, dalam fungsi SQL (`SECURITY DEFINER`, `search_path` kosong, skema `public.` eksplisit, `EXECUTE` hanya untuk `service_role`) yang bekerja **atomik**: cek menu, hitung harga, simpan order, setujui, ubah status, tambah catatan. Tidak ada tulis-database yang dikendalikan langsung oleh frontend atau dipecah di Edge Function.
- **Aplikasi tidak pernah mengirim** harga, total, status akhir, peran, atau metode bayar yang tidak dipilih owner. Aplikasi hanya mengirim aksi dan pilihan (misal id menu dan jumlah). Identitas pengguna **selalu dibaca di server dari token login**.
- **Waktu hanya dari jam server database** (`now()`, zona WIB). "Hari ini" dan "Besok" dihitung server. Jam HP tidak dipakai.
- **Pengecekan akses Edge Function berbeda per fungsi (keputusan ketua, 5 Nov 2026). Jangan diseragamkan.** `kedai` di-deploy **tanpa** `--no-verify-jwt`: pengecekan token login bawaan platform menjadi lapis pertama, dan fungsi **tetap memverifikasi token login sendiri paling awal** sebagai lapis kedua (tanpa token atau token tidak valid: 401); lapis kedua juga menolak token yang lolos platform tetapi bukan token pengguna login (misalnya JWT kunci `anon` lama). `bersihkan` di-deploy **dengan** `--no-verify-jwt` dan memverifikasi **rahasia penjadwal** sendiri paling awal; itu satu-satunya pagarnya, jadi pengecekannya tidak boleh dilonggarkan (misalnya hanya mengecek header ada atau tidak). Kunci Supabase (publishable dan secret) bukan JWT: dikirim lewat header `apikey`; `Authorization: Bearer` hanya untuk token login pengguna. **Jangan mengubah `bersihkan` agar menerima kunci Supabase lewat `Authorization`**: kunci baru bukan JWT dan ditolak pengecekan platform, karena itu penjadwal memakai **rahasia penjadwal sendiri**. Bila uji pertama `kedai` menunjukkan platform menolak token login asli (SEC-33), **jangan diam-diam menambah `--no-verify-jwt` ke `kedai`**: laporkan ke ketua; rencana mundur ada di `security.md` aturan 3.
- **Jangan jalankan migration CLI.** SQL dijalankan manual di SQL Editor, lalu salinannya disimpan di `supabase/migrations/`. **Satu pengecualian:** SQL impor isi bantuan adalah data (bukan skema) dan sering berubah, jadi **tidak disimpan di repo**; lembar Google Sheet bantuan adalah sumber dan cadangannya (`docs/bantuan.md` BT7). Skema tabel `bantuan` tetap lewat migration seperti biasa.
- **Rahasia:** kunci **secret** Supabase (`sb_secret_...`), kunci privat VAPID, rahasia penjadwal pembersihan, app password Gmail, **token akses Supabase CLI**, dan password hanya di dashboard atau di Mac tim. **Repo ini public.** Dilarang menaruh rahasia di repo, kode, md, atau chat. Hanya URL project, kunci **publishable** Supabase (`sb_publishable_...`), dan **kunci publik VAPID** yang boleh ada di `public/config.js`. Kunci secret hanya dibaca `kedai` dari variabel lingkungan fungsi, tidak pernah ditulis di kode dan tidak pernah ada di `public/`. Email commit memakai alamat noreply GitHub. Cek `git status` sebelum `git add .`.
- **Data pribadi nyata tidak masuk repo, md, atau chat:** nomor WA, alamat, nama dan email customer atau staf. Contoh dan data uji pakai dummy.
- Perubahan pada tabel, fungsi, atau pengaturan yang **sudah ada**, dan penghapusan data, wajib dijelaskan dampaknya dulu dan menunggu "OK".
- Semua teks dari server dan input pengguna (nama, keterangan, alamat, catatan, alasan tolak) lewat `textContent`, bukan `innerHTML`. Galat mentah tidak ditampilkan ke layar.
- Alamat GitHub Pages didaftarkan di URL Auth Supabase (Site URL dan Redirect URLs).
- "Confirm email" di Supabase **dimatikan**. Jangan diaktifkan kembali tanpa keputusan baru.
- Jangan ubah `sw.js`, `pages.yml`, login, atau `config.js` tanpa alasan dan konfirmasi "OK". **Tiap berkas aplikasi baru di `public/` (JS, `style.css`, pustaka di `lib/`, ikon) wajib didaftarkan di daftar cache `sw.js`** (agar aplikasi tetap terbuka offline); mengubah `sw.js` tetap butuh "OK".
- Teks notifikasi push **tidak boleh memuat data pribadi** (nama, alamat, nomor WA); cukup teks umum.

## 8. Aturan Anti-Nyasar (Mac Bersama)

Laptop Mac yang dipakai adalah milik adik ketua dan **sudah login ke akun GitHub dan Supabase milik adik**. Akun proyek ChATA milik ketua. Tidak boleh tercampur. AI tidak boleh memberi perintah push atau deploy tanpa urutan ini.

**Git (push ke GitHub):**

1. Repo ChATA ada di **folder terpisah** dari repo adik. Nama dan email commit diatur **khusus di repo ChATA** (bukan global), memakai email noreply GitHub **milik ketua**.
2. Cara masuk ke GitHub memakai **kunci SSH khusus proyek ini** (atau cara lain yang dipandu AI), bukan login adik yang tersimpan di laptop.
3. **Sebelum setiap push**, cek tiga hal dan tempel hasilnya ke chat: folder yang aktif, alamat tujuan (`git remote -v`), dan email commit terakhir. Semuanya harus milik ketua. Salah satu tidak cocok: **berhenti, jangan push.**

**Deploy fungsi (Supabase):** dilarang `supabase login`, `supabase projects list`, `supabase link`, dan `brew upgrade`. Urutan, satu langkah per giliran, dari folder repo ChATA:

1. Ambil kode project: `PROJECT_REF=$(grep -o '[a-z0-9]*\.supabase\.co' public/config.js | cut -d. -f1)`, lalu cek hasilnya sama dengan project ChATA di dashboard.
2. Ketua menempel **token akses milik akun Supabase ketua** dari penyimpanan amannya, hanya di satu jendela Terminal, tanpa tampil di layar: `read -rs "SUPABASE_ACCESS_TOKEN?Tempel token lalu tekan Enter: "; export SUPABASE_ACCESS_TOKEN; echo`. Token **tidak boleh** ditempel ke chat, repo, atau md.
3. Deploy: `supabase functions deploy kedai --use-api --project-ref "$PROJECT_REF"`, atau `supabase functions deploy bersihkan --use-api --no-verify-jwt --project-ref "$PROJECT_REF"` (flag sengaja beda, bagian 7). Wajib memakai `--project-ref`. Karena tokennya milik ketua, project adik tidak bisa kena walau salah ketik.
4. Tutup jendela Terminal, lalu cek di jendela baru: `echo "[${SUPABASE_ACCESS_TOKEN:+ada}]"` harus menampilkan `[]`.

**Browser:** dashboard Supabase dan GitHub milik ketua dibuka di **profil browser terpisah atau jendela privat**. Setelah selesai, **keluar (logout)** dan tutup. Jangan membiarkan sesi ketua terbuka di laptop bersama.

## 9. Cara Memandu (Pengguna Bukan Programmer)

1. Anggap yang mengobrol **bukan programmer**. Bahasa sehari-hari; jelaskan istilah teknis sekali dengan perumpamaan singkat.
2. **Satu langkah per giliran.** Tunggu hasilnya (ditempel atau di-screenshot) sebelum lanjut.
3. Tiap langkah sebutkan: buka apa, klik atau ketik apa, hasil yang benar seperti apa, dan apa yang perlu ditempel balik ke chat.
4. Sebelum mengubah apa pun, jelaskan apa yang berubah dan apakah bisa dibatalkan.
5. Kalau ada yang ambigu, **tanya dulu**. Jangan menebak. **Tampilan GitHub dan Supabase sering berubah**: bila layar yang dilihat user beda dari yang diharapkan, minta screenshot, jangan mengarang nama menu.
6. Semua setup awal (akun, email noreply GitHub, git, SSH, Supabase, token, SMTP, VAPID) **dipandu penuh**, bukan diasumsikan sudah dipahami.
7. Langkah di dashboard Supabase (SQL Editor, Edge Functions, Authentication) dikerjakan dari akun Supabase **ketua** di Mac bersama, di profil browser terpisah (bagian 8).
8. Setelah copas: nama file dan lokasi benar, isi lama benar-benar tergantikan, aplikasi terbuka di browser tanpa error.

## 10. Aturan Pengetesan

Tes dilakukan langsung di production dengan **akun, nomor WA, dan alamat dummy**.

1. **Low-Risk** (tampilan, layout, CSS, teks): cukup _visual sanity check_. Bila ada glitch kecil, langsung perbaiki. Test UI tidak harus menempel bukti tangkapan layar, cukup konfirmasi hasilnya
2. **High-Risk** (login, peran, RLS, fungsi SQL, Edge Function, order, setuju/tolak, catatan, foto, push, pembersihan, `sw.js`): tes teliti dan terstruktur. Keamanan dan data pelanggan **wajib ada bukti** (hasil query atau balasan server); tanpa bukti jangan diberi lulus. **Bukti diperiksa bersama di chat saat sesi tes lalu tidak disimpan**: tidak masuk md, repo, atau tempat lain (menjaga md tetap ramping dan bebas data pribadi).
3. **Prioritas temuan:** P0 (data pelanggan, login, peran, keamanan, harga, status order) wajib dites dan langsung dilaporkan bila gagal. P1 (fitur pendukung) dilaporkan satu baris. P2 (tampilan, teks) dites sekilas. Ragu yang menyangkut data atau akses akun: anggap P0.
4. **Tes awal ringan:** satu akun per peran (customer, owner, penjaga) sudah cukup; tambah satu customer kedua untuk tes "tidak bisa melihat milik orang lain".
5. **Cek kuota di akhir:** perkirakan panggilan per hari terhadap batas free tier, lalu uji beberapa HP bersamaan.
6. Tes PWA: setelah update, versi baru muncul di HP (network first), dan aplikasi tetap terbuka offline (login dan aksi tetap butuh internet).
7. **Push dites di Android.** iPhone jarang dipakai di lingkungan ini dan tidak ada perangkat uji; batasannya (iOS 16.4 ke atas, harus dipasang ke layar utama) hanya dicatat. Di luar itu iPhone **diasumsikan jalan**; keluhan pengguna iPhone ditampung dan dihitung jumlahnya di review pemakaian (`LNC.05`).

## 11. Pola Sesi

- **Sesi strategi = tanya jawab singkat, belum coding.** Satu pertanyaan per giliran dengan opsi dan rekomendasi; ringkasan pendek. Hasil akhirnya dikirim sekali sebagai md final. Hanya dipakai bila ada fitur baru yang belum punya dokumen.
- **Sesi kode:** lampirkan `AGENTS.md` + dokumen fitur terkait (+ `database.md` dan `security.md` bila menyentuh tabel, fungsi, atau aturan akses) + file terbaru yang relevan. Kerjakan langkah dari bagian "Urutan pekerjaan" dokumen fitur. Tes: tambah dokumen tes. Handoff hanya bila diminta.
- Awal sesi, AI membaca: `AGENTS.md`, dokumen fitur, lalu catatan susulan dan handoff paling akhir.
- Satu giliran = satu tugas kecil dan 1 sampai 3 file.

## 12. Catatan Susulan (append-only, hanya di sesi kode)

> Tempel blok baru di bawah garis ini. Format: `### YYYY-MM-DD: topik`. Yang paling akhir menang.

---

### 2026-11-09: Kode baru `kedai` di berkas terpisah

Keputusan ketua (sesi ORD.07). Alasan: `supabase/functions/kedai/index.ts` sudah sangat panjang (lebih dari 1300 baris), dan tiap sesi kode harus menempel berkasnya utuh.

- **Mulai ORD.07, aksi baru `kedai` ditaruh di berkas baru** di `supabase/functions/kedai/` (satu berkas per fitur atau kelompok aksi), bukan ditambahkan ke `index.ts`. `index.ts` hanya menerima satu import, sambungan alat bantu, dan `case` baru.
- **Alat bantu diberikan lewat parameter**, bukan diimpor dari `index.ts` (yang langsung menjalankan server): klien database, `bacaPeran`, `balas`, `galat`, `galatDariDb`, `REGEX_UUID`, `BATAS_TEKS`. Contoh yang sudah jalan: `buatAksiOrderStatus(alat)` di `order_status.ts`.
- **Kode lama tidak dipindah** dan tidak ada refactor yang direncanakan. Bila nanti diputuskan memecah kode lama, itu butuh penjelasan dampak dan "OK" ketua (aturan 2 dan 5).
- `kedai` tetap **satu fungsi** (bagian 3: dua fungsi saja). Deploy tetap satu perintah (bagian 8) dan membawa semua berkas di folder; terbukti jalan pada 9 Nov 2026. Berkas baru ikut masuk commit yang sama dengan `index.ts` dan fungsi SQL-nya.
- Sesi kode `kedai` melampirkan `index.ts` dan berkas kelompok yang relevan. Sesuai aturan 3, berkas yang berubah dikirim **utuh**.

---

### 2026-11-09: Layar loncat ke atas di detail order owner (bahan belajar)

Kejadian di lapangan, ketemu saat tes ORD.10. Penempatan blok ini di `AGENTS.md` (bukan `docs/order.md`) atas permintaan penguji, supaya terbawa ke semua sesi.

- **Apa yang rusak:** di layar owner (Order Masuk dan Semua Order), tiap aksi di bagian bawah detail order (Setuju, Tolak, tombol status, kirim catatan kosong) membuat layar loncat ke atas. Baru terasa setelah kartu Catatan dan form Tambah catatan membuat halaman detail panjang; tes sebelumnya lolos karena halamannya pendek.
- **Penyebab:** `renderDetail()` di `orderowner.js` mengosongkan seluruh isi detail lalu menggambarnya ulang, dan dipanggil tiap aksi (sebelum permintaan berangkat dan sesudah detail dimuat ulang). Gulungan layar tertarik ke atas.
- **Perbaikan:** `renderDetail()` kini membungkus `gambarDetail()` (isi lama, hanya ganti nama) dan mengembalikan posisi gulung (`orderowner.js`). Kolom kosong di form catatan owner kini memasang pesan galat di tempat, tanpa gambar ulang (`orderownercatatan.js`). Terbukti lewat layar dengan akun dummy: Setuju, Tolak, Kembali ke daftar, maju dan mundur status, kirim catatan.
- **Pencegahan:** layar yang menggambar ulang dengan mengosongkan wadah wajib menjaga posisi gulung. Tes aksi di bagian bawah halaman yang panjang, bukan hanya di bagian atas.
- **Layar penjaga (`orderpenjaga.js`) sudah dites di ORD.14 dan lulus**

### 2026-11-10: Dokumen `gim.md` (prefix GIM) dan pengecualian CSS game

Keputusan ketua (diwakili adik ketua di sesi strategi). Sumber: docs/gim.md.

- **Peta Dokumentasi (bagian 5):** tambah baris `docs/gim.md`, isi: "Menu hamburger dan game Arithmetics (murni di HP, skor di localStorage)", prefix sheet **GIM**.
- **Bagian 3 dan 6, pengecualian CSS:** gaya hamburger dan game ada di **`public/game.css`** (kelas berawalan `gim-`), dimuat setelah `style.css`. Pengecualian khusus game dari aturan "semua gaya di satu `style.css`"; layar lain tetap di `style.css`. `game.css` dan berkas JS game wajib didaftarkan di cache `sw.js` (aturan bagian 7; butuh "OK").
- **Game tidak memanggil server** dan tidak memakai kode leaderboard Firebase dari proyek lama. Data tersimpan hanya level tertinggi di `localStorage` (kunci `chata_game_arithmetics_best`).
- **Pengecualian "angka di database" (bagian 1):** angka timer game tetap di kode game karena game tanpa server.

<!-- Berkas tujuan: AGENTS.md, tempel PALING BAWAH bagian 12 (di bawah blok 2026-11-10 gim). Append-only. -->

### 2026-11-10: Berkas kerja `docs/pemetaan-test.md` (tes tidak diulang, AI yang mengingatkan centang)

Keputusan ketua (10 Nov 2026). Alasan ketua: tes yang sudah lulus jangan diulang di sesi lain, dan manusia tidak akan ingat baris SEC mana yang sudah boleh dicentang, jadi AI yang mengingatkan.

- **`docs/pemetaan-test.md` adalah berkas kerja**, bukan dokumen fitur dan tidak masuk tabel Peta Dokumentasi (bagian 5). Isinya peta tes ORD.14 ke baris SEC beserta status, dan log status append-only.
- **Sesi tes melampirkan berkas ini** bersama `AGENTS.md`, `order.md`, dan `security.md` (menambah bagian 11, pola sesi kode).
- **Kewajiban AI di sesi tes:** di awal sesi menyebut apa yang sudah terbukti (jangan diulang) dan sisa tes; tiap selesai satu tes menyebut baris SEC yang kini lengkap ("butir SEC-NN sudah selesai, silakan dicentang di sheet", sesuai aturan 8) atau aksi apa yang masih kurang; di akhir sesi menawarkan Handoff dan satu blok log untuk berkas itu.
- **Tanda ✅ di berkas itu berarti tes tidak perlu diulang, bukan berarti SEC boleh dicentang.** Centang hanya bila semua aksi di baris SEC terbukti dan jenis buktinya sesuai kolom Catatan sheet (aturan 10: tanpa bukti jangan diberi lulus).
- **Bukti tetap tidak disimpan** (bagian 10 butir 2). Berkas itu hanya menyimpan status, tanpa bukti dan tanpa data pelanggan.
- Sheet tetap tidak dibagi ke AI dan tidak menerima catatan dari AI (aturan 3 dan 8): kolom Catatan baris SEC diisi manusia.

### 2026-11-11: Dokumen `inbox.md` (prefix INB), satu pengecualian tulis-database, urutan versi 1

Keputusan ketua (sesi strategi 11 Nov 2026). Sumber: docs/inbox.md.

- **Peta Dokumentasi (bagian 5):** tambah baris `docs/inbox.md`, isi: "Kotak masuk: jalur kabar cadangan tanpa push, titik merah di hamburger", prefix sheet **INB**.
- **Pengecualian aturan "tidak ada tulis-database yang dipecah di Edge Function" (bagian 7):** **hanya untuk fungsi SQL `inbox_tulis`**, yang dipanggil `kedai` setelah aksi order berhasil. Kegagalannya **tidak membatalkan aksi**. Alasan ketua: inbox bukan inti sistem, boleh gagal asal tidak mengganggu order. **Tidak berlaku untuk aksi lain**; order, setujui, status, catatan, dan lainnya tetap atomik di fungsi SQL.
- **"Tanpa DELETE" tetap utuh.** Pengecualian DELETE tetap satu (foto bukti, bagian 7). Tabel inbox **dibersihkan manual oleh ketua** lewat dashboard dengan SQL template di `supabase/templates/`; tidak ada pengecualian baru. Lama tampil 14 hari ada di `pengaturan` (`inbox_simpan_hari`).
- **Data di HP:** hanya satu angka penanda dibaca per akun di `localStorage` (tanpa data pribadi). Isi inbox tidak disimpan di HP.
- **Urutan versi 1:** Foto Bukti, lalu Inbox, lalu Notifikasi (push). Berkas JS dan CSS baru wajib didaftarkan di cache `sw.js` (bagian 7, butuh "OK").
- **Bagian 4 (pengingat rutin):** pengingat kalender yang sudah ada (buka dashboard agar project tidak dijeda, ekspor data) ditambah satu urusan: hapus inbox lama.
- **Kode baru `kedai`:** aksi inbox di berkas baru `inbox.ts` (mengikuti blok 9 Nov 2026).

### 2026-11-12: Aturan `[skip ci]` pada pesan commit

Keputusan ketua (disampaikan lewat PIC, sesi NTF.04a). Alasan ketua selain yang tertulis di bawah belum tercatat.

- **`[skip ci]` hanya untuk commit yang cuma mengubah docs/md** (misalnya update catatan atau handoff setelah sesi selesai), supaya tidak memicu penerbitan GitHub Pages yang tidak perlu.
- **Commit yang menyentuh kode atau berkas aplikasi tidak memakai `[skip ci]`**: semua berkas di `public/` (termasuk `sw.js`), `supabase/`, dan `.github/`. Commit seperti itu harus memicu penerbitan normal.
- Bila satu commit memuat docs **dan** kode, **jangan** pakai `[skip ci]`.
- **AI tidak menambahkan `[skip ci]` sendiri** pada pesan commit yang disarankan. AI hanya menyarankannya bila seluruh isi commit adalah docs/md, dan menyebut alasannya.
- Kejadian pemicu: pada sesi NTF.04a, pesan commit berisi kode sempat disarankan dengan `[skip ci]` karena meniru commit docs sebelumnya. Belum sempat di-push, jadi pesannya diganti dengan `git commit --amend` tanpa dampak.

### 2026-11-13: Pengecualian tulis-database diperluas untuk catatan hasil push

Keputusan ketua (sesi NTF.06, 13 Nov 2026). Alasan ketua selain yang tertulis di bawah belum tercatat.

- Pengecualian blok 11 Nov 2026 (hanya `inbox_tulis`) **diperluas satu fungsi: `push_hasil_catat`**, yang dipanggil `kedai` setelah push terkirim untuk menandai langganan mati (`aktif` jadi false, tanpa DELETE) dan mengisi `terakhir_berhasil_pada`. Kegagalannya **tidak membatalkan aksi order** (NT4). Alasan: sama dengan inbox, push bukan inti sistem.
- **Tidak berlaku untuk aksi lain.** Order, setujui, status, catatan, dan lainnya tetap atomik di fungsi SQL.
- `inbox_tulis` kini mengembalikan daftar penerima (bukan jumlah baris) supaya penerima push tidak dihitung dua kali (IB14). Aturan penerimanya tidak berubah. Sumber: `supabase/migrations/20261113_inbox_tulis_penerima.sql`.

---
