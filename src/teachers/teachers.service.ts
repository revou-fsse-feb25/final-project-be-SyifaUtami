
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { GetTeachersDto } from './dto/get-teachers.dto';
import { Role } from '@prisma/client'; // Import the Role enum
import * as bcrypt from 'bcrypt';

@Injectable()
export class TeachersService {
  constructor(private db: DatabaseService) {}

  // Return teacher info for all authenticated users
  async findAll(dto: GetTeachersDto = {}) {
    const { page = 1, limit = 20, search } = dto;
    // Note: Removed courseCode since it doesn't exist in GetTeachersDto
    const skip = (page - 1) * limit;

    // Build where clause with proper Role enum
    const where: any = {
      role: Role.COORDINATOR, // Use the enum value
      title: { not: null }, // Teachers have titles
    };

    // Add search functionality if search term provided
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    // Get teachers (coordinators with titles)
    const [teachers, total] = await Promise.all([
      this.db.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          title: true,
          role: true,
          courseManaged: true, // What courses they manage
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { firstName: 'asc' },
      }),
      this.db.user.count({ where }),
    ]);

    // Transform data to include units taught
    // Since there's no direct teacher-unit relationship in your schema,
    // we'll look at courseManaged to infer what they might teach
    const teachersWithUnits = teachers.map((teacher) => {
      // For now, we'll derive units from courseManaged
      // In the future, you might want to add a teacherId field to Unit table
      return {
        ...teacher,
        unitsTeached: teacher.courseManaged || [], // Use courseManaged as proxy
        unitsTeachingDetails: [], // Empty for now, can be populated if needed
      };
    });

    return {
      success: true,
      data: teachersWithUnits,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Get individual teacher
  async findOne(id: string) {
    const teacher = await this.db.user.findUnique({
      where: { 
        id,
        role: Role.COORDINATOR, // Use enum
        title: { not: null }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        title: true,
        role: true,
        courseManaged: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return {
      success: true,
      data: {
        ...teacher,
        unitsTeached: teacher.courseManaged || [],
        unitsTeachingDetails: [],
      },
    };
  }

  // COORDINATOR-ONLY METHODS:

  async create(createTeacherDto: CreateTeacherDto) {
    const { email, password, unitsTeached, ...teacherData } = createTeacherDto;

    // Check if email already exists
    if (email) {
      const existingUser = await this.db.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error('User with this email already exists');
      }
    }

    // Hash password if provided
    const hashedPassword = password ? 
      await bcrypt.hash(password, 10) : null;

    // Create teacher as a User with COORDINATOR role
    const teacher = await this.db.user.create({
      data: {
        ...teacherData,
        email,
        password: hashedPassword,
        role: Role.COORDINATOR, // Use enum
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

    return {
      success: true,
      data: {
        ...teacher,
        unitsTeached: unitsTeached || [],
      },
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

    return {
      success: true,
      data: {
        ...updatedTeacher,
        unitsTeached: unitsTeached || [],
      },
    };
  }

  async remove(id: string) {
    const teacher = await this.db.user.findUnique({
      where: { id },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }
    
    await this.db.user.delete({
      where: { id },
    });

    return { 
      success: true,
      message: 'Teacher deleted successfully' 
    };
  }

  // Get teacher statistics (coordinators only)
  async getTeacherStats() {
    const totalTeachers = await this.db.user.count({
      where: {
        role: Role.COORDINATOR,
        title: { not: null },
      },
    });

    const activeTeachers = await this.db.user.count({
      where: {
        role: Role.COORDINATOR,
        title: { not: null },
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return {
      success: true,
      data: {
        totalTeachers,
        activeTeachers,
        inactiveTeachers: totalTeachers - activeTeachers,
      },
    };
  }
}