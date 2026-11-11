-- supabase/templates/20261111_04_vault_rahasia.sql
-- FTO.05: simpan rahasia penjadwal dan alamat project ke Vault Supabase.
-- TEMPLATE: isian di bawah HANYA diisi di SQL Editor dashboard (akun ketua), JANGAN pernah disimpan di repo, chat, atau md.
--
-- Cara pakai:
--   1. Buka SQL Editor, tempel berkas ini.
--   2. Ganti GANTI_RAHASIA dengan nilai RAHASIA_PENJADWAL (sama persis dengan yang dipasang di dashboard
--      sebagai variabel fungsi `bersihkan`, dari pwd manager).
--   3. Ganti GANTI_URL dengan alamat project, bentuk https://<kode-project>.supabase.co (tanpa garis miring di akhir).
--   4. Klik Run. Hasil benar: "Success. No rows returned".
--   5. SEGERA hapus snippet ini dari SQL Editor (SQL Editor menyimpan query, nilai rahasia ikut tersimpan).
--
-- Aman bila isian lupa diganti: blok ini berhenti dengan galat dan tidak menyimpan apa pun.
-- Bila nama sudah ada di Vault, create_secret gagal (nama harus unik). Untuk mengganti nilai (misalnya
-- rahasia dirotasi), minta panduan terpisah; jangan membuat nama ganda.

do $$
declare
  v_rahasia text := 'GANTI_RAHASIA';
  v_url     text := 'GANTI_URL';
begin
  if v_rahasia like 'GANTI%' or length(v_rahasia) < 32 then
    raise exception 'Rahasia belum diisi atau kurang dari 32 karakter';
  end if;
  if v_url !~ '^https://[a-z0-9]+\.supabase\.co$' then
    raise exception 'Alamat project belum diisi atau bentuknya salah';
  end if;

  perform vault.create_secret(
    v_rahasia,
    'rahasia_penjadwal_bersihkan',
    'Rahasia penjadwal untuk fungsi bersihkan (FTO.05)'
  );
  perform vault.create_secret(
    v_url,
    'url_project_bersihkan',
    'Alamat project untuk memanggil fungsi bersihkan (FTO.05)'
  );
end
$$;
