import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { CreateUserDto } from './dto/create-yser-dto';
import { Role } from '../common/enums/role.enum';
import {
  BCRYPT_SALT_ROUNDS,
  GOOGLE_PROVIDER_REJECTION_MESSAGE,
} from '../common/constants/auth.constants';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // create user
  async Create(createUserDto: CreateUserDto): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered.');
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      BCRYPT_SALT_ROUNDS,
    );

    const newUser = this.userRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password: hashedPassword,
      role: Role.USER,
    });
    const savedUser = await this.userRepository.save(newUser);

    delete (savedUser as Partial<User>).password;
    return savedUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        name: true,
        provider: true,
      },
    });
  }

  async validateCredentials(email: string, password: string): Promise<User> {
    const invalidCredentialsMessage = 'Invalid email or password.';
    const user = await this.findByEmailWithPassword(email);

    if (!user) {
      throw new UnauthorizedException(invalidCredentialsMessage);
    }

    if (user.provider === 'google' && !user.password) {
      throw new UnauthorizedException(GOOGLE_PROVIDER_REJECTION_MESSAGE);
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      throw new UnauthorizedException(invalidCredentialsMessage);
    }

    delete (user as Partial<User>).password;
    return user;
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.userRepository.update(userId, { password: hashedPassword });
  }
}
