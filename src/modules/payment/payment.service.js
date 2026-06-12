const axios = require('axios');
require('dotenv').config();

const secret = process.env.XENDIT_SECRET_KEY || 'xnd_development_slLr35crraIL1yek6HHSOhDJvEfH5FneTWDYYLhw6kNbV9aiEsujCsnWgWJt';

/**
 * Cairkan dana ke rekening bank via Xendit API.
 * Dipanggil langsung oleh return.controller saat proses pengembalian barang —
 * tidak perlu HTTP call ke payment-service.
 *
 * @param {Object} param
 * @param {string} param.id_transaksi
 * @param {number} param.jumlah_uang
 * @param {string} param.kode_bank
 * @param {string} param.nama_pemilik_rekening
 * @param {string} param.nomor_rekening
 * @param {string} param.deskripsi
 * @param {string} [param.email_user]
 */
const disbursePayment = async ({ id_transaksi, jumlah_uang, kode_bank, nama_pemilik_rekening, nomor_rekening, deskripsi, email_user }) => {
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

    // Kirim email notifikasi jika ada email_user
    if (email_user) {
        try {
            const { sendEmail } = require('../notification/notification.service');
            await sendEmail({
                email_tujuan: email_user,
                judul: '💸 Transaksi Berhasil Dicairkan - SewaKi\'',
                isi_pesan: `Halo ${nama_pemilik_rekening},\n\nDana sebesar Rp ${jumlah_uang} telah berhasil ditransfer oleh sistem SewaKi' ke rekening ${kode_bank} (${nomor_rekening}).\n\nKeterangan: ${deskripsi || 'Pencairan dana otomatis SewaKi'}.\n\nTerima kasih telah mempercayai SewaKi'!`
            });
        } catch (emailErr) {
            console.error('Peringatan: Gagal mengirim email disbursement dari service:', emailErr.message);
        }
    }

    return response.data;
};

module.exports = { disbursePayment };
