const prisma = require('../../shared/config/prisma');

exports.getAdminRevenue = async (req, res) => {
    try {
        const aggregation = await prisma.transactions.aggregate({
            _sum: {
                biaya_admin: true
            },
            where: {
                status_transaksi: 'selesai'
            }
        });

        const totalPendapatanAdmin = aggregation._sum.biaya_admin || 0;

        return res.status(200).json({
            totalPendapatanAdmin
        });
    } catch (error) {
        console.error('Error fetching admin revenue:', error);
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat menghitung pendapatan admin' });
    }
};
