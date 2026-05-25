import { CreateUserDto } from './dto/create-yser-dto';
import { UserService } from './user.service';
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('user')
export class UserController {
              constructor(private readonly UserService: UserService) { }

              @Post('signin')
              async createUser(@Body() createUserDto: CreateUserDto) {
                            await this.UserService.Create(createUserDto);
                            return { Message: "User Created Successfully" }
              }

              @UseGuards(AuthGuard('jwt'))
              @Get('profile')
              getProfile(@Req() req: any) {

                            return req.user;
              }
}
