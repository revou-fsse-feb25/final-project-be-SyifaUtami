import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module'; // Add this
import { JwtStrategy } from './strategies/jwt.strategy'; // Add this if you have it

@Module({
  imports: [PrismaModule], // Add this line
  providers: [
    AuthService,
    JwtStrategy, // Add this if you have the JWT strategy file
  ],
  controllers: [AuthController],
  exports: [AuthService], // Add this if other modules need AuthService
})
export class AuthModule {}