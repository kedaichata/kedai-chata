// public/orderowneraksi.js
// ORD.15: tombol aksi owner di detail order (order.md O5, O10, O23, blok "2026-11-08: Owner boleh
// membatalkan setelah Disetujui, dan aksi Alih hari", kontrak di Handoff #6 dan #12).
// Dipakai oleh orderowner.js (layar Order Masuk dan Semua Order). Berkas ini TIDAK memanggil server sendiri:
// semua pengiriman lewat fungsi `kirim` milik orderowner.js (alat.kirim), jadi kunci tombol, 409, 404, dan
// muat ulang detail memakai jalur yang sama dengan Setuju dan Tolak.
//
// Aksi yang tampil (hanya untuk status Disetujui, Diproses, Diantar/Siap diambil/Siap disajikan):
//   - Status maju dan mundur satu langkah : aksi order_status   { id, arah, status_dilihat }
//   - Koreksi metode bayar                : aksi order_metode_koreksi { id, metode }
//   - Alihkan ke Besok                    : aksi order_alih_hari { id, jam?, alasan? }
//   - Batalkan order                      : aksi order_batal { id, alasan }
// Order Menunggu tetap memakai Setuju dan Tolak di orderowner.js. Selesai, Ditolak, dan Dibatalkan tanpa aksi.
//
// Aturan yang dijaga:
// - Aplikasi hanya mengirim aksi, id order, pilihan owner, dan teks alasan. Status tujuan, hari tujuan, peran,
//   dan pemutus TIDAK pernah dikirim; server yang menentukan dan yang menolak akses (order_* hanya untuk owner).
// - `status_dilihat` hanya pembanding: bila beda dengan status di server, server membalas 409 dan layar memuat ulang.
// - Batalkan dan Alihkan memakai kartu konfirmasi (pembatalan tidak bisa dihidupkan lagi). Status maju dan
//   mundur tanpa dialog, sama dengan layar penjaga (keputusan ketua, Handoff #14).
// - "Hanya Besok" untuk alih hari dihitung server. Layar TIDAK memakai tanggal HP untuk menyembunyikan tombol;
//   bila order sudah Besok, server menolak dan pesannya ditampilkan.
// - Semua teks dipasang lewat textContent, bukan innerHTML.
// - Tidak ada panggilan server baru selain empat aksi di atas yang sudah ada.
// Dimuat SEBELUM orderowner.js di index.html (orderowner.js tetap aman bila berkas ini tidak termuat).

