const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const verifyToken = require('../../shared/middleware/authMiddleware');

router.get('/revenue', verifyToken, verifyToken.verifyAdmin, adminController.getAdminRevenue);

module.exports = router;
