import { IsString, IsOptional, IsInt, Min, Max, MinLength } from 'class-validator';

export class UpdateUnitDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  code?: string;

  @IsString()
  @MinLength(1)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  courseCode?: string;

  @IsInt()
  @Min(1)
  @Max(52)
  @IsOptional()
  currentWeek?: number;
}
