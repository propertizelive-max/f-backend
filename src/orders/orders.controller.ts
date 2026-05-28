import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { OrderResponseDto } from './dto/order-response.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ─── Checkout ─────────────────────────────────────────────────────────────

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Checkout — create an order from cart items' })
  @ApiResponse({ status: 201, description: 'Order created', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Empty cart, insufficient stock, or unavailable product' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — USER role required' })
  async checkout(
    @CurrentUser('id') userId: string,
    @CurrentUser('email') email: string,
    @Body() dto: CheckoutDto,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.checkout(userId, email, dto);
    return OrderResponseDto.from(order);
  }

  // ─── Get My Orders ────────────────────────────────────────────────────────

  @Get('my-orders')
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Get all orders for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Orders retrieved', type: [OrderResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — USER role required' })
  async getMyOrders(
    @CurrentUser('id') userId: string,
  ): Promise<OrderResponseDto[]> {
    const orders = await this.ordersService.getMyOrders(userId);
    return orders.map(OrderResponseDto.from);
  }

  // ─── Get Order By ID ──────────────────────────────────────────────────────

  @Get(':id')
  @Roles(Role.USER, Role.ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Get a specific order by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved', type: OrderResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — cannot access another user\'s order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersService.getOrderById(id, userId, userRole);
    return OrderResponseDto.from(order);
  }
}
