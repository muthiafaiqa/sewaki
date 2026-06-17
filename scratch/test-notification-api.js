const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const prisma = require('../src/shared/config/prisma');

async function testApiLogic() {
  try {
    console.log('⏳ Starting API query simulation...');
    const user = await prisma.users.findFirst();
    if (!user) {
      console.log('❌ No user found in the DB to test with.');
      return;
    }
    const userId = user.id;
    console.log(`👤 Using user ID: ${userId} (${user.nama}) for testing.`);
    
    // Simulate GET /api/notifications
    const notifications = await prisma.$queryRawUnsafe(
      `SELECT * FROM "notifications" WHERE "user_id" = $1::uuid ORDER BY "created_at" DESC`,
      userId
    );
    console.log(`✅ GET notifications successful! Current count: ${notifications.length}`);
    
    // Create a dummy notification to test with if count is 0
    let testNotifId = null;
    if (notifications.length === 0) {
      console.log('⏳ Inserting a dummy notification to test read operations...');
      await prisma.$executeRawUnsafe(
        `INSERT INTO "notifications" (id, user_id, title, message, is_read, created_at)
         VALUES (gen_random_uuid(), $1::uuid, 'Test Title', 'Test Message', false, now())`,
        userId
      );
      
      const newNotifications = await prisma.$queryRawUnsafe(
        `SELECT * FROM "notifications" WHERE "user_id" = $1::uuid ORDER BY "created_at" DESC`,
        userId
      );
      testNotifId = newNotifications[0].id;
      console.log(`✅ Dummy notification inserted with ID: ${testNotifId}`);
    } else {
      testNotifId = notifications[0].id;
    }
    
    // Test mark one as read
    console.log(`⏳ Testing PUT /api/notifications/${testNotifId}/read...`);
    await prisma.$executeRawUnsafe(
      `UPDATE "notifications" SET "is_read" = true WHERE "id" = $1::uuid AND "user_id" = $2::uuid`,
      testNotifId,
      userId
    );
    console.log(`✅ Single read update query executed successfully!`);
    
    // Test mark all as read
    console.log('⏳ Testing PUT /api/notifications/read-all...');
    await prisma.$executeRawUnsafe(
      `UPDATE "notifications" SET "is_read" = true WHERE "user_id" = $1::uuid`,
      userId
    );
    console.log(`✅ Read-all update query executed successfully!`);
    
    const unreadCheck = await prisma.$queryRawUnsafe(
      `SELECT * FROM "notifications" WHERE "user_id" = $1::uuid AND "is_read" = false`,
      userId
    );
    console.log(`📊 Unread count after marking all as read: ${unreadCheck.length}`);
    
  } catch (err) {
    console.error('🔴 Error during testing:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testApiLogic();
