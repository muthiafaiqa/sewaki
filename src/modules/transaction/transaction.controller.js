const prisma = require('../../shared/config/prisma');
const { payTransaction } = require('./transaction.service');
const { reduceStock, restoreStock } = require('../item/item.service');

// 1. Buat transaksi baru
exports.createTransaction = async (req, res) => {
    try {
        const { item_id, tanggal_mulai, tanggal_selesai, total_harga, jaminan_deposit } = req.body;
        const penyewa_id = req.headers['x-user-id'];

        if (!penyewa_id || !item_id || !tanggal_mulai || !tanggal_selesai || !total_harga || !jaminan_deposit) {
            return res.status(400).json({ success: false, message: 'Semua data transaksi wajib diisi!' });
        }

        // 🔥 Direct function call
        try {
            await reduceStock(item_id);
        } catch (itemError) {
            const status = itemError.statusCode || 500;
            return res.status(status).json({ success: false, message: itemError.message });
        }

        const newTransaction = await prisma.transactions.create({
            data: {
                penyewa_id,
                item_id,
                tanggal_mulai: new Date(tanggal_mulai),
                tanggal_selesai: new Date(tanggal_selesai),
                total_harga: parseInt(total_harga, 10),
                jaminan_deposit: parseInt(jaminan_deposit, 10),
                status_transaksi: 'menunggu_pembayaran',
                status_deposit: 'ditahan'
            }
        });

        res.status(201).json({
            success: true,
            message: 'Transaksi berhasil dibuat & Stok barang dipotong!',
            data: newTransaction
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server transaksi' });
    }
};

// 2. Lihat semua riwayat transaksi
exports.getAllTransactions = async (req, res) => {
    try {
        const transactions = await prisma.transactions.findMany();
        res.status(200).json({ success: true, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// 3. Update status menjadi 'dibayar' (dipakai jika dipanggil via REST, bukan webhook)
exports.payTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        await payTransaction(id);
        res.status(200).json({ success: true, message: 'Status transaksi berhasil diubah menjadi dibayar!' });
    } catch (error) {
        const status = error.statusCode || 500;
        res.status(status).json({ success: false, message: error.message || 'Terjadi kesalahan pada server transaksi' });
    }
};

// 4. Kembalikan barang (versi sederhana — tanpa hitung denda)
exports.returnItem = async (req, res) => {
    try {
        const { id } = req.params;

        const transaction = await prisma.transactions.findUnique({
            where: { id }
        });
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Data transaksi tidak ditemukan!' });
        }

        if (transaction.status_transaksi === 'selesai') {
            return res.status(400).json({ success: false, message: 'Transaksi ini sudah selesai!' });
        }

        // 🔥 Direct function call
        try {
            await restoreStock(transaction.item_id);
        } catch (itemError) {
            return res.status(500).json({ success: false, message: 'Gagal restore stok barang.' });
        }

        const updatedTransaction = await prisma.transactions.update({
            where: { id },
            data: {
                status_transaksi: 'selesai',
                status_deposit: 'dikembalikan'
            }
        });

        res.status(200).json({
            success: true,
            message: 'Barang berhasil dikembalikan!',
            data: updatedTransaction
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server transaksi' });
    }
};
