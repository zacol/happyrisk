import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  refreshToken: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-access-token'),
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      JWT_REFRESH_EXPIRES_IN: '7d',
    };
    return config[key];
  }),
  getOrThrow: jest.fn((key: string) => {
    const config: Record<string, string> = {
      JWT_SECRET: 'test-secret',
    };
    return config[key];
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should return a signed JWT', () => {
      const result = service.generateAccessToken({
        userId: 'user-1',
        email: 'test@example.com',
        role: 'USER',
      });

      expect(result).toBe('mock-access-token');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@example.com',
        role: 'USER',
      });
    });
  });

  describe('generateRefreshToken', () => {
    it('should return a hex string', () => {
      const token = service.generateRefreshToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(128); // 64 bytes = 128 hex chars
    });
  });

  describe('storeRefreshToken', () => {
    it('should hash the token and store it', async () => {
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      await service.storeRefreshToken('user-1', 'raw-token');

      expect(mockPrismaService.refreshToken.create).toHaveBeenCalledTimes(1);
      const callArgs = mockPrismaService.refreshToken.create.mock.calls[0][0];
      expect(callArgs.data.userId).toBe('user-1');
      expect(callArgs.data.hashedToken).not.toBe('raw-token');
      expect(callArgs.data.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('rotateRefreshToken', () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      role: 'USER',
      isActive: true,
    };

    it('should revoke old token and issue new tokens', async () => {
      const rawToken = 'valid-raw-token';
      const hashedToken = await bcrypt.hash(rawToken, 10);

      mockPrismaService.refreshToken.findMany.mockResolvedValue([
        {
          id: 'rt-1',
          hashedToken,
          revoked: false,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        },
      ]);
      mockPrismaService.refreshToken.update.mockResolvedValue({});
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.rotateRefreshToken(rawToken, 'user-1');

      expect(result.accessToken).toBe('mock-access-token');
      expect(typeof result.refreshToken).toBe('string');
      expect(mockPrismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'rt-1' },
        data: { revoked: true },
      });
    });

    it('should revoke all tokens on token reuse', async () => {
      mockPrismaService.refreshToken.findMany.mockResolvedValue([
        {
          id: 'rt-1',
          hashedToken: 'completely-different-hash',
          revoked: false,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        },
      ]);
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({});

      await expect(service.rotateRefreshToken('stolen-token', 'user-1')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { revoked: true },
      });
    });

    it('should reject expired tokens', async () => {
      const rawToken = 'expired-raw-token';
      const hashedToken = await bcrypt.hash(rawToken, 10);

      mockPrismaService.refreshToken.findMany.mockResolvedValue([
        {
          id: 'rt-1',
          hashedToken,
          revoked: false,
          expiresAt: new Date(Date.now() - 1000),
        },
      ]);
      mockPrismaService.refreshToken.update.mockResolvedValue({});

      await expect(service.rotateRefreshToken(rawToken, 'user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should reject deactivated users', async () => {
      const rawToken = 'valid-raw-token';
      const hashedToken = await bcrypt.hash(rawToken, 10);

      mockPrismaService.refreshToken.findMany.mockResolvedValue([
        {
          id: 'rt-1',
          hashedToken,
          revoked: false,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        },
      ]);
      mockPrismaService.refreshToken.update.mockResolvedValue({});
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      await expect(service.rotateRefreshToken(rawToken, 'user-1')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should delete all refresh tokens for the user', async () => {
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      await service.revokeAllUserTokens('user-1');

      expect(mockPrismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });
});
