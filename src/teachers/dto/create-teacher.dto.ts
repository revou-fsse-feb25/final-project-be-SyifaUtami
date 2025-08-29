// src/teachers/dto/create-teacher.dto.ts
import { IsString, IsEmail, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateTeacherDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  title?: string;
}