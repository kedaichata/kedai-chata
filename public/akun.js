// public/akun.js
// AKN.05: layar Daftar, Masuk, Keluar (akun.md AK1, AK2, AK3, AK13, AK14).
// Setelah masuk, aplikasi memanggil `kedai` aksi `status` (ini uji pertama SEC-33).
// Layar "sementara" menampilkan sapaan dan peran; digantikan layar sebenarnya di langkah berikutnya
// (AKN.06 Lengkapi profil, lalu layar utama per peran).
//
// AKN.06: layar Lengkapi profil ada di profil.js (dimuat setelah berkas ini). akun.js membuka layar itu
// lewat window.KedaiProfil.tampil() dan membagikan pembantu lewat window.KedaiAkun.
//
// Aturan yang dijaga:
// - Peran dan identitas tidak pernah dikirim aplikasi; server membacanya dari token login.
// - Semua teks (nama dari server, pesan) dipasang lewat textContent, bukan innerHTML.
// - Galat mentah tidak ditampilkan; hanya pesan Bahasa Indonesia yang aman.
// - Cek di aplikasi hanya kemudahan; pengaman sebenarnya ada di server dan Supabase Auth.

(function () {
  "use strict";

  var KONFIG = window.KEDAI_CONFIG || {};
  var ALAMAT_KEDAI = (KONFIG.SUPABASE_URL || "") + "/functions/v1/kedai";

  // Nama layar; tiap layar punya elemen id "layar-<nama>" di index.html.
  var LAYAR = [
    "memuat",
    "masuk",
    "daftar",
    "profil",
    "sementara",
    "galat",
    "offline",
  ];

  var LABEL_PERAN = {
    customer: "customer",
    owner: "owner",
    penjaga: "penjaga",
  };

  var REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // AK3: hanya huruf dan angka, minimal 8 karakter (batas atas 72 mengikuti batas Supabase Auth).
  var REGEX_PASSWORD_BARU = /^[A-Za-z0-9]{8,72}$/;

  var PESAN_OFFLINE = "Tidak ada internet. Sambungkan internet lalu coba lagi.";
  var PESAN_TERLALU_SERING =
    "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";

  function el(id) {
    return document.getElementById(id);
  }

  // Klien Supabase (kunci publishable dari config.js). Sesi disimpan pustaka di peramban.
  var klien = null;
  if (
    window.supabase &&
    window.supabase.createClient &&
    KONFIG.SUPABASE_URL &&
    KONFIG.SUPABASE_PUBLISHABLE_KEY
  ) {
    klien = window.supabase.createClient(
      KONFIG.SUPABASE_URL,
      KONFIG.SUPABASE_PUBLISHABLE_KEY,
    );
  }

  // ------------------------------------------------------------
  // Pembantu tampilan
  // ------------------------------------------------------------

  function tampilkan(nama) {
    for (var i = 0; i < LAYAR.length; i++) {
      el("layar-" + LAYAR[i]).hidden = LAYAR[i] !== nama;
    }
    window.scrollTo(0, 0);
  }

  function tampilGalat(pesan) {
    el("galat-ket").textContent = pesan;
    tampilkan("galat");
  }

  // Galat satu isian (pinggir merah + tulisan, bukan hanya warna).
  function galatIsian(idBungkus, pesan) {
    var bungkus = el(idBungkus);
    var p = bungkus.querySelector(".isian__galat");
    var kolom = bungkus.querySelector(".isian__kolom");
    if (pesan) {
      bungkus.classList.add("isian--galat");
      p.textContent = pesan;
      p.hidden = false;
      kolom.setAttribute("aria-invalid", "true");
    } else {
      bungkus.classList.remove("isian--galat");
      p.textContent = "";
      p.hidden = true;
      kolom.removeAttribute("aria-invalid");
    }
  }

  // Galat untuk seluruh form (misalnya "Email atau password salah").
  function galatForm(prefiks, pesan) {
    el(prefiks + "-galat").textContent = pesan || "";
    el(prefiks + "-galat-bungkus").hidden = !pesan;
  }

  function bersihkanGalat(prefiks) {
    galatIsian("isian-" + prefiks + "-email", "");
    galatIsian("isian-" + prefiks + "-password", "");
    galatForm(prefiks, "");
  }

  function sibuk(tombol, aktif, teksAsli) {
    tombol.disabled = aktif;
    tombol.textContent = aktif ? "Memproses..." : teksAsli;
  }

  // Pesan galat Supabase Auth -> pesan aman Bahasa Indonesia (AK14).
  function pesanAuth(error, mode) {
    var kode = error && error.code ? error.code : "";
    if (
      !navigator.onLine ||
      (error && error.name === "AuthRetryableFetchError")
    ) {
      return "Belum bisa terhubung. Periksa internet lalu coba lagi.";
    }
    if (kode === "invalid_credentials") {
      return "Email atau password salah.";
    }
    if (mode === "masuk" && error && error.status === 400) {
      return "Email atau password salah.";
    }
    if (kode === "user_already_exists") {
      return "Email ini sudah terdaftar. Silakan masuk.";
    }
    if (kode === "email_address_invalid" || kode === "validation_failed") {
      return "Email tidak valid.";
    }
    if (kode === "weak_password") {
      return "Password minimal 8 karakter, hanya huruf dan angka.";
    }
    if (
      kode === "over_request_rate_limit" ||
      kode === "over_email_send_rate_limit"
    ) {
      return PESAN_TERLALU_SERING;
    }
    return mode === "daftar"
      ? "Gagal mendaftar. Coba lagi nanti."
      : "Gagal masuk. Coba lagi nanti.";
  }

  // ------------------------------------------------------------
  // Panggilan ke kedai (token login dari sesi; kunci publishable di apikey)
  // ------------------------------------------------------------

  // `data` (opsional): isian tambahan untuk aksi. Kunci "aksi" selalu dari parameter, tidak bisa tertimpa.
  function panggilKedai(aksi, data) {
    return klien.auth.getSession().then(function (h) {
      var sesi = h && h.data ? h.data.session : null;
      if (!sesi) {
        return { status: 401, data: null };
      }
      return fetch(ALAMAT_KEDAI, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + sesi.access_token,
          apikey: KONFIG.SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(Object.assign({}, data || {}, { aksi: aksi })),
      }).then(function (r) {
        return r.json().then(
          function (data) {
            return { status: r.status, data: data };
          },
          function () {
            return { status: r.status, data: null };
          },
        );
      });
    });
  }

  // Isi layar sementara dari balasan `status`.
  function isiSementara(d) {
    var nama =
      typeof d.nama_tampilan === "string" ? d.nama_tampilan.trim() : "";
    var label = Object.prototype.hasOwnProperty.call(LABEL_PERAN, d.peran)
      ? LABEL_PERAN[d.peran]
      : "pengguna";
    el("sapaan").textContent =
      (nama ? "Halo " + nama + ", " : "Halo, ") +
      "Anda berhasil masuk sebagai " +
      label +
      ".";

    var catatan = el("catatan-profil");
    if (d.peran === "customer") {
      catatan.textContent = d.profil
        ? "Profil Anda sudah lengkap."
        : "Profil belum lengkap. Layar Lengkapi profil menyusul di langkah berikutnya.";
      catatan.hidden = false;
    } else {
      catatan.textContent = "";
      catatan.hidden = true;
    }
  }

  function muatStatus() {
    tampilkan("memuat");
    panggilKedai("status")
      .then(function (h) {
        if (h.status === 200 && h.data && h.data.ok === true) {
          // AK6: customer tanpa profil melihat layar Lengkapi profil (profil.js).
          // Staf selalu punya profil null, jadi syaratnya wajib dua-duanya.
          if (h.data.peran === "customer" && !h.data.profil) {
            if (
              window.KedaiProfil &&
              typeof window.KedaiProfil.tampil === "function"
            ) {
              window.KedaiProfil.tampil();
            } else {
              tampilGalat("Aplikasi belum lengkap. Muat ulang halaman.");
            }
            return;
          }
          isiSementara(h.data);
          tampilkan("sementara");
          return;
        }
        // Hanya kode HTTP yang dicatat di konsol (untuk bukti SEC-33); tanpa token atau data pengguna.
        console.error("kedai status gagal, kode HTTP:", h.status);
        // Pesan dari fungsi kedai sendiri (ok:false + pesan) aman ditampilkan.
        // Balasan platform (tanpa field pesan) diganti pesan umum.
        var pesan =
          h.data && h.data.ok === false && typeof h.data.pesan === "string"
            ? h.data.pesan
            : "Data belum bisa dimuat. Coba lagi sebentar lagi.";
        tampilGalat(pesan);
      })
      .catch(function () {
        console.error("kedai status gagal tersambung");
        if (!navigator.onLine) {
          tampilkan("offline");
          return;
        }
        tampilGalat("Belum bisa terhubung ke server. Coba lagi sebentar lagi.");
      });
  }

  // ------------------------------------------------------------
  // Masuk, Daftar, Keluar
  // ------------------------------------------------------------

  function kirimMasuk(e) {
    e.preventDefault();
    bersihkanGalat("masuk");
    var email = el("masuk-email").value.trim();
    var password = el("masuk-password").value;

    var lengkap = true;
    if (!REGEX_EMAIL.test(email)) {
      galatIsian("isian-masuk-email", "Email tidak valid.");
      lengkap = false;
    }
    // Aturan huruf dan angka hanya untuk password baru (AK3); di sini cukup tidak kosong.
    if (!password) {
      galatIsian("isian-masuk-password", "Isi password.");
      lengkap = false;
    }
    if (!lengkap) return;

    var tombol = el("tombol-masuk");
    sibuk(tombol, true, "Masuk");
    klien.auth
      .signInWithPassword({ email: email, password: password })
      .then(function (h) {
        sibuk(tombol, false, "Masuk");
        if (h.error || !h.data || !h.data.session) {
          galatForm("masuk", pesanAuth(h.error, "masuk"));
          return;
        }
        el("masuk-password").value = "";
        muatStatus();
      })
      .catch(function () {
        sibuk(tombol, false, "Masuk");
        galatForm("masuk", "Gagal masuk. Coba lagi nanti.");
      });
  }

  function kirimDaftar(e) {
    e.preventDefault();
    bersihkanGalat("daftar");
    var email = el("daftar-email").value.trim();
    var password = el("daftar-password").value;

    var lengkap = true;
    if (!REGEX_EMAIL.test(email)) {
      galatIsian("isian-daftar-email", "Email tidak valid.");
      lengkap = false;
    }
    if (!REGEX_PASSWORD_BARU.test(password)) {
      galatIsian(
        "isian-daftar-password",
        "Password minimal 8 karakter, hanya huruf dan angka.",
      );
      lengkap = false;
    }
    if (!lengkap) return;

    var tombol = el("tombol-daftar");
    sibuk(tombol, true, "Daftar");
    klien.auth
      .signUp({ email: email, password: password })
      .then(function (h) {
        sibuk(tombol, false, "Daftar");
        if (h.error) {
          galatForm("daftar", pesanAuth(h.error, "daftar"));
          return;
        }
        // Confirm email mati (AK2): pendaftaran langsung memberi sesi.
        if (h.data && h.data.session) {
          el("daftar-password").value = "";
          muatStatus();
          return;
        }
        galatForm(
          "daftar",
          "Pendaftaran belum selesai. Coba masuk dengan email dan password tadi.",
        );
      })
      .catch(function () {
        sibuk(tombol, false, "Daftar");
        galatForm("daftar", "Gagal mendaftar. Coba lagi nanti.");
      });
  }

  function keluar() {
    if (!klien) return;
    function selesai() {
      el("masuk-password").value = "";
      el("daftar-password").value = "";
      bersihkanGalat("masuk");
      bersihkanGalat("daftar");
      // Data pribadi di layar Lengkapi profil ikut dibersihkan (HP bisa dipakai bergantian).
      if (
        window.KedaiProfil &&
        typeof window.KedaiProfil.reset === "function"
      ) {
        window.KedaiProfil.reset();
      }
      tampilkan("masuk");
    }
    // Hanya mengakhiri sesi di perangkat ini (HP bisa dipakai bergantian).
    klien.auth.signOut({ scope: "local" }).then(selesai, selesai);
  }

  function ulangi() {
    if (!klien) {
      window.location.reload();
      return;
    }
    muatStatus();
  }

  // Pembantu untuk profil.js. Tidak membuka akses baru: token tetap dari sesi login di peramban.
  window.KedaiAkun = Object.freeze({
    tampilkan: tampilkan,
    galatIsian: galatIsian,
    galatForm: galatForm,
    sibuk: sibuk,
    panggilKedai: panggilKedai,
    muatStatus: muatStatus,
    keluar: keluar,
  });

  // ------------------------------------------------------------
  // Pasang pendengar dan mulai
  // ------------------------------------------------------------

  el("form-masuk").addEventListener("submit", function (e) {
    if (!klien) {
      e.preventDefault();
      return;
    }
    kirimMasuk(e);
  });
  el("form-daftar").addEventListener("submit", function (e) {
    if (!klien) {
      e.preventDefault();
      return;
    }
    kirimDaftar(e);
  });
  el("ke-daftar").addEventListener("click", function () {
    bersihkanGalat("masuk");
    bersihkanGalat("daftar");
    tampilkan("daftar");
  });
  el("ke-masuk").addEventListener("click", function () {
    bersihkanGalat("masuk");
    bersihkanGalat("daftar");
    tampilkan("masuk");
  });
  el("tombol-keluar").addEventListener("click", keluar);
  el("tombol-segarkan").addEventListener("click", ulangi);
  el("galat-ulang").addEventListener("click", ulangi);
  el("galat-keluar").addEventListener("click", keluar);
  el("offline-ulang").addEventListener("click", ulangi);

  if (!klien) {
    tampilGalat("Aplikasi belum lengkap. Muat ulang halaman.");
    return;
  }

  // Sudah punya sesi tersimpan: langsung cek status. Belum: layar Masuk.
  klien.auth
    .getSession()
    .then(function (h) {
      if (h && h.data && h.data.session) {
        muatStatus();
      } else {
        tampilkan("masuk");
      }
    })
    .catch(function () {
      tampilkan("masuk");
    });
})();
