import { IsOptional, IsString, IsEnum } from 'class-validator';

export class UpdateSubmissionDto {
  @IsOptional()
  @IsEnum(['EMPTY', 'DRAFT', 'SUBMITTED', 'UNSUBMITTED'])
  submissionStatus?: string;

  @IsOptional()
  @IsString()
  submissionName?: string;
}