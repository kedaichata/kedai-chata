-- supabase/templates/20261119_akun_data_uji_cek.sql
-- LNC.01f langkah 1: mendata akun (Auth, staf, profil), alamat, dan langganan_push sebelum
-- ada yang dinonaktifkan atau dihapus. HANYA SELECT. Tidak mengubah apa pun.
-- Jalankan di SQL Editor (akun ketua), SATU BLOK per kali (blok A sampai F), lalu tempel hasilnya ke chat.
-- Tanpa data nyata di berkas ini. Hasil hanya memuat 8 karakter awal ID akun.
-- Tanpa email penuh, tanpa nomor WA, tanpa alamat. Nama staf hanya tampil untuk akun yang dibuat
-- SEBELUM 19 Nov 2026 (kandidat akun uji); nama staf asli selalu kosong.
--
-- Asumsi nama kolom:
--   auth.users(id, email, created_at, last_sign_in_at),
--   staf(id, nama_tampilan, peran, aktif, dibuat_pada, nomor_wa),
--   profil(id, dibuat_pada), alamat(id, pemilik, aktif, dibuat_pada),
--   langganan_push(akun, aktif, dibuat_pada), menu/grup_pilihan/menu_grup(diubah_oleh),
--   belanja(penginput), foto_bukti(diunggah_oleh), "order"(dibuat_oleh, pemutus),
--   pelanggan_luar(dibuat_oleh).
--   Kolom dibuat_pada di profil dan alamat sudah dipakai di cek LNC.01e (blok D) tetapi belum dicek di migration;
--   bila ada blok galat "column does not exist", berhenti dan laporkan ke chat; jangan diubah sendiri.
--
-- Batas "akun asli dibuat 19 Nov 2026 00.00 WIB" = penanda kecurigaan, bukan bukti.
-- Hasil yang diharapkan: staf dibuat sebelum batas = 3 (akun uji), sejak batas = 6 (5 owner + 1 penjaga);
-- tidak ada customer asli (semua profil dummy).

-- A. Jumlah baris per tabel yang merujuk ke akun
--    Seharusnya 0: inbox, riwayat_status, catatan_order, baca_catatan, order, pelanggan_luar, foto_bukti, belanja.
SELECT 'auth.users' AS objek, count(*) AS jumlah FROM auth.users
UNION ALL SELECT 'staf (total)',   count(*) FROM public.staf
UNION ALL SELECT 'staf (aktif)',   count(*) FROM public.staf WHERE aktif
UNION ALL SELECT 'profil',         count(*) FROM public.profil
UNION ALL SELECT 'alamat',         count(*) FROM public.alamat
UNION ALL SELECT 'langganan_push', count(*) FROM public.langganan_push
UNION ALL SELECT 'inbox',          count(*) FROM public.inbox
UNION ALL SELECT 'riwayat_status', count(*) FROM public.riwayat_status
UNION ALL SELECT 'catatan_order',  count(*) FROM public.catatan_order
UNION ALL SELECT 'baca_catatan',   count(*) FROM public.baca_catatan
UNION ALL SELECT 'order',          count(*) FROM public."order"
UNION ALL SELECT 'pelanggan_luar', count(*) FROM public.pelanggan_luar
UNION ALL SELECT 'foto_bukti',     count(*) FROM public.foto_bukti
UNION ALL SELECT 'belanja',        count(*) FROM public.belanja;

-- B. Semua akun Auth: jenisnya, kapan dibuat, kapan terakhir login.
--    Domain email dan penanda "+" hanya untuk membedakan dummy; email penuh tidak ditampilkan.
SELECT
  left(u.id::text, 8)                                         AS id_awal,
  u.created_at AT TIME ZONE 'Asia/Jakarta'                    AS dibuat_wib,
  u.last_sign_in_at AT TIME ZONE 'Asia/Jakarta'               AS login_terakhir_wib,
  CASE WHEN s.id IS NOT NULL AND p.id IS NOT NULL THEN 'staf+profil (ANEH)'
       WHEN s.id IS NOT NULL THEN 'staf'
       WHEN p.id IS NOT NULL THEN 'profil'
       ELSE 'tanpa_baris' END                                 AS jenis,
  s.peran,
  s.aktif                                                     AS staf_aktif,
  split_part(u.email, '@', 2)                                 AS domain_email,
  (u.email LIKE '%+%')                                        AS ada_plus,
  CASE WHEN s.id IS NOT NULL
        AND s.dibuat_pada < timestamptz '2026-11-19 00:00+07'
       THEN s.nama_tampilan END                               AS nama_staf_kandidat_uji
FROM auth.users u
LEFT JOIN public.staf   s ON s.id = u.id
LEFT JOIN public.profil p ON p.id = u.id
ORDER BY jenis, u.created_at;

