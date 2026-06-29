const prisma = require('../../shared/config/prisma');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ? process.env.SUPABASE_ANON_KEY.trim() : '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to resolve KTP URL from Supabase Storage (public or private bucket)
const getKtpUrl = async (filename) => {
    if (!filename) return null;
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
        return filename;
    }

    try {
        const bucketId = 'sewaki-kyc';
        // Query the database to check if the bucket is public
        const bucketRes = await prisma.$queryRawUnsafe(
            `SELECT public FROM storage.buckets WHERE id = 'sewaki-kyc' LIMIT 1`
        ).catch(() => []);

        const bucket = bucketRes && bucketRes[0];
        // Default to private if bucket info is not found or not in storage
        const isPublic = bucket ? bucket.public : false;

        if (isPublic) {
            // Public URL: https://[PROJECT_ID].supabase.co/storage/v1/object/public/[BUCKET_NAME]/[NAMA_FILE]
            return `${supabaseUrl}/storage/v1/object/public/${bucketId}/${filename}`;
        } else {
            // Private URL: create signed URL
            const { data, error } = await supabase.storage
                .from(bucketId)
                .createSignedUrl(filename, 3600); // 1 hour expiration
            
            if (error) {
                console.error('Error creating signed URL for KYC:', error);
                return filename; // Fallback to raw filename for local resolution
            }
            return data.signedUrl;
        }
    } catch (err) {
        console.error('Error in getKtpUrl helper:', err);
        return filename;
    }
};

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

        // Upload to Supabase Storage 'sewaki-kyc'
        const fileBuffer = fs.readFileSync(req.file.path);
        const { error: uploadError } = await supabase.storage
            .from('sewaki-kyc')
            .upload(req.file.filename, fileBuffer, {
                contentType: req.file.mimetype,
                upsert: true
            });
        
        if (uploadError) {
            console.error('Supabase KYC upload error:', uploadError);
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

        // Buat notifikasi baru untuk user
        await prisma.notifications.create({
            data: {
                user_id: id,
                title: status === 'verified' ? 'Verifikasi KTP Berhasil' : 'Verifikasi KTP Ditolak',
                message: status === 'verified'
                    ? 'Selamat! Akun Anda telah berhasil diverifikasi. Sekarang Anda dapat melakukan penyewaan barang.'
                    : 'Mohon maaf, verifikasi KTP Anda ditolak oleh admin. Silakan periksa kembali foto KTP Anda dan lakukan upload ulang.'
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

// Fungsi untuk Admin mendapatkan daftar semua user beserta status KYC mereka
exports.getKycList = async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Akses ditolak. Hanya Admin yang diizinkan!' });
        }

        const users = await prisma.users.findMany({
            select: {
                id: true,
                nama: true,
                email: true,
                status_kyc: true,
                foto_ktp: true
            }
        });

        const mappedUsers = await Promise.all(users.map(async (user) => {
            let ktpUrl = null;
            if (user.foto_ktp) {
                ktpUrl = await getKtpUrl(user.foto_ktp);
            }
            return {
                ...user,
                foto_ktp: ktpUrl
            };
        }));

        res.status(200).json({ success: true, data: mappedUsers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal mendapatkan daftar pengajuan KYC' });
    }
};

// Fungsi untuk Admin menolak KTP (mengubah status menjadi 'rejected')
exports.rejectKyc = async (req, res) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Akses ditolak. Hanya Admin yang diizinkan!' });
        }

        const { id } = req.params;

        const user = await prisma.users.findUnique({
            where: { id }
        });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan!' });
        }

        const updatedUser = await prisma.users.update({
            where: { id },
            data: {
                status_kyc: 'rejected'
            }
        });

        // Buat notifikasi baru untuk user
        await prisma.notifications.create({
            data: {
                user_id: id,
                title: 'Verifikasi KTP Ditolak',
                message: 'Mohon maaf, verifikasi KTP Anda ditolak oleh admin. Silakan periksa kembali foto KTP Anda dan lakukan upload ulang.'
            }
        });

        res.status(200).json({
            success: true,
            message: `Verifikasi KTP untuk ${updatedUser.nama} (${updatedUser.role}) BERHASIL di-update menjadi: REJECTED!`,
            data: {
                id: updatedUser.id,
                nama: updatedUser.nama,
                role: updatedUser.role,
                status_kyc: updatedUser.status_kyc
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal memproses penolakan KTP' });
    }
};


