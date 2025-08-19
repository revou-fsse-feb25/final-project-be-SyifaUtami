import { Controller, Get, Param, Put, Body, UseGuards } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { UpdateGradeDto} from './dto/update-grade.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('submissions')
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get(':submissionId')
  async findOne(@Param('submissionId') submissionId: string) {
    return this.submissionsService.findOne(submissionId);
  }

  @Put(':submissionId/grade')
  @UseGuards(RolesGuard)
  @Roles('COORDINATOR')
  async updateGrade(
    @Param('submissionId') submissionId: string,
    @Body() updateGradeDto: UpdateGradeDto
  ) {
    return this.submissionsService.updateGrade(submissionId, updateGradeDto);
  }

  @Put(':submissionId')
  async updateSubmission(
    @Param('submissionId') submissionId: string,
    @Body() updateSubmissionDto: UpdateSubmissionDto
  ) {
    return this.submissionsService.updateSubmission(submissionId, updateSubmissionDto);
  }

  @Get('student/:studentId')
  async getStudentSubmissions(@Param('studentId') studentId: string) {
    return this.submissionsService.getStudentSubmissions(studentId);
  }
}
