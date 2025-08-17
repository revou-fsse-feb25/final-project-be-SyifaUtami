import { Injectable } from '@nestjs/common';
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
      // Return simple paginated result
      return {
        data: students, // This is an array, so it matches PaginatedResult<T>
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
          assignment: true,
        },
      }),
      this.db.studentProgress.findMany({
        where: { studentId: { in: studentIds } },
      }),
    ]);

    // Return the specialized interface for data with additional info
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
    const student = await this.db.user.findFirst({
      where: { id, role: 'STUDENT' },
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

    if (!student) {
      throw new Error('Student not found');
    }

    // Get student's assignments and progress
    const [assignments, progress] = await Promise.all([
      this.db.studentAssignment.findMany({
        where: { studentId: id },
        include: {
          assignment: {
            include: {
              unit: true,
            },
          },
        },
      }),
      this.db.studentProgress.findMany({
        where: { studentId: id },
        include: {
          unit: {
            include: {
              course: true,
            },
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

  // Calculate student statistics for coordinator overview
  async getStudentStats(courseCode?: string) {
    const where: any = { role: 'STUDENT' };
    if (courseCode) {
      where.courseCode = courseCode;
    }

    const totalStudents = await this.db.user.count({ where });

    // Calculate average progress across all units
    const progressData = await this.db.studentProgress.findMany({
      where: courseCode ? { 
        student: { courseCode } 
      } : {},
      include: {
        student: true,
      },
    });

    // Calculate average submission rate
    const submissionData = await this.db.studentAssignment.findMany({
      where: courseCode ? {
        student: { courseCode }
      } : {},
      include: {
        student: true,
      },
    });

    const totalSubmissions = submissionData.length;
    const submittedCount = submissionData.filter(s => s.submissionStatus === 'SUBMITTED').length;
    const avgSubmissionRate = totalSubmissions > 0 ? (submittedCount / totalSubmissions) * 100 : 0;

    // Calculate average grade
    const gradedSubmissions = submissionData.filter(s => s.grade !== null);
    const avgGrade = gradedSubmissions.length > 0 
      ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
      : 0;

    // Calculate average progress percentage
    let avgProgress = 0;
    if (progressData.length > 0) {
      const progressPercentages = progressData.map(p => {
        const completed = [
          p.week1Material === 'DONE' ? 1 : 0,
          p.week2Material === 'DONE' ? 1 : 0,
          p.week3Material === 'DONE' ? 1 : 0,
          p.week4Material === 'DONE' ? 1 : 0,
        ].reduce((sum, val) => sum + val, 0);
        return (completed / 4) * 100;
      });
      
      avgProgress = progressPercentages.reduce((sum, p) => sum + p, 0) / progressPercentages.length;
    }

    return {
      totalStudents,
      avgProgress,
      avgSubmissionRate,
      avgGrade,
    };
  }
}
