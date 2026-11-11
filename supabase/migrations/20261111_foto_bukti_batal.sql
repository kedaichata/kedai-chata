-- supabase/migrations/20261111_foto_bukti_batal.sql
-- Pembatalan FTO.01 (20261111_foto_bukti.sql): membuang tabel foto_bukti dan kedua baris pengaturan foto.
-- Dijalankan MANUAL di SQL Editor (akun ketua), HANYA bila perlu mundur.
--
-- PERINGATAN (baca dulu): berkas ini MENGHAPUS tabel foto_bukti beserta isinya. Aman dijalankan hanya
-- selama tabel masih kosong atau hanya berisi foto uji. Bila sudah ada foto sungguhan, JANGAN dijalankan;
-- bahas dulu dengan ketua (butuh "OK"). Menghapus tabel sementara berkas masih ada di Storage membuat
-- berkas itu kehilangan catatannya dan tertinggal.
-- Tidak menyentuh tabel order, akun, menu, dan pengaturan lain.
--
-- Berhenti sendiri (tanpa CASCADE) bila ada fungsi atau objek lain yang masih bergantung pada tabel ini,
-- misalnya fungsi foto dari FTO.02 yang sudah dibuat dan terikat. Dalam kasus itu batalkan migration
-- yang lebih baru dulu, lalu jalankan berkas ini.
--
-- BUCKET `foto-bukti` TIDAK dibuang oleh berkas ini. Supabase biasanya melarang penghapusan tabel
-- Storage langsung lewat SQL (harus lewat jalur resmi Storage). Cara membuangnya: di dashboard
-- Supabase (akun ketua), buka Storage, kosongkan bucket `foto-bukti` bila ada isinya, lalu hapus bucketnya.
-- Langkah ini dipandu AI saat dibutuhkan.

BEGIN;

DROP TABLE public.foto_bukti;

-- Pengaturan yang dibuat FTO.01
DELETE FROM public.pengaturan
WHERE kunci IN ('foto_simpan_hari', 'foto_maks_kb');

COMMIT;
