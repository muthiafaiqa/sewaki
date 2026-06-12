# SewaKi Backend — Modular Monolith

Backend aplikasi penyewaan barang **SewaKi**, hasil migrasi arsitektur dari **Microservice** ke **Modular Monolith**.

## Tech Stack

- **Runtime:** Node.js (CommonJS)
- **Framework:** Express.js v5
- **Database:** PostgreSQL via Sequelize ORM (satu database `sewaki`)
- **Auth:** JWT (jsonwebtoken)
- **Upload:** Multer
- **Email:** Nodemailer (Gmail)
- **Payment:** Xendit API
- **Real-time Chat:** Socket.IO

---

## Struktur Folder

```
sewaki-monolith/
├── src/
│   ├── modules/
│   │   ├── auth/           # Registrasi, login, KYC, lokasi
│   │   ├── item/           # Barang sewa & ulasan
│   │   ├── transaction/    # Transaksi & pengembalian barang
│   │   ├── payment/        # Xendit invoice, webhook, disbursement
│   │   ├── notification/   # Kirim email via Nodemailer
│   │   └── chat/           # Riwayat chat (REST) + Socket.IO
│   ├── shared/
│   │   ├── config/
│   │   │   └── database.js # Satu koneksi Sequelize → DB 'sewaki'
│   │   └── middleware/
│   │       └── authMiddleware.js  # JWT verify middleware
│   └── app.js              # Express app (semua routes)
├── scripts/
│   └── create-db.js        # Script setup database (jalankan sekali)
├── uploads/                # Foto KTP (auto-created)
├── server.js               # Entry point: HTTP + Socket.IO + DB sync
├── .env                    # Konfigurasi environment
└── package.json
```

---

## Cara Menjalankan

### 1. Clone & Install

```bash
cd sewaki-monolith
npm install
```

### 2. Setup Environment

Salin `.env` dan sesuaikan. Untuk menghubungkan ke Supabase, isi `DATABASE_URL` dengan Connection String dari dashboard Supabase Anda.

```env
PORT=3000

# PILIHAN 1: Menggunakan Supabase Database
DATABASE_URL=postgresql://postgres:[password_supabase]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# PILIHAN 2: Menggunakan Local PostgreSQL (Kosongkan/Komentari DATABASE_URL jika ingin pakai local)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sewaki
DB_USER=postgres
DB_PASSWORD=root
DB_SSL=false

JWT_SECRET=rahasiasewaki123
XENDIT_SECRET_KEY=your_xendit_key
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
```

### 3. Setup Database (Untuk Local Database)

Jika Anda menggunakan database PostgreSQL lokal:
```bash
npm run setup
```
*(Lewati langkah ini jika menggunakan Supabase, tabel-tabel akan langsung disinkronkan saat server berjalan)*

### 4. Jalankan Server

```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Server berjalan di: **http://localhost:3000**

---

## Endpoints API

### Auth (`/api/auth`)
| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Daftar akun baru | ❌ |
| POST | `/api/auth/login` | Login & dapat token | ❌ |
| GET | `/api/auth/profile` | Lihat profil sendiri | ✅ |
| POST | `/api/auth/upload-ktp` | Upload foto KTP | ❌ |
| PUT | `/api/auth/verify-kyc/:id` | Admin: verifikasi KYC | ❌ |
| PUT | `/api/auth/:id/lokasi` | Update koordinat lokasi | ❌ |

### Items (`/api/items`)
| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| GET | `/api/items` | Daftar semua barang | ❌ |
| POST | `/api/items` | Tambah barang baru | ✅ |
| PUT | `/api/items/:id/reduce-stock` | Kurangi stok | ❌ |
| PUT | `/api/items/:id/restore-stock` | Kembalikan stok | ❌ |
| POST | `/api/items/:item_id/reviews` | Tambah ulasan | ❌ |
| GET | `/api/items/:item_id/reviews` | Lihat ulasan barang | ❌ |

### Transactions (`/api/transactions`)
| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| POST | `/api/transactions` | Buat transaksi baru | ✅ |
| GET | `/api/transactions` | Semua transaksi | ✅ |
| PUT | `/api/transactions/:id/pay` | Update status dibayar | ❌ |
| PUT | `/api/transactions/return/:id` | Proses pengembalian | ❌ |

### Payments (`/api/payments`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/payments/create-invoice` | Buat invoice Xendit |
| POST | `/api/payments/webhook` | Webhook Xendit |
| POST | `/api/payments/disburse` | Cairkan dana |

### Notifications (`/api/notifications`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/notifications/send-email` | Kirim email |

### Chat (`/api/chats`)
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/chats/:id_transaksi` | Riwayat chat |

### Socket.IO Events
| Event | Arah | Deskripsi |
|---|---|---|
| `join_room` | Client → Server | Masuk room chat (id_transaksi) |
| `send_message` | Client → Server | Kirim pesan |
| `receive_message` | Server → Client | Terima pesan |

---

## Perubahan dari Microservice

| Sebelum | Sesudah |
|---|---|
| 7 service, 7 port (3000–3006) | 1 aplikasi, port 3000 |
| 4 database terpisah | 1 database `sewaki` |
| Komunikasi via HTTP/fetch antar-service | Direct function call antar-modul |
| 7 `package.json` | 1 `package.json` |
| 7 `.env` | 1 `.env` |
| `authMiddleware` duplikat di 2 service | `shared/middleware/authMiddleware.js` |
