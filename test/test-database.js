// test/db-connection-test.js - Direct database connection test
const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  console.log('🗄️ Testing direct Supabase database connection...');
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    // Test 1: Basic connection
    console.log('🔌 Testing basic connection...');
    await prisma.$connect();
    console.log('✅ Connected to Supabase database!');
    
    // Test 2: Count records in each table
    console.log('\n📊 Checking database contents...');
    
    const [userCount, courseCount, unitCount, assignmentCount] = await Promise.all([
      prisma.user.count().catch(() => 0),
      prisma.course.count().catch(() => 0),
      prisma.unit.count().catch(() => 0),
      prisma.assignment.count().catch(() => 0)
    ]);
    
    console.log(`👥 Users: ${userCount}`);
    console.log(`📚 Courses: ${courseCount}`);
    console.log(`📖 Units: ${unitCount}`);
    console.log(`📋 Assignments: ${assignmentCount}`);
    
    // Test 3: Check if you have coordinator users
    console.log('\n🔍 Checking for coordinator users...');
    const coordinators = await prisma.user.findMany({
      where: { role: 'COORDINATOR' },
      select: { id: true, email: true, firstName: true }
    });
    
    console.log(`👨‍💼 Coordinators found: ${coordinators.length}`);
    coordinators.forEach(coord => {
      console.log(`   - ${coord.email} (${coord.firstName})`);
    });
    
    // Test 4: Check if you have student users  
    console.log('\n🔍 Checking for student users...');
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, email: true, firstName: true },
      take: 5 // Just show first 5
    });
    
    console.log(`👨‍🎓 Students found: ${students.length}`);
    students.forEach(student => {
      console.log(`   - ${student.email} (${student.firstName})`);
    });
    
    if (coordinators.length === 0) {
      console.log('\n⚠️ No coordinators found - you\'ll need to create one for testing');
      console.log('💡 You can create one through your Supabase dashboard or seed script');
    }
    
    if (userCount === 0) {
      console.log('\n⚠️ No users found - your database might be empty');
      console.log('💡 Run your seed script: npm run prisma:seed');
    }
    
    console.log('\n✅ Database connection test completed!');
    
  } catch (error) {
    console.log('❌ Database connection failed:');
    console.log('Error:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Possible fixes:');
      console.log('   1. Check your DATABASE_URL password');
      console.log('   2. Reset your Supabase database password');
      console.log('   3. Check if your IP is allowed in Supabase settings');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();