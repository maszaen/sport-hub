# Fitur yang Belum Didevelop (To-Do List)

Berdasarkan pengecekan pada struktur dan kode proyek SportHub saat ini, berikut adalah daftar fitur dan fungsionalitas yang belum dikembangkan:

## 1. Integrasi Payment Gateway (Pembayaran Asli)
Saat ini pada `CheckoutPage`, proses pemesanan langsung menyimpan data ke database Supabase dengan status `confirmed`. Belum ada integrasi dengan *Payment Gateway* (seperti Midtrans, Xendit, Stripe) untuk memproses pembayaran sesungguhnya.

## 2. Admin / Vendor Dashboard
Belum ada antarmuka khusus untuk pemilik lapangan (Vendor) atau Admin. Fitur yang diperlukan di antaranya:
- Manajemen lapangan (Tambah, Edit, Hapus venue)
- Manajemen pemesanan (Melihat daftar pesanan, konfirmasi/batal pesanan)
- Laporan dan statistik pendapatan

## 3. Manajemen Profil Pengguna
Belum ada halaman untuk pengguna mengelola profilnya, seperti:
- Mengubah foto profil (Avatar)
- Memperbarui nama dan nomor telepon default
- Mengganti password

## 4. Sistem Ulasan dan Penilaian (Review & Ratings)
Pengguna belum bisa memberikan ulasan (review) atau rating (bintang) setelah selesai menyewa lapangan. Detail lapangan saat ini belum menampilkan ulasan asli dari pengguna.

## 5. Peta dan Lokasi Terintegrasi
Meskipun ada alamat, belum ada integrasi peta interaktif (seperti Google Maps atau Mapbox) agar pengguna dapat melihat lokasi lapangan secara visual dan mendapatkan rute.

## 6. Notifikasi
Belum ada sistem notifikasi baik melalui Email, WhatsApp, maupun *Push Notifications* (In-app) untuk memberitahukan status pemesanan kepada pengguna (misalnya saat berhasil, atau pengingat jadwal).

## 7. Fitur Wishlist / Favorit
Pengguna belum bisa menyimpan lapangan ke daftar favorit untuk dilihat kembali nanti.

## 8. Pengecekan Ketersediaan Real-time & Konkurensi
Belum ada mekanisme khusus di frontend (seperti WebSocket/Supabase Realtime) yang mengunci jadwal seketika ketika ada pengguna lain yang sedang di halaman *checkout* pada waktu yang bersamaan.

## 9. Paginasi / Infinite Scroll
Pada halaman utama (Pencarian Lapangan) maupun riwayat pemesanan, belum terlihat adanya paginasi. Jika data lapangan atau riwayat pemesanan sudah sangat banyak, performa aplikasi bisa terganggu.

## 10. Promo dan Diskon
Belum ada sistem untuk memasukkan kode promo atau voucher diskon saat checkout.
