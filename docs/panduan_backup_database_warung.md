# Panduan Backup Supabase (Warung PWA)

> **Cara pakai:** upload file ini ke Claude, lalu bilang: "Ikuti panduan ini, kita backup lagi."
> Terakhir diupdate: 19 November 2026 (backup pertama, sebelum rilis).

---

## 0. Instruksi buat Claude (baca dulu)

- Bahasa santai (gw/lu), singkat, step by step.
- User **bukan orang IT**. Utamakan **GUI (DBeaver)**. Terminal hanya untuk copas perintah sekali jalan (cek hasil).
- **Jangan menebak tampilan layar.** Minta screenshot, lalu jawab berdasarkan screenshot itu.
- Jangan minta atau menampilkan password, secret Vault, atau isi data user di chat.
- Setelah tiap langkah, minta konfirmasi/screenshot sebelum lanjut.
- Bandingkan hasil verifikasi dengan angka di bagian "Angka acuan". Kalau beda, tanya apakah memang ada perubahan struktur.

---

## 1. Gambaran sistem

- Aplikasi PWA untuk warung, backend Supabase **free tier**, Postgres **17.x**.
- Akses data lewat **RPC (57 function)**. **RLS aktif di tiap tabel tapi tidak ada policy** dan **tidak ada trigger** (sengaja/memang begitu). Jangan menganggap ini backup yang hilang.
- Schema yang dibackup: `public` (utama) dan `auth` (data user).
- Schema yang **tidak** dibackup: `storage`, `realtime`, `extensions`, `vault`, `cron`, `net`, `graphql`, `graphql_public`, `pgbouncer` (dikelola Supabase, bikin konflik saat restore).

## 2. Setup di laptop (sudah dilakukan, cek saja)

- Mac Apple Silicon (M1).
- **DBeaver Community** terinstal.
- **Postgres.app v18** ada di `/Applications/Postgres.app` (hanya dipinjam `pg_dump`-nya, **tidak perlu dijalankan**, jangan klik Initialize).
- Di DBeaver, Local Client otomatis menunjuk ke `/Applications/Postgres.app/Contents/Versions/18`. Versi pg_dump harus **sama atau lebih tinggi dari 17**.
- Homebrew `libpq` **tidak dipakai** (gagal compile lama, dibatalkan).

## 3. Detail koneksi (pakai Session pooler, bukan Direct)

Direct connection hanya IPv6 dan sering gagal di Indonesia. Pakai **Session pooler**.

| Kolom    | Isi                                                                                                                          |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Host     | `aws-0-ap-southeast-1.pooler.supabase.com`                                                                                   |
| Port     | `5432` (session mode; **jangan 6543**)                                                                                       |
| Database | `postgres`                                                                                                                   |
| Username | `postgres.<project-ref>` (lihat di dashboard Supabase → Connect → Session pooler)                                            |
| Password | **Database password** (BUKAN password login dashboard Supabase). Simpan di password manager, **jangan ditulis di file ini**. |

Kalau lupa: dashboard Supabase → Project Settings → Database → Reset database password (pakai huruf dan angka saja, 20 karakter). Cek dulu ke abang apakah ada script/server yang memakai password itu sebelum reset.

Koneksi sudah tersimpan di DBeaver. Tinggal klik kanan koneksi → **Connect**.

## 4. Langkah backup

Folder output: `/Users/ronycah/Documents/BckDBWARUNG`

### A. Backup schema `public` (struktur + RPC + RLS + data)

1. Klik kanan database **postgres** → **Tools → Backup** (bukan Global Backup).
2. Centang **hanya `public`**. Centang **Show views**. Jangan centang "Complete backup".
3. Next. Pengaturan:
   - Format: **Plain**
   - Centang **Do not backup privileges (GRANT/REVOKE)**
   - Centang **Discard objects owner**
   - Compression, Encoding, "Use SQL INSERT", "Add drop/create database" dikosongkan
   - File name pattern: `dump-public-${timestamp}.sql`
   - Extra command args: kosong
4. Cek tombol **Local Client** menunjuk ke Postgres.app versi 18.
5. **Start**. Tunggu notifikasi "PostgreSQL dump task completed".

### B. Backup schema `auth` (data user login)

1. Tools → Backup lagi. Centang **hanya `auth`** (pastikan `public` tidak ikut tercentang, DBeaver kadang mengingat pilihan lama).
2. Pengaturan sama seperti di atas, tapi:
   - File name pattern: `dump-auth-${timestamp}.sql`
   - **Extra command args:** `--data-only`
3. **Start**.

## 5. Verifikasi (copas di Terminal, hanya membaca file)

Ganti nama file sesuai hasil backup.

```bash
# Jumlah function/RPC (acuan: 57)
grep -c "CREATE FUNCTION" ~/Documents/BckDBWARUNG/dump-public-*.sql

# Jumlah tabel yang ada datanya (acuan: 21)
grep -c "^COPY public" ~/Documents/BckDBWARUNG/dump-public-*.sql

# Daftar nama tabel yang datanya ikut
grep "^COPY public" ~/Documents/BckDBWARUNG/dump-public-*.sql | cut -d' ' -f2

# RLS ikut? (harus ada baris)
grep -c "ENABLE ROW LEVEL SECURITY" ~/Documents/BckDBWARUNG/dump-public-*.sql

# auth: users dan identities ikut?
grep "^COPY auth.users\|^COPY auth.identities" ~/Documents/BckDBWARUNG/dump-auth-*.sql | cut -c1-40
```

