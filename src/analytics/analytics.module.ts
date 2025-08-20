import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { DatabaseService } from 'src/prisma/prisma.service';

@Module({
    imports: [DatabaseService],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],

})
export class AnalyticsModule {}