const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function seed() {
  console.log('🚀 Starting dynamic seeding from JSON data files...');
  
  try {
    // Clear existing data (cascade deletion will handle related records)
    console.log('🧹 Clearing existing data...');
    await prisma.user.deleteMany();
    await prisma.course.deleteMany();
    console.log('✅ Cleared all existing data');

    // Read all required data files
    console.log('📖 Reading data from JSON files...');
    
    const dataPath = path.join(process.cwd(), 'data');
    
    // Read students data
    const studentsData = JSON.parse(fs.readFileSync(path.join(dataPath, 'students.json'), 'utf8'));
    console.log(`📊 Found ${studentsData.length} students`);

    // Read courses data (handles nested structure)
    const rawCoursesData = JSON.parse(fs.readFileSync(path.join(dataPath, 'courses.json'), 'utf8'));
    const coursesData = rawCoursesData.courses;
    const unitsData = rawCoursesData.units;
    console.log(`📚 Found ${coursesData.length} courses`);
    console.log(`📖 Found ${unitsData.length} units`);

    // Read assignments data
    const assignmentsData = JSON.parse(fs.readFileSync(path.join(dataPath, 'assignments.json'), 'utf8'));
    console.log(`📝 Found ${assignmentsData.length} assignments`);

    // Read student assignments data
    const studentAssignmentsData = JSON.parse(fs.readFileSync(path.join(dataPath, 'studentAssignments.json'), 'utf8'));
    console.log(`📋 Found ${studentAssignmentsData.length} student assignments`);

    // Read student progress data
    const progressData = JSON.parse(fs.readFileSync(path.join(dataPath, 'studentProgress.json'), 'utf8'));
    console.log(`📈 Found ${progressData.length} progress records`);

    // Read faculty data (for coordinators)
    const facultyData = JSON.parse(fs.readFileSync(path.join(dataPath, 'faculty.json'), 'utf8'));
    const coordinatorsData = facultyData.faculty || facultyData;
    const teachersData = facultyData.teachers || []; 
    console.log(`👨‍💼 Found ${coordinatorsData.length} coordinators`);
    console.log(`👨‍🏫 Found ${teachersData.length} teachers`); 

    // Hash passwords securely with individual passwords
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    
    // Create courses first
    console.log('📚 Creating courses...');
    for (const course of coursesData) {
      await prisma.course.create({
        data: {
          code: course.code,
          name: course.name
        }
      });
    }
    console.log(`✅ Created ${coursesData.length} courses`);

    // Create units
    console.log('📖 Creating units...');
    for (const unit of unitsData) {
      await prisma.unit.create({
        data: {
          code: unit.code,
          name: unit.name,
          description: unit.description || null,
          courseCode: unit.courseCode,
          currentWeek: unit.currentWeek || 1
        }
      });
    }
    console.log(`✅ Created ${unitsData.length} units`);

    // Create students with unique passwords
    console.log('👥 Creating student records with secure passwords...');
    const studentRecords = await Promise.all(
      studentsData.map(async (student) => {
        let password: string;
        
        if (student.password) {
          // Use existing password if provided in JSON
          password = student.password;
        } else {
          // Generate unique password for each student
          password = `${student.id}_Student2024!`; // Unique but predictable for initial setup
        }
        
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Log the password for initial setup (remove in production)
        console.log(`   📝 ${student.id}: ${password}`);
        
        return {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName || '',
          email: student.email || `${student.id}@imajine.ac.id`,
          password: hashedPassword,
          role: 'STUDENT',
          courseCode: student.courseCode || null,
          year: student.year || null
        };
      })
    );

    await prisma.user.createMany({
      data: studentRecords,
      skipDuplicates: true
    });
    console.log(`✅ Created ${studentRecords.length} student users`);

    // Create Student records (extended student data)
    console.log('👥 Creating student records...');
    const studentExtendedRecords = studentsData.map((student, index) => ({
      id: student.id, // Same as User.id
      userId: student.id, // Foreign key to User
      courseCode: student.courseCode,
      year: student.year,
      studentNumber: `2024${String(index + 1).padStart(3, '0')}`, // e.g., "2024001"
      status: 'ACTIVE',
      enrollmentDate: new Date()
    }));

    await prisma.student.createMany({
      data: studentExtendedRecords,
      skipDuplicates: true
    });
    console.log(`✅ Created ${studentExtendedRecords.length} student records`);

    // Create coordinators from faculty data
    console.log('👨‍💼 Creating coordinator records...');
    const coordinatorRecords = await Promise.all(
      coordinatorsData.map(async (coordinator) => {
        let password: string;
        
        if (coordinator.password) {
          password = coordinator.password;
        } else {
          // Generate unique password for each coordinator
          password = `${coordinator.id}_Coord2024!`;
        }
        
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        // Log the password for initial setup
        console.log(`   📝 ${coordinator.id}: ${password}`);
        
        return {
          id: coordinator.id,
          firstName: coordinator.firstName,
          lastName: coordinator.lastName || '',
          email: coordinator.email,
          password: hashedPassword,
          role: 'COORDINATOR',
          title: coordinator.title || null,
          accessLevel: coordinator.accessLevel || null,
          courseManaged: coordinator.courseManaged || []
        };
      })
    );

    await prisma.user.createMany({
      data: coordinatorRecords,
      skipDuplicates: true
    });
    console.log(`✅ Created ${coordinatorRecords.length} coordinators`);

    // Create teachers from faculty data
    console.log('👨‍🏫 Creating teacher records...');
    const teacherRecords = await Promise.all(
      teachersData.map(async (teacher) => {
        const password = `${teacher.id}_Teacher2024!`;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        
        console.log(`   📝 ${teacher.id}: ${password}`);
        
        return {
          id: teacher.id,
          firstName: teacher.firstName,
          lastName: teacher.lastName || '',
          email: teacher.email || `${teacher.id}@imajine.ac.id`,
          password: hashedPassword,
          role: 'COORDINATOR',
          title: 'Teacher'
        };
      })
    );

    await prisma.user.createMany({
      data: teacherRecords,
      skipDuplicates: true
    });
    console.log(`✅ Created ${teacherRecords.length} teachers`);

    // Create assignments
    console.log('📝 Creating assignments...');
    for (const assignment of assignmentsData) {
      await prisma.assignment.create({
        data: {
          id: assignment.id,
          name: assignment.name,
          unitCode: assignment.unitCode,
          deadline: new Date(assignment.deadline),
          publishedAt: new Date(assignment.publishedAt),
          status: assignment.status?.toUpperCase() || 'OPEN'
        }
      });
    }
    console.log(`✅ Created ${assignmentsData.length} assignments`);

    // Create student progress
    console.log('📈 Creating student progress records...');
    const progressRecords = progressData.map((progress) => ({
      studentId: progress.studentId,
      unitCode: progress.unitCode,
      week1Material: progress.week1Material === 'done' ? 'DONE' : 'NOT_DONE',
      week2Material: progress.week2Material === 'done' ? 'DONE' : 'NOT_DONE',
      week3Material: progress.week3Material === 'done' ? 'DONE' : 'NOT_DONE',
      week4Material: progress.week4Material === 'done' ? 'DONE' : 'NOT_DONE',
      updatedBy: progress.updatedBy || null,
      lastUpdated: progress.lastUpdated ? new Date(progress.lastUpdated) : new Date()
    }));

    await prisma.studentProgress.createMany({
      data: progressRecords,
      skipDuplicates: true
    });
    console.log(`✅ Created ${progressRecords.length} progress records`);

    // Create student assignments
    console.log('📋 Creating student assignments...');
    console.log('🔍 Debug: prisma.studentAssignment exists?', !!prisma.studentAssignment);
    console.log('🔍 Debug: First student assignment data:', studentAssignmentsData[0]);
    
    for (const studentAssignment of studentAssignmentsData) {
      // Map your data values to enum values
      let submissionStatus = 'EMPTY'; // Default
      
      switch(studentAssignment.submissionStatus?.toLowerCase()) {
        case 'empty':
          submissionStatus = 'EMPTY';
          break;
        case 'draft':
          submissionStatus = 'DRAFT';
          break;
        case 'submitted':
          submissionStatus = 'SUBMITTED';
          break;
        case 'unsubmitted':
          submissionStatus = 'UNSUBMITTED';
          break;
        default:
          submissionStatus = 'EMPTY';
      }
      
      console.log(`🔍 Creating submission: ${studentAssignment.submissionId}`);
      
      await prisma.studentAssignment.create({
        data: {
          submissionId: studentAssignment.submissionId,
          studentId: studentAssignment.studentId,
          assignmentId: studentAssignment.assignmentId,
          status: studentAssignment.status?.toUpperCase() || null,
          submissionStatus: submissionStatus,
          submissionName: studentAssignment.submissionName || null,
          submittedAt: studentAssignment.submittedAt ? new Date(studentAssignment.submittedAt) : null,
          grade: studentAssignment.grade || null,
          comment: studentAssignment.comment || null,
          gradedBy: studentAssignment.gradedBy || null,
          gradedAt: studentAssignment.gradedAt ? new Date(studentAssignment.gradedAt) : null
        }
      });
    }
    console.log(`✅ Created ${studentAssignmentsData.length} student assignments`);

    // Verify seeded data
    console.log('\n🔍 Verifying seeded data...');
    const finalStudentUserCount = await prisma.user.count({ where: { role: 'STUDENT' } });
    const finalStudentCount = await prisma.student.count();
    const finalCoordinatorCount = await prisma.user.count({ where: { role: 'COORDINATOR' } });
    const finalCourseCount = await prisma.course.count();
    const finalUnitCount = await prisma.unit.count();
    const finalAssignmentCount = await prisma.assignment.count();
    const finalStudentAssignmentCount = await prisma.studentAssignment.count();
    const finalProgressCount = await prisma.studentProgress.count();

    console.log('\n📊 SEEDING SUMMARY:');
    console.log(`   👥 Student Users: ${finalStudentUserCount}`);
    console.log(`   📚 Student Records: ${finalStudentCount}`);
    console.log(`   👨‍💼 Coordinators: ${finalCoordinatorCount}`);
    console.log(`   📚 Courses: ${finalCourseCount}`);
    console.log(`   📖 Units: ${finalUnitCount}`);
    console.log(`   📝 Assignments: ${finalAssignmentCount}`);
    console.log(`   📋 Student Assignments: ${finalStudentAssignmentCount}`);
    console.log(`   📈 Progress Records: ${finalProgressCount}`);

    console.log('\n🎉 Dynamic seeding completed successfully!');
    
    console.log('\n🔑 Login Credentials:');
    console.log('   👥 Students: {studentId}_Student2024! (e.g., s001_Student2024!)');
    console.log('   👨‍💼 Coordinators: {coordinatorId}_Coord2024! (e.g., f001_Coord2024!)');
    console.log('   👨‍🏫 Teachers: {teacherId}_Teacher2024! (e.g., t001_Teacher2024!)');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seed().catch((error) => {
  console.error('💥 Fatal error during seeding:', error);
  process.exit(1);
});