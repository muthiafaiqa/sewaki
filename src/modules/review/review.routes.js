const express = require('express');
const router = express.Router();
const reviewController = require('./review.controller');
const verifyToken = require('../../shared/middleware/authMiddleware');

// POST /api/reviews — Simpan ulasan baru
router.post('/', verifyToken, reviewController.createReview);

// GET /api/reviews — Ambil semua ulasan (untuk frontend)
router.get('/', verifyToken, reviewController.getAllReviews);

// GET /api/reviews/:item_id — Ambil semua ulasan barang tertentu
router.get('/:item_id', reviewController.getReviewsByItemId);

module.exports = router;
