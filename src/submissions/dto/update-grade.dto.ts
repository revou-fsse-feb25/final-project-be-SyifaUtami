import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class UpdateGradeDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  grade: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  gradedBy?: string;
}