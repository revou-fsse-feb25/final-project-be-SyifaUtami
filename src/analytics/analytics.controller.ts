import { 
  Controller, 
  Get, 
  Param, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { 
  DashboardMetrics, 
  CourseMetrics, 
  UnitMetrics, 
  StudentAnalytics, 
  TrendData 
} from './interfaces/analytics.interface';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  // GET /analytics/overview - Dashboard metrics (coordinators only)
  @Get('overview')
  @Roles('COORDINATOR')
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return this.analyticsService.getDashboardMetrics();
  }

  // GET /analytics/course/:courseCode - Course-specific metrics
  @Get('course/:courseCode')
  @Roles('COORDINATOR')
  async getCourseMetrics(@Param('courseCode') courseCode: string): Promise<CourseMetrics> {
    return this.analyticsService.getCourseMetrics(courseCode);
  }

  // GET /analytics/unit/:unitCode - Unit-specific metrics
  @Get('unit/:unitCode')
  @Roles('COORDINATOR')
  async getUnitMetrics(@Param('unitCode') unitCode: string): Promise<UnitMetrics> {
    return this.analyticsService.getUnitMetrics(unitCode);
  }

  // GET /analytics/student/:studentId - Student analytics (coordinators and the student themselves)
  @Get('student/:studentId')
  async getStudentAnalytics(@Param('studentId') studentId: string): Promise<StudentAnalytics> {
    return this.analyticsService.getStudentAnalytics(studentId);
  }

  // GET /analytics/trends - Trending data over time
  @Get('trends')
  @Roles('COORDINATOR')
  async getTrends(@Query('period') period?: 'week' | 'month' | 'quarter'): Promise<TrendData[]> {
    return this.analyticsService.getTrends(period);
  }
}