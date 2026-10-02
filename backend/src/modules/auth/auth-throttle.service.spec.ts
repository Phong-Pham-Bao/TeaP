import { HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthThrottleService } from './auth-throttle.service';

describe('AuthThrottleService', () => {
  it('uses a hashed key in the shared database counter', async () => {
    const queryRaw = jest.fn().mockResolvedValue([{ count: 1 }]);
    const service = new AuthThrottleService({
      $queryRaw: queryRaw,
    } as unknown as PrismaService);

    await service.consume('login-account:127.0.0.1:user@teap.vn', 5, 60_000);

    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(queryRaw.mock.calls[0][1]).toMatch(/^[a-f0-9]{64}$/);
    expect(queryRaw.mock.calls[0][1]).not.toContain('user@teap.vn');
  });

  it('returns HTTP 429 after the shared limit is exceeded', async () => {
    const service = new AuthThrottleService({
      $queryRaw: jest.fn().mockResolvedValue([{ count: 6 }]),
    } as unknown as PrismaService);

    await expect(service.consume('login-ip:127.0.0.1', 5, 60_000)).rejects.toMatchObject({
      status: HttpStatus.TOO_MANY_REQUESTS,
    });
  });
});
