// public/belanja.js
// BLJ.04: layar Belanja Warung untuk owner (belanja.md BL1 sampai BL16).
// Dibuka dari item "Belanja Warung" di hamburger (tepat di bawah Kotak masuk). Layar penuh sendiri
// (pola inbox.js), tidak menyentuh kerangka.js. Dimuat SETELAH akun.js (memakai window.KedaiAkun) dan inbox.js.
//
// Cakupan BLJ.04: daftar akordeon, rekap "Total belum terkunci", saklar "tampilkan juga yang terkunci",
// tombol Kunci (hanya di catatan milik sendiri). Form input dan edit item adalah BLJ.05 (belum ada di sini).
//
// Aksi `kedai` yang dipakai (Handoff #3):
//   belanja_daftar {terkunci?: boolean} -> {ok, daftar: {rekap: {total, per_owner: [{nama, total}]},
//     catatan: [{id, judul, nama_penginput, milik_saya, dibuat_pada, dikunci_pada, total,
//       item: [{id, nama, harga, dibatalkan, ditambah_pada}]}], terkunci_tampil_maks}}
//   belanja_kunci {id} -> {ok, belanja: {id, dikunci_pada}}
//
// Aturan yang dijaga:
// - Aplikasi hanya MENGGAMBAR. Total, rekap, dan siapa penginput dihitung dan diperiksa server (BL1, BL4, BL7).
//   Tidak ada peran atau total yang dikirim; hanya nama aksi dan id.
// - Item hamburger hanya tampil bila navigasi owner terlihat (kemudahan tampilan; server yang menolak non-owner, BL16).
// - Rekap hanya menjumlah catatan belum terkunci, juga saat saklar menyala (keputusan 18 Nov 2026).
//   Catatan terkunci tampil terpisah, bertanda "Terkunci", dengan total sendiri.
// - Tanpa polling. Data diambil saat layar dibuka, lewat Segarkan, dan setelah Kunci (BL15).
// - Isi tidak disimpan di localStorage atau tempat lain; hanya di memori, dibuang saat Keluar.
// - Semua teks dari server lewat textContent. Galat mentah tidak ditampilkan.
// - Layar yang digambar ulang menjaga posisi gulir dan akordeon yang terbuka.
// - Gaya di belanja.css (kelas blj-).

