-- supabase/templates/20261119_inbox_foto_data_uji_cek.sql
-- LNC.01d langkah 1: mendata isi tabel inbox, foto_bukti, dan berkas di bucket foto-bukti
-- sebelum dihapus. HANYA SELECT. Tidak mengubah apa pun.
-- Jalankan di SQL Editor (akun ketua), SATU BLOK per kali, lalu tempel hasilnya ke chat.
-- Tanpa data nyata di berkas ini. Hasil hanya memuat 8 karakter awal ID akun (bukan nama).
--
-- Asumsi nama kolom (dari migration di repo): staf(id, peran, aktif, dibuat_pada),
-- profil(id), order(id, nomor, status, tipe, pemesan, pelanggan_luar_id, dibuat_pada).
-- Bila ada galat "column does not exist", berhenti dan laporkan ke chat; jangan diubah sendiri.
--
-- Batas "akun asli dibuat 19 Nov 2026" dipakai sebagai penanda kecurigaan:
-- baris inbox yang waktunya >= 19 Nov 2026 00.00 WIB perlu diperiksa lebih dulu.

-- A. Jumlah baris per tabel dan jumlah berkas di Storage
SELECT 'inbox' AS objek, count(*) AS jumlah FROM public.inbox
UNION ALL
SELECT 'foto_bukti (semua baris)', count(*) FROM public.foto_bukti
UNION ALL
SELECT 'foto_bukti (berkas belum dibersihkan)', count(*) FROM public.foto_bukti WHERE dibersihkan_pada IS NULL
UNION ALL
SELECT 'foto_bukti (ditandai diganti)', count(*) FROM public.foto_bukti WHERE diganti
UNION ALL
SELECT 'storage: berkas di bucket foto-bukti', count(*) FROM storage.objects WHERE bucket_id = 'foto-bukti';

-- B. Inbox per penerima: peran, aktif atau tidak, kapan akunnya dibuat (kalau staf),
--    berapa baris, dan rentang waktunya
SELECT
  left(i.penerima::text, 8)                          AS akun,
  COALESCE(s.peran, 'customer')                      AS peran,
  s.aktif                                            AS staf_aktif,
  s.dibuat_pada AT TIME ZONE 'Asia/Jakarta'          AS staf_dibuat_wib,
  (p.id IS NOT NULL)                                 AS punya_profil,
  count(*)                                           AS baris,
  min(i.waktu) AT TIME ZONE 'Asia/Jakarta'           AS paling_awal_wib,
  max(i.waktu) AT TIME ZONE 'Asia/Jakarta'           AS paling_akhir_wib
FROM public.inbox i
LEFT JOIN public.staf   s ON s.id = i.penerima
LEFT JOIN public.profil p ON p.id = i.penerima
GROUP BY i.penerima, s.peran, s.aktif, s.dibuat_pada, p.id
ORDER BY min(i.waktu);

-- C. Rentang inbox, dan berapa baris yang waktunya sudah masuk 19 Nov 2026 (WIB)
SELECT
  count(*)                                                                AS total,
  min(waktu) AT TIME ZONE 'Asia/Jakarta'                                  AS paling_awal_wib,
  max(waktu) AT TIME ZONE 'Asia/Jakarta'                                  AS paling_akhir_wib,
  min(nomor_order)                                                        AS nomor_order_terkecil,
  max(nomor_order)                                                        AS nomor_order_terbesar,
  count(*) FILTER (WHERE waktu >= timestamptz '2026-11-19 00:00+07')      AS baris_sejak_19_nov
FROM public.inbox;

-- D. foto_bukti per pengunggah: status staf, jumlah, diganti, dibersihkan, rentang waktu
SELECT
  left(f.diunggah_oleh::text, 8)                     AS pengunggah,
  s.peran,
  s.aktif                                            AS staf_aktif,
  s.dibuat_pada AT TIME ZONE 'Asia/Jakarta'          AS staf_dibuat_wib,
  count(*)                                           AS baris,
  count(*) FILTER (WHERE f.diganti)                  AS diganti,
  count(*) FILTER (WHERE f.dibersihkan_pada IS NOT NULL) AS sudah_dibersihkan,
  min(f.diunggah_pada) AT TIME ZONE 'Asia/Jakarta'   AS paling_awal_wib,
  max(f.diunggah_pada) AT TIME ZONE 'Asia/Jakarta'   AS paling_akhir_wib
FROM public.foto_bukti f
JOIN public.staf s ON s.id = f.diunggah_oleh
GROUP BY f.diunggah_oleh, s.peran, s.aktif, s.dibuat_pada
ORDER BY min(f.diunggah_pada);

-- E. Berkas di Storage: berapa yang punya baris di foto_bukti, berapa yatim, ukuran total, rentang umur
SELECT
  count(*)                                                                  AS berkas,
  count(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM public.foto_bukti f WHERE f.lokasi_berkas = o.name))      AS punya_baris,
  count(*) FILTER (WHERE NOT EXISTS (
    SELECT 1 FROM public.foto_bukti f WHERE f.lokasi_berkas = o.name))      AS tanpa_baris,
  round(COALESCE(sum((o.metadata ->> 'size')::bigint), 0) / 1024.0, 1)      AS total_kb,
  min(o.created_at) AT TIME ZONE 'Asia/Jakarta'                             AS paling_awal_wib,
  max(o.created_at) AT TIME ZONE 'Asia/Jakarta'                             AS paling_akhir_wib
FROM storage.objects o
WHERE o.bucket_id = 'foto-bukti';

-- F. Order yang dirujuk inbox atau foto: apakah ada yang bukan order uji?
--    (customer dibedakan lewat 8 karakter awal ID; cocokkan dengan daftar akun uji dari ketua)
SELECT
  o.nomor,
  o.status,
  o.tipe,
  o.dibuat_pada AT TIME ZONE 'Asia/Jakarta'          AS dibuat_wib,
  left(COALESCE(o.pemesan::text, '-'), 8)            AS pemesan,
  (o.pelanggan_luar_id IS NOT NULL)                  AS order_wakil,
  (SELECT count(*) FROM public.inbox i WHERE i.nomor_order = o.nomor)  AS baris_inbox,
  (SELECT count(*) FROM public.foto_bukti f WHERE f.order_id = o.id)   AS baris_foto
FROM public."order" o
WHERE EXISTS (SELECT 1 FROM public.inbox i WHERE i.nomor_order = o.nomor)
   OR EXISTS (SELECT 1 FROM public.foto_bukti f WHERE f.order_id = o.id)
ORDER BY o.nomor;
