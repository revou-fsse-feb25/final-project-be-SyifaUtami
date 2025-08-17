import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StudentProgressService } from './student-progress.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.auth-guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('student-progress')
@UseGuards(JwtAuthGuard)
export class StudentProgressController {
  constructor(private readonly progressService: StudentProgressService) {}

  // GET /student-progress/student/:studentId - All progress for a student
  @Get('student/:studentId')
  async getStudentProgress(@Param('studentId') studentId: string) {
    return this.progressService.getStudentProgress(studentId);
  }

  // GET /student-progress/student/:studentId/unit/:unitCode - Specific unit progress
  @Get('student/:studentId/unit/:unitCode')
  async getStudentUnitProgress(
    @Param('studentId') studentId: string,
    @Param('unitCode') unitCode: string,
  ) {
    return this.progressService.getStudentUnitProgress(studentId, unitCode);
  }

  // GET /student-progress/unit/:unitCode - All students' progress in a unit (coordinators)
  @Get('unit/:unitCode')
  @UseGuards(RolesGuard)
  @Roles('COORDINATOR')
  async getUnitProgressSummary(@Param('unitCode') unitCode: string) {
    return this.progressService.getUnitProgressSummary(unitCode);
  }

  // POST /student-progress - Create initial progress record
  @Post()
  async createProgress(@Body() createProgressDto: CreateProgressDto) {
    return this.progressService.createProgress(createProgressDto);
  }

  // PUT /student-progress/student/:studentId/unit/:unitCode - Update progress
  @Put('student/:studentId/unit/:unitCode')
  async updateProgress(
    @Param('studentId') studentId: string,
    @Param('unitCode') unitCode: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    return this.progressService.updateProgress(
      studentId,
      unitCode,
      updateProgressDto,
    );
  }

  // POST /student-progress/unit/:unitCode/initialize - Initialize progress for all students
  @Post('unit/:unitCode/initialize')
  @UseGuards(RolesGuard)
  @Roles('COORDINATOR')
  async initializeUnitProgress(@Param('unitCode') unitCode: string) {
    return this.progressService.initializeUnitProgress(unitCode);
  }

  // GET /student-progress/student/:studentId/unit/:unitCode/percentage - Get percentage
  @Get('student/:studentId/unit/:unitCode/percentage')
  async getProgressPercentage(
    @Param('studentId') studentId: string,
    @Param('unitCode') unitCode: string,
  ) {
    const percentage = await this.progressService.calculateProgressPercentage(
      studentId,
      unitCode,
    );
    return { percentage };
  }
}