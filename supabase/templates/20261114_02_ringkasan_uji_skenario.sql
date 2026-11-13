-- Berkas tujuan: supabase/templates/20261114_02_ringkasan_uji_skenario.sql
-- RKS.04, langkah 3: uji kasus 4, 6, dan 7 untuk ringkasan_7hari.
--
-- PERHATIAN: skrip ini MENULIS data (UPDATE pada public."order"), tetapi SEMUA
-- perubahan dibatalkan otomatis:
--   1. Tiap skenario berjalan di blok kecil yang diakhiri RAISE EXCEPTION, sehingga
--      perubahannya dibatalkan sebelum skenario berikutnya.
--   2. Skrip ditutup dengan RAISE EXCEPTION, sehingga seluruh transaksi dibatalkan.
-- Hasil uji tampil sebagai PESAN GALAT berjudul "HASIL UJI". Itu memang disengaja.
-- Bila skrip terputus di tengah jalan, database membatalkan sendiri.
--
-- ISIAN (hanya di dashboard, jangan tempel ID ke chat atau repo):
--   Ganti ISI_ID_OWNER_DI_SINI dengan ID akun owner DUMMY aktif (uuid).
--   Salinan di repo tetap memuat tulisan ISI_ID_OWNER_DI_SINI.
--
-- Skenario:
--   S4  : satu hari dikosongkan  -> hari itu tampil 0 dan bisa jadi tersepi.
--   S6a : terlaris seri jumlah, nilai membedakan (hari LEBIH LAMA menang karena nilai lebih besar).
--   S6b : terlaris seri jumlah dan nilai -> hari yang LEBIH BARU.
--   S6c : tersepi seri jumlah dan nilai  -> hari yang LEBIH BARU.
--   S6d : tersepi seri jumlah, nilai membedakan (hari LEBIH LAMA menang karena nilai lebih kecil).
--   S7  : semua order dalam 7 hari dipindah ke luar rentang -> keadaan kosong.
-- "Hari ini" dihitung dari jam server WIB. Hari acuan di bawah (selisih dari hari ini):
--   -2 Kam 12, -3 Rab 11, -4 Sel 10, -5 Sen 9, -6 Min 8 (bila dijalankan Sabtu 14 Nov 2026).

DO $uji$
DECLARE
  v_akun uuid := 'ISI_ID_OWNER_DI_SINI';
  v_hari date := (now() at time zone 'Asia/Jakarta')::date;
  v_jauh date := (now() at time zone 'Asia/Jakarta')::date - 60;
  v_teks text := '';
  v_r    jsonb;
  v_a    bigint;
  v_b    bigint;
