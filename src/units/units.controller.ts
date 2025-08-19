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
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { GetUnitsDto } from './dto/get-unit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('units')
@UseGuards(JwtAuthGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  // GET /units - All units with pagination
  @Get()
  async findAll(@Query() dto: GetUnitsDto) {
    return this.unitsService.findAll(dto);
  }

  // GET /units/stats - Unit statistics (coordinators only)
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles('COORDINATOR')
  async getStats(@Query('code') code?: string) {
    return this.unitsService.getUnitStats(code);
  }

  // GET /units/course/:courseCode - Units by course
  @Get('course/:courseCode')
  async getUnitsByCourse(@Param('courseCode') courseCode: string) {
    return this.unitsService.getUnitsByCourse(courseCode);
  }

  // GET /units/:code - Individual unit details
  @Get(':code')
  async findOne(@Param('code') code: string) {
    return this.unitsService.findOne(code);
  }

  // GET /units/:code/progress - Unit with student progress (coordinators only)
  @Get(':code/progress')
  @UseGuards(RolesGuard)
  @Roles('COORDINATOR')
  async getUnitWithProgress(@Param('code') code: string) {
    return this.unitsService.getUnitWithProgress(code);
  }

  // POST /units - Create new unit (coordinators only)
  @Post()
  @UseGuards(RolesGuard)
  @Roles('COORDINATOR')
  async create(@Body() createUnitDto: CreateUnitDto) {
    return this.unitsService.create(createUnitDto);
  }

  // PUT /units/:code - Update unit (coordinators only)
  @Put(':code')
  @UseGuards(RolesGuard)
  @Roles('COORDINATOR')
  async update(
    @Param('code') code: string,
    @Body() updateUnitDto: UpdateUnitDto
  ) {
    return this.unitsService.update(code, updateUnitDto);
  }

  // DELETE /units/:code - Delete unit (coordinators only)
  @Delete(':code')
  @UseGuards(RolesGuard)
  @Roles('COORDINATOR')
  async remove(@Param('code') code: string) {
    return this.unitsService.remove(code);
  }
}