const prisma = require('../../shared/config/prisma');

/**
 * Update status transaksi menjadi 'dibayar'.
 * Dipanggil langsung oleh payment module saat webhook Xendit diterima.
 *
 * @param {string} transaction_id - UUID transaksi (= external_id Xendit)
 * @throws {Error} jika transaksi tidak ditemukan
 */
const payTransaction = async (transaction_id) => {
    const transaction = await prisma.transactions.findUnique({
        where: { id: transaction_id }
    });

    if (!transaction) {
        const err = new Error('Transaksi tidak ditemukan!');
        err.statusCode = 404;
        throw err;
    }

    const updatedTransaction = await prisma.transactions.update({
        where: { id: transaction_id },
        data: {
            status_transaksi: 'dibayar'
        }
    });

    return updatedTransaction;
};

module.exports = { payTransaction };
