// supabase/functions/kedai/kirim_wa.ts
// WAG.05: pengirim notifikasi WhatsApp lewat gateway lokal (wa-notif.md WAG02 sampai WAG07, WAG13; Handoff #3 dan #4).
// Berkas BARU, dipakai oleh `inbox.ts` (lewat `tulisInbox`), bukan oleh `index.ts`. Kode lama tidak dipindah.
//
// Sifat fitur: sementara, pelengkap push dan Kotak masuk, "tembak dan lupakan". Kegagalan APA PUN tidak dilempar dan
// tidak membatalkan, menunda, atau mengubah aksi order (WAG02, WAG09). Fungsi `kirimWa` tidak pernah melempar galat.
//
// Cara kerja:
//   1. `tulisInbox` sudah menulis inbox dan menerima daftar penerima dari `inbox_tulis` (penerima TIDAK dihitung ulang).
//   2. Hanya 4 kejadian WAG07 yang boleh kirim WA:
//        - `order_baru`  -> owner
//        - `setujui`     -> customer pemilik dan penjaga
//        - `status`      -> customer, HANYA bila status tujuan Diantar, Siap diambil, atau Siap disajikan
//      Kejadian lain (tolak, catatan, batal, alih hari, foto, order wakil, Diproses, Selesai) tidak mengirim WA.
//   3. Status tujuan untuk kejadian `status` dibaca dari TEKS penerima yang dikembalikan `inbox_tulis` (database yang
//      membuat teks itu dari status order saat itu). Hanya tiga teks di STATUS_WA di bawah yang dikenal; teks lain
//      (termasuk Diproses dan Selesai) dilewati. Bila teks di SQL suatu saat diubah, WA hanya berhenti terkirim (aman).
//   4. Nomor diambil lewat fungsi SQL baca-saja `wa_nomor_ambil` (WAG12). Nomor TIDAK ditulis di log dan tidak dikirim ke aplikasi.
//   5. Urutan kirim: customer dulu, baru staf (WAG13). Satu per satu, timeout 3 detik per permintaan (WAG03).
//      Bila satu pengiriman gagal (timeout, gateway tidak terjangkau, atau balasan selain 202), sisa penerima kejadian
//      itu DILEWATI (WAG13).
//   6. Isi pesan hanya kalimat kejadian. Footer ("jangan dibalas") dan link aplikasi ditambah gateway (Handoff #3).
//
// Gateway (Handoff #4): POST <WA_GATEWAY_URL>/send-message, header `x-api-key`, `Content-Type: application/json`,
// `ngrok-skip-browser-warning: true`; isi hanya `number` (628xxx) dan `message`. 202 = diterima antrean = sukses;
// 400, 401, 413, 429, 503, dan timeout = gagal.
//
// Rahasia dibaca dari variabel lingkungan fungsi: WA_GATEWAY_URL dan WA_GATEWAY_API_KEY. Bila salah satu kosong,
// fitur dilewati diam-diam (cara mematikan tanpa deploy, WAG04, WAG20). Tidak ada rahasia di kode. URL dan key tidak ditulis di log.
// Log hanya berisi nama kejadian dan angka.
//
// Timeout 3 detik tetap di kode (pengecualian "angka di database", AGENTS.md blok 14 Nov 2026).

// Bentuk penerima yang dikembalikan `inbox_tulis`.
type Penerima = {
  akun: string;
  teks: string;
  nomor_order: number | null;
};

type NomorWa = { akun: string; peran: string; nomor: string };

// Bagian klien database yang dipakai: hanya `rpc`.
// deno-lint-ignore no-explicit-any
type KlienDb = {
  rpc: (
    nama: string,
    argumen: Record<string, unknown>,
  ) => PromiseLike<{ data: any; error: any }>;
};

// 4 kejadian WAG07 (kejadian `status` disaring lagi menurut status tujuan).
const KEJADIAN_WA = new Set<string>(["order_baru", "setujui", "status"]);

