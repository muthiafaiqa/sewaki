const express = require('express');
const cors = require('cors');

// Import semua routes dari modul
const authRoutes = require('./modules/auth/auth.routes');
const itemRoutes = require('./modules/item/item.routes');
const transactionRoutes = require('./modules/transaction/transaction.routes');
const paymentRoutes = require('./modules/payment/payment.routes');
const notificationRoutes = require('./modules/notification/notification.routes');
const chatRoutes = require('./modules/chat/chat.routes');

const app = express();

// ==============================
// MIDDLEWARE GLOBAL
// ==============================
app.use(cors());
app.use(express.json());

// Serve static files untuk upload KTP
app.use('/uploads', express.static('uploads'));

// ==============================
// HEALTH CHECK
// ==============================
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 SewaKi Monolith API berjalan!',
        version: '2.0.0',
        endpoints: {
            auth: '/api/auth',
            items: '/api/items',
            transactions: '/api/transactions',
            payments: '/api/payments',
            notifications: '/api/notifications',
            chats: '/api/chats'
        }
    });
});

// ==============================
// ROUTES
// ==============================
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chats', chatRoutes);

// ==============================
// 404 HANDLER
// ==============================
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Endpoint ${req.method} ${req.path} tidak ditemukan` });
});

// ==============================
// GLOBAL ERROR HANDLER
// ==============================
app.use((err, req, res, next) => {
    console.error('❌ Unhandled Error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server' });
});

module.exports = app;
