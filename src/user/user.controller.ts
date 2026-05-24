import { CreateUserDto } from './dto/create-yser-dto';
import { UserService } from './user.service';
import { Body, Controller, Post } from '@nestjs/common';

@Controller('user')
export class UserController {
              constructor(private readonly UserService: UserService) { }

              @Post('signin')
              async createUser(@Body() createUserDto: CreateUserDto) {
                            await this.UserService.Create(createUserDto);
                            return { Message: "User Created Successfully" }
              }
}
