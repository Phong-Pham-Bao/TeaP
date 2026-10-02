import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedActor } from '../../../common/types/authenticated-actor';
import { PrismaService } from '../../../prisma/prisma.service';

interface AccessTokenPayload {
  sub: string;
  type: 'access';
  sid: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET is required');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      issuer: configService.get<string>('JWT_ISSUER') || 'teap-api',
      audience: configService.get<string>('JWT_AUDIENCE') || 'teap-web',
      algorithms: ['HS256'],
    });
  }

  async validate(payload: AccessTokenPayload): Promise<AuthenticatedActor> {
    if (payload.type !== 'access' || !payload.sub || !payload.sid) {
      throw new UnauthorizedException('Invalid access token');
    }

    const [user, activeSession] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
          branchId: true,
          branchAssignments: {
            select: { branchId: true },
          },
          isActive: true,
        },
      }),
      this.prisma.refreshToken.findFirst({
        where: {
          familyId: payload.sid,
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
        select: { id: true },
      }),
    ]);

    if (!user?.isActive || !activeSession) {
      throw new UnauthorizedException('Session is no longer active');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      allowedBranchIds: Array.from(
        new Set([
          ...user.branchAssignments.map((assignment) => assignment.branchId),
          ...(user.branchId ? [user.branchId] : []),
        ]),
      ),
      sessionId: payload.sid,
    };
  }
}
