import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../prisma/prisma.service';

@Injectable()
export class AcademicDataService {
  constructor(private readonly db: DatabaseService) {}

  // GET /academic-data - All static reference data
  async getAcademicData() {
    const [courses, units, assignments, coordinators] = await Promise.all([
      this.db.course.findMany({
        include: { units: true },
      }),
      this.db.unit.findMany({
        include: {
          course: true,
          assignments: true,
        },
      }),
      this.db.assignment.findMany({
        include: {
          unit: { include: { course: true } },
        },
      }),
      this.db.user.findMany({
        where: { role: 'COORDINATOR' },
        select: {
          id: true, firstName: true, lastName: true, email: true,
          title: true, accessLevel: true, courseManaged: true,
        },
      }),
    ]);

    return {
      courses,
      units,
      assignments,
      teachers: coordinators, // For compatibility
      faculty: coordinators,
    };
  }
}
