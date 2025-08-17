import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../prisma/prisma.service';

export interface DashboardMetrics {
  overview: {
    totalStudents: number;
    totalCoordinators: number;
    totalCourses: number;
    totalUnits: number;
    totalAssignments: number;
  };
  performance: {
    avgProgress: number;        // 0-100%
    avgGrade: number;          // 0-100 
    submissionRate: number;    // 0-100%
    onTimeSubmissionRate: number;
  };
  distribution: {
    gradeDistribution: { range: string; count: number }[];
    progressDistribution: { range: string; count: number }[];
    courseDistribution: { courseCode: string; studentCount: number }[];
  };
}

export interface CourseMetrics {
  courseInfo: {
    code: string;
    name: string;
    studentCount: number;
    unitCount: number;
    assignmentCount: number;
  };
  performance: {
    avgProgress: number;
    avgGrade: number;
    submissionRate: number;
    completionRate: number;  // FIXED: Added missing property
  };
  students: {
    activeStudents: number;
    strugglingStudents: number; // <50% avg grade
    excellentStudents: number;  // >85% avg grade
  };
}

export interface UnitMetrics {
  unitInfo: {
    code: string;
    name: string;
    courseCode: string;
    studentCount: number;
    assignmentCount: number;
  };
  performance: {
    avgProgress: number;
    avgGrade: number;
    submissionRate: number;
    avgCompletionTime: number; // FIXED: Added missing property (days)
  };
  assignments: {
    completedAssignments: number;
    pendingAssignments: number;
    overdueAssignments: number;
  };
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly db: DatabaseService) {}

  // === MAIN DASHBOARD METRICS ===
  async getDashboardMetrics(courseCode?: string): Promise<DashboardMetrics> {
    const filters = this.buildFilters(courseCode);
    
    const [overview, performance, distribution] = await Promise.all([
      this.getOverviewMetrics(filters),
      this.getPerformanceMetrics(filters),
      this.getDistributionMetrics(filters),
    ]);

    return { overview, performance, distribution };
  }

  // === COURSE-SPECIFIC METRICS ===
  async getCourseMetrics(courseCode: string): Promise<CourseMetrics> {
    const filters = this.buildFilters(courseCode);
    
    const [courseInfo, performance, students] = await Promise.all([
      this.getCourseInfo(courseCode),
      this.getCoursePerformanceMetrics(filters), // FIXED: Use specific method
      this.getStudentSegmentation(filters),
    ]);

    return { courseInfo, performance, students };
  }

  // === UNIT-SPECIFIC METRICS ===
  async getUnitMetrics(unitCode: string): Promise<UnitMetrics> {
    const unit = await this.db.unit.findUnique({
      where: { code: unitCode },
      include: { course: true },
    });

    if (!unit) {
      throw new Error('Unit not found');
    }

    const filters = this.buildFilters(unit.courseCode, unitCode);
    
    const [unitInfo, performance, assignments] = await Promise.all([
      this.getUnitInfo(unitCode),
      this.getUnitPerformanceMetrics(filters), // FIXED: Use specific method
      this.getAssignmentBreakdown(filters),
    ]);

    return { unitInfo, performance, assignments };
  }

  // === HELPER METHODS ===
  private buildFilters(courseCode?: string, unitCode?: string) {
    const studentWhere: any = { role: 'STUDENT' };
    const submissionWhere: any = {};
    const progressWhere: any = {};
    const assignmentWhere: any = {};

    if (courseCode) {
      studentWhere.courseCode = courseCode;
      submissionWhere.student = { courseCode };
      progressWhere.student = { courseCode };
      assignmentWhere.unit = { courseCode };
    }

    if (unitCode) {
      submissionWhere.assignment = { unitCode };
      progressWhere.unitCode = unitCode;
      assignmentWhere.unitCode = unitCode;
    }

    return {
      studentWhere,
      submissionWhere,
      progressWhere,
      assignmentWhere,
    };
  }

  // FIXED: Proper conditional queries
  private async getOverviewMetrics(filters: any) {
    const [totalStudents, totalCoordinators, totalCourses] = await Promise.all([
      this.db.user.count({ where: filters.studentWhere }),
      this.db.user.count({ where: { role: 'COORDINATOR' } }),
      this.db.course.count(),
    ]);

    // Handle conditional counts properly
    let totalUnits, totalAssignments;

    if (filters.assignmentWhere.unit?.courseCode) {
      // Course-specific counts
      [totalUnits, totalAssignments] = await Promise.all([
        this.db.unit.count({ where: { courseCode: filters.assignmentWhere.unit.courseCode } }),
        this.db.assignment.count({ where: filters.assignmentWhere }),
      ]);
    } else if (filters.assignmentWhere.unitCode) {
      // Unit-specific counts
      [totalUnits, totalAssignments] = await Promise.all([
        this.db.unit.count({ where: { code: filters.assignmentWhere.unitCode } }),
        this.db.assignment.count({ where: { unitCode: filters.assignmentWhere.unitCode } }),
      ]);
    } else {
      // Global counts
      [totalUnits, totalAssignments] = await Promise.all([
        this.db.unit.count(),
        this.db.assignment.count(),
      ]);
    }

    return {
      totalStudents,
      totalCoordinators,
      totalCourses,
      totalUnits,
      totalAssignments,
    };
  }

  private async getPerformanceMetrics(filters: any) {
    const [progressData, submissionData] = await Promise.all([
      this.db.studentProgress.findMany({
        where: Object.keys(filters.progressWhere).length > 0 ? filters.progressWhere : undefined,
      }),
      this.db.studentAssignment.findMany({
        where: Object.keys(filters.submissionWhere).length > 0 ? filters.submissionWhere : undefined,
        include: { assignment: true },
      }),
    ]);

    // Calculate average progress
    const avgProgress = this.calculateAverageProgress(progressData);

    // Calculate grade metrics
    const gradedSubmissions = submissionData.filter(s => s.grade !== null);
    const avgGrade = gradedSubmissions.length > 0 
      ? gradedSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / gradedSubmissions.length
      : 0;

    // Calculate submission rate
    const totalSubmissions = submissionData.length;
    const submittedCount = submissionData.filter(s => s.submissionStatus === 'SUBMITTED').length;
    const submissionRate = totalSubmissions > 0 ? (submittedCount / totalSubmissions) * 100 : 0;

    // Calculate on-time submission rate
    const onTimeSubmissions = submissionData.filter(s => 
      s.submissionStatus === 'SUBMITTED' && 
      s.submittedAt && 
      s.submittedAt <= s.assignment.deadline
    ).length;
    const onTimeSubmissionRate = submittedCount > 0 ? (onTimeSubmissions / submittedCount) * 100 : 0;

    return {
      avgProgress: Math.round(avgProgress * 100) / 100,
      avgGrade: Math.round(avgGrade * 100) / 100,
      submissionRate: Math.round(submissionRate * 100) / 100,
      onTimeSubmissionRate: Math.round(onTimeSubmissionRate * 100) / 100,
    };
  }

  // FIXED: Course-specific performance with completionRate
  private async getCoursePerformanceMetrics(filters: any) {
    const baseMetrics = await this.getPerformanceMetrics(filters);

    // Calculate completion rate (students who completed all assignments vs total students)
    const [totalStudents, studentsWithAllAssignments] = await Promise.all([
      this.db.user.count({ where: filters.studentWhere }),
      this.getStudentsWithAllAssignmentsCompleted(filters),
    ]);

    const completionRate = totalStudents > 0 ? (studentsWithAllAssignments / totalStudents) * 100 : 0;

    return {
      ...baseMetrics,
      completionRate: Math.round(completionRate * 100) / 100,
    };
  }

  // FIXED: Unit-specific performance with avgCompletionTime
  private async getUnitPerformanceMetrics(filters: any) {
    const baseMetrics = await this.getPerformanceMetrics(filters);

    // Calculate average completion time
    const submissionsWithTime = await this.db.studentAssignment.findMany({
      where: {
        ...filters.submissionWhere,
        submissionStatus: 'SUBMITTED',
        submittedAt: { not: null },
      },
      include: { assignment: true },
    });

    let avgCompletionTime = 0;
    if (submissionsWithTime.length > 0) {
      const completionTimes = submissionsWithTime.map(sub => {
        const publishedAt = new Date(sub.assignment.publishedAt);
        const submittedAt = new Date(sub.submittedAt!);
        return Math.abs(submittedAt.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24); // days
      });
      
      avgCompletionTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
    }

    return {
      ...baseMetrics,
      avgCompletionTime: Math.round(avgCompletionTime * 100) / 100,
    };
  }

  private async getDistributionMetrics(filters: any) {
    const [submissionData, progressData, courseData] = await Promise.all([
      this.db.studentAssignment.findMany({
        where: Object.keys(filters.submissionWhere).length > 0 ? filters.submissionWhere : undefined,
        select: { grade: true },
      }),
      this.db.studentProgress.findMany({
        where: Object.keys(filters.progressWhere).length > 0 ? filters.progressWhere : undefined,
      }),
      this.db.user.groupBy({
        by: ['courseCode'],
        where: filters.studentWhere,
        _count: { id: true },
      }),
    ]);

    // Grade distribution
    const gradeDistribution = this.calculateGradeDistribution(submissionData);
    
    // Progress distribution
    const progressDistribution = this.calculateProgressDistribution(progressData);
    
    // Course distribution
    const courseDistribution = courseData.map(item => ({
      courseCode: item.courseCode || 'Unknown',
      studentCount: item._count.id,
    }));

    return {
      gradeDistribution,
      progressDistribution,
      courseDistribution,
    };
  }

  private async getCourseInfo(courseCode: string) {
    const [course, studentCount, unitCount, assignmentCount] = await Promise.all([
      this.db.course.findUnique({ where: { code: courseCode } }),
      this.db.user.count({ where: { role: 'STUDENT', courseCode } }),
      this.db.unit.count({ where: { courseCode } }),
      this.db.assignment.count({ where: { unit: { courseCode } } }),
    ]);

    if (!course) {
      throw new Error('Course not found');
    }

    return {
      code: course.code,
      name: course.name,
      studentCount,
      unitCount,
      assignmentCount,
    };
  }

  private async getUnitInfo(unitCode: string) {
    const [unit, studentCount, assignmentCount] = await Promise.all([
      this.db.unit.findUnique({ 
        where: { code: unitCode },
        include: { course: true },
      }),
      this.db.studentProgress.count({ where: { unitCode } }),
      this.db.assignment.count({ where: { unitCode } }),
    ]);

    if (!unit) {
      throw new Error('Unit not found');
    }

    return {
      code: unit.code,
      name: unit.name,
      courseCode: unit.courseCode,
      studentCount,
      assignmentCount,
    };
  }

  private async getStudentSegmentation(filters: any) {
    const submissions = await this.db.studentAssignment.findMany({
      where: Object.keys(filters.submissionWhere).length > 0 ? filters.submissionWhere : undefined,
      select: { studentId: true, grade: true },
    });

    // Group by student and calculate average grade
    const studentGrades = submissions.reduce((acc, sub) => {
      if (sub.grade !== null) {
        if (!acc[sub.studentId]) {
          acc[sub.studentId] = { total: 0, count: 0 };
        }
        acc[sub.studentId].total += sub.grade;
        acc[sub.studentId].count++;
      }
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const studentAvgGrades = Object.values(studentGrades).map(s => s.total / s.count);
    
    const strugglingStudents = studentAvgGrades.filter(grade => grade < 50).length;
    const excellentStudents = studentAvgGrades.filter(grade => grade >= 85).length;
    const activeStudents = studentAvgGrades.length;

    return {
      activeStudents,
      strugglingStudents,
      excellentStudents,
    };
  }

  private async getAssignmentBreakdown(filters: any) {
    const assignments = await this.db.assignment.findMany({
      where: Object.keys(filters.assignmentWhere).length > 0 ? filters.assignmentWhere : undefined,
      include: {
        studentAssignments: {
          select: { submissionStatus: true, submittedAt: true },
        },
      },
    });

    let completedAssignments = 0;
    let pendingAssignments = 0;
    let overdueAssignments = 0;

    assignments.forEach(assignment => {
      const now = new Date();
      const isOverdue = now > assignment.deadline;
      
      assignment.studentAssignments.forEach(submission => {
        if (submission.submissionStatus === 'SUBMITTED') {
          completedAssignments++;
        } else if (isOverdue) {
          overdueAssignments++;
        } else {
          pendingAssignments++;
        }
      });
    });

    return {
      completedAssignments,
      pendingAssignments,
      overdueAssignments,
    };
  }

  // Helper method for course completion rate
  private async getStudentsWithAllAssignmentsCompleted(filters: any): Promise<number> {
    const students = await this.db.user.findMany({ where: filters.studentWhere });
    const assignments = await this.db.assignment.findMany({
      where: Object.keys(filters.assignmentWhere).length > 0 ? filters.assignmentWhere : undefined,
    });

    let studentsWithAllCompleted = 0;

    for (const student of students) {
      const studentSubmissions = await this.db.studentAssignment.findMany({
        where: {
          studentId: student.id,
          assignmentId: { in: assignments.map(a => a.id) },
          submissionStatus: 'SUBMITTED',
        },
      });

      if (studentSubmissions.length === assignments.length) {
        studentsWithAllCompleted++;
      }
    }

    return studentsWithAllCompleted;
  }

  // === UTILITY METHODS ===
  private calculateAverageProgress(progressData: any[]): number {
    if (progressData.length === 0) return 0;

    const progressPercentages = progressData.map(p => {
      const completed = [
        p.week1Material === 'DONE' ? 1 : 0,
        p.week2Material === 'DONE' ? 1 : 0,
        p.week3Material === 'DONE' ? 1 : 0,
        p.week4Material === 'DONE' ? 1 : 0,
      ].reduce((sum, val) => sum + val, 0);
      return (completed / 4) * 100;
    });

    return progressPercentages.reduce((sum, p) => sum + p, 0) / progressPercentages.length;
  }

  private calculateGradeDistribution(submissionData: any[]) {
    const grades = submissionData.filter(s => s.grade !== null).map(s => s.grade);
    const ranges = [
      { range: '0-49', min: 0, max: 49 },
      { range: '50-59', min: 50, max: 59 },
      { range: '60-69', min: 60, max: 69 },
      { range: '70-79', min: 70, max: 79 },
      { range: '80-89', min: 80, max: 89 },
      { range: '90-100', min: 90, max: 100 },
    ];

    return ranges.map(range => ({
      range: range.range,
      count: grades.filter(grade => grade >= range.min && grade <= range.max).length,
    }));
  }

  private calculateProgressDistribution(progressData: any[]) {
    const progressPercentages = progressData.map(p => {
      const completed = [
        p.week1Material === 'DONE' ? 1 : 0,
        p.week2Material === 'DONE' ? 1 : 0,
        p.week3Material === 'DONE' ? 1 : 0,
        p.week4Material === 'DONE' ? 1 : 0,
      ].reduce((sum, val) => sum + val, 0);
      return (completed / 4) * 100;
    });

    const ranges = [
      { range: '0-25%', min: 0, max: 25 },
      { range: '26-50%', min: 26, max: 50 },
      { range: '51-75%', min: 51, max: 75 },
      { range: '76-100%', min: 76, max: 100 },
    ];

    return ranges.map(range => ({
      range: range.range,
      count: progressPercentages.filter(p => p >= range.min && p <= range.max).length,
    }));
  }
}
