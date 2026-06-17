const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const authController = require('./auth.controller');
const kycController = require('./kyc.controller');
const verifyToken = require('../../shared/middleware/authMiddleware');

// --- KONFIGURASI MULTER (UPLOAD FOTO KTP) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, 'ktp-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// ====================================================
// JALUR RUTE API AUTH
// ====================================================

// Rute bebas (tidak perlu token)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Rute terlindungi (harus pakai token)
router.get('/profile', verifyToken, authController.getProfile);

// Upload foto KTP
router.post('/upload-ktp', upload.single('ktp'), kycController.uploadKtp);

// Admin: update status KYC
router.get('/kyc-list', verifyToken, verifyToken.verifyAdmin, kycController.getKycList);
router.put('/verify-kyc/:id', verifyToken, verifyToken.verifyAdmin, kycController.verifyKyc);
router.put('/reject-kyc/:id', verifyToken, verifyToken.verifyAdmin, kycController.rejectKyc);

// Update lokasi user
router.put('/:id/lokasi', authController.updateLokasi);

module.exports = router;
