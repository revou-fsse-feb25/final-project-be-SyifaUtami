import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../prisma/prisma.service';

@Injectable()
export class AcademicDataService {
  constructor(private readonly db: DatabaseService) {}

  // GET /academic-data - All static reference data with enhanced teacher info
  async getAcademicData() {
    const [courses, units, assignments, coordinators] = await Promise.all([
      this.db.course.findMany({
        include: { units: true },
      }),
      this.db.unit.findMany({
        include: {
          course: true,
          assignments: true,
        },
      }),
      this.db.assignment.findMany({
        include: {
          unit: { include: { course: true } },
        },
      }),
      this.db.user.findMany({
        where: { role: 'COORDINATOR' },
        select: {
          id: true, 
          firstName: true, 
          lastName: true, 
          email: true,
          title: true, 
          accessLevel: true, 
          courseManaged: true,
        },
      }),
    ]);

    // Transform coordinators to include teacher-like properties for frontend compatibility
    const teachers = coordinators.map(coordinator => ({
      ...coordinator,
      unitsTeached: [], // TODO: Implement proper unit-teacher relationship tracking
    }));

    return {
      courses,
      units,
      assignments,
      teachers, // Primary teacher data for frontend
      faculty: coordinators, // Keep for backward compatibility
      coordinators, // Keep for coordinator-specific data
    };
  }

  // GET /academic-data/summary - Quick summary stats
  async getAcademicSummary() {
    const [courseCount, unitCount, assignmentCount, studentCount, teacherCount] = await Promise.all([
      this.db.course.count(),
      this.db.unit.count(),
      this.db.assignment.count(),
      this.db.user.count({ where: { role: 'STUDENT' } }),
      this.db.user.count({ where: { role: 'COORDINATOR' } }),
    ]);

    return {
      courseCount,
      unitCount,
      assignmentCount,
      studentCount,
      teacherCount,
    };
  }

  // GET /academic-data/course/:courseCode - Course-specific academic data
  async getCourseAcademicData(courseCode: string) {
    const course = await this.db.course.findUnique({
      where: { code: courseCode },
      include: {
        units: {
          include: {
            assignments: true,
          },
        },
      },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    // Get students in this course
    const students = await this.db.user.findMany({
      where: { 
        role: 'STUDENT', 
        courseCode 
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        year: true,
        createdAt: true,
      },
    });

    // Get coordinators managing this course
    const coordinators = await this.db.user.findMany({
      where: {
        role: 'COORDINATOR',
        courseManaged: { has: courseCode },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        title: true,
      },
    });

    return {
      course,
      students,
      coordinators,
      units: course.units,
      assignments: course.units.flatMap(unit => unit.assignments),
    };
  }

  // GET /academic-data/unit/:unitCode - Unit-specific academic data
  async getUnitAcademicData(unitCode: string) {
    const unit = await this.db.unit.findUnique({
      where: { code: unitCode },
      include: {
        course: true,
        assignments: true,
      },
    });

    if (!unit) {
      throw new Error('Unit not found');
    }

    // Get students enrolled in this unit's course
    const students = await this.db.user.findMany({
      where: { 
        role: 'STUDENT', 
        courseCode: unit.courseCode 
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        year: true,
      },
    });

    // Get student progress for this unit
    const progress = await this.db.studentProgress.findMany({
      where: { unitCode },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Get submissions for this unit's assignments
    const submissions = await this.db.studentAssignment.findMany({
      where: {
        assignment: { unitCode },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignment: true,
      },
    });

    return {
      unit,
      students,
      assignments: unit.assignments,
      progress,
      submissions,
    };
  }

  // GET /academic-data/student/:studentId - Student-specific academic data
  async getStudentAcademicData(studentId: string) {
    const student = await this.db.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        courseCode: true,
        year: true,
        createdAt: true,
      },
    });

    if (!student || !student.courseCode) {
      throw new Error('Student not found or not enrolled in a course');
    }

    // Get student's course and units
    const course = await this.db.course.findUnique({
      where: { code: student.courseCode },
      include: {
        units: {
          include: {
            assignments: true,
          },
        },
      },
    });

    // Get student's progress
    const progress = await this.db.studentProgress.findMany({
      where: { studentId },
      include: {
        unit: true,
      },
    });

    // Get student's assignments and submissions
    const submissions = await this.db.studentAssignment.findMany({
      where: { studentId },
      include: {
        assignment: {
          include: {
            unit: true,
          },
        },
      },
    });

    return {
      student,
      course,
      units: course?.units || [],
      progress,
      submissions,
    };
  }
}