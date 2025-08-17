import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../prisma/prisma.service'; 
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password, userType } = loginDto;
    
    if (!email || !password || !userType) {
      throw new BadRequestException('Email, password, and userType are required');
    }
    
    // Find user by email and role
    const role = userType === 'student' ? 'STUDENT' : 'COORDINATOR';
    const user = await this.db.user.findFirst({
      where: {
        email,
        role,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user has a password
    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials - no password set');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    const access_token = this.jwtService.sign(payload);

    // Return user data without password
    const { password: _, ...userResult } = user;
    
    return {
      success: true,
      user: userResult,
      userType: userType,
      access_token,
    };
  }

  async validateUser(userId: string) {
    return this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        courseCode: true,
        year: true,
        title: true,
        accessLevel: true,
        courseManaged: true,
      },
    });
  }

  async refreshToken(userId: string) {
    const user = await this.validateUser(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