Cocokkan juga dengan database (SQL Editor DBeaver):

```sql
-- jumlah tabel di public (acuan: 21)
select count(*) from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE';

-- jumlah function di public (acuan: 57)
select count(*) from information_schema.routines where routine_schema = 'public';

-- policy (acuan: kosong) dan trigger (acuan: kosong)
select schemaname, tablename, policyname from pg_policies where schemaname = 'public';
select event_object_table, trigger_name from information_schema.triggers where trigger_schema = 'public';
```

Cek jumlah user di dashboard Supabase → Authentication → Users, bandingkan dengan isi `COPY auth.users`.

## 6. Angka acuan (update kalau struktur berubah)

| Item                     | Nilai                      | Tanggal     |
| ------------------------ | -------------------------- | ----------- |
| Tabel di `public`        | 21 (semua berisi data)     | 19 Nov 2026 |
| Function/RPC di `public` | 57                         | 19 Nov 2026 |
| Policy RLS               | 0 (RLS aktif tanpa policy) | 19 Nov 2026 |
| Trigger                  | 0                          | 19 Nov 2026 |
| Ukuran dump `public`     | sekitar 253 KB             | 19 Nov 2026 |
| Versi Postgres Supabase  | 17.11                      | 19 Nov 2026 |

## 7. Yang TIDAK ikut backup database (urus terpisah)

1. **Storage (file/foto):** belum ada isi per 19 Nov 2026. **Setelah app rilis, download rutin dari dashboard → Storage.** Catat juga konfigurasi bucket (nama, public/private, batas ukuran).
2. **Extension:** `pg_cron` dan `pg_net` harus diaktifkan manual di project baru. Yang lain (`plpgsql`, `pg_stat_statements`, `uuid-ossp`, `pgcrypto`, `supabase_vault`) sudah ada otomatis.
3. **Cron job:** `bersihkan-foto-mingguan`, jadwal `0 19 * * 6` (Minggu 02:00 WIB), memanggil Edge Function `bersihkan`. Definisi lengkap dicatat abang di md-nya.
4. **Vault secret:** `url_project_bersihkan` dan `rahasia_penjadwal_bersihkan`. Nilainya ada di backup abang/password manager, **bukan di file ini**. `url_project_bersihkan` harus diganti ke URL project baru kalau pindah project.
5. **Edge Functions:** kode `bersihkan` dan secret-nya harus ada di repo/backup abang.
6. **URL project dan anon key** untuk app PWA: simpan di tempat aman.

## 8. Urutan restore (kalau project hilang)

Tes dulu ke **project Supabase baru** (free tier boleh 2 project). Jangan pernah restore ke database yang sedang dipakai live.

1. Bikin project Supabase baru.
2. Aktifkan extension `pg_cron` dan `pg_net` (Database → Extensions).
3. Restore file `public` (struktur, 57 RPC, RLS, data).
4. Restore file `auth` (data user saja, `--data-only`). **Harus setelah** struktur ada.
5. Bikin ulang 2 secret Vault (URL pakai project baru).
6. Deploy ulang Edge Function `bersihkan` + secret-nya.
7. Bikin ulang cron job `bersihkan-foto-mingguan`.
8. Bikin ulang bucket Storage dan policy-nya, restore file jika ada.
9. Ganti URL dan anon key di app PWA.

## 9. Dampak ke aplikasi saat backup

- Backup bersifat **read-only**, data tidak berubah, app tetap jalan normal.
- Sedikit pakai CPU/koneksi. Session mode menahan 1 slot pooler selama DBeaver terkoneksi, jadi **Disconnect setelah selesai** (klik kanan koneksi → Disconnect).
- Backup di jam sepi. Jangan jalankan query berat bersamaan.
- Egress free tier 5 GB/bulan, backup kecil ini masih sangat aman.
- Free tier tidak punya backup otomatis yang bisa didownload, jadi **backup manual rutin penting**. Project yang idle 1 minggu bisa di-pause; kalau koneksi gagal tiba-tiba, cek dulu status project.

## 10. Keamanan file backup

- File `public` berisi data pelanggan/warung. File `auth` berisi **email dan password hash user**.
- Simpan di **2 tempat** (laptop + Google Drive), akses terbatas.
- **Jangan** taruh di GitHub (apalagi publik), dan jangan upload isinya ke chat.
- Beri tanggal di nama file, contoh: `backup-public-2026-11-19.sql`.

## 11. Jadwal backup

- [ ] Sehari sebelum rilis (target: minggu depan dari 19 Nov 2026)
- [ ] Rutin mingguan setelah rilis
- [ ] Setiap habis perubahan struktur besar (tabel/RPC baru)
- [ ] Setelah rilis: tambah backup Storage

## 12. Troubleshooting cepat

| Masalah                                    | Solusi                                                              |
| ------------------------------------------ | ------------------------------------------------------------------- |
| "Network is unreachable" / timeout         | Pastikan pakai Session pooler, bukan Direct                         |
| "too many clients" / "max clients reached" | Disconnect koneksi lain, ulangi di jam sepi                         |
| Error "version mismatch"                   | Local Client harus pg_dump versi 17 ke atas (sekarang 18, aman)     |
| Project tidak bisa diakses                 | Cek apakah project di-pause (idle 1 minggu), restore dari dashboard |
| Login gagal                                | Ingat: pakai database password, bukan password dashboard            |
| Backup `auth` gagal permission             | Kirim screenshot log ke Claude                                      |