(function () {
  "use strict";

  var A = window.KedaiAkun;
  var itemMenu = document.getElementById("gim-menu-belanja");
  var menu = document.getElementById("gim-menu");
  var tombolHamburger = document.getElementById("tombol-hamburger");
  var layarUtama = document.getElementById("layar-sementara");
  var navOwner = document.getElementById("nav-owner");
  if (
    !A ||
    !itemMenu ||
    !menu ||
    !tombolHamburger ||
    !layarUtama ||
    !navOwner
  ) {
    // Bagian index.html atau akun.js belum lengkap: Belanja tidak dipasang, aplikasi lain tetap jalan.
    return;
  }

  var PESAN_UMUM = "Belanja belum bisa dimuat. Coba lagi sebentar lagi.";
  var PESAN_OFFLINE =
    "Belum ada internet. Sambungkan internet lalu tekan Coba lagi.";
  var PESAN_SESI = "Sesi sudah berakhir. Silakan keluar lalu masuk lagi.";
  var PESAN_KUNCI_GAGAL =
    "Catatan belum bisa dikunci. Coba lagi sebentar lagi.";
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

  // Keadaan di memori (dibuang saat Keluar).
  var data = null; // balasan daftar terakhir
  var tampilTerkunci = false; // saklar
  var terbuka = {}; // id catatan yang akordeonnya terbuka
  var nomorMuat = 0; // penanda permintaan terbaru; balasan lama diabaikan
  var sedangMuat = false;
  var idKunci = null; // catatan yang sedang akan dikunci
  var sedangKunci = false;

  // Unsur layar (dibuat saat pertama dibuka).
  var layar = null;
  var elIsi = null;
  var elSegar = null;
  var dlg = null;
  var dlgJudul = null;
  var dlgGalat = null;
  var dlgYa = null;
  var dlgBatal = null;

  function buat(tag, kelas, teks) {
    var e = document.createElement(tag);
    if (kelas) e.className = kelas;
    if (teks !== undefined) e.textContent = teks;
    return e;
  }

  function kosongkan(e) {
    while (e.firstChild) e.removeChild(e.firstChild);
  }

  function angka(v) {
    var n = Number(v);
    return isFinite(n) ? n : 0;
  }

  // "Rp 1.250.000"
  function rupiah(n) {
    var s = String(Math.round(angka(n)));
    return "Rp " + s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  // "2026-11-18..." -> "18 Nov"; bentuk lain: kosong
  function teksTanggal(t) {
    var c = /^(\d{4})-(\d{2})-(\d{2})/.exec(typeof t === "string" ? t : "");
    if (!c) return "";
    var b = parseInt(c[2], 10);
    var h = parseInt(c[3], 10);
    if (b < 1 || b > 12 || h < 1 || h > 31) return "";
    return h + " " + BULAN[b - 1];
  }

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

  // ------------------------------------------------------------
  // Item hamburger: hanya tampil untuk owner
  // ------------------------------------------------------------

  function aturItemMenu() {
    itemMenu.hidden = navOwner.hidden;
  }

  // ------------------------------------------------------------
  // Kerangka layar
  // ------------------------------------------------------------

  function buatLayar() {
    if (layar) return;
    layar = buat("div", "blj-layar");
    layar.id = "blj-layar";
    layar.setAttribute("role", "dialog");
    layar.setAttribute("aria-modal", "true");
    layar.setAttribute("aria-labelledby", "blj-judul");
    layar.hidden = true;

    // Bilah atas: tulisan jelas, bukan ikon saja (ibu-ibu tidak perlu menebak).
    var bilah = buat("div", "blj-bilah");
    var kembali = buat("button", "tombol tombol--sekunder blj-bilah__tombol");
    kembali.type = "button";
    kembali.textContent = "Kembali";
    elSegar = buat("button", "tombol tombol--sekunder blj-bilah__tombol");
    elSegar.type = "button";
    elSegar.textContent = "Segarkan";
    bilah.appendChild(kembali);
    bilah.appendChild(elSegar);

    var isi = buat("div", "blj-badan");
    var judul = buat("h1", "blj-judul", "Belanja Warung");
    judul.id = "blj-judul";
    elIsi = buat("div", "blj-isi");
    isi.appendChild(judul);
    isi.appendChild(elIsi);

    layar.appendChild(bilah);
    layar.appendChild(isi);
    layar.appendChild(buatDialog());
    document.body.appendChild(layar);

    kembali.addEventListener("click", tutup);
    elSegar.addEventListener("click", muatBila);
  }

  // Dialog konfirmasi Kunci. Teks tetap. Batal = tombol utama, Kunci = berpinggir merah (DS12).
  function buatDialog() {
    dlg = buat("div", "blj-dialog");
    dlg.hidden = true;
    var latar = buat("div", "blj-dialog__latar");
    var kotak = buat("div", "blj-dialog__kotak");
    kotak.setAttribute("role", "alertdialog");
    dlgJudul = buat("h2", "blj-dialog__judul", "Kunci catatan ini?");
    var isi1 = buat(
      "p",
      "blj-dialog__isi",
      "Kunci artinya: sudah dibahas bareng, jangan dihitung lagi.",
    );
    var isi2 = buat(
      "p",
      "blj-dialog__isi",
      "Setelah dikunci, catatan tidak bisa diubah lagi dan tidak bisa dibuka dari aplikasi. Jangan dikunci kalau belanjanya belum selesai dicatat.",
    );
    dlgGalat = buat("p", "isian__galat");
    dlgGalat.setAttribute("role", "alert");
    dlgGalat.hidden = true;
    var baris = buat("div", "baris-tombol");
    dlgBatal = buat("button", "tombol tombol--utama", "Batal");
    dlgBatal.type = "button";
    dlgYa = buat("button", "tombol tombol--bahaya", "Ya, kunci");
    dlgYa.type = "button";
    baris.appendChild(dlgBatal);
    baris.appendChild(dlgYa);
    kotak.appendChild(dlgJudul);
    kotak.appendChild(isi1);
    kotak.appendChild(isi2);
    kotak.appendChild(dlgGalat);
    kotak.appendChild(baris);
    dlg.appendChild(latar);
    dlg.appendChild(kotak);

    latar.addEventListener("click", tutupDialog);
    dlgBatal.addEventListener("click", tutupDialog);
    dlgYa.addEventListener("click", kunciSekarang);
    return dlg;
  }

  function bukaDialog(id) {
    idKunci = id;
    dlgGalat.hidden = true;
    dlgGalat.textContent = "";
    dlgYa.disabled = false;
    dlg.hidden = false;
    dlgBatal.focus();
  }

  function tutupDialog() {
    if (sedangKunci) return;
    idKunci = null;
    dlg.hidden = true;
  }

  // ------------------------------------------------------------
  // Keadaan khusus (DS13): memuat, kosong, galat, offline
  // ------------------------------------------------------------

  function keadaan(judul, ket, denganUlang, galat) {
    var k = buat("div", galat ? "keadaan keadaan--galat" : "keadaan");
    k.setAttribute("role", galat ? "alert" : "status");
    k.appendChild(buat("p", "keadaan__judul", judul));
    if (ket) k.appendChild(buat("p", "keadaan__ket", ket));
    if (denganUlang) {
      var t = buat("button", "tombol tombol--utama", "Coba lagi");
      t.type = "button";
      t.addEventListener("click", muatBila);
      k.appendChild(t);
    }
    return k;
  }

  function tampilMemuat() {
    kosongkan(elIsi);
    var k = buat("div", "keadaan");
    k.setAttribute("role", "status");
    var putar = buat("div", "putaran");
    putar.setAttribute("aria-hidden", "true");
    k.appendChild(putar);
    k.appendChild(buat("p", "keadaan__judul", "Sedang memuat..."));
    elIsi.appendChild(k);
  }

  function tampilKeadaan(judul, ket, denganUlang, galat) {
    kosongkan(elIsi);
    elIsi.appendChild(keadaan(judul, ket, denganUlang, galat));
  }

  // ------------------------------------------------------------
  // Gambar isi
  // ------------------------------------------------------------

  // Rekap: satu angka besar berlabel jelas, lalu rincian per owner.
  function gambarRekap(rekap) {
    var k = buat("div", "kartu blj-rekap");
    k.appendChild(buat("p", "blj-rekap__label", "Total belum terkunci"));
    k.appendChild(buat("p", "blj-rekap__total", rupiah(rekap.total)));
    var per = Array.isArray(rekap.per_owner) ? rekap.per_owner : [];
    if (per.length) {
      k.appendChild(buat("p", "blj-rekap__sub", "Belanja per orang"));
      var ul = buat("ul", "blj-rekap__daftar");
      for (var i = 0; i < per.length; i++) {
        var p = per[i] && typeof per[i] === "object" ? per[i] : {};
        var li = buat("li", "blj-rekap__baris");
        li.appendChild(
          buat(
            "span",
            "blj-rekap__nama",
            typeof p.nama === "string" ? p.nama : "",
          ),
        );
        li.appendChild(buat("span", "blj-rekap__nilai", rupiah(p.total)));
        ul.appendChild(li);
      }
      k.appendChild(ul);
    }
    return k;
  }

  function gambarSaklar(maks) {
    var bungkus = buat("label", "kartu blj-saklar");
    var cek = buat("input", "blj-saklar__cek");
    cek.type = "checkbox";
    cek.checked = tampilTerkunci;
    var teks = buat(
      "span",
      "blj-saklar__teks",
      "Tampilkan juga catatan yang sudah dikunci" +
        (angka(maks) > 0 ? " (" + angka(maks) + " terbaru)" : ""),
    );
    bungkus.appendChild(cek);
    bungkus.appendChild(teks);
    cek.addEventListener("change", function () {
      tampilTerkunci = cek.checked;
      muat();
    });
    return bungkus;
  }

  function gambarItem(it) {
    var batal = it && it.dibatalkan === true;
    var li = buat("li", "blj-item" + (batal ? " blj-item--batal" : ""));
    var kiri = buat("span", "blj-item__nama", it && it.nama ? it.nama : "");
    li.appendChild(kiri);
    if (batal) {
      li.appendChild(buat("span", "blj-item__tanda", "Dibatalkan"));
    }
    li.appendChild(buat("span", "blj-item__harga", rupiah(it && it.harga)));
    return li;
  }

  // Satu catatan = satu baris yang diketuk membuka daftar item (BL13).
  function gambarCatatan(c) {
    var terkunci = !!c.dikunci_pada;
    var id = typeof c.id === "string" ? c.id : "";
    var buka = terbuka[id] === true;
    var item = Array.isArray(c.item) ? c.item : [];
    var jumlah = 0;
    for (var i = 0; i < item.length; i++) {
      if (item[i] && item[i].dibatalkan !== true) jumlah++;
    }

    var kartu = buat(
      "div",
      "kartu blj-catatan" + (terkunci ? " blj-catatan--kunci" : ""),
    );

    var kepala = buat("button", "blj-kepala");
    kepala.type = "button";
    kepala.setAttribute("aria-expanded", buka ? "true" : "false");

    var kiri = buat("span", "blj-kepala__kiri");
    kiri.appendChild(
      buat(
        "span",
        "blj-kepala__judul",
        typeof c.judul === "string" ? c.judul : "",
      ),
    );
    var meta = [];
    if (c.milik_saya === true) {
      meta.push("Catatan kamu");
    } else if (typeof c.nama_penginput === "string" && c.nama_penginput) {
      meta.push("oleh " + c.nama_penginput);
    }
    var tgl = teksTanggal(c.dibuat_pada);
    if (tgl) meta.push(tgl);
    meta.push(jumlah + " item");
    kiri.appendChild(buat("span", "blj-kepala__meta", meta.join(", ")));
    if (terkunci) {
      kiri.appendChild(
        buat(
          "span",
          "blj-kepala__kunci",
          "Terkunci, tidak ikut dijumlah di atas",
        ),
      );
    }

    var kanan = buat("span", "blj-kepala__kanan");
    kanan.appendChild(buat("span", "blj-kepala__total", rupiah(c.total)));
    var panah = buat("span", "blj-kepala__panah", "\u203A");
    panah.setAttribute("aria-hidden", "true");
    kanan.appendChild(panah);

    kepala.appendChild(kiri);
    kepala.appendChild(kanan);
    kartu.appendChild(kepala);

    var badan = buat("div", "blj-badan-catatan");
    badan.hidden = !buka;
    if (buka) kartu.classList.add("blj-catatan--buka");

    if (item.length === 0) {
      badan.appendChild(buat("p", "isian__bantuan", "Belum ada item."));
    } else {
      var ul = buat("ul", "blj-item-daftar");
      for (var j = 0; j < item.length; j++) {
        if (item[j] && typeof item[j] === "object") {
          ul.appendChild(gambarItem(item[j]));
        }
      }
      badan.appendChild(ul);
    }

    // Tombol Kunci hanya di catatan milik sendiri yang belum terkunci (BL7, BL9). Server tetap yang memutuskan.
    if (c.milik_saya === true && !terkunci && id) {
      var baris = buat("div", "baris-tombol");
      var tk = buat("button", "tombol tombol--sekunder", "Kunci catatan ini");
      tk.type = "button";
      tk.addEventListener("click", function () {
        bukaDialog(id);
      });
      baris.appendChild(tk);
      badan.appendChild(baris);
    }
    kartu.appendChild(badan);

    kepala.addEventListener("click", function () {
      var jadiBuka = badan.hidden;
      badan.hidden = !jadiBuka;
      kepala.setAttribute("aria-expanded", jadiBuka ? "true" : "false");
      kartu.classList.toggle("blj-catatan--buka", jadiBuka);
      if (jadiBuka) {
        terbuka[id] = true;
      } else {
        delete terbuka[id];
      }
    });
    return kartu;
  }

  function gambarBagian(judul, daftar, kosongTeks) {
    var b = buat("section", "blj-bagian");
    b.appendChild(buat("h2", "blj-bagian__judul", judul));
    if (!daftar.length) {
      b.appendChild(buat("p", "isian__bantuan", kosongTeks));
      return b;
    }
    for (var i = 0; i < daftar.length; i++) {
      b.appendChild(gambarCatatan(daftar[i]));
    }
    return b;
  }

  // Susun layar dari satu balasan; posisi gulir dijaga supaya layar tidak loncat ke atas.
  function gambar(d) {
    var gulir = layar.scrollTop;
    kosongkan(elIsi);

    var semua = Array.isArray(d.catatan) ? d.catatan : [];
    var belum = [];
    var kunci = [];
    for (var i = 0; i < semua.length; i++) {
      var c = semua[i];
      if (!c || typeof c !== "object") continue;
      if (c.dikunci_pada) {
        kunci.push(c);
      } else {
        belum.push(c);
      }
    }

    var rekap = d.rekap && typeof d.rekap === "object" ? d.rekap : { total: 0 };
    elIsi.appendChild(gambarRekap(rekap));
    elIsi.appendChild(gambarSaklar(d.terkunci_tampil_maks));
    elIsi.appendChild(
      gambarBagian(
        "Belum terkunci",
        belum,
        "Belum ada catatan belanja yang belum terkunci.",
      ),
    );
    if (tampilTerkunci) {
      elIsi.appendChild(
        gambarBagian("Sudah dikunci", kunci, "Belum ada catatan yang dikunci."),
      );
    }
    layar.scrollTop = gulir;
  }

  // ------------------------------------------------------------
  // Pemuatan
  // ------------------------------------------------------------

  function mulaiMuat(denganLayarMemuat) {
    var nomor = ++nomorMuat;
    if (!navigator.onLine) {
      sedangMuat = false;
      tampilKeadaan("Tidak ada internet", PESAN_OFFLINE, true, false);
      return;
    }
    sedangMuat = true;
    if (denganLayarMemuat) tampilMemuat();
    A.panggilKedai("belanja_daftar", { terkunci: tampilTerkunci })
      .then(function (h) {
        if (nomor !== nomorMuat) return; // sudah Keluar atau ada permintaan lebih baru
        sedangMuat = false;
        if (
          h &&
          h.status === 200 &&
          h.data &&
          h.data.ok === true &&
          h.data.daftar &&
          typeof h.data.daftar === "object"
        ) {
          data = h.data.daftar;
          gambar(data);
          return;
        }
        if (h && h.status === 401) {
          tampilKeadaan("Ada masalah", PESAN_SESI, false, true);
          return;
        }
        tampilKeadaan("Ada masalah", pesanServer(h) || PESAN_UMUM, true, true);
      })
      .catch(function () {
        if (nomor !== nomorMuat) return;
        sedangMuat = false;
        if (!navigator.onLine) {
          tampilKeadaan("Tidak ada internet", PESAN_OFFLINE, true, false);
        } else {
          tampilKeadaan("Ada masalah", PESAN_UMUM, true, true);
        }
      });
  }

  // Muat pertama atau setelah saklar: tampilkan keadaan memuat bila belum ada isi.
  function muat() {
    mulaiMuat(true);
  }

  // Segarkan dan Coba lagi: tidak menumpuk permintaan.
  function muatBila() {
    if (sedangMuat) return;
    mulaiMuat(!data);
  }

  // ------------------------------------------------------------
  // Kunci
  // ------------------------------------------------------------

  function kunciSekarang() {
    if (!idKunci || sedangKunci) return;
    var id = idKunci;
    sedangKunci = true;
    dlgYa.disabled = true;
    dlgYa.textContent = "Mengunci...";
    dlgGalat.hidden = true;
    A.panggilKedai("belanja_kunci", { id: id })
      .then(function (h) {
        sedangKunci = false;
        dlgYa.textContent = "Ya, kunci";
        if (h && h.status === 200 && h.data && h.data.ok === true) {
          delete terbuka[id];
          idKunci = null;
          dlg.hidden = true;
          mulaiMuat(false); // gambar ulang menjaga posisi gulir
          return;
        }
        dlgYa.disabled = false;
        dlgGalat.textContent =
          h && h.status === 401
            ? PESAN_SESI
            : pesanServer(h) || PESAN_KUNCI_GAGAL;
        dlgGalat.hidden = false;
      })
      .catch(function () {
        sedangKunci = false;
        dlgYa.disabled = false;
        dlgYa.textContent = "Ya, kunci";
        dlgGalat.textContent = navigator.onLine
          ? PESAN_KUNCI_GAGAL
          : PESAN_OFFLINE;
        dlgGalat.hidden = false;
      });
  }

  // ------------------------------------------------------------
  // Buka, tutup, Keluar
  // ------------------------------------------------------------

  function tutupMenu() {
    menu.hidden = true;
    tombolHamburger.setAttribute("aria-expanded", "false");
  }

  function buka() {
    buatLayar();
    tutupMenu();
    layar.hidden = false;
    layar.scrollTop = 0;
    document.body.classList.add("blj-terbuka");
    muat();
  }

  function tutup() {
    if (!layar || layar.hidden) return;
    nomorMuat++; // balasan yang masih di jalan diabaikan
    sedangMuat = false;
    layar.hidden = true;
    dlg.hidden = true;
    idKunci = null;
    document.body.classList.remove("blj-terbuka");
    tombolHamburger.focus();
  }

  // Keluar: angka belanja tidak boleh tersisa (HP dipakai bergantian).
  function reset() {
    nomorMuat++;
    sedangMuat = false;
    sedangKunci = false;
    data = null;
    tampilTerkunci = false;
    terbuka = {};
    idKunci = null;
    if (layar) {
      layar.hidden = true;
      dlg.hidden = true;
      kosongkan(elIsi);
    }
    document.body.classList.remove("blj-terbuka");
    aturItemMenu();
  }

  itemMenu.addEventListener("click", buka);

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || !layar || layar.hidden) return;
    if (!dlg.hidden) {
      tutupDialog();
    } else {
      tutup();
    }
  });

  // Keluar lewat tombol konfirmasi, dan jaring pengaman bila layar utama tersembunyi.
  var keluarYa = document.getElementById("keluar-ya");
  if (keluarYa) keluarYa.addEventListener("click", reset);

  new MutationObserver(function () {
    if (layarUtama.hidden) reset();
  }).observe(layarUtama, { attributes: true, attributeFilter: ["hidden"] });

  // Item menu mengikuti peran: kerangka.js menampilkan #nav-owner hanya untuk owner.
  new MutationObserver(function () {
    aturItemMenu();
    if (navOwner.hidden) reset(); // peran berubah atau Keluar: tutup dan bersihkan
  }).observe(navOwner, { attributes: true, attributeFilter: ["hidden"] });
  aturItemMenu();

  window.KedaiBelanja = Object.freeze({
    buka: buka,
    tutup: tutup,
    reset: reset,
  });
})();
