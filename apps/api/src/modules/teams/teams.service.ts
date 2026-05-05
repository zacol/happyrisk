import { type ListQuery, type TeamCreate, type TeamUpdate } from '@happyrisk/core';

import { Injectable, NotFoundException } from '@nestjs/common';

import { createOrderBy } from '@/common/utils/list.utils';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: TeamCreate) {
    return this.prisma.team.create({
      data: { name: data.name },
      select: this.teamSelect,
    });
  }

  async findAll(query: ListQuery) {
    const { pageIndex, pageSize, sortBy, sortDir } = query;
    const skip = pageIndex * pageSize;

    const { orderBy, sortMeta } = this.buildOrderBy(sortBy, sortDir);

    const [total, items] = await this.prisma.$transaction([
      this.prisma.team.count(),
      this.prisma.team.findMany({
        select: this.teamSelect,
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
    orderBy: Prisma.TeamOrderByWithRelationInput;
    sortMeta?: { sortBy: string; sortDir: 'asc' | 'desc' };
  } {
    const validFields = ['name', 'isActive', 'createdAt'] as const;
    const result = createOrderBy(sortBy, sortDir, validFields, 'createdAt');

    return {
      orderBy: result.orderBy as Prisma.TeamOrderByWithRelationInput,
      sortMeta: result.sortMeta,
    };
  }

  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({
      where: { id },
      select: this.teamSelect,
    });

    if (!team) {
      throw new NotFoundException('TeamNotFound');
    }

    return team;
  }

  async update(id: string, data: TeamUpdate) {
    await this.prisma.team.updateMany({
      where: { id },
      data: { name: data.name },
    });

    return this.findOne(id);
  }

  async archive(id: string) {
    await this.prisma.team.updateMany({
      where: { id },
      data: { isActive: false },
    });

    return this.findOne(id);
  }

  private readonly teamSelect = {
    id: true,
    name: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } as const;
}