(function () {
  "use strict";

  var METODE = ["Transfer", "Tunai", "QRIS"];
  // Batas alasan (server juga menolak lebih panjang): batal 200 (sama dengan alasan tolak), alih hari 100.
  var MAKS_ALASAN_BATAL = 200;
  var MAKS_ALASAN_ALIH = 100;
  var REGEX_JAM = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;

  // Status tempat aksi owner boleh muncul. Selesai, Ditolak, Dibatalkan: tidak ada aksi.
  var STATUS_AKSI = [
    "Disetujui",
    "Diproses",
    "Diantar",
    "Siap diambil",
    "Siap disajikan",
  ];
  var STATUS_SIAP = ["Diantar", "Siap diambil", "Siap disajikan"];

  function ada(daftar, nilai) {
    return daftar.indexOf(nilai) !== -1;
  }

  // Label tombol langkah berikutnya mengikuti tipe order (sama dengan layar penjaga). Hanya tulisan:
  // status tujuan ditentukan server.
  function labelMaju(o) {
    if (o.status === "Disetujui") return "Mulai proses";
    if (o.status === "Diproses") {
      if (o.tipe === "Diantar") return "Antar sekarang";
      if (o.tipe === "Diambil") return "Siap diambil";
      if (o.tipe === "Makan di warung") return "Siap disajikan";
      return "Lanjut ke langkah berikutnya";
    }
    if (ada(STATUS_SIAP, o.status)) return "Tandai selesai";
    return "";
  }

  // O10: mundur satu langkah dari Diproses dan dari Diantar/Siap; tidak dari Disetujui dan tidak dari Selesai.
  function labelMundur(o) {
    if (o.status === "Diproses") return "Kembalikan ke Disetujui";
    if (ada(STATUS_SIAP, o.status)) return "Kembalikan ke Diproses";
    return "";
  }

  // alat (diberikan orderowner.js, satu set per layar):
  //   awalan                 : awalan id elemen layar (supaya id kolom tidak kembar antar layar)
  //   buat, buatTombol, jamIndo : pembantu tampilan milik orderowner.js
  //   sedangKirim()          : true selama permintaan berangkat (tombol dikunci)
  //   kirim(aksi, isi, infoSukses, pesanUmum) : jalur kirim orderowner.js; infoSukses boleh fungsi(h) -> teks
  //   pesan(teks), info(teks): pesan galat dan info di atas detail
  //   render()               : gambar ulang detail
  function buatAksi(alat) {
    var buat = alat.buat;
    var buatTombol = alat.buatTombol;

    var mode = "lihat"; // "lihat" | "batal" | "alih" | "metode"
    var alasanBatal = "";
    var jamAlih = "";
    var alasanAlih = "";
    var metodeBaru = "";
    var galatForm = ""; // galat pemeriksaan isian (di dalam kartu, dekat tombolnya)

    // Dipanggil orderowner.js saat detail dibuka, ditutup, dimuat ulang (status bukan Menunggu), setelah
    // berhasil, dan saat Keluar: isian tidak boleh tersisa.
    function reset() {
      mode = "lihat";
      alasanBatal = "";
      jamAlih = "";
      alasanAlih = "";
      metodeBaru = "";
      galatForm = "";
    }

    function bukaMode(m) {
      if (alat.sedangKirim()) return;
      reset();
      mode = m;
      alat.pesan("");
      alat.info("");
      alat.render();
    }

    function tutupMode() {
      if (alat.sedangKirim()) return;
      reset();
      alat.pesan("");
      alat.info("");
      alat.render();
    }

    function setGalat(teks) {
      galatForm = teks;
      alat.render();
    }

    // Baris galat pemeriksaan isian di dalam kartu.
    function barisGalat() {
      if (!galatForm) return null;
      var p = buat("p", "isian__galat", galatForm);
      p.setAttribute("role", "alert");
      return p;
    }

    // ---------------- Status maju dan mundur ----------------

    function kirimStatus(o, arah) {
      alat.kirim(
        "order_status",
        { id: o.id, arah: arah, status_dilihat: o.status },
        function (h) {
          var st =
            h &&
            h.data &&
            h.data.order &&
            typeof h.data.order.status === "string"
              ? h.data.order.status
              : "";
          return (
            "Order #" +
            o.nomor +
            (st ? " pindah ke " + st + "." : " diperbarui.")
          );
        },
        "Status order belum bisa diubah. Coba lagi sebentar lagi.",
      );
    }

    // ---------------- Batalkan ----------------

    function kirimBatal(o) {
      var alasan = alasanBatal.trim();
      if (alasan.length > MAKS_ALASAN_BATAL) {
        setGalat(
          "Alasan terlalu panjang (maksimal " +
            MAKS_ALASAN_BATAL +
            " karakter).",
        );
        return;
      }
      galatForm = "";
      alat.kirim(
        "order_batal",
        { id: o.id, alasan: alasan },
        "Order #" + o.nomor + " dibatalkan.",
        "Order belum bisa dibatalkan. Coba lagi sebentar lagi.",
      );
    }

    function kartuBatal(o) {
      var kartu = buat("div", "kartu");
      kartu.appendChild(
        buat("h2", "kartu__judul", "Batalkan order #" + o.nomor + "?"),
      );
      kartu.appendChild(
        buat(
          "p",
          "kartu__isi",
          "Order yang dibatalkan tidak bisa dihidupkan lagi. Uang yang sudah diterima dikembalikan lewat WA, di luar aplikasi. Pastikan penjaga sudah dikabari.",
        ),
      );
      var isian = buat("div", "isian");
      var label = buat(
        "label",
        "isian__label",
        "Alasan (boleh dikosongkan, tampil ke customer)",
      );
      var idKolom = alat.awalan + "-alasan-batal";
      label.htmlFor = idKolom;
      isian.appendChild(label);
      var kolom = buat("textarea", "isian__kolom");
      kolom.id = idKolom;
      kolom.rows = 3;
      kolom.maxLength = MAKS_ALASAN_BATAL;
      kolom.value = alasanBatal;
      kolom.disabled = alat.sedangKirim();
      kolom.addEventListener("input", function () {
        alasanBatal = kolom.value;
      });
      isian.appendChild(kolom);
      isian.appendChild(
        buat(
          "p",
          "isian__bantuan",
          "Maksimal " + MAKS_ALASAN_BATAL + " karakter.",
        ),
      );
      kartu.appendChild(isian);
      var g = barisGalat();
      if (g) kartu.appendChild(g);

      var baris = buat("div", "baris-tombol");
      baris.appendChild(
        buatTombol(
          "Kembali",
          "tombol--sekunder",
          tutupMode,
          alat.sedangKirim(),
        ),
      );
      var ya = buatTombol(
        "Ya, batalkan",
        "tombol--bahaya",
        function () {
          kirimBatal(o);
        },
        alat.sedangKirim(),
      );
      ya.id = alat.awalan + "-tombol-batal-ya";
      baris.appendChild(ya);
      kartu.appendChild(baris);
      return kartu;
    }

    // ---------------- Alihkan ke Besok ----------------

    function kirimAlih(o) {
      var jam = jamAlih.trim();
      var alasan = alasanAlih.trim();
      if (jam && !REGEX_JAM.test(jam)) {
        setGalat("Jam harus berformat JJ:MM, misalnya 11:30.");
        return;
      }
      if (alasan.length > MAKS_ALASAN_ALIH) {
        setGalat(
          "Alasan terlalu panjang (maksimal " +
            MAKS_ALASAN_ALIH +
            " karakter).",
        );
        return;
      }
      galatForm = "";
      // Hari tujuan TIDAK dikirim (server yang menghitung Besok). Jam dan alasan dikirim hanya bila diisi.
      var isi = { id: o.id };
      if (jam) isi.jam = jam;
      if (alasan) isi.alasan = alasan;
      alat.kirim(
        "order_alih_hari",
        isi,
        "Order #" + o.nomor + " dialihkan ke Besok.",
        "Order belum bisa dialihkan. Coba lagi sebentar lagi.",
      );
    }

    function kartuAlih(o) {
      var kartu = buat("div", "kartu");
      kartu.appendChild(
        buat("h2", "kartu__judul", "Alihkan order #" + o.nomor + " ke Besok?"),
      );
      kartu.appendChild(
        buat(
          "p",
          "kartu__isi",
          "Hari antar jadi Besok, nomor order dan pembayaran tetap, status kembali ke Disetujui, dan catatan terbuka lagi. Alasan tampil ke customer.",
        ),
      );

      var isianJam = buat("div", "isian");
      var labelJam = buat(
        "label",
        "isian__label",
        "Jam baru (boleh dikosongkan)",
      );
      var idJam = alat.awalan + "-alih-jam";
      labelJam.htmlFor = idJam;
      isianJam.appendChild(labelJam);
      var kolomJam = buat("input", "isian__kolom");
      kolomJam.id = idJam;
      kolomJam.type = "time";
      kolomJam.value = jamAlih;
      kolomJam.disabled = alat.sedangKirim();
      kolomJam.addEventListener("input", function () {
        jamAlih = kolomJam.value;
      });
      isianJam.appendChild(kolomJam);
      var jamLama = alat.jamIndo(o.jam_permintaan);
      isianJam.appendChild(
        buat(
          "p",
          "isian__bantuan",
          jamLama
            ? "Kosong = tetap jam " + jamLama + " (jam di order sekarang)."
            : "Kosong = tetap memakai jam di order.",
        ),
      );
      kartu.appendChild(isianJam);

      var isianAlasan = buat("div", "isian");
      var labelAlasan = buat(
        "label",
        "isian__label",
        "Alasan (boleh dikosongkan, tampil ke customer)",
      );
      var idAlasan = alat.awalan + "-alih-alasan";
      labelAlasan.htmlFor = idAlasan;
      isianAlasan.appendChild(labelAlasan);
      var kolomAlasan = buat("textarea", "isian__kolom");
      kolomAlasan.id = idAlasan;
      kolomAlasan.rows = 2;
      kolomAlasan.maxLength = MAKS_ALASAN_ALIH;
      kolomAlasan.value = alasanAlih;
      kolomAlasan.disabled = alat.sedangKirim();
      kolomAlasan.addEventListener("input", function () {
        alasanAlih = kolomAlasan.value;
      });
      isianAlasan.appendChild(kolomAlasan);
      isianAlasan.appendChild(
        buat(
          "p",
          "isian__bantuan",
          "Maksimal " + MAKS_ALASAN_ALIH + " karakter.",
        ),
      );
      kartu.appendChild(isianAlasan);
      var g = barisGalat();
      if (g) kartu.appendChild(g);

      var baris = buat("div", "baris-tombol");
      baris.appendChild(
        buatTombol(
          "Kembali",
          "tombol--sekunder",
          tutupMode,
          alat.sedangKirim(),
        ),
      );
      var ya = buatTombol(
        "Ya, alihkan",
        "tombol--utama",
        function () {
          kirimAlih(o);
        },
        alat.sedangKirim(),
      );
      ya.id = alat.awalan + "-tombol-alih-ya";
      baris.appendChild(ya);
      kartu.appendChild(baris);
      return kartu;
    }

    // ---------------- Koreksi metode bayar (O23) ----------------

    function kirimMetode(o) {
      if (ada(METODE, metodeBaru) === false || metodeBaru === o.metode_bayar) {
        return;
      }
      alat.kirim(
        "order_metode_koreksi",
        { id: o.id, metode: metodeBaru },
        "Metode bayar order #" + o.nomor + " diubah ke " + metodeBaru + ".",
        "Metode bayar belum bisa diubah. Coba lagi sebentar lagi.",
      );
    }

    function kartuMetode(o) {
      var kartu = buat("div", "kartu");
      kartu.appendChild(
        buat("h2", "kartu__judul", "Koreksi metode bayar order #" + o.nomor),
      );
      kartu.appendChild(
        buat(
          "p",
          "isian__bantuan",
          (o.metode_bayar ? "Metode sekarang: " + o.metode_bayar + ". " : "") +
            "Perubahan tercatat di riwayat. Pilih metode yang benar.",
        ),
      );

      var tombolMetode = [];
      var tombolYa = buatTombol(
        "Simpan koreksi",
        "tombol--utama",
        function () {
          kirimMetode(o);
        },
        true,
      );
      tombolYa.id = alat.awalan + "-tombol-metode-ya";

      function tandai() {
        for (var i = 0; i < tombolMetode.length; i++) {
          var dipilih =
            tombolMetode[i].getAttribute("data-metode") === metodeBaru;
          tombolMetode[i].className =
            "tombol " + (dipilih ? "tombol--utama" : "tombol--sekunder");
          tombolMetode[i].setAttribute(
            "aria-pressed",
            dipilih ? "true" : "false",
          );
        }
        tombolYa.disabled =
          alat.sedangKirim() ||
          ada(METODE, metodeBaru) === false ||
          metodeBaru === o.metode_bayar;
      }

      var barisMetode = buat("div", "baris-tombol");
      for (var i = 0; i < METODE.length; i++) {
        (function (nama) {
          // Metode yang sama dengan yang sekarang tidak bisa dipilih (server menolak metode sama).
          var t = buatTombol(
            nama,
            "tombol--sekunder",
            function () {
              if (alat.sedangKirim()) return;
              metodeBaru = nama;
              tandai();
            },
            alat.sedangKirim() || nama === o.metode_bayar,
          );
          t.setAttribute("data-metode", nama);
          tombolMetode.push(t);
          barisMetode.appendChild(t);
        })(METODE[i]);
      }
      kartu.appendChild(barisMetode);

      var baris = buat("div", "baris-tombol");
      baris.appendChild(
        buatTombol(
          "Kembali",
          "tombol--sekunder",
          tutupMode,
          alat.sedangKirim(),
        ),
      );
      baris.appendChild(tombolYa);
      kartu.appendChild(baris);
      tandai();
      return kartu;
    }

    // ---------------- Kartu utama ----------------

    // Mengembalikan elemen untuk detail order o, atau null bila status tidak punya aksi owner.
    function kartu(o) {
      if (!o || !ada(STATUS_AKSI, o.status)) return null;
      if (mode === "batal") return kartuBatal(o);
      if (mode === "alih") return kartuAlih(o);
      if (mode === "metode") return kartuMetode(o);

      var k = buat("div", "kartu");
      k.appendChild(buat("h2", "kartu__judul", "Aksi owner"));
      var kunci = alat.sedangKirim();

      var maju = labelMaju(o);
      if (maju) {
        var barisMaju = buat("div", "baris-tombol");
        var tMaju = buatTombol(
          maju,
          "tombol--utama",
          function () {
            kirimStatus(o, "maju");
          },
          kunci,
        );
        tMaju.id = alat.awalan + "-tombol-status-maju";
        barisMaju.appendChild(tMaju);
        k.appendChild(barisMaju);
      }

      var mundur = labelMundur(o);
      if (mundur) {
        var barisMundur = buat("div", "baris-tombol");
        var tMundur = buatTombol(
          mundur,
          "tombol--sekunder",
          function () {
            kirimStatus(o, "mundur");
          },
          kunci,
        );
        tMundur.id = alat.awalan + "-tombol-status-mundur";
        barisMundur.appendChild(tMundur);
        k.appendChild(barisMundur);
      }

      var barisLain = buat("div", "baris-tombol");
      barisLain.appendChild(
        buatTombol(
          "Koreksi metode bayar",
          "tombol--sekunder",
          function () {
            bukaMode("metode");
          },
          kunci,
        ),
      );
      barisLain.appendChild(
        buatTombol(
          "Alihkan ke Besok",
          "tombol--sekunder",
          function () {
            bukaMode("alih");
          },
          kunci,
        ),
      );
      k.appendChild(barisLain);

      var barisBatal = buat("div", "baris-tombol");
      barisBatal.appendChild(
        buatTombol(
          "Batalkan order",
          "tombol--bahaya",
          function () {
            bukaMode("batal");
          },
          kunci,
        ),
      );
      k.appendChild(barisBatal);
      return k;
    }

    return { kartu: kartu, reset: reset };
  }

  window.KedaiOrderOwnerAksi = Object.freeze({ buat: buatAksi });
})();
