// public/sw.js
// Service worker Kedai ChATA: strategi NETWORK FIRST (fondasi.md F10).
// Selalu coba internet dulu; salinan tersimpan hanya dipakai bila internet gagal.
// Hanya menangani berkas aplikasi dari domain sendiri (GET).
// Panggilan ke Supabase TIDAK disentuh dan TIDAK disimpan.
// Penanganan push ditambah nanti (notifikasi.md).

// Naikkan angka versi ini bila daftar cache berubah, supaya salinan lama dibuang.
// ORD.03: var NAMA_CACHE = "chata-v10"; // MNU.10: naik dari chata-v9 karena grup.js masuk daftar cache
// ORD.04: var NAMA_CACHE = "chata-v11"; // ORD.03: naik dari chata-v10 karena pesan.js masuk daftar cache
// ORD.04: var NAMA_CACHE = "chata-v12"; // ORD.04: naik dari chata-v11 karena pesanan.js masuk daftar cache
// ORD.06: var NAMA_CACHE = "chata-v13"; // ORD.06: naik dari chata-v12 karena orderowner.js masuk daftar cache
// ORD.15: var NAMA_CACHE = "chata-v14"; // ORD.08: naik dari chata-v13 karena orderpenjaga.js masuk daftar cache
// ORD.10: var NAMA_CACHE = "chata-v15"; // ORD.15: naik dari chata-v14 karena orderowneraksi.js masuk daftar cache
// ORD.13: var NAMA_CACHE = "chata-v16"; // ORD.10: naik dari chata-v15 karena orderownercatatan.js masuk daftar cache
// BTN.03: var NAMA_CACHE = "chata-v17"; // ORD.13: naik dari chata-v16 karena pelangganluar.js dan orderwakil.js masuk daftar cache
var NAMA_CACHE = "chata-v18"; // BTN.03: naik dari chata-v17 karena bantuan.js masuk daftar cache

// Semua path relatif (tanpa awalan /) supaya jalan di GitHub Pages.
// Tiap berkas aplikasi baru (JS, style.css, pustaka, ikon) wajib ditambah di sini.
var DAFTAR_CACHE = [
  "./",
  "index.html",
  "config.js",
  "lib/supabase.js",
  "manifest.json",
  "style.css",
  "akun.js",
  "profil.js",
  "alamat.js",
  "akunmenu.js",
  "menu-detail.js", // MNU.08
  "menu.js",
  "grup.js", // MNU.10
  "pesan.js", // ORD.03
  "pesanan.js", // ORD.04
  "orderownercatatan.js", // ORD.10
  "orderowneraksi.js", // ORD.15
  "orderowner.js", // ORD.06
  "orderpenjaga.js", // ORD.08
  "pelangganluar.js", // ORD.13
  "orderwakil.js", // ORD.13
  "bantuan.js", // BTN.03
  "kerangka.js",
  "img/icon-192.png",
  "img/icon-512.png",
  "img/chata-logo.png",
  "img/menu1.jpg",
  "img/esteh.jpg",
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