// Teks penerima customer dari `inbox_tulis` untuk kejadian `status` -> potongan kalimat WA.
// Hanya tiga status yang boleh kirim WA (WAG07). Diproses dan Selesai sengaja tidak ada di sini.
const STATUS_WA: Record<string, string> = {
  "Pesananmu sedang diantar.": "sedang diantar",
  "Pesananmu siap diambil.": "siap diambil",
  "Pesananmu siap disajikan.": "siap disajikan",
};

const AWALAN = "Kedai ChATA: ";
const TIMEOUT_MS = 3000;
const BATAS_AKUN = 100;

const REGEX_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Sama dengan pagar database dan gateway.
const REGEX_NOMOR = /^628[0-9]{8,11}$/;

// Kalimat per kejadian dan peran (wa-notif.md 4.1). null = tidak dikirim.
function buatKalimat(
  kejadian: string,
  peran: string,
  penerima: Penerima,
): string | null {
  const nomor =
    penerima.nomor_order !== null ? " #" + penerima.nomor_order : "";

  if (kejadian === "order_baru") {
    return peran === "owner" ? AWALAN + "ada order baru." : null;
  }
  if (kejadian === "setujui") {
    if (peran === "customer") {
      return AWALAN + "pesananmu" + nomor + " sudah disetujui.";
    }
    if (peran === "penjaga") return AWALAN + "ada order disetujui.";
    return null;
  }
  if (kejadian === "status") {
    if (peran !== "customer") return null;
    const potongan = STATUS_WA[penerima.teks];
    if (!potongan) return null;
    return AWALAN + "pesananmu" + nomor + " " + potongan + ".";
  }
  return null;
}

// Alamat dasar gateway: tanpa "/" di ujung dan tanpa "/send-message" (kode menambahkannya sendiri).
function alamatKirim(mentah: string): string | null {
  const dasar = mentah
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/send-message$/i, "")
    .replace(/\/+$/, "");
  if (!/^https?:\/\/[^\s]+$/i.test(dasar)) return null;
  return dasar + "/send-message";
}

