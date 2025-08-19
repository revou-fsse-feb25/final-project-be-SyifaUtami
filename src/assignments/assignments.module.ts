import { Module } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AssignmentsService],
  controllers: [AssignmentsController],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}