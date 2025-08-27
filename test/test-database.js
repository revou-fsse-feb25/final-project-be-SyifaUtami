// test-simple.js - Minimal database connection test
const { PrismaClient } = require('@prisma/client');

async function simpleTest() {
  console.log('🔍 Simple Database Connection Test');
  console.log('==================================');
  
  // Step 1: Check if DATABASE_URL exists
  const dbUrl = process.env.DATABASE_URL;
  console.log('1️⃣ DATABASE_URL check:');
  if (!dbUrl) {
    console.log('❌ DATABASE_URL not found in environment');
    console.log('💡 Make sure you have a .env file with DATABASE_URL');
    return;
  }
  
  console.log('✅ DATABASE_URL found');
  console.log(`   Length: ${dbUrl.length} characters`);
  console.log(`   Starts with 'postgresql://': ${dbUrl.startsWith('postgresql://') ? '✅' : '❌'}`);
  console.log(`   First 30 characters: ${dbUrl.substring(0, 30)}...`);
  
  // Step 2: Try to create Prisma client
  console.log('\n2️⃣ Creating Prisma client...');
  const prisma = new PrismaClient({
    log: ['error'], // Only show errors
  });
  console.log('✅ Prisma client created');
  
  // Step 3: Test basic connection
  console.log('\n3️⃣ Testing connection...');
  try {
    await prisma.$connect();
    console.log('✅ Connected successfully!');
    
    // Step 4: Test simple query
    console.log('\n4️⃣ Testing simple query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query successful:', result);
    
    console.log('\n🎉 DATABASE CONNECTION IS WORKING!');
    console.log('The issue is not with your DATABASE_URL.');
    
  } catch (error) {
    console.log('❌ Connection failed!');
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    
    // Provide specific help based on error
    if (error.message.includes("Can't reach database server")) {
      console.log('\n🔧 CONNECTION ISSUE DETECTED:');
      console.log('Your DATABASE_URL format might be wrong.');
      console.log('Expected format:');
      console.log('postgresql://postgres:password@db.projectref.supabase.co:5432/postgres');
    }
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n🔧 AUTHENTICATION ISSUE DETECTED:');
      console.log('Your password is incorrect.');
      console.log('Reset your Supabase database password and update DATABASE_URL.');
    }
    
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the test
simpleTest().catch(console.error);