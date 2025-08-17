import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Database module
import { PrismaModule } from './prisma/prisma.module';

// Auth
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt.auth-guard';

// All modules
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { UnitsModule } from './units/units.module';
import { CoursesModule } from './courses/courses.module';
import { AcademicDataModule } from './academic-data/academic-data.module';