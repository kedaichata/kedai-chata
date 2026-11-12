-- supabase/migrations/20261112_02_langganan_push_fungsi.sql
-- NTF.03 (tahap 1): dua fungsi SQL `push_daftar` dan `push_nonaktifkan`.
-- Aksi `kedai` (push.ts, index.ts) dikerjakan di tahap 2, dan baru dideploy SETELAH migration ini
-- dijalankan dan lulus cek.
-- Dijalankan MANUAL di SQL Editor (akun ketua), SETELAH salinannya ada di repo dan SETELAH "OK" ketua.
-- Pembatalan: supabase/migrations/20261112_02_langganan_push_fungsi_batal.sql
-- Cek hasil: supabase/templates/20261112_02_langganan_push_fungsi_cek.sql
-- Tanpa data nyata.
--
-- Yang BARU:
--   - fungsi `public.push_daftar(uuid, text, text, text)`
--   - fungsi `public.push_nonaktifkan(uuid, text)`
-- Yang SENGAJA TIDAK DISENTUH: semua tabel dan hak tabel (termasuk `langganan_push`), data, pengaturan,
--   semua fungsi lama, dan berkas aplikasi.
-- Semua fungsi BARU (CREATE FUNCTION, bukan OR REPLACE), jadi tidak mungkin menimpa fungsi lama.
-- Tidak ada data yang berubah sampai `push_daftar` dipanggil (belum ada yang memanggil sampai NTF.05).
--
-- Pola keamanan (AGENTS.md bagian 7, security.md aturan 4): SECURITY DEFINER, search_path kosong,
-- `public.` eksplisit, EXECUTE hanya untuk service_role. `p_akun` HARUS diambil `kedai` dari token login,
-- bukan dari aplikasi (aturan 2 dan 5). Tidak ada DELETE: langganan dinonaktifkan, tidak dihapus (NT5).
--
-- Keputusan yang berlaku (notifikasi.md NT5; Handoff #2; blok 12 Nov 2026 "Perangkat melebihi batas"):
--   - Satu akun boleh punya beberapa perangkat; satu baris per perangkat (endpoint unik se-tabel).
--   - HP yang sama dipakai akun lain: baris DIPINDAH ke akun yang sedang login, bukan dibuat dobel.
--   - Perangkat aktif melebihi `push_maks_perangkat`: yang AKTIF TERLAMA dinonaktifkan, pendaftaran
--     perangkat baru tetap BERHASIL (keputusan ketua, 12 Nov 2026).
--   - "Terlama" diukur dari `dibuat_pada` (disetujui ketua, 12 Nov 2026). Karena itu tiap pendaftaran ulang
--     atau pemindahan akun memperbarui `dibuat_pada` ke jam server, supaya dihitung terbaru.
--   - `push_nonaktifkan` hanya menyentuh langganan MILIK pemanggil (SEC-25).
--   - Isi langganan (endpoint dan dua kunci) tidak pernah dikembalikan ke aplikasi.
--
-- Pilihan penulis (alasan belum tercatat dari ketua; ketua boleh mengubah sebelum dijalankan):
--   1. `push_daftar` mengembalikan jumlah perangkat lama yang dinonaktifkan karena batas (0 bila tidak ada).
--   2. Pendaftaran ulang endpoint yang sama dan akun yang sama juga memperbarui `dibuat_pada`, mengaktifkan
--      kembali baris, dan mengosongkan `terakhir_berhasil_pada` (langganan dianggap baru).
--   3. Format isian dicek di fungsi (sama dengan constraint tabel) supaya galatnya rapi:
--      `langganan_tidak_valid`, bukan galat constraint mentah.
--   4. Dua pendaftaran bersamaan untuk akun yang sama diurutkan dengan kunci penasihat per akun, supaya
--      batas perangkat tidak terlewati.
--   5. `push_nonaktifkan` TIDAK mengecek akun nonaktif (staf yang baru dinonaktifkan tetap boleh mematikan
--      langganannya saat Keluar). Bila endpoint tidak ada atau milik akun lain, tidak ada yang berubah dan
--      fungsi mengembalikan 0 tanpa membedakan keduanya (tidak membocorkan keberadaan langganan orang lain).
--      Hasil benar untuk SEC-25 diuji lewat "baris akun lain tidak berubah".
--   6. `push_maks_perangkat` harus bilangan bulat 1 sampai 20; di luar itu galat `pengaturan_rusak`
--      (galat umum 500), sesuai Handoff #2.
--
-- Kode galat (RAISE EXCEPTION) untuk dipetakan `kedai` (push.ts), usulan status HTTP di dalam kurung:
--   push_daftar:      id_kosong (400), akun_nonaktif (403), langganan_tidak_valid (400),
--                     pengaturan_rusak (tidak dipetakan, galat umum 500)
--   push_nonaktifkan: id_kosong (400)

BEGIN;

-- ============================================================
-- 1. push_daftar: simpan langganan satu perangkat untuk p_akun (atomik).
--    p_akun    : akun yang login (dari token; owner, penjaga, atau customer).
--    p_endpoint: alamat tujuan push dari peramban.
--    p_p256dh, p_auth: dua kunci langganan.
--    Mengembalikan jumlah perangkat lama yang dinonaktifkan karena batas.
-- ============================================================
CREATE FUNCTION public.push_daftar(
  p_akun      uuid,
  p_endpoint  text,
  p_p256dh    text,
  p_auth      text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_aktif     boolean;
  v_ada_staf  boolean;
  v_maks_txt  text;
  v_maks      integer;
  v_id        uuid;
  v_jumlah    integer;
  v_lepas     integer := 0;
BEGIN
  IF p_akun IS NULL OR p_endpoint IS NULL OR p_p256dh IS NULL OR p_auth IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  -- Staf nonaktif ditolak; tanpa baris staf = customer
  SELECT s.aktif
    INTO v_aktif
    FROM public.staf s
   WHERE s.id = p_akun;
  v_ada_staf := FOUND;
  IF v_ada_staf AND NOT v_aktif THEN
    RAISE EXCEPTION 'akun_nonaktif';
  END IF;

  -- Bentuk isian (aturan 19; sama dengan constraint tabel langganan_push)
  IF char_length(p_endpoint) NOT BETWEEN 20 AND 2000
     OR p_endpoint NOT LIKE 'https://%'
     OR p_endpoint ~ '[[:space:][:cntrl:]]'
     OR char_length(p_p256dh) NOT BETWEEN 1 AND 200
     OR p_p256dh !~ '^[A-Za-z0-9_=-]+$'
     OR char_length(p_auth) NOT BETWEEN 1 AND 200
     OR p_auth !~ '^[A-Za-z0-9_=-]+$' THEN
    RAISE EXCEPTION 'langganan_tidak_valid';
  END IF;

  -- Batas perangkat dari pengaturan (aturan 19): bilangan bulat 1 sampai 20
  SELECT nullif(btrim(g.nilai::text), '')
    INTO v_maks_txt
    FROM public.pengaturan g
   WHERE g.kunci = 'push_maks_perangkat';
  IF v_maks_txt IS NULL OR v_maks_txt !~ '^[0-9]{1,2}$' THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;
  v_maks := v_maks_txt::integer;
  IF v_maks < 1 OR v_maks > 20 THEN
    RAISE EXCEPTION 'pengaturan_rusak';
  END IF;

  -- Urutkan pendaftaran bersamaan untuk akun yang sama (batas perangkat tidak boleh terlewati)
  PERFORM pg_advisory_xact_lock(hashtextextended('push_daftar:' || p_akun::text, 0));

  -- Simpan. Endpoint yang sudah ada (akun sama atau akun lain) DIPINDAH ke p_akun, diaktifkan kembali,
  -- dan dihitung sebagai yang terbaru.
  INSERT INTO public.langganan_push (akun, endpoint, kunci_p256dh, kunci_auth)
  VALUES (p_akun, p_endpoint, p_p256dh, p_auth)
  ON CONFLICT (endpoint) DO UPDATE
    SET akun                   = EXCLUDED.akun,
        kunci_p256dh           = EXCLUDED.kunci_p256dh,
        kunci_auth             = EXCLUDED.kunci_auth,
        aktif                  = true,
        dibuat_pada            = now(),
        terakhir_berhasil_pada = NULL
  RETURNING id INTO v_id;

  -- Lewat batas: nonaktifkan yang aktif TERLAMA (bukan yang baru didaftarkan), tanpa menghapus
  SELECT count(*)::integer
    INTO v_jumlah
    FROM public.langganan_push l
   WHERE l.akun = p_akun
     AND l.aktif;

  IF v_jumlah > v_maks THEN
    UPDATE public.langganan_push
       SET aktif = false
     WHERE id IN (
       SELECT l.id
         FROM public.langganan_push l
        WHERE l.akun = p_akun
          AND l.aktif
          AND l.id <> v_id
        ORDER BY l.dibuat_pada ASC, l.id ASC
        LIMIT (v_jumlah - v_maks)
     );
    GET DIAGNOSTICS v_lepas = ROW_COUNT;
  END IF;

  RETURN v_lepas;
END;
$$;

-- ============================================================
-- 2. push_nonaktifkan: matikan langganan satu perangkat, HANYA bila milik p_akun (SEC-25).
--    Baris tidak dihapus. Mengembalikan 0 atau 1 (jumlah baris yang dimatikan).
-- ============================================================
CREATE FUNCTION public.push_nonaktifkan(
  p_akun      uuid,
  p_endpoint  text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_n integer;
BEGIN
  IF p_akun IS NULL OR p_endpoint IS NULL OR btrim(p_endpoint) = '' THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  UPDATE public.langganan_push
     SET aktif = false
   WHERE endpoint = p_endpoint
     AND akun = p_akun
     AND aktif;
  GET DIAGNOSTICS v_n = ROW_COUNT;

  RETURN v_n;
END;
$$;

-- ============================================================
-- 3. Hak EXECUTE: cabut semua dulu, lalu beri hanya ke service_role (AGENTS.md bagian 7).
-- ============================================================
REVOKE ALL ON FUNCTION public.push_daftar(uuid, text, text, text)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.push_nonaktifkan(uuid, text)
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.push_daftar(uuid, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.push_nonaktifkan(uuid, text)        TO service_role;

COMMIT;
