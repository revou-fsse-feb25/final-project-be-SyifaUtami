import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../prisma/prisma.service';
import { GetStudentsDto } from './dto/get-students.dto';
import { PaginatedResult, StudentsWithDataResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class StudentsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(dto: GetStudentsDto): Promise<PaginatedResult<any> | StudentsWithDataResult> {
    const { page = 1, limit = 20, courseCode, includeData, search } = dto;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      role: 'STUDENT',
    };

    if (courseCode) {
      where.courseCode = courseCode;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get students with pagination
    const [students, total] = await Promise.all([
      this.db.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          courseCode: true,
          year: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { firstName: 'asc' },
      }),
      this.db.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    if (!includeData) {
      return {
        data: students,
        total,
        page,
        limit,
        totalPages,
      };
    }

    // Include additional data if requested
    const studentIds = students.map(s => s.id);
    
    const [assignments, progress] = await Promise.all([
      this.db.studentAssignment.findMany({
        where: { studentId: { in: studentIds } },
        include: {
          assignment: {
            include: {
              unit: true,
            },
          },
        },
      }),
      this.db.studentProgress.findMany({
        where: { studentId: { in: studentIds } },
        include: {
          unit: true,
        },
      }),
    ]);

    return {
      students,
      assignments,
      progress,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string) {
    const student = await this.db.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        courseCode: true,
        year: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get student's assignments and progress
    const [assignments, progress] = await Promise.all([
      this.db.studentAssignment.findMany({
        where: { studentId: id },
        include: {
          assignment: {
            include: {
              unit: {
                include: { course: true },
              },
            },
          },
        },
        orderBy: {
          assignment: { deadline: 'asc' },
        },
      }),
      this.db.studentProgress.findMany({
        where: { studentId: id },
        include: {
          unit: {
            include: { course: true },
          },
        },
      }),
    ]);

    return {
      student,
      assignments,
      progress,
    };
  }

  async getStudentStats(courseCode?: string) {
    const where: any = { role: 'STUDENT' };
    if (courseCode) {
      where.courseCode = courseCode;
    }

    const [totalStudents, activeStudents] = await Promise.all([
      this.db.user.count({ where }),
      this.db.user.count({
        where: {
          ...where,
          updatedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Active in last 30 days
          },
        },
      }),
    ]);

    // Get course distribution
    const courseDistribution = await this.db.user.groupBy({
      by: ['courseCode'],
      where: { role: 'STUDENT' },
      _count: {
        courseCode: true,
      },
    });

    // Get year distribution
    const yearDistribution = await this.db.user.groupBy({
      by: ['year'],
      where: { role: 'STUDENT' },
      _count: {
        year: true,
      },
    });

    // Calculate average grades
    const submissions = await this.db.studentAssignment.findMany({
      where: {
        grade: { not: null },
        ...(courseCode && {
          user: { courseCode },
        }),
      },
      select: {
        grade: true,
        studentId: true,
      },
    });

    const studentGrades = submissions.reduce((acc, sub) => {
      if (!acc[sub.studentId]) {
        acc[sub.studentId] = [];
      }
      acc[sub.studentId].push(sub.grade!);
      return acc;
    }, {} as Record<string, number[]>);

    const averageGrades = Object.values(studentGrades).map(grades => 
      grades.reduce((sum, grade) => sum + grade, 0) / grades.length
    );

    const overallAverageGrade = averageGrades.length > 0
      ? Math.round(averageGrades.reduce((sum, avg) => sum + avg, 0) / averageGrades.length)
      : 0;

    return {
      totalStudents,
      activeStudents,
      inactiveStudents: totalStudents - activeStudents,
      courseDistribution: courseDistribution.map(item => ({
        courseCode: item.courseCode,
        count: item._count.courseCode,
      })),
      yearDistribution: yearDistribution.map(item => ({
        year: item.year,
        count: item._count.year,
      })),
      overallAverageGrade,
      studentsWithGrades: Object.keys(studentGrades).length,
    };
  }

  // Get students with their average grades for coordinator view
  async getStudentsWithGrades(dto: GetStudentsDto) {
    const { page = 1, limit = 20, courseCode, search } = dto;
    const skip = (page - 1) * limit;

    const where: any = { role: 'STUDENT' };
    if (courseCode) where.courseCode = courseCode;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [students, total] = await Promise.all([
      this.db.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          courseCode: true,
          year: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { firstName: 'asc' },
      }),
      this.db.user.count({ where }),
    ]);

    // Get grades for these students
    const studentIds = students.map(s => s.id);
    const submissions = await this.db.studentAssignment.findMany({
      where: {
        studentId: { in: studentIds },
        grade: { not: null },
      },
      select: {
        studentId: true,
        grade: true,
        submissionStatus: true,
      },
    });

    // Calculate metrics for each student
    const studentsWithGrades = students.map(student => {
      const studentSubmissions = submissions.filter(s => s.studentId === student.id);
      const grades = studentSubmissions.filter(s => s.grade !== null).map(s => s.grade!);
      const submittedCount = studentSubmissions.filter(s => s.submissionStatus === 'SUBMITTED').length;
      
      const averageGrade = grades.length > 0
        ? Math.round(grades.reduce((sum, grade) => sum + grade, 0) / grades.length)
        : 0;

      return {
        ...student,
        averageGrade,
        totalSubmissions: studentSubmissions.length,
        submittedCount,
        gradedCount: grades.length,
      };
    });

    return {
      data: studentsWithGrades,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get student's enrolled units
  async getStudentUnits(studentId: string) {
    const student = await this.db.user.findUnique({
      where: { id: studentId },
      select: { courseCode: true },
    });

    if (!student?.courseCode) {
      throw new NotFoundException('Student not found or not enrolled in a course');
    }

    // Get units for the student's course
    const units = await this.db.unit.findMany({
      where: { courseCode: student.courseCode },
      include: {
        course: true,
        assignments: {
          select: {
            id: true,
            name: true,
            deadline: true,
            status: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });

    // Get student's progress for these units
    const progress = await this.db.studentProgress.findMany({
      where: {
        studentId,
        unitCode: { in: units.map(u => u.code) },
      },
    });

    // Combine units with progress
    const unitsWithProgress = units.map(unit => {
      const unitProgress = progress.find(p => p.unitCode === unit.code);
      
      let progressPercentage = 0;
      if (unitProgress) {
        const completed = [
          unitProgress.week1Material === 'DONE' ? 1 : 0,
          unitProgress.week2Material === 'DONE' ? 1 : 0,
          unitProgress.week3Material === 'DONE' ? 1 : 0,
          unitProgress.week4Material === 'DONE' ? 1 : 0,
        ].reduce((sum, week) => sum + week, 0);
        progressPercentage = Math.round((completed / 4) * 100);
      }

      return {
        ...unit,
        progressPercentage,
        progress: unitProgress,
      };
    });

    return unitsWithProgress;
  }
}