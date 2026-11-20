// public/analitik.js
// ANL.02: pembungkus analitik Umami (analitik.md AN3, AN4, AN7). Berdiri sendiri, tanpa server milik kita,
// tanpa localStorage, tanpa memakai window.KedaiAkun, dan tidak menyentuh berkas layar mana pun.
// Dimuat SETELAH tag script lib/umami.js di index.html (pengecekan tetap dilakukan saat event, jadi urutan tidak kritis).
//
// Cara kerja:
// - Layar Masuk = kunjungan otomatis dari script Umami (tanpa kode di sini).
// - Event kustom (nama layar saja, tanpa isian tambahan): buka-daftar, buka-pengenalan, buka-bantuan, buka-belanja.
// - Daftar, Pengenalan, dan Bantuan dikenali lewat pengamat atribut `hidden` (pola qris.js): event dikirim hanya
//   saat elemen berpindah dari tersembunyi ke tampil. Peralihan tampil ke tampil, atau tersembunyi ke tersembunyi
//   (akun.js menulis ulang hidden pada semua layar tiap tampilkan), tidak dihitung.
// - Belanja digambar belanja.js saat pertama dibuka (elemennya belum ada saat halaman dimuat), jadi dikenali lewat
//   ketukan pada item hamburger "Belanja Warung" (#gim-menu-belanja, hanya tampil untuk owner).
// - Batas per tab (keputusan ketua 20 Nov 2026, opsi B): tiap nama event dikirim paling banyak SEKALI per tab,
//   dicatat di memori (bukan localStorage). Muat ulang halaman mengosongkannya. Pageview otomatis Umami tidak dibatasi
//   di sini (dipantau lewat dashboard, opsi A).
//
// Aturan yang dijaga:
// - Tanpa data pribadi: event hanya berupa nama layar. Tidak ada id akun, nama, nomor WA, nominal, atau isi layar.
//   `umami.identify()` dilarang dan tidak dipakai di sini.
// - Gagal diam-diam: script Umami diblokir, belum termuat, atau offline = tidak ada galat dan tidak ada pesan di layar.
//   Semua panggilan dibungkus try/catch dan tidak pernah ditunggu, jadi tidak menahan alur aplikasi.

(function () {
  "use strict";

  // Hanya huruf kecil dan strip, panjang wajar. Nama di luar pola ini tidak dikirim.
  var POLA_NAMA = /^[a-z][a-z-]{0,29}$/;

  // Nama event yang sudah dikirim di tab ini (batas satu kali per nama).
  var sudahDikirim = {};

  // Kirim satu event bernama layar. Selalu aman dipanggil: tidak melempar galat dan tidak mengembalikan apa pun.
  function lacak(nama) {
    try {
      if (typeof nama !== "string" || !POLA_NAMA.test(nama)) return;
      if (sudahDikirim[nama] === true) return;
      var u = window.umami;
      // Script Umami tidak ada (diblokir, belum termuat, offline): diam saja, dan belum ditandai terkirim.
      if (!u || typeof u.track !== "function") return;
      sudahDikirim[nama] = true;
      var hasil = u.track(nama); // hanya nama, tanpa data tambahan (AN3, AN4)
      if (hasil && typeof hasil.catch === "function") {
        hasil.catch(function () {});
      }
    } catch (err) {
      // Analitik tidak boleh mengganggu aplikasi.
    }
  }

  // Pantau satu elemen: event dikirim hanya saat ia berpindah dari tersembunyi ke tampil.
  function pantau(idElemen, namaEvent) {
    try {
      var elemen = document.getElementById(idElemen);
      if (!elemen || typeof MutationObserver !== "function") return;
      var terlihat = !elemen.hidden;
      new MutationObserver(function () {
        var sekarang = !elemen.hidden;
        if (sekarang && !terlihat) {
          lacak(namaEvent);
        }
        terlihat = sekarang;
      }).observe(elemen, { attributes: true, attributeFilter: ["hidden"] });
    } catch (err) {
      // Gagal memasang pengamat tidak boleh mengganggu aplikasi.
    }
  }

  // ANL.05: layar Daftar (dikelola akun.js, kategori login: tidak disentuh).
  pantau("layar-daftar", "buka-daftar");
  // ANL.04: layar Pengenalan, dan panel Bantuan (kerangka.js, bantuan.js): tidak disentuh.
  pantau("layar-pengenalan", "buka-pengenalan");
  pantau("panel-bantuan", "buka-bantuan");

  // ANL.04: Belanja Warung. Item hamburger hanya tampil untuk owner, jadi ketukan di sini selalu dari owner.
  try {
    var itemBelanja = document.getElementById("gim-menu-belanja");
    if (itemBelanja) {
      itemBelanja.addEventListener("click", function () {
        lacak("buka-belanja");
      });
    }
  } catch (err) {
    // Gagal memasang pendengar tidak boleh mengganggu aplikasi.
  }

  window.KedaiAnalitik = Object.freeze({
    lacak: lacak,
  });
})();
