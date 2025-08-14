const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function seed() {
  console.log('🚀 Simple cascade seeding...');
  
  const hashedPassword = await bcrypt.hash('student123', 5);
  
  // NOW THIS WORKS! Deleting users auto-deletes related data
  await prisma.user.deleteMany();
  console.log('✅ Cleared all users (and their related data automatically!)');
  
  // Create test data
  await prisma.user.createMany({
    data: [
      {
        id: 's001',
        firstName: 'Test',
        lastName: 'Student',
        email: 'student.s001@imajine.ac.id',
        password: hashedPassword,
        role: 'STUDENT',
        courseCode: 'BM',
        year: 1
      },
      {
        id: 'f001',
        firstName: 'Test',
        lastName: 'Coordinator',
        email: 'coordinator@imajine.ac.id',
        password: hashedPassword,
        role: 'COORDINATOR',
        title: 'Coordinator',
        accessLevel: 'full',
        courseManaged: ['BM']
      }
    ]
  });
  
  console.log('✅ Created test student and coordinator');
  
  await prisma.$disconnect();
}

seed();
