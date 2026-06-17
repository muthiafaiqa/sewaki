const express = require('express');
const router = express.Router();
const transactionController = require('./transaction.controller');
const returnController = require('./return.controller');
const verifyToken = require('../../shared/middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, 'return-proof-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// POST /api/transactions — Buat transaksi baru (harus login)
router.post('/', verifyToken, transactionController.createTransaction);

// GET /api/transactions — Lihat semua transaksi
router.get('/', verifyToken, transactionController.getAllTransactions);

// GET /api/transactions/my-rentals — Ambil riwayat transaksi penyewa
router.get('/my-rentals', verifyToken, transactionController.getMyRentals);

// PUT /api/transactions/:id/pay — Update status jadi dibayar
router.put('/:id/pay', transactionController.payTransaction);

// PUT /api/transactions/return/:id — Pengajuan bukti pengembalian barang
router.put('/return/:id', upload.single('bukti_pengembalian'), transactionController.submitReturnProof);

// PUT /api/transactions/complete/:id — Selesaikan transaksi & hitung denda
router.put('/complete/:id', verifyToken, verifyToken.checkRole(['pemilik']), transactionController.completeTransaction);

// POST /api/transactions/upload-proof — Upload bukti foto pengembalian
router.post('/upload-proof', verifyToken, upload.single('bukti_kembali'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Tidak ada file bukti pengembalian yang diunggah!' });
    }
    res.status(200).json({
        success: true,
        message: 'Foto bukti pengembalian berhasil diunggah!',
        filename: req.file.filename
    });
});

module.exports = router;
