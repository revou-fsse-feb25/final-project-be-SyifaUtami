// src/teachers/dto/get-teachers.dto.ts
import { IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetTeachersDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;
}