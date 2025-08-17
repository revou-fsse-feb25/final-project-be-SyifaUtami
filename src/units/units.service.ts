import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { GetUnitsDto } from './dto/get-unit.dto';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

@Injectable()
export class UnitsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(dto: GetUnitsDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, courseCode, search } = dto;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (courseCode) {
      where.courseCode = courseCode;
    }

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [units, total] = await Promise.all([
      this.db.unit.findMany({
        where,
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
        skip,
        take: limit,
        orderBy: { code: 'asc' },
      }),
      this.db.unit.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: units,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(code: string) {
    const unit = await this.db.unit.findUnique({
      where: { code },
      include: {
        course: true,
        assignments: {
          include: {
            studentAssignments: {
              select: {
                id: true,
                studentId: true,
                submissionStatus: true,
                grade: true,
              },
            },
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    return unit;
  }

  async create(createUnitDto: CreateUnitDto) {
    const { code, courseCode } = createUnitDto;

    // Check if unit code already exists
    const existingUnit = await this.db.unit.findUnique({
      where: { code },
    });

    if (existingUnit) {
      throw new ConflictException('A unit with this code already exists');
    }

    // Check if course exists
    const course = await this.db.course.findUnique({
      where: { code: courseCode },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const unit = await this.db.unit.create({
      data: createUnitDto,
      include: {
        course: true,
      },
    });

    return unit;
  }

  async update(code: string, updateUnitDto: UpdateUnitDto) {
    const unit = await this.db.unit.findUnique({
      where: { code },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    // If updating the unit code, check for conflicts
    if (updateUnitDto.code && updateUnitDto.code !== code) {
      const existingUnit = await this.db.unit.findUnique({
        where: { code: updateUnitDto.code },
      });

      if (existingUnit) {
        throw new ConflictException('A unit with this code already exists');
      }
    }

    const updatedUnit = await this.db.unit.update({
      where: { code },
      data: updateUnitDto,
      include: {
        course: true,
        assignments: true,
      },
    });

    return updatedUnit;
  }

  async remove(code: string) {
    const unit = await this.db.unit.findUnique({
      where: { code },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    await this.db.unit.delete({
      where: { code },
    });

    return { message: 'Unit deleted successfully' };
  }

  // Get units by course
  async getUnitsByCourse(courseCode: string) {
    const units = await this.db.unit.findMany({
      where: { courseCode },
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

    return units;
  }

  // Get unit statistics
  async getUnitStats(code?: string) {
    const where = code ? { code } : {};

    const [totalUnits, unitsWithAssignments] = await Promise.all([
      this.db.unit.count({ where }),
      this.db.unit.count({
        where: {
          ...where,
          assignments: {
            some: {},
          },
        },
      }),
    ]);

    // Get course distribution
    const courseDistribution = await this.db.unit.groupBy({
      by: ['courseCode'],
      where,
      _count: {
        courseCode: true,
      },
    });

    return {
      totalUnits,
      unitsWithAssignments,
      unitsWithoutAssignments: totalUnits - unitsWithAssignments,
      courseDistribution: courseDistribution.map(item => ({
        courseCode: item.courseCode,
        count: item._count.courseCode,
      })),
    };
  }

  // Get unit with student progress
  async getUnitWithProgress(code: string) {
    const unit = await this.db.unit.findUnique({
      where: { code },
      include: {
        course: true,
        assignments: true,
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found');
    }

    // Get student progress for this unit
    const progress = await this.db.studentProgress.findMany({
      where: { unitCode: code },
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
        assignment: { unitCode: code },
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
      progress,
      submissions,
    };
  }
}