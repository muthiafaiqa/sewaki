const prisma = require('../../shared/config/prisma');

// Fungsi untuk menambahkan ulasan (POST)
exports.addReview = async (req, res) => {
    try {
        const { item_id } = req.params;
        const { penyewa_id, id_transaksi, rating, komentar } = req.body;

        if (!item_id || !penyewa_id || !rating || !komentar) {
            return res.status(400).json({
                success: false,
                message: 'Data tidak lengkap! Pastikan kirim item_id, penyewa_id, rating, dan komentar.'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating harus 1 sampai 5 bintang!' });
        }

        const newReview = await prisma.reviews.create({
            data: {
                item_id,
                penyewa_id,
                id_transaksi,
                rating: parseInt(rating, 10),
                komentar
            }
        });

        res.status(201).json({
            success: true,
            message: 'Terima kasih! Ulasan dan rating berhasil ditambahkan ⭐',
            data: newReview
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal menambahkan ulasan', error: error.message });
    }
};

// Fungsi untuk melihat semua ulasan di satu barang (GET)
exports.getItemReviews = async (req, res) => {
    try {
        const { item_id } = req.params;
        const reviews = await prisma.reviews.findMany({
            where: { item_id }
        });

        res.status(200).json({
            success: true,
            total_ulasan: reviews.length,
            data: reviews
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil data ulasan' });
    }
};
