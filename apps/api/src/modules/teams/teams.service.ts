import type { TeamCreate, TeamMemberAdd, TeamUpdate } from '@happyrisk/core';

import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

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

  async addMember(teamId: string, data: TeamMemberAdd) {
    await this.findOne(teamId);

    try {
      return await this.prisma.teamMembership.create({
        data: { teamId, userId: data.userId },
        select: this.memberSelect,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('AlreadyMember');
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new NotFoundException('UserNotFound');
      }

      throw error;
    }
  }

  async removeMember(teamId: string, userId: string) {
    const { count } = await this.prisma.teamMembership.deleteMany({
      where: { teamId, userId },
    });

    if (count === 0) {
      throw new NotFoundException('MembershipNotFound');
    }
  }

  private readonly memberSelect = {
    id: true,
    teamId: true,
    userId: true,
    joinedAt: true,
  } as const;

  private readonly teamSelect = {
    id: true,
    name: true,
    isActive: true,
    createdAt: true,
    updatedAt: true,
  } as const;
}
