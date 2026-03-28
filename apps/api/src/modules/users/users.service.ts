import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import type { UserCreate, UserUpdate, ChangeRole } from '@happyrisk/core';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async create(data: UserCreate) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException('UserAlreadyExists');
    }

    try {
      return await this.prisma.user.create({
        data: {
          email: data.email,
          name: data.name ?? null,
          role: data.role ?? 'USER',
          isActive: true,
        },
        select: this.userSelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('UserAlreadyExists');
      }

      throw error;
    }
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: this.userSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: this.userSelect,
    });

    if (!user) {
      throw new NotFoundException('UserNotFound');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      select: this.userSelect,
    });
  }

  async update(id: string, data: UserUpdate) {
    await this.findOne(id);

    const { isActive, ...rest } = data;

    const fieldUpdates = {
      ...(rest.name !== undefined && { name: rest.name }),
      ...(rest.role !== undefined && { role: rest.role }),
      ...(isActive === true && { isActive: true }),
    };

    const hasFieldUpdates = Object.keys(fieldUpdates).length > 0;

    if (isActive === false) {
      if (hasFieldUpdates) {
        await this.prisma.user.update({ where: { id }, data: fieldUpdates });
      }

      return this.deactivate(id);
    }

    if (hasFieldUpdates) {
      return this.prisma.user.update({
        where: { id },
        data: fieldUpdates,
        select: this.userSelect,
      });
    }

    return this.findOne(id);
  }

  async deactivate(id: string) {
    await this.findOne(id);

    const [user] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { isActive: false },
        select: this.userSelect,
      }),
      this.prisma.refreshToken.deleteMany({
        where: { userId: id },
      }),
    ]);

    return user;
  }

  async changeRole(id: string, role: ChangeRole['role']) {
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: this.userSelect,
    });
  }

  private readonly userSelect = {
    id: true,
    email: true,
    name: true,
    image: true,
    role: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } as const;
}
