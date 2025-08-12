const { PrismaClient } = require('@prisma/client');

async function quickTest() {
  console.log('🧪 Quick database test...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query works:', result);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickTest();
