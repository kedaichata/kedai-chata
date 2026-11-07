-- supabase/templates/20261107_03_menu_deskripsi_uji.sql
-- Uji perilaku deskripsi menu (MNU.07 giliran 1). Ini isi blok 6 dari berkas cek, tanpa tanda komentar.
-- AMAN: seluruh isi dibatalkan otomatis oleh RAISE EXCEPTION di akhir, jadi tidak ada menu yang tersimpan.
-- Hasilnya muncul sebagai PESAN GALAT merah berawalan "HASIL UJI". Itu normal, bukan error sungguhan.
-- Tanda ⏎ = satu baris baru.
-- Hasil benar:
--   A = "- telur⏎⏎- sambal"        (spasi dan baris kosong berlebih dirapikan)
--   B = "NULL"                      (isian hanya spasi = tanpa deskripsi)
--   C = "deskripsi_tidak_valid"     (201 karakter ditolak)
--   D = "200 karakter diterima"     (tepat 200 karakter diterima)
-- Tanpa data nyata.

DO $$
DECLARE
  v_owner uuid;
  v_id    uuid;
  v_a     text;
  v_b     text;
  v_c     text;
  v_d     text;
BEGIN
  SELECT s.id INTO v_owner FROM public.staf s WHERE s.aktif AND s.peran = 'owner' LIMIT 1;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'HASIL UJI: tidak ada owner aktif';
  END IF;

  -- A: rapikan
  v_id := public.menu_simpan(v_owner, NULL, 'Zz Uji A', 1000, NULL,
            E'  - telur  \r\n\r\n\r\n\r\n  - sambal\t \n', false);
  SELECT replace(deskripsi, E'\n', '⏎') INTO v_a FROM public.menu WHERE id = v_id;

  -- B: hanya spasi
  v_id := public.menu_simpan(v_owner, NULL, 'Zz Uji B', 1000, NULL, E'   \n  ', false);
  SELECT COALESCE(deskripsi, 'NULL') INTO v_b FROM public.menu WHERE id = v_id;

  -- C: 201 karakter
  BEGIN
    PERFORM public.menu_simpan(v_owner, NULL, 'Zz Uji C', 1000, NULL, repeat('a', 201), false);
    v_c := 'TIDAK ditolak (salah)';
  EXCEPTION WHEN OTHERS THEN
    v_c := SQLERRM;
  END;

  -- D: tepat 200 karakter
  BEGIN
    PERFORM public.menu_simpan(v_owner, NULL, 'Zz Uji D', 1000, NULL, repeat('a', 200), false);
    v_d := '200 karakter diterima';
  EXCEPTION WHEN OTHERS THEN
    v_d := 'DITOLAK (salah): ' || SQLERRM;
  END;

  RAISE EXCEPTION 'HASIL UJI | A = "%" | B = "%" | C = "%" | D = "%"', v_a, v_b, v_c, v_d;
END
$$;
