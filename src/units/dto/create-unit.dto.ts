import { IsString, IsOptional, IsInt, Min, Max, MinLength } from 'class-validator';

export class CreateUnitDto {
  @IsString()
  @MinLength(1)
  code: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  courseCode: string;

  @IsInt()
  @Min(1)
  @Max(52)
  @IsOptional()
  currentWeek?: number = 1;
}