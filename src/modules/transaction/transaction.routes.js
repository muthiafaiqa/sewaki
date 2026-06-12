const express = require('express');
const router = express.Router();
const transactionController = require('./transaction.controller');
const returnController = require('./return.controller');
const verifyToken = require('../../shared/middleware/authMiddleware');

// POST /api/transactions — Buat transaksi baru (harus login)
router.post('/', verifyToken, transactionController.createTransaction);

// GET /api/transactions — Lihat semua transaksi
router.get('/', verifyToken, transactionController.getAllTransactions);

// PUT /api/transactions/:id/pay — Update status jadi dibayar
router.put('/:id/pay', transactionController.payTransaction);

// PUT /api/transactions/return/:id — Proses pengembalian barang
router.put('/return/:id', returnController.returnItem);

module.exports = router;
