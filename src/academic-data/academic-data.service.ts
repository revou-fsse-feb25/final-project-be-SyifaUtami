// src/academic-data/academic-data.service.ts - Fixed with Role enum
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../prisma/prisma.service';
import { Role } from '@prisma/client'; // Import Role enum

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
        where: { role: Role.COORDINATOR }, // ← Fixed: Use enum instead of string
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
      unitsTeached: coordinator.courseManaged || [], // Use courseManaged as units taught
    }));

    return {
      success: true, // ← Add success field for consistency
      data: {
        courses,
        units,
        assignments,
        teachers, // Primary teacher data for frontend
        faculty: coordinators, // Keep for backward compatibility
        coordinators, // Keep for coordinator-specific data
      }
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
        role: Role.STUDENT, // ← Fixed: Use enum
        courseCode: courseCode,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        year: true,
      },
    });

    // Get progress for this course's units
    const progress = await this.db.studentProgress.findMany({
      where: {
        unit: {
          courseCode: courseCode,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        unit: true,
      },
    });

    // Get submissions for this course's assignments
    const submissions = await this.db.studentAssignment.findMany({
      where: {
        assignment: {
          unit: {
            courseCode: courseCode,
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assignment: {
          include: {
            unit: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        course,
        students,
        progress,
        submissions,
      },
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
        role: Role.STUDENT, // ← Fixed: Use enum
        courseCode: unit.courseCode,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        year: true,
      },
    });

    // Get progress for this unit
    const progress = await this.db.studentProgress.findMany({
      where: { unitCode },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        unit: true,
      },
    });

    // Get submissions for this unit's assignments
    const submissions = await this.db.studentAssignment.findMany({
      where: {
        assignment: {
          unitCode: unitCode,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        assignment: {
          include: {
            unit: true,
          },
        },
      },
    });

    return {
      success: true,
      data: {
        unit,
        students,
        assignments: unit.assignments,
        progress,
        submissions,
      },
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
      success: true,
      data: {
        student,
        course,
        units: course?.units || [],
        progress,
        submissions,
      },
    };
  }
}