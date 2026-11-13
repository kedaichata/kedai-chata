-- supabase/migrations/20261113_inbox_tulis_penerima.sql
-- NTF.06 (langkah SQL): `inbox_tulis` kini mengembalikan DAFTAR PENERIMA (bukan jumlah baris), ditambah dua fungsi baru
-- untuk pengirim push: `push_langganan_ambil` dan `push_hasil_catat`.
-- Dijalankan MANUAL di SQL Editor (akun ketua), SETELAH salinannya ada di repo dan SETELAH "OK" ketua (sudah ada, 13 Nov 2026).
-- Pembatalan: supabase/migrations/20261113_inbox_tulis_penerima_batal.sql
-- Cek hasil: supabase/templates/20261113_inbox_tulis_penerima_cek.sql
-- Tanpa data nyata.
--
-- Yang DIUBAH:
--   - fungsi `public.inbox_tulis(uuid, text, uuid)`: tipe kembalian berubah dari integer menjadi jsonb, sehingga fungsi
--     lama DIHAPUS lalu DIBUAT ULANG (CREATE OR REPLACE tidak bisa mengganti tipe kembalian). Semua aturan penerima, teks,
--     dan pemeriksaan status SAMA PERSIS dengan versi 20261111_06_inbox_fungsi.sql. Yang bertambah hanya hasil kembalian.
-- Yang BARU:
--   - fungsi `public.push_langganan_ambil(uuid[])`  (hanya membaca langganan aktif)
--   - fungsi `public.push_hasil_catat(uuid[], uuid[])` (satu langkah atomik: catat hasil kirim push)
-- Yang SENGAJA TIDAK DISENTUH: semua tabel dan hak tabel (inbox, langganan_push, order, dan lainnya), data, fungsi lain
--   (inbox_daftar, inbox_terbaru, push_daftar, push_nonaktifkan, fungsi order), pengaturan, dan berkas aplikasi.
--
-- URUTAN AMAN: jalankan migration ini LEBIH DULU, baru deploy `kedai` versi baru. `kedai` yang sedang live hanya mengecek
-- ada galat atau tidak dari `inbox_tulis` dan tidak membaca nilai kembaliannya, jadi tetap jalan setelah migration ini.
-- Bila DROP di bawah gagal karena ada objek lain yang bergantung pada `inbox_tulis`, BERHENTI dan laporkan. Jangan pakai CASCADE.
--
-- Pola keamanan (AGENTS.md bagian 7, security.md aturan 4): SECURITY DEFINER, search_path kosong, `public.` eksplisit,
-- tabel order ditulis public."order", EXECUTE hanya untuk service_role. Tidak ada DELETE.
-- `p_pelaku` HARUS diambil `kedai` dari token login (aturan 2 dan 5).
--
-- PENGECUALIAN TULIS (AGENTS.md blok 11 Nov 2026, DIPERLUAS 13 Nov 2026 oleh keputusan ketua):
--   `inbox_tulis` dan `push_hasil_catat` dipanggil `kedai` SETELAH aksi order berhasil, sebagai panggilan terpisah.
--   Kegagalan keduanya TIDAK membatalkan aksi (IB12, NT4). Berlaku HANYA untuk dua fungsi ini, tidak untuk aksi lain.
--
-- Keputusan yang berlaku (notifikasi.md NT4, NT5, NT9, tabel 4.1; inbox.md IB3, IB14):
--   - Penerima push = penerima inbox, dihitung SEKALI di `inbox_tulis` (tidak ada daftar penerima kedua, IB3, IB14).
--   - Tujuan yang dibawa tiap penerima (dikirim server ke `sw.js`, Handoff #4 notifikasi.md): `order` (membuka detail order),
--     atau `antrean` HANYA untuk penjaga pada kejadian `batal_owner` (pengecualian NT8, order Dibatalkan tidak bisa dibuka penjaga).
--   - Langganan yang mati ditandai `aktif` = false, tidak dihapus (NT5). Waktu dari jam server.
--
-- Bentuk kembalian `inbox_tulis`: array JSON, satu elemen per penerima yang baru ditulis ke inbox:
--   [{ "akun": <uuid>, "teks": <teks umum>, "nomor_order": <angka>, "tujuan": "order" | "antrean" }, ...]
--   Array kosong bila tidak ada penerima. Teks sama dengan teks inbox: umum, tanpa data pribadi (IB4, aturan 16).
--
-- Pilihan penulis (alasan belum tercatat dari ketua; ketua boleh mengubah sebelum dijalankan):
--   1. Kembalian berupa jsonb (array), supaya mudah dibaca `kedai` lewat rpc.
--   2. Id order tidak ikut di kembalian karena `kedai` sudah memegangnya (parameter `orderId` di `tulisInbox`).
--   3. `push_langganan_ambil` mengembalikan endpoint dan dua kunci HANYA untuk dipakai `kedai` mengirim push. Isinya tidak
--      pernah dikirim ke aplikasi dan tidak ditulis di log. Batas satu panggilan 100 akun (galat `daftar_terlalu_panjang`, tidak dipetakan).
--   4. `push_hasil_catat` menerima dua daftar id langganan (berhasil, mati), batas 200 per daftar. Hanya baris yang masih
--      `aktif` yang diubah. Daftar kosong atau null dianggap kosong.
--
-- Kode galat (RAISE EXCEPTION) untuk dipetakan `kedai`:
--   inbox_tulis: id_kosong, kejadian_tidak_dikenal, order_tidak_ditemukan, status_tidak_cocok (tidak dipetakan; hanya log, IB12)
--   push_langganan_ambil: id_kosong, daftar_terlalu_panjang (tidak dipetakan; hanya log, NT4)
--   push_hasil_catat: daftar_terlalu_panjang (tidak dipetakan; hanya log, NT4)

BEGIN;

-- ============================================================
-- 1. inbox_tulis (DIBUAT ULANG): sama dengan versi 20261111_06, kembaliannya kini daftar penerima.
-- ============================================================
DROP FUNCTION public.inbox_tulis(uuid, text, uuid);

CREATE FUNCTION public.inbox_tulis(
  p_pelaku    uuid,
  p_kejadian  text,
  p_order_id  uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_o          public."order"%ROWTYPE;
  v_nomor      text;
  v_t_owner    text;
  v_t_penjaga  text;
  v_t_customer text;
  v_penjaga_ok boolean;
  v_tj_penjaga text;
  v_hasil      jsonb := '[]'::jsonb;
  v_baru       jsonb;
BEGIN
  IF p_pelaku IS NULL OR p_kejadian IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;

  IF p_kejadian NOT IN (
    'order_baru', 'catatan_customer', 'catatan_owner', 'batal_customer', 'batal_owner',
    'setujui', 'tolak', 'status', 'foto_setelah_selesai', 'order_wakil', 'alih_hari'
  ) THEN
    RAISE EXCEPTION 'kejadian_tidak_dikenal';
  END IF;

  SELECT o.*
    INTO v_o
    FROM public."order" o
   WHERE o.id = p_order_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'order_tidak_ditemukan';
  END IF;

  v_nomor := v_o.nomor::text;

  -- Teks dan penerima per kejadian (notifikasi.md 4.1). NULL = kelompok itu tidak dikabari.
  IF p_kejadian = 'order_baru' THEN
    IF v_o.status <> 'Menunggu' THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;
    v_t_owner := 'Ada order baru.';

  ELSIF p_kejadian = 'catatan_customer' THEN
    IF v_o.status NOT IN ('Menunggu', 'Disetujui') THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;
    v_t_owner   := 'Ada catatan baru di order #' || v_nomor || '.';
    v_t_penjaga := v_t_owner;  -- dibuang di bawah bila order masih Menunggu

  ELSIF p_kejadian = 'catatan_owner' THEN
    IF v_o.status NOT IN ('Menunggu', 'Disetujui') THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;
    v_t_customer := 'Ada catatan baru di pesananmu.';
    v_t_penjaga  := 'Ada catatan baru di order #' || v_nomor || '.';  -- dibuang di bawah bila Menunggu

  ELSIF p_kejadian = 'batal_customer' THEN
    IF v_o.status <> 'Dibatalkan' THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;
    v_t_owner := 'Order #' || v_nomor || ' dibatalkan pemesan.';

  ELSIF p_kejadian = 'batal_owner' THEN
    IF v_o.status <> 'Dibatalkan' THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;
    v_t_customer := 'Pesananmu dibatalkan. Buka aplikasi untuk detailnya.';
    v_t_penjaga  := 'Order #' || v_nomor || ' dibatalkan.';

  ELSIF p_kejadian = 'setujui' THEN
    IF v_o.status IN ('Menunggu', 'Ditolak', 'Dibatalkan') THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;
    v_t_customer := 'Pesananmu sudah disetujui.';
    v_t_penjaga  := 'Ada order disetujui.';

  ELSIF p_kejadian = 'tolak' THEN
    IF v_o.status <> 'Ditolak' THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;
    v_t_customer := 'Pesananmu belum bisa diterima. Buka aplikasi untuk detailnya.';

  ELSIF p_kejadian = 'status' THEN
    v_t_customer := CASE v_o.status
      WHEN 'Diproses'       THEN 'Pesananmu sedang diproses.'
      WHEN 'Diantar'        THEN 'Pesananmu sedang diantar.'
      WHEN 'Siap diambil'   THEN 'Pesananmu siap diambil.'
      WHEN 'Siap disajikan' THEN 'Pesananmu siap disajikan.'
      WHEN 'Selesai'        THEN 'Pesananmu selesai. Foto bukti (bila ada) dibuka di aplikasi.'
      ELSE NULL
    END;
    IF v_t_customer IS NULL THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;

  ELSIF p_kejadian = 'foto_setelah_selesai' THEN
    IF v_o.status <> 'Selesai' THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;
    v_t_customer := 'Foto bukti antar sudah tersedia.';

  ELSIF p_kejadian = 'order_wakil' THEN
    IF v_o.pemesan IS NOT NULL OR v_o.status IN ('Menunggu', 'Ditolak', 'Dibatalkan') THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;
    v_t_penjaga := 'Ada order disetujui.';

  ELSIF p_kejadian = 'alih_hari' THEN
    IF v_o.status <> 'Disetujui' THEN
      RAISE EXCEPTION 'status_tidak_cocok';
    END IF;
    v_t_customer := 'Pesananmu dialihkan ke besok. Buka aplikasi untuk detailnya.';
    v_t_penjaga  := 'Order #' || v_nomor || ' dialihkan ke besok.';
  END IF;

  -- O11: penjaga tidak dikabari untuk order Menunggu, Ditolak, Dibatalkan; pengecualian: batal_owner (8 Nov)
  v_penjaga_ok := (p_kejadian = 'batal_owner')
                  OR v_o.status NOT IN ('Menunggu', 'Ditolak', 'Dibatalkan');

  -- Tujuan saat notifikasi ditekan (pengecualian NT8): penjaga pada batal_owner membuka Antrean, selain itu detail order.
  v_tj_penjaga := CASE WHEN p_kejadian = 'batal_owner' THEN 'antrean' ELSE 'order' END;

  -- Owner aktif (pelaku tidak dikabari)
  IF v_t_owner IS NOT NULL THEN
    WITH ins AS (
      INSERT INTO public.inbox (penerima, teks, nomor_order)
      SELECT s.id, v_t_owner, v_o.nomor
        FROM public.staf s
       WHERE s.peran = 'owner'
         AND s.aktif
         AND s.id <> p_pelaku
      RETURNING penerima, teks, nomor_order
    )
    SELECT coalesce(
             jsonb_agg(jsonb_build_object(
               'akun',        ins.penerima,
               'teks',        ins.teks,
               'nomor_order', ins.nomor_order,
               'tujuan',      'order'
             )),
             '[]'::jsonb)
      INTO v_baru
      FROM ins;
    v_hasil := v_hasil || v_baru;
  END IF;

  -- Penjaga aktif (pelaku tidak dikabari)
  IF v_t_penjaga IS NOT NULL AND v_penjaga_ok THEN
    WITH ins AS (
      INSERT INTO public.inbox (penerima, teks, nomor_order)
      SELECT s.id, v_t_penjaga, v_o.nomor
        FROM public.staf s
       WHERE s.peran = 'penjaga'
         AND s.aktif
         AND s.id <> p_pelaku
      RETURNING penerima, teks, nomor_order
    )
    SELECT coalesce(
             jsonb_agg(jsonb_build_object(
               'akun',        ins.penerima,
               'teks',        ins.teks,
               'nomor_order', ins.nomor_order,
               'tujuan',      v_tj_penjaga
             )),
             '[]'::jsonb)
      INTO v_baru
      FROM ins;
    v_hasil := v_hasil || v_baru;
  END IF;

  -- Customer pemilik order (kosong untuk order wakil; pelaku tidak dikabari)
  IF v_t_customer IS NOT NULL
     AND v_o.pemesan IS NOT NULL
     AND v_o.pemesan <> p_pelaku THEN
    INSERT INTO public.inbox (penerima, teks, nomor_order)
    VALUES (v_o.pemesan, v_t_customer, v_o.nomor);
    v_hasil := v_hasil || jsonb_build_array(
      jsonb_build_object(
        'akun',        v_o.pemesan,
        'teks',        v_t_customer,
        'nomor_order', v_o.nomor,
        'tujuan',      'order'
      )
    );
  END IF;

  RETURN v_hasil;
END;
$$;

-- ============================================================
-- 2. push_langganan_ambil: langganan push AKTIF milik daftar akun (hanya membaca).
--    Dipakai `kedai` untuk mengirim push. Isinya tidak pernah dikirim ke aplikasi.
--    Mengembalikan array: [{ id, akun, endpoint, p256dh, auth }, ...] (kosong bila tidak ada).
-- ============================================================
CREATE FUNCTION public.push_langganan_ambil(
  p_akun uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_akun IS NULL THEN
    RAISE EXCEPTION 'id_kosong';
  END IF;
  IF cardinality(p_akun) > 100 THEN
    RAISE EXCEPTION 'daftar_terlalu_panjang';
  END IF;

  RETURN coalesce(
    (
      SELECT jsonb_agg(
               jsonb_build_object(
                 'id',       l.id,
                 'akun',     l.akun,
                 'endpoint', l.endpoint,
                 'p256dh',   l.kunci_p256dh,
                 'auth',     l.kunci_auth
               )
               ORDER BY l.akun, l.dibuat_pada, l.id
             )
        FROM public.langganan_push l
       WHERE l.aktif
         AND l.akun = ANY (p_akun)
    ),
    '[]'::jsonb
  );
END;
$$;

-- ============================================================
-- 3. push_hasil_catat: catat hasil kirim push dalam satu langkah atomik (NT4, NT5).
--    p_berhasil: id langganan yang berhasil dikirimi -> `terakhir_berhasil_pada` = jam server.
--    p_mati    : id langganan yang ditolak push service (mati) -> `aktif` = false (tidak dihapus).
--    Hanya baris yang masih aktif yang diubah. Mengembalikan {diperbarui, dinonaktifkan}.
-- ============================================================
CREATE FUNCTION public.push_hasil_catat(
  p_berhasil uuid[],
  p_mati     uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_b   uuid[] := coalesce(p_berhasil, '{}'::uuid[]);
  v_m   uuid[] := coalesce(p_mati, '{}'::uuid[]);
  v_n1  integer := 0;
  v_n2  integer := 0;
BEGIN
  IF cardinality(v_b) > 200 OR cardinality(v_m) > 200 THEN
    RAISE EXCEPTION 'daftar_terlalu_panjang';
  END IF;

  IF cardinality(v_b) > 0 THEN
    UPDATE public.langganan_push
       SET terakhir_berhasil_pada = now()
     WHERE id = ANY (v_b)
       AND aktif;
    GET DIAGNOSTICS v_n1 = ROW_COUNT;
  END IF;

  IF cardinality(v_m) > 0 THEN
    UPDATE public.langganan_push
       SET aktif = false
     WHERE id = ANY (v_m)
       AND aktif;
    GET DIAGNOSTICS v_n2 = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object('diperbarui', v_n1, 'dinonaktifkan', v_n2);
END;
$$;

-- ============================================================
-- 4. Hak EXECUTE: cabut semua dulu, lalu beri hanya ke service_role (AGENTS.md bagian 7).
--    (inbox_tulis dibuat ulang, jadi haknya harus diberikan ulang.)
-- ============================================================
REVOKE ALL ON FUNCTION public.inbox_tulis(uuid, text, uuid)
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.push_langganan_ambil(uuid[])
  FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.push_hasil_catat(uuid[], uuid[])
  FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.inbox_tulis(uuid, text, uuid)      TO service_role;
GRANT EXECUTE ON FUNCTION public.push_langganan_ambil(uuid[])       TO service_role;
GRANT EXECUTE ON FUNCTION public.push_hasil_catat(uuid[], uuid[])   TO service_role;

COMMIT;
