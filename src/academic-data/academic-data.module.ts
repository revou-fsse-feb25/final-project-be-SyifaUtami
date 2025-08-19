import { Module } from '@nestjs/common';
import { AcademicDataService } from './academic-data.service';
import { AcademicDataController } from './academic-data.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AcademicDataService],
  controllers: [AcademicDataController],
  exports: [AcademicDataService],
})
export class AcademicDataModule {}