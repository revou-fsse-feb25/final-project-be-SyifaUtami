import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class GetTeachersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  unitCode?: string;
}

// Export all DTOs
export * from './create-teacher.dto';
export * from './update-teacher.dto';
export * from './get-teachers.dto';