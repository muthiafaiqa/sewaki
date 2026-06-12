const prisma = require('../../shared/config/prisma');

// GET /api/chats/:id_transaksi — Ambil riwayat chat berdasarkan ID Transaksi
exports.getChatHistory = async (req, res) => {
    try {
        const { id_transaksi } = req.params;
        const history = await prisma.messages.findMany({
            where: { id_transaksi },
            orderBy: {
                createdAt: 'asc'
            }
        });
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil riwayat chat' });
    }
};

module.exports = exports;
