// supabase/functions/kedai/order_wakil.ts
// ORD.12 (giliran 2): aksi `order_buat_wakil` (order wakil owner untuk pelanggan tanpa akun, order.md O15). Hanya owner.
// Berkas BARU, dipanggil dari `index.ts` (satu import, satu blok sambungan, satu `case`). Kode lama tidak dipindah
// (keputusan ketua 9 Nov 2026, AGENTS.md bagian 12). Pola sama dengan `order_status.ts`, `catatan.ts`, `pelanggan_luar.ts`.
//
// Alat bantu (klien database, pembalas, pemeta galat, pembaca peran, pembaca item kiriman, peta galat order) DIBERIKAN
// `index.ts` lewat parameter `buatAksiOrderWakil(alat)`, bukan diimpor, supaya berkas ini tidak mengimpor `index.ts`
// (yang langsung menjalankan server). `bacaItemKiriman` dan `PETA_GALAT_ORDER` dipakai ulang dari `index.ts`
// (sama seperti `order_buat`), tidak ditulis ulang di sini.
//
// Fungsi SQL: supabase/migrations/20261110_06_order_wakil_fungsi.sql (sudah dijalankan dan lulus cek SEBELUM berkas ini
// dideploy). Peran, pelanggan (ada dan aktif), menu, harga, pilihan, batas item, hari, jam, metode bayar, dan alamat
// dicek ulang di fungsi SQL (aturan 4, 8, 19); di sini hanya pagar kasar dan lapis kedua peran.
//
// Aplikasi hanya mengirim: `pelanggan_id`, `tipe`, `alamat` (opsional), `hari` ("Hari ini" atau "Besok"), `jam`,
// `item` (id menu, jumlah, id opsi), dan `metode` (Transfer, Tunai, QRIS). Id akun selalu dari token login. Harga, total,
// status, peran, pemutus, `dibuat_oleh`, dan isian lain diabaikan (SEC-06): item dibangun ulang hanya dari tiga isian
// yang sah, dan isian lain tidak pernah diteruskan ke fungsi SQL.
//
// Alamat (keputusan ketua 10 Nov 2026): untuk tipe Diantar, alamat kiriman dipakai untuk order ini saja; bila tidak
// dikirim, fungsi SQL memakai alamat tersimpan pelanggan; bila tidak ada keduanya: `alamat_wajib`. Alamat tersimpan
// pelanggan tidak pernah berubah lewat aksi ini.
//
// Push tidak ada di sini (NTF). Order wakil tidak mengirim push ke pemesan (tidak punya akun); push ke penjaga ada di NTF.
// Data pribadi (nama, nomor WA, alamat): tidak ditulis ke log dan tidak dimuat di pesan galat.
// Kode galat `id_kosong`, `pengaturan_rusak`, dan `total_terlalu_besar` sengaja tidak dipetakan (jadi galat umum 500),
// sama seperti aksi order lain.
//
// INB.04 (giliran 4): `tulisInbox` (dari `inbox.ts`) dioper lewat alat bantu dan dipanggil SETELAH `order_buat_wakil` berhasil,
// untuk kejadian `order_wakil`. Penerima dihitung fungsi SQL (notifikasi.md 4.1): penjaga saja. Pemesan tanpa akun tidak
// punya inbox, dan owner pembuat (pelaku, id dari token) tidak dikabari atas aksinya sendiri. Id order diambil dari balasan
// fungsi SQL; bila tidak ada, pemanggilan dilewati dan dicatat di log. Kegagalan menulis inbox tidak membatalkan aksi dan
// tidak mengubah balasan (inbox.md IB12); `tulisInbox` sendiri tidak pernah melempar galat.

// Bentuk yang sama dengan `Pengguna` dan `Peran` di index.ts.
type Pengguna = { id: string };
type Peran =
  | { jenis: "staf"; peran: string; nama: string }
  | { jenis: "nonaktif" }
  | { jenis: "customer" };

