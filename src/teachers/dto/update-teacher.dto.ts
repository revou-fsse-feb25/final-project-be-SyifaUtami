import { IsString, IsOptional, IsArray, MinLength } from 'class-validator';

export class UpdateTeacherDto {
  @IsString()
  @MinLength(1)
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsArray()
  @IsOptional()
  unitsTeached?: string[];
}
