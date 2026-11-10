// supabase/functions/kedai/bantuan.ts
// BTN.02: aksi `bantuan_daftar` (bantuan.md BT5, BT8, BT9; security.md aturan 2, 10, 21; SEC-31).
// Berkas BARU, dipanggil dari `index.ts` (satu import, satu sambungan, satu `case`). Kode lama tidak dipindah
// (keputusan ketua 9 Nov 2026). Alat bantu diberikan `index.ts` lewat parameter `buatAksiBantuan(alat)`,
// bukan diimpor, supaya berkas ini tidak mengimpor `index.ts` (yang langsung menjalankan server).
//
// Aksi ini HANYA MEMBACA tabel `bantuan` (hak `service_role` di tabel itu memang hanya SELECT).
// Tidak ada fungsi SQL baru dan tidak ada migration: ini bacaan murni, tanpa langkah bisnis yang perlu atomik
// (pilihan penulis; alasan belum tercatat dari ketua).
//
// Siapa: semua yang login. Akun staf nonaktif dibalas 403.
// Penyaringan peran dilakukan DI SINI dari tabel `staf` (lewat `bacaPeran`): ada baris staf aktif = peran itu
// (owner atau penjaga), tidak ada baris = customer. Peran, id, atau isian apa pun dari aplikasi DIABAIKAN
// (aturan 2, SEC-31): aksi ini tidak membaca isi permintaan sama sekali.
// Yang dikirim: isi berstatus aktif dengan peran `semua` ditambah isi yang sesuai peran pemanggil,
// urut `urutan` lalu `kunci`. Hanya kolom kunci, bagian, urutan, judul, isi (tanpa id dan waktu).
// Pengelompokan per `bagian` dikerjakan layar (BTN.03), bukan server.
// Teks apa adanya dari tabel; layar menampilkannya lewat `textContent` (BT4, aturan 10).

// Bentuk yang sama dengan `Pengguna` dan `Peran` di index.ts.
type Pengguna = { id: string };
type Peran =
  | { jenis: "staf"; peran: string; nama: string }
  | { jenis: "nonaktif" }
  | { jenis: "customer" };

// Bagian klien database yang dipakai: hanya `from` (baca). Bentuk dibuat longgar karena
// klien asli milik supabase-js; hanya rantai select/eq/in/order yang dipakai di sini.
// deno-lint-ignore no-explicit-any
type KlienDb = { from: (tabel: string) => any };

export type AlatBantuan = {
  klien: KlienDb;
  bacaPeran: (id: string) => Promise<Peran>;
  balas: (req: Request, status: number, isi: unknown) => Response;
  galat: (req: Request, status: number, pesan: string) => Response;
};

const PESAN_TIDAK_AKTIF = "Akun ini tidak aktif. Hubungi pengelola.";

export function buatAksiBantuan(alat: AlatBantuan) {
  const { klien, bacaPeran, balas, galat } = alat;

  async function aksiBantuanDaftar(
    req: Request,
    pengguna: Pengguna,
  ): Promise<Response> {
    const p = await bacaPeran(pengguna.id);
    if (p.jenis === "nonaktif") {
      return galat(req, 403, PESAN_TIDAK_AKTIF);
    }

    // Peran isi ditentukan server: staf aktif = peran stafnya, selain itu customer.
    const peranIsi = p.jenis === "staf" ? p.peran : "customer";

    const { data, error } = await klien
      .from("bantuan")
      .select("kunci, bagian, urutan, judul, isi")
      .eq("aktif", true)
      .in("peran", ["semua", peranIsi])
      .order("urutan", { ascending: true })
      .order("kunci", { ascending: true });
    if (error) throw new Error("bantuan_daftar:" + (error.code ?? ""));

    return balas(req, 200, {
      ok: true,
      bantuan: Array.isArray(data) ? data : [],
    });
  }

  return { aksiBantuanDaftar };
}
