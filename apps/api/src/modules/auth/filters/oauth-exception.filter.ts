import { ExceptionFilter, Catch, ArgumentsHost, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Catch(UnauthorizedException)
export class OAuthExceptionFilter implements ExceptionFilter {
  constructor(private readonly configService: ConfigService) {}

  catch(exception: UnauthorizedException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');

    // Default to 'AuthFailed' if message is generic 'Unauthorized'
    let errorType = exception.message;

    if (errorType === 'Unauthorized') {
      errorType = 'AuthFailed';
    }

    response.redirect(`${frontendUrl}/auth-callback?error=${errorType}`);
  }
}
