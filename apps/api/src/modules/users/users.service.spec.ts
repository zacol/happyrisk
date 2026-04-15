import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from '@/modules/auth/auth.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

import { UsersService } from './users.service';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  image: null,
  role: 'USER',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrismaService = {
  user: {
    count: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  refreshToken: {
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockAuthService = {
  revokeAllUserTokens: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create({
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({
            email: 'test@example.com',
            name: 'Test User',
            role: 'USER',
            isActive: true,
          }),
        }),
      );
    });

    it('should throw ConflictException if user already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.create({ email: 'test@example.com' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('should default role to USER', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      await service.create({ email: 'test@example.com' });

      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ role: 'USER' }),
        }),
      );
    });

    it('should allow creating with ADMIN role', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        role: 'ADMIN',
      });

      await service.create({ email: 'admin@example.com', role: 'ADMIN' });

      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: expect.objectContaining({ role: 'ADMIN' }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      mockPrismaService.$transaction.mockResolvedValue([1, [mockUser]]);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result).toEqual({
        meta: {
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        },
        items: [mockUser],
      });
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('user-1');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        name: 'Updated Name',
      });

      const result = await service.update('user-1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent', { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deactivate', () => {
    it('should deactivate user and revoke tokens', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.$transaction.mockResolvedValue([
        { ...mockUser, isActive: false },
        { count: 2 },
      ]);

      const result = await service.deactivate('user-1');

      expect(result.isActive).toBe(false);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.deactivate('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('changeRole', () => {
    it('should change user role', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        role: 'ADMIN',
      });

      const result = await service.changeRole('user-1', 'ADMIN');

      expect(result.role).toBe('ADMIN');
    });
  });
});
