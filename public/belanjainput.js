// public/belanjainput.js
// BLJ.05 (giliran 1): layar "Catatan baru" Belanja Warung untuk owner (belanja.md BL2, BL3, BL4, BL5, BL14).
// Dibuka dari tombol "+ Catatan baru" di layar Belanja (belanja.js). Layar penuh sendiri, berdiri di atas layar Belanja.
// Dimuat SETELAH akun.js (memakai window.KedaiAkun) dan SEBELUM belanja.js (yang memanggil window.KedaiBelanjaInput).
//
// Cara kerja (meniru kebiasaan menulis daftar di WA):
//   1. Owner menulis nama barang dan harga, tekan "Tambah ke daftar". Barang masuk daftar sementara di layar.
//   2. Boleh mengisi judul (boleh kosong, server mengisi tanggal dan nama bila kosong, BL5).
//   3. Tombol besar "Simpan catatan" mengirim SEMUA barang sekaligus: satu panggilan `belanja_buat` (BL14).
//   4. Berhasil: layar ditutup dan belanja.js memuat ulang daftar, membuka catatan baru, dan menampilkan "tersimpan".
//
// Aksi `kedai` yang dipakai (Handoff #3):
//   belanja_buat {judul?, item: [{nama, harga}]} -> {ok, belanja: {id, judul, jumlah_item}}
//   Harga dikirim sebagai ANGKA JSON. Pesan galat dari server sudah ramah dan tanpa angka; layar tinggal menampilkannya.
//
// Aturan yang dijaga:
// - Aplikasi tidak pernah mengirim total, peran, atau penginput. Hanya judul dan daftar nama plus harga.
//   "Total sementara" di layar hanya tampilan; total resmi dihitung server (BL4).
// - Cek di layar hanya kemudahan (nama tidak kosong, harga angka bulat minimal 1). Batas harga, panjang nama dan judul,
//   serta jumlah item diputuskan server (ada di `pengaturan`), jadi tidak ditulis mati di sini.
// - BL14 bawaan: draft TIDAK disimpan di HP (tanpa localStorage). Ada peringatan sebelum keluar bila masih ada isian.
// - Semua teks lewat textContent. Galat mentah tidak ditampilkan. Tanpa polling.
// - Keluar (Keluar akun): draft dibuang (HP dipakai bergantian).
// - Gaya di belanja.css (kelas blj-).

