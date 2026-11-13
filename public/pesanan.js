// public/pesanan.js
// ORD.04: layar customer Pesanan Saya (order.md O9, O21, O22 dan bagian 4 "Layar customer").
// Tampil di dalam panel "pesanan" (tab Pesanan Saya) dengan dua langkah:
//   1. daftar : riwayat lengkap pesanan milik customer, terbaru dulu (O22), dari aksi order_daftar.
//   2. detail : satu pesanan (aksi order_detail): status, item dan pilihan, alasan tolak atau batal,
//               teks pembayaran O21 pada pesanan Menunggu, dan tombol Batalkan (hanya saat Menunggu).
// Dimuat SETELAH akun.js dan pesan.js (memakai window.KedaiAkun dan window.KedaiPesan.teksBayar)
// dan SEBELUM kerangka.js di index.html.
//
// Aturan yang dijaga:
// - Aplikasi hanya mengirim aksi dan id order. Status, harga, dan peran tidak pernah dikirim.
//   Pengaman sebenarnya ada di server (order_batal hanya untuk order milik sendiri saat Menunggu).
// - Tombol Batalkan hanya tampil saat status Menunggu (O9) dan memakai konfirmasi di layar dulu.
//   Sesudah Disetujui tidak ada tombol batal untuk customer; diselesaikan lewat WA.
// - Alasan hanya tampil bila ada. Alasan tolak dan alasan batal sama-sama dari kolom alasan_tolak;
//   pembedanya status (Ditolak atau Dibatalkan). Customer tidak bisa melihat siapa yang membatalkan.
// - Customer tidak menerima metode bayar, pemutus, dan riwayat status dari server; tidak ditampilkan.
// - Nomor WA pemesan ada di balasan detail tetapi tidak ditampilkan (itu milik customer sendiri,
//   dan layar ini tidak membutuhkannya).
// - Catatan berlapis belum ditampilkan di sini (ORD.10).
//   ORD.10 (lanjutan, keputusan ketua 9 Nov 2026): baris di atas tidak berlaku lagi. Catatan berlapis (O12) kini tampil
//   sebagai kartu "Catatan" di detail, lengkap dengan form tambah catatan hanya saat Menunggu atau Disetujui.
//   Server yang memutuskan (catatan_tambah: 409 bila terkunci atau penuh). Tanda "Catatan baru" di kartu daftar
//   TIDAK dikerjakan di sini (ditunda ke NTF.07). catatan_dibaca dipanggil saat detail tampil, hanya bila isi catatan
//   berubah sejak terakhir ditandai, supaya hemat panggilan.
// - ORD.16: alasan alih hari (isian `alasan_alih` dari order_detail) tampil sebagai kartu sendiri bila ada.
//   Server hanya mengirimnya ke customer pemilik, selama order masih berjalan (bukan Selesai, Ditolak, Dibatalkan).
// - ORD.17: pembeda pembatal (isian `dibatalkan_oleh` dan `dibatalkan_oleh_nama` dari order_detail) tampil sebagai
//   kartu pada order Dibatalkan, walau alasannya kosong. Server hanya mengirimnya ke customer pemilik order itu.
//   Ini mengubah catatan di atas "Customer tidak bisa melihat siapa yang membatalkan" (keputusan ketua 9 Nov 2026).
// - Data diambil saat tab dibuka dan lewat tombol Segarkan. Tanpa polling (O19).
// - Pesan galat dari server ditampilkan apa adanya lewat textContent. Galat mentah tidak ditampilkan.
// - Semua teks dipasang lewat textContent, bukan innerHTML.
// - Daftar dan detail dikosongkan saat Keluar (reset).
// - FTO.04: foto bukti antar tampil sebagai kartu kecil (thumbnail, diketuk jadi besar) tepat di bawah kartu utama,
//   hanya untuk order Diantar berstatus Diantar atau Selesai, dan hanya bila ada foto atau fotonya sudah dihapus.
//   Semua logikanya ada di foto.js (window.KedaiFoto.lihat); layar ini hanya memanggilnya. Tautan foto di memori
//   dibuang saat Keluar (KedaiFoto.reset).
//
// NTF.04a (giliran 1): fungsi siapkanDetail(id) ditambah supaya kerangka.js bisa membuka detail order dari notifikasi
//   (?buka= dan pesan "buka" dari sw.js). Fungsi ini HANYA menyiapkan keadaan layar (langkah detail + id) dan TIDAK
//   memanggil server. Pemuatan datanya lewat tampil() yang sudah ada (dipanggil kerangka.js saat tab dibuka), jadi
//   hanya satu panggilan order_detail. Id dari alamat atau pesan tidak dipercaya: aplikasi hanya mengecek bentuknya,
//   yang memutuskan boleh atau tidak tetap server (404 atau 403, lalu layar menampilkan pesan umum yang sudah ada).
//   Sedang mengirim aksi: fungsi mengembalikan false dan tidak mengubah apa pun.
//
// VIS.02: stepper status 5 titik (stepper-visual.md). Di renderDetail(), tepat sebelum kartu utama dipasang ke layar,
//   dipanggil window.KedaiStepper.pasang(kartu, o) dari stepper.js. Blok ini berpagar: bila stepper.js belum termuat,
//   langkah dilewati dan layar tampil seperti sebelumnya. Badge status tidak diganti. Semua logika stepper ada di
//   stepper.js; berkas ini hanya menambah satu blok pemanggilan (tidak ada baris lama yang diubah).

