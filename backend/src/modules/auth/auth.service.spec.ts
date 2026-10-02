import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const user: User = {
    id: 'user-1',
    email: 'cashier@teap.vn',
    password: '',
    fullName: 'Cashier',
    phone: null,
    avatar: null,
    role: Role.CASHIER,
    branchId: 'branch-a',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function createService() {
    const refreshToken = {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    };
    const prisma = {
      user: { findUnique: jest.fn() },
      userBranchAssignment: {
        findMany: jest.fn().mockResolvedValue([{ branchId: 'branch-a' }]),
      },
      refreshToken,
      $transaction: jest.fn(async (callback: (tx: unknown) => unknown) => callback({ refreshToken })),
    };
    const jwt = { sign: jest.fn(() => 'signed-access-token') };
    const config = { get: jest.fn(() => undefined) };
    const service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
    );
    return { service, prisma, refreshToken, jwt };
  }

  it('stores only a hash of a newly issued refresh token', async () => {
    const { service, prisma, refreshToken, jwt } = createService();
    const password = 'Cashier@123';
    prisma.user.findUnique.mockResolvedValue({
      ...user,
      password: await bcrypt.hash(password, 4),
    });

    const result = await service.login({ email: ' CASHIER@TEAP.VN ', password });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'cashier@teap.vn' },
    });
    expect(refreshToken.create).toHaveBeenCalledTimes(1);
    const stored = refreshToken.create.mock.calls[0][0].data;
    expect(stored.token).toBeNull();
    expect(stored.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.csrfTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(stored.tokenHash).not.toContain(result.refreshToken);
    expect(jwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ sub: user.id, type: 'access', sid: stored.familyId }),
    );
  });

  it('rotates a refresh token atomically within the same session family', async () => {
    const { service, refreshToken } = createService();
    refreshToken.findUnique.mockResolvedValue({
      id: 'old-token',
      tokenHash: 'old-hash',
      csrfTokenHash: createHash('sha256').update('csrf-secret').digest('hex'),
      familyId: 'family-1',
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      isRevoked: false,
      user,
    });
    refreshToken.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.refreshTokens('old-secret', 'csrf-secret');

    expect(result.refreshToken).not.toBe('old-secret');
    expect(refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 'old-token', isRevoked: false }),
        data: expect.objectContaining({ isRevoked: true }),
      }),
    );
    expect(refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        familyId: 'family-1',
        token: null,
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        csrfTokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
      }),
    });
  });

  it('revokes a whole family when a rotated token is reused', async () => {
    const { service, refreshToken } = createService();
    refreshToken.findUnique.mockResolvedValue({
      familyId: 'family-1',
      csrfTokenHash: createHash('sha256').update('csrf-secret').digest('hex'),
      isRevoked: true,
      expiresAt: new Date(Date.now() + 60_000),
      user,
    });
    refreshToken.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      service.refreshTokens('reused-secret', 'csrf-secret'),
    ).rejects.toThrow('Refresh token reuse detected');
    expect(refreshToken.updateMany).toHaveBeenCalledWith({
      where: { familyId: 'family-1', isRevoked: false },
      data: { isRevoked: true, revokedAt: expect.any(Date) },
    });
  });

  it('rejects refresh when the CSRF token is missing or does not match', async () => {
    const { service, refreshToken } = createService();
    refreshToken.findUnique.mockResolvedValue({
      familyId: 'family-1',
      csrfTokenHash: createHash('sha256').update('csrf-secret').digest('hex'),
      isRevoked: false,
      expiresAt: new Date(Date.now() + 60_000),
      user,
    });

    await expect(
      service.refreshTokens('refresh-secret', 'wrong-csrf'),
    ).rejects.toThrow('CSRF validation failed');
  });
});
