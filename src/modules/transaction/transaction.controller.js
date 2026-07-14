const prisma = require('../../shared/config/prisma');
const { payTransaction } = require('./transaction.service');
const { reduceStock, restoreStock } = require('../item/item.service');
const { Xendit } = require('xendit-node');

const xenditSecret = process.env.XENDIT_SECRET_KEY || 'xnd_development_slLr35crraIL1yek6HHSOhDJvEfH5FneTWDYYLhw6kNbV9aiEsujCsnWgWJt';
const xenditClient = new Xendit({ secretKey: xenditSecret });

// 1. Buat transaksi baru
exports.createTransaction = async (req, res) => {
    try {
        const { item_id, tanggal_mulai, tanggal_selesai, total_harga, jaminan_deposit, biaya_admin, bank_deposit, rekening_deposit, nama_rekening_deposit } = req.body;
        const penyewa_id = req.headers['x-user-id'] || req.user?.id;

        if (!penyewa_id || !item_id || !tanggal_mulai || !tanggal_selesai || !total_harga || !jaminan_deposit) {
            return res.status(400).json({ success: false, message: 'Semua data transaksi wajib diisi!' });
        }

        // Dapatkan data penyewa
        const tenant = await prisma.users.findUnique({
            where: { id: penyewa_id }
        });
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Penyewa tidak ditemukan!' });
        }

        // 1. Validasi Hak Akses Role (Hanya user dengan role renter/user biasa yang diizinkan)
        const userRole = (tenant.role || req.user?.role || '').toLowerCase();
        if (userRole === 'pemilik' || userRole === 'owner') {
            return res.status(403).json({
                success: false,
                message: 'Akun Pemilik Barang tidak diizinkan untuk melakukan penyewaan'
            });
        }

        // Dapatkan data barang untuk pengecekan pemilik
        const item = await prisma.items.findUnique({
            where: { id: item_id }
        });
        if (!item) {
            return res.status(404).json({ success: false, message: 'Barang tidak ditemukan!' });
        }

        // 2. Validasi Pemilik Menyewa Barang Sendiri
        if (item.pemilik_id === penyewa_id) {
            return res.status(400).json({
                success: false,
                message: 'Anda tidak dapat menyewa barang milik Anda sendiri'
            });
        }

        const email_penyewa = tenant.email;

        // 🔥 Direct function call
        try {
            await reduceStock(item_id);
        } catch (itemError) {
            const status = itemError.statusCode || 500;
            return res.status(status).json({ success: false, message: itemError.message });
        }

        const hargaSewa = parseInt(total_harga, 10) || 0;
        const deposit = parseInt(jaminan_deposit, 10) || 0;
        const biayaAdmin = parseInt(biaya_admin, 10) || 0;
        const calculatedTotalHarga = hargaSewa + deposit + biayaAdmin;

        const newTransaction = await prisma.transactions.create({
            data: {
                penyewa_id,
                item_id,
                tanggal_mulai: new Date(tanggal_mulai),
                tanggal_selesai: new Date(tanggal_selesai),
                total_harga: calculatedTotalHarga,
                jaminan_deposit: deposit,
                biaya_admin: biayaAdmin,
                status_transaksi: 'menunggu_pembayaran',
                status_deposit: 'ditahan',
                persen_kerusakan: 0,
                denda_kerusakan: 0,
                denda_keterlambatan: 0,
                jumlah_refund: 0,
                bank_deposit,
                rekening_deposit,
                nama_rekening_deposit
            }
        });

        // Buat Invoice Xendit
        const invoiceResponse = await xenditClient.Invoice.createInvoice({
            data: {
                externalId: newTransaction.id,
                amount: calculatedTotalHarga,
                description: 'Pembayaran Sewa Barang',
                payerEmail: email_penyewa,
                invoiceDuration: 86400
            }
        });

        res.status(201).json({
            success: true,
            message: 'Transaksi berhasil dibuat & Stok barang dipotong!',
            data: newTransaction,
            invoice_url: invoiceResponse.invoiceUrl
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server transaksi' });
    }
};

// 2. Lihat semua riwayat transaksi
exports.getAllTransactions = async (req, res) => {
    try {
        const transactions = await prisma.transactions.findMany({
            include: {
                item: true,
                penyewa: true
            }
        });
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

        // Kirim notifikasi ke penyewa
        try {
            await prisma.notifications.create({
                data: {
                    user_id: transaction.penyewa_id,
                    title: 'Transaksi Selesai',
                    message: 'Barang telah dikembalikan ke pemilik dan status depositmu telah diperbarui. Terima kasih telah menyewa!'
                }
            });
        } catch (notifErr) {
            console.error('Peringatan: Gagal membuat notifikasi transaksi selesai:', notifErr.message);
        }

        res.status(200).json({
            success: true,
            message: 'Barang berhasil dikembalikan!',
            data: updatedTransaction
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server transaksi' });
    }
};

// 5. Ambil riwayat transaksi penyewa (my-rentals)
exports.getMyRentals = async (req, res) => {
    try {
        const penyewa_id = req.user.id;

        const transactions = await prisma.transactions.findMany({
            where: {
                penyewa_id: penyewa_id
            },
            include: {
                item: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Cek auto-expiry dan pasang invoice_url jika menunggu pembayaran
        const updatedTransactions = await Promise.all(transactions.map(async (tx) => {
            const timeDiff = Date.now() - new Date(tx.createdAt).getTime();
            if (tx.status_transaksi === 'menunggu_pembayaran' && timeDiff > 86400000) {
                // Update status ke expired
                const updatedTx = await prisma.transactions.update({
                    where: { id: tx.id },
                    data: {
                        status_transaksi: 'expired'
                    },
                    include: {
                        item: true
                    }
                });

                // Pulihkan stok barang
                try {
                    await restoreStock(tx.item_id);
                } catch (stockErr) {
                    console.error('Failed to restore stock on expiry:', stockErr);
                }
                return updatedTx;
            }

            // Tambahkan invoice_url jika menunggu pembayaran
            if (tx.status_transaksi === 'menunggu_pembayaran') {
                let invoice_url = null;
                try {
                    const invoices = await xenditClient.Invoice.getInvoices({ externalId: tx.id });
                    if (invoices && invoices.length > 0) {
                        invoice_url = invoices[0].invoiceUrl;
                    } else {
                        // Recreate invoice if not found or expired in Xendit Staging
                        const userObj = await prisma.users.findUnique({
                            where: { id: tx.penyewa_id }
                        });
                        const payerEmail = userObj?.email || 'renter@example.com';
                        
                        const newInvoice = await xenditClient.Invoice.createInvoice({
                            data: {
                                externalId: tx.id,
                                amount: tx.total_harga,
                                description: 'Pembayaran Sewa Barang (Recreated)',
                                payerEmail: payerEmail,
                                invoiceDuration: 86400
                            }
                        });
                        invoice_url = newInvoice.invoiceUrl;
                    }
                } catch (xenditErr) {
                    console.error('Error fetching invoice from Xendit:', xenditErr);
                }
                return {
                    ...tx,
                    invoice_url
                };
            }

            return tx;
        }));

        res.status(200).json(updatedTransactions);
    } catch (error) {
        console.error('Error fetching my-rentals:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server transaksi' });
    }
};

// Ambil detail satu transaksi by ID dengan auto-expiry check
exports.getTransactionById = async (req, res) => {
    try {
        const { id } = req.params;

        let transaction = await prisma.transactions.findUnique({
            where: { id },
            include: {
                item: true,
                penyewa: true
            }
        });

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Data transaksi tidak ditemukan!' });
        }

        // Cek apakah transaksi sudah kedaluwarsa (24 jam)
        const timeDiff = Date.now() - new Date(transaction.createdAt).getTime();
        if (transaction.status_transaksi === 'menunggu_pembayaran' && timeDiff > 86400000) {
            // Update status ke expired
            transaction = await prisma.transactions.update({
                where: { id },
                data: {
                    status_transaksi: 'expired'
                },
                include: {
                    item: true
                }
            });

            // Pulihkan stok barang
            try {
                await restoreStock(transaction.item_id);
            } catch (stockErr) {
                console.error('Failed to restore stock on expiry:', stockErr);
            }
        }

        // Dapatkan invoice URL jika transaksi menunggu pembayaran
        let invoice_url = null;
        if (transaction.status_transaksi === 'menunggu_pembayaran') {
            try {
                const invoices = await xenditClient.Invoice.getInvoices({ externalId: transaction.id });
                if (invoices && invoices.length > 0) {
                    invoice_url = invoices[0].invoiceUrl;
                } else {
                    // Recreate invoice if not found or expired in Xendit Staging
                    const userObj = await prisma.users.findUnique({
                        where: { id: transaction.penyewa_id }
                    });
                    const payerEmail = userObj?.email || 'renter@example.com';
                    
                    const newInvoice = await xenditClient.Invoice.createInvoice({
                        data: {
                            externalId: transaction.id,
                            amount: transaction.total_harga,
                            description: 'Pembayaran Sewa Barang (Recreated)',
                            payerEmail: payerEmail,
                            invoiceDuration: 86400
                        }
                    });
                    invoice_url = newInvoice.invoiceUrl;
                }
            } catch (xenditErr) {
                console.error('Error fetching invoice from Xendit:', xenditErr);
            }
        }

        res.status(200).json({
            success: true,
            data: {
                ...transaction,
                invoice_url
            }
        });
    } catch (error) {
        console.error('Error getting transaction:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server transaksi' });
    }
};

// 6. Selesaikan transaksi dan hitung denda otomatis
exports.completeTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { persen_kerusakan, denda_keterlambatan } = req.body;

        const transaction = await prisma.transactions.findUnique({
            where: { id },
            include: { item: true }
        });

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
        }

        if (transaction.status_transaksi !== 'menunggu_inspeksi') {
            return res.status(400).json({ success: false, message: 'Transaksi belum diverifikasi bukti pengembalian' });
        }

        const harga_barang = transaction.item.harga_sewa_per_hari;
        const persenKerusakanInt = parseInt(persen_kerusakan, 10) || 0;
        const dendaKeterlambatanInt = parseInt(denda_keterlambatan, 10) || 0;

        const denda_kerusakan = Math.round((persenKerusakanInt / 100) * harga_barang);
        
        let jumlah_refund = transaction.jaminan_deposit - denda_kerusakan - dendaKeterlambatanInt;
        if (jumlah_refund < 0) {
            jumlah_refund = 0;
        }

        const updatedTransaction = await prisma.transactions.update({
            where: { id },
            data: {
                status_transaksi: 'selesai',
                status_deposit: 'dikembalikan',
                persen_kerusakan: persenKerusakanInt,
                denda_kerusakan: denda_kerusakan,
                denda_keterlambatan: dendaKeterlambatanInt,
                jumlah_refund: jumlah_refund
            }
        });

        // Kembalikan stok barang
        await prisma.items.update({
            where: { id: transaction.item_id },
            data: {
                stok: {
                    increment: 1
                }
            }
        });

        // Kirim notifikasi ke penyewa
        try {
            await prisma.notifications.create({
                data: {
                    user_id: transaction.penyewa_id,
                    title: 'Transaksi Selesai',
                    message: 'Barang telah dikembalikan ke pemilik dan status depositmu telah diperbarui. Terima kasih telah menyewa!'
                }
            });
        } catch (notifErr) {
            console.error('Peringatan: Gagal membuat notifikasi transaksi selesai:', notifErr.message);
        }

        res.status(200).json({
            success: true,
            message: 'Transaksi berhasil diselesaikan',
            data: updatedTransaction
        });

    } catch (error) {
        console.error('Error completing transaction:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat menyelesaikan transaksi' });
    }
};

// 7. Pengajuan bukti pengembalian barang
exports.submitReturnProof = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Harap upload bukti pengembalian terlebih dahulu!' });
        }

        const transaction = await prisma.transactions.findUnique({
            where: { id }
        });

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan' });
        }

        if (transaction.status_transaksi !== 'dibayar') {
            return res.status(400).json({ success: false, message: 'Transaksi tidak dalam status dibayar / aktif' });
        }

        const updatedTransaction = await prisma.transactions.update({
            where: { id },
            data: {
                status_transaksi: 'menunggu_inspeksi',
                bukti_pengembalian: req.file.filename
            }
        });

        res.status(200).json({
            success: true,
            message: 'Bukti pengembalian berhasil diajukan, status berubah menjadi menunggu_inspeksi',
            data: updatedTransaction
        });
    } catch (error) {
        console.error('Error submitting return proof:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat mengajukan bukti pengembalian' });
    }
};
