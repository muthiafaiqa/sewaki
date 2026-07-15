const nodemailer = require('nodemailer');
const axios = require('axios');
require('dotenv').config();

// Validasi & Log Environment Variables secara aman (tanpa membocorkan kredensial)
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const resendApiKey = process.env.RESEND_API_KEY;

const maskPassword = (pass) => {
    if (!pass) return 'BELUM DIATUR';
    const cleaned = pass.replace(/\s+/g, '');
    if (cleaned.length < 4) return '***';
    return `${cleaned.substring(0, 3)}***${cleaned.substring(cleaned.length - 3)} (Panjang: ${pass.length} karakter)`;
};

console.log(`📧 [Email Config] Method: ${resendApiKey ? 'Resend (HTTP API)' : 'Gmail (SMTP)'}`);
console.log(`📧 [Email Config] Gmail User: ${emailUser || 'BELUM DIATUR'}`);
console.log(`📧 [Email Config] Gmail Pass: ${maskPassword(emailPass)}`);
console.log(`📧 [Email Config] Resend API Key: ${resendApiKey ? 'TERSEDIA' : 'BELUM DIATUR'}`);

// Konfigurasi SMTP Transporter Eksplisit (Untuk Localhost / Fallback)
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Menggunakan SSL langsung pada port 465
    auth: {
        user: emailUser,
        pass: emailPass
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000
});

/**
 * Kirim email notifikasi.
 * Mendukung Resend HTTP API (Production/Railway) & Gmail SMTP (Local/Development).
 *
 * @param {Object} param
 * @param {string} param.email_tujuan  - Alamat email penerima
 * @param {string} param.judul         - Subject email
 * @param {string} param.isi_pesan     - Body email (plain text)
 * @returns {Promise<void>}
 */
const sendEmail = async ({ email_tujuan, judul, isi_pesan }) => {
    // Jika ada RESEND_API_KEY, gunakan HTTP API (menghindari port blocking SMTP di Railway)
    if (resendApiKey) {
        try {
            await axios.post('https://api.resend.com/emails', {
                from: 'SewaKi <onboarding@resend.dev>', // Menggunakan domain default Resend
                to: email_tujuan,
                subject: judul,
                text: isi_pesan
            }, {
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`📩 [Resend API] Email berhasil dikirim ke: ${email_tujuan}`);
            return;
        } catch (apiError) {
            const errMsg = apiError.response?.data || apiError.message;
            console.error('❌ [Resend API] Gagal mengirim email:', errMsg);
            throw new Error(`Resend API Error: ${JSON.stringify(errMsg)}`);
        }
    }

    // Fallback: Gunakan Gmail SMTP (Sangat cocok untuk Localhost)
    const mailOptions = {
        from: '"SewaKi Admin" <sewaki.id@gmail.com>',
        to: email_tujuan,
        subject: judul,
        text: isi_pesan
    };

    await transporter.sendMail(mailOptions);
    console.log(`📩 [Gmail SMTP] Email berhasil dikirim ke: ${email_tujuan}`);
};

module.exports = { sendEmail };
