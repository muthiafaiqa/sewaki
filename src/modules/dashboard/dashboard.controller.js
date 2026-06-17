const prisma = require('../../shared/config/prisma');

// GET /api/dashboard/stats
exports.getDashboardStats = async (req, res) => {
    try {
        const ownerId = req.headers['x-user-id'] || req.user?.id;

        if (!ownerId) {
            return res.status(401).json({ success: false, message: 'User tidak teridentifikasi!' });
        }

        // Ambil semua transaksi yang terkait dengan barang milik user (owner)
        const transactions = await prisma.transactions.findMany({
            where: {
                item: {
                    pemilik_id: ownerId
                }
            },
            include: {
                item: true
            }
        });

        let totalPendapatan = 0;
        let barangSedangKeluar = 0;
        let saldoDitahan = 0;
        let saldoBisaDicairkan = 0;
        const totalTransaksi = transactions.length;

        // Kelompokkan pendapatan per bulan
        const pendapatanPerBulan = {};

        transactions.forEach(tx => {
            if (tx.status_transaksi === 'selesai') {
                const biayaSewa = tx.total_harga - tx.jaminan_deposit - tx.biaya_admin;
                const totalDenda = (tx.denda_kerusakan || 0) + (tx.denda_keterlambatan || 0);
                const dendaBisaDiklaim = Math.min(totalDenda, tx.jaminan_deposit);
                const bersihPemilik = biayaSewa + dendaBisaDiklaim;

                totalPendapatan += bersihPemilik;
                saldoBisaDicairkan += bersihPemilik;

                const date = new Date(tx.createdAt);
                const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                
                if (!pendapatanPerBulan[yearMonth]) {
                    pendapatanPerBulan[yearMonth] = 0;
                }
                pendapatanPerBulan[yearMonth] += bersihPemilik;
            } else if (['dibayar', 'sedang_disewa', 'menunggu_inspeksi'].includes(tx.status_transaksi)) {
                saldoDitahan += tx.jaminan_deposit;
            }

            if (tx.status_transaksi === 'sedang_disewa') {
                barangSedangKeluar += 1;
            }
        });

        // Format hasil pengelompokan bulan menjadi array
        const pendapatanBulanan = Object.keys(pendapatanPerBulan).map(bulan => ({
            bulan,
            pendapatan: pendapatanPerBulan[bulan]
        })).sort((a, b) => a.bulan.localeCompare(b.bulan));

        // Hitung Rating Rata-rata dari ulasan barang milik owner
        const items = await prisma.items.findMany({
            where: { pemilik_id: ownerId }
        });
        const itemIds = items.map(i => i.id);

        let rataRating = 0;
        if (itemIds.length > 0) {
            const reviews = await prisma.reviews.findMany({
                where: {
                    item_id: { in: itemIds }
                }
            });
            if (reviews.length > 0) {
                const sumRating = reviews.reduce((sum, r) => sum + r.rating, 0);
                rataRating = parseFloat((sumRating / reviews.length).toFixed(1));
            }
        }

        // Ambil 5 transaksi terbaru
        const recentTransactions = transactions.slice(0, 5);

        return res.status(200).json({
            success: true,
            data: {
                totalPendapatan,
                barangSedangKeluar,
                totalTransaksi,
                rataRating,
                saldoDitahan,
                saldoBisaDicairkan,
                pendapatanBulanan,
                recentTransactions
            }
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server saat mengambil statistik dashboard' });
    }
};
