// supabase/functions/kedai/kirim_push.ts
// NTF.06 (tahap 1): pengirim push (notifikasi.md NT2, NT4, NT8, NT9; security.md aturan 16, SEC-22).
// Berkas BARU, dipakai oleh `inbox.ts` (lewat `tulisInbox`), bukan oleh `index.ts`. Kode lama tidak dipindah.
//
// Cara kerja (satu kali coba, tanpa antrean dan tanpa percobaan ulang, NT4):
//   1. `tulisInbox` sudah menulis inbox dan menerima daftar penerima dari fungsi SQL `inbox_tulis`
//      (penerima dihitung di sana, tidak dihitung dua kali, IB14).
//   2. Berkas ini mengambil langganan aktif penerima lewat `push_langganan_ambil`.
//   3. Tiap langganan dikirimi push lewat pustaka `web-push` (versi dipatok 3.6.7).
//   4. Hasilnya dicatat lewat `push_hasil_catat`: berhasil -> `terakhir_berhasil_pada`; ditolak push service
//      (404 atau 410) -> langganan dinonaktifkan (tanpa DELETE).
//
// Kegagalan APA PUN tidak dilempar dan tidak membatalkan aksi order (NT4).
//
// Rahasia dibaca dari variabel lingkungan fungsi: VAPID_PUBLIK, VAPID_PRIVAT, VAPID_KONTAK. Tidak ada rahasia di kode.
// Isi langganan (endpoint dan kunci) dan isi push TIDAK ditulis di log. Log hanya berisi nama kejadian dan angka.
//
// Isi push (kontrak dengan sw.js, notifikasi.md Handoff #4): JSON kecil
//   { judul, isi, nomor (opsional), tujuan ("order" atau "antrean"), id (opsional, id order) }
// Teks isi berasal dari fungsi SQL (sama dengan teks inbox): umum, tanpa data pribadi (NT2, aturan 16).
//
// KEJADIAN_PUSH_AKTIF: daftar kejadian yang sudah dipasang pengirim. Tahap 1 hanya `order_baru`;
// tahap 2 menambah `setujui` dan `tolak`.
// Kejadian lain ditambah bertahap (cukup menambah nama di daftar ini, lalu deploy ulang).
// NTF.06 tahap 3 (keputusan ketua, 13 Nov 2026): semua kejadian lain ditambah sekaligus KECUALI `batal_owner`
// (penjaga yang menekan push batal harus membuka Antrean; belum dites dengan akun penjaga, jadi ditahan).
// Kejadian tahap 3 dirilis tanpa tes satu per satu; dipantau lewat log `kedai push:`.
// NTF.06 tahap 4 (keputusan ketua, 13 Nov 2026, via PIC RAC): `batal_owner` ditambah. Ketua: tidak perlu tes untuk
// semua aksi, tes cukup di bagian yang berubah. Sisi penjaga (tekan push batal membuka Antrean) belum teruji karena
// belum ada langganan penjaga aktif.

type Penerima = {
  akun: string;
  teks: string;
  nomor_order: number | null;
  tujuan: string;
};

// Bagian klien database yang dipakai: hanya `rpc`.
// deno-lint-ignore no-explicit-any
type KlienDb = {
  rpc: (
    nama: string,
    argumen: Record<string, unknown>,
  ) => PromiseLike<{ data: any; error: any }>;
};

