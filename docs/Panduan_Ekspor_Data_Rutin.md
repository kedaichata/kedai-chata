# Panduan Ekspor Data Rutin (DRAF v2)

> Status: **draf, menunggu review ketua.** Langkah klik, daftar tabel, nama berkas, dan cara cek diisi dari layar asli dashboard dan hasil ekspor percobaan 19 Nov 2026. Keputusan ketua (semua tabel dicatat, lembar catatan, jadwal Sabtu) sudah dimasukkan.
> Panduan ini tidak memuat data pelanggan, rahasia, atau alamat nyata. Tampilan dashboard bisa berubah; kalau yang di layar beda dari panduan, **berhenti dan tanya ketua**, jangan menebak.

## Tujuan

Paket gratis Supabase tidak punya backup otomatis (dashboard menampilkan "Last backup: No backups"). Ekspor rutin = cadangan **data** (isi tabel). Cadangan skema sudah ada di repo (`supabase/`).

## Sebelum mulai (pagar)

1. Buka dashboard Supabase di **profil browser terpisah atau jendela privat**. Login memakai akun **ketua**, bukan akun lain yang tersimpan di laptop.
2. Pastikan nama project yang terbuka adalah **kedaichata**, bukan project lain.
3. Siapkan folder tujuan **di luar folder repo** (bukan di dalam `CHATA/`). Contoh: `backup-CHATA`, sejajar dengan folder repo. Di dalamnya buat **subfolder bertanggal `YYYYMMDD`** untuk tiap set ekspor (mis. `20261119`). Nama berkas dari dashboard tidak memuat tanggal, jadi tanggal ada di nama subfolder.
4. Hasil ekspor memuat data pelanggan dan nomor WA. Jangan dibuka di spreadsheet kecuali terpaksa, dan kalau dibuka, **jangan disimpan ulang**.

## Daftar tabel (21 tabel di schema `public`)

Cek **semua** tabel tiap kali ekspor, karena tabel yang kosong hari ini bisa terisi besok:

- Pengaturan dan menu: `pengaturan`, `staf`, `menu`, `menu_grup`, `grup_pilihan`, `opsi_pilihan`
- Isi yang juga punya cadangan di lembar Google Sheet: `bantuan`, `gelar` (tetap diekspor, tidak ada ruginya)
- Data pelanggan dan transaksi: `order`, `order_item`, `riwayat_status`, `catatan_order`, `baca_catatan`, `belanja`, `belanja_item`, `profil`, `alamat`, `pelanggan_luar`
- Sementara atau mudah dibuat ulang: `inbox`, `foto_bukti`, `langganan_push`

**Aturan dari ketua (19 Nov 2026): semua tabel harus diekspor, dan dicatat dengan format lembar catatan (lihat bagian "Catatan tiap ekspor").** Artinya ketiga tabel di atas juga diekspor bila terisi. Tabel dengan **0 records tidak bisa diekspor** (dashboard menolak); itu bukan kegagalan, cukup dicatat `0` di lembar.

Contoh hasil 19 Nov 2026 (sebelum customer asli): 8 tabel berisi (`pengaturan` 22, `staf` 6, `menu` 38, `menu_grup` 20, `grup_pilihan` 7, `opsi_pilihan` 23, `bantuan` 80, `gelar` 9 baris) dan 13 tabel kosong.

## Langkah ekspor, per tabel

Dashboard mengekspor **satu tabel per satu kali**. Tidak ada tombol ekspor semua di toolbar tabel.

1. Di menu kiri klik **Table Editor**. Pilih tabel dari daftar di kiri.
2. Lihat bar di bawah tabel dan **catat angka "N records"**. Pastikan kolom pencarian di atas tabel kosong (kalau ada filter, angkanya bisa menyesatkan).
3. **Kalau N = 0:** jangan diekspor. Dashboard menolak dengan pesan "The table X has no rows to export"; itu bukan masalah. Catat `0` dan lanjut.
4. Kalau N lebih dari 0: klik **⋮** di baris tabel itu pada **daftar kiri**, arahkan ke **Export data**, lalu klik **Export table as CSV**.
   - **Delete table ada tepat di bawah Export data.** Baca label sebelum klik.
   - Jangan pilih **Export table as SQL** atau **Export table via CLI** (CLI tidak dipakai).
5. Berkas bernama `<nama_tabel>_rows.csv`. Pindahkan ke subfolder bertanggal di folder backup, dan **hapus salinan di folder unduhan browser**.
6. Ulangi untuk tabel berikutnya.

