const express = require('express');
const router = express.Router();
const { sendEmail } = require('./notification.service');
const prisma = require('../../shared/config/prisma');
const verifyToken = require('../../shared/middleware/authMiddleware');

/**
 * GET /api/notifications
 * Mendapatkan daftar notifikasi untuk user yang sedang login.
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const notifications = await prisma.$queryRawUnsafe(
            `SELECT * FROM "notifications" WHERE "user_id" = $1::uuid ORDER BY "created_at" DESC`,
            userId
        );
        res.status(200).json({ success: true, data: notifications });
    } catch (error) {
        console.error('❌ Gagal mengambil notifikasi:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil notifikasi' });
    }
});

/**
 * PUT /api/notifications/read-all
 * Menandai semua notifikasi user sebagai telah dibaca.
 */
router.put('/read-all', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        await prisma.$executeRawUnsafe(
            `UPDATE "notifications" SET "is_read" = true WHERE "user_id" = $1::uuid`,
            userId
        );
        res.status(200).json({ success: true, message: 'Semua notifikasi berhasil ditandai dibaca' });
    } catch (error) {
        console.error('❌ Gagal menandai semua notifikasi dibaca:', error);
        res.status(500).json({ success: false, message: 'Gagal mengubah status notifikasi' });
    }
});

/**
 * PUT /api/notifications/:id/read
 * Menandai satu notifikasi tertentu sebagai sudah dibaca.
 */
router.put('/:id/read', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await prisma.$executeRawUnsafe(
            `UPDATE "notifications" SET "is_read" = true WHERE "id" = $1::uuid AND "user_id" = $2::uuid`,
            id,
            userId
        );
        res.status(200).json({ success: true, message: 'Notifikasi berhasil ditandai dibaca' });
    } catch (error) {
        console.error('❌ Gagal mengubah status notifikasi:', error);
        res.status(500).json({ success: false, message: 'Gagal mengubah status notifikasi' });
    }
});

/**
 * POST /api/notifications/send-email
 * Endpoint untuk mengirim email (bisa dipanggil dari luar jika perlu).
 */
router.post('/send-email', async (req, res) => {
    try {
        const { email_tujuan, judul, isi_pesan } = req.body;

        if (!email_tujuan || !judul || !isi_pesan) {
            return res.status(400).json({
                success: false,
                message: 'email_tujuan, judul, dan isi_pesan wajib diisi!'
            });
        }

        await sendEmail({ email_tujuan, judul, isi_pesan });

        res.status(200).json({ success: true, message: 'Notifikasi email berhasil dikirim!' });
    } catch (error) {
        console.error('❌ Gagal mengirim email:', error);
        res.status(500).json({ success: false, message: 'Gagal mengirim email' });
    }
});

module.exports = router;
