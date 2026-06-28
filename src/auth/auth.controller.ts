import {
  Body,
  Controller,
  Get,
  Logger,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Role } from '../common/enums/role.enum';
import { HttpCode, HttpStatus } from '@nestjs/common';

interface GoogleUser {
  id: string;
  email: string;
  role: Role;

}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) { }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() { }

  // @Get('google/callback')
  // @UseGuards(AuthGuard('google'))
  // async googleAuthRedirect(
  //   @Req() req: Request & { user: GoogleUser },
  //   @Res() res: Response,
  // ) {
  //   this.logger.log('GOOGLE CALLBACK HIT');
  //   this.logger.log(`User details: ${JSON.stringify(req.user)}`);

  //   const { access_token } = this.authService.generateToken(req.user);

  //   this.logger.log('Token generation success');

  //   this.setAuthCookie(res, access_token);

  //   const frontendHost = this.configService.get<string>('FRONTEND_HOST');
  //   return res.redirect(`${frontendHost}/analytics/overview`);
  // }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req: Request & { user: GoogleUser },
    @Res() res: Response,
  ) {
    // this.logger.log('GOOGLE CALLBACK HIT');
    // this.logger.log(`User details: ${JSON.stringify(req.user)}`);

    const { access_token } = this.authService.generateToken(req.user);

    this.setAuthCookie(res, access_token);

    const customerFrontend =
      this.configService.get<string>('FRONTEND_HOST');

    const adminFrontend =
      this.configService.get<string>('FRONTEND_ADMIN_HOST');

    if (req.user.role === Role.ADMIN) {
      return res.redirect(adminFrontend!);
    }

    // return res.redirect(customerFrontend!);
    return res.redirect(`${customerFrontend}/auth/callback`);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const { access_token } = await this.authService.login(dto);
    this.setAuthCookie(res, access_token);
    return res.json({ access_token });
  }


  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    });

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Post('forgot-password')
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }



  @Post('reset-password')
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  private setAuthCookie(res: Response, accessToken: string) {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
      maxAge: 30 * 60 * 1000, // 30 minutes — matches JWT expiry
    });
  }
}
