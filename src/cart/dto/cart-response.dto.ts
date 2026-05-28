import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type, plainToInstance } from 'class-transformer';
import { Cart } from '../entity/cart.entity';
import { CartItemResponseDto } from './cart-item-response.dto';

@Exclude()
export class CartResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  userId: string;

  @ApiProperty({ type: () => [CartItemResponseDto] })
  @Expose()
  @Type(() => CartItemResponseDto)
  items: CartItemResponseDto[];

  @ApiProperty({ description: 'Total number of individual units across all items' })
  @Expose()
  totalItems: number;

  @ApiProperty({ description: 'Total price (uses discountPrice when available)' })
  @Expose()
  totalPrice: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  static from(cart: Cart): CartResponseDto {
    const dto = plainToInstance(CartResponseDto, cart, {
      excludeExtraneousValues: true,
    });

    const items = cart.items ?? [];
    dto.items = CartItemResponseDto.fromMany(items);
    dto.totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    dto.totalPrice = items.reduce((sum, i) => {
      const unitPrice = i.product?.discountPrice ?? i.product?.price ?? 0;
      return sum + unitPrice * i.quantity;
    }, 0);

    return dto;
  }
}
