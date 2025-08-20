import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../prisma/prisma.service'; 
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

    // Generate tokens
    const tokens = await this.generateTokens(user);

    // Return user data without password
    const { password: _, ...userResult } = user;
    
    return {
      success: true,
      user: userResult,
      userType: userType,
      ...tokens,
    };
  }

  async generateTokens(user: any) {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      iat: Math.floor(Date.now() / 1000),
    };

    // Generate access token (uses global JWT config)
    const access_token = this.jwtService.sign(payload, {
      expiresIn: '30m', // Match your app.module.ts setting
    });

    // Get JWT secret for refresh token
    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }

    // Generate refresh token with consistent config
    const refresh_token = this.jwtService.sign(
      { sub: user.id, type: 'refresh' },
      {
        secret: jwtSecret,
        expiresIn: '7d',
        issuer: 'final-project-be',      // Match global config
        audience: 'final-project-fe',    // Match global config
      }
    );

    return {
      access_token,
      refresh_token,
      expires_in: 1800, // 30 minutes in seconds (match your 30m setting)
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const jwtSecret = this.configService.get<string>('JWT_SECRET');
      
      if (!jwtSecret) {
        throw new Error('JWT_SECRET not configured');
      }

      // Verify refresh token with consistent config
      const payload = this.jwtService.verify(refreshToken, {
        secret: jwtSecret,
        issuer: 'final-project-be',      // Match signing config
        audience: 'final-project-fe',    // Match signing config
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Get user
      const user = await this.validateUser(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new tokens
      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
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

  async logout(userId: string) {
    return { success: true, message: 'Logged out successfully' };
  }
}