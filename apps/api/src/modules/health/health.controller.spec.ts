import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { HealthController } from './health.controller';
import { HealthCheckResult, HealthService } from './health.service';

const healthyResult: HealthCheckResult = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  services: {
    api: { status: 'healthy' },
    database: { status: 'healthy', responseTimeMs: 5 },
  },
};

const unhealthyResult: HealthCheckResult = {
  status: 'unhealthy',
  timestamp: new Date().toISOString(),
  services: {
    api: { status: 'healthy' },
    database: { status: 'unhealthy', responseTimeMs: 5001 },
  },
};

const mockHealthService = {
  check: jest.fn(),
};

const mockResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };

  return res;
};

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: mockHealthService }],
    }).compile();

    controller = module.get<HealthController>(HealthController);

    jest.resetAllMocks();
  });

  it('should return 200 when healthy', async () => {
    mockHealthService.check.mockResolvedValue(healthyResult);
    const res = mockResponse();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await controller.check(res as any);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(res.json).toHaveBeenCalledWith(healthyResult);
  });

  it('should return 503 when unhealthy', async () => {
    mockHealthService.check.mockResolvedValue(unhealthyResult);
    const res = mockResponse();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await controller.check(res as any);

    expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(res.json).toHaveBeenCalledWith(unhealthyResult);
  });
});
