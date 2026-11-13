// public/sw.js
// Service worker Kedai ChATA: strategi NETWORK FIRST (fondasi.md F10).
// Selalu coba internet dulu; salinan tersimpan hanya dipakai bila internet gagal.
// Hanya menangani berkas aplikasi dari domain sendiri (GET).
// Panggilan ke Supabase TIDAK disentuh dan TIDAK disimpan.
// Penanganan push ditambah nanti (notifikasi.md).
// NTF.04: penanganan push masuk dan notifikasi ditekan sudah ditambah di bagian bawah berkas ini.

// Naikkan angka versi ini bila daftar cache berubah, supaya salinan lama dibuang.
// ORD.03: var NAMA_CACHE = "chata-v10"; // MNU.10: naik dari chata-v9 karena grup.js masuk daftar cache
// ORD.04: var NAMA_CACHE = "chata-v11"; // ORD.03: naik dari chata-v10 karena pesan.js masuk daftar cache
// ORD.04: var NAMA_CACHE = "chata-v12"; // ORD.04: naik dari chata-v11 karena pesanan.js masuk daftar cache
// ORD.06: var NAMA_CACHE = "chata-v13"; // ORD.06: naik dari chata-v12 karena orderowner.js masuk daftar cache
// ORD.15: var NAMA_CACHE = "chata-v14"; // ORD.08: naik dari chata-v13 karena orderpenjaga.js masuk daftar cache
// ORD.10: var NAMA_CACHE = "chata-v15"; // ORD.15: naik dari chata-v14 karena orderowneraksi.js masuk daftar cache
// ORD.13: var NAMA_CACHE = "chata-v16"; // ORD.10: naik dari chata-v15 karena orderownercatatan.js masuk daftar cache
// BTN.03: var NAMA_CACHE = "chata-v17"; // ORD.13: naik dari chata-v16 karena pelangganluar.js dan orderwakil.js masuk daftar cache
// BTN.04a: var NAMA_CACHE = "chata-v18"; // BTN.03: naik dari chata-v17 karena bantuan.js masuk daftar cache
// GIM.03: var NAMA_CACHE = "chata-v19"; // BTN.04a: naik dari chata-v18 karena img/infografik.webp masuk daftar cache
// FTO.03: var NAMA_CACHE = "chata-v20"; // GIM.03: naik dari chata-v19 karena game.css, gim.js, dan gimmenu.js masuk daftar cache
// INB.05: var NAMA_CACHE = "chata-v21"; // FTO.03: naik dari chata-v20 karena foto.js masuk daftar cache
// NTF.04: var NAMA_CACHE = "chata-v22"; // INB.05: naik dari chata-v21 karena inbox.js masuk daftar cache
// NTF.05: var NAMA_CACHE = "chata-v23"; // NTF.04: naik dari chata-v22 karena sw.js berubah (penanganan push); daftar cache tidak berubah
// RKS.03: var NAMA_CACHE = "chata-v24"; // NTF.05: naik dari chata-v23 karena notif.js masuk daftar cache
// VIS.03: var NAMA_CACHE = "chata-v25"; // RKS.03: naik dari chata-v24 karena ringkasan.js dan ringkasan.css masuk daftar cache
var NAMA_CACHE = "chata-v26"; // VIS.03: naik dari chata-v25 karena stepper.js dan stepper.css masuk daftar cache