// Satu permintaan ke gateway. Tidak pernah melempar galat. `alasan` hanya jenis galat (tanpa data).
async function kirimSatu(
  alamat: string,
  kunci: string,
  nomor: string,
  pesan: string,
): Promise<{ ok: boolean; alasan: string }> {
  const kendali = new AbortController();
  const pewaktu = setTimeout(() => kendali.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(alamat, {
      method: "POST",
      headers: {
        "x-api-key": kunci,
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({ number: nomor, message: pesan }),
      signal: kendali.signal,
    });
    try {
      await res.body?.cancel();
    } catch (_e) {
      // isi balasan tidak dipakai
    }
    if (res.status === 202) return { ok: true, alasan: "202" };
    return { ok: false, alasan: "http " + res.status };
  } catch (e) {
    const nama = (e as { name?: string })?.name;
    return {
      ok: false,
      alasan: nama === "AbortError" ? "timeout" : "tidak terjangkau",
    };
  } finally {
    clearTimeout(pewaktu);
  }
}

export function buatPengirimWa(alat: { klien: KlienDb }) {
  const { klien } = alat;

  // Dipanggil SETELAH inbox berhasil ditulis. Tidak pernah melempar galat.
  async function kirimWa(
    kejadian: string,
    penerimaMentah: unknown,
  ): Promise<void> {
    try {
      if (!KEJADIAN_WA.has(kejadian)) return;
      if (!Array.isArray(penerimaMentah) || penerimaMentah.length === 0) return;

      // Konfigurasi kosong = fitur mati diam-diam (WAG04, WAG20).
      const urlMentah = Deno.env.get("WA_GATEWAY_URL") ?? "";
      const kunci = Deno.env.get("WA_GATEWAY_API_KEY") ?? "";
      if (!urlMentah.trim() || !kunci) return;
      const alamat = alamatKirim(urlMentah);
      if (!alamat) {
        console.error(
          "kedai wa: WA_GATEWAY_URL bentuknya tidak sah |",
          kejadian,
        );
        return;
      }

      // Rapikan daftar penerima: satu elemen per akun, hanya yang bentuknya benar.
      const peta = new Map<string, Penerima>();
      for (const e of penerimaMentah) {
        if (e === null || typeof e !== "object") continue;
        const p = e as Record<string, unknown>;
        if (typeof p.akun !== "string" || !REGEX_UUID.test(p.akun)) continue;
        if (typeof p.teks !== "string" || p.teks.length === 0) continue;
        const nomorOrder =
          typeof p.nomor_order === "number" &&
          Number.isSafeInteger(p.nomor_order)
            ? p.nomor_order
            : null;
        peta.set(p.akun, {
          akun: p.akun,
          teks: p.teks,
          nomor_order: nomorOrder,
        });
      }
      if (peta.size === 0) return;
      const daftarAkun = [...peta.keys()].slice(0, BATAS_AKUN);

      // Ambil nomor (baca-saja). Hasilnya hanya dipakai di sini: tidak dikirim ke aplikasi dan tidak ditulis di log.
      const { data: nomorMentah, error: eAmbil } = await klien.rpc(
        "wa_nomor_ambil",
        { p_akun: daftarAkun },
      );
      if (eAmbil) {
        console.error(
          "kedai wa: ambil nomor gagal |",
          kejadian,
          "|",
          String(eAmbil.code ?? ""),
        );
        return;
      }
      if (!Array.isArray(nomorMentah) || nomorMentah.length === 0) {
        console.log("kedai wa: tanpa nomor |", kejadian);
        return;
      }

      // Susun antrean kirim: (nomor, pesan, peran). Nomor kosong atau tidak sah dan kalimat kosong dilewati diam-diam.
      const antrean: { nomor: string; pesan: string; peran: string }[] = [];
      const sudah = new Set<string>();
      for (const e of nomorMentah as NomorWa[]) {
        if (e === null || typeof e !== "object") continue;
        if (typeof e.akun !== "string" || sudah.has(e.akun)) continue;
        if (typeof e.peran !== "string" || typeof e.nomor !== "string")
          continue;
        if (!REGEX_NOMOR.test(e.nomor)) continue;
        const penerima = peta.get(e.akun);
        if (!penerima) continue;
        const pesan = buatKalimat(kejadian, e.peran, penerima);
        if (pesan === null) continue;
        sudah.add(e.akun);
        antrean.push({ nomor: e.nomor, pesan, peran: e.peran });
      }
      if (antrean.length === 0) {
        console.log("kedai wa: tidak ada yang dikirimi |", kejadian);
        return;
      }

      // Customer dulu, baru staf (WAG13).
      antrean.sort(
        (a, b) =>
          (a.peran === "customer" ? 0 : 1) - (b.peran === "customer" ? 0 : 1),
      );

      // Kirim satu per satu. Gagal sekali = sisanya dilewati (tidak menunggu 3 detik berkali-kali).
      let terkirim = 0;
      let alasanGagal = "";
      for (const item of antrean) {
        const hasil = await kirimSatu(alamat, kunci, item.nomor, item.pesan);
        if (!hasil.ok) {
          alasanGagal = hasil.alasan;
          break;
        }
        terkirim++;
      }

      if (alasanGagal) {
        console.error(
          "kedai wa:",
          kejadian,
          "| terkirim",
          terkirim,
          "| gagal 1 (" + alasanGagal + ")",
          "| dilewati",
          antrean.length - terkirim - 1,
        );
      } else {
        console.log("kedai wa:", kejadian, "| terkirim", terkirim, "| gagal 0");
      }
    } catch (_e) {
      console.error("kedai wa: galat tak terduga |", kejadian);
    }
  }

  return { kirimWa };
}