// Bagian klien database yang dipakai: hanya `rpc`.
// deno-lint-ignore no-explicit-any
type KlienDb = {
  rpc: (
    nama: string,
    argumen: Record<string, unknown>,
  ) => PromiseLike<{ data: any; error: any }>;
};

type PetaGalat = Record<string, [number, string]>;

// Bentuk item kiriman yang sudah dibangun ulang oleh `bacaItemKiriman` di index.ts.
type ItemKiriman = { menu_id: string; jumlah: number; opsi_ids: string[] };

export type AlatKedai = {
  klien: KlienDb;
  bacaPeran: (id: string) => Promise<Peran>;
  balas: (req: Request, status: number, isi: unknown) => Response;
  galat: (req: Request, status: number, pesan: string) => Response;
  galatDariDb: (
    req: Request,
    error: { message?: string; code?: string },
    peta: PetaGalat,
    nama: string,
  ) => Response;
  regexUuid: RegExp;
  batasTeks: number;
  bacaItemKiriman: (v: unknown) => ItemKiriman[] | null;
  petaGalatOrder: PetaGalat;
  // INB.04 giliran 4: penulis Kotak masuk (tidak pernah melempar galat).
  tulisInbox: (
    pelaku: string,
    kejadian: string,
    orderId: string,
  ) => Promise<void>;
};

const PESAN_TIDAK_AKTIF = "Akun ini tidak aktif. Hubungi pengelola.";
const PESAN_HANYA_OWNER = "Aksi ini hanya untuk owner.";
const PESAN_DATA_TIDAK_VALID = "Data belum lengkap atau tidak valid.";

