const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');

// POST /api/payments/create-invoice — Buat tagihan Xendit
router.post('/create-invoice', paymentController.createInvoice);

// POST /api/payments/webhook — Terima notifikasi dari Xendit
router.post('/webhook', paymentController.webhook);

// POST /api/payments/disburse — Cairkan dana ke rekening
router.post('/disburse', paymentController.disburse);

module.exports = router;
