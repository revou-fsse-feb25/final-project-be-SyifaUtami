// src/teachers/teachers.controller.ts - Simple fix, just remove @Roles decorator
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { GetTeachersDto } from './dto/get-teachers.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('teachers')
@UseGuards(JwtAuthGuard) // Only require authentication
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  // GET /teachers - Allow ALL authenticated users (students + coordinators)
  @Get()
  async findAll(@Query() dto: GetTeachersDto) {
    return this.teachersService.findAll(dto);
  }

  // GET /teachers/:id - Allow ALL authenticated users  
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  // ADMIN FUNCTIONS - Coordinators only:

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('COORDINATOR')
  async getStats() {
    return this.teachersService.getTeacherStats();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('COORDINATOR')
  async create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teachersService.create(createTeacherDto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('COORDINATOR')
  async update(
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateTeacherDto
  ) {
    return this.teachersService.update(id, updateTeacherDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('COORDINATOR')
  async remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }
}