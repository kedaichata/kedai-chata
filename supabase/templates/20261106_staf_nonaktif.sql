-- supabase/templates/20261106_staf_nonaktif.sql
-- AKN.10: nonaktifkan akun staf yang berhenti atau salah diberi peran. akun.md AK5.
-- Dijalankan MANUAL di SQL Editor (akun ketua), BERULANG bila perlu.
-- Hanya mengubah SATU kolom (aktif = false) pada SATU baris staf. Baris dan akun
-- Supabase Auth TIDAK dihapus. Tanpa DELETE.
-- Dampak: di pemanggilan berikutnya akun itu kehilangan akses staf (dibalas 403 oleh
-- `kedai`, tidak jatuh menjadi customer). Sesi login lama tidak membantu karena peran
-- dibaca server dari tabel staf di setiap panggilan (SEC-26).
--
-- LANGKAH (ketua, di dashboard):
--   1. Salin ID akun dari Authentication > Users.
--   2. Ganti tulisan di antara tanda < > di bawah (tanda < > ikut dihapus), lalu jalankan.
--      Isian hanya diisi di dashboard. JANGAN simpan versi yang sudah terisi ke repo atau chat.
--   3. Jalankan 20261106_staf_cek.sql dan tempel hasilnya ke chat.
--
-- Bila isian belum diganti, perintah gagal sendiri dan tidak mengubah apa pun.
-- Mengaktifkan kembali staf BUKAN bagian template ini (belum diputuskan di akun.md).

DO $$
DECLARE
  v_id uuid := '<ID_AKUN>';
BEGIN
  UPDATE public.staf
  SET aktif = false
  WHERE id = v_id AND aktif;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tidak ada staf AKTIF dengan ID ini (salah ID, atau sudah nonaktif). Tidak ada yang diubah.';
  END IF;
END;
$$;
