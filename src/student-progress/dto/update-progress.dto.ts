import { IsOptional, IsEnum, IsString } from 'class-validator';
import { MaterialStatus } from '@prisma/client';

export class UpdateProgressDto {
  @IsOptional()
  @IsEnum(MaterialStatus)
  week1Material?: MaterialStatus;

  @IsOptional()
  @IsEnum(MaterialStatus)
  week2Material?: MaterialStatus;

  @IsOptional()
  @IsEnum(MaterialStatus)
  week3Material?: MaterialStatus;

  @IsOptional()
  @IsEnum(MaterialStatus)
  week4Material?: MaterialStatus;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}

// Export all DTOs
export * from './create-progress.dto';
export * from './update-progress.dto';