// Semua path relatif (tanpa awalan /) supaya jalan di GitHub Pages.
// Tiap berkas aplikasi baru (JS, style.css, pustaka, ikon) wajib ditambah di sini.
var DAFTAR_CACHE = [
  "./",
  "index.html",
  "config.js",
  "lib/supabase.js",
  "manifest.json",
  "style.css",
  "game.css", // GIM.03
  "ringkasan.css", // RKS.03
  "stepper.css", // VIS.03
  "akun.js",
  "profil.js",
  "alamat.js",
  "akunmenu.js",
  "menu-detail.js", // MNU.08
  "menu.js",
  "grup.js", // MNU.10
  "pesan.js", // ORD.03
  "stepper.js", // VIS.03
  "pesanan.js", // ORD.04
  "orderownercatatan.js", // ORD.10
  "orderowneraksi.js", // ORD.15
  "orderowner.js", // ORD.06
  "foto.js", // FTO.03
  "orderpenjaga.js", // ORD.08
  "pelangganluar.js", // ORD.13
  "orderwakil.js", // ORD.13
  "bantuan.js", // BTN.03
  "kerangka.js",
  "gim.js", // GIM.03
  "gimmenu.js", // GIM.03
  "inbox.js", // INB.05
  "notif.js", // NTF.05
  "ringkasan.js", // RKS.03
  "img/icon-192.png",
  "img/icon-512.png",
  "img/chata-logo.png",
  "img/menu1.jpg",
  "img/esteh.jpg",
  "img/infografik.webp", // BTN.04a
];

// Saat dipasang: simpan salinan awal semua berkas aplikasi.
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(NAMA_CACHE)
      .then(function (cache) {
        return cache.addAll(DAFTAR_CACHE);
      })
      .then(function () {
        return self.skipWaiting();
      }),
  );
});

// Saat aktif: buang salinan dari versi cache lama, lalu ambil alih halaman yang terbuka.
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (daftarNama) {
        return Promise.all(
          daftarNama
            .filter(function (nama) {
              return nama.indexOf("chata-") === 0 && nama !== NAMA_CACHE;
            })
            .map(function (nama) {
              return caches.delete(nama);
            }),
        );
      })
      .then(function () {
        return self.clients.claim();
      }),
  );
});

// Setiap permintaan berkas: internet dulu, salinan tersimpan hanya bila internet gagal.
self.addEventListener("fetch", function (event) {
  var permintaan = event.request;

  // Hanya GET.
  if (permintaan.method !== "GET") {
    return;
  }

  // Hanya domain sendiri. Supabase dan domain lain dibiarkan lewat apa adanya.
  var alamat = new URL(permintaan.url);
  if (alamat.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(permintaan)
      .then(function (respons) {
        // Simpan salinan terbaru hanya bila respons sukses.
        if (respons && respons.ok) {
          var salinan = respons.clone();
          caches.open(NAMA_CACHE).then(function (cache) {
            cache.put(permintaan, salinan);
          });
        }
        return respons;
      })
      .catch(function () {
        // Internet gagal: pakai salinan tersimpan.
        return caches
          .match(permintaan, { ignoreSearch: true })
          .then(function (tersimpan) {
            if (tersimpan) {
              return tersimpan;
            }
            // Buka halaman saat offline dan alamatnya belum tersimpan: pakai halaman awal.
            if (permintaan.mode === "navigate") {
              return caches.match("index.html");
            }
            return Response.error();
          });
      }),
  );
});

// ---------------------------------------------------------------------------
// NTF.04: PUSH (notifikasi.md NT2, NT8, NT9; security.md aturan 11 dan 16)
//
// Bentuk isi push dari server (usulan, jadi kontrak untuk NTF.06). JSON kecil:
//   { "judul": "...", "isi": "...", "nomor": 1042, "tujuan": "order" | "antrean", "id": "<id order>" }
// - "nomor" dan "id" opsional. "nomor" dipakai untuk tag per order (NT9).
// - "tujuan" menentukan ke mana notifikasi membuka aplikasi. Server yang tahu peran penerima,
//   jadi sw.js tidak menebak peran. Nilai selain "order" dan "antrean" dianggap tidak ada.
// Aturan yang dijaga:
// - Isi kosong, bukan JSON, atau rusak: tampil teks umum. sw.js tidak mengarang isi sendiri.
// - Hanya teks dari isi push yang ditampilkan, dipotong panjangnya. Tidak ada data pribadi di sini.
// - Tidak ada panggilan jaringan di bagian push (tanpa polling, tanpa Realtime).
// ---------------------------------------------------------------------------

var JUDUL_UMUM = "Kedai ChATA";
var ISI_UMUM = "Ada kabar baru di Kedai ChATA.";
var BATAS_JUDUL = 60;
var BATAS_ISI = 160;

