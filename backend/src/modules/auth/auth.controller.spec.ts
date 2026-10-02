import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthThrottleService } from './auth-throttle.service';

describe('AuthController browser session transport', () => {
  const session = {
    accessToken: 'access-token',
    refreshToken: 'refresh-secret',
    csrfToken: 'csrf-secret',
    user: {
      id: 'user-1',
      email: 'user@teap.vn',
      fullName: 'User',
      role: Role.CASHIER,
      branchId: 'branch-a',
      allowedBranchIds: ['branch-a'],
    },
  };

  function createController() {
    const authService = {
      login: jest.fn().mockResolvedValue(session),
      refreshTokens: jest.fn().mockResolvedValue(session),
      refreshCookieMaxAgeMs: 604_800_000,
    };
    const controller = new AuthController(
      authService as unknown as AuthService,
      { consume: jest.fn() } as unknown as AuthThrottleService,
      { get: jest.fn(() => 'production') } as unknown as ConfigService,
    );
    return { controller, authService };
  }

  it('sets refresh token only in a secure HttpOnly cookie', async () => {
    const { controller } = createController();
    const response = { cookie: jest.fn() } as unknown as Response;

    const body = await controller.login(
      { email: 'user@teap.vn', password: 'Password1' },
      '127.0.0.1',
      response,
    );

    expect(response.cookie).toHaveBeenCalledWith(
      'teap_refresh',
      'refresh-secret',
      expect.objectContaining({
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
      }),
    );
    expect(body).not.toHaveProperty('refreshToken');
    expect(body).toEqual(expect.objectContaining({ csrfToken: 'csrf-secret' }));
  });

  it('requires the cookie and CSRF header when rotating a session', async () => {
    const { controller, authService } = createController();
    const request = {
      headers: { cookie: 'other=x; teap_refresh=refresh-secret' },
    } as Request;
    const response = { cookie: jest.fn() } as unknown as Response;

    await controller.refreshTokens(
      request,
      'csrf-secret',
      '127.0.0.1',
      response,
    );

    expect(authService.refreshTokens).toHaveBeenCalledWith(
      'refresh-secret',
      'csrf-secret',
    );
  });
});
