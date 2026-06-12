const prisma = require('../../shared/config/prisma');

/**
 * Kurangi stok barang sebanyak 1.
 * Dipanggil langsung oleh transaction module.
 *
 * @param {string} item_id - UUID barang
 * @throws {Error} jika barang tidak ditemukan atau stok habis
 */
const reduceStock = async (item_id) => {
    const item = await prisma.items.findUnique({
        where: { id: item_id }
    });

    if (!item) {
        const err = new Error('Barang tidak ditemukan!');
        err.statusCode = 404;
        throw err;
    }

    if (item.stok <= 0) {
        const err = new Error('Duh, stok barang ini sudah habis!');
        err.statusCode = 400;
        throw err;
    }

    const updatedItem = await prisma.items.update({
        where: { id: item_id },
        data: {
            stok: {
                decrement: 1
            }
        }
    });

    return updatedItem;
};

/**
 * Kembalikan stok barang sebanyak 1 (setelah barang selesai disewa).
 * Dipanggil langsung oleh transaction module.
 *
 * @param {string} item_id - UUID barang
 * @throws {Error} jika barang tidak ditemukan
 */
const restoreStock = async (item_id) => {
    const item = await prisma.items.findUnique({
        where: { id: item_id }
    });

    if (!item) {
        const err = new Error('Barang tidak ditemukan!');
        err.statusCode = 404;
        throw err;
    }

    const updatedItem = await prisma.items.update({
        where: { id: item_id },
        data: {
            stok: {
                increment: 1
            }
        }
    });

    return updatedItem;
};

module.exports = { reduceStock, restoreStock };
