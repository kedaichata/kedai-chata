-- supabase/templates/20261106_staf_tambah.sql
-- AKN.10: tambah akun staf (owner atau penjaga). akun.md AK4, AK5 dan prosedur di bagian 4.
-- Dijalankan MANUAL di SQL Editor (akun ketua), BERULANG setiap ada staf baru.
-- Hanya menambah SATU baris di tabel staf. Tidak mengubah tabel, fungsi, atau hak apa pun.
-- Pembatalan: jalankan 20261106_staf_nonaktif.sql untuk akun itu (baris tidak dihapus).
--
-- LANGKAH (ketua, di dashboard):
--   1. Authentication > Users > Add user (email staf, password acak sementara).
--   2. Tekan "Send password recovery" supaya staf membuat password sendiri.
--   3. Salin ID akun dari daftar Users.
--   4. Isi TIGA isian di bawah (ganti tulisan di antara tanda < >, tanda < > ikut dihapus),
--      lalu jalankan. Isian hanya diisi di dashboard. JANGAN simpan versi yang sudah
--      terisi ke repo atau chat (repo public, data pribadi tidak boleh masuk).
--   5. Jalankan 20261106_staf_cek.sql dan tempel hasilnya ke chat.
--
-- Bila isian belum diganti, perintah gagal sendiri (galat format ID) dan tidak mengubah apa pun.
-- Template ini TIDAK menimpa baris staf yang sudah ada (salah ketik tidak mengubah peran orang).

DO $$
DECLARE
  v_id    uuid := '<ID_AKUN>';
  v_nama  text := btrim('<NAMA_TAMPILAN>');
  v_peran text := '<owner ATAU penjaga>';
BEGIN
  -- Akun harus ada di Supabase Auth (dibuat dulu lewat dashboard)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_id) THEN
    RAISE EXCEPTION 'Akun dengan ID ini tidak ada di Authentication > Users. Cek ID-nya.';
  END IF;

  -- Peran hanya owner atau penjaga
  IF v_peran NOT IN ('owner', 'penjaga') THEN
    RAISE EXCEPTION 'Peran harus tepat owner atau penjaga (huruf kecil).';
  END IF;

  -- Nama tampilan: 3-20, huruf/angka/spasi/garis bawah (sama dengan aturan tabel staf)
  IF char_length(v_nama) NOT BETWEEN 3 AND 20
     OR v_nama !~ '^[A-Za-z0-9_ ]+$' THEN
    RAISE EXCEPTION 'Nama tampilan 3 sampai 20 karakter: huruf, angka, spasi, garis bawah.';
  END IF;

  -- Satu orang = dua akun (AK4): akun yang sudah punya profil customer tidak boleh jadi staf
  IF EXISTS (SELECT 1 FROM public.profil WHERE id = v_id) THEN
    RAISE EXCEPTION 'Akun ini sudah punya profil customer. Staf harus akun terpisah (email berbeda).';
  END IF;

  -- Tidak menimpa baris yang sudah ada
  IF EXISTS (SELECT 1 FROM public.staf WHERE id = v_id) THEN
    RAISE EXCEPTION 'Akun ini sudah ada di tabel staf. Tidak ada yang diubah.';
  END IF;

  INSERT INTO public.staf (id, nama_tampilan, peran)
  VALUES (v_id, v_nama, v_peran);
END;
$$;
