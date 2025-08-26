// src/academic-data/academic-data.service.ts - FIXED VERSION
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../prisma/prisma.service';

@Injectable()
export class AcademicDataService {
  constructor(private readonly db: DatabaseService) {}

  // GET /academic-data - All static reference data with enhanced teacher info
  async getAcademicData() {
    try {
      console.log('🔄 AcademicDataService: Fetching all academic data...');
      
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

      console.log('📊 AcademicDataService: Data fetched successfully:', {
        coursesCount: courses.length,
        unitsCount: units.length,
        assignmentsCount: assignments.length,
        coordinatorsCount: coordinators.length
      });

      // Transform courses to exactly match your Course interface and data structure
      const transformedCourses = courses.map(course => ({
        id: course.id,
        code: course.code,
        name: course.name,
        units: course.units.map(unit => unit.code), // Array of unit codes from data/courses.json
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString()
      }));

      // Transform units to exactly match your Unit interface and data structure  
      const transformedUnits = units.map(unit => ({
        id: unit.id,
        code: unit.code,
        name: unit.name,
        description: unit.description,
        courseCode: unit.courseCode, // Direct field, not from relation
        currentWeek: unit.currentWeek, // From your data structure
        createdAt: unit.createdAt.toISOString(),
        updatedAt: unit.updatedAt.toISOString()
      }));

      // Transform assignments to match your Assignment interface
      const transformedAssignments = assignments.map(assignment => ({
        id: assignment.id,
        name: assignment.name,
        unitCode: assignment.unitCode,
        deadline: assignment.deadline.toISOString(),
        publishedAt: assignment.publishedAt.toISOString(),
        status: assignment.status,
        createdAt: assignment.createdAt.toISOString(),
        updatedAt: assignment.updatedAt.toISOString()
      }));

      // Transform coordinators to match your Teacher interface
      const teachers = coordinators.map(coordinator => ({
        id: coordinator.id,
        email: coordinator.email,
        firstName: coordinator.firstName,
        lastName: coordinator.lastName,
        title: coordinator.title,
        accessLevel: coordinator.accessLevel,
        courseManaged: coordinator.courseManaged || [],
        unitsTeached: [], // TODO: Implement proper unit-teacher relationship tracking
      }));

      const result = {
        success: true, // ← CRITICAL: Add success field that frontend expects
        data: {
          courses: transformedCourses,
          units: transformedUnits,
          assignments: transformedAssignments,
          teachers, // Primary teacher data for frontend
          faculty: coordinators, // Keep for backward compatibility
          coordinators, // Keep for coordinator-specific data
        }
      };

      console.log('✅ AcademicDataService: Returning structured response:', {
        success: result.success,
        coursesCount: result.data.courses.length,
        unitsCount: result.data.units.length,
        firstCourse: result.data.courses[0],
        firstUnit: result.data.units[0]
      });

      return result;

    } catch (error) {
      console.error('❌ AcademicDataService: Error fetching academic data:', error);
      
      // Return error response in expected format
      return {
        success: false,
        error: 'Failed to fetch academic data',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: {
          courses: [],
          units: [],
          assignments: [],
          teachers: [],
          faculty: [],
          coordinators: []
        }
      };
    }
  }

  // GET /academic-data/summary - Quick summary stats
  async getAcademicSummary() {
    try {
      const [courseCount, unitCount, assignmentCount, studentCount, teacherCount] = await Promise.all([
        this.db.course.count(),
        this.db.unit.count(),
        this.db.assignment.count(),
        this.db.user.count({ where: { role: 'STUDENT' } }),
        this.db.user.count({ where: { role: 'COORDINATOR' } }),
      ]);

      return {
        success: true,
        data: {
          courseCount,
          unitCount,
          assignmentCount,
          studentCount,
          teacherCount,
        }
      };
    } catch (error) {
      console.error('❌ AcademicDataService: Error fetching summary:', error);
      return {
        success: false,
        error: 'Failed to fetch academic summary',
        data: null
      };
    }
  }