## Cek hasil (tanpa membuka isi berkas)

Di Terminal, dari folder yang membuat jalur `../backup-CHATA` benar (sesuaikan bila beda):

```
for f in ../backup-CHATA/YYYYMMDD/*.csv; do echo "$f: $(wc -l < "$f") baris, akhir: $(tail -c 1 "$f" | xxd -p)"; done
```

Cara membaca, dengan N = angka "N records" yang dicatat:

- Kalau karakter terakhir **bukan `0a`**, `wc -l` harus **N**.
- Kalau karakter terakhir **`0a`**, `wc -l` harus **N + 1**.

**Tabel dengan teks panjang berbaris banyak** (di hasil 19 Nov: `menu` dan `bantuan`) bisa memberi angka `wc -l` lebih besar dari N. Itu bukan berarti data hilang. Hitung dengan perintah ini (ganti nama tabel dan tanggal), hasilnya harus **N**:

```
python3 -c "import csv,sys; print(sys.argv[1], sum(1 for _ in csv.reader(open(sys.argv[1], newline='')))-1)" ../backup-CHATA/YYYYMMDD/menu_rows.csv
```

Kalau ada angka yang tidak cocok, **jangan lanjut**; catat dan kabari ketua. Cek ini membuktikan **jumlah baris**, bukan isi tiap sel.

## Yang jangan disentuh

- **Delete table**, tombol hapus atau kosongkan apa pun. Baca label sebelum klik.
- **Insert** (Insert row, Insert column, **Import data from CSV**): untuk memasukkan data, bukan mengekspor.
- **Add RLS policy**, pilihan **Role** (jangan ganti dari postgres), **Enable Realtime** (desain ChATA tanpa Realtime), **Enable Index Advisor**.
- **Add user** atau menghapus pengguna di Authentication.
- **SQL Editor**, kecuali ada langkah yang dipandu dan sudah disetujui ketua.

## Akun login (Authentication)

Daftar akun ada di **Authentication, Users** (saat ini 5 owner dan 1 penjaga). Email akun **hanya hidup di sana**, bukan di tabel yang diekspor. Toolbar halaman itu (cari, filter kolom, urutkan, Add user) **tidak menampilkan tombol ekspor**; belum ada cara ekspor yang terbukti. Dicatat sebagai risiko, kecil selama akun dibuat dari template AKN.10 dan orangnya diketahui. **Ditinjau lagi setelah customer asli mulai terdaftar.**

## Catatan tiap ekspor

Isi satu lembar catatan per ekspor dengan kolom: **Tgl, No, Nama Tabel, Jml Row di Tabel, Nama File, Catatan** (tabel kosong: file `-`, catatan "has no rows to export"). Lembar catatan ada di Google Drive ketua: file **chata**, tab **BackupChata**, dibagikan khusus ke yang mengerjakan ekspor. Lembar ini **hanya memuat nama tabel, jumlah baris, dan nama berkas**; jangan pernah menempel isi data pelanggan ke dalamnya.

## Setelah selesai

1. Jalankan cek hasil di atas, dan pastikan semua berkas ada di subfolder bertanggal di luar repo.
2. Pastikan tidak ada salinan di folder unduhan.
3. **Logout** dari dashboard dan tutup jendelanya.
4. Jangan tempel isi berkas ke chat, md, atau repo.

## Pengingat rutin lain (dari AGENTS.md bagian 4 dan catatan susulan)

- Buka dashboard rutin supaya project tidak dijeda (terutama saat libur sekolah atau warung tutup lebih dari beberapa hari).
- Hapus inbox lama (template di `supabase/templates/`, dijalankan ketua).
- Cek pemakaian: halaman usage organisasi (Edge Function terhadap 500.000 per bulan, database, egress). Log Query sudah melewati 100 GB di siklus ini tetapi dashboard menyatakan batas belum diberlakukan; buka halaman Logs dengan rentang waktu pendek. Dilakukan **seminggu sekali pada hari Sabtu**, bersamaan dengan ekspor (keputusan ketua).
- Cek penggunaan ngrok dan evaluasi fitur WA-notif (blok 14 Nov di AGENTS.md, bersama LNC.05).

## Jadwal

**Seminggu sekali, hari Sabtu** (ekspor data dan cek pemakaian dilakukan bersamaan). Tiap Sabtu buat subfolder baru bertanggal hari itu dan isi lembar catatan.
