import { IsEmail, IsString, IsEnum } from 'class-validator';

export enum UserType {
  STUDENT = 'student',
  COORDINATOR = 'coordinator'
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(UserType)
  userType: UserType;
}