export class CreateSubmissionDto {
  submissionId: string;
  studentId: string;
  assignmentId: string;
  submissionStatus: 'DRAFT' | 'SUBMITTED';
  submissionName?: string; // Just the filename - no actual file storage
  submittedAt?: string;
  grade?: number;
  comment?: string;
  gradedBy?: string;
}