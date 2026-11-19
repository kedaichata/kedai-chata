-- supabase/templates/20261119_order_data_uji_cek.sql
-- LNC.01e langkah 1: mendata isi tabel order dan turunannya (order_item, riwayat_status,
-- catatan_order, baca_catatan) serta pelanggan_luar sebelum dihapus. HANYA SELECT. Tidak mengubah apa pun.
-- Jalankan di SQL Editor (akun ketua), SATU BLOK per kali (blok A sampai H), lalu tempel hasilnya ke chat.
-- Tanpa data nyata di berkas ini. Hasil hanya memuat 8 karakter awal ID akun (tanpa nama, WA, atau alamat).
--
-- Asumsi nama kolom (dari migration di repo):
--   "order"(id, nomor, pemesan, pelanggan_luar_id, status, dibuat_oleh, pemutus, dibuat_pada, diubah_pada),
--   pelanggan_luar(id, aktif, dibuat_oleh, dibuat_pada), staf(id, peran, aktif, dibuat_pada),
--   profil(id, dibuat_pada)  <-- kolom dibuat_pada di profil BELUM dicek di berkas migration;
--   bila blok D galat "column does not exist", berhenti dan laporkan ke chat; jangan diubah sendiri.
--
-- Batas "akun asli dibuat 19 Nov 2026 00.00 WIB" dipakai sebagai penanda kecurigaan:
-- semua yang bertanggal sejak batas itu, atau berkaitan dengan staf yang dibuat sejak batas itu,
-- diperiksa lebih dulu. Hasil yang diharapkan untuk data uji murni: semua hitungan "sejak 19 Nov" = 0.

-- A. Jumlah baris per tabel (termasuk inbox dan foto_bukti, yang seharusnya sudah 0 sejak LNC.01d)
SELECT 'order' AS objek, count(*) AS jumlah FROM public."order"
UNION ALL SELECT 'order_item',     count(*) FROM public.order_item
UNION ALL SELECT 'riwayat_status', count(*) FROM public.riwayat_status
UNION ALL SELECT 'catatan_order',  count(*) FROM public.catatan_order
UNION ALL SELECT 'baca_catatan',   count(*) FROM public.baca_catatan
UNION ALL SELECT 'pelanggan_luar', count(*) FROM public.pelanggan_luar
UNION ALL SELECT 'inbox',          count(*) FROM public.inbox
UNION ALL SELECT 'foto_bukti',     count(*) FROM public.foto_bukti;

-- B. Semua kunci asing yang merujuk ke order dan pelanggan_luar (memastikan urutan hapus lengkap,
--    termasuk tabel yang mungkin belum kita ingat)
SELECT
  conrelid::regclass                 AS tabel_anak,
  conname                            AS nama_kunci,
  confrelid::regclass                AS merujuk_ke,
  pg_get_constraintdef(oid)          AS definisi
FROM pg_constraint
WHERE contype = 'f'
  AND confrelid IN ('public."order"'::regclass, 'public.pelanggan_luar'::regclass)
ORDER BY confrelid::regclass::text, conrelid::regclass::text;

-- C1. Rentang order dan penanda order sejak 19 Nov 2026 (WIB)
SELECT
  count(*)                                                                  AS total,
  min(nomor)                                                                AS nomor_terkecil,
  max(nomor)                                                                AS nomor_terbesar,
  min(dibuat_pada) AT TIME ZONE 'Asia/Jakarta'                              AS dibuat_paling_awal_wib,
  max(dibuat_pada) AT TIME ZONE 'Asia/Jakarta'                              AS dibuat_paling_akhir_wib,
  max(diubah_pada) AT TIME ZONE 'Asia/Jakarta'                              AS diubah_paling_akhir_wib,
  count(*) FILTER (WHERE dibuat_pada >= timestamptz '2026-11-19 00:00+07')  AS dibuat_sejak_19_nov,
  count(*) FILTER (WHERE diubah_pada >= timestamptz '2026-11-19 00:00+07')  AS diubah_sejak_19_nov,
  count(*) FILTER (WHERE pelanggan_luar_id IS NOT NULL)                     AS order_wakil,
  count(DISTINCT pemesan)                                                   AS akun_pemesan_berbeda
FROM public."order";

-- C2. Order per status
SELECT status, count(*) AS jumlah
FROM public."order"
GROUP BY status
ORDER BY count(*) DESC;

-- D. Order per akun customer pemesan: kapan profilnya dibuat, apakah juga terdaftar sebagai staf,
--    jumlah order, order Selesai, rentang waktu
SELECT
  left(o.pemesan::text, 8)                              AS akun,
  p.dibuat_pada AT TIME ZONE 'Asia/Jakarta'             AS profil_dibuat_wib,
  (s.id IS NOT NULL)                                    AS juga_staf,
  count(*)                                              AS jumlah_order,
  count(*) FILTER (WHERE o.status = 'Selesai')          AS selesai,
  min(o.dibuat_pada) AT TIME ZONE 'Asia/Jakarta'        AS paling_awal_wib,
  max(o.dibuat_pada) AT TIME ZONE 'Asia/Jakarta'        AS paling_akhir_wib
