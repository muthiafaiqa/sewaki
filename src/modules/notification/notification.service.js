const emailjs = require('@emailjs/nodejs');
require('dotenv').config();

/**
 * Fungsi untuk mengirim email notifikasi menggunakan EmailJS
 * @param {string} emailTujuan - Alamat email user penerima
 * @param {string} judulEmail - Subject email
 * @param {string} isiPesanHTML - Desain dan isi pesan dalam format HTML
 */
const kirimEmail = async (emailTujuan, judulEmail, isiPesanHTML) => {
  try {
    const templateParams = {
      to_email: emailTujuan,     
      subject: judulEmail,       
      message: isiPesanHTML      
    };

    const response = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );

    console.log('✅ Email berhasil dikirim via EmailJS!', response.status);
    return true;
  } catch (error) {
    console.error('❌ Gagal mengirim email via EmailJS:', error);
    return false;
  }
};

/**
 * Wrapper untuk menjaga kompatibilitas dengan pemanggilan kode lama (Nodemailer/Resend)
 * @param {Object} param
 * @param {string} param.email_tujuan  - Alamat email penerima
 * @param {string} param.judul         - Subject email
 * @param {string} param.isi_pesan     - Body email (plain text/HTML)
 */
const sendEmail = async ({ email_tujuan, judul, isi_pesan }) => {
  return await kirimEmail(email_tujuan, judul, isi_pesan);
};

module.exports = { kirimEmail, sendEmail };
