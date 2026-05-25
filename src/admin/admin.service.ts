import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entity/user.entity';
import { Role } from '../common/enums/role.enum';
import { PaginationDto } from '../common/dto/pagination.dto';

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  googleUsers: number;
  emailPasswordUsers: number;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getAllUsers(paginationDto: PaginationDto): Promise<PaginatedUsers> {
    const { page, limit, skip } = paginationDto;

    const [data, total] = await this.userRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats(): Promise<AdminStats> {
    const [totalUsers, totalAdmins, googleUsers, emailPasswordUsers] =
      await Promise.all([
        this.userRepository.count(),
        this.userRepository.count({ where: { role: Role.ADMIN } }),
        this.userRepository.count({ where: { provider: 'google' } }),
        this.userRepository.count({ where: { provider: 'local' } }),
      ]);

    return {
      totalUsers,
      totalAdmins,
      googleUsers,
      emailPasswordUsers,
    };
  }
}