  // GET /academic-data/course/:courseCode - Course-specific academic data
  async getCourseAcademicData(courseCode: string) {
    try {
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
        return {
          success: false,
          error: 'Course not found',
          data: null
        };
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
        success: true,
        data: {
          course: {
            id: course.id,
            code: course.code,
            name: course.name,
            units: course.units.map(unit => unit.code),
            createdAt: course.createdAt.toISOString(),
            updatedAt: course.updatedAt.toISOString()
          },
          students,
          coordinators,
          units: course.units.map(unit => ({
            id: unit.id,
            code: unit.code,
            name: unit.name,
            description: unit.description,
            courseCode: unit.courseCode,
            currentWeek: unit.currentWeek,
            createdAt: unit.createdAt.toISOString(),
            updatedAt: unit.updatedAt.toISOString()
          })),
          assignments: course.units.flatMap(unit => unit.assignments.map(assignment => ({
            id: assignment.id,
            name: assignment.name,
            unitCode: assignment.unitCode,
            deadline: assignment.deadline.toISOString(),
            publishedAt: assignment.publishedAt.toISOString(),
            status: assignment.status,
            createdAt: assignment.createdAt.toISOString(),
            updatedAt: assignment.updatedAt.toISOString()
          }))),
        }
      };
    } catch (error) {
      console.error('❌ AcademicDataService: Error fetching course data:', error);
      return {
        success: false,
        error: 'Failed to fetch course data',
        data: null
      };
    }
  }

  // GET /academic-data/unit/:unitCode - Unit-specific academic data
  async getUnitAcademicData(unitCode: string) {
    try {
      const unit = await this.db.unit.findUnique({
        where: { code: unitCode },
        include: {
          course: true,
          assignments: true,
        },
      });

      if (!unit) {
        return {
          success: false,
          error: 'Unit not found',
          data: null
        };
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
        success: true,
        data: {
          unit: {
            id: unit.id,
            code: unit.code,
            name: unit.name,
            description: unit.description,
            courseCode: unit.courseCode,
            currentWeek: unit.currentWeek,
            createdAt: unit.createdAt.toISOString(),
            updatedAt: unit.updatedAt.toISOString()
          },
          students,
          assignments: unit.assignments.map(assignment => ({
            id: assignment.id,
            name: assignment.name,
            unitCode: assignment.unitCode,
            deadline: assignment.deadline.toISOString(),
            publishedAt: assignment.publishedAt.toISOString(),
            status: assignment.status,
            createdAt: assignment.createdAt.toISOString(),
            updatedAt: assignment.updatedAt.toISOString()
          })),
          progress,
          submissions,
        }
      };
    } catch (error) {
      console.error('❌ AcademicDataService: Error fetching unit data:', error);
      return {
        success: false,
        error: 'Failed to fetch unit data',
        data: null
      };
    }
  }

  // GET /academic-data/student/:studentId - Student-specific academic data
  async getStudentAcademicData(studentId: string) {
    try {
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
        return {
          success: false,
          error: 'Student not found or not enrolled in a course',
          data: null
        };
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
          course: course ? {
            id: course.id,
            code: course.code,
            name: course.name,
            units: course.units.map(unit => unit.code),
            createdAt: course.createdAt.toISOString(),
            updatedAt: course.updatedAt.toISOString()
          } : null,
          units: course?.units.map(unit => ({
            id: unit.id,
            code: unit.code,
            name: unit.name,
            description: unit.description,
            courseCode: unit.courseCode,
            currentWeek: unit.currentWeek,
            createdAt: unit.createdAt.toISOString(),
            updatedAt: unit.updatedAt.toISOString()
          })) || [],
          progress,
          submissions,
        }
      };
    } catch (error) {
      console.error('❌ AcademicDataService: Error fetching student data:', error);
      return {
        success: false,
        error: 'Failed to fetch student data',
        data: null
      };
    }
  }
}
/* import { Injectable } from '@nestjs/common';
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
} */