BEGIN
  -- S4: hari kosong (Kam 12 dikosongkan)
  BEGIN
    UPDATE public."order" SET hari_target = v_jauh WHERE hari_target = v_hari - 2;
    v_r := public.ringkasan_7hari(v_akun);
    v_teks := v_teks || 'S4: ' || v_r::text || E'\n';
    RAISE EXCEPTION 'batal_skenario';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'batal_skenario' THEN v_teks := v_teks || 'S4 GALAT: ' || SQLERRM || E'\n'; END IF;
  END;

  -- S6a: terlaris seri jumlah (Sel 10 dan Rab 11 sama-sama 13); Sel 10 diberi nilai lebih besar
  BEGIN
    UPDATE public."order" SET hari_target = v_jauh WHERE id IN (
      SELECT id FROM public."order"
      WHERE hari_target = v_hari - 4 AND status NOT IN ('Ditolak', 'Dibatalkan')
      ORDER BY total, id LIMIT 6);
    UPDATE public."order" SET total = total + 1000000 WHERE id = (
      SELECT id FROM public."order"
      WHERE hari_target = v_hari - 4 AND status NOT IN ('Ditolak', 'Dibatalkan')
      ORDER BY total DESC, id LIMIT 1);
    v_r := public.ringkasan_7hari(v_akun);
    v_teks := v_teks || 'S6a: ' || v_r::text || E'\n';
    RAISE EXCEPTION 'batal_skenario';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'batal_skenario' THEN v_teks := v_teks || 'S6a GALAT: ' || SQLERRM || E'\n'; END IF;
  END;

  -- S6b: terlaris seri jumlah DAN nilai (Sel 10 = Rab 11 = 13 order, nilai disamakan)
  BEGIN
    UPDATE public."order" SET hari_target = v_jauh WHERE id IN (
      SELECT id FROM public."order"
      WHERE hari_target = v_hari - 4 AND status NOT IN ('Ditolak', 'Dibatalkan')
      ORDER BY total, id LIMIT 6);
    SELECT COALESCE(SUM(total), 0) INTO v_a FROM public."order"
      WHERE hari_target = v_hari - 4 AND status NOT IN ('Ditolak', 'Dibatalkan');
    SELECT COALESCE(SUM(total), 0) INTO v_b FROM public."order"
      WHERE hari_target = v_hari - 3 AND status NOT IN ('Ditolak', 'Dibatalkan');
    IF v_a < v_b THEN
      UPDATE public."order" SET total = total + (v_b - v_a) WHERE id = (
        SELECT id FROM public."order"
        WHERE hari_target = v_hari - 4 AND status NOT IN ('Ditolak', 'Dibatalkan')
        ORDER BY total DESC, id LIMIT 1);
    ELSIF v_b < v_a THEN
      UPDATE public."order" SET total = total + (v_a - v_b) WHERE id = (
        SELECT id FROM public."order"
        WHERE hari_target = v_hari - 3 AND status NOT IN ('Ditolak', 'Dibatalkan')
        ORDER BY total DESC, id LIMIT 1);
    END IF;
    v_r := public.ringkasan_7hari(v_akun);
    v_teks := v_teks || 'S6b: ' || v_r::text || E'\n';
    RAISE EXCEPTION 'batal_skenario';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'batal_skenario' THEN v_teks := v_teks || 'S6b GALAT: ' || SQLERRM || E'\n'; END IF;
  END;

  -- S6c: tersepi seri jumlah DAN nilai (Min 8 dan Sen 9 sama-sama 4 order, nilai disamakan)
  BEGIN
    UPDATE public."order" SET hari_target = v_jauh WHERE id IN (
      SELECT id FROM public."order"
      WHERE hari_target = v_hari - 6 AND status NOT IN ('Ditolak', 'Dibatalkan')
      ORDER BY total, id LIMIT 2);
    SELECT COALESCE(SUM(total), 0) INTO v_a FROM public."order"
      WHERE hari_target = v_hari - 6 AND status NOT IN ('Ditolak', 'Dibatalkan');
    SELECT COALESCE(SUM(total), 0) INTO v_b FROM public."order"
      WHERE hari_target = v_hari - 5 AND status NOT IN ('Ditolak', 'Dibatalkan');
    IF v_a < v_b THEN
      UPDATE public."order" SET total = total + (v_b - v_a) WHERE id = (
        SELECT id FROM public."order"
        WHERE hari_target = v_hari - 6 AND status NOT IN ('Ditolak', 'Dibatalkan')
        ORDER BY total DESC, id LIMIT 1);
    ELSIF v_b < v_a THEN
      UPDATE public."order" SET total = total + (v_a - v_b) WHERE id = (
        SELECT id FROM public."order"
        WHERE hari_target = v_hari - 5 AND status NOT IN ('Ditolak', 'Dibatalkan')
        ORDER BY total DESC, id LIMIT 1);
    END IF;
    v_r := public.ringkasan_7hari(v_akun);
    v_teks := v_teks || 'S6c: ' || v_r::text || E'\n';
    RAISE EXCEPTION 'batal_skenario';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'batal_skenario' THEN v_teks := v_teks || 'S6c GALAT: ' || SQLERRM || E'\n'; END IF;
  END;

  -- S6d: tersepi seri jumlah (Min 8 dan Sen 9 sama-sama 4); Sen 9 diberi nilai lebih besar
  BEGIN
    UPDATE public."order" SET hari_target = v_jauh WHERE id IN (
      SELECT id FROM public."order"
      WHERE hari_target = v_hari - 6 AND status NOT IN ('Ditolak', 'Dibatalkan')
      ORDER BY total, id LIMIT 2);
    UPDATE public."order" SET total = total + 1000000 WHERE id = (
      SELECT id FROM public."order"
      WHERE hari_target = v_hari - 5 AND status NOT IN ('Ditolak', 'Dibatalkan')
      ORDER BY total DESC, id LIMIT 1);
    v_r := public.ringkasan_7hari(v_akun);
    v_teks := v_teks || 'S6d: ' || v_r::text || E'\n';
    RAISE EXCEPTION 'batal_skenario';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'batal_skenario' THEN v_teks := v_teks || 'S6d GALAT: ' || SQLERRM || E'\n'; END IF;
  END;

  -- S7: keadaan kosong (semua order dalam 7 hari dipindah ke luar rentang)
  BEGIN
    UPDATE public."order" SET hari_target = v_jauh
      WHERE hari_target BETWEEN v_hari - 6 AND v_hari;
    v_r := public.ringkasan_7hari(v_akun);
    v_teks := v_teks || 'S7: ' || v_r::text || E'\n';
    RAISE EXCEPTION 'batal_skenario';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'batal_skenario' THEN v_teks := v_teks || 'S7 GALAT: ' || SQLERRM || E'\n'; END IF;
  END;

  -- Penutup: batalkan seluruh transaksi dan tampilkan hasil sebagai pesan galat.
  RAISE EXCEPTION E'HASIL UJI (semua perubahan sudah dibatalkan otomatis)\n%', v_teks;
END
$uji$;
