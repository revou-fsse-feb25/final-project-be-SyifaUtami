import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.auth-guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('COORDINATOR')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboardMetrics(@Query('courseCode') courseCode?: string) {
    return this.analyticsService.getDashboardMetrics(courseCode);
  }

  @Get('course/:courseCode')
  async getCourseMetrics(@Param('courseCode') courseCode: string) {
    return this.analyticsService.getCourseMetrics(courseCode);
  }

  @Get('unit/:unitCode')
  async getUnitMetrics(@Param('unitCode') unitCode: string) {
    return this.analyticsService.getUnitMetrics(unitCode);
  }
}