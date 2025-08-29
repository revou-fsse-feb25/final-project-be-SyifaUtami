// src/teachers/teachers.service.ts - Updated for simplified Teacher model
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../prisma/prisma.service';

@Injectable()
export class TeachersService {
  constructor(private readonly db: DatabaseService) {}

  // GET /teachers - List all teachers with their units
  async findAll(dto: any = {}) {
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
        { id: { contains: search, mode: 'insensitive' } },
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
          orderBy: { id: 'asc' }
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
        unitsTeached: teacher.unitTeachers.map(ut => ({
          code: ut.unit.code,
          name: ut.unit.name,
          role: ut.role
        })),
        createdAt: teacher.createdAt,
        updatedAt: teacher.updatedAt
      }));

      return {
        success: true,
        data: teachersWithUnits,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Failed to fetch teachers: ${error.message}`);
    }
  }

  // GET /teachers/stats - Get teacher statistics  
  async getTeacherStats() {
    try {
      const [total, withEmail] = await Promise.all([
        this.db.teacher.count(),
        this.db.teacher.count({
          where: { email: { not: null } }
        })
      ]);

      return {
        success: true,
        data: {
          total,
          withEmail,
          withoutEmail: total - withEmail
        }
      };
    } catch (error) {
      throw new Error(`Failed to get teacher stats: ${error.message}`);
    }
  }

  // GET /teachers/:id - Get single teacher details
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
        throw new NotFoundException(`Teacher with ID ${id} not found`);
      }

      return {
        success: true,
        data: {
          ...teacher,
          unitsTeached: teacher.unitTeachers.map(ut => ({
            code: ut.unit.code,
            name: ut.unit.name,
            role: ut.role
          }))
        }
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to fetch teacher: ${error.message}`);
    }
  }

  // POST /teachers - Create new teacher (manual ID required)
  async create(createTeacherDto: any) {
    try {
      const { id, firstName, lastName, email, title } = createTeacherDto;

      // Validate required fields
      if (!id) {
        throw new ConflictException('Teacher ID is required');
      }
      if (!firstName) {
        throw new ConflictException('First name is required');
      }

      // Check for ID uniqueness
      const existingTeacherById = await this.db.teacher.findUnique({
        where: { id }
      });
      
      if (existingTeacherById) {
        throw new ConflictException(`Teacher with ID ${id} already exists`);
      }

      // Check for email uniqueness if provided
      if (email) {
        const existingTeacherByEmail = await this.db.teacher.findUnique({
          where: { email }
        });
        
        if (existingTeacherByEmail) {
          throw new ConflictException(`Teacher with email ${email} already exists`);
        }
      }

      const teacher = await this.db.teacher.create({
        data: {
          id,
          firstName,
          lastName,
          email,
          title
        },
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

      return {
        success: true,
        data: {
          ...teacher,
          unitsTeached: teacher.unitTeachers.map(ut => ({
            code: ut.unit.code,
            name: ut.unit.name,
            role: ut.role
          }))
        }
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new Error(`Failed to create teacher: ${error.message}`);
    }
  }



  // DELETE /teachers/:id - Delete teacher
  async remove(id: string) {
    try {
      // Check if teacher exists
      const existingTeacher = await this.db.teacher.findUnique({
        where: { id }
      });

      if (!existingTeacher) {
        throw new NotFoundException(`Teacher with ID ${id} not found`);
      }

      // Delete teacher (CASCADE will handle unit_teachers relationships)
      await this.db.teacher.delete({
        where: { id }
      });

      return {
        success: true,
        message: `Teacher ${id} deleted successfully`
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new Error(`Failed to delete teacher: ${error.message}`);
    }
  }
}