import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from './prisma.service';

describe('PrismaService', () => {
  let service: DatabaseService
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatabaseService],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