// Ambil teks dari isi push dengan aman: hanya string, dipotong, atau cadangan umum.
function teksAman(nilai, cadangan, batas) {
  if (typeof nilai !== "string") return cadangan;
  var bersih = nilai.trim();
  if (!bersih) return cadangan;
  return bersih.length > batas ? bersih.slice(0, batas) : bersih;
}

// Baca isi push. Gagal baca (kosong atau bukan JSON): kembalikan objek kosong.
function bacaIsiPush(event) {
  if (!event.data) return {};
  try {
    var hasil = event.data.json();
    return hasil && typeof hasil === "object" ? hasil : {};
  } catch (e) {
    return {};
  }
}

// Alamat tujuan saat notifikasi ditekan. Penanda dibaca aplikasi nanti (langkah terpisah).
// Hanya dua tujuan yang dikenal; id hanya huruf, angka, strip, dan garis bawah.
function alamatTujuan(tujuan, id) {
  var dasar = self.registration.scope;
  if (tujuan === "antrean") {
    return dasar + "?buka=antrean";
  }
  if (tujuan === "order") {
    var idAman =
      typeof id === "string" && /^[A-Za-z0-9_-]{1,64}$/.test(id) ? id : "";
    return idAman
      ? dasar + "?buka=order&id=" + encodeURIComponent(idAman)
      : dasar + "?buka=order";
  }
  return dasar;
}

// Push masuk: tampilkan notifikasi, dan bila ada halaman aplikasi yang terbuka, minta ia menyegarkan data.
self.addEventListener("push", function (event) {
  var isi = bacaIsiPush(event);

  var judul = teksAman(isi.judul, JUDUL_UMUM, BATAS_JUDUL);
  var teks = teksAman(isi.isi, ISI_UMUM, BATAS_ISI);

  var tujuan =
    isi.tujuan === "order" || isi.tujuan === "antrean" ? isi.tujuan : "";
  var id = typeof isi.id === "string" ? isi.id : "";
  var nomor =
    typeof isi.nomor === "number" || typeof isi.nomor === "string"
      ? String(isi.nomor)
      : "";

  var opsi = {
    body: teks,
    icon: "img/icon-192.png",
    badge: "img/icon-192.png",
    data: { tujuan: tujuan, id: id },
  };

  // NT9: satu notifikasi per order, yang baru menggantikan yang lama tetapi tetap berbunyi.
  if (/^[A-Za-z0-9_-]{1,20}$/.test(nomor)) {
    opsi.tag = "order-" + nomor;
    opsi.renotify = true;
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (daftarHalaman) {
        // NT8: bila aplikasi sedang terbuka, beri tahu halaman supaya menyegarkan data.
        for (var i = 0; i < daftarHalaman.length; i++) {
          daftarHalaman[i].postMessage({ jenis: "segarkan" });
        }
        return self.registration.showNotification(judul, opsi);
      }),
  );
});

// Notifikasi ditekan: tutup notifikasi, fokuskan aplikasi yang sudah terbuka atau buka yang baru.
// Halaman diberi pesan { jenis: "buka", tujuan, id } supaya aplikasi bisa membuka layar yang tepat.
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  var data = event.notification.data || {};
  var tujuan =
    data.tujuan === "order" || data.tujuan === "antrean" ? data.tujuan : "";
  var id = typeof data.id === "string" ? data.id : "";
  var alamat = alamatTujuan(tujuan, id);

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (daftarHalaman) {
        for (var i = 0; i < daftarHalaman.length; i++) {
          var halaman = daftarHalaman[i];
          if (
            halaman.url.indexOf(self.registration.scope) === 0 &&
            "focus" in halaman
          ) {
            halaman.postMessage({ jenis: "buka", tujuan: tujuan, id: id });
            return halaman.focus();
          }
        }
        // Tidak ada aplikasi yang terbuka: buka baru, tujuan dibawa lewat alamat.
        if (self.clients.openWindow) {
          return self.clients.openWindow(alamat);
        }
      }),
  );
});
