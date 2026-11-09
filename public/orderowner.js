// public/orderowner.js
// ORD.06 (giliran 1): layar owner Order Masuk (order.md O6, O7, O8, O11, O13, O22 dan bagian 4 "Layar owner").
// Tampil di dalam panel "ordermasuk" (tab Order Masuk) dengan dua langkah:
//   1. daftar : order berstatus Menunggu (aksi order_daftar dengan filter status "Menunggu").
//               Server yang menentukan isi dan urutannya (Hari ini dan Besok, O22).
//   2. detail : satu order (aksi order_detail) dengan tombol Setuju (wajib pilih metode bayar,
//               aksi order_setuju), Tolak (alasan opsional, aksi order_tolak), dan Chat WA (O13).
// Pola layarnya dibuat lewat satu pabrik (buatLayar) supaya layar Semua Order (giliran 2) memakai
// kode detail yang sama dengan daftar dan filter berbeda.
//
// ORD.06 (giliran 2): layar Semua Order (tab Semua Order, panel "semuaorder"). Daftarnya memuat order semua
// status. Tanpa filter: Hari ini dan Besok (O22, urutan dari server). Filter hari (satu tanggal) dan filter
// status dikirim ke order_daftar dan baru dipakai saat tombol Terapkan atau Segarkan ditekan (tanpa panggilan
// server tiap isian berubah). Detail, Setuju, Tolak, dan Chat WA sama dengan Order Masuk.
// Keputusan ketua (9 Nov 2026): saat tab Semua Order pertama dibuka sesudah masuk, filter terisi bawaan
// Hari = tanggal hari ini menurut jam HP dan Status = Menunggu; owner bebas mengganti atau mengosongkannya.
// Tanggal HP hanya mengisi kolom filter (tampilan); server tetap yang memvalidasi dan memfilter, dan tidak
// ada logika order yang memakai jam HP. Tombol Hapus filter tetap mengosongkan semuanya (Hari ini dan Besok).
// Dimuat SETELAH akun.js dan SEBELUM kerangka.js di index.html.
//
// Aturan yang dijaga:
// - Aplikasi hanya mengirim aksi, id order, metode bayar yang dipilih owner, dan alasan tolak.
//   Status, harga, peran, dan pemutus tidak pernah dikirim. Yang menolak akses sebenarnya server
//   (order_setuju dan order_tolak hanya untuk owner). Layar ini hanya kemudahan.
// - Metode bayar wajib dipilih owner (Transfer, Tunai, atau QRIS) sebelum tombol Setuju aktif (O6).
// - Dua owner menekan bersamaan: server menerima satu, yang lain dapat 409 (O7). Layar menampilkan
//   pesan server, lalu memuat ulang detail supaya status yang tampil pasti dari server.
// - Tombol dikunci sebelum permintaan berangkat (dua ketukan cepat tidak jadi dua panggilan).
// - Catatan order hanya DITAMPILKAN (baca saja). Menambah catatan dan tanda "Catatan baru" ada di
//   ORD.09 dan ORD.10. Riwayat status belum ditampilkan di sini.
// - Data diambil saat tab dibuka dan lewat tombol Segarkan. Tanpa polling (O19).
// - Pesan galat dari server ditampilkan apa adanya lewat textContent. Galat mentah tidak ditampilkan.
// - Semua teks dari server dan isian pengguna dipasang lewat textContent, bukan innerHTML.
// - Nomor WA dan alamat pemesan hanya tampil di detail, dan dikosongkan saat Keluar (reset).
// - Tidak ada panggilan server baru selain aksi yang sudah ada (order_daftar, order_detail,
//   order_setuju, order_tolak).

