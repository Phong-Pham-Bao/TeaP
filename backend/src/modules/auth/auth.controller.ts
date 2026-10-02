import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthenticatedActor } from '../../common/types/authenticated-actor';
import { AuthThrottleService } from './auth-throttle.service';
import { AuthenticatedAccess } from '../../common/decorators/authenticated-access.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authThrottle: AuthThrottleService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and get tokens' })
  @ApiResponse({ status: 200, description: 'Successful login', type: TokenResponseDto })
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<TokenResponseDto> {
    await this.authThrottle.consume(`login-ip:${ip}`, 30, 15 * 60_000);
    await this.authThrottle.consume(
      `login-account:${ip}:${loginDto.email.trim().toLowerCase()}`,
      5,
      15 * 60_000,
    );
    const session = await this.authService.login(loginDto);
    return this.writeSession(response, session);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access tokens' })
  @ApiHeader({ name: 'X-CSRF-Token', required: true })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully', type: TokenResponseDto })
  async refreshTokens(
    @Req() request: Request,
    @Headers('x-csrf-token') csrfToken: string | undefined,
    @Ip() ip: string,
    @Res({ passthrough: true }) response: Response,
  ): Promise<TokenResponseDto> {
    await this.authThrottle.consume(`refresh:${ip}`, 30, 60_000);
    const refreshToken = this.readCookie(request, 'teap_refresh');
    const session = await this.authService.refreshTokens(
      refreshToken ?? '',
      csrfToken ?? '',
    );
    return this.writeSession(response, session);
  }

  @ApiBearerAuth()
  @AuthenticatedAccess()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate refresh tokens' })
  @ApiResponse({ status: 200, description: 'Successful logout' })
  async logout(
    @CurrentUser() actor: AuthenticatedActor,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(actor.userId, actor.sessionId);
    response.clearCookie('teap_refresh', this.cookieOptions());
  }

  @ApiBearerAuth()
  @AuthenticatedAccess()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile returned successfully' })
  async getProfile(@CurrentUser('userId') userId: string) {
    return this.authService.getProfile(userId);
  }

  private writeSession(
    response: Response,
    session: Awaited<ReturnType<AuthService['login']>>,
  ): TokenResponseDto {
    const { refreshToken, ...body } = session;
    response.cookie('teap_refresh', refreshToken, {
      ...this.cookieOptions(),
      maxAge: this.authService.refreshCookieMaxAgeMs,
    });
    return body;
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'strict' as const,
      path: '/api/v1/auth',
    };
  }

  private readCookie(request: Request, name: string): string | undefined {
    const header = request.headers.cookie;
    if (!header) return undefined;
    for (const entry of header.split(';')) {
      const separator = entry.indexOf('=');
      if (separator < 0) continue;
      const key = entry.slice(0, separator).trim();
      if (key === name) {
        return decodeURIComponent(entry.slice(separator + 1).trim());
      }
    }
    return undefined;
  }
}
