// public/orderwakil.js
// ORD.13: wizard Buat Order untuk pelanggan tanpa akun (order.md O15, bagian 4 "Wizard order wakil owner",
// Handoff #24 kontrak order_buat_wakil, Handoff #25 pesan untuk ORD.13).
// Tampil di panel "buatorder" (tab Buat Order owner). Lima langkah, satu layar per langkah:
//   1 Pemesan   : cari dan pilih pelanggan tanpa akun, atau tambah baru di tempat.
//   2 Menu      : pilih menu dan jumlah (pilihan menu bila ada).
//   3 Pengiriman: tipe, hari, jam, alamat (hanya Diantar).
//   4 Pembayaran: Transfer, Tunai, atau QRIS.
//   5 Ringkasan : cek semua, lalu Simpan. Order langsung Disetujui.
// Dimuat SETELAH akun.js dan pelangganluar.js, dan SEBELUM kerangka.js di index.html.
//
// Aturan yang dijaga:
// - Yang dikirim ke order_buat_wakil hanya: pelanggan_id, tipe, alamat (hanya bila Diantar dan diisi owner),
//   hari ("Hari ini" atau "Besok"), jam (HH:MM), item ({ menu_id, jumlah, opsi_ids }), metode. Aplikasi tidak
//   pernah mengirim harga, total, status, pemutus, atau pembuat (AGENTS.md bagian 7). Total di layar hanya
//   perkiraan; angka resmi dari balasan server.
// - "Hari ini" dan "Besok" dihitung server (WIB). Jam HP tidak dipakai.
// - Server tidak punya penahan kirim ganda (Handoff #24): tombol Simpan dikunci sejak ditekan sampai balasan
//   datang. Jaringan putus setelah permintaan berangkat: hasil tidak pasti, owner disuruh cek dulu.
// - Alamat tersimpan pelanggan dipakai sebagai bawaan. Owner boleh menimpa untuk order ini saja; alamat
//   tersimpan pelanggan tidak berubah. Pelanggan tanpa alamat tersimpan: alamat wajib diisi di langkah 3.
// - Jam bawaan Diantar 11:00 (keputusan ketua 10 Nov 2026, sama dengan layar customer). Diambil dan Makan di
//   warung kosong dan wajib diisi. Jam yang disentuh owner tidak pernah ditimpa. Angka 11:00 ada di kode
//   (pengecualian "angka di database" yang sama dengan JAM_BAWAAN_ANTAR di pesan.js).
// - Galat server ditampilkan apa adanya lewat textContent dan tidak menghapus isian langkah sebelumnya.
// - Semua teks dari server dan isian dipasang lewat textContent, bukan innerHTML.
// - Layar yang digambar ulang menjaga posisi gulung (pelajaran AGENTS.md bagian 12, 9 Nov 2026).
// - Data pelanggan dan isian dikosongkan saat Keluar (reset).
// - Jalan keluar (10 Nov 2026): tombol Kembali ada di semua langkah 2 sampai 5, dan tombol Batalkan order
//   (dengan kartu konfirmasi) di langkah 2 sampai 5. Ya = semua isian dikosongkan, kembali ke langkah 1.

