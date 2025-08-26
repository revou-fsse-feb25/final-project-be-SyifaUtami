// src/teachers/teachers.service.ts - FIXED to use separate Teacher model
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto'; // Fixed import
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { GetTeachersDto } from './dto/get-teachers.dto';
import { PaginatedResult } from '../common/interfaces/pagination.interface';

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string;
  title: string | null;
  unitsTeached: string[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TeachersService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(dto: GetTeachersDto): Promise<PaginatedResult<Teacher>> {
    const { page = 1, limit = 20, search, unitCode } = dto;
    const skip = (page - 1) * limit;

    // Build where clause for teachers
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (unitCode) {
      where.unitsTeached = {
        has: unitCode
      };
    }

    const [teachers, totalResult] = await Promise.all([
      this.db.$queryRaw`SELECT * FROM "teachers" ORDER BY "firstName" ASC OFFSET ${skip} LIMIT ${limit}`,
      this.db.$queryRaw`SELECT COUNT(*) FROM "teachers"`
    ]);

    const total = Number((totalResult as any)[0].count);
    const totalPages = Math.ceil(total / limit);

    return {
      data: teachers as Teacher[],
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string): Promise<Teacher | null> {
    const teachers = await this.db.$queryRaw`SELECT * FROM "teachers" WHERE "id" = ${id}`;
    return (teachers as Teacher[])[0] || null;
  }

  async create(createTeacherDto: CreateTeacherDto): Promise<Teacher> {
    const { firstName, lastName, email, title, unitsTeached } = createTeacherDto;

    // Check if email already exists
    const existing = await this.db.$queryRaw`SELECT id FROM "teachers" WHERE "email" = ${email}`;
    if ((existing as any[]).length > 0) {
      throw new ConflictException('Teacher with this email already exists');
    }

    // Validate that units exist if provided
    if (unitsTeached && unitsTeached.length > 0) {
      const existingUnits = await this.db.unit.findMany({
        where: {
          code: {
            in: unitsTeached
          }
        },
        select: { code: true }
      });

      const existingUnitCodes = existingUnits.map(unit => unit.code);
      const invalidUnits = unitsTeached.filter(code => !existingUnitCodes.includes(code));

      if (invalidUnits.length > 0) {
        throw new ConflictException(`Invalid unit codes: ${invalidUnits.join(', ')}`);
      }
    }

    const id = `t${Date.now().toString().slice(-6)}`;
    const now = new Date();
    
    await this.db.$executeRaw`
      INSERT INTO "teachers" ("id", "firstName", "lastName", "email", "title", "unitsTeached", "createdAt", "updatedAt")
      VALUES (${id}, ${firstName}, ${lastName}, ${email}, ${title}, ${JSON.stringify(unitsTeached || [])}, ${now}, ${now})
    `;

    return {
      id,
      firstName,
      lastName: lastName || null,
      email,
      title: title || null,
      unitsTeached: unitsTeached || [],
      createdAt: now,
      updatedAt: now
    };
  }

  async update(id: string, updateTeacherDto: UpdateTeacherDto): Promise<Teacher> {
    const teacher = await this.findOne(id);

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const updatedData = { 
      ...teacher, 
      ...updateTeacherDto, 
      lastName: updateTeacherDto.lastName !== undefined ? updateTeacherDto.lastName : teacher.lastName,
      title: updateTeacherDto.title !== undefined ? updateTeacherDto.title : teacher.title,
      updatedAt: new Date() 
    };

    // Validate units if provided
    if (updateTeacherDto.unitsTeached && updateTeacherDto.unitsTeached.length > 0) {
      const existingUnits = await this.db.unit.findMany({
        where: {
          code: {
            in: updateTeacherDto.unitsTeached
          }
        },
        select: { code: true }
      });

      const existingUnitCodes = existingUnits.map(unit => unit.code);
      const invalidUnits = updateTeacherDto.unitsTeached.filter(code => !existingUnitCodes.includes(code));

      if (invalidUnits.length > 0) {
        throw new ConflictException(`Invalid unit codes: ${invalidUnits.join(', ')}`);
      }
    }

    await this.db.$executeRaw`
      UPDATE "teachers" 
      SET "firstName" = ${updatedData.firstName},
          "lastName" = ${updatedData.lastName},
          "title" = ${updatedData.title},
          "unitsTeached" = ${JSON.stringify(updatedData.unitsTeached)},
          "updatedAt" = ${updatedData.updatedAt}
      WHERE "id" = ${id}
    `;

    return updatedData;
  }

  async remove(id: string): Promise<{ message: string }> {
    const teacher = await this.findOne(id);

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    await this.db.$executeRaw`DELETE FROM "teachers" WHERE "id" = ${id}`;

    return { message: 'Teacher deleted successfully' };
  }

  // Get teacher statistics
  async getTeacherStats() {
    const totalResult = await this.db.$queryRaw`SELECT COUNT(*) FROM "teachers"`;
    const totalTeachers = Number((totalResult as any)[0].count);

    // Teachers active in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeResult = await this.db.$queryRaw`SELECT COUNT(*) FROM "teachers" WHERE "updatedAt" >= ${thirtyDaysAgo}`;
    const activeTeachers = Number((activeResult as any)[0].count);

    return {
      totalTeachers,
      activeTeachers,
      inactiveTeachers: totalTeachers - activeTeachers,
    };
  }

  // Get teachers by unit
  async findByUnit(unitCode: string): Promise<Teacher[]> {
    const teachers = await this.db.$queryRaw`
      SELECT * FROM "teachers" 
      WHERE "unitsTeached" @> ${JSON.stringify([unitCode])}
      ORDER BY "firstName" ASC
    `;
    return teachers as Teacher[];
  }
}