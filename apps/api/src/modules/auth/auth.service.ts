import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly refreshExpiresIn: string;
  private readonly bcryptRounds = 10;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
  }

  generateAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign({
      sub: payload.userId,
      email: payload.email,
      role: payload.role,
    });
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, this.bcryptRounds);
  }

  async storeRefreshToken(userId: string, token: string): Promise<void> {
    const hashedToken = await this.hashToken(token);
    const expiresAt = this.calculateExpiry(this.refreshExpiresIn);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        hashedToken,
        expiresAt,
      },
    });
  }

  async rotateRefreshToken(
    oldToken: string,
    userId: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { userId, revoked: false },
    });

    let matchedToken: (typeof storedTokens)[0] | null = null;
    for (const stored of storedTokens) {
      const isMatch = await bcrypt.compare(oldToken, stored.hashedToken);
      if (isMatch) {
        matchedToken = stored;
        break;
      }
    }

    if (!matchedToken) {
      // Possible token reuse attack — revoke all tokens for this user
      await this.prisma.refreshToken.updateMany({
        where: { userId },
        data: { revoked: true },
      });
      throw new UnauthorizedException('InvalidRefreshToken');
    }

    if (matchedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.update({
        where: { id: matchedToken.id },
        data: { revoked: true },
      });
      throw new UnauthorizedException('RefreshTokenExpired');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { revoked: true },
    });

    // Fetch user to get current role
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('AccountDeactivated');
    }

    // Generate new tokens
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken();
    await this.storeRefreshToken(userId, refreshToken);

    return { accessToken, refreshToken };
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async revokeRefreshTokenByValue(token: string, userId: string): Promise<void> {
    const storedTokens = await this.prisma.refreshToken.findMany({
      where: { userId, revoked: false },
    });

    for (const stored of storedTokens) {
      const isMatch = await bcrypt.compare(token, stored.hashedToken);
      if (isMatch) {
        await this.prisma.refreshToken.update({
          where: { id: stored.id },
          data: { revoked: true },
        });
        return;
      }
    }
  }

  private calculateExpiry(duration: string): Date {
    const now = new Date();
    const match = duration.match(/^(\d+)([dhms])$/);
    if (!match) {
      // Default to 7 days
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = parseInt(match[1], 10);
    switch (match[2]) {
      case 'd':
        return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
      case 'h':
        return new Date(now.getTime() + value * 60 * 60 * 1000);
      case 'm':
        return new Date(now.getTime() + value * 60 * 1000);
      case 's':
        return new Date(now.getTime() + value * 1000);
      default:
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
  }
}
