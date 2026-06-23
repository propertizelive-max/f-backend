import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPassword } from './entity/forgot-password.entity';
import {
  BCRYPT_SALT_ROUNDS,
  GOOGLE_PROVIDER_REJECTION_MESSAGE,
} from '../common/constants/auth.constants';

const RESET_TOKEN_TTL_MS = 20 * 60 * 1000; // 20 minutes
const FORGOT_PASSWORD_GENERIC_MESSAGE =
  'If that email is registered, a reset link has been sent.';
const INVALID_RESET_TOKEN_MESSAGE = 'Invalid or expired reset token.';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    @InjectRepository(ForgotPassword)
    private readonly forgotPasswordRepository: Repository<ForgotPassword>,
  ) {}

  generateToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userService.validateCredentials(
      dto.email,
      dto.password,
    );
    return this.generateToken(user);
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userService.findByEmail(dto.email);

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = this.hashToken(rawToken);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

      // Only the most recently requested token should ever be valid.
      await this.forgotPasswordRepository.delete({ userId: user.id });
      await this.forgotPasswordRepository.save(
        this.forgotPasswordRepository.create({
          userId: user.id,
          tokenHash,
          expiresAt,
        }),
      );

      // Email delivery is future work — print to console for now.
      this.logger.log(`Password reset token for ${user.email}: ${rawToken}`);
    }

    // Always return the same message, found or not, to prevent email enumeration.
    return { message: FORGOT_PASSWORD_GENERIC_MESSAGE };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const tokenHash = this.hashToken(dto.token);
    const record = await this.forgotPasswordRepository.findOne({
      where: { tokenHash },
    });

    if (!record) {
      throw new BadRequestException(INVALID_RESET_TOKEN_MESSAGE);
    }

    if (record.expiresAt < new Date()) {
      await this.forgotPasswordRepository.delete({ id: record.id });
      throw new BadRequestException(INVALID_RESET_TOKEN_MESSAGE);
    }

    const user = await this.userService.findById(record.userId);
    if (!user) {
      await this.forgotPasswordRepository.delete({ id: record.id });
      throw new BadRequestException(INVALID_RESET_TOKEN_MESSAGE);
    }

    if (user.provider === 'google') {
      await this.forgotPasswordRepository.delete({ id: record.id });
      throw new BadRequestException(GOOGLE_PROVIDER_REJECTION_MESSAGE);
    }

    const hashedPassword = await bcrypt.hash(
      dto.newPassword,
      BCRYPT_SALT_ROUNDS,
    );
    await this.userService.updatePassword(user.id, hashedPassword);
    await this.forgotPasswordRepository.delete({ id: record.id });

    return {
      message:
        'Password has been reset successfully. Please log in with your new password.',
    };
  }
}
