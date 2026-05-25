import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { PaginationDto } from '../common/dto/pagination.dto';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { JwtUser } from '../common/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('dashboard')
  getDashboard(@CurrentUser() user: JwtUser) {
    return {
      message: 'Welcome Admin',
      admin: user,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('users')
  getAllUsers(@Query() paginationDto: PaginationDto) {
    return this.adminService.getAllUsers(paginationDto);
  }

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }
}
