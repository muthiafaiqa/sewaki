const express = require('express');
const router = express.Router();
const { sendEmail } = require('./notification.service');

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
