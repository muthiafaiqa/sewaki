const { Xendit } = require('xendit-node');
const axios = require('axios');
const { sendEmail } = require('../notification/notification.service');
const prisma = require('../../shared/config/prisma');
require('dotenv').config();

const secret = process.env.XENDIT_SECRET_KEY || 'xnd_development_slLr35crraIL1yek6HHSOhDJvEfH5FneTWDYYLhw6kNbV9aiEsujCsnWgWJt';
const xenditClient = new Xendit({ secretKey: secret });

// ==========================================
// RUTE 1: Membuat Tagihan (Invoice / Uang Masuk)
// ==========================================
exports.createInvoice = async (req, res) => {
    try {
        const { id_transaksi, total_bayar, deskripsi, email_penyewa } = req.body;

        const response = await xenditClient.Invoice.createInvoice({
            data: {
                externalId: id_transaksi,
                amount: total_bayar,
                description: deskripsi,
                payerEmail: email_penyewa,
                invoiceDuration: 86400
            }
        });

        res.status(201).json({
            success: true,
            checkout_url: response.invoiceUrl
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal membuat tagihan.' });
    }
};

// ==========================================
// RUTE 2: Webhook (Penerima Sinyal dari Xendit)
// ==========================================
exports.webhook = async (req, res) => {
    try {
        const { external_id, status } = req.body;

        if (status === 'PAID') {
            try {
                const updatedTransaction = await prisma.transactions.update({
                    where: { id: external_id },
                    data: {
                        status_transaksi: 'dibayar'
                    },
                    include: {
                        item: true
                    }
                });

                if (updatedTransaction && updatedTransaction.item) {
                    await prisma.notifications.create({
                        data: {
                            user_id: updatedTransaction.item.pemilik_id,
                            title: 'Pembayaran Berhasil',
                            message: 'Pesanan baru telah dibayar. Segera siapkan barang untuk penyerahan.'
                        }
                    });
                }
            } catch (err) {
                console.error('Error updating transaction (invalid ID format):', err.message);
                return res.status(400).json({ success: false, message: "Invalid transaction ID format" });
            }
        }

        return res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        return res.status(500).json({ message: 'Gagal memproses webhook' });
    }
};

// ==========================================
// RUTE 3: Pencairan Dana (Disbursement / Uang Keluar)
// ==========================================
exports.disburse = async (req, res) => {
    try {
        const { id_transaksi, jumlah_uang, kode_bank, nama_pemilik_rekening, nomor_rekening, deskripsi, email_user } = req.body;

        if (!jumlah_uang || !kode_bank || !nama_pemilik_rekening || !nomor_rekening) {
            return res.status(400).json({ success: false, message: 'Data rekening tujuan tidak lengkap!' });
        }

        const secretKeyWithColon = secret + ':';
        const base64Key = Buffer.from(secretKeyWithColon).toString('base64');

        const response = await axios.post('https://api.xendit.co/disbursements', {
            external_id: `disb-${id_transaksi}-${Date.now()}`,
            amount: jumlah_uang,
            bank_code: kode_bank,
            account_holder_name: nama_pemilik_rekening,
            account_number: nomor_rekening,
            description: deskripsi
        }, {
            headers: {
                'Authorization': `Basic ${base64Key}`,
                'Content-Type': 'application/json'
            }
        });

        // 🔥 Direct function call — ganti fetch ke notification-service
        if (email_user) {
            try {
                await sendEmail({
                    email_tujuan: email_user,
                    judul: '💸 Transaksi Berhasil Dicairkan - SewaKi\'',
                    isi_pesan: `Halo ${nama_pemilik_rekening},\n\nDana sebesar Rp ${jumlah_uang} telah berhasil ditransfer oleh sistem SewaKi' ke rekening ${kode_bank} (${nomor_rekening}).\n\nKeterangan: ${deskripsi || 'Pencairan dana otomatis SewaKi'}.\n\nTerima kasih telah mempercayai SewaKi'!`
                });
                console.log(`📡 Email disbursement berhasil dikirim ke: ${email_user}`);
            } catch (emailErr) {
                console.error('Peringatan: Gagal mengirim email disbursement:', emailErr.message);
            }
        }

        res.status(200).json({
            success: true,
            message: 'Yeay! Permintaan pencairan dana berhasil dikirim ke Xendit!',
            data_xendit: response.data
        });

    } catch (error) {
        console.error('============= ERROR PADA SAAT PENCAIRAN =============');
        console.error(error.response?.data || error.message);
        console.error('=====================================================');
        res.status(500).json({
            success: false,
            message: 'Gagal melakukan pencairan dana',
            error_detail: error.response?.data?.message || 'Terjadi kesalahan sistem'
        });
    }
};

// ==========================================
// RUTE 4: Pengembalian Deposit (Disbursement)
// ==========================================
exports.disburseDeposit = async (req, res) => {
    try {
        const { id_transaksi } = req.body;

        if (!id_transaksi) {
            return res.status(400).json({ success: false, message: 'id_transaksi wajib diisi!' });
        }

        // Ambil data transaksi dari database
        const transaction = await prisma.transactions.findUnique({
            where: { id: id_transaksi }
        });

        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan!' });
        }

        const { bank_deposit, rekening_deposit, nama_rekening_deposit, jaminan_deposit } = transaction;

        // Jika ada data rekening yang kosong/null di database, kembalikan res.status(400)
        if (!bank_deposit || !rekening_deposit || !nama_rekening_deposit) {
            return res.status(400).json({
                success: false,
                message: 'Data rekening deposit tidak lengkap di database!'
            });
        }

        const secretKeyWithColon = secret + ':';
        const base64Key = Buffer.from(secretKeyWithColon).toString('base64');

        const response = await axios.post('https://api.xendit.co/disbursements', {
            external_id: `disb-${id_transaksi}-${Date.now()}`,
            amount: parseInt(jaminan_deposit, 10),
            bank_code: bank_deposit,
            account_number: rekening_deposit,
            account_holder_name: nama_rekening_deposit,
            description: `Pengembalian Uang Deposit Transaksi ${id_transaksi}`
        }, {
            headers: {
                'Authorization': `Basic ${base64Key}`,
                'Content-Type': 'application/json'
            }
        });

        const xenditData = response.data;

        if (xenditData.status === 'PENDING' || xenditData.status === 'COMPLETED') {
            await prisma.transactions.update({
                where: { id: id_transaksi },
                data: {
                    status_deposit: 'dikembalikan'
                }
            });
            return res.status(200).json({ success: true, message: 'Deposit berhasil dicairkan' });
        }

        return res.status(400).json({ success: false, message: 'Disbursement gagal di Xendit', data: xenditData });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message || 'Terjadi kesalahan di server' });
    }
};
