// public/akunmenu.js
// AKN.08a: layar Akun, bagian ganti nama dan ganti nomor WA (akun.md AK7, AK8, AK14). Hanya customer.
// Dimuat SETELAH akun.js karena memakai window.KedaiAkun (pembantu layar dan panggilan ke `kedai`).
// Layar dibuka dari tombol "Akun" di layar sementara (id tombol-akun); nanti tombolnya dipindah
// ke menu Akun saat layar utama dibuat. Ganti password menyusul di AKN.08b.
//
// Aturan yang dijaga:
// - Yang dikirim hanya aksi dan nilai baru (nama atau wa). ID pemilik dari token di server.
// - Cek di aplikasi hanya kemudahan; aturan sebenarnya dicek fungsi SQL ganti_nama dan ganti_wa di server.
// - Semua teks (nama dari server, pesan) dipasang lewat textContent, bukan innerHTML.
// - Galat mentah tidak ditampilkan. Tidak ada console.log berisi data pengguna.
// - Nomor WA lama tidak ditampilkan; isian WA selalu kosong dan dikosongkan lagi setelah berhasil dan saat Keluar.

(function () {
  "use strict";

  var A = window.KedaiAkun;
  if (!A) {
    // akun.js belum termuat: window.KedaiAkunMenu tidak dibuat.
    return;
  }

  function el(id) {
    return document.getElementById(id);
  }

  // Pagar kasar yang sama dengan profil.js dan aturan server (AK7, AK8). Server tetap yang memutuskan.
  var REGEX_NAMA = /^[A-Za-z0-9_ ]{3,20}$/;
  var REGEX_WA = /^(\+62|62|0)8[0-9]{7,12}$/;

  var TEKS_NAMA = "Simpan nama";
  var TEKS_WA = "Simpan nomor WA";
  var PESAN_UMUM = "Perubahan belum bisa disimpan. Coba lagi sebentar lagi.";
  var PESAN_MUAT = "Data akun belum bisa dimuat. Coba lagi sebentar lagi.";
  var PESAN_OFFLINE = "Belum bisa terhubung. Periksa internet lalu coba lagi.";
  var PESAN_SESI = "Sesi sudah berakhir. Silakan keluar lalu masuk lagi.";

  var sedangProses = false;

  // ------------------------------------------------------------
  // Pembantu
  // ------------------------------------------------------------

  // Pesan dari fungsi kedai sendiri (ok:false + pesan) aman ditampilkan; selain itu pesan umum.
  function pesanGalat(h, cadangan) {
    return h &&
      h.data &&
      h.data.ok === false &&
      typeof h.data.pesan === "string"
      ? h.data.pesan
      : cadangan;
  }

  function tampilPesan(teks) {
    var p = el("akun-pesan");
    p.textContent = teks || "";
    p.hidden = !teks;
  }

  function galatMuat(teks) {
    var p = el("akun-muat-galat");
    p.textContent = teks || "";
    p.hidden = !teks;
  }

  function bersihkanGalat() {
    A.galatIsian("isian-akun-nama", "");
    A.galatIsian("isian-akun-wa", "");
    A.galatForm("akunnama", "");
    A.galatForm("akunwa", "");
    tampilPesan("");
    galatMuat("");
  }

  function kosongkanIsian() {
    el("akun-nama").value = "";
    el("akun-wa").value = "";
  }

  // ------------------------------------------------------------
  // Buka dan tutup layar
  // ------------------------------------------------------------

  // Isi kolom Nama dengan nama sekarang dari server (aksi status; tidak ada aksi baca baru).
  function muatNama() {
    return A.panggilKedai("status")
      .then(function (h) {
        if (
          h.status === 200 &&
          h.data &&
          h.data.ok === true &&
          typeof h.data.nama_tampilan === "string"
        ) {
          el("akun-nama").value = h.data.nama_tampilan;
          return;
        }
        if (h.status === 401 && !h.data) {
          galatMuat(PESAN_SESI);
          return;
        }
        galatMuat(PESAN_MUAT);
      })
      .catch(function () {
        galatMuat(navigator.onLine ? PESAN_MUAT : PESAN_OFFLINE);
      });
  }

  function tampil() {
    sedangProses = false;
    kosongkanIsian();
    bersihkanGalat();
    A.tampilkan("akun");
    muatNama();
  }

  // Dipanggil akun.js saat Keluar: tidak boleh ada data pribadi tersisa di layar.
  function reset() {
    sedangProses = false;
    kosongkanIsian();
    bersihkanGalat();
  }

  // ------------------------------------------------------------
  // Ganti nama
  // ------------------------------------------------------------

  function kirimNama(e) {
    e.preventDefault();
    if (sedangProses) return;
    bersihkanGalat();

    var nama = el("akun-nama").value.trim();
    if (!REGEX_NAMA.test(nama)) {
      A.galatIsian(
        "isian-akun-nama",
        "Nama 3 sampai 20 karakter, hanya huruf, angka, spasi, dan garis bawah.",
      );
      return;
    }

    var tombol = el("tombol-akun-nama");
    sedangProses = true;
    A.sibuk(tombol, true, TEKS_NAMA);

    A.panggilKedai("ganti_nama", { nama: nama })
      .then(function (h) {
        sedangProses = false;
        A.sibuk(tombol, false, TEKS_NAMA);

        if (h.status === 200 && h.data && h.data.ok === true) {
          el("akun-nama").value = nama;
          tampilPesan("Nama berhasil diganti.");
          return;
        }
        if (h.status === 401 && !h.data) {
          A.galatForm("akunnama", PESAN_SESI);
          return;
        }
        A.galatForm("akunnama", pesanGalat(h, PESAN_UMUM));
      })
      .catch(function () {
        sedangProses = false;
        A.sibuk(tombol, false, TEKS_NAMA);
        A.galatForm("akunnama", navigator.onLine ? PESAN_UMUM : PESAN_OFFLINE);
      });
  }

  // ------------------------------------------------------------
  // Ganti nomor WA
  // ------------------------------------------------------------

  function kirimWa(e) {
    e.preventDefault();
    if (sedangProses) return;
    bersihkanGalat();

    // Spasi dan tanda hubung dibuang supaya "0812-3456-789" tetap diterima.
    var wa = el("akun-wa").value.replace(/[\s-]/g, "");
    if (!REGEX_WA.test(wa)) {
      A.galatIsian("isian-akun-wa", "Nomor WA tidak valid.");
      return;
    }

    var tombol = el("tombol-akun-wa");
    sedangProses = true;
    A.sibuk(tombol, true, TEKS_WA);

    A.panggilKedai("ganti_wa", { wa: wa })
      .then(function (h) {
        sedangProses = false;
        A.sibuk(tombol, false, TEKS_WA);

        if (h.status === 200 && h.data && h.data.ok === true) {
          el("akun-wa").value = "";
          tampilPesan("Nomor WA berhasil diganti.");
          return;
        }
        if (h.status === 401 && !h.data) {
          A.galatForm("akunwa", PESAN_SESI);
          return;
        }
        A.galatForm("akunwa", pesanGalat(h, PESAN_UMUM));
      })
      .catch(function () {
        sedangProses = false;
        A.sibuk(tombol, false, TEKS_WA);
        A.galatForm("akunwa", navigator.onLine ? PESAN_UMUM : PESAN_OFFLINE);
      });
  }

  // ------------------------------------------------------------
  // Pasang pendengar
  // ------------------------------------------------------------

  el("tombol-akun").addEventListener("click", tampil);
  el("form-akun-nama").addEventListener("submit", kirimNama);
  el("form-akun-wa").addEventListener("submit", kirimWa);
  // Kembali: bersihkan isian, lalu muat ulang status supaya sapaan memakai nama terbaru.
  el("akun-kembali").addEventListener("click", function () {
    kosongkanIsian();
    bersihkanGalat();
    A.muatStatus();
  });

  window.KedaiAkunMenu = Object.freeze({
    tampil: tampil,
    reset: reset,
  });
})();
