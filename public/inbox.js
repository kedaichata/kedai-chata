// public/inbox.js
// INB.05 (giliran 1): layar Kotak masuk dan titik merah di ikon hamburger (inbox.md IB1 sampai IB11).
// Tidak menyentuh kerangka.js (gim.md GM14). Dimuat SETELAH akun.js (memakai window.KedaiAkun) dan gimmenu.js.
//
// Cara kerja (inbox.md 4.1):
//   1. akun.js (giliran 2) memanggil window.KedaiInbox.atur(idAkun, terbaru) tiap balasan `status` selesai.
//      `terbaru` = field `inbox_terbaru` (angka atau null). Titik merah muncul bila terbaru > penanda lokal.
//   2. Kotak masuk diketuk di hamburger: satu panggilan `inbox_daftar` (IB11), daftar digambar memakai penanda LAMA
//      (server sudah mengurutkan: belum dibaca di atas, IB9), baru setelah itu penanda digeser ke item terbaru
//      dan titik merah hilang.
//   3. Keluar: layar ditutup dan semua keadaan di memori dihapus. Yang tersisa di HP hanya angka penanda (IB11).
//
// Aturan yang dijaga:
//   - Nol panggilan server untuk titik merah dan untuk menandai dibaca (IB8, IB10).
//   - Penanda per akun di localStorage, kunci chata_inbox_terakhir_<id akun>. Id akun dari sesi login (UUID), bukan data pribadi.
//   - Isi inbox tidak disimpan di HP (IB11). Semua teks dari server dipasang lewat textContent (SEC-18, SEC-35).
//   - Item hanya teks, tidak bisa diketuk (IB5). Peran dan akun tidak pernah dikirim ke server (SEC-34).
//   - Semua gaya di game.css (kelas gim-), tanpa gaya inline.

