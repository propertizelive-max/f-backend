import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Order } from '../../orders/entity/order.entity';
import { OrderStatus } from '../../orders/enums/order-status.enum';
import { PaymentMethod } from '../../orders/enums/payment-method.enum';
import { PaymentStatus } from '../../orders/enums/payment-status.enum';

export class AdminOrderItemDto {
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

export class AdminOrderUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}

export class AdminOrderDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: OrderStatus })
  orderStatus: OrderStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ nullable: true, type: String })
  cancelReason: string | null;

  @ApiPropertyOptional({ nullable: true, type: Date })
  cancelledAt: Date | null;

  @ApiProperty({ type: AdminOrderUserDto })
  user: AdminOrderUserDto;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  shippingAddress: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  zipCode: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  gstin: string | null;

  @ApiProperty({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @ApiProperty()
  productAmount: number;

  @ApiProperty()
  deliveryCharge: number;

  @ApiProperty()
  totalAmount: number;

  @ApiProperty()
  totalItems: number;

  @ApiProperty({ type: [AdminOrderItemDto] })
  items: AdminOrderItemDto[];

  static from(order: Order): AdminOrderDetailDto {
    const dto = new AdminOrderDetailDto();
    dto.id = order.id;
    dto.orderStatus = order.orderStatus;
    dto.createdAt = order.createdAt;
    dto.updatedAt = order.updatedAt;
    dto.cancelReason = order.cancelReason ?? null;
    dto.cancelledAt = order.cancelledAt ?? null;

    dto.user = {
      id: order.user?.id ?? '',
      name: order.user?.name ?? '',
      email: order.user?.email ?? '',
    };

    dto.fullName = order.fullName;
    dto.phoneNumber = order.phoneNumber;
    dto.shippingAddress = order.shippingAddress;
    dto.city = order.city;
    dto.state = order.state;
    dto.zipCode = order.zipCode;
    dto.gstin = order.gstin ?? null;

    dto.paymentMethod = order.paymentMethod;
    dto.paymentStatus = order.paymentStatus;
    dto.productAmount = order.productAmount;
    dto.deliveryCharge = order.deliveryCharge;
    dto.totalAmount = order.totalAmount;

    dto.totalItems = order.items?.length ?? 0;
    dto.items = (order.items ?? []).map((item) => ({
      productId: item.productId,
      productTitle: item.productTitle ?? item.product?.title ?? '[Product Deleted]',
      productImage: item.productImage ?? null,
      productSku: item.productSku ?? null,
      productColor: item.productColor ?? item.product?.color ?? null,
      productCategoryName: item.productCategoryName ?? item.product?.category?.name ?? null,
      quantity: item.quantity,
      unitPrice: item.price,
      totalPrice: item.totalPrice,
    }));

    return dto;
  }
}
