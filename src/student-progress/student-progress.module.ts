import { Module } from '@nestjs/common';
import { StudentProgressService } from './student-progress.service';
import { StudentProgressController } from './student-progress.controller.dto';

@Module({
  providers: [StudentProgressService],
  controllers: [StudentProgressController],
  exports: [StudentProgressService],
})
export class StudentProgressModule {}