(function () {
  "use strict";

  var A = window.KedaiAkun;
  var PL = window.KedaiPelangganLuar;
  if (!A || !PL) {
    // akun.js atau pelangganluar.js belum termuat: window.KedaiOrderWakil tidak dibuat.
    return;
  }
  var panel = document.getElementById("panel-buatorder");
  if (!panel) return;

  var PESAN_OFFLINE =
    "Belum bisa terhubung. Periksa internet lalu coba lagi. Order belum tersimpan.";
  var PESAN_UMUM = "Order belum bisa disimpan. Coba lagi sebentar lagi.";
  var PESAN_TIDAK_PASTI =
    "Belum bisa memastikan order sudah tersimpan. Jangan simpan ulang dulu: buka Semua Order lalu tekan Segarkan untuk memeriksa, supaya tidak dobel.";
  var PESAN_SESI = "Sesi sudah berakhir. Silakan keluar lalu masuk lagi.";
  var PESAN_MENU = "Daftar menu belum bisa dimuat. Tekan Segarkan.";
  var PESAN_BACA_MENU = "Daftar menu belum bisa ditampilkan. Tekan Segarkan.";

  // Nilai persis seperti yang diterima fungsi SQL order_buat_wakil.
  var TIPE = ["Diantar", "Diambil", "Makan di warung"];
  var HARI = ["Hari ini", "Besok"];
  var METODE = ["Transfer", "Tunai", "QRIS"];
  var JUDUL = ["Pemesan", "Menu", "Pengiriman", "Pembayaran", "Ringkasan"];
  var LABEL_JAM = {
    Diantar: "Jam antar",
    Diambil: "Jam ambil",
    "Makan di warung": "Jam datang",
  };
  var FRASA_JAM = {
    Diantar: "Minta diantar jam ",
    Diambil: "Minta diambil jam ",
    "Makan di warung": "Makan di warung jam ",
  };
  var KELAS_TIPE = {
    Diantar: "badge-tipe--diantar",
    Diambil: "badge-tipe--diambil",
    "Makan di warung": "badge-tipe--warung",
  };
  var REGEX_JAM = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
  var JAM_BAWAAN_ANTAR = "11:00";
  var JUMLAH_MAKS_FORMAT = 9999; // bentuk data saja; batas sebenarnya diputuskan server
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

  // ------------------------------------------------------------
  // Keadaan wizard
  // ------------------------------------------------------------

  var langkah = 1; // 1 sampai 5, atau "selesai"
  var balikRingkas = false; // true bila owner menekan Ubah dari ringkasan: Lanjut kembali ke ringkasan
  var galat = ""; // pesan galat untuk langkah yang sedang tampil
  var konfirmasiBatal = false; // true selama kartu "Batalkan pesanan ini?" tampil

  var pelanggan = null; // { id, nama, keterangan, nomor_wa, alamat_antar }
  var cari = "";
  var formBaru = false;
  var keranjang = []; // { kunci, menuId, nama, harga, jumlah, pilihan: [{ id, teks }] }
  var menuTerbuka = ""; // id menu yang pilihannya sedang dibuka
  var pilihanSementara = {}; // menuId -> daftar indeks opsi terpilih per grup
  var tipe = "Diantar";
  var hari = "Hari ini";
  var jam = JAM_BAWAAN_ANTAR;
  var jamOtomatis = true; // true selama isi jam adalah bawaan 11:00 yang belum disentuh owner
  var alamatUbah = false;
  var alamatTeks = "";
  var metode = "";

  var daftarPelanggan = [];
  var statusPelanggan = "belum"; // "belum" | "memuat" | "siap" | "gagal"
  var pesanPelanggan = "";
  var nomorMuatPelanggan = 0;

  var daftarMenu = [];
  var statusMenu = "belum";
  var pesanMenu = "";
  var nomorMuatMenu = 0;

  var sedangKirim = false;
  var nomorKirim = 0;
  var hasil = null; // balasan server yang sudah dirapikan
  var ringkasHasil = null; // { pemesan, tipe, metode } untuk layar selesai
  var perbaruiDaftar = null; // mengisi ulang daftar pelanggan di langkah 1 tanpa menggambar ulang pencarian

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

  // Pesan dari fungsi kedai sendiri (ok:false + pesan) aman ditampilkan.
  function pesanServer(h) {
    return h &&
      h.data &&
      h.data.ok === false &&
      typeof h.data.pesan === "string"
      ? h.data.pesan
      : "";
  }

  // Tanggal dari server ("YYYY-MM-DD") menjadi "Senin, 10 Nov 2026". Date hanya menebak nama hari dari
  // tanggal server (UTC), bukan membaca jam HP.
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
    return String(s).replace(":", ".");
  }

  function badgeTipe(t) {
    return buat("span", "badge-tipe " + (KELAS_TIPE[t] || ""), t);
  }

  // Menggambar ulang tanpa membuat layar loncat ke atas. Bila panel sedang tersembunyi (balasan datang
  // sesudah owner pindah tab), cukup gambar tanpa menyentuh posisi gulung layar lain.
  function render() {
    if (panel.hidden) {
      gambar();
      return;
    }
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    gambar();
    try {
      window.scrollTo({ top: y, left: 0, behavior: "instant" });
    } catch (err) {
      window.scrollTo(0, y);
    }
  }

  // Pindah langkah: layar baru mulai dari atas.
  function pindah(n, pesan) {
    langkah = n;
    galat = pesan || "";
    konfirmasiBatal = false;
    if (n === 5) balikRingkas = false;
    gambar();
    if (!panel.hidden) window.scrollTo(0, 0);
  }

  // Lanjut dari langkah n: bila dari ringkasan (Ubah), kembali ke ringkasan.
  function lanjutDari(n) {
    var pesan = validasi(n);
    if (pesan) {
      galat = pesan;
      render();
      return;
    }
    pindah(balikRingkas ? 5 : n + 1);
  }

  function kembaliDari(n) {
    balikRingkas = false;
    pindah(n - 1);
  }

  function ubahKe(n) {
    balikRingkas = true;
    pindah(n);
  }

  // ------------------------------------------------------------
  // Data: pelanggan dan menu
  // ------------------------------------------------------------

  function urutkanPelanggan() {
    daftarPelanggan.sort(function (a, b) {
      var x = a.nama.toLowerCase();
      var y = b.nama.toLowerCase();
      return x < y ? -1 : x > y ? 1 : 0;
    });
  }

  function muatPelanggan() {
    var nomor = ++nomorMuatPelanggan;
    if (statusPelanggan !== "siap") statusPelanggan = "memuat";
    return PL.ambilDaftar(false).then(function (r) {
      if (nomor !== nomorMuatPelanggan) return;
      if (r.ok) {
        daftarPelanggan = r.daftar;
        statusPelanggan = "siap";
        pesanPelanggan = "";
      } else {
        if (statusPelanggan !== "siap") statusPelanggan = "gagal";
        pesanPelanggan = r.pesan;
      }
      if (langkah === 1 && perbaruiDaftar) perbaruiDaftar();
    });
  }

  // Grup pilihan menu: [{ id, nama, opsi: [{ id, nama, bawaan }] }]. lengkap = false bila ada id kosong.
  function bacaGrup(g) {
    var daftar = [];
    var lengkap = true;
    if (!Array.isArray(g)) return { grup: daftar, lengkap: true };
    for (var i = 0; i < g.length; i++) {
      var gr = g[i];
      if (!gr || typeof gr.nama !== "string" || !Array.isArray(gr.opsi)) {
        continue;
      }
      var opsi = [];
      for (var j = 0; j < gr.opsi.length; j++) {
        var o = gr.opsi[j];
        if (o && typeof o.nama === "string" && o.nama.trim() !== "") {
          if (typeof o.id !== "string" || o.id === "") lengkap = false;
          opsi.push({
            id: typeof o.id === "string" ? o.id : "",
            nama: o.nama,
            bawaan: o.bawaan === true,
          });
        }
      }
      if (opsi.length === 0) continue;
      if (typeof gr.id !== "string" || gr.id === "") lengkap = false;
      daftar.push({
        id: typeof gr.id === "string" ? gr.id : "",
        nama: gr.nama,
        opsi: opsi,
      });
    }
    return { grup: daftar, lengkap: lengkap };
  }

  // Hanya menu aktif dan Tersedia (server menolak menu Habis). null bila daftar tidak bisa dibaca.
  function bacaMenu(d) {
    if (!Array.isArray(d)) return null;
    var hasilBaca = [];
    var salah = 0;
    for (var i = 0; i < d.length; i++) {
      var m = d[i];
      if (
        m &&
        typeof m.id === "string" &&
        typeof m.nama === "string" &&
        isFinite(Number(m.harga))
      ) {
        if (m.aktif !== false && m.tersedia === true) {
          var g = bacaGrup(m.grup);
          hasilBaca.push({
            id: m.id,
            nama: m.nama,
            harga: Number(m.harga),
            grup: g.grup,
            lengkap: g.lengkap,
          });
        }
      } else {
        salah++;
      }
    }
    if (d.length > 0 && hasilBaca.length === 0 && salah > 0) return null;
    return hasilBaca;
  }

  function muatMenu() {
    var nomor = ++nomorMuatMenu;
    if (statusMenu !== "siap") statusMenu = "memuat";
    return A.panggilKedai("menu_daftar").then(
      function (h) {
        if (nomor !== nomorMuatMenu) return;
        if (h.status === 200 && h.data && h.data.ok === true) {
          var baru = bacaMenu(h.data.menu);
          if (baru) {
            daftarMenu = baru;
            statusMenu = "siap";
            pesanMenu = "";
          } else {
            if (statusMenu !== "siap") statusMenu = "gagal";
            pesanMenu = PESAN_BACA_MENU;
          }
        } else {
          if (statusMenu !== "siap") statusMenu = "gagal";
          pesanMenu =
            h.status === 401 && !h.data
              ? PESAN_SESI
              : pesanServer(h) || PESAN_MENU;
        }
        if (langkah === 2) render();
      },
      function () {
        if (nomor !== nomorMuatMenu) return;
        if (statusMenu !== "siap") statusMenu = "gagal";
        pesanMenu = navigator.onLine
          ? PESAN_MENU
          : "Belum bisa terhubung. Periksa internet lalu coba lagi.";
        if (langkah === 2) render();
      },
    );
  }

  // ------------------------------------------------------------
  // Keranjang
  // ------------------------------------------------------------

  function kunciBaris(menuId, pilihan) {
    var ids = [];
    for (var i = 0; i < pilihan.length; i++) {
      ids.push(pilihan[i].id);
    }
    ids.sort();
    return menuId + "|" + ids.join(",");
  }

  function cariBaris(kunci) {
    for (var i = 0; i < keranjang.length; i++) {
      if (keranjang[i].kunci === kunci) return keranjang[i];
    }
    return null;
  }

  function jumlahMenu(menuId) {
    var n = 0;
    for (var i = 0; i < keranjang.length; i++) {
      if (keranjang[i].menuId === menuId) n += keranjang[i].jumlah;
    }
    return n;
  }

  // Hanya perkiraan untuk ditampilkan; harga resmi dihitung server.
  function totalPerkiraan() {
    var t = 0;
    for (var i = 0; i < keranjang.length; i++) {
      t += keranjang[i].harga * keranjang[i].jumlah;
    }
    return t;
  }

  function tambahKeranjang(m, pilihan) {
    var kunci = kunciBaris(m.id, pilihan);
    var ada = cariBaris(kunci);
    if (ada) {
      ada.jumlah = Math.min(JUMLAH_MAKS_FORMAT, ada.jumlah + 1);
    } else {
      keranjang.push({
        kunci: kunci,
        menuId: m.id,
        nama: m.nama,
        harga: m.harga,
        jumlah: 1,
        pilihan: pilihan,
      });
    }
    galat = "";
    menuTerbuka = "";
    render();
  }

  function ubahJumlah(b, selisih) {
    var baru = b.jumlah + selisih;
    if (baru < 1 || baru > JUMLAH_MAKS_FORMAT) return;
    b.jumlah = baru;
    galat = "";
    render();
  }

  function hapusBaris(b) {
    var i = keranjang.indexOf(b);
    if (i >= 0) keranjang.splice(i, 1);
    galat = "";
    render();
  }

  // Pilihan bawaan tiap grup: indeks opsi bawaan, atau opsi pertama bila tidak ada.
  function pilihanBawaan(m) {
    var hasilPilih = [];
    for (var i = 0; i < m.grup.length; i++) {
      var idx = 0;
      for (var j = 0; j < m.grup[i].opsi.length; j++) {
        if (m.grup[i].opsi[j].bawaan) idx = j;
      }
      hasilPilih.push(idx);
    }
    return hasilPilih;
  }

  // Susun pilihan dari indeks terpilih: [{ id (uuid opsi), teks ("Nama grup: Nama opsi") }].
  function susunPilihan(m) {
    var sel = pilihanSementara[m.id] || pilihanBawaan(m);
    var daftar = [];
    for (var i = 0; i < m.grup.length; i++) {
      var o = m.grup[i].opsi[sel[i]] || m.grup[i].opsi[0];
      daftar.push({ id: o.id, teks: m.grup[i].nama + ": " + o.nama });
    }
    return daftar;
  }

  // ------------------------------------------------------------
  // Validasi per langkah (cek di aplikasi hanya kemudahan; server yang memutuskan)
  // ------------------------------------------------------------

  function perluIsiAlamat() {
    return !!pelanggan && (!pelanggan.alamat_antar || alamatUbah);
  }

  // Alamat yang dikirim ke server. Kosong = server memakai alamat tersimpan pelanggan.
  function alamatKirim() {
    if (tipe !== "Diantar" || !perluIsiAlamat()) return "";
    return alamatTeks.trim();
  }

  function validasi(n) {
    if (n === 1) return pelanggan ? "" : "Pilih pemesan dulu.";
    if (n === 2) return keranjang.length > 0 ? "" : "Pilih minimal satu menu.";
    if (n === 3) {
      if (TIPE.indexOf(tipe) < 0) return "Pilih tipe order.";
      if (HARI.indexOf(hari) < 0) return "Pilih hari.";
      if (!REGEX_JAM.test(jam)) {
        return "Isi jam dengan lengkap (jam dan menit).";
      }
      if (tipe === "Diantar" && perluIsiAlamat()) {
        var a = alamatTeks.trim();
        if (a.length < 10 || a.length > 200) {
          return "Alamat antar harus 10 sampai 200 karakter.";
        }
      }
      return "";
    }
    if (n === 4) {
      return METODE.indexOf(metode) >= 0 ? "" : "Pilih cara pembayaran.";
    }
    return "";
  }

  // ------------------------------------------------------------
  // Komponen layar bersama
  // ------------------------------------------------------------

  function kepala(n) {
    var d = buat("div");
    d.appendChild(buat("p", "isian__bantuan", "Langkah " + n + " dari 5"));
    d.appendChild(buat("h1", "", JUDUL[n - 1]));
    return d;
  }

  function barisPemesan() {
    if (!pelanggan) return null;
    var teks = "Pemesan: " + pelanggan.nama;
    if (pelanggan.keterangan) teks += " (" + pelanggan.keterangan + ")";
    return buat("p", "isian__bantuan", teks);
  }

  function elemenGalat() {
    var p = buat("p", "isian__galat", galat);
    p.setAttribute("role", "alert");
    p.hidden = !galat;
    return p;
  }

  function barisNav(kembali, teksLanjut, lanjut, matiLanjut) {
    var b = buat("div", "baris-tombol");
    if (kembali) {
      b.appendChild(
        buatTombol("Kembali", "tombol--sekunder", kembali, sedangKirim),
      );
    }
    b.appendChild(
      buatTombol(
        teksLanjut,
        "tombol--utama",
        lanjut,
        matiLanjut || sedangKirim,
      ),
    );
    return b;
  }

  // Jalan keluar wizard: tombol Batalkan order, lalu kartu konfirmasi. Ya = semua isian dikosongkan dan
  // kembali ke langkah 1. Tidak memanggil server (order belum dibuat).
  function blokBatal() {
    var b = buat("div", "baris-tombol");
    if (!konfirmasiBatal) {
      b.appendChild(
        buatTombol(
          "Batalkan order",
          "tombol--sekunder tombol--bahaya",
          function () {
            konfirmasiBatal = true;
            render();
          },
          sedangKirim,
        ),
      );
      return b;
    }
    var kartu = buat("div", "kartu");
    kartu.setAttribute("role", "alertdialog");
    kartu.appendChild(buat("h2", "kartu__judul", "Batalkan pesanan ini?"));
    kartu.appendChild(
      buat(
        "p",
        "isian__bantuan",
        "Semua isian akan dihapus dan Anda kembali ke langkah 1. Order belum dibuat.",
      ),
    );
    var baris = buat("div", "baris-tombol");
    baris.appendChild(
      buatTombol(
        "Tidak",
        "tombol--sekunder",
        function () {
          konfirmasiBatal = false;
          render();
        },
        sedangKirim,
      ),
    );
    baris.appendChild(
      buatTombol(
        "Ya, batalkan",
        "tombol--sekunder tombol--bahaya",
        function () {
          mulaiBaru();
          pindah(1);
        },
        sedangKirim,
      ),
    );
    kartu.appendChild(baris);
    return kartu;
  }

  function isianPilih(id, label, opsi, nilai, saatUbah) {
    var bungkus = buat("div", "isian");
    var l = buat("label", "isian__label", label);
    l.htmlFor = id;
    bungkus.appendChild(l);
    var pilih = buat("select", "isian__kolom");
    pilih.id = id;
    for (var i = 0; i < opsi.length; i++) {
      var o = buat("option", "", opsi[i]);
      o.value = opsi[i];
      pilih.appendChild(o);
    }
    pilih.value = nilai;
    pilih.addEventListener("change", function () {
      saatUbah(pilih.value);
    });
    bungkus.appendChild(pilih);
    return bungkus;
  }

  // ------------------------------------------------------------
  // Langkah 1: Pemesan
  // ------------------------------------------------------------

  function pilihPelanggan(p) {
    if (!pelanggan || pelanggan.id !== p.id) {
      // Pemesan berbeda: alamat timpaan order sebelumnya tidak boleh terbawa.
      alamatUbah = false;
      alamatTeks = "";
    }
    pelanggan = p;
    cari = "";
    formBaru = false;
    galat = "";
    pindah(balikRingkas ? 5 : 2);
  }

  function isiDaftarPelanggan(wadah) {
    kosongkan(wadah);
    if (pesanPelanggan) {
      var p = buat("p", "isian__galat", pesanPelanggan);
      p.setAttribute("role", "alert");
      wadah.appendChild(p);
    }
    if (statusPelanggan === "belum" || statusPelanggan === "memuat") {
      wadah.appendChild(buat("p", "isian__bantuan", "Memuat pelanggan..."));
      return;
    }
    if (statusPelanggan === "gagal") {
      wadah.appendChild(
        buatTombol("Coba lagi", "tombol--sekunder", function () {
          muatPelanggan();
          if (perbaruiDaftar) perbaruiDaftar();
        }),
      );
      return;
    }
    var kata = cari.trim().toLowerCase();
    var cocok = [];
    for (var i = 0; i < daftarPelanggan.length; i++) {
      var d = daftarPelanggan[i];
      if ((d.nama + " " + d.keterangan).toLowerCase().indexOf(kata) >= 0) {
        cocok.push(d);
      }
    }
    if (cocok.length === 0) {
      var kosong = buat("div", "keadaan");
      kosong.setAttribute("role", "status");
      if (kata !== "") {
        kosong.appendChild(buat("p", "keadaan__judul", "Tidak ada yang cocok"));
        kosong.appendChild(
          buat(
            "p",
            "keadaan__ket",
            "Coba nama lain, atau tekan Pelanggan baru.",
          ),
        );
      } else {
        kosong.appendChild(buat("p", "keadaan__judul", "Belum ada pelanggan"));
        kosong.appendChild(
          buat("p", "keadaan__ket", "Tekan Pelanggan baru untuk mencatatnya."),
        );
      }
      wadah.appendChild(kosong);
      return;
    }
    for (var k = 0; k < cocok.length; k++) {
      (function (p) {
        var kartu = buat("div", "kartu");
        kartu.appendChild(buat("p", "menu-nama", p.nama));
        if (p.keterangan) {
          kartu.appendChild(buat("p", "kartu-order__baris", p.keterangan));
        }
        var baris = buat("div", "baris-tombol");
        baris.appendChild(
          buatTombol(
            "Pilih",
            "tombol--sekunder",
            function () {
              pilihPelanggan(p);
            },
            false,
            "Pilih " + p.nama,
          ),
        );
        kartu.appendChild(baris);
        wadah.appendChild(kartu);
      })(cocok[k]);
    }
  }

  function langkah1() {
    panel.appendChild(kepala(1));

    if (formBaru) {
      var form = PL.buatForm({
        judul: "Pelanggan baru",
        teksSimpan: "Simpan dan pilih",
        onSukses: function (p) {
          if (p) {
            daftarPelanggan.push(p);
            urutkanPelanggan();
            pilihPelanggan(p);
          } else {
            // Tersimpan tetapi balasan tidak terbaca: muat ulang, owner memilih dari daftar.
            formBaru = false;
            statusPelanggan = "memuat";
            muatPelanggan();
            render();
          }
        },
        onBatal: function () {
          formBaru = false;
          render();
        },
      });
      panel.appendChild(form);
      form.fokus();
      return;
    }

    if (pelanggan) {
      var terpilih = buat("div", "kartu");
      terpilih.appendChild(buat("h2", "kartu__judul", "Pemesan terpilih"));
      terpilih.appendChild(buat("p", "menu-nama", pelanggan.nama));
      if (pelanggan.keterangan) {
        terpilih.appendChild(
          buat("p", "kartu-order__baris", pelanggan.keterangan),
        );
      }
      panel.appendChild(terpilih);
      panel.appendChild(
        barisNav(
          null,
          "Lanjut",
          function () {
            lanjutDari(1);
          },
          false,
        ),
      );
      panel.appendChild(buat("p", "isian__bantuan", "Atau ganti pemesan:"));
    }

    var isianCari = buat("div", "isian");
    var labelCari = buat("label", "isian__label", "Cari nama pelanggan");
    labelCari.htmlFor = "ow-cari";
    isianCari.appendChild(labelCari);
    var kolom = buat("input", "isian__kolom");
    kolom.id = "ow-cari";
    kolom.type = "search";
    kolom.autocomplete = "off";
    kolom.value = cari;
    isianCari.appendChild(kolom);
    panel.appendChild(isianCari);

    var barisBaru = buat("div", "baris-tombol");
    barisBaru.appendChild(
      buatTombol("Pelanggan baru", "tombol--utama", function () {
        formBaru = true;
        render();
        window.scrollTo(0, 0);
      }),
    );
    panel.appendChild(barisBaru);

    var wadah = buat("div");
    panel.appendChild(wadah);
    perbaruiDaftar = function () {
      isiDaftarPelanggan(wadah);
    };
    kolom.addEventListener("input", function () {
      cari = kolom.value;
      perbaruiDaftar();
    });
    perbaruiDaftar();
  }

  // ------------------------------------------------------------
  // Langkah 2: Menu
  // ------------------------------------------------------------

  function kartuPesananItem(b) {
    var kartu = buat("div", "kartu");
    kartu.appendChild(buat("p", "menu-nama", b.nama));
    for (var i = 0; i < b.pilihan.length; i++) {
      kartu.appendChild(buat("p", "isian__bantuan", b.pilihan[i].teks));
    }
    kartu.appendChild(
      buat(
        "p",
        "menu-harga",
        b.jumlah + " x " + rupiah(b.harga) + " = " + rupiah(b.harga * b.jumlah),
      ),
    );
    var baris = buat("div", "baris-tombol");
    baris.appendChild(
      buatTombol(
        "Kurangi",
        "tombol--sekunder",
        function () {
          ubahJumlah(b, -1);
        },
        b.jumlah <= 1,
        "Kurangi jumlah " + b.nama,
      ),
    );
    baris.appendChild(
      buatTombol(
        "Tambah",
        "tombol--sekunder",
        function () {
          ubahJumlah(b, 1);
        },
        b.jumlah >= JUMLAH_MAKS_FORMAT,
        "Tambah jumlah " + b.nama,
      ),
    );
    baris.appendChild(
      buatTombol(
        "Hapus",
        "tombol--bahaya",
        function () {
          hapusBaris(b);
        },
        false,
        "Hapus " + b.nama + " dari order",
      ),
    );
    kartu.appendChild(baris);
    return kartu;
  }

  function kartuMenu(m) {
    var kartu = buat("div", "kartu");
    var atas = buat("div", "kartu-order__atas");
    atas.appendChild(buat("span", "menu-nama", m.nama));
    atas.appendChild(buat("span", "menu-harga", rupiah(m.harga)));
    kartu.appendChild(atas);

    var n = jumlahMenu(m.id);
    if (n > 0) {
      kartu.appendChild(buat("p", "isian__bantuan", "Di order: " + n));
    }

    if (m.grup.length === 0) {
      var baris0 = buat("div", "baris-tombol");
      baris0.appendChild(
        buatTombol(
          "Tambah",
          "tombol--sekunder",
          function () {
            tambahKeranjang(m, []);
          },
          false,
          "Tambah " + m.nama,
        ),
      );
      kartu.appendChild(baris0);
      return kartu;
    }

    if (!m.lengkap) {
      kartu.appendChild(
        buat(
          "p",
          "isian__bantuan",
          "Pilihan menu belum bisa dibaca. Tekan Segarkan.",
        ),
      );
      return kartu;
    }

    if (menuTerbuka !== m.id) {
      var baris1 = buat("div", "baris-tombol");
      baris1.appendChild(
        buatTombol(
          "Pilih",
          "tombol--sekunder",
          function () {
            menuTerbuka = m.id;
            if (!pilihanSementara[m.id]) {
              pilihanSementara[m.id] = pilihanBawaan(m);
            }
            render();
          },
          false,
          "Pilih opsi " + m.nama,
        ),
      );
      kartu.appendChild(baris1);
      return kartu;
    }

    var sel = pilihanSementara[m.id] || pilihanBawaan(m);
    pilihanSementara[m.id] = sel;
    for (var gi = 0; gi < m.grup.length; gi++) {
      (function (indeksGrup) {
        var g = m.grup[indeksGrup];
        var kelompok = buat("div", "sheet-menu__grup");
        kelompok.setAttribute("role", "radiogroup");
        var judul = buat("h3", "sheet-menu__grup-nama", g.nama);
        judul.id = "ow-grup-" + m.id + "-" + indeksGrup;
        kelompok.setAttribute("aria-labelledby", judul.id);
        kelompok.appendChild(judul);
        for (var oi = 0; oi < g.opsi.length; oi++) {
          (function (indeksOpsi) {
            var baris = buat("label", "sheet-menu__pilih");
            var radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "ow-" + m.id + "-" + indeksGrup;
            radio.checked = sel[indeksGrup] === indeksOpsi;
            radio.addEventListener("change", function () {
              if (radio.checked) sel[indeksGrup] = indeksOpsi;
            });
            baris.appendChild(radio);
            baris.appendChild(buat("span", "", g.opsi[indeksOpsi].nama));
            kelompok.appendChild(baris);
          })(oi);
        }
        kartu.appendChild(kelompok);
      })(gi);
    }
    var barisAksi = buat("div", "baris-tombol");
    barisAksi.appendChild(
      buatTombol("Batal", "tombol--sekunder", function () {
        menuTerbuka = "";
        render();
      }),
    );
    barisAksi.appendChild(
      buatTombol("Tambah ke order", "tombol--utama", function () {
        tambahKeranjang(m, susunPilihan(m));
      }),
    );
    kartu.appendChild(barisAksi);
    return kartu;
  }

  function langkah2() {
    panel.appendChild(kepala(2));
    var bp = barisPemesan();
    if (bp) panel.appendChild(bp);

    panel.appendChild(buat("h2", "", "Order ini"));
    if (keranjang.length === 0) {
      panel.appendChild(
        buat(
          "p",
          "isian__bantuan",
          "Belum ada menu. Pilih dari daftar di bawah.",
        ),
      );
    } else {
      for (var i = 0; i < keranjang.length; i++) {
        panel.appendChild(kartuPesananItem(keranjang[i]));
      }
      panel.appendChild(
        buat("p", "menu-harga", "Perkiraan total: " + rupiah(totalPerkiraan())),
      );
    }

    panel.appendChild(buat("h2", "", "Daftar menu"));
    if (pesanMenu) {
      var pm = buat("p", "isian__galat", pesanMenu);
      pm.setAttribute("role", "alert");
      panel.appendChild(pm);
    }
    if (statusMenu === "belum" || statusMenu === "memuat") {
      panel.appendChild(buat("p", "isian__bantuan", "Memuat menu..."));
    } else if (statusMenu === "gagal") {
      panel.appendChild(
        buatTombol("Coba lagi", "tombol--sekunder", function () {
          muatMenu();
          render();
        }),
      );
    } else if (daftarMenu.length === 0) {
      var kosong = buat("div", "keadaan");
      kosong.setAttribute("role", "status");
      kosong.appendChild(
        buat("p", "keadaan__judul", "Belum ada menu tersedia"),
      );
      kosong.appendChild(
        buat(
          "p",
          "keadaan__ket",
          "Menu yang aktif dan tersedia akan muncul di sini.",
        ),
      );
      panel.appendChild(kosong);
    } else {
      for (var k = 0; k < daftarMenu.length; k++) {
        panel.appendChild(kartuMenu(daftarMenu[k]));
      }
    }

    panel.appendChild(elemenGalat());
    panel.appendChild(
      barisNav(
        function () {
          kembaliDari(2);
        },
        "Lanjut",
        function () {
          lanjutDari(2);
        },
        keranjang.length === 0,
      ),
    );
    panel.appendChild(blokBatal());
  }

  // ------------------------------------------------------------
  // Langkah 3: Pengiriman
  // ------------------------------------------------------------

  // Jam bawaan per tipe. Diantar: isi 11:00 bila jam masih kosong. Tipe lain: bawaan otomatis dikosongkan;
  // jam yang sudah diketik atau diubah owner tidak pernah ditimpa.
  function aturJamBawaan() {
    if (tipe === "Diantar") {
      if (jam === "") {
        jam = JAM_BAWAAN_ANTAR;
        jamOtomatis = true;
      }
    } else if (jamOtomatis) {
      jam = "";
      jamOtomatis = false;
    }
  }

  function blokAlamat() {
    var blok = buat("div", "isian");
    blok.appendChild(buat("p", "isian__label", "Alamat antar"));

    var tersimpan = pelanggan ? pelanggan.alamat_antar : "";
    if (tersimpan && !alamatUbah) {
      blok.appendChild(buat("p", "kartu__isi", tersimpan));
      var barisGanti = buat("div", "baris-tombol");
      barisGanti.appendChild(
        buatTombol(
          "Ganti alamat untuk order ini",
          "tombol--sekunder",
          function () {
            alamatUbah = true;
            alamatTeks = "";
            render();
          },
        ),
      );
      blok.appendChild(barisGanti);
      return blok;
    }

    var area = buat("textarea", "isian__kolom");
    area.id = "ow-alamat";
    area.maxLength = 200;
    area.autocomplete = "off";
    area.value = alamatTeks;
    area.addEventListener("input", function () {
      alamatTeks = area.value;
    });
    var label = buat(
      "label",
      "isian__bantuan",
      tersimpan
        ? "Alamat untuk order ini saja. Alamat tersimpan pelanggan tidak berubah."
        : "Pelanggan ini belum punya alamat tersimpan. Isi alamat antar (wajib). Alamat ini hanya dipakai untuk order ini.",
    );
    label.htmlFor = "ow-alamat";
    blok.appendChild(label);
    blok.appendChild(area);
    if (tersimpan) {
      var barisPakai = buat("div", "baris-tombol");
      barisPakai.appendChild(
        buatTombol("Pakai alamat tersimpan", "tombol--sekunder", function () {
          alamatUbah = false;
          alamatTeks = "";
          render();
        }),
      );
      blok.appendChild(barisPakai);
    }
    return blok;
  }

  function langkah3() {
    panel.appendChild(kepala(3));
    var bp = barisPemesan();
    if (bp) panel.appendChild(bp);

    var kartu = buat("div", "kartu");
    kartu.appendChild(
      isianPilih("ow-tipe", "Tipe order", TIPE, tipe, function (v) {
        tipe = v;
        aturJamBawaan();
        galat = "";
        render();
      }),
    );
    kartu.appendChild(
      isianPilih("ow-hari", "Hari", HARI, hari, function (v) {
        hari = v;
      }),
    );

    var isianJam = buat("div", "isian");
    var labelJam = buat("label", "isian__label", LABEL_JAM[tipe] || "Jam");
    labelJam.htmlFor = "ow-jam";
    isianJam.appendChild(labelJam);
    var kolomJam = buat("input", "isian__kolom");
    kolomJam.id = "ow-jam";
    kolomJam.type = "time";
    kolomJam.value = jam;
    var ubahJam = function () {
      jam = kolomJam.value;
      jamOtomatis = false;
    };
    kolomJam.addEventListener("input", ubahJam);
    kolomJam.addEventListener("change", ubahJam);
    isianJam.appendChild(kolomJam);
    isianJam.appendChild(
      buat("p", "isian__bantuan", "Isi jam yang diminta pemesan."),
    );
    kartu.appendChild(isianJam);

    if (tipe === "Diantar") kartu.appendChild(blokAlamat());
    panel.appendChild(kartu);

    panel.appendChild(elemenGalat());
    panel.appendChild(
      barisNav(
        function () {
          kembaliDari(3);
        },
        "Lanjut",
        function () {
          lanjutDari(3);
        },
        false,
      ),
    );
    panel.appendChild(blokBatal());
  }

  // ------------------------------------------------------------
  // Langkah 4: Pembayaran
  // ------------------------------------------------------------

  function langkah4() {
    panel.appendChild(kepala(4));
    var bp = barisPemesan();
    if (bp) panel.appendChild(bp);

    var kartu = buat("div", "kartu");
    kartu.appendChild(buat("h2", "kartu__judul", "Pembayaran diterima lewat"));
    kartu.appendChild(
      buat(
        "p",
        "isian__bantuan",
        "Pilih cara pembayaran yang sudah Anda terima dari pemesan. Order langsung disetujui.",
      ),
    );
    for (var i = 0; i < METODE.length; i++) {
      (function (nama) {
        var dipilih = metode === nama;
        var baris = buat("div", "baris-tombol");
        var t = buatTombol(
          nama,
          dipilih ? "tombol--utama" : "tombol--sekunder",
          function () {
            metode = nama;
            galat = "";
            render();
          },
          sedangKirim,
        );
        t.setAttribute("aria-pressed", dipilih ? "true" : "false");
        baris.appendChild(t);
        kartu.appendChild(baris);
      })(METODE[i]);
    }
    panel.appendChild(kartu);

    panel.appendChild(elemenGalat());
    panel.appendChild(
      barisNav(
        function () {
          kembaliDari(4);
        },
        "Lanjut",
        function () {
          lanjutDari(4);
        },
        metode === "",
      ),
    );
    panel.appendChild(blokBatal());
  }

  // ------------------------------------------------------------
  // Langkah 5: Ringkasan dan Simpan
  // ------------------------------------------------------------

  function kartuRingkas(judul, isi, ke) {
    var kartu = buat("div", "kartu");
    kartu.appendChild(buat("h2", "kartu__judul", judul));
    for (var i = 0; i < isi.length; i++) {
      kartu.appendChild(isi[i]);
    }
    var baris = buat("div", "baris-tombol");
    baris.appendChild(
      buatTombol(
        "Ubah",
        "tombol--sekunder",
        function () {
          ubahKe(ke);
        },
        sedangKirim,
        "Ubah " + judul.toLowerCase(),
      ),
    );
    kartu.appendChild(baris);
    return kartu;
  }

  function langkah5() {
    panel.appendChild(kepala(5));
    panel.appendChild(
      buat(
        "p",
        "isian__bantuan",
        "Cek dulu. Setelah disimpan, order langsung Disetujui dan masuk antrean penjaga.",
      ),
    );

    var barisP = [buat("p", "menu-nama", pelanggan ? pelanggan.nama : "-")];
    if (pelanggan && pelanggan.keterangan) {
      barisP.push(buat("p", "kartu-order__baris", pelanggan.keterangan));
    }
    if (pelanggan && pelanggan.nomor_wa) {
      barisP.push(buat("p", "isian__bantuan", "WA: " + pelanggan.nomor_wa));
    }
    panel.appendChild(kartuRingkas("Pemesan", barisP, 1));

    var barisM = [];
    for (var i = 0; i < keranjang.length; i++) {
      var b = keranjang[i];
      barisM.push(buat("p", "menu-nama", b.jumlah + " x " + b.nama));
      for (var k = 0; k < b.pilihan.length; k++) {
        barisM.push(buat("p", "isian__bantuan", b.pilihan[k].teks));
      }
    }
    barisM.push(
      buat("p", "menu-harga", "Perkiraan total: " + rupiah(totalPerkiraan())),
    );
    barisM.push(
      buat("p", "isian__bantuan", "Harga akhir dihitung saat order disimpan."),
    );
    panel.appendChild(kartuRingkas("Menu", barisM, 2));

    var barisK = [];
    var pTipe = buat("p", "kartu-order__baris");
    pTipe.appendChild(badgeTipe(tipe));
    barisK.push(pTipe);
    barisK.push(
      buat(
        "p",
        "kartu-order__baris",
        (FRASA_JAM[tipe] || "Jam ") + jamIndo(jam) + ", " + hari,
      ),
    );
    if (tipe === "Diantar") {
      var teksAlamat =
        alamatKirim() || (pelanggan ? pelanggan.alamat_antar : "");
      barisK.push(buat("p", "isian__bantuan", teksAlamat || "-"));
    }
    panel.appendChild(kartuRingkas("Pengiriman", barisK, 3));

    panel.appendChild(
      kartuRingkas(
        "Pembayaran",
        [buat("p", "kartu__isi", "Diterima lewat " + metode)],
        4,
      ),
    );

    panel.appendChild(elemenGalat());
    var barisSimpan = buat("div", "baris-tombol");
    barisSimpan.appendChild(
      buatTombol(
        "Kembali",
        "tombol--sekunder",
        function () {
          kembaliDari(5);
        },
        sedangKirim,
      ),
    );
    barisSimpan.appendChild(
      buatTombol(
        sedangKirim ? "Menyimpan..." : "Simpan order",
        "tombol--utama",
        simpan,
        sedangKirim,
      ),
    );
    panel.appendChild(barisSimpan);
    panel.appendChild(blokBatal());
  }

  // Kirim ke server. Server yang menghitung harga, hari, dan status; aplikasi hanya mengirim pilihan owner.
  function simpan() {
    if (sedangKirim) return;
    // Cek ulang semua langkah (mis. pemesan diganti dari ringkasan, alamat jadi wajib).
    for (var n = 1; n <= 4; n++) {
      var pesan = validasi(n);
      if (pesan) {
        balikRingkas = true;
        pindah(n, pesan);
        return;
      }
    }
    if (!navigator.onLine) {
      galat = PESAN_OFFLINE;
      render();
      return;
    }

    var item = [];
    for (var i = 0; i < keranjang.length; i++) {
      var b = keranjang[i];
      var opsiIds = [];
      for (var k = 0; k < b.pilihan.length; k++) {
        opsiIds.push(b.pilihan[k].id);
      }
      item.push({ menu_id: b.menuId, jumlah: b.jumlah, opsi_ids: opsiIds });
    }
    var data = {
      pelanggan_id: pelanggan.id,
      tipe: tipe,
      hari: hari,
      jam: jam,
      item: item,
      metode: metode,
    };
    var alamat = alamatKirim();
    if (tipe === "Diantar" && alamat !== "") data.alamat = alamat;

    // Kunci sebelum permintaan berangkat: dua ketukan cepat tidak boleh jadi dua order.
    sedangKirim = true;
    var nomor = ++nomorKirim;
    var ringkas = {
      pemesan: pelanggan.nama,
      tipe: tipe,
      metode: metode,
    };
    galat = "";
    render();

    A.panggilKedai("order_buat_wakil", data).then(
      function (h) {
        if (nomor !== nomorKirim) return; // sudah Keluar: balasan lama diabaikan
        sedangKirim = false;
        if (h.status === 200 && h.data && h.data.ok === true) {
          hasil = bacaHasil(h.data.order);
          ringkasHasil = ringkas;
          // Isian dikosongkan; yang tampil di layar selesai hanya dari balasan server.
          keranjang = [];
          pelanggan = null;
          metode = "";
          alamatUbah = false;
          alamatTeks = "";
          tipe = "Diantar";
          hari = "Hari ini";
          jam = JAM_BAWAAN_ANTAR;
          jamOtomatis = true;
          cari = "";
          formBaru = false;
          menuTerbuka = "";
          pilihanSementara = {};
          balikRingkas = false;
          pindah("selesai");
          return;
        }
        var pesanBalas =
          h.status === 401 && !h.data
            ? PESAN_SESI
            : pesanServer(h) || PESAN_UMUM;
        // Menu atau pelanggan berubah di server: muat ulang supaya daftar di layar mutakhir.
        if (h.status === 404 || h.status === 409) {
          muatMenu();
          muatPelanggan();
        }
        galat = pesanBalas;
        render();
      },
      function () {
        if (nomor !== nomorKirim) return;
        sedangKirim = false;
        galat = navigator.onLine ? PESAN_TIDAK_PASTI : PESAN_OFFLINE;
        render();
      },
    );
  }

  // ------------------------------------------------------------
  // Layar selesai
  // ------------------------------------------------------------

  function bacaHasil(o) {
    var h = { nomor: null, total: null, hari: "", jam: "", metode: "" };
    if (o && typeof o === "object") {
      if (typeof o.nomor === "number" && isFinite(o.nomor)) h.nomor = o.nomor;
      if (typeof o.total === "number" && isFinite(o.total)) h.total = o.total;
      h.hari = tanggalIndo(o.hari_target);
      var j = teksAtauKosong(o.jam_permintaan).slice(0, 5);
      if (REGEX_JAM.test(j)) h.jam = jamIndo(j);
      h.metode = teksAtauKosong(o.metode_bayar);
    }
    return h;
  }

  function mulaiBaru() {
    langkah = 1;
    galat = "";
    hasil = null;
    ringkasHasil = null;
    pelanggan = null;
    cari = "";
    formBaru = false;
    keranjang = [];
    menuTerbuka = "";
    pilihanSementara = {};
    tipe = "Diantar";
    hari = "Hari ini";
    jam = JAM_BAWAAN_ANTAR;
    jamOtomatis = true;
    alamatUbah = false;
    alamatTeks = "";
    metode = "";
    balikRingkas = false;
    konfirmasiBatal = false;
  }

  function layarSelesai() {
    var h = hasil || {
      nomor: null,
      total: null,
      hari: "",
      jam: "",
      metode: "",
    };
    var r = ringkasHasil || { pemesan: "", tipe: "", metode: "" };
    panel.appendChild(
      buat(
        "h1",
        "",
        h.nomor !== null
          ? "Order #" + h.nomor + " tersimpan"
          : "Order tersimpan",
      ),
    );
    var kartu = buat("div", "kartu");
    var atas = buat("div", "kartu-order__atas");
    atas.appendChild(buat("span", "menu-nama", r.pemesan));
    atas.appendChild(buat("span", "lencana lencana--disetujui", "Disetujui"));
    kartu.appendChild(atas);
    if (r.tipe) {
      var pTipe = buat("p", "kartu-order__baris");
      pTipe.appendChild(badgeTipe(r.tipe));
      kartu.appendChild(pTipe);
    }
    if (h.jam !== "" || h.hari !== "") {
      var teks = (FRASA_JAM[r.tipe] || "Jam ") + (h.jam || "-");
      if (h.hari) teks += ", " + h.hari;
      kartu.appendChild(buat("p", "kartu-order__baris", teks));
    }
    var metodeTampil = h.metode || r.metode;
    if (metodeTampil) {
      kartu.appendChild(
        buat("p", "kartu-order__baris", "Dibayar lewat " + metodeTampil),
      );
    }
    if (h.total !== null) {
      var bawah = buat("div", "kartu-order__bawah");
      bawah.appendChild(buat("span", "", "Total"));
      bawah.appendChild(buat("span", "", rupiah(h.total)));
      kartu.appendChild(bawah);
    }
    panel.appendChild(kartu);
    panel.appendChild(
      buat(
        "p",
        "isian__bantuan",
        // Teks lama (sebelum Kotak masuk jadi, 12 Nov 2026):
        // "Penjaga akan melihat order ini di Antrean. Belum ada notifikasi otomatis ke penjaga, jadi kabari lewat WA bila perlu. Order bisa dilihat di Semua Order.",
        "Penjaga akan melihat order ini di Antrean dan dapat kabar di Kotak masuk. Belum ada notifikasi otomatis ke layar HP, jadi kabari lewat WA bila mendesak. Order bisa dilihat di Semua Order.",
      ),
    );
    var baris = buat("div", "baris-tombol");
    baris.appendChild(
      buatTombol("Buat order lagi", "tombol--utama", function () {
        mulaiBaru();
        muatPelanggan();
        muatMenu();
        pindah(1);
      }),
    );
    panel.appendChild(baris);
  }

  // ------------------------------------------------------------
  // Gambar
  // ------------------------------------------------------------

  function gambar() {
    kosongkan(panel);
    perbaruiDaftar = null;
    if (langkah === "selesai") {
      layarSelesai();
    } else if (langkah === 1) {
      langkah1();
    } else if (langkah === 2) {
      langkah2();
    } else if (langkah === 3) {
      langkah3();
    } else if (langkah === 4) {
      langkah4();
    } else {
      langkah5();
    }
  }

  // ------------------------------------------------------------
  // Dipanggil kerangka.js
  // ------------------------------------------------------------

  // Tab dibuka atau Segarkan ditekan: muat ulang daftar pelanggan dan menu. Isian yang sedang dikerjakan
  // dipertahankan.
  function tampil() {
    muatPelanggan();
    muatMenu();
    render();
  }

  // Keluar: tidak boleh ada nama, WA, alamat, atau isian order tersisa di layar.
  function reset() {
    nomorKirim++;
    nomorMuatPelanggan++;
    nomorMuatMenu++;
    sedangKirim = false;
    daftarPelanggan = [];
    statusPelanggan = "belum";
    pesanPelanggan = "";
    daftarMenu = [];
    statusMenu = "belum";
    pesanMenu = "";
    mulaiBaru();
    perbaruiDaftar = null;
    kosongkan(panel);
  }

  window.KedaiOrderWakil = Object.freeze({
    tampil: tampil,
    reset: reset,
  });
})();
