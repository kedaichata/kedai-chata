// public/pesan.js
// ORD.03: layar customer Pesan (order.md O1 sampai O4, O12, O21 dan bagian 4 "Layar customer").
// Tampil di dalam panel "pesan" (tab Pesan) dengan tiga langkah:
//   1. menu    : daftar menu (menu.js, MNU.04) ditambah kartu ringkasan keranjang dan tombol "Lihat pesanan".
//   2. form    : isi keranjang, tipe, alamat, hari, jam, catatan awal, tombol Kirim.
//   3. selesai : nomor order, total dari server, dan teks pembayaran (O21).
// Dimuat SETELAH akun.js (memakai window.KedaiAkun) dan SEBELUM kerangka.js di index.html.
//
// Pembagian tugas:
// - Berkas ini memegang KERANJANG. Keranjang sengaja tidak disimpan di daftar menu (menu.js), karena daftar
//   menu dimuat ulang setiap tab Pesan dibuka.
// - Tombol "Tambah" di kartu menu dan pilihan menu di sheet detail dipasang di menu.js dan menu-detail.js
//   (giliran berikutnya). Keduanya memanggil window.KedaiPesan.tambah(menu, pilihan, jumlah).
// - kerangka.js memanggil window.KedaiPesan.tampil() saat tab Pesan dibuka dan .reset() saat Keluar.
//
// Aturan yang dijaga:
// - Yang dikirim hanya: aksi, tipe, alamat_id (hanya Diantar), hari ("Hari ini" atau "Besok"), jam (HH:MM),
//   item ({ menu_id, jumlah, opsi_ids }) dan catatan. Aplikasi tidak pernah mengirim harga, total, status,
//   peran, atau metode bayar (AGENTS.md bagian 7). Total di layar hanya PERKIRAAN; angka resmi dari server.
// - "Hari ini" dan "Besok" dihitung server (WIB). Jam HP tidak dipakai. Tanggal di layar Selesai berasal
//   dari server; Date hanya dipakai menebak nama hari dari tanggal itu (UTC), bukan membaca jam HP.
// - Server tidak menahan kirim ganda (order.md Handoff #2). Tombol Kirim dikunci sejak ditekan sampai balasan
//   datang, dan keranjang dikosongkan begitu order berhasil.
// - Batas (jumlah item, jumlah per item, panjang catatan) ada di server dan tidak ditulis mati di sini.
//   Pesan galat dari server ditampilkan apa adanya. Satu-satunya angka di sini adalah bentuk data: jumlah
//   1 sampai 4 digit (aturan fungsi SQL order_buat).
// - Semua teks (nama menu, alamat, pesan) dipasang lewat textContent, bukan innerHTML.
// - Galat mentah tidak ditampilkan. Tidak ada console.log berisi data.
// - Keranjang, alamat, dan hasil order dikosongkan saat Keluar (reset). Alamat adalah data pribadi.

