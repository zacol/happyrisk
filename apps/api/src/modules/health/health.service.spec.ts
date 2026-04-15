import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '@/modules/prisma/prisma.service';

import { HealthService } from './health.service';

const mockPrismaService = {
  $queryRaw: jest.fn(),
};

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<HealthService>(HealthService);

    jest.resetAllMocks();
  });

  describe('check', () => {
    it('should return healthy when database responds', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      const result = await service.check();

      expect(result.status).toBe('healthy');
      expect(result.services.api.status).toBe('healthy');
      expect(result.services.database.status).toBe('healthy');
      expect(typeof result.services.database.responseTimeMs).toBe('number');
      expect(result.timestamp).toBeDefined();
    });

    it('should return unhealthy when database query fails', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('Connection refused'));

      const result = await service.check();

      expect(result.status).toBe('unhealthy');
      expect(result.services.api.status).toBe('healthy');
      expect(result.services.database.status).toBe('unhealthy');
      expect(typeof result.services.database.responseTimeMs).toBe('number');
    });

    it('should return unhealthy when database times out', async () => {
      mockPrismaService.$queryRaw.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10_000)),
      );

      const result = await service.check();

      expect(result.status).toBe('unhealthy');
      expect(result.services.database.status).toBe('unhealthy');
    }, 10_000);

    it('should always include a valid ISO timestamp', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ 1: 1 }]);

      const result = await service.check();
      const parsed = new Date(result.timestamp);

      expect(parsed.toISOString()).toBe(result.timestamp);
    });
  });
});
