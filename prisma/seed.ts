// ==============================================
// REALISTIC SEED FILE - Manual Assignment Only
// ==============================================

// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define interfaces
interface StudentData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'STUDENT';
  courseCode: string;
  year: number;
}

async function main() {
  console.log('🌱 Realistic LMS seeding - manual assignments only...');

  // Clear existing data (cascade deletion handles relationships)
  console.log('🗑️ Clearing existing data...');
  await prisma.user.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.course.deleteMany();
  console.log('✅ Database cleared');

  // ==============================================
  // 1. TEACHERS (Reference Data Only)
  // ==============================================
  
  const teachers = [
    // Business Management Teachers
    { id: 't001', firstName: 'Damiano', lastName: 'David', email: 'damiano.david@imajine.ac.id', unitsTeached: ['BM001'] },
    { id: 't002', firstName: 'Victoria', lastName: 'De Angelis', email: 'victoria.deangelis@imajine.ac.id', unitsTeached: ['BM002'] },
    { id: 't003', firstName: 'Thomas', lastName: 'Raggi', email: 'thomas.raggi@imajine.ac.id', unitsTeached: ['BM003'] },
    { id: 't004', firstName: 'Ethan', lastName: 'Torchio', email: 'ethan.torchio@imajine.ac.id', unitsTeached: ['BM004'] },
    
    // Business Analytics Teachers  
    { id: 't005', firstName: 'Billie', lastName: 'Eilish', email: 'billie.eilish@imajine.ac.id', unitsTeached: ['BA001'] },
    { id: 't006', firstName: 'Olivia', lastName: 'Rodrigo', email: 'olivia.rodrigo@imajine.ac.id', unitsTeached: ['BA002'] },
    { id: 't007', firstName: 'Dua', lastName: 'Lipa', email: 'dua.lipa@imajine.ac.id', unitsTeached: ['BA003'] },
    { id: 't008', firstName: 'Taylor', lastName: 'Swift', email: 'taylor.swift@imajine.ac.id', unitsTeached: ['BA004'] },
    
    // Accounting and Finance Teachers
    { id: 't009', firstName: 'Harry', lastName: 'Styles', email: 'harry.styles@imajine.ac.id', unitsTeached: ['AF001'] },
    { id: 't010', firstName: 'Shawn', lastName: 'Mendes', email: 'shawn.mendes@imajine.ac.id', unitsTeached: ['AF002'] },
    { id: 't011', firstName: 'Charlie', lastName: 'Puth', email: 'charlie.puth@imajine.ac.id', unitsTeached: ['AF003'] },
    { id: 't012', firstName: 'Ed', lastName: 'Sheeran', email: 'ed.sheeran@imajine.ac.id', unitsTeached: ['AF004'] },
    
    // International Business Teachers
    { id: 't013', firstName: 'Ariana', lastName: 'Grande', email: 'ariana.grande@imajine.ac.id', unitsTeached: ['IB001'] },
    { id: 't014', firstName: 'Selena', lastName: 'Gomez', email: 'selena.gomez@imajine.ac.id', unitsTeached: ['IB002'] },
    { id: 't015', firstName: 'Camila', lastName: 'Cabello', email: 'camila.cabello@imajine.ac.id', unitsTeached: ['IB003'] },
    { id: 't016', firstName: 'The', lastName: 'Weeknd', email: 'the.weeknd@imajine.ac.id', unitsTeached: ['IB004'] }
  ];

  await prisma.teacher.createMany({ data: teachers });
  console.log(`✅ Created ${teachers.length} teachers`);

  // ==============================================
  // 2. ONE COORDINATOR - Lady Gaga
  // ==============================================
  
  await prisma.user.create({
    data: {
      id: 'f001',
      firstName: 'Lady',
      lastName: 'Gaga',
      email: 'coordinator@imajine.ac.id',
      password: 'coordinator123',  // Plain text - hashed during login
      role: 'COORDINATOR',
      title: 'Head Coordinator',
      accessLevel: 'full',
      courseManaged: ['BM', 'BA', 'AF', 'IB']
    }
  });
  console.log('✅ Created Head Coordinator (Lady Gaga)');

  // ==============================================
  // 3. STUDENTS - MANUALLY ASSIGNED (No Auto-Generation)
  // ==============================================
  
  // Each student manually assigned their course, year, etc.
  // Coordinator would have enrolled them individually
  
  const students: StudentData[] = [
    // Business Management Students
    { id: 's001', firstName: 'Tom', lastName: 'Holland', email: 'tom.holland@imajine.ac.id', password: 'student123', role: 'STUDENT', courseCode: 'BM', year: 1 },
    { id: 's002', firstName: 'Zendaya', lastName: 'Coleman', email: 'zendaya.coleman@imajine.ac.id', password: 'student123', role: 'STUDENT', courseCode: 'BM', year: 1 },
    { id: 's003', firstName: 'Anya', lastName: 'Taylor-Joy', email: 'anya.taylorjoy@imajine.ac.id', password: 'student123', role: 'STUDENT', courseCode: 'BM', year: 1 },
    { id: 's004', firstName: 'Jacob', lastName: 'Elordi', email: 'jacob.elordi@imajine.ac.id', password: 'student123', role: 'STUDENT', courseCode: 'BM', year: 1 },
    { id: 's005', firstName: 'Noah', lastName: 'Centineo', email: 'noah.centineo@imajine.ac.id', password: 'student123', role: 'STUDENT', courseCode: 'BM', year: 1 },
    { id: 's006', firstName: 'Millie', lastName: 'Bobby Brown', email: 'millie.bobbybrown@imajine.ac.id', password: 'student123', role: 'STUDENT', courseCode: 'BM', year: 1 },
    { id: 's007', firstName: 'Finn', lastName: 'Wolfhard', email: 'finn.wolfhard@imajine.ac.id', password: 'student123', role: 'STUDENT', courseCode: 'BM', year: 1 },
    
    // Business Analytics Students
    { id: 's008', firstName: 'Florence', lastName: 'Pugh', email: 'florence.pugh@imajine.ac.id', password: 'student123', role: 'STUDENT', courseCode: 'BA', year: 1 },
    { id: 's009', firstName: 'Timothée', lastName: 'Chalamet', email: 'timothee.chalamet@imajine.ac.id', password: 'student123', role: 'STUDENT', courseCode: 'BA', year: 1 },
    { id: 's010', firstName: 'Emma', lastName: 'Stone', email: 'emma.stone@imajine.ac.id', password: 'student123', role: 'STUDENT', courseCode: 'BA', year: 1 },
    { id: 's011', firstName: 'Sydney', lastName: 'Sweeney', email: 'sydney.sweeney@imajine.ac.id', password: 'student123', role: 'STUDENT', courseCode: 'BA', year: 1 },
    { id: 's012', firstName: 'Lana', lastName: 'Condor', email: 'lana.condor@imajine.ac.id', password: 'student123', role: 'STUDENT', courseCode: 'BA', year: 1 },
    
    // Accounting and Finance Students
    { id: 's013', firstName: 'Ryan', lastName: 'Reynolds', email: 'ryan.reynolds@imajine.ac.id', password: 'student123', role: 'STUDENT', courseCode: 'AF', year: 1 },
    { id: 's014', firstName: 'Blake', lastName: 'Lively', email: 'blake.lively@imajine.ac.id', password: 'student123', role: 'STUDENT', courseCode: 'AF', year: 1 },
    { id: 's015', firstName: 'Jennifer', lastName: 'Lawrence', email: 'jennifer.lawrence@imajine.ac.id', password: 'student123', role: 'STUDENT', courseCode: 'AF', year: 1 },
    
    // International Business Students - Year 1
    { id: 's016', firstName: 'Gal', lastName: 'Gadot', email: 'gal.gadot@imajine.ac.id', password: 'student123', role: 'STUDENT', courseCode: 'IB', year: 1 },
    { id: 's017', firstName: 'Henry', lastName: 'Cavill', email: 'henry.cavill@imajine.ac.id', password: 'student123', role: 'STUDENT', courseCode: 'IB', year: 1 },
    { id: 's018', firstName: 'Amy', lastName: 'Adams', email: 'amy.adams@imajine.ac.id', password: 'student123', role: 'STUDENT', courseCode: 'IB', year: 1 },
    
    // International Business Students - 1
    { id: 's019', firstName: 'Ben', lastName: 'Affleck', email: 'ben.affleck@imajine.ac.id', password: 'student123', role: 'STUDENT', courseCode: 'IB', year: 2 },
    { id: 's020', firstName: 'Jason', lastName: 'Momoa', email: 'jason.momoa@imajine.ac.id', password: 'student123', role: 'STUDENT', courseCode: 'IB', year: 2 }
  ];


  await prisma.user.createMany({
    data: students,
    skipDuplicates: true
  });
  console.log(`✅ Created ${students.length} students (manually assigned courses and years)`);

  // ==============================================
  // 4. COURSES
  // ==============================================
  
  const courses = [
    { code: 'BM', name: 'Bachelor of Business Management' },
    { code: 'BA', name: 'Bachelor of Business Analytics' },
    { code: 'AF', name: 'Bachelor of Accounting and Finance' },
    { code: 'IB', name: 'Bachelor of International Business' }
  ];

  await prisma.course.createMany({ data: courses });
  console.log(`✅ Created ${courses.length} courses`);

  // ==============================================
  // 5. UNITS (Course Subjects)
  // ==============================================
  
  const units = [
    // Business Management Units
    { code: 'BM001', name: 'Introduction to Business', description: 'Fundamentals of business management and organizational behavior', courseCode: 'BM', currentWeek: 3 },
    { code: 'BM002', name: 'Marketing Principles', description: 'Core marketing concepts, consumer behavior, and digital marketing strategies', courseCode: 'BM', currentWeek: 2 },
    { code: 'BM003', name: 'Operations Management', description: 'Supply chain management, process optimization, and lean methodologies', courseCode: 'BM', currentWeek: 4 },
    { code: 'BM004', name: 'Strategic Leadership', description: 'Leadership theories, change management, and strategic decision-making', courseCode: 'BM', currentWeek: 1 },
    
    // Business Analytics Units
    { code: 'BA001', name: 'Academic Skills', description: 'Essential academic and research skills for business analytics', courseCode: 'BA', currentWeek: 4 },
    { code: 'BA002', name: 'Business Analytics Fundamentals', description: 'Introduction to data analysis, statistics, and business intelligence', courseCode: 'BA', currentWeek: 1 },
    { code: 'BA003', name: 'Data Visualization', description: 'Creating impactful data visualizations using modern tools and techniques', courseCode: 'BA', currentWeek: 2 },
    { code: 'BA004', name: 'Predictive Analytics', description: 'Machine learning algorithms and predictive modeling for business decisions', courseCode: 'BA', currentWeek: 3 },
    
    // Accounting and Finance Units
    { code: 'AF001', name: 'Financial Accounting', description: 'IFRS standards, financial statements, and accounting principles', courseCode: 'AF', currentWeek: 2 },
    { code: 'AF002', name: 'Corporate Finance', description: 'Capital structure, investment decisions, and financial planning', courseCode: 'AF', currentWeek: 3 },
    { code: 'AF003', name: 'Management Accounting', description: 'Cost accounting, budgeting, and performance measurement systems', courseCode: 'AF', currentWeek: 1 },
    { code: 'AF004', name: 'Financial Markets', description: 'Capital markets, derivatives, and modern portfolio theory', courseCode: 'AF', currentWeek: 4 },
    
    // International Business Units
    { code: 'IB001', name: 'Global Business Environment', description: 'International trade, economic systems, and cultural factors in business', courseCode: 'IB', currentWeek: 1 },
    { code: 'IB002', name: 'Cross-Cultural Management', description: 'Managing diverse teams and navigating cultural differences in global business', courseCode: 'IB', currentWeek: 3 },
    { code: 'IB003', name: 'International Marketing', description: 'Global marketing strategies, market entry, and brand localization', courseCode: 'IB', currentWeek: 2 },
    { code: 'IB004', name: 'Supply Chain Management', description: 'Global logistics, sourcing strategies, and supply chain sustainability', courseCode: 'IB', currentWeek: 4 }
  ];

  await prisma.unit.createMany({ data: units });
  console.log(`✅ Created ${units.length} units`);

  // ==============================================
  // 6. SAMPLE ASSIGNMENTS (Manually Set Dates)
  // ==============================================
  
  const assignments = [
    // BM001 Assignments
    { id: 'BM0011', name: 'Business Fundamentals Essay', unitCode: 'BM001', 
      deadline: new Date('2025-03-15T23:59:59Z'), publishedAt: new Date('2025-02-01T09:00:00Z'), status: 'CLOSED' },
    { id: 'BM0012', name: 'Organizational Behavior Case Study', unitCode: 'BM001', 
      deadline: new Date('2025-09-15T23:59:59Z'), publishedAt: new Date('2025-08-01T09:00:00Z'), status: 'OPEN' },
    
    // BA001 Assignments  
    { id: 'BA0011', name: 'Academic Research Proposal', unitCode: 'BA001', 
      deadline: new Date('2025-04-10T23:59:59Z'), publishedAt: new Date('2025-03-01T09:00:00Z'), status: 'CLOSED' },
    { id: 'BA0012', name: 'Data Analysis Project', unitCode: 'BA001', 
      deadline: new Date('2025-10-20T23:59:59Z'), publishedAt: new Date('2025-09-01T09:00:00Z'), status: 'OPEN' },
    
    // AF001 Assignments
    { id: 'AF0011', name: 'Financial Statements Analysis', unitCode: 'AF001', 
      deadline: new Date('2025-05-15T23:59:59Z'), publishedAt: new Date('2025-04-01T09:00:00Z'), status: 'CLOSED' },
    
    // IB001 Assignments
    { id: 'IB0011', name: 'Global Market Entry Strategy', unitCode: 'IB001', 
      deadline: new Date('2025-11-30T23:59:59Z'), publishedAt: new Date('2025-10-01T09:00:00Z'), status: 'OPEN' }
  ];

  await prisma.assignment.createMany({ data: assignments });
  console.log(`✅ Created ${assignments.length} sample assignments`);

  console.log('🎉 Realistic database seeding completed successfully!');
  console.log('📊 Summary:');
  console.log(`   - ${teachers.length} teachers (reference data)`);
  console.log(`   - 1 head coordinator (Lady Gaga)`);
  console.log(`   - ${students.length} students (manually assigned courses & years)`);
  console.log(`   - ${courses.length} courses`);
  console.log(`   - ${units.length} units`);
  console.log(`   - ${assignments.length} sample assignments`);
  console.log('');
  console.log('🔐 Login credentials:');
  console.log('   Students: any student email + "student123"');
  console.log('   Coordinator: coordinator@imajine.ac.id + "coordinator123"');
  console.log('');
  console.log('✅ No auto-generated personal data - all manually assigned!');
  console.log('⚡ Password hashing happens during login, not seeding');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });