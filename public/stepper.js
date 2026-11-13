// public/stepper.js
// VIS.02: stepper status 5 titik di detail pesanan customer (stepper-visual.md).
// Murni tampilan: hanya menggambar dari data order yang sudah dibaca pesanan.js (status dan pembatal).
// Tanpa panggilan server, tanpa polling, tanpa menyimpan apa pun di HP (VS8, VS11).
// Dipanggil renderDetail() di pesanan.js: window.KedaiStepper.pasang(kartuUtama, order).
// Dimuat SEBELUM pesanan.js di index.html (VIS.03). Bila berkas ini belum termuat, pesanan.js
// melewati langkahnya dan layar tampil seperti sebelumnya.
//
// Aturan yang dijaga:
// - Titik dibaca dari STATUS saja, bukan dari tipe order (VS5).
// - Tidak ada teks di sekitar stepper (VS3). Hanya tanda centang dan silang di dalam titik,
//   dipasang lewat textContent (VS16). Elemen dibangun dengan createElement, tanpa innerHTML.
// - Dibatalkan oleh owner, pembatal tidak diketahui, atau status asing: stepper tidak ditampilkan,
//   tanpa pesan galat (VS10, VS16).
// - Selalu digambar dari status terkini; tidak ada ingatan "pernah sampai titik berapa" dan tidak ada
//   animasi perpindahan (VS8). Gerak hanya dari CSS (stepper.css) dan hanya saat order masih berjalan.
// - Label untuk pembaca layar dipasang sebagai atribut aria-label, bukan teks yang tampil (VS15).
//   Stepper bukan tombol dan tidak bisa diketuk.

(function () {
  "use strict";

  var JUMLAH_TITIK = 5;

  // VS5: status menjadi nomor titik. Tiga nama status titik 4 sama-sama titik 4.
  var TITIK_STATUS = {
    Menunggu: 1,
    Disetujui: 2,
    Diproses: 3,
    Diantar: 4,
    "Siap diambil": 4,
    "Siap disajikan": 4,
    Selesai: 5,
  };

  var TANDA_LEWAT = "\u2713"; // centang
  var TANDA_GAGAL = "\u2715"; // silang

  function buat(tag, kelas, teks) {
    var e = document.createElement(tag);
    if (kelas) e.className = kelas;
    if (teks !== undefined) e.textContent = teks;
    return e;
  }

  // Tentukan tampilan dari status dan pembatal. Null bila stepper tidak boleh tampil.
  //   posisi : nomor titik aktif (atau titik gagal)
  //   gagal  : true untuk Ditolak dan Dibatalkan oleh customer (VS9)
  //   selesai: true bila semua titik terlewati
  //   label  : teks untuk pembaca layar (VS15)
  function tentukan(order) {
    var status = order && typeof order.status === "string" ? order.status : "";
    if (status === "") return null;

    if (status === "Ditolak") {
      return { posisi: 1, gagal: true, selesai: false, label: "Ditolak" };
    }
    if (status === "Dibatalkan") {
      // VS10: hanya pembatal customer yang pasti berhenti di titik 1.
      if (order.dibatalkanOleh === "customer") {
        return { posisi: 1, gagal: true, selesai: false, label: "Dibatalkan" };
      }
      return null;
    }
    if (!Object.prototype.hasOwnProperty.call(TITIK_STATUS, status)) {
      return null; // status asing: tidak ditampilkan (VS16)
    }
    var n = TITIK_STATUS[status];
    return {
      posisi: n,
      gagal: false,
      selesai: status === "Selesai",
      label: "Langkah " + n + " dari " + JUMLAH_TITIK + ": " + status,
    };
  }

  // Pasang stepper di akhir wadah (kartu utama). Mengembalikan elemen stepper, atau null bila tidak dipasang.
  function pasang(wadah, order) {
    try {
      if (!wadah || !order) return null;
      var t = tentukan(order);
      if (!t) return null;

      // Jaga-jaga: jangan sampai ada dua stepper di satu wadah.
      var lama = wadah.querySelector(".stp");
      if (lama && lama.parentNode) lama.parentNode.removeChild(lama);

      var stp = buat("div", "stp");
      stp.setAttribute("role", "img");
      stp.setAttribute("aria-label", t.label);

      for (var i = 1; i <= JUMLAH_TITIK; i++) {
        var kelasTitik = "stp__titik";
        var tanda = "";
        if (t.gagal) {
          if (i === 1) {
            kelasTitik += " stp__titik--gagal";
            tanda = TANDA_GAGAL;
          }
        } else if (i < t.posisi || (i === t.posisi && t.selesai)) {
          kelasTitik += " stp__titik--lewat";
          tanda = TANDA_LEWAT;
        } else if (i === t.posisi) {
          kelasTitik += " stp__titik--aktif";
        }
        var titik = buat("span", kelasTitik, tanda);
        titik.setAttribute("aria-hidden", "true");
        stp.appendChild(titik);

        if (i < JUMLAH_TITIK) {
          var kelasGaris = "stp__garis";
          if (!t.gagal) {
            if (i < t.posisi) {
              kelasGaris += " stp__garis--lewat";
            } else if (i === t.posisi && !t.selesai) {
              // VS7: hanya garis tepat setelah titik aktif yang bergerak.
              kelasGaris += " stp__garis--gerak";
            }
          }
          var garis = buat("span", kelasGaris);
          garis.setAttribute("aria-hidden", "true");
          stp.appendChild(garis);
        }
      }

      wadah.appendChild(stp);
      return stp;
    } catch (e) {
      // Satu data aneh tidak boleh merusak layar detail (VS16).
      return null;
    }
  }

  window.KedaiStepper = Object.freeze({
    pasang: pasang, // dipanggil renderDetail() di pesanan.js
  });
})();
