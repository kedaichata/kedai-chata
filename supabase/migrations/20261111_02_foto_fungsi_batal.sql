-- supabase/migrations/20261111_02_foto_fungsi_batal.sql
-- Pembatalan FTO.02 (pasangan 20261111_02_foto_fungsi.sql).
-- Dijalankan MANUAL di SQL Editor (akun ketua), hanya dengan "OK" ketua.
-- Yang dibuang: tiga fungsi foto dan baris pengaturan `foto_tautan_detik`.
-- Yang TIDAK disentuh: tabel `foto_bukti` beserta isinya (baris foto yang sudah tercatat tetap ada), bucket,
-- berkas di Storage, dan semua pengaturan lain.
-- Urutan: foto_catat dibuang lebih dulu karena memanggil foto_cek_unggah.
-- Bila `kedai` versi FTO.02 sudah dideploy, deploy versi sebelumnya dulu (atau aksi foto akan menjawab galat umum).
-- Sebelum dijalankan, kunci baris `pengaturan` itu tidak dipakai siapa pun selain fungsi foto_lihat_cek.

BEGIN;

DROP FUNCTION public.foto_catat(uuid, uuid, text, bigint);
DROP FUNCTION public.foto_lihat_cek(uuid, uuid);
DROP FUNCTION public.foto_cek_unggah(uuid, uuid);

DELETE FROM public.pengaturan WHERE kunci = 'foto_tautan_detik';

COMMIT;
