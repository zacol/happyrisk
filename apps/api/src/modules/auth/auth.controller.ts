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

interface RequestWithCookies extends Request {
  cookies: Record<string, string | undefined>;
}

@Controller('auth')
export class AuthController {
  private readonly frontendUrl: string;
  private readonly isProduction: boolean;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    this.isProduction = this.configService.get<string>('NODE_ENV') === 'production';
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
    const typedReq = req as RequestWithCookies;
    const oldRefreshToken = typedReq.cookies?.refresh_token;
    if (!oldRefreshToken) {
      throw new UnauthorizedException('NoRefreshToken');
    }

    // Decode access token to get userId (even if expired)
    let userId: string | undefined;
    try {
      const accessToken = typedReq.cookies?.access_token;
      if (accessToken) {
        const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());
        userId = payload.sub;
      }
    } catch {
      // Access token might be missing or malformed
    }

    if (!userId) {
      throw new UnauthorizedException('CannotIdentifyUser');
    }

    const tokens = await this.authService.rotateRefreshToken(oldRefreshToken, userId);

    this.setTokenCookies(res as Response, tokens.accessToken, tokens.refreshToken);
    return res.json({ message: 'TokensRefreshed' });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: any, @Res() res: any) {
    const typedReq = req as RequestWithCookies;
    const refreshToken = typedReq.cookies?.refresh_token;
    const accessToken = typedReq.cookies?.access_token;

    if (refreshToken && accessToken) {
      try {
        const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());
        await this.authService.revokeRefreshTokenByValue(refreshToken, payload.sub);
      } catch {
        // Best-effort revocation
      }
    }

    const typedRes = res as Response;
    typedRes.clearCookie('access_token', { path: '/' });
    typedRes.clearCookie('refresh_token', { path: '/api/auth' });
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
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth',
    });
  }
}
