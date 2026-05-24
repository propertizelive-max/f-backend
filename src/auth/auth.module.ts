import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleStrategy } from './google.strategy';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
@Module({
              imports: [ConfigModule, TypeOrmModule.forFeature([User]),],
              controllers: [AuthController],
              providers: [AuthService, GoogleStrategy]
})
export class AuthModule { }
