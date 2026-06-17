require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./src/app');
const prisma = require('./src/shared/config/prisma');

// ==============================
// SETUP HTTP SERVER + SOCKET.IO
// ==============================
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '[https://sewaki-frontend.up.railway.app](https://sewaki-frontend.up.railway.app)', methods: ['GET', 'POST'] }
});

// Socket.IO Events (Real-time Chat)
io.on('connection', (socket) => {
    console.log(`👤 User Terhubung: ${socket.id}`);

    socket.on('join_room', (id_transaksi) => {
        socket.join(id_transaksi);
        console.log(`Room Terbentuk 🚪 ID Transaksi: ${id_transaksi}`);
    });

    socket.on('send_message', async (data) => {
        try {
            await prisma.messages.create({
                data: {
                    id_transaksi: data.id_transaksi,
                    pengirim: data.pengirim,
                    pesan: data.pesan
                }
            });
            console.log(`💾 Chat disimpan ke DB: [${data.id_transaksi}] -> ${data.pesan}`);
            socket.to(data.id_transaksi).emit('receive_message', data);
        } catch (dbError) {
            console.error('❌ Gagal menyimpan chat ke database:', dbError.message);
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ User Terputus: ${socket.id}`);
    });
});

// ==============================
// KONEKSI DATABASE & JALANKAN SERVER
// ==============================
const PORT = process.env.PORT || 3000;

console.log('⏳ Menghubungkan ke database...');
prisma.$connect()
    .then(() => {
        console.log('✅ Berhasil terhubung ke database sewaki via Prisma!');
        server.listen(PORT, () => {
            console.log(`\n🚀 SewaKi Monolith API (Prisma ORM) berjalan di http://localhost:${PORT}`);
            console.log(`📋 Endpoints:`);
            console.log(`   POST   /api/auth/register`);
            console.log(`   POST   /api/auth/login`);
            console.log(`   GET    /api/auth/profile`);
            console.log(`   POST   /api/auth/upload-ktp`);
            console.log(`   GET    /api/auth/kyc-list`);
            console.log(`   PUT    /api/auth/verify-kyc/:id`);
            console.log(`   PUT    /api/auth/reject-kyc/:id`);
            console.log(`   GET    /api/items`);
            console.log(`   GET    /api/items/:id`);
            console.log(`   POST   /api/items`);
            console.log(`   DELETE /api/items/:id`);
            console.log(`   POST   /api/transactions`);
            console.log(`   PUT    /api/transactions/return/:id`);
            console.log(`   POST   /api/payments/create-invoice`);
            console.log(`   POST   /api/payments/webhook`);
            console.log(`   GET    /api/chats/:id_transaksi`);
            console.log(`   💬 Socket.IO aktif\n`);
        });
    })
    .catch((err) => {
        console.error('❌ Gagal terhubung ke database via Prisma:', err.message);
        process.exit(1);
    });
