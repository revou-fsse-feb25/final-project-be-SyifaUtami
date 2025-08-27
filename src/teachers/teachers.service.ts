// src/teachers/teachers.service.ts - FIXED to use proper Prisma Teacher model
import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../prisma/prisma.service';
import { GetTeachersDto } from './dto/get-teachers.dto';

@Injectable()
export class TeachersService {
  constructor(private readonly db: DatabaseService) {}

  // GET /teachers - List all teachers with their units
  async findAll(dto: GetTeachersDto = {}) {
    const { page = 1, limit = 20, search } = dto;
    const skip = (page - 1) * limit;

    // Build where clause for search
    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    try {
      const [teachers, total] = await Promise.all([
        this.db.teacher.findMany({
          where,
          include: {
            unitTeachers: {
              include: {
                unit: {
                  select: { code: true, name: true }
                }
              }
            }
          },
          skip,
          take: limit,
          orderBy: { firstName: 'asc' }
        }),
        this.db.teacher.count({ where })
      ]);

      // Transform to include unitsTeached array for frontend compatibility
      const teachersWithUnits = teachers.map(teacher => ({
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        title: teacher.title,
        department: teacher.department,
        specialization: teacher.specialization,
        unitsTeached: teacher.unitTeachers.map(ut => ut.unit.code),
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        data: teachersWithUnits,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      console.error('Error fetching teachers:', error);
      return {
        success: false,
        data: [],
        total: 0,
        page: 1,
        limit,
        totalPages: 0,
        error: 'Failed to fetch teachers'
      };
    }
  }

  // GET /teachers/stats - Simple teacher count
  async getTeacherStats() {
    try {
      const totalTeachers = await this.db.teacher.count();

      return {
        success: true,
        data: {
          totalTeachers
        }
      };
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
      return {
        success: false,
        data: {
          totalTeachers: 0
        },
        error: 'Failed to fetch teacher stats'
      };
    }
  }

  // GET /teachers/:id - Single teacher
  async findOne(id: string) {
    try {
      const teacher = await this.db.teacher.findUnique({
        where: { id },
        include: {
          unitTeachers: {
            include: {
              unit: {
                select: { code: true, name: true }
              }
            }
          }
        }
      });
      
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
      }

      // Transform to include unitsTeached array
      const teacherWithUnits = {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        title: teacher.title,
        department: teacher.department,
        specialization: teacher.specialization,
        unitsTeached: teacher.unitTeachers.map(ut => ut.unit.code),
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt
      };

      return {
        success: true,
        data: teacherWithUnits
      };
    } catch (error) {
      console.error('Error fetching teacher:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      return {
        success: false,
        data: null,
        error: 'Failed to fetch teacher'
      };
    }
  }

  // POST /teachers - Create new teacher
  async create(createTeacherDto: any) {
    try {
      const { firstName, lastName, email, title, department, specialization, unitsTeached } = createTeacherDto;

      // Create the teacher
      const teacher = await this.db.teacher.create({
        data: {
          firstName,
          lastName,
          email,
          title,
          department,
          specialization
        }
      });

      // Create unit-teacher relationships if units provided
      if (unitsTeached && unitsTeached.length > 0) {
        await this.db.unitTeacher.createMany({
          data: unitsTeached.map((unitCode: string) => ({
            teacherId: teacher.id,
            unitCode,
            role: 'Primary'
          })),
          skipDuplicates: true
        });
      }

      return {
        success: true,
        data: teacher
      };
    } catch (error) {
      console.error('Error creating teacher:', error);
      return {
        success: false,
        data: null,
        error: 'Failed to create teacher'
      };
    }
  }

  // PUT /teachers/:id - Update teacher
  async update(id: string, updateTeacherDto: any) {
    try {
      const { unitsTeached, ...updateData } = updateTeacherDto;

      // Update teacher basic info
      const teacher = await this.db.teacher.update({
        where: { id },
        data: updateData
      });

      // Update unit relationships if provided
      if (unitsTeached) {
        // Remove existing relationships
        await this.db.unitTeacher.deleteMany({
          where: { teacherId: id }
        });

        // Create new relationships
        if (unitsTeached.length > 0) {
          await this.db.unitTeacher.createMany({
            data: unitsTeached.map((unitCode: string) => ({
              teacherId: id,
              unitCode,
              role: 'Primary'
            })),
            skipDuplicates: true
          });
        }
      }

      return {
        success: true,
        data: teacher
      };
    } catch (error) {
      console.error('Error updating teacher:', error);
      
      if (error.code === 'P2025') {
        throw new NotFoundException('Teacher not found');
      }
      
      return {
        success: false,
        data: null,
        error: 'Failed to update teacher'
      };
    }
  }

  // DELETE /teachers/:id - Remove teacher
  async remove(id: string) {
    try {
      // Delete unit relationships first
      await this.db.unitTeacher.deleteMany({
        where: { teacherId: id }
      });

      // Delete teacher
      await this.db.teacher.delete({
        where: { id }
      });

      return {
        success: true,
        message: 'Teacher deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting teacher:', error);
      
      if (error.code === 'P2025') {
        throw new NotFoundException('Teacher not found');
      }
      
      return {
        success: false,
        error: 'Failed to delete teacher'
      };
    }
  }
}