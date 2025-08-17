import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../prisma/prisma.service';
import { CreateTeacherDto } from './dto/get-teachers.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { GetTeachersDto } from './dto/get-teachers.dto';
import { PaginatedResult } from '../common/interfaces/pagination.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class TeachersService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(dto: GetTeachersDto): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 20, search, unitCode } = dto;
    const skip = (page - 1) * limit;

    // Build where clause for teachers (Users with no specific role or with teacher-like data)
    const where: any = {
      OR: [
        { role: 'COORDINATOR' }, // Some coordinators can teach
        { 
          AND: [
            { role: 'STUDENT' }, // In case some are marked as students but teach
            { title: { not: null } } // But have teaching info
          ]
        }
      ]
    };

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ]
        }
      ];
    }

    // Get teachers with units they teach
    const [users, total] = await Promise.all([
      this.db.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          title: true,
          role: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: { firstName: 'asc' },
      }),
      this.db.user.count({ where }),
    ]);

    // For each teacher, get the units they teach by looking at assignments
    const teachersWithUnits = await Promise.all(
      users.map(async (user) => {
        // In the absence of a direct teacher-unit relationship,
        // we'll need to infer this from other data or create a separate tracking
        const unitsTeached: string[] = []; // TODO: Implement unit tracking
        
        return {
          ...user,
          unitsTeached,
        };
      })
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: teachersWithUnits,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string) {
    const teacher = await this.db.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        title: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // Get units taught (TODO: implement proper relationship)
    const unitsTeached: string[] = [];

    return {
      ...teacher,
      unitsTeached,
    };
  }

  async create(createTeacherDto: CreateTeacherDto) {
    const { email, password, unitsTeached, ...teacherData } = createTeacherDto;

    // Check if user with email already exists
    const existingUser = await this.db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    // Hash password if provided
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

    // Create teacher as a User with appropriate role
    const teacher = await this.db.user.create({
      data: {
        ...teacherData,
        email,
        password: hashedPassword,
        role: 'COORDINATOR', // Teachers are stored as coordinators with teaching role
        title: teacherData.title || 'Teacher',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        title: true,
        role: true,
        createdAt: true,
      },
    });

    // TODO: Handle unit assignments in a separate table or method

    return {
      ...teacher,
      unitsTeached: unitsTeached || [],
    };
  }

  async update(id: string, updateTeacherDto: UpdateTeacherDto) {
    const { unitsTeached, ...updateData } = updateTeacherDto;

    const teacher = await this.db.user.findUnique({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const updatedTeacher = await this.db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        title: true,
        role: true,
        updatedAt: true,
      },
    });

    // TODO: Update unit assignments

    return {
      ...updatedTeacher,
      unitsTeached: unitsTeached || [],
    };
  }

  async remove(id: string) {
    const teacher = await this.db.user.findUnique({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // TODO: Remove unit assignments first
    
    await this.db.user.delete({
      where: { id },
    });

    return { message: 'Teacher deleted successfully' };
  }

  // Get teacher statistics
  async getTeacherStats() {
    const totalTeachers = await this.db.user.count({
      where: {
        role: 'COORDINATOR',
        title: { not: null },
      },
    });

    const activeTeachers = await this.db.user.count({
      where: {
        role: 'COORDINATOR',
        title: { not: null },
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Active in last 30 days
        },
      },
    });

    return {
      totalTeachers,
      activeTeachers,
      inactiveTeachers: totalTeachers - activeTeachers,
    };
  }
}