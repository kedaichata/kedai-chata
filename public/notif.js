// public/notif.js
// NTF.05 (giliran 1): tombol "Aktifkan notifikasi" di Home, di bawah Bantuan (notifikasi.md NT6, NT5; Handoff #3).
// Dimuat SETELAH akun.js (memakai window.KedaiAkun) dan inbox.js. Tidak menyentuh kerangka.js.
//
// Cara kerja:
//   1. Tombol tampil bila: peramban mendukung push, kunci publik VAPID ada di config.js, izin notifikasi belum
//      "denied", dan HP ini belum ditandai aktif. Setelah aktif, tombol HILANG (bukan berubah jadi "Matikan").
//   2. Tombol ditekan: pop-up izin peramban baru muncul di sini (NT6, tidak pernah mendadak). Bila diizinkan,
//      peramban berlangganan push (pushManager.subscribe), lalu aksi `push_daftar` dipanggil dengan
//      { endpoint, p256dh, auth } (kontrak Handoff #3). Akun dibaca server dari token login, bukan dikirim.
//   3. Penanda "sudah aktif" di localStorage (kunci chata_notif_aktif, nilai "1") hanya penanda tampilan, tanpa
//      data pribadi dan tanpa endpoint. Dihapus saat Keluar.
//   4. window.KedaiNotif.nonaktifkan() disiapkan untuk akun.js (giliran 2): memanggil `push_nonaktifkan` untuk
//      HP ini sebelum sesi ditutup. Kegagalannya tidak pernah menahan Keluar (batas waktu 3 detik).
//
// Aturan yang dijaga:
//   - Tanpa polling dan tanpa timer berulang (NT3). Tidak ada panggilan server kecuali saat tombol ditekan
//     (push_daftar) dan saat Keluar (push_nonaktifkan).
//   - Kunci privat VAPID tidak ada di sini. Hanya kunci publik dari config.js.
//   - Peran dan akun tidak pernah dikirim. Pesan dari server dipasang lewat textContent. Galat mentah tidak tampil.
//   - Tanpa console.log berisi data. Semua gaya memakai kelas yang sudah ada di style.css (tanpa kelas baru).
//   - Langganan tidak dihapus dari peramban saat Keluar (dipakai ulang oleh akun berikutnya); yang dimatikan
//     adalah barisnya di server (NT5, tanpa DELETE).

