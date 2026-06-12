const prisma = require('../src/shared/config/prisma');

async function testConnection() {
    console.log('⏳ Mencoba terhubung ke database...');
    try {
        await prisma.$connect();
        console.log('🟢 KONEKSI SUKSES: Project berhasil terhubung ke Supabase!');
        
        // Cek tabel users
        const count = await prisma.users.count();
        console.log(`📊 Total user terdaftar di database Supabase Anda: ${count}`);
    } catch (error) {
        console.error('🔴 KONEKSI GAGAL: Tidak dapat terhubung ke database.');
        console.error('Pesan Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testConnection();
