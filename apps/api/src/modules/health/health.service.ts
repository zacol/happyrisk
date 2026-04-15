import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '@/modules/prisma/prisma.service';

interface ServiceStatus {
  status: 'healthy' | 'unhealthy';
}

interface DatabaseStatus extends ServiceStatus {
  responseTimeMs: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    api: ServiceStatus;
    database: DatabaseStatus;
  };
}

const DB_TIMEOUT_MS = 5_000;

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthCheckResult> {
    const database = await this.checkDatabase();

    return {
      status: database.status,
      timestamp: new Date().toISOString(),
      services: {
        api: { status: 'healthy' },
        database,
      },
    };
  }

  private async checkDatabase(): Promise<DatabaseStatus> {
    const start = performance.now();

    try {
      await Promise.race([
        this.prisma.$queryRaw<[{ 1: number }]>`SELECT 1`,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database timeout')), DB_TIMEOUT_MS),
        ),
      ]);

      return {
        status: 'healthy',
        responseTimeMs: Math.round(performance.now() - start),
      };
    } catch (error) {
      this.logger.warn(
        'Database health check failed',
        error instanceof Error ? error.message : error,
      );

      return {
        status: 'unhealthy',
        responseTimeMs: Math.round(performance.now() - start),
      };
    }
  }
}