export function buatAksiOrderWakil(alat: AlatKedai) {
  const {
    klien,
    bacaPeran,
    balas,
    galat,
    galatDariDb,
    regexUuid,
    batasTeks,
    bacaItemKiriman,
    petaGalatOrder,
    tulisInbox,
  } = alat;

  // order_buat_wakil -> status dan pesan aman (AK14). Dasarnya peta galat order (menu, pilihan, item, jumlah, hari,
  // jam, tipe); yang khusus order wakil ditambah atau menimpa pesan yang sama kodenya.
  // (id_kosong, pengaturan_rusak, dan total_terlalu_besar sengaja tidak dipetakan: jadi galat umum 500.)
  const PETA_GALAT_ORDER_WAKIL: PetaGalat = {
    ...petaGalatOrder,
    akun_nonaktif: [403, PESAN_TIDAK_AKTIF],
    peran_tidak_boleh: [403, PESAN_HANYA_OWNER],
    metode_tidak_valid: [
      400,
      "Pilih metode bayar: Transfer, Tunai, atau QRIS.",
    ],
    pelanggan_tidak_ditemukan: [
      404,
      "Pelanggan tidak ditemukan. Segarkan daftar pelanggan.",
    ],
    pelanggan_tidak_aktif: [
      409,
      "Pelanggan ini sudah tidak aktif. Aktifkan lagi di daftar pelanggan atau pilih pelanggan lain.",
    ],
    alamat_wajib: [400, "Alamat antar wajib diisi."],
    alamat_tidak_valid: [400, "Alamat antar harus 10 sampai 200 karakter."],
  };

  // ------------------------------------------------------------
  // Aksi: order_buat_wakil (order.md O15; security.md SEC-06, SEC-07, SEC-08, SEC-13, SEC-18, SEC-19)
  // Hanya owner aktif (lapis kedua; fungsi SQL mengecek ulang). Customer dan penjaga dibalas 403.
  // Isian: `pelanggan_id` (wajib, uuid), `tipe` (wajib), `alamat` (opsional; teks atau null), `hari` (wajib),
  // `jam` (wajib), `item` (wajib; daftar {menu_id, jumlah, opsi_ids?}), `metode` (wajib).
  // Sukses: { ok: true, order: { id, nomor, status, total, hari_target, jam_permintaan, metode_bayar } }.
  // Order langsung Disetujui; pemutus dan "Dibuat oleh" adalah owner pemanggil (dari token).
  // ------------------------------------------------------------
  async function aksiOrderBuatWakil(
    req: Request,
    pengguna: Pengguna,
    isi: Record<string, unknown>,
  ): Promise<Response> {
    // Lapis kedua peran: hanya owner aktif (SEC-07 untuk customer, SEC-13 dan SEC-08 untuk customer dan penjaga).
    const p = await bacaPeran(pengguna.id);
    if (p.jenis === "nonaktif") {
      return galat(req, 403, PESAN_TIDAK_AKTIF);
    }
    if (p.jenis !== "staf" || p.peran !== "owner") {
      return galat(req, 403, PESAN_HANYA_OWNER);
    }

    // Id pelanggan dari aplikasi tidak dipercaya: fungsi SQL mengecek keberadaan dan status aktifnya.
    if (
      typeof isi.pelanggan_id !== "string" ||
      !regexUuid.test(isi.pelanggan_id)
    ) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }

    // Tipe, hari, dan jam wajib teks; nilai yang sah dicek fungsi SQL (hari dan jam dihitung server, aturan 6).
    if (
      typeof isi.tipe !== "string" ||
      isi.tipe.length > batasTeks ||
      typeof isi.hari !== "string" ||
      isi.hari.length > batasTeks ||
      typeof isi.jam !== "string" ||
      isi.jam.length > batasTeks
    ) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }

    // Item dibangun ulang: hanya menu_id, jumlah, dan opsi_ids yang diteruskan (SEC-06).
    const item = bacaItemKiriman(isi.item);
    if (item === null) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }

    // Metode bayar wajib; nilai yang sah dicek fungsi SQL (Transfer, Tunai, QRIS; SEC-11).
    if (typeof isi.metode !== "string" || isi.metode.length > batasTeks) {
      return galat(req, 400, PETA_GALAT_ORDER_WAKIL.metode_tidak_valid[1]);
    }

    // Alamat: boleh tidak dikirim (null). Bila dikirim, dipakai untuk order ini saja; panjang sebenarnya
    // (10 sampai 200) dicek fungsi SQL, di sini hanya pagar kasar.
    let alamat: string | null = null;
    if (isi.alamat !== undefined && isi.alamat !== null) {
      if (typeof isi.alamat !== "string" || isi.alamat.length > batasTeks) {
        return galat(req, 400, PETA_GALAT_ORDER_WAKIL.alamat_tidak_valid[1]);
      }
      alamat = isi.alamat;
    }

    const { data, error } = await klien.rpc("order_buat_wakil", {
      p_akun: pengguna.id,
      p_pelanggan_id: isi.pelanggan_id,
      p_tipe: isi.tipe,
      p_alamat: alamat,
      p_hari: isi.hari,
      p_jam: isi.jam,
      p_item: item,
      p_metode: isi.metode,
    });
    if (error) {
      return galatDariDb(
        req,
        error,
        PETA_GALAT_ORDER_WAKIL,
        "order_buat_wakil",
      );
    }

    // INB.04: kabar ke Kotak masuk (penjaga). Id order dari balasan fungsi SQL; bila tidak ada, dilewati dan dicatat di log.
    // Kegagalan tidak membatalkan order wakil dan tidak mengubah balasan (IB12).
    if (
      data !== null &&
      typeof data === "object" &&
      typeof data.id === "string" &&
      regexUuid.test(data.id)
    ) {
      await tulisInbox(pengguna.id, "order_wakil", data.id);
    } else {
      console.error(
        "kedai inbox: id order tidak ada di balasan order_buat_wakil",
      );
    }

    return balas(req, 200, { ok: true, order: data });
  }

  return { aksiOrderBuatWakil };
}
