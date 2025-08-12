import { Module } from '@nestjs/common';
import { AcademicDataService } from './academic-data.service';
import { AcademicDataController } from './academic-data.controller';

@Module({
  providers: [AcademicDataService],
  controllers: [AcademicDataController]
})
export class AcademicDataModule {}
