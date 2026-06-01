import {
  Controller,
  Get,
  Logger,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';

interface GoogleUser {
  id: string;
  email: string;
  role: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req: Request & { user: GoogleUser },
    @Res() res: Response,
  ) {
    this.logger.log('GOOGLE CALLBACK HIT');
    this.logger.log(`User details: ${JSON.stringify(req.user)}`);

    const { access_token } = this.authService.generateToken(req.user);

    this.logger.log('Token generation success');

    const frontendHost = this.configService.get<string>('FRONTEND_HOST');
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie('accessToken', access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 30 * 60 * 1000, // 30 minutes — matches JWT expiry
    });

    return res.redirect(`${frontendHost}/analytics/overview`);
  }
}
