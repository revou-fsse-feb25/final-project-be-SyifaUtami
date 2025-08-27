import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private readonly db: DatabaseService) {}

  // GET /courses - Course list
  async findAll() {
    return this.db.course.findMany({
      include: {
        units: {
          include: { assignments: true },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  // GET /courses/:code - Individual course
  async findOne(code: string) {
    const course = await this.db.course.findUnique({
      where: { code },
      include: {
        units: {
          include: {
            assignments: true,
          },
        },
      },
    });

    if (!course) throw new Error('Course not found');
    return course;
  }
}
