const nodemailer = require('nodemailer');
require('dotenv').config();

// Validasi & Log Environment Variables secara aman (tanpa membocorkan kredensial)
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

const maskPassword = (pass) => {
    if (!pass) return 'BELUM DIATUR';
    const cleaned = pass.replace(/\s+/g, '');
    if (cleaned.length < 4) return '***';
    return `${cleaned.substring(0, 3)}***${cleaned.substring(cleaned.length - 3)} (Panjang: ${pass.length} karakter)`;
};

console.log(`📧 [Email Config] User: ${emailUser || 'BELUM DIATUR'}`);
console.log(`📧 [Email Config] Pass: ${maskPassword(emailPass)}`);

// Konfigurasi SMTP Transporter Eksplisit (Lebih stabil di Cloud Host seperti Railway)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Menggunakan SSL langsung pada port 465
    auth: {
        user: emailUser,
        pass: emailPass
    },
    connectionTimeout: 10000, // Timeout koneksi 10 detik
    greetingTimeout: 10000,   // Timeout sambutan SMTP 10 detik
    socketTimeout: 15000      // Timeout soket aktif 15 detik
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
