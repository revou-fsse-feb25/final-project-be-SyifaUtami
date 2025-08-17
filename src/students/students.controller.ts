import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { GetStudentsDto } from './dto/get-students.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.auth-guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles('COORDINATOR')
  async findAll(@Query() dto: GetStudentsDto) {
    return this.studentsService.findAll(dto);
  }

  @Get('stats')
  @Roles('COORDINATOR')
  async getStats(@Query('courseCode') courseCode?: string) {
    return this.studentsService.getStudentStats(courseCode);
  }

  @Get(':id')
  @Roles('COORDINATOR')
  async findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }
}