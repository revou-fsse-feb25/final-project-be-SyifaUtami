import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class GetUnitsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  courseCode?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

// Export all DTOs
export * from './create-unit.dto';
export * from './update-unit.dto';
export * from './get-unit.dto';