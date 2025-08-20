import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Database module
import { PrismaModule } from './prisma/prisma.module';

// Auth
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

// All modules
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { UnitsModule } from './units/units.module';
import { CoursesModule } from './courses/courses.module';
import { AcademicDataModule } from './academic-data/academic-data.module';
import { TeachersModule } from './teachers/teachers.module';
import { StudentProgressModule } from './student-progress/student-progress.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => {
        // Validate required environment variables
        if (!config.JWT_SECRET) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        if (config.JWT_SECRET.length < 32) {
          throw new Error('JWT_SECRET must be at least 32 characters long');
        }
        return config;
      },
    }),
    JwtModule.registerAsync({
      global: true,
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: '30m', // 30 m access
          issuer: 'final-project-be',
          audience: 'final-project-fe',
        },
      }),
      inject: [ConfigService],
    }),
    PassportModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    AssignmentsModule,
    SubmissionsModule,
    UnitsModule,
    CoursesModule,
    AcademicDataModule,
    TeachersModule,
    StudentProgressModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}