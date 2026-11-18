// supabase/functions/kedai/belanja.ts
// BLJ.03: aksi Belanja Warung (belanja.md BL1 sampai BL15; security.md aturan 2, 8, 19).
// Tujuh aksi: `belanja_daftar`, `belanja_buat`, `belanja_item_tambah`, `belanja_item_ubah`,
// `belanja_item_batal`, `belanja_judul_ubah`, `belanja_kunci`.
// Berkas BARU, dipanggil dari `index.ts` (satu import, satu blok sambungan, tujuh `case`). Kode lama tidak
// dipindah (keputusan ketua 9 Nov 2026, AGENTS.md bagian 12). Pola sama dengan `ringkasan.ts` dan `order_status.ts`.
//
// Alat bantu (klien database, pembaca peran, pembalas, pemeta galat) DIBERIKAN `index.ts` lewat parameter
// `buatAksiBelanja(alat)`, bukan diimpor, supaya berkas ini tidak mengimpor `index.ts` (yang langsung
// menjalankan server).
//
// Fungsi SQL: supabase/migrations/20261118_03_belanja_fungsi.sql (sudah dijalankan dan lulus 104 dari 104 uji
// SEBELUM berkas ini dideploy; Handoff #2 di belanja.md). Peran owner, kepemilikan, kunci, validasi harga dan nama,
// batas jumlah, dan total SEMUA dicek dan dihitung fungsi SQL (aturan 4, 5, 19). Di sini hanya lapis kedua peran
// owner (BL1), pagar kasar bentuk data, dan pemetaan galat. Tidak ada perhitungan total di sini.
//
// Aplikasi hanya mengirim: id catatan atau id item, judul, dan item berbentuk {nama, harga}. Item DIBANGUN ULANG
// dari dua isian itu saja; isian lain (total, penginput, akun, peran, waktu, status kunci) diabaikan (SEC-06).
// Id akun SELALU dari token login.
//
// Tanpa push, tanpa inbox, tanpa polling (BL15). Tanpa `tulisInbox`.
//
// Kode galat: `id_kosong` dan `pengaturan_rusak` sengaja tidak dipetakan (jadi galat umum 500), sama seperti aksi lain.
// Pesan galat tanpa angka: batasnya ada di `pengaturan`, bukan ditulis mati.

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
};

const PESAN_TIDAK_AKTIF = "Akun ini tidak aktif. Hubungi pengelola.";
const PESAN_HANYA_OWNER = "Aksi ini hanya untuk owner.";
const PESAN_DATA_TIDAK_VALID = "Data belum lengkap atau tidak valid.";

// Pagar kasar jumlah baris item dalam satu kiriman. Batas sebenarnya (`belanja_item_maks`) dicek fungsi SQL.
const BATAS_ITEM_KIRIMAN = 200;

// Semua fungsi Belanja -> status dan pesan aman (AK14).
// PENTING: `galatDariDb` mencocokkan dengan `includes` dan memakai kunci PERTAMA yang cocok.
// `nama_item_tidak_valid` memuat teks `item_tidak_valid`, jadi WAJIB ditaruh SEBELUM `item_tidak_valid`.
const PETA_GALAT_BELANJA: PetaGalat = {
  akun_nonaktif: [403, PESAN_TIDAK_AKTIF],
  peran_tidak_boleh: [403, PESAN_HANYA_OWNER],
  bukan_penginput: [
    403,
    "Catatan ini milik owner lain. Kamu hanya bisa melihatnya.",
  ],
  belanja_tidak_ditemukan: [
    404,
    "Catatan belanja tidak ditemukan. Segarkan daftar.",
  ],
  item_tidak_ditemukan: [404, "Item tidak ditemukan. Segarkan daftar."],
  belanja_terkunci: [
    409,
    "Catatan ini sudah dikunci, jadi tidak bisa diubah lagi.",
  ],
  item_sudah_batal: [409, "Item ini sudah dibatalkan."],
  judul_tidak_valid: [400, "Judul terlalu panjang atau tidak valid."],
  nama_item_tidak_valid: [
    400,
    "Nama item kosong, terlalu panjang, atau tidak valid.",
  ],
  harga_tidak_valid: [
    400,
    "Harga harus angka bulat rupiah, minimal 1, tanpa koma atau minus.",
  ],
  harga_terlalu_besar: [400, "Harga melebihi batas."],
  item_kosong: [400, "Isi minimal satu item."],
  item_tidak_valid: [400, PESAN_DATA_TIDAK_VALID],
  item_terlalu_banyak: [
    409,
    "Jumlah item dalam satu catatan sudah mencapai batas.",
  ],
};