-- C. Staf: peran, status, dibuat kapan, dan berapa banyak data yang masih merujuk ke tiap staf.
--    Dasar untuk menentukan tiga akun uji yang dinonaktifkan (bukan dihapus).
SELECT
  left(s.id::text, 8)                                         AS id_awal,
  s.peran,
  s.aktif,
  s.dibuat_pada AT TIME ZONE 'Asia/Jakarta'                   AS dibuat_wib,
  (s.dibuat_pada >= timestamptz '2026-11-19 00:00+07')        AS sejak_19_nov,
  (s.nomor_wa IS NOT NULL)                                    AS nomor_wa_terisi,
  CASE WHEN s.dibuat_pada < timestamptz '2026-11-19 00:00+07'
       THEN s.nama_tampilan END                               AS nama_kandidat_uji,
  (SELECT count(*) FROM public.menu m          WHERE m.diubah_oleh   = s.id) AS menu,
  (SELECT count(*) FROM public.grup_pilihan g  WHERE g.diubah_oleh   = s.id) AS grup,
  (SELECT count(*) FROM public.menu_grup mg    WHERE mg.diubah_oleh  = s.id) AS menu_grup,
  (SELECT count(*) FROM public.belanja b       WHERE b.penginput     = s.id) AS belanja,
  (SELECT count(*) FROM public.foto_bukti f    WHERE f.diunggah_oleh = s.id) AS foto,
  (SELECT count(*) FROM public."order" o       WHERE s.id IN (o.dibuat_oleh, o.pemutus)) AS order_terkait,
  (SELECT count(*) FROM public.pelanggan_luar pl WHERE pl.dibuat_oleh = s.id) AS pelanggan_luar,
  (SELECT count(*) FROM public.langganan_push l WHERE l.akun = s.id)          AS push_total,
  (SELECT count(*) FROM public.langganan_push l WHERE l.akun = s.id AND l.aktif) AS push_aktif
FROM public.staf s
ORDER BY s.dibuat_pada;

-- D. Profil customer (semua diharapkan dummy): kapan dibuat, berapa alamat, berapa langganan push.
SELECT
  left(p.id::text, 8)                                         AS id_awal,
  p.dibuat_pada AT TIME ZONE 'Asia/Jakarta'                   AS profil_dibuat_wib,
  (p.dibuat_pada >= timestamptz '2026-11-19 00:00+07')        AS sejak_19_nov,
  (s.id IS NOT NULL)                                          AS juga_staf,
  (SELECT count(*) FROM public.alamat a WHERE a.pemilik = p.id)             AS alamat_total,
  (SELECT count(*) FROM public.alamat a WHERE a.pemilik = p.id AND a.aktif) AS alamat_aktif,
  (SELECT count(*) FROM public.langganan_push l WHERE l.akun = p.id)        AS push_total
FROM public.profil p
LEFT JOIN public.staf s ON s.id = p.id
ORDER BY p.dibuat_pada;

-- E. Langganan push: milik siapa (staf atau customer), aktif atau tidak, dibuat kapan.
--    Langganan staf ASLI jangan ikut dihapus.
SELECT
  left(l.akun::text, 8)                                       AS id_awal,
  CASE WHEN s.id IS NOT NULL THEN 'staf'
       WHEN p.id IS NOT NULL THEN 'profil'
       ELSE 'tanpa_baris' END                                 AS jenis,
  s.aktif                                                     AS staf_aktif,
  (s.dibuat_pada >= timestamptz '2026-11-19 00:00+07')        AS staf_asli,
  l.aktif                                                     AS langganan_aktif,
  count(*)                                                    AS jumlah,
  min(l.dibuat_pada) AT TIME ZONE 'Asia/Jakarta'              AS paling_awal_wib,
  max(l.dibuat_pada) AT TIME ZONE 'Asia/Jakarta'              AS paling_akhir_wib
FROM public.langganan_push l
LEFT JOIN public.staf   s ON s.id = l.akun
LEFT JOIN public.profil p ON p.id = l.akun
GROUP BY l.akun, s.id, s.aktif, s.dibuat_pada, p.id, l.aktif
ORDER BY min(l.dibuat_pada);

-- F. Penanda ada-tidaknya akun customer ASLI. Harapan: semua 0 kecuali baris bertanda (info).
--    Angka bukan 0 bukan otomatis salah (tes Turnstile 18 sampai 19 Nov membuat akun dummy),
--    tetapi harus dicocokkan dengan blok B dan D sebelum ada yang dihapus.
SELECT 'akun Auth non-staf dibuat sejak 19 Nov' AS pemeriksaan, count(*) AS jumlah
FROM auth.users u
WHERE u.created_at >= timestamptz '2026-11-19 00:00+07'
  AND NOT EXISTS (SELECT 1 FROM public.staf s WHERE s.id = u.id)
UNION ALL
SELECT 'akun Auth non-staf login sejak 19 Nov', count(*)
FROM auth.users u
WHERE u.last_sign_in_at >= timestamptz '2026-11-19 00:00+07'
  AND NOT EXISTS (SELECT 1 FROM public.staf s WHERE s.id = u.id)
UNION ALL
SELECT 'profil dibuat sejak 19 Nov', count(*)
FROM public.profil WHERE dibuat_pada >= timestamptz '2026-11-19 00:00+07'
UNION ALL
SELECT 'alamat dibuat sejak 19 Nov', count(*)
FROM public.alamat WHERE dibuat_pada >= timestamptz '2026-11-19 00:00+07'
UNION ALL
SELECT 'langganan_push milik non-staf', count(*)
FROM public.langganan_push l
WHERE NOT EXISTS (SELECT 1 FROM public.staf s WHERE s.id = l.akun)
UNION ALL
SELECT 'profil yang juga staf (harus 0)', count(*)
FROM public.profil p JOIN public.staf s ON s.id = p.id
UNION ALL
SELECT 'staf dibuat sebelum 19 Nov (info: diharapkan 3 akun uji)', count(*)
FROM public.staf WHERE dibuat_pada < timestamptz '2026-11-19 00:00+07'
UNION ALL
SELECT 'staf dibuat sejak 19 Nov (info: diharapkan 6 akun asli)', count(*)
FROM public.staf WHERE dibuat_pada >= timestamptz '2026-11-19 00:00+07'
UNION ALL
SELECT 'staf asli aktif (info: diharapkan 6)', count(*)
FROM public.staf WHERE dibuat_pada >= timestamptz '2026-11-19 00:00+07' AND aktif;
