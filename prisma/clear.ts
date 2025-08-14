const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🧹 Clearing all data from database...');
  
  try {
    // Delete in order (due to foreign key constraints)
    console.log('🗑️  Deleting submissions...');
    await prisma.assignmentSubmission.deleteMany();
    
    console.log('🗑️  Deleting student progress...');
    await prisma.studentProgress.deleteMany();
    
    console.log('🗑️  Deleting assignments...');
    await prisma.assignment.deleteMany();
    
    console.log('🗑️  Deleting users...');
    await prisma.user.deleteMany();
    
    console.log('🗑️  Deleting teachers...');
    await prisma.teacher.deleteMany();
    
    console.log('🗑️  Deleting units...');
    await prisma.unit.deleteMany();
    
    console.log('🗑️  Deleting courses...');
    await prisma.course.deleteMany();
    
    console.log('✅ Database cleared successfully!');
    
    // Verify everything is deleted
    const counts = {
      users: await prisma.user.count(),
      courses: await prisma.course.count(),
      units: await prisma.unit.count(),
      teachers: await prisma.teacher.count(),
      assignments: await prisma.assignment.count(),
      submissions: await prisma.assignmentSubmission.count(),
      progress: await prisma.studentProgress.count()
    };
    
    console.log('\n📊 Current database counts:');
    Object.entries(counts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count}`);
    });
    
    const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0);
    if (totalRecords === 0) {
      console.log('\n🎉 Database is completely clean!');
    } else {
      console.log('\n⚠️  Some records remain - check for constraints');
    }
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});