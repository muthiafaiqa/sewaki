const express = require('express');
const router = express.Router();
const itemController = require('./item.controller');
const reviewController = require('./review.controller');
const verifyToken = require('../../shared/middleware/authMiddleware');

// Route untuk melihat semua barang (public)
router.get('/', itemController.getAllItems);

// Route untuk menambah barang (harus login — pemilik_id diambil dari token)
router.post('/', verifyToken, itemController.createItem);

// Route stock management (bisa dipanggil internal)
router.put('/:id/reduce-stock', itemController.reduceStock);
router.put('/:id/restore-stock', itemController.restoreStock);

// Route untuk ulasan
router.post('/:item_id/reviews', reviewController.addReview);
router.get('/:item_id/reviews', reviewController.getItemReviews);

module.exports = router;
