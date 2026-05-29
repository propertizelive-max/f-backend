import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { SalesFilterDto } from './dto/sales-filter.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard analytics (sales, orders, users)' })
  getDashboard() {
    return this.analyticsService.getDashboard();
  }

  @Get('sales')
  @ApiOperation({
    summary: 'Get sales analytics with optional date range filter',
  })
  getSalesAnalytics(@Query() dto: SalesFilterDto) {
    return this.analyticsService.getSalesAnalytics(dto);
  }

  @Get('products')
  @ApiOperation({
    summary: 'Get product analytics (best sellers, low/out of stock)',
  })
  getProductAnalytics() {
    return this.analyticsService.getProductAnalytics();
  }
}
