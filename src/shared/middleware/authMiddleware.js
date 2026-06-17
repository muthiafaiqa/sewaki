const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Middleware untuk verifikasi JWT token.
 * Menggabungkan fungsi dari identity-service/src/middlewares/authMiddleware.js
 * dan api-gateway/src/middleware/auth.js.
 *
 * Setelah verifikasi berhasil, menyimpan data user di:
 * - req.user         (id, role)
 * - req.headers['x-user-id'] (untuk kompatibilitas dengan controller)
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Akses ditolak. Token tidak ditemukan!'
        });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'rahasiasewaki123');
        req.user = verified;
        req.headers['x-user-id'] = verified.id; // Agar controller tetap bisa baca x-user-id
        next();
    } catch (error) {
        res.status(400).json({ success: false, message: 'Token tidak valid atau sudah kadaluarsa!' });
    }
};

const verifyAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Akses ditolak. Hanya Admin yang diizinkan!'
        });
    }
};

const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Akses ditolak. Token tidak ditemukan atau tidak valid!'
            });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Akses ditolak. Peran Anda tidak diizinkan!'
            });
        }
        next();
    };
};

verifyToken.verifyAdmin = verifyAdmin;
verifyToken.checkRole = checkRole;

module.exports = verifyToken;
