// src/teachers/teachers.controller.ts - Simple version (GET, CREATE, DELETE only)
import { 
  Controller, 
  Get, 
  Post, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { GetTeachersDto } from './dto/get-teachers.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('teachers')
@UseGuards(JwtAuthGuard)
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  // GET /teachers - Allow ALL authenticated users (students + coordinators)
  @Get()
  async findAll(@Query() dto: GetTeachersDto) {
    return this.teachersService.findAll(dto);
  }

  // GET /teachers/stats - Coordinators only
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('COORDINATOR')
  async getStats() {
    return this.teachersService.getTeacherStats();
  }

  // GET /teachers/:id - Allow ALL authenticated users  
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  // POST /teachers - Coordinators only
  @Post()
  @UseGuards(RolesGuard)
  @Roles('COORDINATOR')
  async create(@Body() createTeacherDto: CreateTeacherDto) {
    return this.teachersService.create(createTeacherDto);
  }

  // DELETE /teachers/:id - Coordinators only
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('COORDINATOR')
  async remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }
}