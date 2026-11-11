// public/orderpenjaga.js
// ORD.08: layar penjaga Antrean (order.md O5, O10, O11, O22 dan bagian 4 "Layar penjaga").
// Tampil di dalam panel "antrean" (tab Antrean) dengan dua langkah:
//   1. daftar : satu panggilan order_daftar, lalu dibagi ke EMPAT TAB di layar (tanpa panggilan server
//               tambahan saat pindah tab): Baru (Disetujui), Diproses, Siap (Diantar, Siap diambil,
//               Siap disajikan), dan Selesai. Angka di tiap tab = jumlah order. Urutan dan isi dari server
//               (Disetujui ke atas, Hari ini dan Besok, O11 dan O22); layar hanya membaginya ke tab.
//               Di dalam tab, order dikelompokkan per tanggal antar (tanggal dari server).
//   2. detail : satu order (aksi order_detail), catatan hanya baca (O12), tombol langkah berikutnya, dan
//               tombol kecil untuk mundur satu langkah (O10).
// Tombol langkah berikutnya ada langsung di kartu daftar (tanpa dialog konfirmasi, keputusan ketua):
// salah pencet ditutup oleh mundur satu langkah (O10).
// Dimuat SETELAH akun.js dan SEBELUM kerangka.js di index.html.
//
// Aturan yang dijaga:
// - Aplikasi hanya mengirim aksi order_status dengan { id, arah, status_dilihat }. Status tujuan, peran,
//   dan identitas tidak pernah dikirim; server yang menentukan dan menolak (Handoff #12). Layar ini
//   hanya kemudahan.
// - status_dilihat = status yang sedang tampil; bila beda dengan server, server menjawab 409 dan layar
//   memuat ulang (dobel pencet atau owner membatalkan lebih dulu).
// - Tombol dikunci sebelum permintaan berangkat (dua ketukan cepat tidak jadi dua panggilan).
// - Penjaga hanya membaca catatan. Tombol Chat WA khusus owner (O13), jadi tidak ada di sini.
// - Data diambil saat tab dibuka dan lewat tombol Segarkan. Tanpa polling (O19).
// - Semua teks dari server dipasang lewat textContent, bukan innerHTML. Galat mentah tidak ditampilkan.
// - Nomor WA dan alamat pemesan hanya tampil di detail, dan dikosongkan saat Keluar (reset).
// - Tidak ada panggilan server baru selain aksi yang sudah ada (order_daftar, order_detail, order_status).
// - FTO.03: aksi foto (foto_minta_unggah, foto_catat) dipanggil foto.js, bukan di berkas ini.

