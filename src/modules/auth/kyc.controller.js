const prisma = require('../../shared/config/prisma');

// Fungsi untuk User mengunggah KTP
exports.uploadKtp = async (req, res) => {
    try {
        const userId = req.body.user_id;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Harap pilih foto KTP terlebih dahulu!' });
        }

        const user = await prisma.users.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan!' });
        }

        const updatedUser = await prisma.users.update({
            where: { id: userId },
            data: {
                foto_ktp: req.file.filename,
                status_kyc: 'pending'
            }
        });

        res.status(200).json({
            success: true,
            message: 'KTP berhasil diupload! Status KYC kamu sekarang: PENDING.',
            nama_file: req.file.filename
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal mengupload KTP' });
    }
};

// Fungsi untuk Admin melakukan ACC / Tolak KTP
exports.verifyKyc = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Status harus diisi 'verified' atau 'rejected'!"
            });
        }

        const user = await prisma.users.findUnique({
            where: { id }
        });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan!' });
        }

        const updatedUser = await prisma.users.update({
            where: { id },
            data: {
                status_kyc: status
            }
        });

        res.status(200).json({
            success: true,
            message: `Verifikasi KTP untuk ${updatedUser.nama} (${updatedUser.role}) BERHASIL di-update menjadi: ${status.toUpperCase()}!`,
            data: {
                id: updatedUser.id,
                nama: updatedUser.nama,
                role: updatedUser.role,
                status_kyc: updatedUser.status_kyc
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal memproses verifikasi KTP' });
    }
};
