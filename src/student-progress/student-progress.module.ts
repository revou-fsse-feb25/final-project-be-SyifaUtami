import { Module } from '@nestjs/common';
import { StudentProgressService } from './student-progress.service';
import { StudentProgressController } from './student-progress.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule], 
  providers: [StudentProgressService],
  controllers: [StudentProgressController],
  exports: [StudentProgressService],
})
export class StudentProgressModule {}
