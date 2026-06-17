const prisma = require('../../shared/config/prisma');

// 1. Simpan ulasan baru (POST /api/reviews)
exports.createReview = async (req, res) => {
    try {
        const { item_id, penyewa_id, id_transaksi, rating, komentar } = req.body;

        // Validasi input dasar
        if (!item_id || !penyewa_id || !id_transaksi || rating === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Data tidak lengkap! Harap kirim item_id, penyewa_id, id_transaksi, dan rating.'
            });
        }

        const ratingInt = parseInt(rating, 10);
        if (isNaN(ratingInt) || ratingInt < 1 || ratingInt > 5) {
            return res.status(400).json({ success: false, message: 'Rating harus berupa angka antara 1 sampai 5!' });
        }

        // Validasi Transaksi: Harus ada di database
        const transaction = await prisma.transactions.findUnique({
            where: { id: id_transaksi }
        });

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan!' });
        }

        // Validasi Status Transaksi: Harus 'selesai'
        if (transaction.status_transaksi !== 'selesai') {
            return res.status(400).json({
                success: false,
                message: 'Ulasan hanya dapat diberikan jika status transaksi sudah Selesai!'
            });
        }

        // Validasi Duplikasi: Satu transaksi tidak bisa diulas dua kali
        const existingReview = await prisma.reviews.findFirst({
            where: { id_transaksi }
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'Transaksi ini sudah pernah diulas!'
            });
        }

        // Simpan Ulasan Baru
        const newReview = await prisma.reviews.create({
            data: {
                item_id,
                penyewa_id,
                id_transaksi,
                rating: ratingInt,
                komentar
            }
        });

        return res.status(201).json({
            success: true,
            message: 'Ulasan berhasil ditambahkan!',
            data: newReview
        });
    } catch (error) {
        console.error('Error creating review:', error);
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat menambahkan ulasan' });
    }
};

// 2. Ambil ulasan barang tertentu (GET /api/reviews/:item_id)
exports.getReviewsByItemId = async (req, res) => {
    try {
        const { item_id } = req.params;

        if (!item_id) {
            return res.status(400).json({ success: false, message: 'ID Barang wajib dikirim!' });
        }

        const reviews = await prisma.reviews.findMany({
            where: { item_id },
            orderBy: { createdAt: 'desc' }
        });

        return res.status(200).json({
            success: true,
            total_ulasan: reviews.length,
            data: reviews
        });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat mengambil data ulasan' });
    }
};

// 3. Ambil semua ulasan (GET /api/reviews)
exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await prisma.reviews.findMany();
        return res.status(200).json({
            success: true,
            data: reviews
        });
    } catch (error) {
        console.error('Error fetching all reviews:', error);
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};
