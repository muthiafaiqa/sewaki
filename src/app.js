const express = require('express');
const cors = require('cors');
const path = require('path');

// Import semua routes dari modul
const authRoutes = require('./modules/auth/auth.routes');
const itemRoutes = require('./modules/item/item.routes');
const transactionRoutes = require('./modules/transaction/transaction.routes');
const paymentRoutes = require('./modules/payment/payment.routes');
const notificationRoutes = require('./modules/notification/notification.routes');
const chatRoutes = require('./modules/chat/chat.routes');
const reviewRoutes = require('./modules/review/review.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const adminRoutes = require('./modules/admin/admin.routes');

const app = express();

// Serve static files untuk upload KTP
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ==============================
// MIDDLEWARE GLOBAL
// ==============================
app.use(cors({ origin: 'https://sewaki-frontend.up.railway.app' }));
app.use(express.json());

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
app.use('/api/reviews', reviewRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

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
