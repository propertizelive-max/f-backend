import { CreateUserDto } from './dto/create-yser-dto';
import { UserService } from './user.service';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly UserService: UserService) {}

  // NOTE: despite the route name, this is registration, not sign-in.
  // See AuthController.login for actual sign-in.
  @Post('signin')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async createUser(@Body() createUserDto: CreateUserDto) {
    await this.UserService.Create(createUserDto);
    return { Message: 'User Created Successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: any) {
    return req.user;
  }
}
