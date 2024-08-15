const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Hash password sebelum disimpan
  const hashedPassword = await bcrypt.hash('passwordAdmin', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin123@example.com' },
    update: {},
    create: {
      username: 'adminpertama',
      email: 'admin123@example.com',
      nip: '202012345',
      password: hashedPassword,
      role: 'admin',
    },
  });

  console.log('Admin created:', admin);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
