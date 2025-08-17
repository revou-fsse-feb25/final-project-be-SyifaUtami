import { Controller, Get, UseGuards } from '@nestjs/common';
import { AcademicDataService } from './academic-data.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.auth-guard';
@Controller('academic-data')
@UseGuards(JwtAuthGuard)
export class AcademicDataController {
  constructor(private readonly academicDataService: AcademicDataService) {}

  @Get()
  async getAcademicData() {
    return this.academicDataService.getAcademicData();
  }
}
