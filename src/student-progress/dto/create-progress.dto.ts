import { IsString } from 'class-validator';

export class CreateProgressDto {
  @IsString()
  studentId: string;

  @IsString()
  unitCode: string;
}