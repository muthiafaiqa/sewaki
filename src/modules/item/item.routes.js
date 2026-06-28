const express = require('express');
const router = express.Router();
const itemController = require('./item.controller');
const reviewController = require('./review.controller');
const verifyToken = require('../../shared/middleware/authMiddleware');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route untuk melihat semua barang (public)
router.get('/', itemController.getAllItems);

// Route untuk melihat detail satu barang (public)
router.get('/:id', itemController.getItemById);

// Route untuk melihat tanggal booking barang yang sudah terjadwal (public)
router.get('/:id/booked-dates', itemController.getBookedDates);

// Route untuk menambah barang (harus login — pemilik_id diambil dari token)
router.post('/', verifyToken, verifyToken.checkRole(['pemilik']), upload.any(), itemController.createItem);

// Route stock management (bisa dipanggil internal)
router.put('/:id/reduce-stock', itemController.reduceStock);
router.put('/:id/restore-stock', itemController.restoreStock);

// Route untuk menghapus barang (harus login)
router.delete('/:id', verifyToken, itemController.deleteItem);

// Route untuk ulasan
router.post('/:item_id/reviews', reviewController.addReview);
router.get('/:item_id/reviews', reviewController.getItemReviews);

module.exports = router;
