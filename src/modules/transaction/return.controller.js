const prisma = require('../../shared/config/prisma');
const { restoreStock } = require('../item/item.service');
const { sendEmail } = require('../notification/notification.service');
require('dotenv').config();

/**
 * Proses pengembalian barang lengkap:
 * 1. Restore stok item (direct function call)
 * 2. Hitung denda keterlambatan & kerusakan
 * 3. Cairkan dana refund via payment module (direct function call)
 * 4. Kirim email notifikasi (direct function call)
 * 5. Update status transaksi ke database
 */
exports.returnItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { persen_kerusakan, kode_bank, nama_pemilik_rekening, nomor_rekening, email_user } = req.body;

        const transaction = await prisma.transactions.findUnique({
            where: { id }
        });
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan!' });
        }

        if (transaction.status_transaksi === 'selesai' || transaction.status_transaksi === 'completed') {
            return res.status(400).json({ success: false, message: 'Transaksi ini sudah selesai sebelumnya!' });
        }

        // 1. RESTORE STOK ITEM
        try {
            await restoreStock(transaction.item_id);
            console.log('✅ Stok barang berhasil di-restore.');
        } catch (itemError) {
            console.error('Gagal restore stok:', itemError.message);
            return res.status(500).json({ success: false, message: 'Gagal menghubungkan ke Item Module' });
        }

        // 2. HITUNG DENDA & REFUND DEPOSIT
        const waktuSekarang = new Date();
        const tanggalSelesaiSewa = new Date(transaction.tanggal_selesai);
        let dendaKeterlambatan = 0;

        if (waktuSekarang > tanggalSelesaiSewa) {
            const selisihWaktu = waktuSekarang - tanggalSelesaiSewa;
            const selisihHari = Math.ceil(selisihWaktu / (1000 * 60 * 60 * 24));
            if (selisihHari > 0) dendaKeterlambatan = selisihHari * 50000;
        }

        const uangDeposit = transaction.jaminan_deposit;
        const kerusakanPersen = persen_kerusakan ? parseInt(persen_kerusakan, 10) : 0;
        const dendaKerusakan = (kerusakanPersen / 100) * uangDeposit;
        const totalDenda = dendaKeterlambatan + dendaKerusakan;

        let jumlahRefund = uangDeposit - totalDenda;
        if (jumlahRefund < 0) jumlahRefund = 0;

        const emailTarget = email_user || transaction.email_penyewa;

        // 3. CAIRKAN DANA REFUND via payment module
        if (jumlahRefund > 0 && kode_bank && nama_pemilik_rekening && nomor_rekening) {
            try {
                const { disbursePayment } = require('../payment/payment.service');
                await disbursePayment({
                    id_transaksi: id,
                    jumlah_uang: jumlahRefund,
                    kode_bank,
                    nama_pemilik_rekening,
                    nomor_rekening,
                    deskripsi: `Refund Sisa Deposit SewaKi' (ID: ${id})`,
                    email_user: emailTarget
                });
                console.log('✅ Uang refund berhasil dikirim via Xendit!');
            } catch (xenditError) {
                console.error('❌ Gagal mencairkan dana:', xenditError.message);
            }
        }

        // 4. UPDATE STATUS KE DATABASE
        const updatedTransaction = await prisma.transactions.update({
            where: { id },
            data: {
                persen_kerusakan: kerusakanPersen,
                denda_kerusakan: parseInt(dendaKerusakan, 10),
                denda_keterlambatan: parseInt(dendaKeterlambatan, 10),
                jumlah_refund: parseInt(jumlahRefund, 10),
                status_transaksi: 'selesai',
                status_deposit: 'dikembalikan'
            }
        });

        // 5. EMAIL NOTIFIKASI PENGEMBALIAN
        if (emailTarget) {
            try {
                await sendEmail({
                    email_tujuan: emailTarget,
                    judul: '📦 Pengembalian Barang Berhasil - SewaKi\'',
                    isi_pesan: `Halo,\n\nBarang sewaan Kamu untuk Transaksi ID: ${id} telah BERHASIL dikembalikan dan dikonfirmasi oleh pemilik.\n\nRincian Nota Pengembalian:\n- Jaminan Deposit: Rp ${uangDeposit}\n- Denda Keterlambatan: Rp ${dendaKeterlambatan}\n- Denda Kerusakan (${kerusakanPersen}%): Rp ${dendaKerusakan}\n---------------------------------------\n- Total Dana Refund Deposit: Rp ${jumlahRefund}\n\n${jumlahRefund > 0 ? 'Sisa dana deposit Kamu sedang ditransfer otomatis ke rekening oleh sistem Xendit SewaKi\'.' : 'Dana deposit Kamu habis digunakan untuk menutupi biaya denda.'}\n\nTerima kasih telah menjaga produk sewaan dengan baik!`
                });
                console.log(`📡 Email pengembalian sukses dikirim ke: ${emailTarget}`);
            } catch (emailErr) {
                console.error('Peringatan: Gagal mengirim email pengembalian:', emailErr.message);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Ajaib! Barang kembali, stok nambah, dan uang refund OTOMATIS cair!',
            Rincian: {
                deposit_awal: uangDeposit,
                denda_telat: dendaKeterlambatan,
                denda_rusak: dendaKerusakan,
                total_potongan: totalDenda,
                uang_kembali_ke_penyewa: jumlahRefund,
                status_transaksi: updatedTransaction.status_transaksi,
                status_deposit: updatedTransaction.status_deposit
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal memproses pengembalian barang' });
    }
};
