const prisma = require('../../shared/config/prisma');
const { reduceStock, restoreStock } = require('./item.service');

// Fungsi untuk menambah barang baru
exports.createItem = async (req, res) => {
    try {
        const { nama_barang, deskripsi, harga_sewa_per_hari, stok, lokasi } = req.body;

        // Ambil pemilik_id dari header (diset oleh authMiddleware via x-user-id)
        const pemilik_id = req.headers['x-user-id'];

        if (!nama_barang || !harga_sewa_per_hari || !pemilik_id) {
            return res.status(400).json({ success: false, message: 'Nama barang, harga sewa, dan pemilik wajib diisi!' });
        }

        const newItem = await prisma.items.create({
            data: {
                nama_barang,
                deskripsi,
                harga_sewa_per_hari: parseInt(harga_sewa_per_hari, 10),
                stok: stok ? parseInt(stok, 10) : 1,
                pemilik_id,
                lokasi: lokasi || 'Tidak Diketahui'
            }
        });

        res.status(201).json({ success: true, message: 'Barang berhasil ditambahkan!', data: newItem });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// Fungsi untuk melihat semua daftar barang
exports.getAllItems = async (req, res) => {
    try {
        const items = await prisma.items.findMany();
        res.status(200).json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// Fungsi untuk mengurangi stok (endpoint HTTP — dipakai jika ada caller eksternal)
exports.reduceStock = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await reduceStock(id);
        res.status(200).json({ success: true, message: 'Stok berhasil dikurangi!', stok_sekarang: item.stok });
    } catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ success: false, message: error.message || 'Terjadi kesalahan saat update stok' });
    }
};

// Fungsi untuk mengembalikan stok (+1) saat barang selesai disewa
exports.restoreStock = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await restoreStock(id);
        res.status(200).json({ success: true, message: 'Stok berhasil dikembalikan!', stok_sekarang: item.stok });
    } catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ success: false, message: error.message || 'Terjadi kesalahan saat restore stok' });
    }
};
