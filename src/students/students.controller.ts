import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { GetStudentsDto } from './dto/get-students.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  // GET /students - All students with pagination (coordinators only)
  @Get()
  @UseGuards(RolesGuard)
  @Roles('COORDINATOR')
  async findAll(@Query() dto: GetStudentsDto) {
    return this.studentsService.findAll(dto);
  }

  // GET /students/with-grades - Students with grade information (coordinators only)
  @Get('with-grades')
  @UseGuards(RolesGuard)
  @Roles('COORDINATOR')
  async getStudentsWithGrades(@Query() dto: GetStudentsDto) {
    return this.studentsService.getStudentsWithGrades(dto);
  }

  // GET /students/stats - Student statistics (coordinators only)
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('COORDINATOR')
  async getStats(@Query('courseCode') courseCode?: string) {
    return this.studentsService.getStudentStats(courseCode);
  }

  // GET /students/:id - Individual student details
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  // GET /students/:id/units - Student's enrolled units with progress
  @Get(':id/units')
  async getStudentUnits(@Param('id') id: string) {
    return this.studentsService.getStudentUnits(id);
  }
}