const express = require('express');
const router = express.Router();
const chatController = require('./chat.controller');

// GET /api/chats/:id_transaksi — Ambil riwayat chat
router.get('/:id_transaksi', chatController.getChatHistory);

module.exports = router;
