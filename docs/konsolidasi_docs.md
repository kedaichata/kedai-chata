## Prompt (tempel mulai dari sini)

```
Ini sesi STRATEGI, bukan sesi kode. Tugasmu hari ini: mengonsolidasi satu dokumen, yaitu `[NAMA_BERKAS]`, supaya isinya hanya keadaan terakhir.

Latar: dokumen ini sudah menumpuk blok catatan susulan dan handoff yang saling menimpa ("yang paling akhir menang"). Pembaca harus merangkai urutan blok untuk tahu keadaan sekarang. Keputusan ketua: yang tercatat cukup yang akhir. Konsolidasi dilakukan di sesi strategi; aturan "docs/ tidak dirapikan di sesi kode" (AGENTS.md bagian 2, aturan 7) tidak berubah. Berkas asli sudah disalin ketua ke `/docs/archive/[NAMA_ARSIP]`; jangan diubah dan jangan dirujuk di dokumen baru.

ATURAN KERAS
1. Tidak ada kode, SQL, atau pengaturan yang diubah, dijalankan, atau disarankan untuk dijalankan. Hanya dokumen.
2. Jangan mengarang. Isi hanya dari berkas yang dilampirkan. Keputusan tanpa alasan tertulis tetap "alasan belum tercatat". Hal yang belum terbukti tetap "belum terbukti" atau "belum dicek". Jangan mengubah "belum" menjadi "sudah" tanpa dasar tertulis di berkas.
3. Bagian-bagian dokumen TIDAK BOLEH dihilangkan: judul dan nomor bagian tetap ada, karena dirujuk dokumen lain dan sheet/CSV TODO (misalnya "migrasi.md bag. 4"). Isinya boleh dirampingkan, bagiannya tidak boleh hilang. Nomor keputusan (MG1, AN6, dan sejenisnya) dan nomor butir sheet (MGR.24, SEC-50a, dan sejenisnya) juga tidak diubah atau dinomori ulang.
4. Dokumen baru TIDAK BOLEH memuat log atau jejak perubahan. Tulis seolah versi lama tidak pernah ada. Dilarang: kalimat seperti "dipangkas pada ...", "diringkas di konsolidasi ...", "sebelumnya ...", "tidak berlaku lagi", blok riwayat, hash commit, atau rujukan ke berkas arsip. Tulis isinya langsung dalam keadaan terakhir, secara natural. Bagian Catatan Susulan tetap ada sebagai bagian kosong dengan format standarnya (`_(belum ada blok)_`).
5. Handoff: jumlah dan nomor handoff TETAP (10 handoff tetap 10), begitu juga bagian Handoff dan Catatan. Yang dikurangi hanya butir "Belum beres" yang terbawa berulang dari handoff ke handoff. Aturannya: (a) sebuah butir ditulis sekali, di handoff tempat ia pertama muncul; (b) handoff berikutnya tidak mengulanginya, kecuali ada kemajuan atau perubahan status yang perlu dicatat; (c) butir yang sudah beres dihapus dari "Belum beres" di handoff asalnya, dan hasilnya cukup ada di handoff atau bagian yang menyelesaikannya; (d) HANDOFF TERAKHIR memuat daftar lengkap semua butir yang masih terbuka, ringkas satu baris per butir, karena sesi berikutnya membaca handoff paling akhir (AGENTS.md bagian 11). Sebuah butir dianggap beres hanya bila ada blok atau handoff yang lebih baru yang tertulis menyelesaikannya; ragu berarti anggap belum beres dan tanyakan.
6. "Belum terbukti", "menunggu OK", dan "ditunda" yang masih terbuka tidak boleh hilang. Konsolidasi hanya membuang yang sudah tertimpa atau sudah selesai dan tidak dirujuk lagi.
7. Bila dua teks bertentangan, yang paling akhir menang. Bila urutan atau tanggalnya tidak jelas, tanyakan ke ketua, jangan menebak.
8. Data pribadi nyata, rahasia, kunci, dan token tidak ditulis (AGENTS.md bagian 7).
9. Ikuti gaya penulisan dokumen yang ada: bahasa Indonesia, kalimat pendek, tabel keputusan bernomor, tanpa tanda pisah panjang.
10. Jangan menyentuh dokumen lain. Bila dokumen lain merujuk teks yang berubah, daftarkan di akhir sebagai butir "perlu blok susulan di berkas X".
11. Bila berkasnya `AGENTS.md`: ekstra hati-hati. Semua aturan harus utuh. Tampilkan perubahan per bagian dan tunggu persetujuan tiap bagian.
12. Buang narasi kegiatan commit, push, `[skip ci]`, logout, dan menutup browser dari isi dokumen (misalnya "sudah di-commit dan di-push", "belum di-commit"). Sebut commit hanya bila itu bukti teknis yang dirujuk (misalnya "commit yang hanya mengubah docs tidak memicu build"), tanpa narasi kegiatannya. Aturan git yang memang bagian dari AGENTS.md (misalnya bagian 8) tetap utuh. Satu pengecualian: perubahan kode atau berkas aplikasi yang berhenti di tengah (sudah diubah tetapi belum di-commit atau di-push) wajib disebut lengkap dengan nama berkasnya.

LANGKAH (satu langkah per giliran, tunggu persetujuan sebelum lanjut)
Langkah 1. Baca seluruh berkas. Laporkan singkat: struktur bagian, jumlah blok susulan dan handoff, rentang tanggalnya. Lalu tanyakan dokumen atau sheet mana yang merujuk berkas ini (nomor bagian, nomor keputusan, nomor handoff), dan minta ketua melampirkan atau menyebutkannya. Jangan menebak rujukan yang tidak terlampir.
Langkah 2. Jelaskan RENCANAMU dulu, sebelum menulis atau meringkas apa pun, dengan bahasa yang mudah dipahami. Isinya: (a) per bagian, apa yang akan diperbarui, dirampingkan, atau dibiarkan; (b) tabel pertentangan: teks lama | ditimpa oleh | isi akhir yang berlaku; (c) perlakuan handoff (handoff tidak dilebur, jumlahnya tetap): daftar butir "Belum beres" yang terbawa berulang, handoff tempat tiap butir pertama muncul, mana yang sudah beres, dan mana yang masih terbuka di handoff terakhir; (d) butir terbuka yang akan dipertahankan; (e) yang akan dibuang dan alasannya; (f) hal yang kamu ragukan. Tanyakan hal ragu satu per satu. Tulis dokumen baru hanya setelah ketua menyetujui rencana ini.
Langkah 3. Tulis versi baru, bagian demi bagian bila panjang, sesuai aturan 3 sampai 5 dan 12. Header memakai pola dokumen yang ada: "Versi X.Y (tanggal), hasil sesi strategi".
Langkah 4. Pemeriksaan akhir, dalam daftar centang: semua bagian dan nomor bagian masih ada; semua nomor keputusan lama masih ada atau tercatat dibuang dan alasannya; semua butir terbuka dari rencana ada di versi baru; jumlah dan nomor handoff sama dengan aslinya; tidak ada butir "Belum beres" yang terbawa berulang; handoff terakhir memuat semua butir yang masih terbuka; tidak ada narasi commit atau push; tidak ada kalimat bernada log; tidak ada fakta baru tanpa sumber di lampiran. Lalu daftar dokumen lain yang perlu blok susulan.
Langkah 5. Keluaran: berkas md utuh siap menggantikan isi lama, dan ringkasan perubahan (maksimal sepuluh baris) untuk dicatat ketua di luar dokumen.

Mulai dari Langkah 1.
```

