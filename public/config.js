// public/config.js
// Pengaturan publik Kedai ChATA.
// Hanya boleh berisi URL project dan kunci PUBLISHABLE Supabase (aman untuk publik).
// DILARANG menaruh kunci secret (sb_secret_...), kunci privat VAPID, password, atau token di sini.
// Kunci publik VAPID ditambahkan nanti di langkah notifikasi.
window.KEDAI_CONFIG = {
  SUPABASE_URL: "https://yrpsratsnzalgaudnqlj.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_KhlCvJdxfJ2RTa09Y-cZWw_EJtUXrVA",
  // NTF.05: kunci PUBLIK VAPID (aman di repo public). Kunci privat TIDAK boleh ada di sini.
  VAPID_PUBLIC_KEY:
    "BKntJ9JrWBq2ZASkyPOeHTzzL1I55BH3vDxfKMZQ5OfGWri7pFZJfcnzIeUtzjUR25_o0IbMuDRogk8u9uj6zXk",
};
