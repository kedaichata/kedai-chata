-- supabase/templates/20261106_staf_aktifkan.sql
-- AKN.11 (SEC-26): aktifkan kembali akun staf yang sebelumnya dinonaktifkan. akun.md AK5.
-- Dijalankan MANUAL di SQL Editor (akun ketua), BERULANG bila perlu.
-- Hanya mengubah SATU kolom (aktif = true) pada SATU baris staf. Baris dan akun
-- Supabase Auth TIDAK dihapus. Tanpa DELETE. Tidak mengubah tabel, fungsi, atau hak apa pun.
-- Dampak: di pemanggilan berikutnya akun itu memakai peran stafnya lagi (peran dibaca
-- server dari tabel staf di setiap panggilan, SEC-26). Tidak perlu login ulang.
-- Pembatalan: jalankan 20261106_staf_nonaktif.sql untuk akun yang sama.
--
-- LANGKAH (ketua, di dashboard):
--   1. Salin ID akun dari Authentication > Users.
--   2. Ganti tulisan di antara tanda < > di bawah (tanda < > ikut dihapus), lalu jalankan.
--      Isian hanya diisi di dashboard. JANGAN simpan versi yang sudah terisi ke repo atau chat.
--   3. Jalankan 20261106_staf_cek.sql dan tempel hasilnya ke chat.
--
-- Bila isian belum diganti, perintah gagal sendiri (galat format ID) dan tidak mengubah apa pun.
-- Bila ID salah atau staf itu sudah aktif, perintah gagal sendiri dan tidak mengubah apa pun.

DO $$
DECLARE
  v_id uuid := '<ID_AKUN>';
BEGIN
  UPDATE public.staf
  SET aktif = true
  WHERE id = v_id AND NOT aktif;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tidak ada staf NONAKTIF dengan ID ini (salah ID, atau sudah aktif). Tidak ada yang diubah.';
  END IF;
END;
$$;