(function () {
  "use strict";

  var A = window.KedaiAkun;
  if (!A) {
    // akun.js belum termuat: window.KedaiPesan tidak dibuat.
    return;
  }

  function el(id) {
    return document.getElementById(id);
  }

  var TEKS_KIRIM = "Kirim pesanan";
  // O21: teks tetap setelah Kirim (dan nanti di detail order Menunggu, ORD.04).
  var TEKS_BAYAR =
    "Pesanan diterima. Perwakilan ChATA akan menghubungi lewat WhatsApp untuk pembayaran. Pesanan diproses setelah pembayaran dikonfirmasi.";
  var PESAN_UMUM = "Pesanan belum bisa dikirim. Coba lagi sebentar lagi.";
  var PESAN_OFFLINE =
    "Belum bisa terhubung. Periksa internet lalu coba lagi. Pesanan belum terkirim.";
  // Jaringan putus SETELAH permintaan terkirim: hasilnya tidak pasti. Kirim ulang bisa membuat order dobel.
  // ORD.04: teks lama (menyuruh hubungi lewat WhatsApp) diganti karena sekarang ada layar Pesanan Saya.
  // var PESAN_TIDAK_PASTI =
  //   "Belum bisa memastikan pesanan sudah terkirim. Jangan kirim ulang dulu: hubungi ChATA lewat WhatsApp untuk memastikan, supaya tidak dobel.";
  var PESAN_TIDAK_PASTI =
    "Belum bisa memastikan pesanan sudah terkirim. Jangan kirim ulang dulu: buka tab Pesanan Saya dan tekan Segarkan untuk melihat apakah pesananmu sudah masuk, supaya tidak dobel.";
  var PESAN_SESI = "Sesi sudah berakhir. Silakan keluar lalu masuk lagi.";
  var PESAN_ALAMAT_MUAT =
    "Daftar alamat belum bisa dimuat. Coba lagi sebentar lagi.";
  var PESAN_ALAMAT_KOSONG =
    "Kamu belum punya alamat antar. Tambahkan dulu di Buku alamat.";

  // Nilai tipe dan hari harus PERSIS seperti ini (fungsi SQL order_buat).
  var TIPE = ["Diantar", "Diambil", "Makan di warung"];
  var HARI = ["Hari ini", "Besok"];
  var LABEL_JAM = {
    Diantar: "Jam antar",
    Diambil: "Jam ambil",
    "Makan di warung": "Jam datang",
  };
  // O2: jam di layar ditulis sebagai permintaan, bukan janji.
  var FRASA_JAM = {
    Diantar: "Minta diantar jam ",
    Diambil: "Minta diambil jam ",
    "Makan di warung": "Makan di warung jam ",
  };
  var REGEX_JAM = /^([01][0-9]|2[0-3]):[0-5][0-9]$/;
  // Aturan ketua 2026-11-08: tipe Diantar terisi jam 11:00 (WIB) otomatis, customer tetap bisa mengubahnya.
  // Diambil dan Makan di warung tetap kosong dan wajib diisi. Hanya nilai awal di layar; server tidak berubah
  // dan tetap menerima jam apa pun yang dikirim (O2). Nilai ini ditulis di kode atas permintaan ketua.
  var JAM_BAWAAN_ANTAR = "11:00";
  var jamOtomatis = false; // true selama isi jam adalah bawaan 11:00 yang belum disentuh customer
  var JUMLAH_MAKS_FORMAT = 9999; // bentuk data (1 sampai 4 digit); batas sebenarnya diputuskan server

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

  // Keranjang: baris { kunci, menuId, nama, harga, jumlah, pilihan: [{ id, teks }] }.
  // Menu sama dengan pilihan berbeda = baris terpisah (order.md, catatan 7 Nov 2026).
  var keranjang = [];
  var langkah = "menu"; // "menu" | "form" | "selesai"

  var alamat = []; // alamat aktif: { id, alias, isi }
  var alamatStatus = "belum"; // "belum" | "memuat" | "siap" | "gagal"
  var pesanAlamat = ""; // pesan saat alamatStatus "gagal"
  var nomorMuatAlamat = 0; // naik tiap muat dan reset; balasan lama diabaikan

  var sedangKirim = false;
  var nomorKirim = 0; // naik tiap kirim dan reset; balasan lama diabaikan
  var hasil = null; // balasan order dari server yang sudah dirapikan
  var tipeHasil = ""; // tipe pada order yang baru dikirim (untuk kalimat jam)
  var balikDariAlamat = false; // true bila customer pergi ke Buku alamat dari layar ini

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

  // Pesan dari fungsi kedai sendiri (ok:false + pesan) aman ditampilkan.
  function pesanServer(h) {
    return h &&
      h.data &&
      h.data.ok === false &&
      typeof h.data.pesan === "string"
      ? h.data.pesan
      : "";
  }

  // Ambil hanya alamat yang bentuknya benar; null bila bukan daftar.
  function bacaAlamat(d) {
    if (!Array.isArray(d)) return null;
    var hasilBaca = [];
    for (var i = 0; i < d.length; i++) {
      var a = d[i];
      if (
        a &&
        typeof a.id === "string" &&
        typeof a.alias === "string" &&
        typeof a.isi === "string"
      ) {
        hasilBaca.push({ id: a.id, alias: a.alias, isi: a.isi });
      }
    }
    return hasilBaca;
  }

  // Tanggal dari server ("YYYY-MM-DD") menjadi "Senin, 9 Nov 2026". Kosong bila bentuknya salah.
  function tanggalIndo(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
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

  // Rapikan balasan order_buat. Field yang hilang atau salah bentuk dibiarkan kosong; order sudah
  // tersimpan bila server membalas ok:true, jadi layar Selesai tetap tampil.
  function bacaHasil(o) {
    var h = { nomor: null, total: null, hari: "", jam: "" };
    if (o && typeof o === "object") {
      if (typeof o.nomor === "number" && isFinite(o.nomor)) h.nomor = o.nomor;
      if (typeof o.total === "number" && isFinite(o.total)) h.total = o.total;
      if (typeof o.hari_target === "string")
        h.hari = tanggalIndo(o.hari_target);
      if (typeof o.jam_permintaan === "string") {
        var jam = o.jam_permintaan.slice(0, 5);
        if (REGEX_JAM.test(jam)) h.jam = jam.replace(":", ".");
      }
    }
    return h;
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

  function jumlahItem() {
    var n = 0;
    for (var i = 0; i < keranjang.length; i++) {
      n += keranjang[i].jumlah;
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

  // Dipanggil menu.js dan menu-detail.js.
  // menu: { id (teks uuid), nama, harga }; pilihan: [{ id (teks uuid opsi), teks ("Nama grup: Nama opsi") }];
  // jumlah: bilangan bulat >= 1 (kosong = 1). Mengembalikan true bila masuk keranjang.
  function tambah(menu, pilihan, jumlah) {
    if (
      !menu ||
      typeof menu.id !== "string" ||
      typeof menu.nama !== "string" ||
      !isFinite(Number(menu.harga))
    ) {
      return false;
    }
    var n = jumlah === undefined ? 1 : jumlah;
    if (typeof n !== "number" || n % 1 !== 0 || n < 1) return false;

    var daftarPilihan = [];
    if (pilihan !== undefined && pilihan !== null) {
      if (!Array.isArray(pilihan)) return false;
      for (var i = 0; i < pilihan.length; i++) {
        var p = pilihan[i];
        if (!p || typeof p.id !== "string" || typeof p.teks !== "string") {
          return false;
        }
        daftarPilihan.push({ id: p.id, teks: p.teks });
      }
    }

    var kunci = kunciBaris(menu.id, daftarPilihan);
    var ada = cariBaris(kunci);
    if (ada) {
      ada.jumlah = Math.min(JUMLAH_MAKS_FORMAT, ada.jumlah + n);
    } else {
      keranjang.push({
        kunci: kunci,
        menuId: menu.id,
        nama: menu.nama,
        harga: Number(menu.harga),
        jumlah: Math.min(JUMLAH_MAKS_FORMAT, n),
        pilihan: daftarPilihan,
      });
    }
    renderSemua();
    return true;
  }

  function ubahJumlah(baris, selisih) {
    if (sedangKirim) return;
    var baru = baris.jumlah + selisih;
    if (baru < 1 || baru > JUMLAH_MAKS_FORMAT) return;
    baris.jumlah = baru;
    renderSemua();
  }

  function hapusBaris(baris) {
    if (sedangKirim) return;
    var i = keranjang.indexOf(baris);
    if (i >= 0) keranjang.splice(i, 1);
    if (langkah === "form" && keranjang.length === 0) {
      // Keranjang habis: kembali ke daftar menu.
      langkah = "menu";
      tampilkanLangkah();
    }
    renderSemua();
  }

  // ------------------------------------------------------------
  // Tampilan
  // ------------------------------------------------------------

  // Tombol pesanan melayang (permintaan ketua 2026-11-08): bulat, berisi emoji keranjang, ikut layar saat
  // customer menggulir, dan duduk tepat di atas navigasi bawah. Dipasang di dalam panel Pesan supaya otomatis
  // hilang saat tab lain dibuka. Tampil hanya di langkah menu dan bila keranjang tidak kosong. Tombol
  // "Lihat pesanan" lama di atas disembunyikan (elemennya tetap ada; teks ringkasan keranjang tetap tampil).
  var tombolMelayang = null;
  var angkaMelayang = null;
  (function pasangMelayang() {
    var panel = el("panel-pesan");
    if (!panel) return;
    tombolMelayang = buat("button", "pesan-melayang");
    tombolMelayang.type = "button";
    tombolMelayang.hidden = true;
    var ikon = buat("span", "pesan-melayang__ikon", "\uD83D\uDED2");
    ikon.setAttribute("aria-hidden", "true");
    tombolMelayang.appendChild(ikon);
    angkaMelayang = buat("span", "pesan-melayang__angka", "0");
    angkaMelayang.setAttribute("aria-hidden", "true");
    tombolMelayang.appendChild(angkaMelayang);
    tombolMelayang.addEventListener("click", function () {
      lihatPesanan();
    });
    panel.appendChild(tombolMelayang);
    var lama = el("pesan-lihat");
    if (lama) lama.hidden = true;
  })();

  function renderMelayang() {
    if (!tombolMelayang) return;
    var n = jumlahItem();
    tombolMelayang.hidden = n === 0 || langkah !== "menu";
    angkaMelayang.textContent = n > 99 ? "99+" : String(n);
    tombolMelayang.setAttribute("aria-label", "Lihat pesanan, " + n + " item");
  }

  function tampilkanLangkah() {
    el("pesan-langkah-menu").hidden = langkah !== "menu";
    el("pesan-langkah-form").hidden = langkah !== "form";
    el("pesan-langkah-selesai").hidden = langkah !== "selesai";
    window.scrollTo(0, 0);
    renderMelayang();
  }

  function renderRingkas() {
    var kartu = el("pesan-ringkas");
    kartu.hidden = keranjang.length === 0;
    el("pesan-ringkas-teks").textContent =
      jumlahItem() + " item, perkiraan " + rupiah(totalPerkiraan()) + ".";
    renderMelayang();
  }

  function buatBarisItem(b) {
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
        sedangKirim || b.jumlah <= 1,
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
        sedangKirim || b.jumlah >= JUMLAH_MAKS_FORMAT,
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
        sedangKirim,
        "Hapus " + b.nama + " dari pesanan",
      ),
    );
    kartu.appendChild(baris);
    return kartu;
  }

  function renderItem() {
    var wadah = el("pesan-item-isi");
    kosongkan(wadah);
    for (var i = 0; i < keranjang.length; i++) {
      wadah.appendChild(buatBarisItem(keranjang[i]));
    }
    el("pesan-total").textContent =
      "Perkiraan total: " + rupiah(totalPerkiraan());
    el("pesan-tambah-menu").disabled = sedangKirim;
  }

  function renderSelesai() {
    var h = hasil;
    if (!h) return;
    el("pesan-selesai-nomor").textContent =
      h.nomor !== null ? "Pesanan #" + h.nomor : "Pesanan terkirim";

    var wadah = el("pesan-selesai-rincian");
    kosongkan(wadah);
    if (h.total !== null) {
      wadah.appendChild(buat("p", "menu-harga", "Total " + rupiah(h.total)));
    }
    if (h.jam !== "" || h.hari !== "") {
      var teks = (FRASA_JAM[tipeHasil] || "Jam ") + (h.jam || "-");
      if (h.hari) teks += ", " + h.hari;
      wadah.appendChild(buat("p", "", teks));
    }
    el("pesan-selesai-bayar").textContent = TEKS_BAYAR;
  }

  function renderSemua() {
    renderRingkas();
    renderItem();
  }

  // ------------------------------------------------------------
  // Alamat antar (hanya tipe Diantar)
  // ------------------------------------------------------------

  function perluAlamat() {
    return el("pesan-tipe").value === "Diantar";
  }

  function renderAlamat() {
    var pilih = el("pesan-alamat");
    var terpilih = pilih.value;
    kosongkan(pilih);

    // Satu alamat saja: langsung terpilih. Lebih dari satu: customer memilih sendiri (hindari salah antar).
    if (alamat.length !== 1) {
      var kosongOpsi = buat(
        "option",
        "",
        alamat.length === 0 ? "Belum ada alamat" : "Pilih alamat",
      );
      kosongOpsi.value = "";
      pilih.appendChild(kosongOpsi);
    }
    var masihAda = false;
    for (var i = 0; i < alamat.length; i++) {
      var o = buat("option", "", alamat[i].alias);
      o.value = alamat[i].id;
      pilih.appendChild(o);
      if (alamat[i].id === terpilih) masihAda = true;
    }
    if (alamat.length === 1) {
      pilih.value = alamat[0].id;
    } else {
      pilih.value = masihAda ? terpilih : "";
    }
    pilih.disabled = alamatStatus === "memuat" || alamat.length === 0;

    var isiTeks = "";
    for (var j = 0; j < alamat.length; j++) {
      if (alamat[j].id === pilih.value) isiTeks = alamat[j].isi;
    }
    var isi = el("pesan-alamat-isi");
    isi.textContent = isiTeks;
    isi.hidden = isiTeks === "";

    var ket = "";
    if (alamatStatus === "memuat") {
      ket = "Memuat alamat...";
    } else if (alamatStatus === "gagal") {
      ket = pesanAlamat;
    } else if (alamatStatus === "siap" && alamat.length === 0) {
      ket = PESAN_ALAMAT_KOSONG;
    }
    var ketEl = el("pesan-alamat-ket");
    ketEl.textContent = ket;
    ketEl.hidden = ket === "";
    el("pesan-alamat-muat").hidden = alamatStatus !== "gagal";
  }

  // Alamat aktif customer diambil dari aksi `status` (sama seperti alamat.js), tanpa aksi baru.
  function muatAlamat() {
    var nomor = ++nomorMuatAlamat;
    alamatStatus = "memuat";
    renderAlamat();
    return A.panggilKedai("status")
      .then(function (h) {
        if (nomor !== nomorMuatAlamat) return;
        if (h.status === 200 && h.data && h.data.ok === true) {
          var baru = bacaAlamat(h.data.alamat);
          if (baru) {
            alamat = baru;
            alamatStatus = "siap";
            renderAlamat();
            return;
          }
        }
        alamatStatus = "gagal";
        pesanAlamat =
          h.status === 401 && !h.data ? PESAN_SESI : PESAN_ALAMAT_MUAT;
        renderAlamat();
      })
      .catch(function () {
        if (nomor !== nomorMuatAlamat) return;
        alamatStatus = "gagal";
        pesanAlamat = navigator.onLine
          ? PESAN_ALAMAT_MUAT
          : "Belum bisa terhubung. Periksa internet lalu coba lagi.";
        renderAlamat();
      });
  }

  // Sesuaikan isian dengan tipe: alamat hanya untuk Diantar, tulisan label jam mengikuti tipe.
  function tampilTipe() {
    var tipe = el("pesan-tipe").value;
    el("isian-pesan-alamat").hidden = tipe !== "Diantar";
    el("pesan-jam-label").textContent = LABEL_JAM[tipe] || "Jam";
  }

  // Jam bawaan per tipe. Diantar: isi 11:00 bila jam masih kosong. Tipe lain: bawaan otomatis dikosongkan;
  // jam yang sudah diketik atau diubah customer tidak pernah ditimpa.
  function aturJamBawaan() {
    var tipe = el("pesan-tipe").value;
    var kolom = el("pesan-jam");
    if (tipe === "Diantar") {
      if (kolom.value === "") {
        kolom.value = JAM_BAWAAN_ANTAR;
        jamOtomatis = true;
      }
    } else if (jamOtomatis) {
      kolom.value = "";
      jamOtomatis = false;
    }
  }

  // ------------------------------------------------------------
  // Form pesanan
  // ------------------------------------------------------------

  function bersihkanGalat() {
    A.galatIsian("isian-pesan-alamat", "");
    A.galatIsian("isian-pesan-jam", "");
    A.galatForm("pesan", "");
  }

  function kosongkanForm() {
    el("pesan-tipe").value = "Diantar";
    el("pesan-hari").value = "Hari ini";
    // el("pesan-jam").value = "";
    el("pesan-jam").value = "";
    jamOtomatis = false;
    el("pesan-catatan").value = "";
    bersihkanGalat();
    tampilTipe();
    aturJamBawaan(); // Diantar (tipe awal): jam terisi 11:00
  }

  function lihatPesanan() {
    if (keranjang.length === 0 || sedangKirim) return;
    langkah = "form";
    bersihkanGalat();
    tampilkanLangkah();
    renderSemua();
    tampilTipe();
    // Alamat dimuat ulang setiap layar pesanan dibuka, supaya perubahan di Buku alamat ikut terbaca.
    alamatStatus = "belum";
    if (perluAlamat()) {
      muatAlamat();
    } else {
      renderAlamat();
    }
  }

  function kembaliKeMenu() {
    if (sedangKirim) return;
    langkah = "menu";
    tampilkanLangkah();
  }

  // Tampilkan balasan galat dari order_buat. Pesan menu berubah: daftar menu dimuat ulang supaya
  // lencana Habis di layar mutakhir. Alamat hilang: daftar alamat dimuat ulang.
  function tampilkanGalatKirim(h) {
    var pesan = pesanServer(h);
    if (h && h.status === 401 && !h.data) {
      A.galatForm("pesan", PESAN_SESI);
      return;
    }
    if (!pesan) {
      A.galatForm("pesan", PESAN_UMUM);
      return;
    }
    A.galatForm("pesan", pesan);
    if (
      (h.status === 404 || h.status === 409) &&
      pesan.indexOf("Muat ulang menu") >= 0
    ) {
      if (
        window.KedaiMenu &&
        typeof window.KedaiMenu.tampilPelanggan === "function"
      ) {
        window.KedaiMenu.tampilPelanggan();
      }
    } else if (h.status === 404 && pesan.indexOf("Alamat") >= 0) {
      muatAlamat();
    }
  }

  function kirim(e) {
    e.preventDefault();
    if (sedangKirim) return;
    bersihkanGalat();

    if (keranjang.length === 0) {
      A.galatForm("pesan", "Pilih minimal satu menu.");
      return;
    }

    var tipe = el("pesan-tipe").value;
    var hari = el("pesan-hari").value;
    var jam = el("pesan-jam").value.trim();
    var catatan = el("pesan-catatan").value.trim();

    var lengkap = true;
    if (TIPE.indexOf(tipe) < 0) {
      A.galatForm("pesan", "Pilih tipe pesanan.");
      lengkap = false;
    }
    if (HARI.indexOf(hari) < 0) {
      A.galatForm("pesan", "Pilih hari.");
      lengkap = false;
    }
    var idAlamat = "";
    if (tipe === "Diantar") {
      idAlamat = el("pesan-alamat").value;
      var dikenal = false;
      for (var a = 0; a < alamat.length; a++) {
        if (alamat[a].id === idAlamat) dikenal = true;
      }
      if (!dikenal) {
        A.galatIsian("isian-pesan-alamat", "Pilih alamat antar.");
        lengkap = false;
      }
    }
    if (!REGEX_JAM.test(jam)) {
      A.galatIsian(
        "isian-pesan-jam",
        "Isi jam dengan lengkap (jam dan menit).",
      );
      lengkap = false;
    }
    if (!lengkap) return;

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
      tipe: tipe,
      hari: hari,
      jam: jam,
      item: item,
      catatan: catatan,
    };
    if (tipe === "Diantar") data.alamat_id = idAlamat;

    // Kunci sebelum permintaan berangkat: dua ketukan cepat tidak boleh jadi dua order.
    sedangKirim = true;
    var nomor = ++nomorKirim;
    var tombol = el("tombol-pesan-kirim");
    A.sibuk(tombol, true, TEKS_KIRIM);
    renderItem();

    A.panggilKedai("order_buat", data)
      .then(function (h) {
        if (nomor !== nomorKirim) return; // sudah Keluar: balasan lama diabaikan
        sedangKirim = false;
        A.sibuk(tombol, false, TEKS_KIRIM);

        if (h.status === 200 && h.data && h.data.ok === true) {
          hasil = bacaHasil(h.data.order);
          tipeHasil = tipe;
          keranjang = [];
          kosongkanForm();
          langkah = "selesai";
          renderSemua();
          renderSelesai();
          tampilkanLangkah();
          return;
        }
        renderItem();
        tampilkanGalatKirim(h);
      })
      .catch(function () {
        if (nomor !== nomorKirim) return;
        sedangKirim = false;
        A.sibuk(tombol, false, TEKS_KIRIM);
        renderItem();
        A.galatForm(
          "pesan",
          navigator.onLine ? PESAN_TIDAK_PASTI : PESAN_OFFLINE,
        );
      });
  }

  function pesanLagi() {
    langkah = "menu";
    hasil = null;
    tampilkanLangkah();
    // Stok bisa berubah sejak pesanan terakhir: muat ulang daftar menu.
    if (
      window.KedaiMenu &&
      typeof window.KedaiMenu.tampilPelanggan === "function"
    ) {
      window.KedaiMenu.tampilPelanggan();
    }
  }

  // ------------------------------------------------------------
  // Dipanggil kerangka.js
  // ------------------------------------------------------------

  // Tab Pesan dibuka: layar "selesai" tidak ditahan, customer kembali ke daftar menu.
  function tampil() {
    if (langkah === "selesai") {
      langkah = "menu";
      hasil = null;
      tampilkanLangkah();
    }
  }

  // Keluar: tidak boleh ada keranjang, alamat, atau hasil order tersisa di layar.
  function reset() {
    nomorMuatAlamat++;
    nomorKirim++;
    sedangKirim = false;
    A.sibuk(el("tombol-pesan-kirim"), false, TEKS_KIRIM);
    keranjang = [];
    alamat = [];
    alamatStatus = "belum";
    pesanAlamat = "";
    hasil = null;
    tipeHasil = "";
    balikDariAlamat = false;
    langkah = "menu";
    kosongkanForm();
    renderAlamat();
    renderSemua();
    el("pesan-selesai-nomor").textContent = "";
    kosongkan(el("pesan-selesai-rincian"));
    el("pesan-selesai-bayar").textContent = "";
    tampilkanLangkah();
  }

  // ------------------------------------------------------------
  // Pendengar
  // ------------------------------------------------------------

  el("pesan-lihat").addEventListener("click", lihatPesanan);
  el("pesan-tambah-menu").addEventListener("click", kembaliKeMenu);
  el("pesan-tipe").addEventListener("change", function () {
    A.galatIsian("isian-pesan-alamat", "");
    tampilTipe();
    aturJamBawaan();
    if (perluAlamat() && alamatStatus === "belum") muatAlamat();
  });
  // Customer mengubah jam sendiri: bukan bawaan lagi, jadi tidak ikut dikosongkan saat ganti tipe.
  el("pesan-jam").addEventListener("input", function () {
    jamOtomatis = false;
  });
  el("pesan-jam").addEventListener("change", function () {
    jamOtomatis = false;
  });
  el("pesan-alamat").addEventListener("change", function () {
    A.galatIsian("isian-pesan-alamat", "");
    renderAlamat();
  });
  el("pesan-alamat-muat").addEventListener("click", function () {
    muatAlamat();
  });
  el("pesan-alamat-buku").addEventListener("click", function () {
    var B = window.KedaiAlamat;
    if (B && typeof B.tampil === "function") {
      balikDariAlamat = true;
      B.tampil();
    }
  });
  el("form-pesan").addEventListener("submit", kirim);
  el("pesan-ulang").addEventListener("click", pesanLagi);

  // Kembali dari Buku alamat (layar utama muncul lagi): muat ulang alamat supaya alamat baru langsung
  // bisa dipilih. Hanya bila customer memang pergi ke Buku alamat dari layar pesanan ini.
  var layarUtama = el("layar-sementara");
  if (layarUtama && typeof MutationObserver === "function") {
    new MutationObserver(function () {
      if (layarUtama.hidden || !balikDariAlamat) return;
      balikDariAlamat = false;
      if (langkah === "form" && !sedangKirim && perluAlamat()) {
        muatAlamat();
      }
    }).observe(layarUtama, { attributes: true, attributeFilter: ["hidden"] });
  }

  // Keadaan awal: tipe Diantar, hari ini, jam kosong (customer wajib mengisi).
  // Aturan ketua 2026-11-08 menggantikan "jam kosong" untuk Diantar: jam terisi 11:00 (kosongkanForm).
  kosongkanForm();
  renderAlamat();
  renderSemua();

  window.KedaiPesan = Object.freeze({
    tambah: tambah, // dipanggil menu.js dan menu-detail.js
    tampil: tampil, // dipanggil kerangka.js saat tab Pesan dibuka
    reset: reset, // dipanggil kerangka.js saat Keluar
    teksBayar: TEKS_BAYAR, // O21, dipakai ulang di Pesanan Saya (ORD.04)
  });
})();
