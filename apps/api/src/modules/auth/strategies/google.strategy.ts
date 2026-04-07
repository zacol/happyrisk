import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

import { PrismaService } from '@/modules/prisma/prisma.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      return done(new UnauthorizedException('NoEmailProvided'), undefined);
    }

    const oauthAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: profile.id,
        },
      },
      include: {
        user: { select: { id: true, email: true, name: true, role: true, isActive: true } },
      },
    });

    let user: {
      id: string;
      email: string;
      name: string | null;
      role: string;
      isActive: boolean;
    } | null;

    if (oauthAccount) {
      // Path A: returning user — identity resolved by stable providerAccountId
      user = oauthAccount.user;

      if (!user) {
        return done(new UnauthorizedException('UserNotFound'), undefined);
      }

      if (!user.isActive) {
        return done(new UnauthorizedException('AccountDeactivated'), undefined);
      }
    } else {
      // Path B: first Google login — resolve by email and create the link
      user = await this.prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, name: true, role: true, isActive: true },
      });

      if (!user) {
        return done(new UnauthorizedException('UserNotFound'), undefined);
      }

      if (!user.isActive) {
        return done(new UnauthorizedException('AccountDeactivated'), undefined);
      }

      await this.prisma.oAuthAccount.upsert({
        where: {
          provider_providerAccountId: {
            provider: 'google',
            providerAccountId: profile.id,
          },
        },
        create: {
          userId: user.id,
          provider: 'google',
          providerAccountId: profile.id,
        },
        update: {},
      });
    }

    // Update user avatar / name from Google profile if available
    const photo = profile.photos?.[0]?.value;
    const name = !user.name ? profile.displayName || undefined : undefined;

    if (photo || name) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          ...(photo && { image: photo }),
          ...(name && { name }),
        },
      });
    }

    return done(null, {
      userId: user.id,
      email: user.email,
      role: user.role,
    });
  }
}
