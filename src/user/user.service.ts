import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-yser-dto';

@Injectable()
export class UserService {
              constructor(
                            @InjectRepository(User)
                            private readonly userRepository: Repository<User>,
              ) { }

              // create user 
              async Create(CreateUserDto: CreateUserDto): Promise<User> {
                            const newUser = this.userRepository.create(CreateUserDto);
                            return await this.userRepository.save(newUser);
              }
}
