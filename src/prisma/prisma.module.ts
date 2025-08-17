import { Module } from '@nestjs/common';
import { DatabaseService } from './prisma.service';

@Module({
  providers: [PrismaService]
})
export class PrismaModule {}
