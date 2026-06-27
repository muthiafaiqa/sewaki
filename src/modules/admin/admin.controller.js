const prisma = require('../../shared/config/prisma');

exports.getAdminRevenue = async (req, res) => {
    try {
        const aggregation = await prisma.transactions.aggregate({
            _sum: {
                biaya_admin: true
            },
            where: {
                status_transaksi: 'selesai'
            }
        });

        const totalPendapatanAdmin = aggregation._sum.biaya_admin || 0;

        return res.status(200).json({
            totalPendapatanAdmin
        });
    } catch (error) {
        console.error('Error fetching admin revenue:', error);
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat menghitung pendapatan admin' });
    }
};

// GET /api/admin/disputes — Mengambil semua transaksi dengan status_transaksi 'DISPUTED'
exports.getDisputes = async (req, res) => {
    try {
        const disputes = await prisma.transactions.findMany({
            where: {
                status_transaksi: {
                    in: ['DISPUTED', 'disputed', 'Disputed']
                }
            },
            include: {
                item: true
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        // Enrich dengan data penyewa & pemilik barang
        const enrichedDisputes = await Promise.all(disputes.map(async (tx) => {
            const penyewa = await prisma.users.findUnique({
                where: { id: tx.penyewa_id },
                select: { id: true, nama: true, email: true, nomor_hp: true }
            });

            let pemilik = null;
            if (tx.item && tx.item.pemilik_id) {
                pemilik = await prisma.users.findUnique({
                    where: { id: tx.item.pemilik_id },
                    select: { id: true, nama: true, email: true, nomor_hp: true }
                });
            }

            return {
                ...tx,
                penyewa,
                pemilik
            };
        }));

        return res.status(200).json({
            success: true,
            data: enrichedDisputes
        });
    } catch (error) {
        console.error('Error fetching disputes:', error);
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat mengambil laporan sengketa' });
    }
};

// PATCH/PUT /api/admin/disputes/:id/resolve — Aksi mediasi laporan sengketa oleh admin
exports.resolveDispute = async (req, res) => {
    try {
        const { id } = req.params;
        const { keputusan, nominal_final_denda } = req.body;

        if (!keputusan || !['tolak_komplain', 'terima_komplain'].includes(keputusan)) {
            return res.status(400).json({
                success: false,
                message: 'Keputusan tidak valid! Harap pilih "tolak_komplain" atau "terima_komplain".'
            });
        }

        const transaction = await prisma.transactions.findUnique({
            where: { id },
            include: { item: true }
        });

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaksi sengketa tidak ditemukan!' });
        }

        const depositAwal = transaction.jaminan_deposit || 0;
        let finalDenda = 0;

        if (nominal_final_denda !== undefined && nominal_final_denda !== null && !isNaN(nominal_final_denda)) {
            finalDenda = Math.max(0, parseInt(nominal_final_denda, 10));
        } else if (keputusan === 'tolak_komplain') {
            finalDenda = (transaction.denda_kerusakan || 0) + (transaction.denda_keterlambatan || 0);
        } else {
            finalDenda = 0;
        }

        let jumlahRefund = depositAwal - finalDenda;
        if (jumlahRefund < 0) jumlahRefund = 0;

        // Dapatkan data penyewa untuk transfer & notifikasi email
        const tenant = await prisma.users.findUnique({
            where: { id: transaction.penyewa_id }
        });
        const emailPenyewa = tenant ? tenant.email : null;

        // Pemicu logika pencairan dana sisa deposit ke penyewa via payment module
        if (jumlahRefund > 0 && transaction.bank_deposit && transaction.rekening_deposit && transaction.nama_rekening_deposit) {
            try {
                const { disbursePayment } = require('../payment/payment.service');
                await disbursePayment({
                    id_transaksi: id,
                    jumlah_uang: jumlahRefund,
                    kode_bank: transaction.bank_deposit,
                    nama_pemilik_rekening: transaction.nama_rekening_deposit,
                    nomor_rekening: transaction.rekening_deposit,
                    deskripsi: `Refund Mediasi Sengketa SewaKi (ID: ${id})`,
                    email_user: emailPenyewa
                });
                console.log('✅ Uang refund deposit berhasil dicairkan via Xendit!');
            } catch (xenditError) {
                console.error('❌ Gagal mencairkan dana sisa deposit:', xenditError.message);
            }
        }

        // Update status transaksi menjadi CLOSED dan status deposit
        const updatedTransaction = await prisma.transactions.update({
            where: { id },
            data: {
                status_transaksi: 'CLOSED',
                status_deposit: jumlahRefund > 0 ? 'dikembalikan' : 'dicairkan',
                denda_kerusakan: finalDenda,
                jumlah_refund: jumlahRefund
            }
        });

        // Restore stok barang jika memungkinkan
        try {
            await prisma.items.update({
                where: { id: transaction.item_id },
                data: { stok: { increment: 1 } }
            });
        } catch (stockErr) {
            console.log('Update stok info:', stockErr.message);
        }

        // Kirim notifikasi ke penyewa dan pemilik
        try {
            const notifPenyewa = keputusan === 'terima_komplain'
                ? `Laporan komplain Anda untuk transaksi #${id.substring(0, 8)} telah DITERIMA oleh Admin. Deposit yang dikembalikan: Rp ${jumlahRefund.toLocaleString('id-ID')}.`
                : `Laporan komplain Anda untuk transaksi #${id.substring(0, 8)} telah DITOLAK oleh Admin. Denda final disesuaikan: Rp ${finalDenda.toLocaleString('id-ID')}.`;

            await prisma.notifications.create({
                data: {
                    user_id: transaction.penyewa_id,
                    title: '⚖️ Hasil Mediasi Sengketa',
                    message: notifPenyewa
                }
            });

            if (transaction.item && transaction.item.pemilik_id) {
                const notifPemilik = keputusan === 'terima_komplain'
                    ? `Admin memenangkan komplain penyewa untuk transaksi #${id.substring(0, 8)}. Status transaksi kini CLOSED.`
                    : `Admin menolak komplain penyewa untuk transaksi #${id.substring(0, 8)}. Denda final: Rp ${finalDenda.toLocaleString('id-ID')}. Status transaksi kini CLOSED.`;

                await prisma.notifications.create({
                    data: {
                        user_id: transaction.item.pemilik_id,
                        title: '⚖️ Hasil Mediasi Sengketa',
                        message: notifPemilik
                    }
                });
            }
        } catch (notifErr) {
            console.error('Peringatan: Gagal membuat notifikasi mediasi:', notifErr.message);
        }

        return res.status(200).json({
            success: true,
            message: `Sengketa berhasil diselesaikan dengan keputusan: ${keputusan}. Transaksi telah di-update menjadi CLOSED.`,
            data: updatedTransaction
        });
    } catch (error) {
        console.error('Error resolving dispute:', error);
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat memproses mediasi sengketa' });
    }
};
