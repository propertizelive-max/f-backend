import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.USER)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // ─── Get Cart ─────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get my cart with all items and totals' })
  @ApiResponse({ status: 200, description: 'Cart retrieved', type: CartResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — USER role required' })
  async getCart(@CurrentUser('id') userId: string): Promise<CartResponseDto> {
    const cart = await this.cartService.getCart(userId);
    return CartResponseDto.from(cart);
  }

  // ─── Add Item ─────────────────────────────────────────────────────────────

  @Post('items')
  @ApiOperation({ summary: 'Add a product to cart (increments quantity if already present)' })
  @ApiResponse({ status: 201, description: 'Item added, updated cart returned', type: CartResponseDto })
  @ApiResponse({ status: 400, description: 'Product unavailable, insufficient stock, or cart limit reached' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — USER role required' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async addItem(
    @CurrentUser('id') userId: string,
    @Body() dto: AddCartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.cartService.addItem(userId, dto);
    return CartResponseDto.from(cart);
  }

  // ─── Update Item Quantity ─────────────────────────────────────────────────

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update quantity of a cart item' })
  @ApiResponse({ status: 200, description: 'Quantity updated, updated cart returned', type: CartResponseDto })
  @ApiResponse({ status: 400, description: 'Quantity exceeds available stock' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — not your cart item' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async updateItem(
    @CurrentUser('id') userId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.cartService.updateItemQuantity(userId, itemId, dto);
    return CartResponseDto.from(cart);
  }

  // ─── Remove Item ──────────────────────────────────────────────────────────

  @Delete('items/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a specific item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed, updated cart returned', type: CartResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — not your cart item' })
  @ApiResponse({ status: 404, description: 'Cart item not found' })
  async removeItem(
    @CurrentUser('id') userId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<CartResponseDto> {
    const cart = await this.cartService.removeItem(userId, itemId);
    return CartResponseDto.from(cart);
  }

  // ─── Clear Cart ───────────────────────────────────────────────────────────

  @Delete('clear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove all items from cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared', type: CartResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — USER role required' })
  async clearCart(@CurrentUser('id') userId: string): Promise<CartResponseDto> {
    const cart = await this.cartService.clearCart(userId);
    return CartResponseDto.from(cart);
  }
}