(function () {
  "use strict";

  var A = window.KedaiAkun;
  if (!A) {
    // akun.js belum termuat: window.KedaiOrderPenjaga tidak dibuat.
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
  var PESAN_STATUS_UMUM =
    "Status order belum bisa diubah. Coba lagi sebentar lagi.";
  // Jaringan putus SETELAH permintaan terkirim: hasilnya tidak pasti.
  var PESAN_TIDAK_PASTI =
    "Belum bisa memastikan perubahan sudah tersimpan. Tekan Segarkan untuk melihat status terbaru.";

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

  // Empat tab Antrean. `status` = status order yang masuk ke tab itu.
  var URUTAN_TAB = ["baru", "diproses", "siap", "selesai"];
  var TAB = {
    baru: {
      nama: "Baru",
      status: ["Disetujui"],
      kosongJudul: "Belum ada order baru",
      kosongKet: "Order yang sudah disetujui owner akan muncul di sini.",
    },
    diproses: {
      nama: "Diproses",
      status: ["Diproses"],
      kosongJudul: "Tidak ada order yang sedang diproses",
      kosongKet: "Order yang sedang dikerjakan akan muncul di sini.",
    },
    siap: {
      nama: "Siap",
      status: ["Diantar", "Siap diambil", "Siap disajikan"],
      kosongJudul: "Belum ada order yang siap",
      kosongKet:
        "Order yang siap diantar, diambil, atau disajikan ada di sini.",
    },
    selesai: {
      nama: "Selesai",
      status: ["Selesai"],
      kosongJudul: "Belum ada order selesai",
      kosongKet: "Order yang sudah selesai akan muncul di sini.",
    },
  };

  // O2: jam ditulis sebagai permintaan, bukan janji (sama dengan orderowner.js).
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

  // Badge tipe order: warna sama di layar customer, owner, dan penjaga (warna di style.css, kelas badge-tipe).
  // Tulisan tipe tetap ada di dalam badge; tanpa keterangan warna. Tipe tak dikenal: badge netral.
  var KELAS_TIPE = {
    Diantar: "badge-tipe--diantar",
    Diambil: "badge-tipe--diambil",
    "Makan di warung": "badge-tipe--warung",
  };

  function badgeTipe(tipe) {
    var kelas = KELAS_TIPE[tipe] || "";
    return buat("span", "badge-tipe " + kelas, teksAtauKosong(tipe));
  }

  // Satu baris berisi badge tipe (menggantikan tulisan tipe kecil).
  function barisTipe(tipe) {
    var p = buat("p", "kartu-order__baris");
    p.appendChild(badgeTipe(tipe));
    return p;
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

  function lencanaStatus(status) {
    var kelas = KELAS_STATUS[status] || "lencana--dibatalkan";
    return buat("span", "lencana " + kelas, teksAtauKosong(status));
  }

  // Id tab untuk satu status order. Kosong bila status tidak punya tab (tidak seharusnya sampai ke penjaga).
  function idTabDariStatus(status) {
    for (var i = 0; i < URUTAN_TAB.length; i++) {
      if (TAB[URUTAN_TAB[i]].status.indexOf(status) !== -1) {
        return URUTAN_TAB[i];
      }
    }
    return "";
  }

  function statusSiap(status) {
    return TAB.siap.status.indexOf(status) !== -1;
  }

  // Tulisan tombol langkah berikutnya (hanya label; status tujuan ditentukan server). Kosong = tanpa tombol.
  function labelMaju(status, tipe) {
    if (status === "Disetujui") return "Mulai proses";
    if (status === "Diproses") {
      if (tipe === "Diantar") return "Antar sekarang";
      if (tipe === "Diambil") return "Siap diambil";
      if (tipe === "Makan di warung") return "Siap disajikan";
      return "Lanjut";
    }
    if (statusSiap(status)) return "Tandai selesai";
    return "";
  }

  // Tulisan tombol mundur satu langkah (O10). Dari Disetujui dan Selesai tidak ada mundur.
  function labelMundur(status) {
    if (status === "Diproses") return "Kembalikan ke Baru";
    if (statusSiap(status)) return "Kembalikan ke Diproses";
    return "";
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
          ringkas: teksAtauKosong(o.ringkas),
          hari_target: teksAtauKosong(o.hari_target),
          jam_permintaan: teksAtauKosong(o.jam_permintaan),
          nama_pemesan: teksAtauKosong(o.nama_pemesan),
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
      item: item,
      catatan: catatan,
    };
  }

  // ------------------------------------------------------------
  // Keadaan layar
  // ------------------------------------------------------------

  var langkah = "daftar"; // "daftar" | "detail"
  var tabAktif = "baru"; // id tab yang sedang terbuka
  var daftarSemua = []; // order terakhir yang berhasil dimuat (sudah dirapikan)
  var idDetail = ""; // id order yang sedang dibuka di langkah detail
  var detailTerbuka = null; // order terakhir yang berhasil dimuat di detail
  var sedangKirim = false;
  var nomorMuatDaftar = 0; // naik tiap muat dan reset; balasan lama diabaikan
  var nomorMuatDetail = 0;
  var nomorKirim = 0;

  function tampilkanLangkah() {
    el("antrean-langkah-daftar").hidden = langkah !== "daftar";
    el("antrean-langkah-detail").hidden = langkah !== "detail";
    window.scrollTo(0, 0);
  }

  function pesanDaftar(teks) {
    var p = el("antrean-daftar-galat");
    p.textContent = teks || "";
    p.hidden = !teks;
  }

  function infoDaftar(teks) {
    var p = el("antrean-info");
    p.textContent = teks || "";
    p.hidden = !teks;
  }

  function pesanDetail(teks) {
    var p = el("antrean-detail-galat");
    p.textContent = teks || "";
    p.hidden = !teks;
  }

  function infoDetail(teks) {
    var p = el("antrean-detail-info");
    p.textContent = teks || "";
    p.hidden = !teks;
  }

  // Kunci semua tombol di wadah (sebelum permintaan berangkat).
  function kunciTombol(wadah) {
    var semua = wadah.querySelectorAll("button");
    for (var i = 0; i < semua.length; i++) {
      semua[i].disabled = true;
    }
  }

  // ------------------------------------------------------------
  // Daftar dan tab
  // ------------------------------------------------------------

  function hitungPerTab(daftar) {
    var hitung = { baru: 0, diproses: 0, siap: 0, selesai: 0 };
    for (var i = 0; i < daftar.length; i++) {
      var t = idTabDariStatus(daftar[i].status);
      if (t) hitung[t]++;
    }
    return hitung;
  }

  function saringTab(daftar, idTab) {
    var hasil = [];
    for (var i = 0; i < daftar.length; i++) {
      if (TAB[idTab].status.indexOf(daftar[i].status) !== -1) {
        hasil.push(daftar[i]);
      }
    }
    return hasil;
  }

  // Tandai tab aktif dan isi angka jumlah order di tiap tab.
  function aturTombolTab(hitung) {
    for (var i = 0; i < URUTAN_TAB.length; i++) {
      var id = URUTAN_TAB[i];
      var tombol = el("antrean-tab-" + id);
      tombol.setAttribute("aria-selected", id === tabAktif ? "true" : "false");
      el("antrean-angka-" + id).textContent = String(hitung[id]);
    }
  }

  function buatKartuDaftar(o) {
    var kartu = buat("div", "kartu antrean-kartu");

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
    // Badge tipe: if (o.tipe) kartu.appendChild(buat("p", "isian__bantuan", o.tipe));
    if (o.tipe) kartu.appendChild(barisTipe(o.tipe));

    // Tombol langkah berikutnya: besar, langsung di kartu, tanpa dialog (keputusan ketua).
    var tulisan = labelMaju(o.status, o.tipe);
    if (tulisan) {
      var barisAksi = buat("div", "baris-tombol");
      var aksi = buatTombol(
        tulisan,
        "tombol--utama antrean-aksi",
        function () {
          kirimStatus(o.id, o.nomor, o.status, "maju", false);
        },
        sedangKirim,
      );
      aksi.setAttribute("aria-label", tulisan + ", order " + o.nomor);
      barisAksi.appendChild(aksi);
      kartu.appendChild(barisAksi);
    }

    var barisDetail = buat("div", "baris-tombol");
    var detail = buatTombol("Lihat detail", "tombol--sekunder", function () {
      bukaDetail(o.id);
    });
    detail.setAttribute("aria-label", "Lihat detail order " + o.nomor);
    barisDetail.appendChild(detail);
    kartu.appendChild(barisDetail);
    return kartu;
  }

  // Gambar ulang tab dan isi tab yang aktif dari daftarSemua (tanpa panggilan server).
  function renderDaftar() {
    aturTombolTab(hitungPerTab(daftarSemua));
    var wadah = el("antrean-daftar-isi");
    kosongkan(wadah);
    wadah.className = "antrean-isi antrean-isi--" + tabAktif;

    var daftar = saringTab(daftarSemua, tabAktif);
    if (daftar.length === 0) {
      var kosong = buat("div", "keadaan");
      kosong.appendChild(
        buat("p", "keadaan__judul", TAB[tabAktif].kosongJudul),
      );
      kosong.appendChild(buat("p", "keadaan__ket", TAB[tabAktif].kosongKet));
      wadah.appendChild(kosong);
      return;
    }

    // Kelompokkan per tanggal antar. Urutan dari server dipertahankan.
    var hariTerakhir = null;
    for (var i = 0; i < daftar.length; i++) {
      if (hariTerakhir === null || daftar[i].hari_target !== hariTerakhir) {
        hariTerakhir = daftar[i].hari_target;
        wadah.appendChild(
          buat(
            "h2",
            "antrean-hari",
            tanggalIndo(hariTerakhir) || "Tanggal belum diketahui",
          ),
        );
      }
      wadah.appendChild(buatKartuDaftar(daftar[i]));
    }
  }

  function pilihTab(idTab) {
    if (!TAB[idTab] || idTab === tabAktif) return;
    tabAktif = idTab;
    infoDaftar("");
    renderDaftar();
  }

  function muatDaftar() {
    var nomor = ++nomorMuatDaftar;
    pesanDaftar("");
    el("antrean-memuat").hidden = false;
    // Penjaga: tanpa isian. Server yang menyaring menurut peran (O11) dan hari (O22).
    return A.panggilKedai("order_daftar", {})
      .then(function (h) {
        if (nomor !== nomorMuatDaftar) return;
        el("antrean-memuat").hidden = true;
        if (h.status === 200 && h.data && h.data.ok === true) {
          var daftar = bacaDaftar(h.data.daftar);
          if (daftar) {
            daftarSemua = daftar;
            renderDaftar();
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
        el("antrean-memuat").hidden = true;
        pesanDaftar(navigator.onLine ? PESAN_UMUM_DAFTAR : PESAN_OFFLINE);
      });
  }

  // ------------------------------------------------------------
  // Detail
  // ------------------------------------------------------------

  function renderDetail() {
    var o = detailTerbuka;
    var wadah = el("antrean-detail-isi");
    kosongkan(wadah);
    if (!o) {
      wadah.className = "antrean-isi";
      return;
    }
    wadah.className =
      "antrean-isi antrean-isi--" + (idTabDariStatus(o.status) || "baru");

    // Kartu utama: nomor, status, pemesan, tipe, jam, alamat.
    var kartu = buat("div", "kartu antrean-kartu");
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
    // Badge tipe: if (o.tipe) kartu.appendChild(buat("p", "kartu-order__baris", o.tipe));
    if (o.tipe) kartu.appendChild(barisTipe(o.tipe));
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

    // Isi order: nama, jumlah, dan pilihan (harga satuan tidak ditampilkan; total di bawah).
    var kartuItem = buat("div", "kartu antrean-kartu");
    kartuItem.appendChild(buat("h2", "kartu__judul", "Isi order"));
    for (var i = 0; i < o.item.length; i++) {
      var it = o.item[i];
      var blok = buat("div", "");
      blok.appendChild(buat("p", "menu-nama", it.jumlah + " x " + it.nama));
      for (var k = 0; k < it.pilihan.length; k++) {
        blok.appendChild(buat("p", "isian__bantuan", it.pilihan[k]));
      }
      kartuItem.appendChild(blok);
    }
    if (o.total !== null) {
      var bawah = buat("div", "kartu-order__bawah");
      bawah.appendChild(buat("span", "", "Total"));
      bawah.appendChild(buat("span", "", rupiah(o.total)));
      kartuItem.appendChild(bawah);
    }
    wadah.appendChild(kartuItem);

    // Catatan (baca saja untuk penjaga, O12).
    if (o.catatan.length > 0) {
      var kartuCatatan = buat("div", "kartu antrean-kartu");
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

    // FTO.03: kartu foto bukti (foto.js). Hanya muncul untuk tipe Diantar dengan status Diantar atau Selesai.
    if (window.KedaiFoto && typeof window.KedaiFoto.pasang === "function") {
      window.KedaiFoto.pasang(wadah, o);
    }

    // Aksi: langkah berikutnya (besar) dan mundur satu langkah (kecil, O10).
    var tulisanMaju = labelMaju(o.status, o.tipe);
    if (tulisanMaju) {
      var barisMaju = buat("div", "baris-tombol");
      barisMaju.appendChild(
        buatTombol(
          tulisanMaju,
          "tombol--utama antrean-aksi",
          function () {
            kirimStatus(o.id, o.nomor, o.status, "maju", true);
          },
          sedangKirim,
        ),
      );
      wadah.appendChild(barisMaju);
    }
    var tulisanMundur = labelMundur(o.status);
    if (tulisanMundur) {
      var barisMundur = buat("div", "baris-tombol");
      barisMundur.appendChild(
        buatTombol(
          tulisanMundur,
          "tombol--sekunder antrean-mundur",
          function () {
            kirimStatus(o.id, o.nomor, o.status, "mundur", true);
          },
          sedangKirim,
        ),
      );
      wadah.appendChild(barisMundur);
    }
  }

  function muatDetail(id) {
    var nomor = ++nomorMuatDetail;
    pesanDetail("");
    el("antrean-detail-memuat").hidden = false;
    return A.panggilKedai("order_detail", { id: id })
      .then(function (h) {
        if (nomor !== nomorMuatDetail) return;
        el("antrean-detail-memuat").hidden = true;
        if (h.status === 200 && h.data && h.data.ok === true) {
          var o = bacaDetail(h.data.order);
          if (o) {
            detailTerbuka = o;
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
          // Order tidak ada atau tidak boleh dilihat (misalnya sudah dibatalkan owner): tidak ada yang bisa ditampilkan.
          detailTerbuka = null;
          renderDetail();
        }
      })
      .catch(function () {
        if (nomor !== nomorMuatDetail) return;
        el("antrean-detail-memuat").hidden = true;
        pesanDetail(navigator.onLine ? PESAN_UMUM_DETAIL : PESAN_OFFLINE);
      });
  }

  function bukaDetail(id) {
    langkah = "detail";
    idDetail = id;
    detailTerbuka = null;
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
    pesanDetail("");
    infoDetail("");
    el("antrean-detail-memuat").hidden = true;
    renderDetail();
    tampilkanLangkah();
    muatDaftar();
  }

  // ------------------------------------------------------------
  // Ubah status (O10). Server yang memutuskan status tujuan.
  // ------------------------------------------------------------

  // Kalimat sukses memakai status dari balasan server. Kosong bila status tidak dikenal.
  function teksSukses(nomor, statusBaru, arah) {
    var t = idTabDariStatus(statusBaru);
    if (statusBaru === "Selesai") return "Order #" + nomor + " selesai.";
    if (!t) return "Status order #" + nomor + " sudah diubah.";
    if (arah === "mundur") {
      return "Order #" + nomor + " dikembalikan ke " + TAB[t].nama + ".";
    }
    return "Order #" + nomor + " pindah ke " + TAB[t].nama + ".";
  }

  // Satu jalur kirim untuk maju dan mundur, dari kartu daftar atau dari detail.
  function kirimStatus(id, nomorOrder, statusDilihat, arah, dariDetail) {
    if (sedangKirim) return;
    // Kunci sebelum permintaan berangkat: dua ketukan cepat tidak boleh jadi dua panggilan.
    sedangKirim = true;
    var nomor = ++nomorKirim;
    pesanDaftar("");
    infoDaftar("");
    pesanDetail("");
    infoDetail("");
    kunciTombol(
      dariDetail ? el("antrean-detail-isi") : el("antrean-daftar-isi"),
    );

    function tampilPesan(teks) {
      if (dariDetail) {
        pesanDetail(teks);
      } else {
        pesanDaftar(teks);
      }
    }

    // Gambar ulang supaya tombol hidup lagi (tanpa muat ulang dari server).
    function gambarUlang() {
      if (dariDetail) {
        renderDetail();
      } else {
        renderDaftar();
      }
    }

    A.panggilKedai("order_status", {
      id: id,
      arah: arah,
      status_dilihat: statusDilihat,
    })
      .then(function (h) {
        if (nomor !== nomorKirim) return; // sudah Keluar: balasan lama diabaikan
        sedangKirim = false;
        if (h.status === 200 && h.data && h.data.ok === true) {
          var statusBaru =
            h.data.order && typeof h.data.order.status === "string"
              ? h.data.order.status
              : "";
          var teks = teksSukses(nomorOrder, statusBaru, arah);
          // Muat ulang dari server supaya yang tampil pasti dari server.
          if (dariDetail) {
            muatDetail(id).then(function () {
              if (nomor === nomorKirim) infoDetail(teks);
            });
          } else {
            muatDaftar().then(function () {
              if (nomor === nomorKirim) infoDaftar(teks);
            });
          }
          return;
        }
        if (h.status === 401 && !h.data) {
          tampilPesan(PESAN_SESI);
          gambarUlang();
          return;
        }
        var pesan = pesanServer(h) || PESAN_STATUS_UMUM;
        // 409 (status sudah berubah) dan 404 (order tidak terlihat lagi): isi layar usang, muat ulang.
        if (h.status === 409 || h.status === 404) {
          if (dariDetail) {
            muatDetail(id).then(function () {
              if (nomor === nomorKirim) pesanDetail(pesan);
            });
          } else {
            muatDaftar().then(function () {
              if (nomor === nomorKirim) pesanDaftar(pesan);
            });
          }
          return;
        }
        tampilPesan(pesan);
        gambarUlang();
      })
      .catch(function () {
        if (nomor !== nomorKirim) return;
        sedangKirim = false;
        tampilPesan(navigator.onLine ? PESAN_TIDAK_PASTI : PESAN_OFFLINE);
        gambarUlang();
      });
  }

  // ------------------------------------------------------------
  // Dipanggil kerangka.js
  // ------------------------------------------------------------

  // Tab Antrean dibuka atau Segarkan ditekan: muat ulang layar yang sedang tampil.
  function tampil() {
    if (langkah === "detail" && idDetail) {
      if (sedangKirim) return;
      infoDetail("");
      muatDetail(idDetail);
    } else {
      if (sedangKirim) return;
      infoDaftar("");
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
    tabAktif = "baru";
    daftarSemua = [];
    idDetail = "";
    detailTerbuka = null;
    kosongkan(el("antrean-daftar-isi"));
    kosongkan(el("antrean-detail-isi"));
    el("antrean-daftar-isi").className = "antrean-isi antrean-isi--baru";
    // FTO.03: keadaan unggah foto ikut dibersihkan.
    if (window.KedaiFoto && typeof window.KedaiFoto.reset === "function") {
      window.KedaiFoto.reset();
    }
    aturTombolTab({ baru: 0, diproses: 0, siap: 0, selesai: 0 });
    el("antrean-memuat").hidden = true;
    el("antrean-detail-memuat").hidden = true;
    pesanDaftar("");
    infoDaftar("");
    pesanDetail("");
    infoDetail("");
    tampilkanLangkah();
  }

  el("antrean-kembali").addEventListener("click", kembaliKeDaftar);

  // Ketukan di tab: pindah tab dari data yang sudah ada (tanpa panggilan server).
  for (var i = 0; i < URUTAN_TAB.length; i++) {
    (function (id) {
      el("antrean-tab-" + id).addEventListener("click", function () {
        pilihTab(id);
      });
    })(URUTAN_TAB[i]);
  }

  window.KedaiOrderPenjaga = Object.freeze({
    tampil: tampil, // dipanggil kerangka.js saat tab Antrean dibuka dan lewat Segarkan
    reset: reset, // dipanggil kerangka.js saat Keluar
  });
})();
