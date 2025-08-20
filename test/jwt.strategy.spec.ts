import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get(Reflector);
  });

  describe('canActivate', () => {
    let mockExecutionContext: any;

    beforeEach(() => {
      mockExecutionContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            headers: {
              authorization: 'Bearer valid-token',
            },
          }),
        }),
      };
    });

    it('should allow access to public routes', async () => {
      // Mock public route
      reflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should call parent canActivate for protected routes', async () => {
      // Mock protected route
      reflector.getAllAndOverride.mockReturnValue(false);
      
      // Mock parent canActivate method to return true
      jest.spyOn(Object.getPrototypeOf(guard), 'canActivate').mockReturnValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should call parent canActivate when isPublic is undefined', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      
      jest.spyOn(Object.getPrototypeOf(guard), 'canActivate').mockReturnValue(true);

      await guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalled();
    });
  });

  describe('handleRequest', () => {
    it('should return user when authentication is successful', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'STUDENT',
      };

      const result = guard.handleRequest(null, mockUser, null);

      expect(result).toBe(mockUser);
    });

    it('should throw UnauthorizedException when user is null', () => {
      expect(() => {
        guard.handleRequest(null, null, null);
      }).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is undefined', () => {
      expect(() => {
        guard.handleRequest(null, undefined, null);
      }).toThrow(UnauthorizedException);
    });

    it('should throw original error when error is provided', () => {
      const originalError = new Error('JWT expired');

      expect(() => {
        guard.handleRequest(originalError, null, null);
      }).toThrow(originalError);
    });

    it('should prioritize error over missing user', () => {
      const originalError = new Error('JWT malformed');
      const mockUser = { id: 'user-123' };

      expect(() => {
        guard.handleRequest(originalError, mockUser, null);
      }).toThrow(originalError);
    });

    it('should return user even when info is provided', () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };
      const info = { message: 'JWT valid' };

      const result = guard.handleRequest(null, mockUser, info);

      expect(result).toBe(mockUser);
    });
  });
});