---

## Blok keputusan ketua (draf, untuk `AGENTS.md` bagian 12)

Tempel di **sesi kode** berikutnya (blok susulan hanya ditambah di sesi kode, aturan 7). Ketua perlu memastikan bunyinya; sebagian isinya usulan.

```markdown
### 2026-11-21: Keputusan ketua: dokumen `docs/` boleh dikonsolidasi di sesi strategi

**Berkas tujuan:** `AGENTS.md`, tempel PALING BAWAH bagian 12. Append-only. Keputusan ketua (sesi kode MGR, 21 Nov 2026). Alasan: banyak blok susulan dan handoff saling menimpa ("yang paling akhir menang"), sehingga pembaca harus merangkai urutan blok untuk tahu keadaan terakhir; ketua ingin yang tercatat adalah yang akhir saja. Alasan lain belum tercatat.

- **Jalur baru:** konsolidasi satu dokumen per sesi, **di sesi strategi**, setelah isi dokumen stabil. Aturan 7 (bagian 2) tidak berubah: sesi kode tetap tidak merapikan dokumen dan hanya menambah blok susulan.
- **Rencana dulu:** AI menjelaskan rencana (per bagian, pertentangan, perlakuan handoff, yang dibuang) dan menunggu persetujuan ketua sebelum menulis.
- **Yang dipertahankan:** judul dan nomor bagian, nomor keputusan, dan nomor butir sheet (dirujuk dokumen lain dan sheet/CSV TODO); butir "belum terbukti", "alasan belum tercatat", "menunggu OK", dan "ditunda" yang masih terbuka.
- **Handoff:** jumlah dan nomor handoff tetap. Butir "Belum beres" ditulis sekali di handoff tempat ia pertama muncul dan tidak diulang di handoff berikutnya kecuali ada kemajuan; butir yang sudah beres dihapus dari "Belum beres"; handoff terakhir memuat daftar lengkap butir yang masih terbuka, ringkas.
- **Narasi commit dan push:** tidak dimuat di isi dokumen (sesuai keputusan ketua di blok sebelumnya). Pengecualian tetap: perubahan kode atau berkas aplikasi yang berhenti di tengah wajib disebut dengan nama berkasnya.
- **Hasil:** isi bagian utama langsung dalam keadaan terakhir, tanpa log atau jejak perubahan di dalam dokumen. Bagian Catatan Susulan dikosongkan. Berkas asli disalin ketua ke `docs/archive/` sebelum konsolidasi dan tidak dirujuk dari dokumen baru.
- **Pertentangan dengan catatan lama:** tidak ada yang dibatalkan; ini menambah jalur sesi strategi di samping aturan 7. Yang paling akhir menang.
```