FROM public."order" o
JOIN public.profil p ON p.id = o.pemesan
LEFT JOIN public.staf s ON s.id = o.pemesan
WHERE o.pemesan IS NOT NULL
GROUP BY o.pemesan, p.dibuat_pada, s.id
ORDER BY min(o.dibuat_pada);

-- E. Pelanggan tanpa akun: aktif atau tidak, siapa pembuatnya (staf apa, dibuat kapan), dibuat kapan,
--    berapa order terkait
SELECT
  left(pl.id::text, 8)                                  AS pelanggan,
  pl.aktif,
  left(pl.dibuat_oleh::text, 8)                         AS pembuat,
  s.peran                                               AS peran_pembuat,
  s.dibuat_pada AT TIME ZONE 'Asia/Jakarta'             AS pembuat_dibuat_wib,
  pl.dibuat_pada AT TIME ZONE 'Asia/Jakarta'            AS dibuat_wib,
  (SELECT count(*) FROM public."order" o WHERE o.pelanggan_luar_id = pl.id) AS order_terkait
FROM public.pelanggan_luar pl
LEFT JOIN public.staf s ON s.id = pl.dibuat_oleh
ORDER BY pl.dibuat_pada;

-- F. Order wakil per owner pembuat
SELECT
  left(o.dibuat_oleh::text, 8)                          AS pembuat,
  s.peran,
  s.aktif                                               AS staf_aktif,
  s.dibuat_pada AT TIME ZONE 'Asia/Jakarta'             AS staf_dibuat_wib,
  count(*)                                              AS order_wakil
FROM public."order" o
JOIN public.staf s ON s.id = o.dibuat_oleh
WHERE o.pelanggan_luar_id IS NOT NULL
GROUP BY o.dibuat_oleh, s.peran, s.aktif, s.dibuat_pada
ORDER BY min(o.dibuat_pada);

-- G. Jejak akun staf ASLI (dibuat sejak 19 Nov 2026) dan aktivitas sejak 19 Nov di tabel anak.
--    Untuk data uji murni, SEMUA baris di bawah harus 0.
SELECT 'riwayat_status oleh staf asli' AS pemeriksaan, count(*) AS jumlah
FROM public.riwayat_status r JOIN public.staf s ON s.id = r.oleh
WHERE s.dibuat_pada >= timestamptz '2026-11-19 00:00+07'
UNION ALL
SELECT 'catatan_order oleh staf asli', count(*)
FROM public.catatan_order c JOIN public.staf s ON s.id = c.penulis
WHERE s.dibuat_pada >= timestamptz '2026-11-19 00:00+07'
UNION ALL
SELECT 'baca_catatan oleh staf asli', count(*)
FROM public.baca_catatan b JOIN public.staf s ON s.id = b.akun
WHERE s.dibuat_pada >= timestamptz '2026-11-19 00:00+07'
UNION ALL
SELECT 'order: pemutus staf asli', count(*)
FROM public."order" o JOIN public.staf s ON s.id = o.pemutus
WHERE s.dibuat_pada >= timestamptz '2026-11-19 00:00+07'
UNION ALL
SELECT 'order: pembuat wakil staf asli', count(*)
FROM public."order" o JOIN public.staf s ON s.id = o.dibuat_oleh
WHERE s.dibuat_pada >= timestamptz '2026-11-19 00:00+07'
UNION ALL
SELECT 'pelanggan_luar: pembuat staf asli', count(*)
FROM public.pelanggan_luar pl JOIN public.staf s ON s.id = pl.dibuat_oleh
WHERE s.dibuat_pada >= timestamptz '2026-11-19 00:00+07'
UNION ALL
SELECT 'riwayat_status sejak 19 Nov', count(*)
FROM public.riwayat_status WHERE waktu >= timestamptz '2026-11-19 00:00+07'
UNION ALL
SELECT 'catatan_order sejak 19 Nov', count(*)
FROM public.catatan_order WHERE waktu >= timestamptz '2026-11-19 00:00+07'
UNION ALL
SELECT 'baca_catatan sejak 19 Nov', count(*)
FROM public.baca_catatan WHERE waktu >= timestamptz '2026-11-19 00:00+07'
UNION ALL
SELECT 'pelanggan_luar dibuat sejak 19 Nov', count(*)
FROM public.pelanggan_luar WHERE dibuat_pada >= timestamptz '2026-11-19 00:00+07';

-- H. Urutan nomor otomatis di skema public (untuk rencana reset nomor order)
SELECT schemaname, sequencename, last_value
FROM pg_sequences
WHERE schemaname = 'public'
ORDER BY sequencename;
