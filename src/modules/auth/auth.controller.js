const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../shared/config/prisma');
const { sendEmail } = require('../notification/notification.service');
require('dotenv').config();

// ====================================================
// 1. FUNGSI REGISTRASI
// ====================================================
exports.register = async (req, res) => {
    try {
        const { nama, email, password } = req.body;

        // Cek apakah email sudah terdaftar
        const existingUser = await prisma.users.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email sudah terdaftar' });
        }

        // Hash password menggunakan bcrypt dengan cost factor 12
        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await prisma.users.create({
            data: {
                nama,
                email,
                password: hashedPassword,
                role: 'user',
                status_kyc: 'unverified'
            }
        });

        // 🔥 Kirim email selamat datang
        try {
            await sendEmail({
                email_tujuan: email,
                judul: '🎉 Selamat Datang di SewaKi!',
                isi_pesan: `Halo ${nama},\n\nTerima kasih sudah bergabung di SewaKi. Akun kamu berhasil dibuat.\n\nYuk, mulai eksplorasi aplikasi sekarang!`
            });
        } catch (emailErr) {
            console.error('Peringatan: Gagal mengirim email selamat datang:', emailErr.message);
        }

        res.status(201).json({
            success: true,
            data: {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                kyc_status: newUser.status_kyc
            },
            message: 'Register sukses'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// ====================================================
// 2. FUNGSI LOGIN
// ====================================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.users.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Email atau password salah' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Email atau password salah' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'rahasiasewaki123',
            { expiresIn: '24h' }
        );

        res.status(200).json({
            success: true,
            data: {
                token: token,
                expires_in: 86400,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server' });
    }
};

// ====================================================
// 3. FUNGSI LIHAT PROFIL
// ====================================================
exports.getProfile = async (req, res) => {
    try {
        const user = await prisma.users.findUnique({
            where: { id: req.user.id }
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        }

        // Hapus password dari respons profil
        const { password, ...userWithoutPassword } = user;

        res.status(200).json({ success: true, data: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server' });
    }
};

// ====================================================
// 4. FUNGSI UPDATE LOKASI
// ====================================================
exports.updateLokasi = async (req, res) => {
    try {
        const { id } = req.params;
        const { latitude, longitude, alamat_lengkap } = req.body;

        const user = await prisma.users.findUnique({
            where: { id }
        });
        if (!user) {
            return res.status(404).json({ success: false, message: 'Akun tidak ditemukan!' });
        }

        const updatedUser = await prisma.users.update({
            where: { id },
            data: {
                latitude,
                longitude,
                alamat_lengkap
            }
        });

        res.status(200).json({
            success: true,
            message: '📍 Titik lokasi berhasil diperbarui!',
            data: {
                nama: updatedUser.nama,
                latitude: updatedUser.latitude,
                longitude: updatedUser.longitude,
                alamat_lengkap: updatedUser.alamat_lengkap
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal mengupdate lokasi' });
    }
};
