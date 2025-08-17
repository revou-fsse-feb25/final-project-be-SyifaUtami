import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  // GET /users/me - Current user detailed data
  async getCurrentUserData(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, courseCode: true, year: true, title: true,
        accessLevel: true, courseManaged: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');

    if (user.role === 'STUDENT') {
      // Get student-specific data
      const [assignments, progress] = await Promise.all([
        this.db.studentAssignment.findMany({
          where: { studentId: userId },
          include: {
            assignment: {
              include: {
                unit: { include: { course: true } },
              },
            },
          },
          orderBy: { assignment: { deadline: 'asc' } },
        }),
        this.db.studentProgress.findMany({
          where: { studentId: userId },
          include: {
            unit: { include: { course: true } },
          },
        }),
      ]);

      return {
        user,
        assignments,
        progress,
        userType: 'student',
      };
    }

    // For coordinators
    return {
      user,
      userType: 'coordinator',
    };
  }

  // PUT /users/profile - Update user profile
  async updateProfile(userId: string, updateData: any) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('User not found');

    // Don't allow updating sensitive fields
    const { id, password, role, ...allowedUpdates } = updateData;

    return this.db.user.update({
      where: { id: userId },
      data: allowedUpdates,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, courseCode: true, year: true, title: true,
        accessLevel: true, courseManaged: true,
      },
    });
  }
}
