import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../prisma/prisma.service';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { UpdateSubmissionDto } from './dto';

@Injectable()
export class SubmissionsService {
  constructor(private readonly db: DatabaseService) {}

  // GET /submissions/:submissionId - Individual submission with assignment
  async findOne(submissionId: string) {
    const submission = await this.db.studentAssignment.findUnique({
      where: { submissionId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignment: {
          include: {
            unit: { include: { course: true } },
          },
        },
      },
    });

    if (!submission) throw new NotFoundException('Submission not found');

    return {
      submission,
      assignment: submission.assignment,
    };
  }

  // PUT /submissions/:submissionId/grade - Update grades (coordinators)
  async updateGrade(submissionId: string, updateGradeDto: UpdateGradeDto) {
    const { grade, comment, gradedBy } = updateGradeDto;

    const submission = await this.db.studentAssignment.findUnique({
      where: { submissionId },
    });

    if (!submission) throw new NotFoundException('Submission not found');

    return this.db.studentAssignment.update({
      where: { submissionId },
      data: {
        grade,
        comment,
        gradedBy,
        gradedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignment: true,
      },
    });
  }

  // PUT /submissions/:submissionId - Update submission status (students)
  async updateSubmission(submissionId: string, updateSubmissionDto: UpdateSubmissionDto) {
    const submission = await this.db.studentAssignment.findUnique({
      where: { submissionId },
    });

    if (!submission) throw new NotFoundException('Submission not found');

    const updateData: any = { ...updateSubmissionDto };
    
    // Set submittedAt when submitting for first time
    if (updateSubmissionDto.submissionStatus === 'SUBMITTED' && !submission.submittedAt) {
      updateData.submittedAt = new Date();
    }

    return this.db.studentAssignment.update({
      where: { submissionId },
      data: updateData,
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignment: true,
      },
    });
  }

  // GET /submissions/student/:studentId - All submissions for a student
  async getStudentSubmissions(studentId: string) {
    return this.db.studentAssignment.findMany({
      where: { studentId },
      include: {
        assignment: {
          include: {
            unit: { include: { course: true } },
          },
        },
      },
      orderBy: {
        assignment: { deadline: 'asc' },
      },
    });
  }
}