(function () {
  "use strict";

  var A = window.KedaiAkun;
  if (!A) {
    // akun.js belum termuat: window.KedaiNotif tidak dibuat.
    return;
  }

  function el(id) {
    return document.getElementById(id);
  }

  var bungkus = el("home-notif-bungkus");
  var tombol = el("home-notif");
  var info = el("home-notif-info");
  var galat = el("home-notif-galat");
  var layarUtama = el("layar-sementara");
  if (!bungkus || !tombol || !info || !galat || !layarUtama) {
    // Bagian index.html belum lengkap: tombol tidak dipasang, aplikasi lain tetap jalan.
    return;
  }

  var KONFIG = window.KEDAI_CONFIG || {};
  var KUNCI_PUBLIK =
    typeof KONFIG.VAPID_PUBLIC_KEY === "string" ? KONFIG.VAPID_PUBLIC_KEY : "";
  var REGEX_KUNCI = /^[A-Za-z0-9_-]{80,100}$/;
  var KUNCI_PENANDA = "chata_notif_aktif";
  var BATAS_NONAKTIF_MS = 3000;

  var TEKS_TOMBOL = "Aktifkan notifikasi";
  var PESAN_AKTIF = "Notifikasi sudah aktif di HP ini.";
  var PESAN_BLOKIR =
    "Notifikasi diblokir di HP ini. Izinkan lewat pengaturan peramban, lalu muat ulang aplikasi.";
  var PESAN_BELUM_IZIN =
    "Izin belum diberikan. Tekan tombol lagi bila ingin mengaktifkan.";
  var PESAN_OFFLINE = "Belum bisa terhubung. Periksa internet lalu coba lagi.";
  var PESAN_UMUM = "Notifikasi belum bisa diaktifkan. Coba lagi sebentar lagi.";
  var PESAN_SESI = "Sesi sudah berakhir. Silakan keluar lalu masuk lagi.";
  var PESAN_BELUM_LENGKAP = "Aplikasi belum lengkap. Muat ulang halaman.";

  var sedangProses = false;
  var nomorProses = 0; // naik tiap proses dan reset; balasan lama diabaikan

  // ------------------------------------------------------------
  // Pembantu
  // ------------------------------------------------------------

  function didukung() {
    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  function kunciSah() {
    return REGEX_KUNCI.test(KUNCI_PUBLIK);
  }

  function bacaPenanda() {
    try {
      return window.localStorage.getItem(KUNCI_PENANDA) === "1";
    } catch (err) {
      return false;
    }
  }

  function simpanPenanda() {
    try {
      window.localStorage.setItem(KUNCI_PENANDA, "1");
    } catch (err) {
      // Penyimpanan tidak bisa dipakai: tombol mungkin tampil lagi, data tidak rusak.
    }
  }

  function hapusPenanda() {
    try {
      window.localStorage.removeItem(KUNCI_PENANDA);
    } catch (err) {
      // Diabaikan.
    }
  }

  // Kunci publik base64url -> Uint8Array (syarat applicationServerKey).
  function kunciKeBiner(teks) {
    var isi = teks.replace(/-/g, "+").replace(/_/g, "/");
    while (isi.length % 4 !== 0) {
      isi += "=";
    }
    var mentah = window.atob(isi);
    var hasil = new Uint8Array(mentah.length);
    for (var i = 0; i < mentah.length; i++) {
      hasil[i] = mentah.charCodeAt(i);
    }
    return hasil;
  }

  function tampilInfo(teks) {
    info.textContent = teks || "";
    info.hidden = !teks;
  }

  function tampilGalat(teks) {
    galat.textContent = teks || "";
    galat.hidden = !teks;
  }

  function bersihkanPesan() {
    tampilInfo("");
    tampilGalat("");
  }

  // Pesan dari fungsi kedai sendiri (ok:false + pesan) aman ditampilkan; selain itu pesan umum.
  function pesanServer(h) {
    return h &&
      h.data &&
      h.data.ok === false &&
      typeof h.data.pesan === "string"
      ? h.data.pesan
      : "";
  }

  // ------------------------------------------------------------
  // Tampil atau sembunyikan tombol
  // ------------------------------------------------------------

  function izinSaatIni() {
    try {
      return window.Notification.permission;
    } catch (err) {
      return "denied";
    }
  }

  function segarkan() {
    var tampil =
      !layarUtama.hidden &&
      didukung() &&
      kunciSah() &&
      izinSaatIni() !== "denied" &&
      !bacaPenanda();
    bungkus.hidden = !tampil;
  }

  // ------------------------------------------------------------
  // Aktifkan
  // ------------------------------------------------------------

  // Hasil: { jenis: "ok" | "blokir" | "belum" | "gagal", pesan }
  function mintaIzinLaluDaftar() {
    return Promise.resolve(window.Notification.requestPermission()).then(
      function (izin) {
        if (izin === "denied") return { jenis: "blokir" };
        if (izin !== "granted") return { jenis: "belum" };

        return navigator.serviceWorker.ready.then(function (reg) {
          return reg.pushManager
            .getSubscription()
            .then(function (ada) {
              return (
                ada ||
                reg.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: kunciKeBiner(KUNCI_PUBLIK),
                })
              );
            })
            .then(function (langganan) {
              var json = langganan.toJSON();
              var kunci = json && json.keys ? json.keys : {};
              if (
                !json ||
                typeof json.endpoint !== "string" ||
                typeof kunci.p256dh !== "string" ||
                typeof kunci.auth !== "string"
              ) {
                return { jenis: "gagal", pesan: PESAN_UMUM };
              }
              return A.panggilKedai("push_daftar", {
                endpoint: json.endpoint,
                p256dh: kunci.p256dh,
                auth: kunci.auth,
              }).then(function (h) {
                if (h && h.status === 200 && h.data && h.data.ok === true) {
                  return { jenis: "ok" };
                }
                if (h && h.status === 401 && !h.data) {
                  return { jenis: "gagal", pesan: PESAN_SESI };
                }
                return {
                  jenis: "gagal",
                  pesan: pesanServer(h) || PESAN_UMUM,
                };
              });
            });
        });
      },
    );
  }

  function aktifkan() {
    if (sedangProses) return;
    bersihkanPesan();

    if (!didukung() || !kunciSah()) {
      tampilGalat(PESAN_BELUM_LENGKAP);
      return;
    }
    if (!navigator.onLine) {
      tampilGalat(PESAN_OFFLINE);
      return;
    }

    // Kunci sebelum pop-up izin muncul: dua ketukan cepat tidak boleh jadi dua proses.
    sedangProses = true;
    var nomor = ++nomorProses;
    A.sibuk(tombol, true, TEKS_TOMBOL);

    mintaIzinLaluDaftar()
      .then(function (r) {
        if (nomor !== nomorProses) return; // sudah Keluar: balasan lama diabaikan
        sedangProses = false;
        A.sibuk(tombol, false, TEKS_TOMBOL);

        if (r.jenis === "ok") {
          simpanPenanda();
          segarkan();
          tampilInfo(PESAN_AKTIF);
        } else if (r.jenis === "blokir") {
          segarkan(); // izin "denied": tombol hilang
          tampilInfo(PESAN_BLOKIR);
        } else if (r.jenis === "belum") {
          tampilInfo(PESAN_BELUM_IZIN);
        } else {
          tampilGalat(r.pesan || PESAN_UMUM);
        }
      })
      .catch(function () {
        if (nomor !== nomorProses) return;
        sedangProses = false;
        A.sibuk(tombol, false, TEKS_TOMBOL);
        tampilGalat(navigator.onLine ? PESAN_UMUM : PESAN_OFFLINE);
      });
  }

  // ------------------------------------------------------------
  // Nonaktifkan (dipanggil akun.js saat Keluar, giliran 2) dan reset
  // ------------------------------------------------------------

  // Mematikan baris langganan HP ini di server. Harus dipanggil SEBELUM sesi login ditutup
  // (butuh token). Selalu selesai (tidak pernah menolak) dan paling lama sekitar 3 detik,
  // jadi tidak pernah menahan Keluar. Langganan di peramban dibiarkan.
  function nonaktifkan() {
    hapusPenanda();
    if (!didukung()) return Promise.resolve();

    var kerja = navigator.serviceWorker.ready
      .then(function (reg) {
        return reg.pushManager.getSubscription();
      })
      .then(function (langganan) {
        if (!langganan || !navigator.onLine) return;
        return A.panggilKedai("push_nonaktifkan", {
          endpoint: langganan.endpoint,
        });
      })
      .then(
        function () {},
        function () {},
      );

    var batas = new Promise(function (selesai) {
      setTimeout(selesai, BATAS_NONAKTIF_MS);
    });
    return Promise.race([kerja, batas]);
  }

  // Keluar: tombol dan pesan dibersihkan, proses yang masih jalan diabaikan.
  function reset() {
    nomorProses++;
    sedangProses = false;
    A.sibuk(tombol, false, TEKS_TOMBOL);
    bersihkanPesan();
    bungkus.hidden = true;
    hapusPenanda();
  }

  // ------------------------------------------------------------
  // Pendengar
  // ------------------------------------------------------------

  tombol.addEventListener("click", aktifkan);

  // Layar utama muncul atau tersembunyi (masuk, Segarkan, Keluar): atur tombol. Pesan hasil ikut dibersihkan
  // saat layar tersembunyi. Hanya membaca keadaan di HP, tanpa panggilan server.
  new MutationObserver(function () {
    if (layarUtama.hidden) {
      bersihkanPesan();
    }
    segarkan();
  }).observe(layarUtama, { attributes: true, attributeFilter: ["hidden"] });

  // Kembali ke layar: izin bisa berubah lewat pengaturan peramban. Hanya cek lokal.
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) segarkan();
  });

  // Keluar lewat kotak konfirmasi (pola sama dengan inbox.js). Jalur Keluar lain dicakup akun.js (giliran 2).
  var keluarYa = el("keluar-ya");
  if (keluarYa) {
    keluarYa.addEventListener("click", reset);
  }

  segarkan();

  window.KedaiNotif = Object.freeze({
    nonaktifkan: nonaktifkan,
    reset: reset,
    segarkan: segarkan,
  });
})();
