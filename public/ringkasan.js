// public/ringkasan.js
// RKS.03: layar Ringkasan order 7 hari untuk owner (ringkasan.md RK1 sampai RK15; desain.md DS13).
// Tampil di dalam panel "ringkasan" (#panel-ringkasan di index.html), dibuka dari item "Ringkasan order 7 hari"
// di Home owner (diatur kerangka.js). Isi diambil dari aksi `ringkasan_7hari`.
// Balasan: { ok: true, ringkasan: { hari_ini, total_order, total_nilai, rata_rata_order,
//   per_hari: [{ tanggal, hari (1 = Senin sampai 7), jumlah, nilai } x 7], belum_ada_perbedaan,
//   terlaris, tersepi (masing-masing { tanggal, hari, jumlah } atau null) } }.
// Dimuat SETELAH akun.js (memakai window.KedaiAkun) dan SEBELUM kerangka.js di index.html.
//
// Aturan yang dijaga:
// - Aplikasi hanya MENGGAMBAR. Tidak menjumlah, tidak menentukan hari, tidak menentukan terlaris atau
//   tersepi, dan tidak memakai jam HP (RK10). Hari ini dan kode hari datang dari server.
// - Hanya nama aksi yang dikirim. Peran tidak dikirim (server membacanya dari tabel staf, RK1).
// - Data diambil saat layar dibuka dan lewat tombol Segarkan. Tanpa polling, tanpa Realtime (RK11).
// - Jeda Segarkan (keputusan ketua 13 Nov 2026): setelah satu pemuatan, tombol Segarkan di layar ini mati
//   sekitar 5 detik ("Tunggu sebentar"), dan selama jeda layar hanya menampilkan hasil terakhir dari MEMORI,
//   tanpa memanggil server. Hasil TIDAK disimpan di localStorage atau tempat lain; hanya di memori selama
//   aplikasi terbuka, dan dibuang saat Keluar. Angka 5 detik di kode ini (bawaan), bukan di `pengaturan`.
// - Semua teks dari server lewat textContent, bukan innerHTML. Galat mentah tidak ditampilkan.
// - Grafik dari SVG sendiri, tanpa pustaka dan tanpa CDN. Angka selalu tertulis di batang (tidak hanya warna).
// - Keadaan khusus mengikuti DS13: memuat, kosong, galat, offline.
// - Balasan hanya angka dan tanggal, tanpa data pribadi (RK15).
// - Tombol Kembali (#ringkasan-kembali) dipasang di sini dan ditangani kerangka.js. Gaya di ringkasan.css (rks-).

