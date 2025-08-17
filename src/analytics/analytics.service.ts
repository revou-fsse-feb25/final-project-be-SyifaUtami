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
    const [studentCount, teacherCount, courseCount] = await Promise.all([
      this.db.user.count({ where: { role: 'STUDENT' } }),
      this.db.user.count({ where: { role: 'COORDINATOR' } }),
      this.db.course.count(),
    ]);

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

    return {
      studentCount,
      teacherCount,
      courseCount,
      avgProgress,
      avgGrade,
      submissionRate,
    };
  }

  // GET /analytics/course/:courseCode - Course-specific metrics
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

    // Get teachers (coordinators managing this course)
    const teacherCount = await this.db.user.count({
      where: { 
        role: 'COORDINATOR',
        courseManaged: { has: courseCode },
      },
    });

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

  // GET /analytics/unit/:unitCode - Unit-specific metrics
  async getUnitMetrics(unitCode: string): Promise<UnitMetrics> {
    // Get unit info
    const unit = await this.db.unit.findUnique({
      where: { code: unitCode },
      include: { course: true },
    });

    if (!unit) {
      throw new Error('Unit not found');
    }

    // Get students enrolled in this unit's course
    const studentCount = await this.db.user.count({
      where: { role: 'STUDENT', courseCode: unit.courseCode },
    });

    // Get teachers for this unit (assuming teachers assigned to course)
    const teacherCount = await this.db.user.count({
      where: {
        role: 'COORDINATOR',
        courseManaged: { has: unit.courseCode },
      },
    });

    // Get assignments in this unit
    const assignmentCount = await this.db.assignment.count({
      where: { unitCode },
    });

    // Calculate unit progress
    const unitProgress = await this.db.studentProgress.findMany({
      where: { unitCode },
    });

    const avgProgress = unitProgress.length > 0
      ? Math.round(unitProgress.reduce((sum, progress) => {
          const completed = [
            progress.week1Material === 'DONE' ? 1 : 0,
            progress.week2Material === 'DONE' ? 1 : 0,
            progress.week3Material === 'DONE' ? 1 : 0,
            progress.week4Material === 'DONE' ? 1 : 0,
          ].reduce((weekSum, week) => weekSum + week, 0);
          return sum + (completed / 4) * 100;
        }, 0) / unitProgress.length)
      : 0;

    // Calculate unit grades
    const unitSubmissions = await this.db.studentAssignment.findMany({
      where: {
        assignment: { unitCode },
        grade: { not: null },
      },
    });

    const avgGrade = unitSubmissions.length > 0
      ? Math.round(unitSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0) / unitSubmissions.length)
      : 0;

    // Calculate submission rate
    const [totalUnitAssignments, submittedUnitAssignments] = await Promise.all([
      this.db.studentAssignment.count({
        where: { assignment: { unitCode } },
      }),
      this.db.studentAssignment.count({
        where: {
          assignment: { unitCode },
          submissionStatus: 'SUBMITTED',
        },
      }),
    ]);

    const submissionRate = totalUnitAssignments > 0
      ? Math.round((submittedUnitAssignments / totalUnitAssignments) * 100)
      : 0;

    // Calculate failed assignments
    const failedAssignments = await this.db.studentAssignment.count({
      where: {
        assignment: { unitCode },
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

  // GET /analytics/student/:studentId - Student-specific analytics
  async getStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
    const student = await this.db.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        courseCode: true,
        year: true,
      },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    // Get student's assignments and submissions
    const submissions = await this.db.studentAssignment.findMany({
      where: { studentId },
      include: {
        assignment: {
          include: { unit: true },
        },
      },
    });

    // Calculate student metrics
    const totalAssignments = submissions.length;
    const submittedAssignments = submissions.filter(s => s.submissionStatus === 'SUBMITTED').length;
    const gradedAssignments = submissions.filter(s => s.grade !== null);
    
    const averageGrade = gradedAssignments.length > 0
      ? Math.round(gradedAssignments.reduce((sum, sub) => sum + (sub.grade || 0), 0) / gradedAssignments.length)
      : 0;

    // Get student progress
    const progress = await this.db.studentProgress.findMany({
      where: { studentId },
    });

    const overallProgress = progress.length > 0
      ? Math.round(progress.reduce((sum, prog) => {
          const completed = [
            prog.week1Material === 'DONE' ? 1 : 0,
            prog.week2Material === 'DONE' ? 1 : 0,
            prog.week3Material === 'DONE' ? 1 : 0,
            prog.week4Material === 'DONE' ? 1 : 0,
          ].reduce((weekSum, week) => weekSum + week, 0);
          return sum + (completed / 4) * 100;
        }, 0) / progress.length)
      : 0;

    return {
      student,
      metrics: {
        totalAssignments,
        submittedAssignments,
        submissionRate: totalAssignments > 0 ? Math.round((submittedAssignments / totalAssignments) * 100) : 0,
        averageGrade,
        overallProgress,
        gradedAssignments: gradedAssignments.length,
      },
      submissions,
      progress,
    };
  }

  // GET /analytics/trends - Get trending data over time
  async getTrends(period: 'week' | 'month' | 'quarter' = 'month'): Promise<TrendData[]> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default: // month
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get submissions over time
    const submissions = await this.db.studentAssignment.findMany({
      where: {
        submittedAt: {
          gte: startDate,
        },
      },
      select: {
        submittedAt: true,
        grade: true,
      },
    });

    // Group by date and calculate daily metrics
    const dailyMetrics = submissions.reduce((acc, submission) => {
      if (!submission.submittedAt) return acc;
      
      const date = submission.submittedAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { submissions: 0, totalGrade: 0, gradeCount: 0 };
      }
      
      acc[date].submissions++;
      if (submission.grade !== null) {
        acc[date].totalGrade += submission.grade;
        acc[date].gradeCount++;
      }
      
      return acc;
    }, {} as Record<string, { submissions: number; totalGrade: number; gradeCount: number }>);

    // Convert to array format
    const trends = Object.entries(dailyMetrics).map(([date, data]) => ({
      date,
      submissions: data.submissions,
      averageGrade: data.gradeCount > 0 ? Math.round(data.totalGrade / data.gradeCount) : 0,
    }));

    return trends.sort((a, b) => a.date.localeCompare(b.date));
  }
}