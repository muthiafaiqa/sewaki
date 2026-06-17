const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.users.findMany();
  console.log('Users in DB:');
  console.log(users.map(u => ({ id: u.id, name: u.nama, email: u.email, role: u.role })));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
