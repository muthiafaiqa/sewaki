const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const verifyToken = require('../../shared/middleware/authMiddleware');

// GET /api/dashboard/stats — Statistik untuk Pemilik Barang
router.get('/stats', verifyToken, verifyToken.checkRole(['pemilik']), dashboardController.getDashboardStats);

module.exports = router;
