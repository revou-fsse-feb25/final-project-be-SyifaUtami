// src/analytics/analytics.service.ts - Debug version
import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../prisma/prisma.service';
import { 
  DashboardMetrics, 
  CourseMetrics, 
  UnitMetrics, 
  StudentAnalytics, 
  TrendData 
} from './interfaces/analytics.interface';

@Injectable()
export class AnalyticsService {
  constructor(private readonly db: DatabaseService) {}

  // GET /analytics/overview - Dashboard metrics for coordinators
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    console.log('=== ANALYTICS DEBUG START ===');
    
    try {
      console.log('About to count teachers from teacher table...');
      const teacherCount = await this.db.teacher.count();
      console.log('Teacher count result:', teacherCount);
      
      console.log('About to count students from user table...');
      const studentCount = await this.db.user.count({ where: { role: 'STUDENT' } });
      console.log('Student count result:', studentCount);
      
      console.log('About to count courses...');
      const courseCount = await this.db.course.count();
      console.log('Course count result:', courseCount);

      console.log('=== COUNTS COMPLETE ===');

      // Calculate average progress
      const allProgress = await this.db.studentProgress.findMany();
      const avgProgress = allProgress.length > 0 
        ? Math.round(allProgress.reduce((sum, progress) => {
            const completed = [
              progress.week1Material === 'DONE' ? 1 : 0,
              progress.week2Material === 'DONE' ? 1 : 0,
              progress.week3Material === 'DONE' ? 1 : 0,
              progress.week4Material === 'DONE' ? 1 : 0,
            ].reduce((weekSum, week) => weekSum + week, 0);
            return sum + (completed / 4) * 100;
          }, 0) / allProgress.length)
        : 0;

      // Calculate average grade
      const submissions = await this.db.studentAssignment.findMany({
        where: { grade: { not: null } },
      });
      const avgGrade = submissions.length > 0
        ? Math.round(submissions.reduce((sum, sub) => sum + (sub.grade || 0), 0) / submissions.length)
        : 0;

      // Calculate submission rate
      const [totalAssignments, submittedAssignments] = await Promise.all([
        this.db.studentAssignment.count(),
        this.db.studentAssignment.count({ where: { submissionStatus: 'SUBMITTED' } }),
      ]);
      const submissionRate = totalAssignments > 0 
        ? Math.round((submittedAssignments / totalAssignments) * 100)
        : 0;

      const result = {
        studentCount,
        teacherCount,
        courseCount,
        avgProgress,
        avgGrade,
        submissionRate,
      };

      console.log('=== FINAL RESULT ===', result);
      console.log('=== ANALYTICS DEBUG END ===');

      return result;
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      
      // Return safe defaults if there's an error
      return {
        studentCount: 0,
        teacherCount: 0,
        courseCount: 0,
        avgProgress: 0,
        avgGrade: 0,
        submissionRate: 0,
      };
    }
  }

  // Keep other methods unchanged for now
  async getCourseMetrics(courseCode: string): Promise<CourseMetrics> {
    // Get students in this course
    const studentCount = await this.db.user.count({
      where: { role: 'STUDENT', courseCode },
    });

    // Get units in this course
    const units = await this.db.unit.findMany({
      where: { courseCode },
      select: { code: true },
    });
    const unitCodes = units.map(unit => unit.code);

    // Get assignments in this course
    const assignmentCount = await this.db.assignment.count({
      where: { unitCode: { in: unitCodes } },
    });

    // Get teachers - use the same method as overview
    const teacherCount = await this.db.teacher.count();

    // Calculate course progress
    const courseProgress = await this.db.studentProgress.findMany({
      where: { 
        unitCode: { in: unitCodes },
        user: { courseCode },
      },
    });

    const avgProgress = courseProgress.length > 0
      ? Math.round(courseProgress.reduce((sum, progress) => {
          const completed = [
            progress.week1Material === 'DONE' ? 1 : 0,
            progress.week2Material === 'DONE' ? 1 : 0,
            progress.week3Material === 'DONE' ? 1 : 0,
            progress.week4Material === 'DONE' ? 1 : 0,
          ].reduce((weekSum, week) => weekSum + week, 0);
          return sum + (completed / 4) * 100;
        }, 0) / courseProgress.length)
      : 0;

    // Calculate course grades
    const courseSubmissions = await this.db.studentAssignment.findMany({
      where: {
        assignment: { unitCode: { in: unitCodes } },
        grade: { not: null },
      },
    });

    const avgGrade = courseSubmissions.length > 0
      ? Math.round(courseSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0) / courseSubmissions.length)
      : 0;

    // Calculate submission rate
    const [totalCourseAssignments, submittedCourseAssignments] = await Promise.all([
      this.db.studentAssignment.count({
        where: { assignment: { unitCode: { in: unitCodes } } },
      }),
      this.db.studentAssignment.count({
        where: {
          assignment: { unitCode: { in: unitCodes } },
          submissionStatus: 'SUBMITTED',
        },
      }),
    ]);

    const submissionRate = totalCourseAssignments > 0
      ? Math.round((submittedCourseAssignments / totalCourseAssignments) * 100)
      : 0;

    // Calculate failed assignments (grade < 60)
    const failedAssignments = await this.db.studentAssignment.count({
      where: {
        assignment: { unitCode: { in: unitCodes } },
        grade: { lt: 60 },
      },
    });

    return {
      studentCount,
      teacherCount,
      assignmentCount,
      avgProgress,
      avgGrade,
      submissionRate,
      failedAssignments,
    };
  }

  // Other methods remain unchanged
  async getUnitMetrics(unitCode: string): Promise<UnitMetrics> {
    throw new Error('Method not implemented yet');
  }

  async getStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
    throw new Error('Method not implemented yet');
  }

  async getTrends(period?: string): Promise<TrendData[]> {
    return [];
  }
}