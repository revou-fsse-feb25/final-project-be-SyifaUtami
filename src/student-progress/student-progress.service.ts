
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../prisma/prisma.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { MaterialStatus } from '@prisma/client';

@Injectable()
export class StudentProgressService {
  constructor(private readonly db: DatabaseService) {}

  // Get all progress for a student
  async getStudentProgress(studentId: string) {
    const progress = await this.db.studentProgress.findMany({
      where: { studentId },
      include: {
        unit: {
          include: { course: true },
        },
      },
      orderBy: {
        unit: { code: 'asc' },
      },
    });

    return progress;
  }

  // Get progress for a specific student and unit
  async getStudentUnitProgress(studentId: string, unitCode: string) {
    const progress = await this.db.studentProgress.findUnique({
      where: {
        studentId_unitCode: {
          studentId,
          unitCode,
        },
      },
      include: {
        unit: {
          include: { course: true },
        },
      },
    });

    if (!progress) {
      throw new NotFoundException('Progress record not found');
    }

    return progress;
  }

  // Create initial progress record for a student in a unit
  async createProgress(createProgressDto: CreateProgressDto) {
    const { studentId, unitCode } = createProgressDto;

    // Check if student and unit exist
    const [student, unit] = await Promise.all([
      this.db.user.findUnique({ where: { id: studentId } }),
      this.db.unit.findUnique({ where: { code: unitCode } }),
    ]);

    if (!student) {
      throw new NotFoundException('Student not found');
    }
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    // Check if progress already exists
    const existingProgress = await this.db.studentProgress.findUnique({
      where: {
        studentId_unitCode: {
          studentId,
          unitCode,
        },
      },
    });

    if (existingProgress) {
      return existingProgress;
    }

    // Create new progress record
    const progress = await this.db.studentProgress.create({
      data: {
        studentId,
        unitCode,
        week1Material: MaterialStatus.NOT_DONE,
        week2Material: MaterialStatus.NOT_DONE,
        week3Material: MaterialStatus.NOT_DONE,
        week4Material: MaterialStatus.NOT_DONE,
      },
      include: {
        unit: {
          include: { course: true },
        },
      },
    });

    return progress;
  }

  // Update progress for a specific student and unit
  async updateProgress(
    studentId: string,
    unitCode: string,
    updateProgressDto: UpdateProgressDto,
  ) {
    // Check if progress record exists
    const existingProgress = await this.db.studentProgress.findUnique({
      where: {
        studentId_unitCode: {
          studentId,
          unitCode,
        },
      },
    });

    if (!existingProgress) {
      throw new NotFoundException('Progress record not found');
    }

    const progress = await this.db.studentProgress.update({
      where: {
        studentId_unitCode: {
          studentId,
          unitCode,
        },
      },
      data: {
        ...updateProgressDto,
        lastUpdated: new Date(),
      },
      include: {
        unit: {
          include: { course: true },
        },
      },
    });

    return progress;
  }

  // Calculate progress percentage for a student in a unit
  async calculateProgressPercentage(studentId: string, unitCode: string): Promise<number> {
    const progress = await this.db.studentProgress.findUnique({
      where: {
        studentId_unitCode: {
          studentId,
          unitCode,
        },
      },
    });

    if (!progress) {
      return 0;
    }

    const completedWeeks = [
      progress.week1Material === MaterialStatus.DONE ? 1 : 0,
      progress.week2Material === MaterialStatus.DONE ? 1 : 0,
      progress.week3Material === MaterialStatus.DONE ? 1 : 0,
      progress.week4Material === MaterialStatus.DONE ? 1 : 0,
    ].reduce((sum, week) => sum + week, 0);

    return Math.round((completedWeeks / 4) * 100);
  }

  // Get progress summary for all students in a unit (for coordinators)
  async getUnitProgressSummary(unitCode: string) {
    const progressRecords = await this.db.studentProgress.findMany({
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
        unit: {
          include: { course: true },
        },
      },
      orderBy: {
        user: { firstName: 'asc' },
      },
    });

    // Calculate percentage for each student
    const progressSummary = progressRecords.map((progress) => {
      const completedWeeks = [
        progress.week1Material === MaterialStatus.DONE ? 1 : 0,
        progress.week2Material === MaterialStatus.DONE ? 1 : 0,
        progress.week3Material === MaterialStatus.DONE ? 1 : 0,
        progress.week4Material === MaterialStatus.DONE ? 1 : 0,
      ].reduce((sum, week) => sum + week, 0);

      const percentage = Math.round((completedWeeks / 4) * 100);

      return {
        ...progress,
        completedWeeks,
        progressPercentage: percentage,
      };
    });

    return progressSummary;
  }

  // Initialize progress for all enrolled students in a unit
  async initializeUnitProgress(unitCode: string) {
    // Get all students enrolled in the course that contains this unit
    const unit = await this.db.unit.findUnique({
      where: { code: unitCode },
      include: { course: true },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    const students = await this.db.user.findMany({
      where: {
        role: 'STUDENT',
        courseCode: unit.courseCode,
      },
    });

    const progressRecords: any[] = [];

    for (const student of students) {
      const existingProgress = await this.db.studentProgress.findUnique({
        where: {
          studentId_unitCode: {
            studentId: student.id,
            unitCode,
          },
        },
      });

      if (!existingProgress) {
        const progress = await this.db.studentProgress.create({
          data: {
            studentId: student.id,
            unitCode,
            week1Material: MaterialStatus.NOT_DONE,
            week2Material: MaterialStatus.NOT_DONE,
            week3Material: MaterialStatus.NOT_DONE,
            week4Material: MaterialStatus.NOT_DONE,
          },
        });
        progressRecords.push(progress);
      }
    }

    return {
      message: `Initialized progress for ${progressRecords.length} students`,
      recordsCreated: progressRecords.length,
    };
  }
}