export function buatAksiBelanja(alat: AlatKedai) {
  const { klien, bacaPeran, balas, galat, galatDariDb, regexUuid, batasTeks } =
    alat;

  // Lapis kedua peran owner (BL1): bukan staf aktif berperan owner = 403.
  // Customer, penjaga, dan staf nonaktif ditolak. Fungsi SQL mengecek ulang.
  async function tolakBukanOwner(
    req: Request,
    pengguna: Pengguna,
  ): Promise<Response | null> {
    const p = await bacaPeran(pengguna.id);
    if (p.jenis === "nonaktif") {
      return galat(req, 403, PESAN_TIDAK_AKTIF);
    }
    if (p.jenis !== "staf" || p.peran !== "owner") {
      return galat(req, 403, PESAN_HANYA_OWNER);
    }
    return null;
  }

  // Bentuk satu item kiriman dicek kasar lalu DIBANGUN ULANG: hanya `nama` dan `harga` yang diteruskan.
  // Aturan isi (nama kosong, panjang, harga bulat, minimal 1, batas) dicek fungsi SQL.
  // Mengembalikan null bila bentuknya salah.
  function bacaSatuItem(v: unknown): { nama: string; harga: number } | null {
    if (v === null || typeof v !== "object" || Array.isArray(v)) return null;
    const o = v as Record<string, unknown>;
    if (typeof o.nama !== "string" || o.nama.length > batasTeks) return null;
    if (typeof o.harga !== "number" || !Number.isFinite(o.harga)) return null;
    return { nama: o.nama, harga: o.harga };
  }

  function bacaDaftarItem(
    v: unknown,
  ): { nama: string; harga: number }[] | null {
    if (!Array.isArray(v) || v.length > BATAS_ITEM_KIRIMAN) return null;
    const hasil: { nama: string; harga: number }[] = [];
    for (const e of v) {
      const item = bacaSatuItem(e);
      if (item === null) return null;
      hasil.push(item);
    }
    return hasil;
  }

  // Judul opsional: tidak dikirim atau null = kosong (fungsi SQL mengisi tanggal dan nama penginput, BL5).
  // Mengembalikan undefined bila bentuknya salah.
  function bacaJudul(v: unknown): string | null | undefined {
    if (v === undefined || v === null) return null;
    if (typeof v !== "string" || v.length > batasTeks) return undefined;
    return v;
  }

  // ------------------------------------------------------------
  // Aksi: belanja_daftar (BL11, BL12, BL13)
  // Isian: `terkunci` (boolean, opsional; selain true dianggap tidak). Hanya membaca.
  // Sukses: { ok: true, daftar: { rekap: { total, per_owner }, catatan: [...], terkunci_tampil_maks } }
  // (bentuk dari fungsi SQL, diteruskan apa adanya). Rekap hanya menjumlah catatan belum terkunci
  // (blok catatan 18 Nov 2026 di belanja.md).
  // ------------------------------------------------------------
  async function aksiBelanjaDaftar(
    req: Request,
    pengguna: Pengguna,
    isi: Record<string, unknown>,
  ): Promise<Response> {
    const tolak = await tolakBukanOwner(req, pengguna);
    if (tolak) return tolak;

    const { data, error } = await klien.rpc("belanja_daftar", {
      p_akun: pengguna.id,
      p_terkunci: isi.terkunci === true,
    });
    if (error) {
      return galatDariDb(req, error, PETA_GALAT_BELANJA, "belanja_daftar");
    }

    if (
      data === null ||
      typeof data !== "object" ||
      !Array.isArray(data.catatan) ||
      data.rekap === null ||
      typeof data.rekap !== "object"
    ) {
      throw new Error("belanja_daftar:bentuk_balasan");
    }

    return balas(req, 200, { ok: true, daftar: data });
  }

  // ------------------------------------------------------------
  // Aksi: belanja_buat (BL2, BL5, BL14)
  // Isian: `judul` (opsional) dan `item` (daftar {nama, harga}, minimal satu; dicek fungsi SQL).
  // Sukses: { ok: true, belanja: { id, judul, jumlah_item } }
  // ------------------------------------------------------------
  async function aksiBelanjaBuat(
    req: Request,
    pengguna: Pengguna,
    isi: Record<string, unknown>,
  ): Promise<Response> {
    const tolak = await tolakBukanOwner(req, pengguna);
    if (tolak) return tolak;

    const judul = bacaJudul(isi.judul);
    const item = bacaDaftarItem(isi.item);
    if (judul === undefined || item === null) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }

    const { data, error } = await klien.rpc("belanja_buat", {
      p_akun: pengguna.id,
      p_judul: judul,
      p_item: item,
    });
    if (error) {
      return galatDariDb(req, error, PETA_GALAT_BELANJA, "belanja_buat");
    }

    return balas(req, 200, { ok: true, belanja: data });
  }

  // ------------------------------------------------------------
  // Aksi: belanja_item_tambah (BL2 mencicil)
  // Isian: `id` (catatan) dan `item` (daftar {nama, harga}). Kepemilikan dan kunci dicek fungsi SQL (SEC-09).
  // Sukses: { ok: true, belanja: { id, jumlah_item } }
  // ------------------------------------------------------------
  async function aksiBelanjaItemTambah(
    req: Request,
    pengguna: Pengguna,
    isi: Record<string, unknown>,
  ): Promise<Response> {
    const tolak = await tolakBukanOwner(req, pengguna);
    if (tolak) return tolak;

    if (typeof isi.id !== "string" || !regexUuid.test(isi.id)) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }
    const item = bacaDaftarItem(isi.item);
    if (item === null) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }

    const { data, error } = await klien.rpc("belanja_item_tambah", {
      p_akun: pengguna.id,
      p_belanja_id: isi.id,
      p_item: item,
    });
    if (error) {
      return galatDariDb(req, error, PETA_GALAT_BELANJA, "belanja_item_tambah");
    }

    return balas(req, 200, { ok: true, belanja: data });
  }

  // ------------------------------------------------------------
  // Aksi: belanja_item_ubah (BL7)
  // Isian: `id` (item), `nama`, dan `harga` (keduanya wajib, dikirim sekaligus).
  // Sukses: { ok: true, item: { id, nama, harga } }
  // ------------------------------------------------------------
  async function aksiBelanjaItemUbah(
    req: Request,
    pengguna: Pengguna,
    isi: Record<string, unknown>,
  ): Promise<Response> {
    const tolak = await tolakBukanOwner(req, pengguna);
    if (tolak) return tolak;

    if (typeof isi.id !== "string" || !regexUuid.test(isi.id)) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }
    const item = bacaSatuItem({ nama: isi.nama, harga: isi.harga });
    if (item === null) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }

    const { data, error } = await klien.rpc("belanja_item_ubah", {
      p_akun: pengguna.id,
      p_item_id: isi.id,
      p_item: item,
    });
    if (error) {
      return galatDariDb(req, error, PETA_GALAT_BELANJA, "belanja_item_ubah");
    }

    return balas(req, 200, { ok: true, item: data });
  }

  // ------------------------------------------------------------
  // Aksi: belanja_item_batal (BL8)
  // Isian: `id` (item). Satu arah: item Dibatalkan tidak bisa diaktifkan lagi.
  // Sukses: { ok: true, item: { id } }
  // ------------------------------------------------------------
  async function aksiBelanjaItemBatal(
    req: Request,
    pengguna: Pengguna,
    isi: Record<string, unknown>,
  ): Promise<Response> {
    const tolak = await tolakBukanOwner(req, pengguna);
    if (tolak) return tolak;

    if (typeof isi.id !== "string" || !regexUuid.test(isi.id)) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }

    const { data, error } = await klien.rpc("belanja_item_batal", {
      p_akun: pengguna.id,
      p_item_id: isi.id,
    });
    if (error) {
      return galatDariDb(req, error, PETA_GALAT_BELANJA, "belanja_item_batal");
    }

    return balas(req, 200, { ok: true, item: data });
  }

  // ------------------------------------------------------------
  // Aksi: belanja_judul_ubah (BL5, BL7)
  // Isian: `id` (catatan) dan `judul` (boleh kosong; fungsi SQL mengisi tanggal dan nama penginput).
  // Sukses: { ok: true, belanja: { id, judul } }
  // ------------------------------------------------------------
  async function aksiBelanjaJudulUbah(
    req: Request,
    pengguna: Pengguna,
    isi: Record<string, unknown>,
  ): Promise<Response> {
    const tolak = await tolakBukanOwner(req, pengguna);
    if (tolak) return tolak;

    if (typeof isi.id !== "string" || !regexUuid.test(isi.id)) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }
    const judul = bacaJudul(isi.judul);
    if (judul === undefined) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }

    const { data, error } = await klien.rpc("belanja_judul_ubah", {
      p_akun: pengguna.id,
      p_belanja_id: isi.id,
      p_judul: judul,
    });
    if (error) {
      return galatDariDb(req, error, PETA_GALAT_BELANJA, "belanja_judul_ubah");
    }

    return balas(req, 200, { ok: true, belanja: data });
  }

  // ------------------------------------------------------------
  // Aksi: belanja_kunci (BL9, BL10)
  // Isian: `id` (catatan). Kunci SATU ARAH; membukanya hanya oleh ketua di SQL Editor.
  // Sukses: { ok: true, belanja: { id, dikunci_pada } }
  // ------------------------------------------------------------
  async function aksiBelanjaKunci(
    req: Request,
    pengguna: Pengguna,
    isi: Record<string, unknown>,
  ): Promise<Response> {
    const tolak = await tolakBukanOwner(req, pengguna);
    if (tolak) return tolak;

    if (typeof isi.id !== "string" || !regexUuid.test(isi.id)) {
      return galat(req, 400, PESAN_DATA_TIDAK_VALID);
    }

    const { data, error } = await klien.rpc("belanja_kunci", {
      p_akun: pengguna.id,
      p_belanja_id: isi.id,
    });
    if (error) {
      return galatDariDb(req, error, PETA_GALAT_BELANJA, "belanja_kunci");
    }

    return balas(req, 200, { ok: true, belanja: data });
  }

  return {
    aksiBelanjaDaftar,
    aksiBelanjaBuat,
    aksiBelanjaItemTambah,
    aksiBelanjaItemUbah,
    aksiBelanjaItemBatal,
    aksiBelanjaJudulUbah,
    aksiBelanjaKunci,
  };
}
