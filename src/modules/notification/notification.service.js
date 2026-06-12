const nodemailer = require('nodemailer');
require('dotenv').config();

// Konfigurasi transporter Gmail (sekali dibuat, digunakan di seluruh aplikasi)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'sewaki.id@gmail.com',
        pass: process.env.EMAIL_PASS || 'axefnepmzcaukize'
    }
});

/**
 * Kirim email notifikasi.
 * Dipanggil langsung oleh modul lain (auth, transaction, payment) —
 * tidak perlu HTTP request ke service terpisah.
 *
 * @param {Object} param
 * @param {string} param.email_tujuan  - Alamat email penerima
 * @param {string} param.judul         - Subject email
 * @param {string} param.isi_pesan     - Body email (plain text)
 * @returns {Promise<void>}
 */
const sendEmail = async ({ email_tujuan, judul, isi_pesan }) => {
    const mailOptions = {
        from: '"SewaKi Admin" <sewaki.id@gmail.com>',
        to: email_tujuan,
        subject: judul,
        text: isi_pesan
    };

    await transporter.sendMail(mailOptions);
    console.log(`📩 Email berhasil dikirim ke: ${email_tujuan}`);
};

module.exports = { sendEmail };
