import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemDetailDto {
  @ApiProperty()
  productId: string;

  @ApiProperty()
  productTitle: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  productImage: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  productSku: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  productColor: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  productCategoryName: string | null;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  unitPrice: number;

  @ApiProperty()
  totalPrice: number;
}

export class OrderItemsResponseDto {
  @ApiProperty()
  orderId: string;

  @ApiProperty()
  totalItems: number;

  @ApiProperty({ type: [OrderItemDetailDto] })
  items: OrderItemDetailDto[];
}
