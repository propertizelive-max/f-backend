import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type, plainToInstance } from 'class-transformer';
import { ProductStatus } from '../../products/enums/product-status.enum';
import { CartItem } from '../entity/cart-item.entity';

@Exclude()
export class CartItemProductDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  slug: string;

  @ApiProperty()
  @Expose()
  price: number;

  @ApiPropertyOptional({ nullable: true })
  @Expose()
  discountPrice: number | null;

  @ApiProperty({ type: [String] })
  @Expose()
  imageUrls: string[];

  @ApiProperty()
  @Expose()
  stock: number;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty({ enum: ProductStatus })
  @Expose()
  status: ProductStatus;
}

@Exclude()
export class CartItemResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  cartId: string;

  @ApiProperty()
  @Expose()
  productId: string;

  @ApiProperty()
  @Expose()
  quantity: number;

  @ApiPropertyOptional({ type: () => CartItemProductDto, nullable: true })
  @Expose()
  @Type(() => CartItemProductDto)
  product: CartItemProductDto | null;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  static from(item: CartItem): CartItemResponseDto {
    return plainToInstance(CartItemResponseDto, item, {
      excludeExtraneousValues: true,
    });
  }

  static fromMany(items: CartItem[]): CartItemResponseDto[] {
    return items.map((i) => CartItemResponseDto.from(i));
  }
}
