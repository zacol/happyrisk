import type { PaginationQuery, TeamCreate, TeamUpdate } from '@happyrisk/core';

import { Injectable, NotFoundException } from '@nestjs/common';

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

  async findAll(query: PaginationQuery) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [total, items] = await this.prisma.$transaction([
      this.prisma.team.count(),
      this.prisma.team.findMany({
        select: this.teamSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      meta: {
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      },
      items,
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
