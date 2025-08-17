import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../prisma/prisma.service';
import { GetAssignmentsDto } from './dto/get-assignments';

@Injectable()
export class AssignmentsService {
  constructor(private readonly db: DatabaseService) {}

  // GET /assignments - Complex filtering with optional submissions
  async findAll(dto: GetAssignmentsDto) {
    const { 
      page = 1, limit = 20, id, unitCode, studentId, 
      status, submissionStatus, includeSubmissions 
    } = dto;

    const skip = (page - 1) * limit;
    const where: any = {};
    
    if (id) where.id = id;
    if (unitCode) where.unitCode = unitCode;
    if (status) where.status = status.toUpperCase();

    // If studentId + includeSubmissions, filter by student's enrolled units
    if (studentId && includeSubmissions) {
      const studentSubmissions = await this.db.studentAssignment.findMany({
        where: { studentId },
        include: { assignment: true },
      });

      const enrolledUnits = [...new Set(
        studentSubmissions.map(sub => sub.assignment.unitCode)
      )];

      if (enrolledUnits.length > 0) {
        where.unitCode = { in: enrolledUnits };
      }
    }

    const [assignments, total] = await Promise.all([
      this.db.assignment.findMany({
        where,
        include: {
          unit: { include: { course: true } },
        },
        skip, take: limit,
        orderBy: { deadline: 'asc' },
      }),
      this.db.assignment.count({ where }),
    ]);

    if (!includeSubmissions) {
      return assignments; // Simple array
    }

    // Get submissions with student data
    const assignmentIds = assignments.map(a => a.id);
    let submissionWhere: any = { assignmentId: { in: assignmentIds } };
    
    if (studentId) submissionWhere.studentId = studentId;
    if (submissionStatus) submissionWhere.submissionStatus = submissionStatus.toUpperCase();

    const rawSubmissions = await this.db.studentAssignment.findMany({
      where: submissionWhere,
    });

    const studentIds = [...new Set(rawSubmissions.map(s => s.studentId))];
    const students = await this.db.user.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    const submissions = rawSubmissions.map(submission => ({
      ...submission,
      student: students.find(student => student.id === submission.studentId),
    }));

    return { assignments, submissions };
  }

  // GET /assignments/:id - Individual assignment with optional submissions
  async findOne(id: string, includeSubmissions = false) {
    const assignment = await this.db.assignment.findUnique({
      where: { id },
      include: {
        unit: { include: { course: true } },
      },
    });

    if (!assignment) throw new Error('Assignment not found');

    if (!includeSubmissions) return assignment;

    const rawSubmissions = await this.db.studentAssignment.findMany({
      where: { assignmentId: id },
    });

    const studentIds = [...new Set(rawSubmissions.map(s => s.studentId))];
    const students = await this.db.user.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    const submissions = rawSubmissions.map(submission => ({
      ...submission,
      student: students.find(student => student.id === submission.studentId),
    }));

    return {
      assignment,
      submissions,
      totalSubmissions: submissions.length,
      submittedCount: submissions.filter(s => s.submissionStatus === 'SUBMITTED').length,
      gradedCount: submissions.filter(s => s.grade !== null).length,
    };
  }
}