(function () {
  "use strict";

  var A = window.KedaiAkun;
  if (!A) {
    // akun.js belum termuat: window.KedaiPesanan tidak dibuat.
    return;
  }

  function el(id) {
    return document.getElementById(id);
  }

  var PESAN_UMUM_DAFTAR =
    "Daftar pesanan belum bisa dimuat. Coba lagi sebentar lagi.";
  var PESAN_UMUM_DETAIL = "Pesanan belum bisa dimuat. Coba lagi sebentar lagi.";
  var PESAN_OFFLINE = "Belum bisa terhubung. Periksa internet lalu coba lagi.";
  var PESAN_SESI = "Sesi sudah berakhir. Silakan keluar lalu masuk lagi.";
  var PESAN_BATAL_UMUM =
    "Pesanan belum bisa dibatalkan. Coba lagi sebentar lagi.";
  // Jaringan putus SETELAH permintaan batal terkirim: hasilnya tidak pasti.
  var PESAN_BATAL_TIDAK_PASTI =
    "Belum bisa memastikan pesanan sudah dibatalkan. Tekan Segarkan untuk melihat status terbaru.";
  var TEKS_BATAL = "Ya, batalkan";
  // ORD.10: teks catatan.
  var PESAN_CATATAN_UMUM =
    "Catatan belum bisa dikirim. Coba lagi sebentar lagi.";
  var PESAN_CATATAN_KOSONG = "Tulis catatannya dulu.";
  // Jaringan putus SETELAH permintaan terkirim: hasilnya tidak pasti.
  var PESAN_CATATAN_TIDAK_PASTI =
    "Belum bisa memastikan catatan sudah terkirim. Tekan Segarkan untuk memeriksa, lalu kirim lagi bila belum muncul.";
  var PESAN_CATATAN_TERKIRIM = "Catatan terkirim.";

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

  var langkah = "daftar"; // "daftar" | "detail"
  var idDetail = ""; // id order yang sedang dibuka di langkah detail
  var detailTerbuka = null; // order terakhir yang berhasil dimuat (sudah dirapikan)
  var konfirmasiBuka = false; // kartu "Yakin batalkan?" sedang tampil
  var sedangBatal = false;
  var nomorMuatDaftar = 0; // naik tiap muat dan reset; balasan lama diabaikan
  var nomorMuatDetail = 0;
  var nomorBatal = 0;
  var pernahMuatDaftar = false;
  // ORD.10: catatan berlapis (O12).
  var draftCatatan = ""; // isi kolom catatan yang belum terkirim; bertahan saat layar digambar ulang
  var sedangKirimCatatan = false;
  var nomorKirimCatatan = 0; // naik tiap kirim dan reset; balasan lama diabaikan
  var pesanCatatan = { teks: "", galat: false }; // info atau galat di bawah kolom catatan
  var kunciDibaca = ""; // catatan terakhir yang sudah ditandai dibaca (id order, jumlah, waktu terakhir)

  // ------------------------------------------------------------
  // Pembantu
  // ------------------------------------------------------------

  function buat(tag, kelas, teks) {
    var e = document.createElement(tag);
    if (kelas) e.className = kelas;
    if (teks !== undefined) e.textContent = teks;
    return e;
  }

  function buatTombol(teks, kelas, aksi, mati, labelAria) {
    var t = buat("button", "tombol " + kelas, teks);
    t.type = "button";
    t.disabled = !!mati;
    if (labelAria) t.setAttribute("aria-label", labelAria);
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

  // ORD.10: waktu catatan dari server (stempel waktu) ditulis dalam WIB. Hanya untuk tampilan.
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

  function lencanaStatus(status) {
    var kelas = KELAS_STATUS[status] || "lencana--dibatalkan";
    return buat("span", "lencana " + kelas, teksAtauKosong(status));
  }

  // Rapikan satu baris daftar. Baris yang bentuknya salah dibuang.
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
    // ORD.10: catatan berlapis dari order_detail (nama penulis, isi, waktu).
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
      alias_alamat: teksAtauKosong(o.alias_alamat),
      isi_alamat: teksAtauKosong(o.isi_alamat),
      alasan: teksAtauKosong(o.alasan_tolak),
      // ORD.16: alasan alih hari terakhir (kosong bila tidak ada).
      alasanAlih: teksAtauKosong(o.alasan_alih),
      // ORD.17: pembatal ('customer' atau 'owner') dan nama owner (kosong bila pembatalnya customer).
      dibatalkanOleh: teksAtauKosong(o.dibatalkan_oleh),
      dibatalkanOlehNama: teksAtauKosong(o.dibatalkan_oleh_nama),
      item: item,
      // ORD.10: catatan berlapis (urutan dari server).
      catatan: catatan,
    };
  }

  function tampilkanLangkah() {
    el("pesanan-langkah-daftar").hidden = langkah !== "daftar";
    el("pesanan-langkah-detail").hidden = langkah !== "detail";
    window.scrollTo(0, 0);
  }

  // ------------------------------------------------------------
  // Daftar
  // ------------------------------------------------------------

  function pesanDaftar(teks) {
    var p = el("pesanan-daftar-galat");
    p.textContent = teks || "";
    p.hidden = !teks;
  }

  function buatKartuDaftar(o) {
    var kartu = buat("div", "kartu");

    var atas = buat("div", "kartu-order__atas");
    atas.appendChild(buat("span", "kartu-order__nomor", "Pesanan #" + o.nomor));
    atas.appendChild(lencanaStatus(o.status));
    kartu.appendChild(atas);

    if (o.ringkas) {
      kartu.appendChild(buat("p", "kartu-order__baris", o.ringkas));
    }
    var jam = kalimatJam(o.tipe, o.jam_permintaan, o.hari_target);
    if (jam) kartu.appendChild(buat("p", "kartu-order__baris", jam));
    // Badge tipe: if (o.tipe) kartu.appendChild(buat("p", "isian__bantuan", o.tipe));
    if (o.tipe) kartu.appendChild(barisTipe(o.tipe));

    if (o.total !== null) {
      var bawah = buat("div", "kartu-order__bawah");
      bawah.appendChild(buat("span", "", "Total"));
      bawah.appendChild(buat("span", "", rupiah(o.total)));
      kartu.appendChild(bawah);
    }

    var baris = buat("div", "baris-tombol");
    baris.appendChild(
      buatTombol(
        "Lihat detail",
        "tombol--sekunder",
        function () {
          bukaDetail(o.id);
        },
        false,
        "Lihat detail pesanan " + o.nomor,
      ),
    );
    kartu.appendChild(baris);
    return kartu;
  }

  function renderDaftar(daftar) {
    var wadah = el("pesanan-daftar-isi");
    kosongkan(wadah);
    if (daftar.length === 0) {
      el("pesanan-ringkas").textContent = "";
      var kosong = buat("div", "keadaan");
      kosong.appendChild(buat("p", "keadaan__judul", "Belum ada pesanan"));
      kosong.appendChild(
        buat(
          "p",
          "keadaan__ket",
          "Pesanan yang kamu kirim akan muncul di sini.",
        ),
      );
      wadah.appendChild(kosong);
      return;
    }
    el("pesanan-ringkas").textContent =
      daftar.length + " pesanan, terbaru di atas.";
    for (var i = 0; i < daftar.length; i++) {
      wadah.appendChild(buatKartuDaftar(daftar[i]));
    }
  }

  function muatDaftar() {
    var nomor = ++nomorMuatDaftar;
    pesanDaftar("");
    el("pesanan-memuat").hidden = false;
    return A.panggilKedai("order_daftar", {})
      .then(function (h) {
        if (nomor !== nomorMuatDaftar) return;
        el("pesanan-memuat").hidden = true;
        if (h.status === 200 && h.data && h.data.ok === true) {
          var daftar = bacaDaftar(h.data.daftar);
          if (daftar) {
            pernahMuatDaftar = true;
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
        el("pesanan-memuat").hidden = true;
        pesanDaftar(navigator.onLine ? PESAN_UMUM_DAFTAR : PESAN_OFFLINE);
      });
  }

  // ------------------------------------------------------------
  // Detail
  // ------------------------------------------------------------

  function pesanDetail(teks) {
    var p = el("pesanan-detail-galat");
    p.textContent = teks || "";
    p.hidden = !teks;
  }

  function bersihkanKonfirmasi() {
    konfirmasiBuka = false;
  }

  function renderDetail() {
    var o = detailTerbuka;
    var wadah = el("pesanan-detail-isi");
    kosongkan(wadah);
    if (!o) return;

    var kartu = buat("div", "kartu");

    var atas = buat("div", "kartu-order__atas");
    atas.appendChild(buat("span", "kartu-order__nomor", "Pesanan #" + o.nomor));
    atas.appendChild(lencanaStatus(o.status));
    kartu.appendChild(atas);

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
    // VIS.02: stepper status 5 titik (stepper.js), di bawah baris tipe, jam, dan alamat (VS4).
    // Dilewati bila stepper.js belum termuat; badge status di atas tidak diganti (VS1).
    if (
      window.KedaiStepper &&
      typeof window.KedaiStepper.pasang === "function"
    ) {
      window.KedaiStepper.pasang(kartu, o);
    }
    wadah.appendChild(kartu);

    // FTO.04: kartu foto bukti antar (foto.js). Kosong untuk order yang tidak memenuhi syarat.
    if (window.KedaiFoto && typeof window.KedaiFoto.lihat === "function") {
      window.KedaiFoto.lihat(wadah, o);
    }

    // ORD.17: siapa yang membatalkan (hanya order Dibatalkan; tampil walau alasannya kosong).
    if (o.status === "Dibatalkan" && o.dibatalkanOleh) {
      var teksPembatal = "";
      if (o.dibatalkanOleh === "customer") {
        teksPembatal = "Dibatalkan oleh customer";
      } else if (o.dibatalkanOleh === "owner") {
        teksPembatal =
          "Dibatalkan oleh pihak ChATA" +
          (o.dibatalkanOlehNama ? " (" + o.dibatalkanOlehNama + ")" : "");
      }
      if (teksPembatal) {
        var kartuPembatal = buat("div", "kartu");
        kartuPembatal.appendChild(buat("h2", "kartu__judul", teksPembatal));
        wadah.appendChild(kartuPembatal);
      }
    }

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

    // ORD.16: alasan alih hari (hanya bila ada; server hanya mengirimnya selama order berjalan).
    if (o.alasanAlih) {
      var kartuAlih = buat("div", "kartu");
      kartuAlih.appendChild(buat("h2", "kartu__judul", "Alasan alih hari"));
      kartuAlih.appendChild(buat("p", "kartu__isi", o.alasanAlih));
      wadah.appendChild(kartuAlih);
    }

    // Item dan pilihan.
    var kartuItem = buat("div", "kartu");
    kartuItem.appendChild(buat("h2", "kartu__judul", "Isi pesanan"));
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

    // ORD.10: catatan berlapis (O12). Daftar catatan baca-saja; form tambah hanya saat Menunggu atau Disetujui.
    // Catatan tidak bisa diedit atau dihapus; berubah pikiran = tambah catatan baru. Semua teks lewat textContent.
    var bolehTambahCatatan =
      o.status === "Menunggu" || o.status === "Disetujui";
    if (o.catatan.length > 0 || bolehTambahCatatan) {
      var kartuCatatan = buat("div", "kartu");
      kartuCatatan.classList.add("kartu--catatan"); // ORD.10: jarak dan pemisah (style.css)
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
      if (bolehTambahCatatan) {
        var isianCatatan = buat("div", "isian");
        var labelCatatan = buat("label", "isian__label", "Tambah catatan");
        labelCatatan.htmlFor = "pesanan-catatan-baru";
        isianCatatan.appendChild(labelCatatan);
        var kolomCatatan = buat("textarea", "isian__kolom");
        kolomCatatan.id = "pesanan-catatan-baru";
        kolomCatatan.rows = 3;
        kolomCatatan.value = draftCatatan;
        kolomCatatan.disabled = sedangKirimCatatan;
        kolomCatatan.addEventListener("input", function () {
          draftCatatan = kolomCatatan.value;
        });
        isianCatatan.appendChild(kolomCatatan);
        isianCatatan.appendChild(
          buat(
            "p",
            "isian__bantuan",
            "Catatan tidak bisa diubah atau dihapus. Kalau berubah pikiran, tambah catatan baru.",
          ),
        );
        if (pesanCatatan.teks) {
          isianCatatan.appendChild(
            buat(
              "p",
              pesanCatatan.galat ? "isian__galat" : "isian__bantuan",
              pesanCatatan.teks,
            ),
          );
        }
        kartuCatatan.appendChild(isianCatatan);
        var barisCatatan = buat("div", "baris-tombol");
        barisCatatan.appendChild(
          buatTombol(
            sedangKirimCatatan ? "Mengirim..." : "Kirim catatan",
            "tombol--utama",
            kirimCatatan,
            sedangKirimCatatan,
          ),
        );
        kartuCatatan.appendChild(barisCatatan);
      }
      wadah.appendChild(kartuCatatan);
    }

    // O21: teks pembayaran hanya pada pesanan Menunggu.
    if (o.status === "Menunggu") {
      var teksBayar =
        window.KedaiPesan && typeof window.KedaiPesan.teksBayar === "string"
          ? window.KedaiPesan.teksBayar
          : "";
      if (teksBayar) {
        var kartuBayar = buat("div", "kartu");
        kartuBayar.appendChild(buat("p", "kartu__isi", teksBayar));
        wadah.appendChild(kartuBayar);
      }
    }

    // O9: tombol Batalkan hanya saat Menunggu, dengan konfirmasi dulu.
    if (o.status === "Menunggu") {
      if (konfirmasiBuka) {
        var kartuYakin = buat("div", "kartu");
        kartuYakin.appendChild(
          buat(
            "h2",
            "kartu__judul",
            "Yakin batalkan pesanan #" + o.nomor + "?",
          ),
        );
        kartuYakin.appendChild(
          buat(
            "p",
            "kartu__isi",
            "Pesanan yang sudah dibatalkan tidak bisa dihidupkan lagi.",
          ),
        );
        var barisYakin = buat("div", "baris-tombol");
        barisYakin.appendChild(
          buatTombol(
            "Tidak",
            "tombol--sekunder",
            function () {
              konfirmasiBuka = false;
              pesanDetail("");
              renderDetail();
            },
            sedangBatal,
          ),
        );
        var tombolYa = buatTombol(
          TEKS_BATAL,
          "tombol--bahaya",
          batalkan,
          sedangBatal,
        );
        tombolYa.id = "tombol-pesanan-batal-ya";
        barisYakin.appendChild(tombolYa);
        kartuYakin.appendChild(barisYakin);
        wadah.appendChild(kartuYakin);
      } else {
        var barisBatal = buat("div", "baris-tombol");
        barisBatal.appendChild(
          buatTombol(
            "Batalkan pesanan",
            "tombol--bahaya",
            function () {
              konfirmasiBuka = true;
              pesanDetail("");
              renderDetail();
            },
            sedangBatal,
          ),
        );
        wadah.appendChild(barisBatal);
      }
    }
  }

  function muatDetail(id) {
    var nomor = ++nomorMuatDetail;
    pesanDetail("");
    el("pesanan-detail-memuat").hidden = false;
    return A.panggilKedai("order_detail", { id: id })
      .then(function (h) {
        if (nomor !== nomorMuatDetail) return;
        el("pesanan-detail-memuat").hidden = true;
        if (h.status === 200 && h.data && h.data.ok === true) {
          var o = bacaDetail(h.data.order);
          if (o) {
            detailTerbuka = o;
            renderDetail();
            tandaiDibaca(o); // ORD.10
            return;
          }
        }
        if (h.status === 401 && !h.data) {
          pesanDetail(PESAN_SESI);
        } else {
          pesanDetail(pesanServer(h) || PESAN_UMUM_DETAIL);
        }
        if (h.status === 404) {
          // Pesanan tidak ada atau bukan milik customer: tidak ada yang bisa ditampilkan lagi.
          detailTerbuka = null;
          renderDetail();
        }
      })
      .catch(function () {
        if (nomor !== nomorMuatDetail) return;
        el("pesanan-detail-memuat").hidden = true;
        pesanDetail(navigator.onLine ? PESAN_UMUM_DETAIL : PESAN_OFFLINE);
      });
  }

  function bukaDetail(id) {
    langkah = "detail";
    idDetail = id;
    detailTerbuka = null;
    bersihkanKonfirmasi();
    // ORD.10: isian catatan dari order lain tidak boleh terbawa.
    draftCatatan = "";
    pesanCatatan = { teks: "", galat: false };
    renderDetail();
    tampilkanLangkah();
    muatDetail(id);
  }

  function kembaliKeDaftar() {
    if (sedangBatal) return;
    nomorMuatDetail++;
    // ORD.10: balasan catatan yang masih jalan diabaikan; isian dikosongkan.
    nomorKirimCatatan++;
    sedangKirimCatatan = false;
    draftCatatan = "";
    pesanCatatan = { teks: "", galat: false };
    langkah = "daftar";
    idDetail = "";
    detailTerbuka = null;
    bersihkanKonfirmasi();
    pesanDetail("");
    el("pesanan-detail-memuat").hidden = true;
    renderDetail();
    tampilkanLangkah();
    muatDaftar();
  }

  // ------------------------------------------------------------
  // Batalkan (O9). Server yang memutuskan; aplikasi hanya mengirim id.
  // ------------------------------------------------------------

  function batalkan() {
    if (sedangBatal || !detailTerbuka || detailTerbuka.status !== "Menunggu") {
      return;
    }
    var id = detailTerbuka.id;
    // Kunci sebelum permintaan berangkat: dua ketukan cepat tidak boleh jadi dua panggilan.
    sedangBatal = true;
    var nomor = ++nomorBatal;
    pesanDetail("");
    renderDetail();

    A.panggilKedai("order_batal", { id: id })
      .then(function (h) {
        if (nomor !== nomorBatal) return; // sudah Keluar: balasan lama diabaikan
        sedangBatal = false;
        bersihkanKonfirmasi();
        if (h.status === 200 && h.data && h.data.ok === true) {
          // Muat ulang dari server supaya status yang tampil pasti dari server.
          muatDetail(id);
          return;
        }
        if (h.status === 401 && !h.data) {
          pesanDetail(PESAN_SESI);
          renderDetail();
          return;
        }
        pesanDetail(pesanServer(h) || PESAN_BATAL_UMUM);
        // 409 (sudah diproses) dan 404: status di layar sudah usang, ambil yang terbaru.
        if (h.status === 409 || h.status === 404) {
          muatDetail(id).then(function () {
            pesanDetail(pesanServer(h) || PESAN_BATAL_UMUM);
          });
          return;
        }
        renderDetail();
      })
      .catch(function () {
        if (nomor !== nomorBatal) return;
        sedangBatal = false;
        bersihkanKonfirmasi();
        pesanDetail(navigator.onLine ? PESAN_BATAL_TIDAK_PASTI : PESAN_OFFLINE);
        renderDetail();
      });
  }

  // ------------------------------------------------------------
  // Catatan berlapis (O12, ORD.10). Server yang memutuskan; aplikasi hanya mengirim id order dan isi.
  // ------------------------------------------------------------

  // Tandai catatan sudah dibaca (catatan_dibaca). Hanya dipanggil bila isi catatan berubah sejak terakhir
  // ditandai (hemat panggilan, tanpa polling). Gagal diam-diam: tidak ada yang ditampilkan ke layar.
  function tandaiDibaca(o) {
    if (!o || !o.catatan || o.catatan.length === 0) return;
    var terakhir = o.catatan[o.catatan.length - 1];
    var kunci = o.id + ":" + o.catatan.length + ":" + terakhir.waktu;
    if (kunci === kunciDibaca) return;
    kunciDibaca = kunci;
    A.panggilKedai("catatan_dibaca", { id: o.id }).catch(function () {
      // Gagal (misalnya offline): coba lagi saat detail dimuat berikutnya.
      if (kunciDibaca === kunci) kunciDibaca = "";
    });
  }

  function kirimCatatan() {
    if (sedangKirimCatatan || !detailTerbuka) return;
    if (
      detailTerbuka.status !== "Menunggu" &&
      detailTerbuka.status !== "Disetujui"
    ) {
      return;
    }
    var isi = draftCatatan.trim();
    if (isi === "") {
      pesanCatatan = { teks: PESAN_CATATAN_KOSONG, galat: true };
      renderDetail();
      return;
    }
    var id = detailTerbuka.id;
    // Kunci sebelum permintaan berangkat: dua ketukan cepat tidak boleh jadi dua panggilan.
    sedangKirimCatatan = true;
    var nomor = ++nomorKirimCatatan;
    pesanCatatan = { teks: "", galat: false };
    renderDetail();

    A.panggilKedai("catatan_tambah", { id: id, isi: isi })
      .then(function (h) {
        if (nomor !== nomorKirimCatatan) return; // sudah kembali ke daftar atau Keluar
        sedangKirimCatatan = false;
        if (h.status === 200 && h.data && h.data.ok === true) {
          draftCatatan = "";
          pesanCatatan = { teks: PESAN_CATATAN_TERKIRIM, galat: false };
          renderDetail(); // buka kunci kolom dulu, andai muat ulang gagal
          muatDetail(id); // muat ulang dari server supaya catatan yang tampil pasti dari server
          return;
        }
        if (h.status === 401 && !h.data) {
          pesanCatatan = { teks: PESAN_SESI, galat: true };
          renderDetail();
          return;
        }
        var pesan = pesanServer(h) || PESAN_CATATAN_UMUM;
        pesanCatatan = { teks: pesan, galat: true };
        renderDetail();
        // 409 (terkunci, penuh) dan 404: status di layar bisa usang, ambil yang terbaru.
        if (h.status === 409 || h.status === 404) {
          muatDetail(id).then(function () {
            if (nomor !== nomorKirimCatatan) return;
            var o2 = detailTerbuka;
            // Kalau form sudah hilang (status berubah), pesan galat ditampilkan di tempat umum.
            if (
              !o2 ||
              (o2.status !== "Menunggu" && o2.status !== "Disetujui")
            ) {
              pesanDetail(pesan);
            }
          });
        }
      })
      .catch(function () {
        if (nomor !== nomorKirimCatatan) return;
        sedangKirimCatatan = false;
        pesanCatatan = {
          teks: navigator.onLine ? PESAN_CATATAN_TIDAK_PASTI : PESAN_OFFLINE,
          galat: true,
        };
        renderDetail();
      });
  }

  // ------------------------------------------------------------
  // Dipanggil kerangka.js
  // ------------------------------------------------------------

  // NTF.04a: siapkan layar detail untuk satu order dari notifikasi. Tanpa panggilan server (lihat catatan di atas berkas).
  // Mengembalikan true bila layar siap, false bila id salah bentuk atau aksi (batal, kirim catatan) masih berjalan.
  // Order yang sama dengan yang sedang terbuka: isian catatan yang sudah diketik dipertahankan.
  function siapkanDetail(id) {
    if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
      return false;
    }
    if (sedangBatal || sedangKirimCatatan) return false;
    if (langkah === "detail" && idDetail === id) return true;
    langkah = "detail";
    idDetail = id;
    detailTerbuka = null;
    bersihkanKonfirmasi();
    // Isian catatan dari order lain tidak boleh terbawa (sama dengan bukaDetail).
    draftCatatan = "";
    pesanCatatan = { teks: "", galat: false };
    renderDetail();
    tampilkanLangkah();
    return true;
  }

  // Tab Pesanan Saya dibuka atau Segarkan ditekan: muat ulang layar yang sedang tampil.
  function tampil() {
    if (langkah === "detail" && idDetail) {
      if (sedangBatal) return;
      if (sedangKirimCatatan) return; // ORD.10
      muatDetail(idDetail);
    } else {
      muatDaftar();
    }
  }

  // Keluar: tidak boleh ada daftar atau detail pesanan tersisa di layar (data pribadi).
  function reset() {
    nomorMuatDaftar++;
    nomorMuatDetail++;
    nomorBatal++;
    sedangBatal = false;
    langkah = "daftar";
    idDetail = "";
    detailTerbuka = null;
    konfirmasiBuka = false;
    pernahMuatDaftar = false;
    // ORD.10: catatan tidak boleh tersisa di layar (data pribadi).
    nomorKirimCatatan++;
    sedangKirimCatatan = false;
    draftCatatan = "";
    pesanCatatan = { teks: "", galat: false };
    kunciDibaca = "";
    // FTO.04: tautan foto di memori dibuang saat Keluar.
    if (window.KedaiFoto && typeof window.KedaiFoto.reset === "function") {
      window.KedaiFoto.reset();
    }
    kosongkan(el("pesanan-daftar-isi"));
    kosongkan(el("pesanan-detail-isi"));
    el("pesanan-ringkas").textContent = "";
    el("pesanan-memuat").hidden = true;
    el("pesanan-detail-memuat").hidden = true;
    pesanDaftar("");
    pesanDetail("");
    tampilkanLangkah();
  }

  // ------------------------------------------------------------
  // Pendengar
  // ------------------------------------------------------------

  el("pesanan-kembali").addEventListener("click", kembaliKeDaftar);

  window.KedaiPesanan = Object.freeze({
    tampil: tampil, // dipanggil kerangka.js saat tab Pesanan Saya dibuka
    reset: reset, // dipanggil kerangka.js saat Keluar
    siapkanDetail: siapkanDetail, // NTF.04a: dipanggil kerangka.js saat notifikasi ditekan
  });
})();
