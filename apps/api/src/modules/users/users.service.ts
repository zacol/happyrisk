import type { ChangeRole, UserCreate, UserUpdate } from '@happyrisk/core';

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '@/generated/prisma/client';
import { AuthService } from '@/modules/auth/auth.service';
import { PrismaService } from '@/modules/prisma/prisma.service';

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

    const fieldUpdates = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.role !== undefined && { role: data.role }),
    };

    if (Object.keys(fieldUpdates).length > 0) {
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

  async getMemberships(id: string) {
    await this.findOne(id);

    return this.prisma.teamMembership.findMany({
      where: { userId: id },
      select: {
        id: true,
        teamId: true,
        joinedAt: true,
        team: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });
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
