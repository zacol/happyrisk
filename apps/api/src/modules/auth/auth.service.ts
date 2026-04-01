import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { parseDurationMs } from '@/common/utils/duration.utils';
import { PrismaService } from '@/modules/prisma/prisma.service';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class AuthService {
  private readonly refreshExpiresIn: string;
  private readonly bcryptRounds = 10;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.refreshExpiresIn = this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN');
  }

  generateAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign({
      sub: payload.userId,
      email: payload.email,
      role: payload.role,
    });
  }

  generateRefreshToken(): string {
    const id = crypto.randomUUID();
    const secret = crypto.randomBytes(64).toString('hex');
    return `${id}.${secret}`;
  }

  private parseRefreshToken(token: string): { id: string; secret: string } {
    const dotIndex = token.indexOf('.');

    if (dotIndex === -1) throw new UnauthorizedException('InvalidRefreshToken');

    const id = token.slice(0, dotIndex);
    const secret = token.slice(dotIndex + 1);

    if (!UUID_REGEX.test(id) || secret.length === 0) {
      throw new UnauthorizedException('InvalidRefreshToken');
    }

    return { id, secret };
  }

  async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, this.bcryptRounds);
  }

  async storeRefreshToken(userId: string, token: string): Promise<void> {
    const { id, secret } = this.parseRefreshToken(token);
    const hashedToken = await this.hashToken(secret);
    const expiresAt = this.calculateExpiry(this.refreshExpiresIn);

    await this.prisma.refreshToken.create({
      data: {
        id,
        userId,
        hashedToken,
        expiresAt,
      },
    });
  }

  async rotateRefreshToken(
    oldToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { id, secret } = this.parseRefreshToken(oldToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { id },
    });

    if (!stored) {
      throw new UnauthorizedException('InvalidRefreshToken');
    }

    const isMatch = await bcrypt.compare(secret, stored.hashedToken);
    if (!isMatch) {
      throw new UnauthorizedException('InvalidRefreshToken');
    }

    if (stored.revoked) {
      // Reuse attack: valid secret presented for already-revoked token
      await this.prisma.refreshToken.updateMany({
        where: { userId: stored.userId },
        data: { revoked: true },
      });
      throw new UnauthorizedException('InvalidRefreshToken');
    }

    if (stored.expiresAt < new Date()) {
      await this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revoked: true },
      });
      throw new UnauthorizedException('RefreshTokenExpired');
    }

    // Atomically revoke the old token only if it is still not revoked.
    // The conditional where clause is the single-winner gate: only one
    // concurrent caller can update the row from revoked=false to revoked=true.
    const result = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.refreshToken.updateMany({
        where: { id: stored.id, revoked: false },
        data: { revoked: true },
      });

      if (count === 0) {
        return { reused: true as const };
      }

      // Fetch user to get current role
      const user = await tx.user.findUnique({
        where: { id: stored.userId },
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

      const { id: newId, secret: newSecret } = this.parseRefreshToken(refreshToken);
      const hashedToken = await this.hashToken(newSecret);
      const expiresAt = this.calculateExpiry(this.refreshExpiresIn);

      await tx.refreshToken.create({
        data: {
          id: newId,
          userId: stored.userId,
          hashedToken,
          expiresAt,
        },
      });

      return { reused: false as const, accessToken, refreshToken };
    });

    if (result.reused) {
      await this.revokeAllUserTokens(stored.userId);

      throw new UnauthorizedException('InvalidRefreshToken');
    }

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async revokeRefreshTokenByValue(token: string): Promise<void> {
    let parsed: { id: string; secret: string };
    try {
      parsed = this.parseRefreshToken(token);
    } catch {
      return;
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { id: parsed.id },
    });

    if (!stored || stored.revoked) return;

    const isMatch = await bcrypt.compare(parsed.secret, stored.hashedToken);

    if (isMatch) {
      await this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revoked: true },
      });
    }
  }

  private calculateExpiry(duration: string): Date {
    return new Date(Date.now() + parseDurationMs(duration));
  }
}
