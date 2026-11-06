// public/sw.js
// Service worker Kedai ChATA: strategi NETWORK FIRST (fondasi.md F10).
// Selalu coba internet dulu; salinan tersimpan hanya dipakai bila internet gagal.
// Hanya menangani berkas aplikasi dari domain sendiri (GET).
// Panggilan ke Supabase TIDAK disentuh dan TIDAK disimpan.
// Penanganan push ditambah nanti (notifikasi.md).

// Naikkan angka versi ini bila daftar cache berubah, supaya salinan lama dibuang.
var NAMA_CACHE = "chata-v4";

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
  "img/icon-192.png",
  "img/icon-512.png",
  "img/chata-logo.png",
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
