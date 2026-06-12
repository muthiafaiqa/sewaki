const { Xendit } = require('xendit-node');
const axios = require('axios');
const { sendEmail } = require('../notification/notification.service');
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
        const { external_id, status, payer_email, amount } = req.body;

        console.log(`\n🔔 BEEP! Ada pemberitahuan masuk dari Xendit!`);
        console.log(`Transaksi ID: ${external_id}, Status: ${status}`);

        if (status === 'PAID') {
            console.log(`✅ Uang masuk ke Rekber SewaKi'.`);

            // 🔥 Direct function call — ganti axios.put ke transaction-service
            try {
                const { payTransaction } = require('../transaction/transaction.service');
                await payTransaction(external_id);
                console.log(`✅ Status transaksi ${external_id} berhasil diupdate menjadi 'dibayar'.`);
            } catch (err) {
                console.error(`❌ Gagal update status transaksi:`, err.message);
            }

            // 🔥 Direct function call — ganti fetch ke notification-service
            if (payer_email) {
                try {
                    await sendEmail({
                        email_tujuan: payer_email,
                        judul: '🧾 Pembayaran Berhasil (Sewa + Deposit) - SewaKi\'',
                        isi_pesan: `Halo,\n\nPembayaran Kamu untuk Transaksi ID: ${external_id} sebesar Rp ${amount} telah BERHASIL kami verifikasi.\n\nStatus: LUNAS (Biaya Sewa & Deposit Berhasil Diamankan).\n\nSilakan cek aplikasi untuk melihat detail barang dan hubungi pemilik barang untuk mengatur penjemputan.\n\nTerima kasih telah menggunakan SewaKi'!`
                    });
                    console.log(`📡 Email pembayaran sukses dikirim ke: ${payer_email}`);
                } catch (emailErr) {
                    console.error('Peringatan: Gagal mengirim email notifikasi pembayaran:', emailErr.message);
                }
            }
        }

        res.status(200).json({ success: true, message: 'Webhook berhasil diterima' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memproses webhook' });
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
