import {
  Controller,
  Get,
  Logger,
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
import { AuthService, type TokenPayload } from './auth.service';
import { JwtAuthGuard } from './guards/jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { OAuthExceptionFilter } from './filters/oauth-exception.filter';
import { parseDurationMs } from '../../common/utils/duration.utils';

interface RequestWithCookies extends Request {
  cookies: Record<string, string | undefined>;
}

interface RequestWithUser extends Request {
  user?: TokenPayload;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
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
  async googleCallback(@Req() req: RequestWithUser, @Res() res: Response) {
    const user = req.user;

    if (!user) {
      return res.redirect(`${this.frontendUrl}/auth-callback?error=AuthFailed`);
    }

    try {
      const accessToken = this.authService.generateAccessToken(user);
      const refreshToken = this.authService.generateRefreshToken();

      await this.authService.storeRefreshToken(user.userId, refreshToken);

      this.setTokenCookies(res, accessToken, refreshToken);

      return res.redirect(`${this.frontendUrl}/auth-callback?auth=success`);
    } catch (error) {
      this.logger.error('Failed to process Google callback', error);

      return res.redirect(`${this.frontendUrl}/auth-callback?error=AuthFailed`);
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: RequestWithCookies, @Res() res: Response) {
    const oldRefreshToken = req.cookies?.refresh_token;

    if (!oldRefreshToken) {
      throw new UnauthorizedException('NoRefreshToken');
    }

    try {
      const tokens = await this.authService.rotateRefreshToken(oldRefreshToken);

      this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);

      return res.json({ message: 'TokensRefreshed' });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.clearTokenCookies(res);
      }

      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: RequestWithCookies, @Res() res: Response) {
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      try {
        await this.authService.revokeRefreshTokenByValue(refreshToken);
      } catch (err) {
        this.logger.warn('Failed to revoke refresh token during logout', err);
      }
    }

    this.clearTokenCookies(res);

    return res.json({ message: 'LoggedOut' });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: TokenPayload) {
    return user;
  }

  private clearTokenCookies(res: Response): void {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      path: '/',
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      path: '/',
    });
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
      path: '/',
    });
  }
}
