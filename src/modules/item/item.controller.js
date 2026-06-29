const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const prisma = require('../../shared/config/prisma');
const { reduceStock, restoreStock } = require('./item.service');

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.trim() : '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Fungsi untuk menambah barang baru
exports.createItem = async (req, res) => {
    try {
        const { nama_barang, deskripsi, harga_sewa_per_hari, stok, lokasi, deposit } = req.body;

        // Ambil pemilik_id dari header (diset oleh authMiddleware via x-user-id)
        const pemilik_id = req.headers['x-user-id'];

        if (!nama_barang || !harga_sewa_per_hari || !pemilik_id) {
            return res.status(400).json({ success: false, message: 'Nama barang, harga sewa, dan pemilik wajib diisi!' });
        }

        let foto_barang = null;
        let file = null;

        if (req.file) {
            file = req.file;
        } else if (req.files && req.files.length > 0) {
            file = req.files[0];
        }

        if (file) {
            const fileExt = path.extname(file.originalname);
            const fileName = `item-${Date.now()}${fileExt}`;

            const { data, error: uploadError } = await supabase.storage
                .from('sewaki-images')
                .upload(fileName, file.buffer, {
                    contentType: file.mimetype,
                    upsert: false
                });

            if (uploadError) {
                console.error('Supabase upload error:', uploadError);
                return res.status(500).json({ success: false, message: 'Gagal mengunggah gambar ke Supabase Storage' });
            }

            const { data: publicUrlData } = supabase.storage
                .from('sewaki-images')
                .getPublicUrl(fileName);

            foto_barang = publicUrlData.publicUrl;
        }

        const parsedDeposit = parseInt(deposit, 10);
        const depositVal = isNaN(parsedDeposit) ? 0 : parsedDeposit;

        // Cari barang dengan nama dan pemilik yang sama untuk menghindari duplikasi (upsert)
        const existingItem = await prisma.items.findFirst({
            where: {
                nama_barang,
                pemilik_id
            }
        });

        let savedItem;
        if (existingItem) {
            savedItem = await prisma.items.update({
                where: { id: existingItem.id },
                data: {
                    deskripsi,
                    harga_sewa_per_hari: parseInt(harga_sewa_per_hari, 10),
                    stok: stok ? parseInt(stok, 10) : 1,
                    lokasi: lokasi || 'Tidak Diketahui',
                    foto_barang: foto_barang || existingItem.foto_barang,
                    deposit: depositVal,
                    is_active: true // Aktifkan kembali jika sebelumnya ter-delete
                }
            });
        } else {
            savedItem = await prisma.items.create({
                data: {
                    nama_barang,
                    deskripsi,
                    harga_sewa_per_hari: parseInt(harga_sewa_per_hari, 10),
                    stok: stok ? parseInt(stok, 10) : 1,
                    pemilik_id,
                    lokasi: lokasi || 'Tidak Diketahui',
                    foto_barang,
                    deposit: depositVal
                }
            });
        }

        res.status(existingItem ? 200 : 201).json({ 
            success: true, 
            message: existingItem ? 'Barang berhasil diperbarui!' : 'Barang berhasil ditambahkan!', 
            data: savedItem 
        });
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
        const loggedInUserId = req.user?.id || req.headers['x-user-id'];

        if (!loggedInUserId) {
            return res.status(401).json({ success: false, message: 'Akses ditolak. Token tidak ditemukan atau tidak valid!' });
        }

        const item = await prisma.items.findFirst({
            where: { id, is_active: true }
        });

        if (!item) {
            return res.status(404).json({ success: false, message: 'Barang tidak ditemukan!' });
        }

        // 1. Otorisasi Pemilik: Pastikan hanya pemilik barang yang bisa menghapusnya
        if (item.pemilik_id !== loggedInUserId) {
            return res.status(403).json({ success: false, message: 'Akses ditolak. Anda bukan pemilik barang ini!' });
        }

        // 2. Proteksi Transaksi Aktif: Cek status transaksi yang masih berjalan
        const activeTransaction = await prisma.transactions.findFirst({
            where: {
                item_id: id,
                status_transaksi: {
                    in: ['menunggu_pembayaran', 'dibayar', 'menunggu_inspeksi', 'DISPUTED', 'disputed', 'Disputed']
                }
            }
        });

        if (activeTransaction) {
            return res.status(400).json({
                success: false,
                message: 'Barang tidak bisa dihapus karena sedang dalam proses penyewaan aktif.'
            });
        }

        // 3. Eksekusi: Hapus dari database.
        // Jika terdapat riwayat transaksi lampau, lakukan soft delete agar tidak melanggar constraint relasi di database.
        try {
            await prisma.items.delete({
                where: { id }
            });
        } catch (dbError) {
            // Fallback ke soft delete jika gagal karena relasi foreign key
            await prisma.items.update({
                where: { id },
                data: { is_active: false }
            });
        }

        res.status(200).json({ success: true, message: 'Barang berhasil dihapus!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat menghapus barang' });
    }
};

// Fungsi untuk mengambil daftar tanggal yang sudah di-booking
exports.getBookedDates = async (req, res) => {
    try {
        const { id } = req.params;

        // Cari item untuk memastikan item tersebut ada
        const item = await prisma.items.findFirst({
            where: { id, is_active: true }
        });

        if (!item) {
            return res.status(404).json({ success: false, message: 'Barang tidak ditemukan!' });
        }

        // Cari transaksi dengan status aktif/sah (bukan expired/menunggu_pembayaran)
        const transactions = await prisma.transactions.findMany({
            where: {
                item_id: id,
                status_transaksi: {
                    in: ['dibayar', 'menunggu_inspeksi', 'selesai', 'DISPUTED', 'disputed', 'Disputed', 'CLOSED']
                }
            },
            select: {
                tanggal_mulai: true,
                tanggal_selesai: true
            }
        });

        // Format tanggal menjadi YYYY-MM-DD
        const bookedDates = transactions.map(tx => {
            const start = tx.tanggal_mulai.toISOString().split('T')[0];
            const end = tx.tanggal_selesai.toISOString().split('T')[0];
            return { start, end };
        });

        res.status(200).json({ success: true, data: bookedDates });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat mengambil tanggal booking' });
    }
};
