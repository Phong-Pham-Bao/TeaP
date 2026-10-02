import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/token-response.dto';

interface SessionTokens {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}

export type AuthSessionResult = TokenResponseDto & { refreshToken: string };

@Injectable()
export class AuthService {
  private readonly refreshTokenTtlDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.refreshTokenTtlDays = Number(
      configService.get<string>('JWT_REFRESH_TTL_DAYS') || '7',
    );
    if (!Number.isInteger(this.refreshTokenTtlDays) || this.refreshTokenTtlDays < 1) {
      throw new Error('JWT_REFRESH_TTL_DAYS must be a positive integer');
    }
  }

  get refreshCookieMaxAgeMs(): number {
    return this.refreshTokenTtlDays * 86_400_000;
  }

  async login(dto: LoginDto): Promise<AuthSessionResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new ForbiddenException('Account is disabled');
    }

    return this.buildResponse(user, await this.createSession(user));
  }

  async refreshTokens(
    refreshToken: string,
    csrfToken: string,
  ): Promise<AuthSessionResult> {
    if (!refreshToken || !csrfToken) {
      throw new UnauthorizedException('Refresh cookie and CSRF token are required');
    }
    const tokenHash = this.hashSecret(refreshToken);
    const existingToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!existingToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (
      !existingToken.csrfTokenHash ||
      !this.matchesHash(csrfToken, existingToken.csrfTokenHash)
    ) {
      throw new UnauthorizedException('CSRF validation failed');
    }
    if (existingToken.isRevoked) {
      await this.revokeFamily(existingToken.familyId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    if (existingToken.expiresAt <= new Date()) {
      await this.revokeFamily(existingToken.familyId);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    if (!existingToken.user.isActive) {
      await this.revokeFamily(existingToken.familyId);
      throw new ForbiddenException('Account is disabled');
    }

    const nextRefreshToken = this.generateRefreshToken();
    const nextCsrfToken = this.generateCsrfToken();
    const nextTokenId = randomUUID();
    const expiresAt = this.getRefreshExpiry();

    const rotated = await this.prisma.$transaction(
      async (tx) => {
        const claimed = await tx.refreshToken.updateMany({
          where: {
            id: existingToken.id,
            tokenHash,
            isRevoked: false,
          },
          data: {
            isRevoked: true,
            revokedAt: new Date(),
            lastUsedAt: new Date(),
            replacedByTokenId: nextTokenId,
          },
        });

        if (claimed.count !== 1) return false;

        await tx.refreshToken.create({
          data: {
            id: nextTokenId,
            token: null,
            tokenHash: this.hashSecret(nextRefreshToken),
            csrfTokenHash: this.hashSecret(nextCsrfToken),
            familyId: existingToken.familyId,
            userId: existingToken.userId,
            expiresAt,
          },
        });
        return true;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    if (!rotated) {
      await this.revokeFamily(existingToken.familyId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    const accessToken = this.signAccessToken(
      existingToken.user,
      existingToken.familyId,
    );
    return this.buildResponse(existingToken.user, {
      accessToken,
      refreshToken: nextRefreshToken,
      csrfToken: nextCsrfToken,
    });
  }

  async logout(userId: string, sessionId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, familyId: sessionId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        avatar: true,
        role: true,
        branchId: true,
        branchAssignments: { select: { branchId: true } },
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user || !user.isActive) {
      throw new NotFoundException('User not found');
    }
    const { branchAssignments, ...profile } = user;
    return {
      ...profile,
      allowedBranchIds: this.mergeBranchIds(
        user.branchId,
        branchAssignments.map((assignment) => assignment.branchId),
      ),
    };
  }

  private async createSession(user: User): Promise<SessionTokens> {
    const familyId = randomUUID();
    const refreshToken = this.generateRefreshToken();
    const csrfToken = this.generateCsrfToken();

    await this.prisma.refreshToken.create({
      data: {
        token: null,
        tokenHash: this.hashSecret(refreshToken),
        csrfTokenHash: this.hashSecret(csrfToken),
        familyId,
        userId: user.id,
        expiresAt: this.getRefreshExpiry(),
      },
    });

    return {
      accessToken: this.signAccessToken(user, familyId),
      refreshToken,
      csrfToken,
    };
  }

  private signAccessToken(user: User, sessionId: string): string {
    return this.jwtService.sign({
      sub: user.id,
      type: 'access',
      sid: sessionId,
    });
  }

  private async buildResponse(
    user: User,
    tokens: SessionTokens,
  ): Promise<AuthSessionResult> {
    const assignments = await this.prisma.userBranchAssignment.findMany({
      where: { userId: user.id },
      select: { branchId: true },
    });
    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        branchId: user.branchId || undefined,
        allowedBranchIds: this.mergeBranchIds(
          user.branchId,
          assignments.map((assignment) => assignment.branchId),
        ),
      },
    };
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }

  private generateRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  private generateCsrfToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashSecret(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private matchesHash(secret: string, expectedHash: string): boolean {
    const actual = Buffer.from(this.hashSecret(secret), 'hex');
    const expected = Buffer.from(expectedHash, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  private mergeBranchIds(
    primaryBranchId: string | null,
    assignedBranchIds: string[],
  ): string[] {
    return Array.from(
      new Set([
        ...assignedBranchIds,
        ...(primaryBranchId ? [primaryBranchId] : []),
      ]),
    );
  }

  private getRefreshExpiry(): Date {
    return new Date(Date.now() + this.refreshTokenTtlDays * 86_400_000);
  }
}