type Langganan = {
  id: string;
  akun: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

// NTF.06 tahap 2: `setujui` dan `tolak` ditambah (penerima dan teks dari fungsi SQL `inbox_tulis`, tabel 4.1).
// Tahap 2 (versi lama): const KEJADIAN_PUSH_AKTIF = new Set<string>(["order_baru", "setujui", "tolak"]);
// Tahap 3: `batal_owner` sengaja belum ada (tunggu tes penjaga). Menambahkannya = cukup tambah nama di sini lalu deploy ulang.
// Tahap 4: `batal_owner` kini ada di daftar (lihat catatan kepala berkas).
const KEJADIAN_PUSH_AKTIF = new Set<string>([
  "order_baru",
  "setujui",
  "tolak",
  "status",
  "catatan_customer",
  "catatan_owner",
  "batal_customer",
  "batal_owner",
  "alih_hari",
  "foto_setelah_selesai",
  "order_wakil",
]);

const REGEX_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const JUDUL_PUSH = "Kedai ChATA";
// Push yang tidak sempat diterima HP dalam waktu ini dibuang push service (detik).
const TTL_DETIK = 3600;
// Batas tunggu satu pengiriman (milidetik).
const BATAS_TUNGGU_MS = 8000;
// Pagar jumlah, sama dengan batas fungsi SQL.
const BATAS_AKUN = 100;
const BATAS_ID_HASIL = 200;

function kontakVapid(mentah: string): string {
  const k = mentah.trim();
  if (/^(mailto:|https:\/\/)/i.test(k)) return k;
  return "mailto:" + k;
}

export function buatPengirimPush(alat: { klien: KlienDb }) {
  const { klien } = alat;

  function kejadianAktif(kejadian: string): boolean {
    return KEJADIAN_PUSH_AKTIF.has(kejadian);
  }

  // Dipanggil SETELAH inbox berhasil ditulis. Tidak pernah melempar galat.
  async function kirimPush(
    kejadian: string,
    orderId: string,
    penerimaMentah: unknown,
  ): Promise<void> {
    try {
      if (!KEJADIAN_PUSH_AKTIF.has(kejadian)) return;
      if (!Array.isArray(penerimaMentah) || penerimaMentah.length === 0) return;

      // Rahasia VAPID harus lengkap; bila tidak, push dilewati (order tetap jalan).
      const publik = Deno.env.get("VAPID_PUBLIK") ?? "";
      const privat = Deno.env.get("VAPID_PRIVAT") ?? "";
      const kontak = Deno.env.get("VAPID_KONTAK") ?? "";
      if (!publik || !privat || !kontak) {
        console.error("kedai push: rahasia VAPID tidak lengkap |", kejadian);
        return;
      }

      // Rapikan daftar penerima: satu elemen per akun, hanya yang bentuknya benar.
      const peta = new Map<string, Penerima>();
      for (const e of penerimaMentah) {
        if (e === null || typeof e !== "object") continue;
        const p = e as Record<string, unknown>;
        if (typeof p.akun !== "string" || !REGEX_UUID.test(p.akun)) continue;
        if (typeof p.teks !== "string" || p.teks.length === 0) continue;
        const nomor =
          typeof p.nomor_order === "number" &&
          Number.isSafeInteger(p.nomor_order)
            ? p.nomor_order
            : null;
        peta.set(p.akun, {
          akun: p.akun,
          teks: p.teks,
          nomor_order: nomor,
          tujuan: p.tujuan === "antrean" ? "antrean" : "order",
        });
      }
      if (peta.size === 0) return;
      const daftarAkun = [...peta.keys()].slice(0, BATAS_AKUN);

      // Ambil langganan aktif penerima.
      const { data: langgananMentah, error: eAmbil } = await klien.rpc(
        "push_langganan_ambil",
        { p_akun: daftarAkun },
      );
      if (eAmbil) {
        console.error(
          "kedai push: ambil langganan gagal |",
          kejadian,
          "|",
          String(eAmbil.code ?? ""),
        );
        return;
      }
      if (!Array.isArray(langgananMentah) || langgananMentah.length === 0) {
        console.log("kedai push: tanpa langganan aktif |", kejadian);
        return;
      }

      // Muat pustaka di sini (dalam try/catch): bila gagal, hanya push yang mati, aksi lain tetap jalan.
      // deno-lint-ignore no-explicit-any
      let webpush: any;
      try {
        const modul = await import("npm:web-push@3.6.7");
        webpush = modul.default ?? modul;
      } catch (_e) {
        console.error("kedai push: pustaka web-push gagal dimuat |", kejadian);
        return;
      }
      const opsiVapid = {
        subject: kontakVapid(kontak),
        publicKey: publik,
        privateKey: privat,
      };

      const berhasil: string[] = [];
      const mati: string[] = [];
      let gagal = 0;

      const tugas = (langgananMentah as Langganan[]).map(async (l) => {
        const penerima = peta.get(l.akun);
        if (
          !penerima ||
          typeof l.id !== "string" ||
          typeof l.endpoint !== "string" ||
          typeof l.p256dh !== "string" ||
          typeof l.auth !== "string"
        ) {
          return;
        }

        // Isi push: id order hanya untuk tujuan "order"; tujuan "antrean" tanpa id.
        const isiPush: Record<string, unknown> = {
          judul: JUDUL_PUSH,
          isi: penerima.teks,
          tujuan: penerima.tujuan,
        };
        if (penerima.nomor_order !== null) isiPush.nomor = penerima.nomor_order;
        if (penerima.tujuan === "order" && REGEX_UUID.test(orderId)) {
          isiPush.id = orderId;
        }

        try {
          await webpush.sendNotification(
            {
              endpoint: l.endpoint,
              keys: { p256dh: l.p256dh, auth: l.auth },
            },
            JSON.stringify(isiPush),
            {
              TTL: TTL_DETIK,
              urgency: "normal",
              timeout: BATAS_TUNGGU_MS,
              vapidDetails: opsiVapid,
            },
          );
          berhasil.push(l.id);
        } catch (e) {
          const kode = (e as { statusCode?: number }).statusCode;
          if (kode === 404 || kode === 410) {
            mati.push(l.id);
          } else {
            gagal++;
          }
        }
      });
      await Promise.all(tugas);

      // Catat hasil (pengecualian tulis-database, AGENTS.md blok 13 Nov 2026). Kegagalan hanya dicatat di log.
      if (berhasil.length > 0 || mati.length > 0) {
        const { error: eCatat } = await klien.rpc("push_hasil_catat", {
          p_berhasil: berhasil.slice(0, BATAS_ID_HASIL),
          p_mati: mati.slice(0, BATAS_ID_HASIL),
        });
        if (eCatat) {
          console.error(
            "kedai push: catat hasil gagal |",
            kejadian,
            "|",
            String(eCatat.code ?? ""),
          );
        }
      }

      console.log(
        "kedai push:",
        kejadian,
        "| terkirim",
        berhasil.length,
        "| mati",
        mati.length,
        "| gagal",
        gagal,
      );
    } catch (_e) {
      console.error("kedai push: galat tak terduga |", kejadian);
    }
  }

  return { kirimPush, kejadianAktif };
}
