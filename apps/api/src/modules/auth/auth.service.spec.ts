import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '@/modules/prisma/prisma.service';

import { AuthService } from './auth.service';

const mockPrismaService = {
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

const mockConfigService = {
  get: jest.fn(),
  getOrThrow: jest.fn(),
};

const TEST_TOKEN_ID = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';

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

    jest.resetAllMocks();

    mockJwtService.sign.mockReturnValue('mock-access-token');

    mockConfigService.get.mockImplementation((key: string) => {
      const config: Record<string, string> = { JWT_REFRESH_EXPIRES_IN: '7d' };
      return config[key];
    });

    mockConfigService.getOrThrow.mockImplementation((key: string) => {
      const config: Record<string, string> = { JWT_SECRET: 'test-secret' };
      return config[key];
    });
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
    it('should return an id.secret formatted string', () => {
      const token = service.generateRefreshToken();
      expect(typeof token).toBe('string');
      const dotIndex = token.indexOf('.');
      expect(dotIndex).toBeGreaterThan(0);
      const secret = token.slice(dotIndex + 1);
      expect(secret.length).toBe(128); // 64 bytes = 128 hex chars
    });
  });

  describe('storeRefreshToken', () => {
    it('should throw for a token without a dot', async () => {
      await expect(service.storeRefreshToken('user-1', 'nodothere')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw for a non-UUID id', async () => {
      await expect(service.storeRefreshToken('user-1', 'not-a-uuid.secret')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw for an empty secret', async () => {
      await expect(service.storeRefreshToken('user-1', `${TEST_TOKEN_ID}.`)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should hash the token and store it', async () => {
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      await service.storeRefreshToken('user-1', `${TEST_TOKEN_ID}.test-secret`);

      expect(mockPrismaService.refreshToken.create).toHaveBeenCalledTimes(1);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const callArgs = mockPrismaService.refreshToken.create.mock.calls[0][0] as {
        data: { userId: string; hashedToken: string; expiresAt: Date };
      };

      expect(callArgs.data.userId).toBe('user-1');
      expect(callArgs.data.hashedToken).not.toBe(`${TEST_TOKEN_ID}.test-secret`);
      expect(callArgs.data.hashedToken).not.toBe('test-secret');
      expect(callArgs.data.hashedToken).not.toContain('test-secret');
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
      const secret = 'valid-secret';
      const rawToken = `${TEST_TOKEN_ID}.${secret}`;
      const hashedToken = await bcrypt.hash(secret, 10);

      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: TEST_TOKEN_ID,
        userId: 'user-1',
        hashedToken,
        revoked: false,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });
      mockPrismaService.$transaction.mockImplementation(
        (cb: (tx: typeof mockPrismaService) => unknown) => cb(mockPrismaService),
      );
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.refreshToken.create.mockResolvedValue({});

      const result = await service.rotateRefreshToken(rawToken);

      expect(result.accessToken).toBe('mock-access-token');
      expect(typeof result.refreshToken).toBe('string');
      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { id: TEST_TOKEN_ID, revoked: false },
        data: { revoked: true },
      });
    });

    it('should revoke all tokens on token reuse (revoked token presented)', async () => {
      const secret = 'reused-secret';
      const rawToken = `${TEST_TOKEN_ID}.${secret}`;
      const hashedToken = await bcrypt.hash(secret, 10);

      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: TEST_TOKEN_ID,
        userId: 'user-1',
        hashedToken,
        revoked: true,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({});

      await expect(service.rotateRefreshToken(rawToken)).rejects.toThrow(UnauthorizedException);

      expect(mockPrismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { revoked: true },
      });
    });

    it('should reject expired tokens', async () => {
      const secret = 'expired-secret';
      const rawToken = `${TEST_TOKEN_ID}.${secret}`;
      const hashedToken = await bcrypt.hash(secret, 10);

      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: TEST_TOKEN_ID,
        userId: 'user-1',
        hashedToken,
        revoked: false,
        expiresAt: new Date(Date.now() - 1000),
      });
      mockPrismaService.refreshToken.update.mockResolvedValue({});

      await expect(service.rotateRefreshToken(rawToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should reject deactivated users', async () => {
      const secret = 'valid-secret';
      const rawToken = `${TEST_TOKEN_ID}.${secret}`;
      const hashedToken = await bcrypt.hash(secret, 10);

      mockPrismaService.refreshToken.findUnique.mockResolvedValue({
        id: TEST_TOKEN_ID,
        userId: 'user-1',
        hashedToken,
        revoked: false,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      });
      mockPrismaService.$transaction.mockImplementation(
        (cb: (tx: typeof mockPrismaService) => unknown) => cb(mockPrismaService),
      );
      mockPrismaService.refreshToken.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(service.rotateRefreshToken(rawToken)).rejects.toThrow(UnauthorizedException);
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
