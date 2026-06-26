const prisma = require('../../shared/config/prisma');
const { reduceStock, restoreStock } = require('./item.service');

// Fungsi untuk menambah barang baru
exports.createItem = async (req, res) => {
    try {
        const { nama_barang, deskripsi, harga_sewa_per_hari, stok, lokasi, deposit } = req.body;

        // Ambil pemilik_id dari header (diset oleh authMiddleware via x-user-id)
        const pemilik_id = req.headers['x-user-id'];

        if (!nama_barang || !harga_sewa_per_hari || !pemilik_id) {
            return res.status(400).json({ success: false, message: 'Nama barang, harga sewa, dan pemilik wajib diisi!' });
        }

        const namaFoto = req.files && req.files.length > 0 ? req.files[0].filename : null;
        const parsedDeposit = parseInt(deposit, 10);
        const depositVal = isNaN(parsedDeposit) ? 0 : parsedDeposit;

        const newItem = await prisma.items.create({
            data: {
                nama_barang,
                deskripsi,
                harga_sewa_per_hari: parseInt(harga_sewa_per_hari, 10),
                stok: stok ? parseInt(stok, 10) : 1,
                pemilik_id,
                lokasi: lokasi || 'Tidak Diketahui',
                foto_barang: namaFoto,
                deposit: depositVal
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
        const { search } = req.query;
        const where = {
            is_active: true,
            ...(search ? { nama_barang: { contains: search, mode: 'insensitive' } } : {})
        };

        const items = await prisma.items.findMany({ where });
        res.status(200).json({ success: true, data: items });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// Fungsi untuk melihat detail satu barang spesifik berdasarkan ID
exports.getItemById = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await prisma.items.findUnique({
            where: { id }
        });

        if (!item) {
            return res.status(404).json({ success: false, message: 'Barang tidak ditemukan!' });
        }

        // Ambil data pemilik dari tabel users
        let pemilik = null;
        if (item.pemilik_id) {
            pemilik = await prisma.users.findUnique({
                where: { id: item.pemilik_id },
                select: {
                    id: true,
                    nama: true,
                    email: true,
                    role: true
                }
            });
        }

        // Pasang data Pemilik dengan dummy nomor_hp untuk testing
        const responseData = {
            ...item,
            Pemilik: pemilik ? {
                ...pemilik,
                nomor_hp: '081234567890'
            } : null
        };

        res.status(200).json({ success: true, data: responseData });
    } catch (error) {
        console.error(error);
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

// Fungsi untuk menghapus barang
exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;

        const item = await prisma.items.findFirst({
            where: { id, is_active: true }
        });

        if (!item) {
            return res.status(404).json({ success: false, message: 'Barang tidak ditemukan!' });
        }

        await prisma.items.update({
            where: { id },
            data: { is_active: false }
        });

        res.status(200).json({ success: true, message: 'Barang berhasil dihapus!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat menghapus barang' });
    }
};
