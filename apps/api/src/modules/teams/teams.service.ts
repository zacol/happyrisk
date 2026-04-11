import type { TeamCreate, TeamUpdate } from '@happyrisk/core';

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

  async findAll() {
    return this.prisma.team.findMany({
      select: this.teamSelect,
      orderBy: { createdAt: 'desc' },
    });
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
    await this.findOne(id);

    return this.prisma.team.update({
      where: { id },
      data: { name: data.name },
      select: this.teamSelect,
    });
  }

  async archive(id: string) {
    await this.findOne(id);

    return this.prisma.team.update({
      where: { id },
      data: { isActive: false },
      select: this.teamSelect,
    });
  }

  private readonly teamSelect = {
    id: true,
    name: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } as const;
}
