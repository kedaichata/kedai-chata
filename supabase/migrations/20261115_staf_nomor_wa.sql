-- supabase/migrations/20261115_staf_nomor_wa.sql
-- WAG.01: kolom nomor_wa di tabel staf (boleh kosong, pagar bentuk 62xxx).
-- Dijalankan MANUAL di SQL Editor (akun ketua), SETELAH salinannya ada di repo dan ketua bilang "OK".
-- Pembatalan: supabase/migrations/20261115_staf_nomor_wa_batal.sql
-- Cek hasil: supabase/templates/20261115_staf_nomor_wa_cek.sql
-- Rujukan: docs/wa-notif.md WAG11, docs/database.md (blok WAG.01, WAG.02).
--
-- Yang BERUBAH (tabel yang sudah ada, jadi berisiko dan butuh "OK" ketua):
--   - public.staf ditambah SATU kolom: nomor_wa (teks, boleh kosong).
-- Yang TIDAK berubah:
--   - Baris staf yang ada (otomatis nomor_wa kosong), kolom lain, RLS, dan hak tabel.
--   - service_role pada staf tetap HANYA SELECT. Hak tingkat tabel otomatis mencakup kolom baru,
--     jadi tidak ada GRANT atau REVOKE baru. Nomor diisi ketua lewat SQL Editor (WAG.06).
--
-- Pagar bentuk: sama persis dengan profil.nomor_wa (profil_wa_cek): '628' + 8 sampai 11 angka,
-- angka saja (total 11 sampai 14 digit). Kosong (NULL) diizinkan.
-- Catatan: nomor_wa adalah DATA PRIBADI. Nomor nyata tidak boleh ada di berkas ini, di repo, md, atau chat;
-- diketik langsung di SQL Editor.
-- Skema staf sebelum migration (dicek 15 Nov 2026 di database hidup):
--   id, nama_tampilan, peran, aktif, dibuat_pada.

BEGIN;

ALTER TABLE public.staf
  ADD COLUMN nomor_wa text
    CONSTRAINT staf_wa_cek CHECK (nomor_wa IS NULL OR nomor_wa ~ '^628[0-9]{8,11}$');

COMMIT;