(function () {
  "use strict";

  var tombolHamburger = document.getElementById("tombol-hamburger");
  var menu = document.getElementById("gim-menu");
  var itemInbox = document.getElementById("gim-menu-inbox");
  var titik = document.getElementById("gim-titik");
  var layarUtama = document.getElementById("layar-sementara");
  if (!tombolHamburger || !menu || !itemInbox || !titik || !layarUtama) {
    // Bagian index.html belum lengkap: Kotak masuk tidak dipasang, aplikasi lain tetap jalan.
    return;
  }

  var AWALAN_KUNCI = "chata_inbox_terakhir_";
  var REGEX_ID_AKUN = /^[0-9a-fA-F-]{8,64}$/;
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
  var LABEL_MENU = "Menu";
  var LABEL_MENU_BARU = "Menu, ada pesan baru";

  var PESAN_OFFLINE = "Perlu internet untuk membuka Kotak masuk.";
  var PESAN_GAGAL = "Kotak masuk belum bisa dibuka. Coba lagi sebentar lagi.";
  var PESAN_SESI = "Sesi sudah berakhir. Silakan keluar lalu masuk lagi.";
  var PESAN_BELUM_SIAP =
    "Kotak masuk belum siap. Tekan Segarkan, lalu buka lagi.";
  var PESAN_KOSONG = "Belum ada kabar.";

  // Keadaan di memori (dihapus saat Keluar).
  var idAkun = null;
  var terbaruServer = null; // nomor item inbox terbaru dari balasan status (angka atau null)
  var penandaMemori = 0; // cadangan bila localStorage tidak bisa dipakai
  var nomorMuat = 0; // penanda permintaan terakhir, supaya balasan basi diabaikan

  // Unsur layar (dibuat saat pertama dibuka, seperti layar game).
  var layar = null;
  var elTutup = null;
  var elKet = null;
  var elDaftar = null;
  var elUlang = null;

  // ------------------------------------------------------------
  // Penanda lokal (IB8)
  // ------------------------------------------------------------

  function kunciPenanda() {
    return AWALAN_KUNCI + idAkun;
  }

  function bacaPenanda() {
    if (!idAkun) return 0;
    try {
      var nilai = window.localStorage.getItem(kunciPenanda());
      var angka = parseInt(nilai, 10);
      if (isFinite(angka) && angka >= 0) {
        return angka;
      }
      return 0;
    } catch (err) {
      return penandaMemori;
    }
  }

  function simpanPenanda(angka) {
    if (!idAkun) return;
    penandaMemori = angka;
    try {
      window.localStorage.setItem(kunciPenanda(), String(angka));
    } catch (err) {
      // Penyimpanan tidak bisa dipakai: cukup tampilan, data tidak rusak (IB8).
    }
  }

  // ------------------------------------------------------------
  // Titik merah (IB2, IB10)
  // ------------------------------------------------------------

  function perbaruiTitik() {
    var ada =
      typeof terbaruServer === "number" && terbaruServer > bacaPenanda();
    titik.hidden = !ada;
    tombolHamburger.setAttribute(
      "aria-label",
      ada ? LABEL_MENU_BARU : LABEL_MENU,
    );
  }

  // ------------------------------------------------------------
  // Pembantu tampilan
  // ------------------------------------------------------------

  function tutupMenu() {
    menu.hidden = true;
    tombolHamburger.setAttribute("aria-expanded", "false");
  }

  // "2026-11-11 08:33" (teks WIB dari server) -> "11 Nov, 08.33 WIB" (IB5).
  function formatWaktu(teks) {
    var cocok = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(
      typeof teks === "string" ? teks : "",
    );
    if (!cocok) {
      return typeof teks === "string" ? teks : "";
    }
    var bulan = parseInt(cocok[2], 10);
    var hari = parseInt(cocok[3], 10);
    if (bulan < 1 || bulan > 12) {
      return teks;
    }
    return (
      hari + " " + BULAN[bulan - 1] + ", " + cocok[4] + "." + cocok[5] + " WIB"
    );
  }

  function buatElemen(tag, kelas, teks) {
    var e = document.createElement(tag);
    if (kelas) e.className = kelas;
    if (teks !== undefined) e.textContent = teks;
    return e;
  }

  function buatLayar() {
    if (layar) return;
    layar = buatElemen("div", "gim-layar gim-inbox");
    layar.id = "gim-inbox-layar";
    layar.setAttribute("role", "dialog");
    layar.setAttribute("aria-modal", "true");
    layar.setAttribute("aria-labelledby", "gim-inbox-judul");
    layar.hidden = true;

    var isi = buatElemen("div", "gim-isi");

    var atas = buatElemen("div", "gim-atas");
    var judul = buatElemen("h2", "gim-inbox__judul", "Kotak masuk");
    judul.id = "gim-inbox-judul";
    elTutup = buatElemen("button", "gim-ikon", "Tutup");
    elTutup.type = "button";
    atas.appendChild(judul);
    atas.appendChild(elTutup);

    elKet = buatElemen("p", "gim-inbox__ket");
    elKet.setAttribute("role", "status");
    elKet.hidden = true;

    elUlang = buatElemen("button", "gim-tombol gim-tombol--utama", "Coba lagi");
    elUlang.type = "button";
    elUlang.hidden = true;

    elDaftar = buatElemen("ul", "gim-inbox__daftar");

    isi.appendChild(atas);
    isi.appendChild(elKet);
    isi.appendChild(elUlang);
    isi.appendChild(elDaftar);
    layar.appendChild(isi);
    document.body.appendChild(layar);

    elTutup.addEventListener("click", tutup);
    elUlang.addEventListener("click", buka);
  }

  function kosongkanDaftar() {
    if (!elDaftar) return;
    while (elDaftar.firstChild) {
      elDaftar.removeChild(elDaftar.firstChild);
    }
  }

  function tampilKet(teks, denganUlang) {
    elKet.textContent = teks || "";
    elKet.hidden = !teks;
    elUlang.hidden = !denganUlang;
  }

  function gambarButir(b) {
    var li = buatElemen(
      "li",
      "gim-inbox__butir" +
        (b && b.belum === true ? " gim-inbox__butir--baru" : ""),
    );
    if (b && b.belum === true) {
      // Tanda belum dibaca selalu berupa tulisan, tidak hanya warna (DS11).
      li.appendChild(buatElemen("span", "gim-inbox__tanda", "Baru"));
    }
    var teks = typeof b.teks === "string" ? b.teks : "";
    li.appendChild(buatElemen("p", "gim-inbox__teks", teks));

    var meta = [];
    var nomor = b.nomor_order;
    if (typeof nomor === "number" && isFinite(nomor) && nomor > 0) {
      // Nomor tidak diulang bila teksnya sudah menyebutnya.
      if (teks.indexOf("#" + nomor) === -1) {
        meta.push("Order #" + nomor);
      }
    }
    var waktu = formatWaktu(b.waktu);
    if (waktu) meta.push(waktu);
    if (meta.length) {
      li.appendChild(buatElemen("p", "gim-inbox__waktu", meta.join(" · ")));
    }
    return li;
  }

  // ------------------------------------------------------------
  // Buka dan tutup layar
  // ------------------------------------------------------------

  function buka() {
    buatLayar();
    nomorMuat += 1;
    var saya = nomorMuat;
    tutupMenu();
    kosongkanDaftar();
    layar.hidden = false;
    document.body.classList.add("gim-inbox-terbuka");
    elTutup.focus();

    if (!navigator.onLine) {
      tampilKet(PESAN_OFFLINE, true);
      return;
    }
    if (
      !idAkun ||
      !window.KedaiAkun ||
      typeof window.KedaiAkun.panggilKedai !== "function"
    ) {
      tampilKet(PESAN_BELUM_SIAP, false);
      return;
    }

    tampilKet("Memuat...", false);
    var penandaLama = bacaPenanda();

    window.KedaiAkun.panggilKedai("inbox_daftar", { penanda: penandaLama })
      .then(function (h) {
        if (saya !== nomorMuat || layar.hidden) return; // layar sudah ditutup atau diganti
        var d = h ? h.data : null;
        if (
          h &&
          h.status === 200 &&
          d &&
          d.ok === true &&
          Array.isArray(d.butir)
        ) {
          kosongkanDaftar();
          if (d.butir.length === 0) {
            tampilKet(PESAN_KOSONG, false);
          } else {
            tampilKet("", false);
            for (var i = 0; i < d.butir.length; i++) {
              if (d.butir[i] && typeof d.butir[i] === "object") {
                elDaftar.appendChild(gambarButir(d.butir[i]));
              }
            }
            if (typeof d.maks === "number" && d.butir.length >= d.maks) {
              tampilKet("Menampilkan " + d.maks + " kabar terbaru.", false);
            }
          }
          // IB9: penanda digeser SETELAH daftar digambar, jadi pembukaan berikutnya semua sudah dibaca.
          if (typeof d.terbaru === "number" && d.terbaru > penandaLama) {
            simpanPenanda(d.terbaru);
          }
          if (typeof d.terbaru === "number") {
            terbaruServer = d.terbaru;
          }
          perbaruiTitik();
          return;
        }
        if (h && h.status === 401) {
          tampilKet(PESAN_SESI, false);
          return;
        }
        // Pesan dari fungsi kedai sendiri (ok:false + pesan) aman ditampilkan; selain itu pesan umum.
        var pesan =
          d && d.ok === false && typeof d.pesan === "string"
            ? d.pesan
            : PESAN_GAGAL;
        tampilKet(pesan, true);
      })
      .catch(function () {
        if (saya !== nomorMuat || layar.hidden) return;
        tampilKet(navigator.onLine ? PESAN_GAGAL : PESAN_OFFLINE, true);
      });
  }

  function tutup() {
    if (!layar || layar.hidden) return;
    nomorMuat += 1; // balasan yang masih di jalan diabaikan
    layar.hidden = true;
    document.body.classList.remove("gim-inbox-terbuka");
    kosongkanDaftar();
    tampilKet("", false);
    tombolHamburger.focus();
  }

  // Keluar: tutup layar dan hapus semua keadaan di memori. Hanya angka penanda yang tersisa di HP (IB11).
  function reset() {
    nomorMuat += 1;
    nomorTitik += 1; // NTF.07: balasan segarkanTitik yang masih di jalan diabaikan
    if (layar) {
      layar.hidden = true;
      kosongkanDaftar();
      tampilKet("", false);
    }
    document.body.classList.remove("gim-inbox-terbuka");
    tutupMenu();
    idAkun = null;
    terbaruServer = null;
    penandaMemori = 0;
    titik.hidden = true;
    tombolHamburger.setAttribute("aria-label", LABEL_MENU);
  }

  // Dipanggil akun.js tiap balasan `status` selesai (tanpa panggilan server baru, IB10).
  function atur(id, terbaru) {
    var idBaru = typeof id === "string" && REGEX_ID_AKUN.test(id) ? id : null;
    if (idBaru !== idAkun) {
      // Ganti akun di HP yang sama: keadaan akun sebelumnya dibuang.
      penandaMemori = 0;
    }
    idAkun = idBaru;
    terbaruServer =
      typeof terbaru === "number" && isFinite(terbaru) && terbaru >= 0
        ? terbaru
        : null;
    perbaruiTitik();
  }

  // NTF.07: segarkan titik merah tanpa layar memuat. Dipanggil kerangka.js saat push masuk atau saat aplikasi
  // kembali ke layar (sudah dibatasi NT10 di sana). Satu panggilan `status`; yang dipakai hanya `inbox_terbaru`.
  // Gagal, offline, atau akun berganti di tengah jalan: diam saja, titik tetap seperti semula (NT12: Segarkan manual
  // tetap ada). Angka terbaru tidak pernah diturunkan, jadi balasan basi tidak mematikan titik yang sudah benar.
  var nomorTitik = 0; // penanda permintaan terakhir, supaya balasan basi diabaikan

  function segarkanTitik() {
    if (
      !idAkun ||
      !navigator.onLine ||
      !window.KedaiAkun ||
      typeof window.KedaiAkun.panggilKedai !== "function"
    ) {
      return;
    }
    nomorTitik += 1;
    var saya = nomorTitik;
    var idSaya = idAkun;
    window.KedaiAkun.panggilKedai("status")
      .then(function (h) {
        if (saya !== nomorTitik || idSaya !== idAkun) return; // Keluar atau ganti akun di tengah jalan
        var d = h ? h.data : null;
        if (!h || h.status !== 200 || !d || d.ok !== true) return;
        if (typeof d.inbox_terbaru === "number" && isFinite(d.inbox_terbaru)) {
          if (
            typeof terbaruServer !== "number" ||
            d.inbox_terbaru > terbaruServer
          ) {
            terbaruServer = d.inbox_terbaru;
          }
          perbaruiTitik();
        }
      })
      .catch(function () {
        // Diam saja (lihat catatan di atas).
      });
  }

  // ------------------------------------------------------------
  // Pendengar
  // ------------------------------------------------------------

  itemInbox.addEventListener("click", buka);

  // Esc menutup layar Kotak masuk.
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && layar && !layar.hidden) {
      tutup();
    }
  });

  // Keluar (GM14, IB11): tutup layar dan hapus keadaan, lewat dua jalur seperti gimmenu.js.
  var keluarYa = document.getElementById("keluar-ya");
  if (keluarYa) {
    keluarYa.addEventListener("click", reset);
  }

  // Jaring pengaman: layar utama tersembunyi (Keluar, galat, kembali ke Masuk, atau memuat ulang status)
  // berarti pengguna tidak di layar kerja. Layar Kotak masuk ditutup; keadaan akun dibersihkan lewat reset()
  // yang dipanggil akun.js saat Keluar.
  new MutationObserver(function () {
    if (layarUtama.hidden && layar && !layar.hidden) {
      tutup();
    }
  }).observe(layarUtama, { attributes: true, attributeFilter: ["hidden"] });

  // window.KedaiInbox = Object.freeze({
  //   atur: atur,
  //   reset: reset,
  //   buka: buka,
  //   tutup: tutup,
  // });
  // NTF.07: segarkanTitik ditambah (dipanggil kerangka.js).
  window.KedaiInbox = Object.freeze({
    atur: atur,
    reset: reset,
    buka: buka,
    tutup: tutup,
    segarkanTitik: segarkanTitik,
  });
})();