(function () {
  "use strict";

  var A = window.KedaiAkun;
  var layarUtama = document.getElementById("layar-sementara");
  var navOwner = document.getElementById("nav-owner");
  if (!A || !layarUtama || !navOwner) {
    // Bagian index.html atau akun.js belum lengkap: layar input tidak dipasang, aplikasi lain tetap jalan.
    return;
  }

  var PESAN_UMUM = "Catatan belum bisa disimpan. Coba lagi sebentar lagi.";
  var PESAN_OFFLINE =
    "Belum ada internet. Sambungkan internet lalu tekan Simpan lagi. Barang yang sudah kamu tulis masih aman di layar.";
  var PESAN_SESI = "Sesi sudah berakhir. Silakan keluar lalu masuk lagi.";
  var MAKS_DIGIT = 15;

  // Keadaan di memori (dibuang saat Keluar dan saat layar ditutup).
  var items = []; // daftar sementara: [{nama, harga}]
  var sedangSimpan = false;
  var terbuka = false;
  var onSimpan = null;

  // Unsur layar (dibuat saat pertama dibuka).
  var layar = null;
  var elNama = null;
  var elHarga = null;
  var elJudul = null;
  var galatNama = null;
  var galatHarga = null;
  var elGalat = null;
  var elDaftar = null;
  var elKosong = null;
  var elTotal = null;
  var elTotalNilai = null;
  var tombolSimpan = null;
  var dlg = null;
  var dlgLanjut = null;
  var dlgBuang = null;

  function buat(tag, kelas, teks) {
    var e = document.createElement(tag);
    if (kelas) e.className = kelas;
    if (teks !== undefined) e.textContent = teks;
    return e;
  }

  function kosongkan(e) {
    while (e.firstChild) e.removeChild(e.firstChild);
  }

  function rupiah(n) {
    var s = String(Math.round(Number(n) || 0));
    return "Rp " + s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  function setGalat(p, teks) {
    if (!p) return;
    p.textContent = teks || "";
    p.hidden = !teks;
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

  function rapikanNama(t) {
    return String(t).replace(/\s+/g, " ").trim();
  }

  // ------------------------------------------------------------
  // Isian harga: hanya angka, titik ribuan otomatis ("45000" jadi "45.000")
  // ------------------------------------------------------------

  function rapikanHarga() {
    var v = elHarga.value;
    var pos = v.length;
    try {
      if (typeof elHarga.selectionStart === "number") {
        pos = elHarga.selectionStart;
      }
    } catch (err) {
      pos = v.length;
    }
    var digit = v.replace(/\D/g, "").replace(/^0+/, "").slice(0, MAKS_DIGIT);
    var sebelum = v.slice(0, pos).replace(/\D/g, "").length;
    if (sebelum > digit.length) sebelum = digit.length;
    var f = digit.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    if (f !== v) {
      elHarga.value = f;
      var baru = 0;
      var hitung = 0;
      while (baru < f.length && hitung < sebelum) {
        if (/\d/.test(f.charAt(baru))) hitung++;
        baru++;
      }
      try {
        elHarga.setSelectionRange(baru, baru);
      } catch (err2) {
        // Tidak masalah: kursor di akhir.
      }
    }
    setGalat(galatHarga, "");
  }

  // ------------------------------------------------------------
  // Daftar sementara
  // ------------------------------------------------------------

  function adaIsian() {
    return (
      items.length > 0 ||
      elNama.value.trim() !== "" ||
      elHarga.value.trim() !== "" ||
      elJudul.value.trim() !== ""
    );
  }

  function gambarDaftar() {
    kosongkan(elDaftar);
    var jumlah = 0;
    for (var i = 0; i < items.length; i++) {
      (function (idx) {
        var it = items[idx];
        jumlah += it.harga;
        var li = buat("li", "blj-draf__baris");
        li.appendChild(buat("span", "blj-draf__nama", it.nama));
        li.appendChild(buat("span", "blj-draf__harga", rupiah(it.harga)));
        var hapus = buat(
          "button",
          "tombol tombol--sekunder blj-draf__hapus",
          "Hapus",
        );
        hapus.type = "button";
        hapus.setAttribute("aria-label", "Hapus " + it.nama);
        hapus.addEventListener("click", function () {
          items.splice(idx, 1);
          gambarDaftar();
        });
        li.appendChild(hapus);
        elDaftar.appendChild(li);
      })(i);
    }
    elKosong.hidden = items.length > 0;
    elTotal.hidden = items.length === 0;
    elTotalNilai.textContent = rupiah(jumlah);
    tombolSimpan.textContent =
      items.length > 0
        ? "Simpan catatan (" + items.length + " barang)"
        : "Simpan catatan";
  }

  // Masukkan isian nama dan harga ke daftar sementara. true bila berhasil.
  function tambahItem() {
    setGalat(galatNama, "");
    setGalat(galatHarga, "");
    var nama = rapikanNama(elNama.value);
    var digit = elHarga.value.replace(/\D/g, "");
    var harga = digit === "" ? 0 : Number(digit);
    var lengkap = true;
    if (nama === "") {
      setGalat(galatNama, "Tulis nama barangnya dulu, misalnya Ayam 2 kg.");
      lengkap = false;
    }
    if (!isFinite(harga) || harga < 1) {
      setGalat(galatHarga, "Isi harga dengan angka, misalnya 45.000.");
      lengkap = false;
    }
    if (!lengkap) {
      if (nama === "") {
        elNama.focus();
      } else {
        elHarga.focus();
      }
      return false;
    }
    items.push({ nama: nama, harga: harga });
    elNama.value = "";
    elHarga.value = "";
    setGalat(elGalat, "");
    gambarDaftar();
    elNama.focus();
    return true;
  }

  // ------------------------------------------------------------
  // Simpan
  // ------------------------------------------------------------

  function aturSibuk(sibuk) {
    sedangSimpan = sibuk;
    tombolSimpan.disabled = sibuk;
    if (sibuk) {
      tombolSimpan.textContent = "Menyimpan...";
    } else {
      gambarDaftar();
    }
  }

  function simpan() {
    if (sedangSimpan) return;
    setGalat(elGalat, "");
    // Nama dan harga sudah diketik tetapi belum ditekan Tambah: dimasukkan dulu, supaya tidak ada yang terlewat.
    if (elNama.value.trim() !== "" || elHarga.value.trim() !== "") {
      if (!tambahItem()) return;
    }
    if (items.length === 0) {
      setGalat(
        elGalat,
        "Tambahkan minimal satu barang dulu. Tulis nama dan harganya, lalu tekan Tambah ke daftar.",
      );
      return;
    }
    if (!navigator.onLine) {
      setGalat(elGalat, PESAN_OFFLINE);
      return;
    }

    var kirim = [];
    for (var i = 0; i < items.length; i++) {
      kirim.push({ nama: items[i].nama, harga: items[i].harga });
    }
    var data = { item: kirim };
    var judul = rapikanNama(elJudul.value);
    if (judul !== "") data.judul = judul;

    aturSibuk(true);
    A.panggilKedai("belanja_buat", data)
      .then(function (h) {
        if (h && h.status === 200 && h.data && h.data.ok === true) {
          var hasil =
            h.data.belanja && typeof h.data.belanja === "object"
              ? h.data.belanja
              : {};
          var balik = onSimpan;
          sedangSimpan = false;
          bersihkanSemua();
          tutupLayar();
          if (typeof balik === "function") balik({ id: hasil.id });
          return;
        }
        aturSibuk(false);
        setGalat(
          elGalat,
          h && h.status === 401 ? PESAN_SESI : pesanServer(h) || PESAN_UMUM,
        );
      })
      .catch(function () {
        aturSibuk(false);
        setGalat(elGalat, navigator.onLine ? PESAN_UMUM : PESAN_OFFLINE);
      });
  }

  // ------------------------------------------------------------
  // Keluar dari layar (dengan peringatan bila ada isian)
  // ------------------------------------------------------------

  function bukaDialog() {
    dlg.hidden = false;
    dlgLanjut.focus();
  }

  function tutupDialog() {
    dlg.hidden = true;
  }

  function bersihkanSemua() {
    items = [];
    if (elNama) {
      elNama.value = "";
      elHarga.value = "";
      elJudul.value = "";
      setGalat(galatNama, "");
      setGalat(galatHarga, "");
      setGalat(elGalat, "");
      gambarDaftar();
    }
  }

  function tutupLayar() {
    if (!layar) return;
    terbuka = false;
    onSimpan = null;
    layar.hidden = true;
    dlg.hidden = true;
    document.body.classList.remove("blj-input-terbuka");
  }

  // Tombol Kembali dan Esc: tanya dulu bila masih ada isian.
  function kembali() {
    if (sedangSimpan) return;
    if (adaIsian()) {
      bukaDialog();
    } else {
      tutupLayar();
    }
  }

  function buangDanKeluar() {
    if (sedangSimpan) return;
    bersihkanSemua();
    tutupLayar();
  }

  // ------------------------------------------------------------
  // Kerangka layar
  // ------------------------------------------------------------

  function buatIsian(idKolom, label, bantuan) {
    var bungkus = buat("div", "isian");
    var lab = buat("label", "isian__label", label);
    lab.setAttribute("for", idKolom);
    bungkus.appendChild(lab);
    return { bungkus: bungkus, bantuan: bantuan };
  }

  function buatLayar() {
    if (layar) return;
    layar = buat("div", "blj-layar blj-input");
    layar.id = "blj-input-layar";
    layar.setAttribute("role", "dialog");
    layar.setAttribute("aria-modal", "true");
    layar.setAttribute("aria-labelledby", "blj-input-judul");
    layar.hidden = true;

    // Bilah atas: tulisan jelas.
    var bilah = buat("div", "blj-bilah");
    var tKembali = buat(
      "button",
      "tombol tombol--sekunder blj-bilah__tombol",
      "Kembali",
    );
    tKembali.type = "button";
    bilah.appendChild(tKembali);

    var badan = buat("div", "blj-badan");
    var judul = buat("h1", "blj-judul", "Catatan baru");
    judul.id = "blj-input-judul";
    badan.appendChild(judul);
    badan.appendChild(
      buat(
        "p",
        "isian__bantuan",
        "Tulis barang yang dibeli satu per satu, seperti menulis di WA. Kalau sudah selesai, tekan Simpan catatan.",
      ),
    );

    // Kartu tambah barang
    var kartu = buat("div", "kartu");
    kartu.appendChild(buat("h2", "kartu__judul", "Tambah barang"));

    var isNama = buatIsian("blj-in-nama", "Nama barang");
    elNama = buat("input", "isian__kolom");
    elNama.id = "blj-in-nama";
    elNama.type = "text";
    elNama.autocomplete = "off";
    elNama.placeholder = "Contoh: Ayam 2 kg";
    elNama.setAttribute("enterkeyhint", "next");
    galatNama = buat("p", "isian__galat");
    galatNama.hidden = true;
    isNama.bungkus.appendChild(elNama);
    isNama.bungkus.appendChild(galatNama);
    kartu.appendChild(isNama.bungkus);

    var isHarga = buatIsian("blj-in-harga", "Harga (Rp)");
    elHarga = buat("input", "isian__kolom");
    elHarga.id = "blj-in-harga";
    elHarga.type = "text";
    elHarga.setAttribute("inputmode", "numeric");
    elHarga.autocomplete = "off";
    elHarga.placeholder = "Contoh: 45.000";
    elHarga.setAttribute("enterkeyhint", "done");
    isHarga.bungkus.appendChild(elHarga);
    isHarga.bungkus.appendChild(
      buat(
        "p",
        "isian__bantuan",
        "Isi harga total barang itu. Kalau Ayam 2 kg harganya 45.000, isi 45.000.",
      ),
    );
    galatHarga = buat("p", "isian__galat");
    galatHarga.hidden = true;
    isHarga.bungkus.appendChild(galatHarga);
    kartu.appendChild(isHarga.bungkus);

    var barisTambah = buat("div", "baris-tombol");
    var tTambah = buat("button", "tombol tombol--utama", "Tambah ke daftar");
    tTambah.type = "button";
    barisTambah.appendChild(tTambah);
    kartu.appendChild(barisTambah);
    badan.appendChild(kartu);

    // Daftar sementara
    var bagian = buat("section", "blj-bagian");
    bagian.appendChild(buat("h2", "blj-bagian__judul", "Daftar belanja"));
    elKosong = buat(
      "p",
      "isian__bantuan",
      "Belum ada barang. Tulis barang di atas, lalu tekan Tambah ke daftar.",
    );
    elDaftar = buat("ul", "blj-draf");
    elTotal = buat("div", "blj-draf__total");
    elTotal.hidden = true;
    elTotal.appendChild(buat("span", "", "Total sementara"));
    elTotalNilai = buat("span", "blj-draf__total-nilai", "Rp 0");
    elTotal.appendChild(elTotalNilai);
    bagian.appendChild(elKosong);
    bagian.appendChild(elDaftar);
    bagian.appendChild(elTotal);
    badan.appendChild(bagian);

    // Judul (boleh kosong, BL5)
    var isJudul = buatIsian(
      "blj-in-judul",
      "Judul catatan (boleh dikosongkan)",
    );
    elJudul = buat("input", "isian__kolom");
    elJudul.id = "blj-in-judul";
    elJudul.type = "text";
    elJudul.autocomplete = "off";
    elJudul.placeholder = "Kosongkan saja, nanti diisi tanggal dan namamu";
    isJudul.bungkus.appendChild(elJudul);
    badan.appendChild(isJudul.bungkus);

    elGalat = buat("p", "isian__galat");
    elGalat.setAttribute("role", "alert");
    elGalat.hidden = true;
    badan.appendChild(elGalat);

    // Tombol Simpan menempel di bawah layar
    var bawah = buat("div", "blj-bawah");
    tombolSimpan = buat(
      "button",
      "tombol tombol--utama blj-bawah__tombol",
      "Simpan catatan",
    );
    tombolSimpan.type = "button";
    bawah.appendChild(tombolSimpan);

    layar.appendChild(bilah);
    layar.appendChild(badan);
    layar.appendChild(bawah);
    layar.appendChild(buatDialog());
    document.body.appendChild(layar);

    tKembali.addEventListener("click", kembali);
    tTambah.addEventListener("click", tambahItem);
    tombolSimpan.addEventListener("click", simpan);
    elHarga.addEventListener("input", rapikanHarga);
    elNama.addEventListener("input", function () {
      setGalat(galatNama, "");
    });
    // Enter di nama pindah ke harga; Enter di harga menambah barang ke daftar.
    elNama.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        elHarga.focus();
      }
    });
    elHarga.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        tambahItem();
      }
    });
    gambarDaftar();
  }

  // Dialog peringatan: Lanjut mengisi = tombol utama, Buang = berpinggir merah.
  function buatDialog() {
    dlg = buat("div", "blj-dialog");
    dlg.hidden = true;
    var latar = buat("div", "blj-dialog__latar");
    var kotak = buat("div", "blj-dialog__kotak");
    kotak.setAttribute("role", "alertdialog");
    kotak.appendChild(
      buat("h2", "blj-dialog__judul", "Ada yang belum disimpan"),
    );
    kotak.appendChild(
      buat(
        "p",
        "blj-dialog__isi",
        "Barang yang sudah kamu tulis akan hilang kalau keluar sekarang. Mau lanjut mengisi dan menyimpannya?",
      ),
    );
    var baris = buat("div", "baris-tombol");
    dlgLanjut = buat("button", "tombol tombol--utama", "Lanjut mengisi");
    dlgLanjut.type = "button";
    dlgBuang = buat("button", "tombol tombol--bahaya", "Buang dan keluar");
    dlgBuang.type = "button";
    baris.appendChild(dlgLanjut);
    baris.appendChild(dlgBuang);
    kotak.appendChild(baris);
    dlg.appendChild(latar);
    dlg.appendChild(kotak);
    latar.addEventListener("click", tutupDialog);
    dlgLanjut.addEventListener("click", tutupDialog);
    dlgBuang.addEventListener("click", buangDanKeluar);
    return dlg;
  }

  // ------------------------------------------------------------
  // Buka dan Keluar akun
  // ------------------------------------------------------------

  // opsi.onSimpan({id}) dipanggil setelah catatan berhasil disimpan.
  function buka(opsi) {
    buatLayar();
    onSimpan =
      opsi && typeof opsi.onSimpan === "function" ? opsi.onSimpan : null;
    bersihkanSemua();
    sedangSimpan = false;
    tombolSimpan.disabled = false;
    terbuka = true;
    layar.hidden = false;
    layar.scrollTop = 0;
    document.body.classList.add("blj-input-terbuka");
    elNama.focus();
  }

  // Keluar akun atau peran berubah: draft dibuang, layar ditutup.
  function reset() {
    sedangSimpan = false;
    bersihkanSemua();
    tutupLayar();
  }

  // Esc: sama dengan Kembali. stopImmediatePropagation supaya belanja.js (dimuat sesudah ini) tidak ikut menutup layar Belanja.
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" || !terbuka) return;
    e.stopImmediatePropagation();
    if (!dlg.hidden) {
      tutupDialog();
    } else {
      kembali();
    }
  });

  // Peramban ditutup atau dimuat ulang saat masih ada isian: minta konfirmasi.
  window.addEventListener("beforeunload", function (e) {
    if (terbuka && adaIsian()) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  var keluarYa = document.getElementById("keluar-ya");
  if (keluarYa) keluarYa.addEventListener("click", reset);

  new MutationObserver(function () {
    if (layarUtama.hidden) reset();
  }).observe(layarUtama, { attributes: true, attributeFilter: ["hidden"] });

  new MutationObserver(function () {
    if (navOwner.hidden) reset();
  }).observe(navOwner, { attributes: true, attributeFilter: ["hidden"] });

  window.KedaiBelanjaInput = Object.freeze({
    buka: buka,
    reset: reset,
  });
})();
