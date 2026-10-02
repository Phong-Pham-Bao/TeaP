import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthThrottleService } from './auth-throttle.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret || secret.length < 32) {
          throw new Error('JWT_SECRET is required and must be at least 32 characters');
        }
        const expiresIn = Number(
          configService.get<string>('JWT_ACCESS_TTL_SECONDS') || '900',
        );
        if (!Number.isInteger(expiresIn) || expiresIn < 60) {
          throw new Error('JWT_ACCESS_TTL_SECONDS must be an integer of at least 60');
        }
        return {
          secret,
          signOptions: {
            expiresIn,
            issuer: configService.get<string>('JWT_ISSUER') || 'teap-api',
            audience: configService.get<string>('JWT_AUDIENCE') || 'teap-web',
            algorithm: 'HS256' as const,
          },
        };
      },
    }),
  ],
  providers: [AuthService, JwtStrategy, AuthThrottleService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