(function () {
  "use strict";

  var A = window.KedaiAkun;
  if (!A) {
    // akun.js belum termuat: window.KedaiRingkasan tidak dibuat.
    return;
  }

  var panel = document.getElementById("panel-ringkasan");
  if (!panel) {
    // Panel belum ada di index.html: tidak membuat apa-apa.
    return;
  }

  var JEDA_MS = 5000;

  var PESAN_UMUM = "Ringkasan belum bisa dimuat. Coba lagi sebentar lagi.";
  var PESAN_OFFLINE =
    "Belum bisa terhubung. Aplikasi tetap bisa dibuka, tetapi ringkasan butuh internet. Sambungkan internet lalu coba lagi.";
  var PESAN_SESI = "Sesi sudah berakhir. Silakan keluar lalu masuk lagi.";
  var KETERANGAN =
    "Tidak termasuk order Ditolak dan Dibatalkan. Order Menunggu ikut dihitung.";

  var NAMA_HARI = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
    "Minggu",
  ];
  var HARI_SINGKAT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  var BULAN = [
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

  var NS_SVG = "http://www.w3.org/2000/svg";

  var bungkusIsi = null; // wadah isi layar; dibuat sekali saat pertama dibuka
  var tombolSegar = null; // tombol Segarkan di layar ini
  var nomorMuat = 0; // penanda permintaan terbaru; balasan lama diabaikan (juga setelah Keluar)
  var sedangMuat = false;
  var dataTerakhir = null; // hasil terakhir, hanya di memori
  var jedaSampai = 0; // performance.now() akhir jeda (hanya untuk batas Segarkan, bukan waktu order)
  var timerJeda = null; // satu penghitung waktu tombol, bukan polling

  function buat(tag, kelas, teks) {
    var e = document.createElement(tag);
    if (kelas) {
      e.className = kelas;
    }
    if (teks !== undefined) {
      e.textContent = teks;
    }
    return e;
  }

  function svgEl(tag, atribut) {
    var e = document.createElementNS(NS_SVG, tag);
    for (var k in atribut) {
      if (Object.prototype.hasOwnProperty.call(atribut, k)) {
        e.setAttribute(k, String(atribut[k]));
      }
    }
    return e;
  }

  // Ikon keadaan khusus (DS11: selalu ada ikon dan tulisan, tidak hanya warna).
  function buatIkon(daftarPath) {
    var s = svgEl("svg", {
      class: "keadaan__ikon",
      viewBox: "0 0 24 24",
      "aria-hidden": "true",
    });
    for (var i = 0; i < daftarPath.length; i++) {
      s.appendChild(svgEl("path", { d: daftarPath[i] }));
    }
    return s;
  }

  var IKON_KOSONG = [
    "M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20z",
    "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3",
    "M12 17h.01",
  ];
  var IKON_GALAT = ["M12 3L2 21h20L12 3z", "M12 10v5M12 18v.01"];
  var IKON_OFFLINE = [
    "M2 8.8a15 15 0 0 1 20 0",
    "M5 12.5a10 10 0 0 1 14 0",
    "M8.5 16a5 5 0 0 1 7 0",
    "M12 19.5v.01",
    "M3 3l18 18",
  ];

  function kosongkan() {
    while (bungkusIsi.firstChild) {
      bungkusIsi.removeChild(bungkusIsi.firstChild);
    }
  }

  // Pesan dari fungsi kedai sendiri (ok:false + pesan) aman ditampilkan; balasan platform diganti pesan umum.
  function pesanServer(h) {
    if (
      h &&
      h.data &&
      h.data.ok === false &&
      typeof h.data.pesan === "string"
    ) {
      return h.data.pesan;
    }
    return "";
  }

  // Satu bentuk keadaan khusus (DS13). `denganUlang` = tombol Coba lagi.
  function keadaan(judul, ket, ikon, galat, denganUlang) {
    var k = buat("div", galat ? "keadaan keadaan--galat" : "keadaan");
    k.setAttribute("role", galat ? "alert" : "status");
    k.appendChild(buatIkon(ikon));
    k.appendChild(buat("p", "keadaan__judul", judul));
    k.appendChild(buat("p", "keadaan__ket", ket));
    if (denganUlang) {
      var t = buat("button", "tombol tombol--sekunder", "Coba lagi");
      t.type = "button";
      t.addEventListener("click", muatBila);
      k.appendChild(t);
    }
    return k;
  }

  function tampilMemuat() {
    kosongkan();
    var k = buat("div", "keadaan");
    k.setAttribute("role", "status");
    var putar = buat("div", "putaran");
    putar.setAttribute("aria-hidden", "true");
    k.appendChild(putar);
    k.appendChild(buat("p", "keadaan__judul", "Sedang memuat..."));
    bungkusIsi.appendChild(k);
  }

  // RK13: belum ada order sama sekali dalam 7 hari. Tanpa grafik kosong.
  function tampilKosong() {
    kosongkan();
    bungkusIsi.appendChild(
      keadaan(
        "Belum ada order",
        "Belum ada order dalam 7 hari terakhir",
        IKON_KOSONG,
        false,
        false,
      ),
    );
  }

  function tampilGalat(pesan) {
    kosongkan();
    bungkusIsi.appendChild(
      keadaan("Ada masalah", pesan, IKON_GALAT, true, true),
    );
  }

  function tampilOffline() {
    kosongkan();
    bungkusIsi.appendChild(
      keadaan("Tidak ada internet", PESAN_OFFLINE, IKON_OFFLINE, false, true),
    );
  }

  // ------------------------------------------------------------
  // Pemformat angka dan tanggal (hanya tampilan; angkanya dari server)
  // ------------------------------------------------------------

  function angka(v) {
    var n = Number(v);
    return isFinite(n) ? n : 0;
  }

  // "Rp 1.250.000"
  function rupiah(n) {
    var s = String(Math.round(angka(n)));
    return "Rp " + s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // Satu angka di belakang koma: "12,3"
  function desimal(n) {
    return angka(n).toFixed(1).replace(".", ",");
  }

  // Angka pendek di atas batang nilai uang: 1,25jt, 250rb, 0
  function ringkas(n) {
    var x = Math.round(angka(n));
    if (x >= 1000000) {
      var juta = x / 1000000;
      var teks = juta >= 10 ? juta.toFixed(1) : juta.toFixed(2);
      return String(parseFloat(teks)).replace(".", ",") + "jt";
    }
    if (x >= 1000) {
      return Math.round(x / 1000) + "rb";
    }
    return String(x);
  }

  // "2026-11-09" -> { hari: 9, bulan: 11 }; bentuk lain: null
  function pecahTanggal(teks) {
    var c = /^(\d{4})-(\d{2})-(\d{2})/.exec(
      typeof teks === "string" ? teks : "",
    );
    if (!c) {
      return null;
    }
    var bulan = parseInt(c[2], 10);
    var hari = parseInt(c[3], 10);
    if (bulan < 1 || bulan > 12 || hari < 1 || hari > 31) {
      return null;
    }
    return { hari: hari, bulan: bulan };
  }

  function teksTanggal(teks) {
    var t = pecahTanggal(teks);
    return t ? t.hari + " " + BULAN[t.bulan - 1] : "";
  }

  function kodeHariSah(k) {
    return typeof k === "number" && k >= 1 && k <= 7 && Math.floor(k) === k;
  }

  function namaHari(k) {
    return kodeHariSah(k) ? NAMA_HARI[k - 1] : "";
  }

  function hariSingkat(k) {
    return kodeHariSah(k) ? HARI_SINGKAT[k - 1] : "";
  }

  // ------------------------------------------------------------
  // Gambar: kartu angka, grafik batang, kartu hari
  // ------------------------------------------------------------

  function kotakAngka(label, nilai, lebar) {
    var k = buat("div", "kartu rks-kotak" + (lebar ? " rks-kotak--lebar" : ""));
    k.appendChild(buat("p", "rks-kotak__label", label));
    k.appendChild(buat("p", "rks-kotak__nilai", nilai));
    return k;
  }

  // Grafik batang SVG. `kunci` = "jumlah" atau "nilai"; `format` mengubah angka jadi tulisan di atas batang.
  function buatGrafik(perHari, hariIni, kunci, format, ariaLabel) {
    var n = perHari.length;
    var LEBAR = 350;
    var ATAS = 22; // ruang untuk angka di atas batang tertinggi
    var TINGGI = 120; // tinggi area batang
    var BAWAH = 56; // ruang label hari di bawah
    var kolom = LEBAR / n;
    var lebarBatang = Math.min(28, kolom * 0.6);
    var dasar = ATAS + TINGGI;

    var maks = 0;
    for (var i = 0; i < n; i++) {
      var v = angka(perHari[i] ? perHari[i][kunci] : 0);
      if (v > maks) {
        maks = v;
      }
    }

    var svg = svgEl("svg", {
      class: "rks-grafik",
      viewBox: "0 0 " + LEBAR + " " + (ATAS + TINGGI + BAWAH),
      role: "img",
      "aria-label": ariaLabel,
    });
    svg.appendChild(
      svgEl("line", {
        class: "rks-garis",
        x1: 0,
        y1: dasar,
        x2: LEBAR,
        y2: dasar,
      }),
    );

    for (var j = 0; j < n; j++) {
      var b = perHari[j] && typeof perHari[j] === "object" ? perHari[j] : {};
      var nilai = angka(b[kunci]);
      var tinggi = maks > 0 ? Math.round((nilai / maks) * TINGGI) : 0;
      if (nilai > 0 && tinggi < 3) {
        tinggi = 3; // batang kecil tetap kelihatan
      }
      var tengah = kolom * j + kolom / 2;
      var ini = typeof hariIni === "string" && b.tanggal === hariIni;

      svg.appendChild(
        svgEl("rect", {
          class: ini ? "rks-batang rks-batang--ini" : "rks-batang",
          x: tengah - lebarBatang / 2,
          y: dasar - tinggi,
          width: lebarBatang,
          height: tinggi,
          rx: 3,
        }),
      );

      var tNilai = svgEl("text", {
        class: "rks-nilai",
        x: tengah,
        y: dasar - tinggi - 5,
      });
      tNilai.textContent = format(nilai);
      svg.appendChild(tNilai);

      var tHari = svgEl("text", {
        class: "rks-label",
        x: tengah,
        y: dasar + 17,
      });
      tHari.textContent = hariSingkat(b.hari);
      svg.appendChild(tHari);

      var tgl = pecahTanggal(b.tanggal);
      var tTgl = svgEl("text", {
        class: "rks-label",
        x: tengah,
        y: dasar + 33,
      });
      tTgl.textContent = tgl ? String(tgl.hari) : "";
      svg.appendChild(tTgl);

      if (ini) {
        var tIni = svgEl("text", {
          class: "rks-label rks-label--ini",
          x: tengah,
          y: dasar + 48,
        });
        tIni.textContent = "Hari ini";
        svg.appendChild(tIni);
      }
    }
    return svg;
  }

  function kartuGrafik(judul, svg) {
    var k = buat("div", "kartu");
    k.appendChild(buat("h2", "kartu__judul", judul));
    k.appendChild(svg);
    return k;
  }

  // Kartu hari terlaris atau tersepi (RK9): nama hari, tanggal, jumlah order.
  function kartuHari(judul, info, belumBeda) {
    var k = buat("div", "kartu");
    k.appendChild(buat("h2", "kartu__judul", judul));
    if (belumBeda === true || !info || typeof info !== "object") {
      k.appendChild(buat("p", "kartu__isi", "Belum ada perbedaan"));
      return k;
    }
    var baris = [];
    var nama = namaHari(info.hari);
    var tgl = teksTanggal(info.tanggal);
    if (nama) baris.push(nama);
    if (tgl) baris.push(tgl);
    k.appendChild(buat("p", "rks-hari__nama", baris.join(", ")));
    k.appendChild(buat("p", "rks-hari__jumlah", angka(info.jumlah) + " order"));
    return k;
  }

  // Susun seluruh layar dari satu balasan. Semua angka dari server dipakai apa adanya.
  function tampilRingkasan(r) {
    var perHari = r.per_hari;
    if (angka(r.total_order) === 0) {
      tampilKosong();
      return;
    }
    kosongkan();

    var grid = buat("div", "rks-angka");
    grid.appendChild(
      kotakAngka("Total nilai uang (7 hari)", rupiah(r.total_nilai), true),
    );
    grid.appendChild(
      kotakAngka("Total order (7 hari)", String(angka(r.total_order)), false),
    );
    grid.appendChild(
      kotakAngka("Rata-rata per hari", desimal(r.rata_rata_order), false),
    );
    bungkusIsi.appendChild(grid);

    bungkusIsi.appendChild(
      kartuGrafik(
        "Jumlah order per hari",
        buatGrafik(
          perHari,
          r.hari_ini,
          "jumlah",
          function (n) {
            return String(Math.round(n));
          },
          "Grafik batang jumlah order per hari selama 7 hari",
        ),
      ),
    );
    bungkusIsi.appendChild(
      kartuGrafik(
        "Nilai uang per hari",
        buatGrafik(
          perHari,
          r.hari_ini,
          "nilai",
          ringkas,
          "Grafik batang nilai uang per hari selama 7 hari",
        ),
      ),
    );

    bungkusIsi.appendChild(
      kartuHari("Hari terlaris", r.terlaris, r.belum_ada_perbedaan),
    );
    bungkusIsi.appendChild(
      kartuHari("Hari tersepi", r.tersepi, r.belum_ada_perbedaan),
    );

    bungkusIsi.appendChild(buat("p", "isian__bantuan rks-ket", KETERANGAN));
  }

  // ------------------------------------------------------------
  // Jeda Segarkan (5 detik) dan pemuatan
  // ------------------------------------------------------------

  function aturTombol(mati) {
    if (!tombolSegar) {
      return;
    }
    tombolSegar.disabled = mati;
    tombolSegar.textContent = mati ? "Tunggu sebentar" : "Segarkan";
  }

  function selesaiJeda() {
    if (timerJeda) {
      clearTimeout(timerJeda);
      timerJeda = null;
    }
    jedaSampai = 0;
    aturTombol(false);
  }

  function mulaiJeda() {
    if (timerJeda) {
      clearTimeout(timerJeda);
    }
    jedaSampai = performance.now() + JEDA_MS;
    aturTombol(true);
    timerJeda = setTimeout(function () {
      timerJeda = null;
      jedaSampai = 0;
      aturTombol(false);
    }, JEDA_MS);
  }

  function muat() {
    var nomor = ++nomorMuat;
    if (!navigator.onLine) {
      tampilOffline();
      return;
    }
    sedangMuat = true;
    tampilMemuat();
    mulaiJeda();
    A.panggilKedai("ringkasan_7hari", {})
      .then(function (h) {
        if (nomor !== nomorMuat) {
          return; // sudah Keluar atau ada permintaan lebih baru
        }
        sedangMuat = false;
        if (
          h.status === 200 &&
          h.data &&
          h.data.ok === true &&
          h.data.ringkasan &&
          typeof h.data.ringkasan === "object" &&
          Array.isArray(h.data.ringkasan.per_hari)
        ) {
          dataTerakhir = h.data.ringkasan;
          tampilRingkasan(dataTerakhir);
          return;
        }
        // Gagal: jeda dibatalkan supaya Coba lagi bisa langsung dipakai.
        selesaiJeda();
        if (h.status === 401) {
          tampilGalat(PESAN_SESI);
          return;
        }
        tampilGalat(pesanServer(h) || PESAN_UMUM);
      })
      .catch(function () {
        if (nomor !== nomorMuat) {
          return;
        }
        sedangMuat = false;
        selesaiJeda();
        if (!navigator.onLine) {
          tampilOffline();
        } else {
          tampilGalat(PESAN_UMUM);
        }
      });
  }

  // Dipakai tombol Segarkan dan Coba lagi: tidak menumpuk permintaan, tidak melewati jeda.
  function muatBila() {
    if (sedangMuat) {
      return;
    }
    if (dataTerakhir && performance.now() < jedaSampai) {
      return;
    }
    muat();
  }

  // Wadah dibuat sekali: baris tombol (Kembali dan Segarkan) dan wadah isi.
  function pasangKerangka() {
    if (bungkusIsi) {
      return;
    }
    var baris = buat("div", "baris-tombol");
    var kembali = buat("button", "tombol tombol--sekunder", "Kembali");
    kembali.type = "button";
    kembali.id = "ringkasan-kembali";
    baris.appendChild(kembali);
    tombolSegar = buat("button", "tombol tombol--sekunder", "Segarkan");
    tombolSegar.type = "button";
    tombolSegar.id = "ringkasan-segarkan";
    tombolSegar.addEventListener("click", muatBila);
    baris.appendChild(tombolSegar);
    panel.appendChild(baris);

    bungkusIsi = buat("div", "rks-isi");
    bungkusIsi.id = "ringkasan-isi";
    panel.appendChild(bungkusIsi);
  }

  // Dipanggil kerangka.js saat tab dibuka (dan saat Segarkan di bilah atas memuat ulang status).
  // Di dalam jeda dan hasil terakhir ada: gambar ulang dari memori, tanpa panggilan server.
  function tampil() {
    pasangKerangka();
    if (sedangMuat) {
      return;
    }
    if (dataTerakhir && performance.now() < jedaSampai) {
      tampilRingkasan(dataTerakhir);
      return;
    }
    muat();
  }

  // Dipanggil kerangka.js saat Keluar: angka omzet tidak boleh tersisa, balasan yang masih di jalan diabaikan.
  function reset() {
    nomorMuat++;
    sedangMuat = false;
    dataTerakhir = null;
    selesaiJeda();
    if (bungkusIsi) {
      kosongkan();
    }
  }

  window.KedaiRingkasan = Object.freeze({
    tampil: tampil,
    reset: reset,
  });
})();