(function () {
  "use strict";

  var A = window.KedaiAkun;
  if (!A) {
    // akun.js belum termuat: window.KedaiOrderOwner tidak dibuat.
    return;
  }

  function el(id) {
    return document.getElementById(id);
  }

  var PESAN_UMUM_DAFTAR =
    "Daftar order belum bisa dimuat. Coba lagi sebentar lagi.";
  var PESAN_UMUM_DETAIL = "Order belum bisa dimuat. Coba lagi sebentar lagi.";
  var PESAN_OFFLINE = "Belum bisa terhubung. Periksa internet lalu coba lagi.";
  var PESAN_SESI = "Sesi sudah berakhir. Silakan keluar lalu masuk lagi.";
  var PESAN_SETUJU_UMUM =
    "Order belum bisa disetujui. Coba lagi sebentar lagi.";
  var PESAN_TOLAK_UMUM = "Order belum bisa ditolak. Coba lagi sebentar lagi.";
  // Jaringan putus SETELAH permintaan terkirim: hasilnya tidak pasti.
  var PESAN_TIDAK_PASTI =
    "Belum bisa memastikan keputusan sudah tersimpan. Tekan Segarkan untuk melihat status terbaru.";

  // O6: tiga metode yang boleh dipilih owner (server mencocokkan persis).
  var METODE = ["Transfer", "Tunai", "QRIS"];
  // O8: batas alasan tolak (server juga menolak lebih dari 200 karakter).
  var MAKS_ALASAN = 200;

  // Kelas lencana per status (warna di style.css, desain.md 4.2).
  var KELAS_STATUS = {
    Menunggu: "lencana--menunggu",
    Disetujui: "lencana--disetujui",
    Diproses: "lencana--diproses",
    Diantar: "lencana--siap",
    "Siap diambil": "lencana--siap",
    "Siap disajikan": "lencana--siap",
    Selesai: "lencana--selesai",
    Ditolak: "lencana--ditolak",
    Dibatalkan: "lencana--dibatalkan",
  };

  // O2: jam ditulis sebagai permintaan, bukan janji (sama dengan pesan.js).
  var FRASA_JAM = {
    Diantar: "Minta diantar jam ",
    Diambil: "Minta diambil jam ",
    "Makan di warung": "Makan di warung jam ",
  };
  var NAMA_HARI = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];
  var NAMA_BULAN = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  var REGEX_JAM = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
  var REGEX_TGL = /^\d{4}-\d{2}-\d{2}$/;
  // ORD.06 giliran 2: pilihan filter status di Semua Order (sama dengan daftar status di server).
  var STATUS_FILTER = [
    "Menunggu",
    "Disetujui",
    "Diproses",
    "Diantar",
    "Siap diambil",
    "Siap disajikan",
    "Selesai",
    "Ditolak",
    "Dibatalkan",
  ];

  // ------------------------------------------------------------
  // Pembantu
  // ------------------------------------------------------------

  function buat(tag, kelas, teks) {
    var e = document.createElement(tag);
    if (kelas) e.className = kelas;
    if (teks !== undefined) e.textContent = teks;
    return e;
  }

  function buatTombol(teks, kelas, aksi, mati) {
    var t = buat("button", "tombol " + kelas, teks);
    t.type = "button";
    t.disabled = !!mati;
    t.addEventListener("click", aksi);
    return t;
  }

  function kosongkan(e) {
    while (e.firstChild) {
      e.removeChild(e.firstChild);
    }
  }

  function rupiah(n) {
    return "Rp " + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function teksAtauKosong(v) {
    return typeof v === "string" ? v : "";
  }

  // Pesan dari fungsi kedai sendiri (ok:false + pesan) aman ditampilkan.
  function pesanServer(h) {
    return h &&
      h.data &&
      h.data.ok === false &&
      typeof h.data.pesan === "string"
      ? h.data.pesan
      : "";
  }

  // Tanggal dari server ("YYYY-MM-DD") menjadi "Senin, 9 Nov 2026". Kosong bila bentuknya salah.
  // Date hanya dipakai menebak nama hari dari tanggal server (UTC), bukan membaca jam HP.
  function tanggalIndo(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(teksAtauKosong(s));
    if (!m) return "";
    var bulan = Number(m[2]);
    var tgl = Number(m[3]);
    if (bulan < 1 || bulan > 12 || tgl < 1 || tgl > 31) return "";
    var d = new Date(Date.UTC(Number(m[1]), bulan - 1, tgl));
    return (
      NAMA_HARI[d.getUTCDay()] +
      ", " +
      tgl +
      " " +
      NAMA_BULAN[bulan - 1] +
      " " +
      m[1]
    );
  }

  function jamIndo(s) {
    var jam = teksAtauKosong(s).slice(0, 5);
    return REGEX_JAM.test(jam) ? jam.replace(":", ".") : "";
  }

  // Kalimat jam dan hari, misalnya "Minta diantar jam 11.00, Senin, 9 Nov 2026".
  function kalimatJam(tipe, jam, hari) {
    var j = jamIndo(jam);
    var h = tanggalIndo(hari);
    if (j === "" && h === "") return "";
    var teks = (FRASA_JAM[tipe] || "Jam ") + (j || "-");
    if (h) teks += ", " + h;
    return teks;
  }

  // Waktu catatan dari server (stempel waktu) ditulis dalam WIB. Hanya untuk tampilan.
  function waktuIndo(s) {
    var d = new Date(teksAtauKosong(s));
    if (isNaN(d.getTime())) return "";
    try {
      return d.toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch (e) {
      return "";
    }
  }

  // Nomor WA pemesan menjadi angka saja untuk tautan wa.me (O13).
  // Awalan 0 atau 8 diganti 62 (Indonesia). Bentuk yang tidak masuk akal: kosong (tombol tidak tampil).
  function nomorWaUntukTautan(s) {
    var angka = teksAtauKosong(s).replace(/\D/g, "");
    if (angka.indexOf("62") === 0) {
      // sudah berawalan 62
    } else if (angka.indexOf("0") === 0) {
      angka = "62" + angka.slice(1);
    } else if (angka.indexOf("8") === 0) {
      angka = "62" + angka;
    }
    return angka.length >= 10 && angka.length <= 15 ? angka : "";
  }

  // Tanggal hari ini menurut jam HP, "YYYY-MM-DD". HANYA untuk mengisi bawaan kolom filter (keputusan ketua);
  // tidak dipakai menghitung apa pun di order. Server tetap memvalidasi tanggal yang dikirim.
  function tanggalHpHariIni() {
    var d = new Date();
    var bln = String(d.getMonth() + 1);
    var tgl = String(d.getDate());
    return (
      d.getFullYear() +
      "-" +
      (bln.length < 2 ? "0" + bln : bln) +
      "-" +
      (tgl.length < 2 ? "0" + tgl : tgl)
    );
  }

  function lencanaStatus(status) {
    var kelas = KELAS_STATUS[status] || "lencana--dibatalkan";
    return buat("span", "lencana " + kelas, teksAtauKosong(status));
  }

  // Rapikan daftar order. Baris yang bentuknya salah dibuang.
  function bacaDaftar(d) {
    if (!Array.isArray(d)) return null;
    var hasil = [];
    for (var i = 0; i < d.length; i++) {
      var o = d[i];
      if (
        o &&
        typeof o.id === "string" &&
        typeof o.status === "string" &&
        typeof o.nomor === "number"
      ) {
        hasil.push({
          id: o.id,
          nomor: o.nomor,
          status: o.status,
          tipe: teksAtauKosong(o.tipe),
          total: typeof o.total === "number" ? o.total : null,
          ringkas: teksAtauKosong(o.ringkas),
          hari_target: teksAtauKosong(o.hari_target),
          jam_permintaan: teksAtauKosong(o.jam_permintaan),
          nama_pemesan: teksAtauKosong(o.nama_pemesan),
          dibuat_oleh: teksAtauKosong(o.dibuat_oleh_nama),
        });
      }
    }
    return hasil;
  }

  // Rapikan balasan order_detail. Null bila bukan order yang bentuknya benar.
  function bacaDetail(o) {
    if (
      !o ||
      typeof o !== "object" ||
      typeof o.id !== "string" ||
      typeof o.status !== "string" ||
      typeof o.nomor !== "number"
    ) {
      return null;
    }
    var item = [];
    if (Array.isArray(o.item)) {
      for (var i = 0; i < o.item.length; i++) {
        var it = o.item[i];
        if (!it || typeof it.nama_menu !== "string") continue;
        var pilihan = [];
        if (Array.isArray(it.pilihan)) {
          for (var k = 0; k < it.pilihan.length; k++) {
            if (typeof it.pilihan[k] === "string") pilihan.push(it.pilihan[k]);
          }
        }
        item.push({
          nama: it.nama_menu,
          jumlah: typeof it.jumlah === "number" ? it.jumlah : 1,
          harga: typeof it.harga_satuan === "number" ? it.harga_satuan : null,
          subtotal: typeof it.subtotal === "number" ? it.subtotal : null,
          pilihan: pilihan,
        });
      }
    }
    var catatan = [];
    if (Array.isArray(o.catatan)) {
      for (var c = 0; c < o.catatan.length; c++) {
        var ct = o.catatan[c];
        if (!ct || typeof ct.isi !== "string") continue;
        catatan.push({
          penulis: teksAtauKosong(ct.nama_penulis),
          isi: ct.isi,
          waktu: teksAtauKosong(ct.waktu),
        });
      }
    }
    return {
      id: o.id,
      nomor: o.nomor,
      status: o.status,
      tipe: teksAtauKosong(o.tipe),
      total: typeof o.total === "number" ? o.total : null,
      hari_target: teksAtauKosong(o.hari_target),
      jam_permintaan: teksAtauKosong(o.jam_permintaan),
      nama_pemesan: teksAtauKosong(o.nama_pemesan),
      nomor_wa: teksAtauKosong(o.nomor_wa_pemesan),
      alias_alamat: teksAtauKosong(o.alias_alamat),
      isi_alamat: teksAtauKosong(o.isi_alamat),
      alasan: teksAtauKosong(o.alasan_tolak),
      metode_bayar: teksAtauKosong(o.metode_bayar),
      pemutus_nama: teksAtauKosong(o.pemutus_nama),
      dibuat_oleh: teksAtauKosong(o.dibuat_oleh_nama),
      item: item,
      catatan: catatan,
    };
  }

  // ------------------------------------------------------------
  // Pabrik layar: satu layar = satu panel dengan daftar dan detail.
  // awalan : awalan id elemen di index.html (awalan-daftar-isi, awalan-kembali, dst.)
  // cfg    : { param(): isian order_daftar (dipakai bila tanpa filter), filter: true bila layar punya
  //            kolom filter hari dan status, awal(): isian filter bawaan saat pertama dibuka (opsional),
  //            kosongJudul, kosongKet, ringkas(n, saringan) }
  // ------------------------------------------------------------

  function buatLayar(awalan, cfg) {
    function e(akhiran) {
      return el(awalan + "-" + akhiran);
    }

    var langkah = "daftar"; // "daftar" | "detail"
    var idDetail = ""; // id order yang sedang dibuka di langkah detail
    var detailTerbuka = null; // order terakhir yang berhasil dimuat (sudah dirapikan)
    var mode = "lihat"; // "lihat" | "setuju" | "tolak" (kartu keputusan yang sedang terbuka)
    var metodePilih = ""; // metode bayar yang dipilih owner di mode setuju
    var alasanTeks = ""; // isi alasan tolak yang sedang diketik
    var sedangKirim = false;
    var nomorMuatDaftar = 0; // naik tiap muat dan reset; balasan lama diabaikan
    var nomorMuatDetail = 0;
    var nomorKirim = 0;
    var awalTerisi = false; // filter bawaan (cfg.awal) sudah diisi sejak masuk

    function tampilkanLangkah() {
      e("langkah-daftar").hidden = langkah !== "daftar";
      e("langkah-detail").hidden = langkah !== "detail";
      window.scrollTo(0, 0);
    }

    // ---------------- Filter (hanya layar dengan cfg.filter) ----------------

    // Baca isian filter. Nilai yang bentuknya salah dianggap kosong (server tetap mengecek ulang).
    function saringan() {
      if (!cfg.filter) return { hari: "", status: "" };
      var hari = e("filter-hari").value;
      var status = e("filter-status").value;
      return {
        hari: REGEX_TGL.test(hari) ? hari : "",
        status: STATUS_FILTER.indexOf(status) === -1 ? "" : status,
      };
    }

    // Isian order_daftar: hanya aksi dan filter. Tidak ada status, peran, atau id akun dari aplikasi.
    function ambilParam() {
      if (!cfg.filter) return cfg.param();
      var sar = saringan();
      var isi = {};
      if (sar.hari) isi.hari = sar.hari;
      if (sar.status) isi.status = sar.status;
      return isi;
    }

    function isiPilihanStatus() {
      var kolom = e("filter-status");
      kosongkan(kolom);
      var semua = buat("option", "", "Semua status");
      semua.value = "";
      kolom.appendChild(semua);
      for (var i = 0; i < STATUS_FILTER.length; i++) {
        var o = buat("option", "", STATUS_FILTER[i]);
        o.value = STATUS_FILTER[i];
        kolom.appendChild(o);
      }
    }

    function kosongkanFilter() {
      if (!cfg.filter) return;
      e("filter-hari").value = "";
      e("filter-status").value = "";
    }

    // Isi filter bawaan SEKALI sejak masuk (tab dibuka pertama kali). Sesudah itu pilihan owner dipertahankan.
    function isiFilterAwal() {
      if (!cfg.filter || !cfg.awal || awalTerisi) return;
      var a = cfg.awal();
      e("filter-hari").value = REGEX_TGL.test(a.hari) ? a.hari : "";
      e("filter-status").value =
        STATUS_FILTER.indexOf(a.status) === -1 ? "" : a.status;
      awalTerisi = true;
    }

    // ---------------- Daftar ----------------

    function pesanDaftar(teks) {
      var p = e("daftar-galat");
      p.textContent = teks || "";
      p.hidden = !teks;
    }

    function buatKartuDaftar(o) {
      var kartu = buat("div", "kartu");

      var atas = buat("div", "kartu-order__atas");
      atas.appendChild(buat("span", "kartu-order__nomor", "Order #" + o.nomor));
      atas.appendChild(lencanaStatus(o.status));
      kartu.appendChild(atas);

      if (o.nama_pemesan) {
        kartu.appendChild(buat("p", "menu-nama", o.nama_pemesan));
      }
      if (o.ringkas) {
        kartu.appendChild(buat("p", "kartu-order__baris", o.ringkas));
      }
      var jam = kalimatJam(o.tipe, o.jam_permintaan, o.hari_target);
      if (jam) kartu.appendChild(buat("p", "kartu-order__baris", jam));
      if (o.tipe) kartu.appendChild(buat("p", "isian__bantuan", o.tipe));
      if (o.dibuat_oleh) {
        kartu.appendChild(
          buat("p", "isian__bantuan", "Dibuat oleh " + o.dibuat_oleh),
        );
      }

      if (o.total !== null) {
        var bawah = buat("div", "kartu-order__bawah");
        bawah.appendChild(buat("span", "", "Total"));
        bawah.appendChild(buat("span", "", rupiah(o.total)));
        kartu.appendChild(bawah);
      }

      var baris = buat("div", "baris-tombol");
      var tombol = buatTombol("Lihat detail", "tombol--sekunder", function () {
        bukaDetail(o.id);
      });
      tombol.setAttribute("aria-label", "Lihat detail order " + o.nomor);
      baris.appendChild(tombol);
      kartu.appendChild(baris);
      return kartu;
    }

    function renderDaftar(daftar) {
      var wadah = e("daftar-isi");
      kosongkan(wadah);
      var sar = saringan();
      if (daftar.length === 0) {
        e("ringkas").textContent = "";
        var kosong = buat("div", "keadaan");
        if (sar.hari || sar.status) {
          kosong.appendChild(
            buat("p", "keadaan__judul", "Tidak ada order yang cocok"),
          );
          kosong.appendChild(
            buat("p", "keadaan__ket", "Coba ganti atau hapus filter."),
          );
        } else {
          kosong.appendChild(buat("p", "keadaan__judul", cfg.kosongJudul));
          kosong.appendChild(buat("p", "keadaan__ket", cfg.kosongKet));
        }
        wadah.appendChild(kosong);
        return;
      }
      e("ringkas").textContent = cfg.ringkas(daftar.length, sar);
      for (var i = 0; i < daftar.length; i++) {
        wadah.appendChild(buatKartuDaftar(daftar[i]));
      }
    }

    function muatDaftar() {
      var nomor = ++nomorMuatDaftar;
      pesanDaftar("");
      e("memuat").hidden = false;
      // ORD.06 giliran 2: layar dengan filter memakai ambilParam() (cfg.param hanya untuk layar tanpa filter).
      // return A.panggilKedai("order_daftar", cfg.param())
      return A.panggilKedai("order_daftar", ambilParam())
        .then(function (h) {
          if (nomor !== nomorMuatDaftar) return;
          e("memuat").hidden = true;
          if (h.status === 200 && h.data && h.data.ok === true) {
            var daftar = bacaDaftar(h.data.daftar);
            if (daftar) {
              renderDaftar(daftar);
              return;
            }
          }
          if (h.status === 401 && !h.data) {
            pesanDaftar(PESAN_SESI);
          } else {
            pesanDaftar(pesanServer(h) || PESAN_UMUM_DAFTAR);
          }
        })
        .catch(function () {
          if (nomor !== nomorMuatDaftar) return;
          e("memuat").hidden = true;
          pesanDaftar(navigator.onLine ? PESAN_UMUM_DAFTAR : PESAN_OFFLINE);
        });
    }

    // ---------------- Detail ----------------

    function pesanDetail(teks) {
      var p = e("detail-galat");
      p.textContent = teks || "";
      p.hidden = !teks;
    }

    function infoDetail(teks) {
      var p = e("detail-info");
      p.textContent = teks || "";
      p.hidden = !teks;
    }

    function setelKeputusanBatal() {
      mode = "lihat";
      metodePilih = "";
      alasanTeks = "";
    }

    // Baris Chat WA (O13): tautan membuka WhatsApp ke nomor pemesan. Tanpa nomor: tidak tampil.
    function buatTombolWa(o) {
      var angka = nomorWaUntukTautan(o.nomor_wa);
      if (!angka) return null;
      var a = buat("a", "tombol tombol--sekunder", "Chat WA");
      a.href = "https://wa.me/" + angka;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.setAttribute("aria-label", "Chat WA ke pemesan order " + o.nomor);
      return a;
    }

    // Kartu pilih metode bayar (mode setuju). Tombol Setuju baru aktif setelah metode dipilih (O6).
    function buatKartuSetuju(o) {
      var kartu = buat("div", "kartu");
      kartu.appendChild(
        buat("h2", "kartu__judul", "Metode bayar yang diterima"),
      );
      kartu.appendChild(
        buat(
          "p",
          "isian__bantuan",
          "Pilih cara pembayaran order #" +
            o.nomor +
            " diterima. Pembayaran diselesaikan di luar aplikasi.",
        ),
      );

      var tombolMetode = [];
      var tombolYa = buatTombol("Setuju", "tombol--utama", setuju, true);
      tombolYa.id = awalan + "-tombol-setuju-ya";

      function tandai() {
        for (var i = 0; i < tombolMetode.length; i++) {
          var dipilih =
            tombolMetode[i].getAttribute("data-metode") === metodePilih;
          tombolMetode[i].className =
            "tombol " + (dipilih ? "tombol--utama" : "tombol--sekunder");
          tombolMetode[i].setAttribute(
            "aria-pressed",
            dipilih ? "true" : "false",
          );
        }
        tombolYa.disabled = sedangKirim || METODE.indexOf(metodePilih) === -1;
      }

      var barisMetode = buat("div", "baris-tombol");
      for (var i = 0; i < METODE.length; i++) {
        (function (nama) {
          var t = buatTombol(
            nama,
            "tombol--sekunder",
            function () {
              if (sedangKirim) return;
              metodePilih = nama;
              tandai();
            },
            sedangKirim,
          );
          t.setAttribute("data-metode", nama);
          tombolMetode.push(t);
          barisMetode.appendChild(t);
        })(METODE[i]);
      }
      kartu.appendChild(barisMetode);

      var barisAksi = buat("div", "baris-tombol");
      barisAksi.appendChild(
        buatTombol(
          "Kembali",
          "tombol--sekunder",
          function () {
            mode = "lihat";
            metodePilih = "";
            pesanDetail("");
            renderDetail();
          },
          sedangKirim,
        ),
      );
      barisAksi.appendChild(tombolYa);
      kartu.appendChild(barisAksi);
      tandai();
      return kartu;
    }

    // Kartu alasan tolak (mode tolak). Alasan boleh kosong (O8).
    function buatKartuTolak(o) {
      var kartu = buat("div", "kartu");
      kartu.appendChild(
        buat("h2", "kartu__judul", "Tolak order #" + o.nomor + "?"),
      );
      kartu.appendChild(
        buat(
          "p",
          "kartu__isi",
          "Order yang ditolak tidak bisa dihidupkan lagi. Hubungi pemesan lewat WA bila perlu.",
        ),
      );

      var isian = buat("div", "isian");
      var label = buat(
        "label",
        "isian__label",
        "Alasan (boleh dikosongkan, tampil ke customer)",
      );
      var idKolom = awalan + "-alasan-tolak";
      label.htmlFor = idKolom;
      isian.appendChild(label);
      var kolom = buat("textarea", "isian__kolom");
      kolom.id = idKolom;
      kolom.rows = 3;
      kolom.maxLength = MAKS_ALASAN;
      kolom.value = alasanTeks;
      kolom.disabled = sedangKirim;
      kolom.addEventListener("input", function () {
        alasanTeks = kolom.value;
      });
      isian.appendChild(kolom);
      isian.appendChild(
        buat("p", "isian__bantuan", "Maksimal " + MAKS_ALASAN + " karakter."),
      );
      kartu.appendChild(isian);

      var barisAksi = buat("div", "baris-tombol");
      barisAksi.appendChild(
        buatTombol(
          "Kembali",
          "tombol--sekunder",
          function () {
            mode = "lihat";
            alasanTeks = "";
            pesanDetail("");
            renderDetail();
          },
          sedangKirim,
        ),
      );
      var tombolYa = buatTombol(
        "Ya, tolak",
        "tombol--bahaya",
        tolak,
        sedangKirim,
      );
      tombolYa.id = awalan + "-tombol-tolak-ya";
      barisAksi.appendChild(tombolYa);
      kartu.appendChild(barisAksi);
      return kartu;
    }

    function renderDetail() {
      var o = detailTerbuka;
      var wadah = e("detail-isi");
      kosongkan(wadah);
      if (!o) return;

      // Kartu utama: nomor, status, pemesan, tipe, jam, alamat.
      var kartu = buat("div", "kartu");
      var atas = buat("div", "kartu-order__atas");
      atas.appendChild(buat("span", "kartu-order__nomor", "Order #" + o.nomor));
      atas.appendChild(lencanaStatus(o.status));
      kartu.appendChild(atas);

      if (o.nama_pemesan) {
        kartu.appendChild(buat("p", "menu-nama", o.nama_pemesan));
      }
      if (o.nomor_wa) {
        kartu.appendChild(buat("p", "kartu-order__baris", "WA: " + o.nomor_wa));
      }
      if (o.dibuat_oleh) {
        kartu.appendChild(
          buat("p", "isian__bantuan", "Dibuat oleh " + o.dibuat_oleh),
        );
      }
      if (o.tipe) kartu.appendChild(buat("p", "kartu-order__baris", o.tipe));
      var jam = kalimatJam(o.tipe, o.jam_permintaan, o.hari_target);
      if (jam) kartu.appendChild(buat("p", "kartu-order__baris", jam));
      if (o.tipe === "Diantar" && (o.alias_alamat || o.isi_alamat)) {
        if (o.alias_alamat) {
          kartu.appendChild(buat("p", "kartu-order__baris", o.alias_alamat));
        }
        if (o.isi_alamat) {
          kartu.appendChild(buat("p", "isian__bantuan", o.isi_alamat));
        }
      }
      wadah.appendChild(kartu);

      // Alasan tolak atau batal (hanya bila ada).
      if (o.alasan && (o.status === "Ditolak" || o.status === "Dibatalkan")) {
        var kartuAlasan = buat("div", "kartu");
        kartuAlasan.appendChild(
          buat(
            "h2",
            "kartu__judul",
            o.status === "Ditolak" ? "Alasan ditolak" : "Alasan pembatalan",
          ),
        );
        kartuAlasan.appendChild(buat("p", "kartu__isi", o.alasan));
        wadah.appendChild(kartuAlasan);
      }

      // Item dan pilihan.
      var kartuItem = buat("div", "kartu");
      kartuItem.appendChild(buat("h2", "kartu__judul", "Isi order"));
      for (var i = 0; i < o.item.length; i++) {
        var it = o.item[i];
        var blok = buat("div", "");
        blok.appendChild(buat("p", "menu-nama", it.nama));
        for (var k = 0; k < it.pilihan.length; k++) {
          blok.appendChild(buat("p", "isian__bantuan", it.pilihan[k]));
        }
        var rincian = it.jumlah + " x ";
        rincian += it.harga !== null ? rupiah(it.harga) : "-";
        if (it.subtotal !== null) rincian += " = " + rupiah(it.subtotal);
        blok.appendChild(buat("p", "menu-harga", rincian));
        kartuItem.appendChild(blok);
      }
      if (o.total !== null) {
        var bawah = buat("div", "kartu-order__bawah");
        bawah.appendChild(buat("span", "", "Total"));
        bawah.appendChild(buat("span", "", rupiah(o.total)));
        kartuItem.appendChild(bawah);
      }
      wadah.appendChild(kartuItem);

      // Catatan (baca saja; menambah catatan di ORD.09 dan ORD.10).
      if (o.catatan.length > 0) {
        var kartuCatatan = buat("div", "kartu");
        kartuCatatan.appendChild(buat("h2", "kartu__judul", "Catatan"));
        for (var c = 0; c < o.catatan.length; c++) {
          var ct = o.catatan[c];
          var kepala = ct.penulis;
          var waktu = waktuIndo(ct.waktu);
          if (waktu) kepala += (kepala ? ", " : "") + waktu;
          if (kepala)
            kartuCatatan.appendChild(buat("p", "isian__bantuan", kepala));
          kartuCatatan.appendChild(buat("p", "kartu__isi", ct.isi));
        }
        wadah.appendChild(kartuCatatan);
      }

      // Pembayaran dan keputusan (hanya bila sudah diputuskan).
      if (o.metode_bayar || o.pemutus_nama) {
        var kartuBayar = buat("div", "kartu");
        kartuBayar.appendChild(buat("h2", "kartu__judul", "Keputusan"));
        if (o.metode_bayar) {
          kartuBayar.appendChild(
            buat("p", "kartu__isi", "Metode bayar: " + o.metode_bayar),
          );
        }
        if (o.pemutus_nama) {
          kartuBayar.appendChild(
            buat("p", "isian__bantuan", "Diputuskan oleh " + o.pemutus_nama),
          );
        }
        wadah.appendChild(kartuBayar);
      }

      // Aksi: Setuju dan Tolak hanya saat Menunggu (O6, O7). Chat WA untuk semua status (O13).
      if (o.status === "Menunggu") {
        if (mode === "setuju") {
          wadah.appendChild(buatKartuSetuju(o));
        } else if (mode === "tolak") {
          wadah.appendChild(buatKartuTolak(o));
        } else {
          var barisKeputusan = buat("div", "baris-tombol");
          barisKeputusan.appendChild(
            buatTombol(
              "Tolak",
              "tombol--bahaya",
              function () {
                mode = "tolak";
                pesanDetail("");
                infoDetail("");
                renderDetail();
              },
              sedangKirim,
            ),
          );
          barisKeputusan.appendChild(
            buatTombol(
              "Setuju",
              "tombol--utama",
              function () {
                mode = "setuju";
                pesanDetail("");
                infoDetail("");
                renderDetail();
              },
              sedangKirim,
            ),
          );
          wadah.appendChild(barisKeputusan);
        }
      }
      var tombolWa = buatTombolWa(o);
      if (tombolWa) {
        var barisWa = buat("div", "baris-tombol");
        barisWa.appendChild(tombolWa);
        wadah.appendChild(barisWa);
      }
    }

    function muatDetail(id) {
      var nomor = ++nomorMuatDetail;
      pesanDetail("");
      e("detail-memuat").hidden = false;
      return A.panggilKedai("order_detail", { id: id })
        .then(function (h) {
          if (nomor !== nomorMuatDetail) return;
          e("detail-memuat").hidden = true;
          if (h.status === 200 && h.data && h.data.ok === true) {
            var o = bacaDetail(h.data.order);
            if (o) {
              detailTerbuka = o;
              // Status sudah bukan Menunggu: kartu keputusan tidak berlaku lagi.
              if (o.status !== "Menunggu") setelKeputusanBatal();
              renderDetail();
              return;
            }
          }
          if (h.status === 401 && !h.data) {
            pesanDetail(PESAN_SESI);
          } else {
            pesanDetail(pesanServer(h) || PESAN_UMUM_DETAIL);
          }
          if (h.status === 404) {
            // Order tidak ada atau tidak boleh dilihat: tidak ada yang bisa ditampilkan lagi.
            detailTerbuka = null;
            renderDetail();
          }
        })
        .catch(function () {
          if (nomor !== nomorMuatDetail) return;
          e("detail-memuat").hidden = true;
          pesanDetail(navigator.onLine ? PESAN_UMUM_DETAIL : PESAN_OFFLINE);
        });
    }

    function bukaDetail(id) {
      langkah = "detail";
      idDetail = id;
      detailTerbuka = null;
      setelKeputusanBatal();
      infoDetail("");
      renderDetail();
      tampilkanLangkah();
      muatDetail(id);
    }

    function kembaliKeDaftar() {
      if (sedangKirim) return;
      nomorMuatDetail++;
      langkah = "daftar";
      idDetail = "";
      detailTerbuka = null;
      setelKeputusanBatal();
      pesanDetail("");
      infoDetail("");
      e("detail-memuat").hidden = true;
      renderDetail();
      tampilkanLangkah();
      muatDaftar();
    }

    // ---------------- Keputusan (O6, O7, O8). Server yang memutuskan. ----------------

    // Satu jalur kirim untuk Setuju dan Tolak.
    // aksi: "order_setuju" | "order_tolak"; isi: isian tanpa status atau peran; infoSukses: teks setelah berhasil.
    function kirim(aksi, isi, infoSukses, pesanUmum) {
      if (
        sedangKirim ||
        !detailTerbuka ||
        detailTerbuka.status !== "Menunggu"
      ) {
        return;
      }
      var id = detailTerbuka.id;
      // Kunci sebelum permintaan berangkat: dua ketukan cepat tidak boleh jadi dua panggilan.
      sedangKirim = true;
      var nomor = ++nomorKirim;
      pesanDetail("");
      infoDetail("");
      renderDetail();

      A.panggilKedai(aksi, isi)
        .then(function (h) {
          if (nomor !== nomorKirim) return; // sudah Keluar: balasan lama diabaikan
          sedangKirim = false;
          if (h.status === 200 && h.data && h.data.ok === true) {
            setelKeputusanBatal();
            // Muat ulang dari server supaya status yang tampil pasti dari server.
            muatDetail(id).then(function () {
              if (nomor === nomorKirim) infoDetail(infoSukses);
            });
            return;
          }
          if (h.status === 401 && !h.data) {
            pesanDetail(PESAN_SESI);
            renderDetail();
            return;
          }
          var pesan = pesanServer(h) || pesanUmum;
          pesanDetail(pesan);
          // 409 (owner lain sudah memutuskan, atau order sudah batal) dan 404: status di layar usang.
          if (h.status === 409 || h.status === 404) {
            setelKeputusanBatal();
            muatDetail(id).then(function () {
              pesanDetail(pesan);
            });
            return;
          }
          renderDetail();
        })
        .catch(function () {
          if (nomor !== nomorKirim) return;
          sedangKirim = false;
          pesanDetail(navigator.onLine ? PESAN_TIDAK_PASTI : PESAN_OFFLINE);
          renderDetail();
        });
    }

    function setuju() {
      if (!detailTerbuka || METODE.indexOf(metodePilih) === -1) return;
      kirim(
        "order_setuju",
        { id: detailTerbuka.id, metode: metodePilih },
        "Order #" + detailTerbuka.nomor + " disetujui.",
        PESAN_SETUJU_UMUM,
      );
    }

    function tolak() {
      if (!detailTerbuka) return;
      var alasan = alasanTeks.trim();
      if (alasan.length > MAKS_ALASAN) {
        pesanDetail(
          "Alasan terlalu panjang (maksimal " + MAKS_ALASAN + " karakter).",
        );
        return;
      }
      kirim(
        "order_tolak",
        { id: detailTerbuka.id, alasan: alasan },
        "Order #" + detailTerbuka.nomor + " ditolak.",
        PESAN_TOLAK_UMUM,
      );
    }

    // ---------------- Dipanggil kerangka.js ----------------

    // Tab dibuka atau Segarkan ditekan: muat ulang layar yang sedang tampil.
    function tampil() {
      isiFilterAwal(); // ORD.06 giliran 2: bawaan filter Semua Order (hanya sekali sejak masuk)
      if (langkah === "detail" && idDetail) {
        if (sedangKirim) return;
        muatDetail(idDetail);
      } else {
        muatDaftar();
      }
    }

    // Keluar: tidak boleh ada daftar, detail, nomor WA, atau alamat tersisa di layar (data pribadi).
    function reset() {
      nomorMuatDaftar++;
      nomorMuatDetail++;
      nomorKirim++;
      sedangKirim = false;
      langkah = "daftar";
      idDetail = "";
      detailTerbuka = null;
      setelKeputusanBatal();
      kosongkan(e("daftar-isi"));
      kosongkan(e("detail-isi"));
      kosongkanFilter(); // ORD.06 giliran 2
      awalTerisi = false; // masuk berikutnya mengisi filter bawaan lagi
      e("ringkas").textContent = "";
      e("memuat").hidden = true;
      e("detail-memuat").hidden = true;
      pesanDaftar("");
      pesanDetail("");
      infoDetail("");
      tampilkanLangkah();
    }

    e("kembali").addEventListener("click", kembaliKeDaftar);

    // ORD.06 giliran 2: tombol Terapkan dan Hapus filter (hanya layar dengan filter).
    if (cfg.filter) {
      isiPilihanStatus();
      e("filter-terapkan").addEventListener("click", function () {
        muatDaftar();
      });
      e("filter-hapus").addEventListener("click", function () {
        kosongkanFilter();
        muatDaftar();
      });
    }

    return { tampil: tampil, reset: reset };
  }

  // ------------------------------------------------------------
  // Layar Order Masuk (ORD.06 giliran 1)
  // ------------------------------------------------------------

  var layarMasuk = buatLayar("ordermasuk", {
    // Hanya order Menunggu. Server membatasi owner ke Hari ini dan Besok (O22).
    param: function () {
      return { status: "Menunggu" };
    },
    kosongJudul: "Belum ada order masuk",
    kosongKet: "Order baru yang menunggu keputusan akan muncul di sini.",
    ringkas: function (n) {
      return n + " order menunggu keputusan.";
    },
  });

  // ------------------------------------------------------------
  // Layar Semua Order (ORD.06 giliran 2)
  // ------------------------------------------------------------

  var layarSemua = buatLayar("semuaorder", {
    // Filter hari dan status dibaca dari isian layar (lihat ambilParam).
    filter: true,
    // Keputusan ketua: bawaan Hari = hari ini (jam HP) dan Status = Menunggu.
    awal: function () {
      return { hari: tanggalHpHariIni(), status: "Menunggu" };
    },
    kosongJudul: "Belum ada order",
    kosongKet: "Order Hari ini dan Besok akan muncul di sini.",
    ringkas: function (n, sar) {
      var teks =
        n +
        " order, " +
        (sar.hari ? tanggalIndo(sar.hari) : "Hari ini dan Besok");
      if (sar.status) teks += ", status " + sar.status;
      return teks + ".";
    },
  });

  // ORD.06 giliran 1: window.KedaiOrderOwner = Object.freeze({ tampilMasuk, reset (hanya layarMasuk) })
  window.KedaiOrderOwner = Object.freeze({
    tampilMasuk: layarMasuk.tampil, // dipanggil kerangka.js saat tab Order Masuk dibuka
    tampilSemua: layarSemua.tampil, // dipanggil kerangka.js saat tab Semua Order dibuka
    reset: function () {
      // dipanggil kerangka.js saat Keluar
      layarMasuk.reset();
      layarSemua.reset();
    },
  });
})();
