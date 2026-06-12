/**
 * Script untuk membuat database 'sewaki' jika belum ada.
 * Jalankan sekali sebelum menjalankan server jika menggunakan local database.
 */

const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
    // Jika menggunakan Supabase (DATABASE_URL), tidak perlu membuat database baru
    if (process.env.DATABASE_URL) {
        console.log('ℹ️  Menggunakan Supabase Database (DATABASE_URL).');
        console.log('   Lewati proses pembuatan database.');
        console.log('✅ Selesai! Sekarang jalankan: npm start untuk auto-sync tabel.');
        return;
    }

    // Connect ke database default 'postgres' (Local)
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'root',
        database: 'postgres'
    });

    try {
        await client.connect();
        console.log('✅ Terhubung ke PostgreSQL Local');

        const result = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = 'sewaki'"
        );

        if (result.rowCount === 0) {
            await client.query('CREATE DATABASE sewaki');
            console.log('✅ Database "sewaki" lokal berhasil dibuat!');
        } else {
            console.log('ℹ️  Database "sewaki" lokal sudah ada, skip.');
        }
    } catch (error) {
        console.error('❌ Gagal membuat database:', error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('✅ Selesai! Sekarang jalankan: npm start');
    }
}

createDatabase();
