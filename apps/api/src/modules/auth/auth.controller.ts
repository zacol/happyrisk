import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  UseFilters,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService, TokenPayload } from './auth.service';
import { JwtAuthGuard } from './guards/jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { OAuthExceptionFilter } from './filters/oauth-exception.filter';
import { parseDurationMs } from '../../common/utils/duration.utils';

interface RequestWithCookies extends Request {
  cookies: Record<string, string | undefined>;
}

@Controller('auth')
export class AuthController {
  private readonly frontendUrl: string;
  private readonly isProduction: boolean;
  private readonly accessTokenMaxAge: number;
  private readonly refreshTokenMaxAge: number;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    this.accessTokenMaxAge = parseDurationMs(
      this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN'),
    );
    this.refreshTokenMaxAge = parseDurationMs(
      this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
    );
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    // Passport redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @UseFilters(OAuthExceptionFilter)
  async googleCallback(@Req() req: any, @Res() res: any) {
    const user = req.user as TokenPayload;

    if (!user) {
      return res.redirect(`${this.frontendUrl}/auth-callback?error=AuthFailed`);
    }

    const accessToken = this.authService.generateAccessToken(user);
    const refreshToken = this.authService.generateRefreshToken();
    await this.authService.storeRefreshToken(user.userId, refreshToken);

    this.setTokenCookies(res, accessToken, refreshToken);
    return res.redirect(`${this.frontendUrl}/auth-callback?auth=success`);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: any, @Res() res: any) {
    const oldRefreshToken = (req as RequestWithCookies).cookies?.refresh_token;
    if (!oldRefreshToken) {
      throw new UnauthorizedException('NoRefreshToken');
    }

    const tokens = await this.authService.rotateRefreshToken(oldRefreshToken);

    this.setTokenCookies(res as Response, tokens.accessToken, tokens.refreshToken);
    return res.json({ message: 'TokensRefreshed' });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Res() res: any) {
    const refreshToken = (req as RequestWithCookies).cookies?.refresh_token;

    if (refreshToken) {
      await this.authService.revokeRefreshTokenByValue(refreshToken);
    }

    const typedRes = res as Response;

    typedRes.clearCookie('access_token', {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      path: '/',
    });

    typedRes.clearCookie('refresh_token', {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      path: '/api/auth',
    });

    return typedRes.json({ message: 'LoggedOut' });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: any) {
    return user;
  }

  private setTokenCookies(res: Response, accessToken: string, refreshToken: string): void {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      maxAge: this.accessTokenMaxAge,
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      maxAge: this.refreshTokenMaxAge,
      path: '/api/auth',
    });
  }
}
