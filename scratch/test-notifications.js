const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const prisma = require('../src/shared/config/prisma');

async function checkNotificationsTable() {
    try {
        console.log('⏳ Checking notifications table structure...');
        await prisma.$connect();
        
        // Let's run a raw query to check if the table exists
        const result = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'notifications'
        `;
        
        console.log('Table search result:', result);
        
        if (result.length > 0) {
            console.log('✅ The "notifications" table exists in Supabase database!');
            // Describe columns
            const columns = await prisma.$queryRaw`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'notifications'
            `;
            console.log('Columns:');
            console.table(columns);
        } else {
            console.log('❌ The "notifications" table does NOT exist in Supabase!');
        }
    } catch (error) {
        console.error('🔴 Error checking table:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkNotificationsTable();
