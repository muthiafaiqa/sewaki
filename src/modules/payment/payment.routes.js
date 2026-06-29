const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const verifyToken = require('../../shared/middleware/authMiddleware');

// POST /api/payments/create-invoice — Buat tagihan Xendit
router.post('/create-invoice', paymentController.createInvoice);

// GET & POST /api/payments/webhook — Terima notifikasi dari Xendit
router.get('/webhook', (req, res) => {
    res.status(200).json({ success: true, message: 'Webhook endpoint is active. Send POST requests here.' });
});
router.post('/webhook', paymentController.webhook);

// POST /api/payments/disburse — Cairkan dana ke rekening (pengembalian deposit)
router.post('/disburse', paymentController.disburseDeposit);

// POST /api/payments/withdraw — Tarik dana pemilik
router.post('/withdraw', verifyToken, verifyToken.checkRole(['pemilik']), paymentController.disburse);

module.exports = router;
