export interface DashboardMetrics {
  studentCount: number;
  teacherCount: number;
  courseCount: number;
  avgProgress: number;
  avgGrade: number;
  submissionRate: number;
}

export interface CourseMetrics {
  studentCount: number;
  teacherCount: number;
  assignmentCount: number;
  avgProgress: number;
  avgGrade: number;
  submissionRate: number;
  failedAssignments: number;
}

export interface UnitMetrics {
  studentCount: number;
  teacherCount: number;
  assignmentCount: number;
  avgProgress: number;
  avgGrade: number;
  submissionRate: number;
  failedAssignments: number;
}

export interface StudentAnalytics {
  student: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string | null;
    courseCode: string | null;
    year: number | null;
  };
  metrics: {
    totalAssignments: number;
    submittedAssignments: number;
    submissionRate: number;
    averageGrade: number;
    overallProgress: number;
    gradedAssignments: number;
  };
  submissions: any[];
  progress: any[];
}

export interface TrendData {
  date: string;
  submissions: number;
  averageGrade: number;
}