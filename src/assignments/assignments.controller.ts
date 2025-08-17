import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { GetAssignmentsDto } from './dto/get-assignments';
import { JwtAuthGuard } from 'src/auth/guards/jwt.auth-guard';

@Controller('assignments')
@UseGuards(JwtAuthGuard)
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get()
  async findAll(@Query() dto: GetAssignmentsDto) {
    return this.assignmentsService.findAll(dto);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('includeSubmissions') includeSubmissions: string
  ) {
    return this.assignmentsService.findOne(id, includeSubmissions === 'true');
  }
}