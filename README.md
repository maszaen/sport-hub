# 🏟️ SportHub

SportHub adalah platform penyewaan dan manajemen lapangan olahraga modern berbasis web. Aplikasi ini menghubungkan pemilik lapangan (Vendor) dengan penyewa (User) secara efisien, serta menyediakan pengawasan penuh bagi pengelola sistem (Admin).

---

## ✨ Fitur Utama

### 👤 Role User (Penyewa)
*   **Pencarian Cerdas & Filter:** Cari lapangan berdasarkan kategori olahraga (Futsal, Bulu Tangkis, Padel, dll).
*   **Real-time Booking System:** Sistem *booking* pintar yang mencegah *double-booking* dengan kunci slot otomatis (*real-time*) saat sedang memilih waktu.
*   **Wishlist:** Simpan lapangan favorit ke dalam *wishlist*.
*   **Ulasan & Rating:** Berikan *rating* bintang dan komentar pada lapangan setelah jadwal bermain selesai.
*   **Riwayat Transaksi:** Lacak dan kelola (termasuk pembatalan) semua pesanan di satu tempat.

### 🏪 Role Vendor (Pemilik Lapangan)
*   **Manajemen Lapangan:** Tambah, edit, dan kelola informasi lapangan beserta kapasitas dan harga sewa.
*   **Unggah Foto Asli:** Vendor dapat mengunggah gambar kondisi lapangan yang sebenarnya.
*   **Pengajuan Tutup (Closure):** Ajukan penutupan sementara lapangan (misal: untuk renovasi) yang akan dikonfirmasi oleh Admin.
*   **Manajemen Pesanan:** Pantau pesanan masuk secara proaktif.

### 👑 Role Admin (Pengelola Sistem)
*   **Manajemen Pengguna:** Lihat daftar semua pengguna, Vendor, dan Admin. Fitur blokir (*suspend*) dan aktifkan (*activate*) akun pelanggar.
*   **Verifikasi Lapangan:** Terima atau tolak pengajuan penutupan (status `closure_requested`) dari Vendor.

---

## 🛠️ Tech Stack

Aplikasi ini dibangun menggunakan teknologi modern:

*   **Frontend:** React (Vite) + TypeScript
*   **Styling:** TailwindCSS + Lucide React (Icons)
*   **Backend & Database:** Supabase (PostgreSQL)
*   **Autentikasi:** Supabase Auth
*   **Storage:** Supabase Storage (Upload gambar)
*   **Real-time:** Supabase Realtime Channel (Booking Lock System)
*   **Maps:** React Leaflet (OpenStreetMap)

---

## 🚀 Cara Menjalankan Aplikasi di Lokal

### 1. Kloning Repositori
```bash
git clone https://github.com/maszaen/sport-hub.git
cd sport-hub
```

### 2. Instalasi Dependensi
Pastikan Anda sudah menginstal Node.js, lalu jalankan:
```bash
npm install
```

### 3. Konfigurasi Variabel Lingkungan (.env)
Buat file `.env` di *root directory* dan tambahkan kredensial Supabase Anda:
```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Menjalankan Development Server
```bash
npm run dev
```
Aplikasi dapat diakses melalui `http://localhost:5173/`

---

## 🗄️ Manajemen Database (Supabase)

Proyek ini dilengkapi dengan skrip SQL untuk mengatur dan mereset database secara menyeluruh. Jika Anda ingin melakukan *fresh install*, Anda dapat menjalankan file-file berikut di menu SQL Editor pada *dashboard* Supabase Anda secara berurutan:

1. `clean_reset_all.sql.md`: Menghapus seluruh tabel dan data (reset).
2. `safe_seed.sql.md`: Memasukkan data uji coba (*seeding*) yang mencakup 30 lapangan dari berbagai vendor di Jakarta secara otomatis.

> 📝 *Untuk panduan QA dan Testing lengkap, silakan lihat file `tester-guide.md`.*

---

*Dikembangkan untuk memenuhi Tugas UAS Manajemen Proyek.*
