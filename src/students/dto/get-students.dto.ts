import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class GetStudentsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  courseCode?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  includeData?: boolean;

  @IsOptional()
  @IsString()
  search?: string;
}

