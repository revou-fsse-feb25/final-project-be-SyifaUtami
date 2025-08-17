import { IsEmail, IsString, IsOptional, IsArray, MinLength } from 'class-validator';

export class CreateTeacherDto {
  @IsString()
  @MinLength(1)
  firstName: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsArray()
  @IsOptional()
  unitsTeached?: string[];
}
