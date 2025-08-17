import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.auth-guard';
@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  async findAll() {
    return this.coursesService.findAll();
  }

  @Get(':code')
  async findOne(@Param('code') code: string) {
    return this.coursesService.findOne(code);
  }
}
