const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const verifyToken = require('../../shared/middleware/authMiddleware');

router.get('/revenue', verifyToken, verifyToken.verifyAdmin, adminController.getAdminRevenue);

// Laporan Sengketa Admin
router.get('/disputes', verifyToken, verifyToken.verifyAdmin, adminController.getDisputes);
router.patch('/disputes/:id/resolve', verifyToken, verifyToken.verifyAdmin, adminController.resolveDispute);
router.put('/disputes/:id/resolve', verifyToken, verifyToken.verifyAdmin, adminController.resolveDispute);

module.exports = router;
