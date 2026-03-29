import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Catch(UnauthorizedException)
export class OAuthExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(OAuthExceptionFilter.name);

  constructor(private readonly configService: ConfigService) {}

  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');

    // Log specific error for debugging, but return generic message to prevent enumeration
    this.logger.error('OAuth authentication failed', exception.stack);

    response.redirect(`${frontendUrl}/auth-callback?error=AuthFailed`);
  }
}
