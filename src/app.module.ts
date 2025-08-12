import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { UnitsModule } from './units/units.module';
import { CoursesModule } from './courses/courses.module';
import { AcademicDataModule } from './academic-data/academic-data.module';
import { FacultyModule } from './faculty/faculty.module';
import { TeachersModule } from './teachers/teachers.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, StudentsModule, AssignmentsModule, SubmissionsModule, UnitsModule, CoursesModule, AcademicDataModule, FacultyModule, TeachersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
