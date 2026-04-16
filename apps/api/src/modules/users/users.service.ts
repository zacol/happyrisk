import { type ChangeRole, type ListQuery, type UserCreate, type UserUpdate } from '@happyrisk/core';

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { createOrderBy } from '@/common/utils/list.utils';
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

  async findAll(query: ListQuery) {
    const { pageIndex, pageSize, sortBy, sortDir } = query;
    const skip = pageIndex * pageSize;

    const { orderBy, sortMeta } = this.buildOrderBy(sortBy, sortDir);

    const [total, items] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.user.findMany({
        select: this.userSelect,
        orderBy,
        skip,
        take: pageSize,
      }),
    ]);

    return {
      meta: {
        pagination: { pageIndex, pageSize, total },
        ...(sortMeta && { sort: sortMeta }),
      },
      items,
    };
  }

  private buildOrderBy(
    sortBy: string | undefined,
    sortDir: 'asc' | 'desc' | undefined,
  ): {
    orderBy: Prisma.UserOrderByWithRelationInput;
    sortMeta?: { sortBy: string; sortDir: 'asc' | 'desc' };
  } {
    const validFields = ['name', 'email', 'role', 'isActive', 'createdAt'] as const;
    const result = createOrderBy(sortBy, sortDir, validFields, 'createdAt');

    return {
      orderBy: result.orderBy as Prisma.UserOrderByWithRelationInput,
      sortMeta: result.sortMeta,
    };
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
