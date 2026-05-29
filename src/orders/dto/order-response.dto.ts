import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Order } from '../entity/order.entity';
import { OrderItem } from '../entity/order-item.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PaymentMethod } from '../enums/payment-method.enum';

export class OrderItemResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() productId: string;
  @ApiProperty() productTitle: string;
  @ApiProperty() quantity: number;
  @ApiProperty() price: number;
  @ApiProperty() totalPrice: number;

  static from(item: OrderItem): OrderItemResponseDto {
    const dto = new OrderItemResponseDto();
    dto.id = item.id;
    dto.productId = item.productId;
    dto.productTitle = item.product?.title ?? '';
    dto.quantity = item.quantity;
    dto.price = item.price;
    dto.totalPrice = item.totalPrice;
    return dto;
  }
}

export class OrderResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() fullName: string;
  @ApiProperty() email: string;
  @ApiProperty() phoneNumber: string;
  @ApiProperty() shippingAddress: string;
  @ApiProperty() city: string;
  @ApiProperty() state: string;
  @ApiProperty() zipCode: string;
  @ApiPropertyOptional() gstin: string | null;
  @ApiProperty({ enum: PaymentMethod }) paymentMethod: PaymentMethod;
  @ApiProperty({ enum: PaymentStatus }) paymentStatus: PaymentStatus;
  @ApiProperty({ enum: OrderStatus }) orderStatus: OrderStatus;
  @ApiProperty() productAmount: number;
  @ApiProperty() deliveryCharge: number;
  @ApiProperty() totalAmount: number;
  @ApiProperty({ type: [OrderItemResponseDto] }) items: OrderItemResponseDto[];
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;
  @ApiPropertyOptional() cancelReason: string | null;
  @ApiPropertyOptional() cancelledAt: Date | null;
  @ApiPropertyOptional() cancelledBy: string | null;

  static from(order: Order): OrderResponseDto {
    const dto = new OrderResponseDto();
    dto.id = order.id;
    dto.fullName = order.fullName;
    dto.email = order.email;
    dto.phoneNumber = order.phoneNumber;
    dto.shippingAddress = order.shippingAddress;
    dto.city = order.city;
    dto.state = order.state;
    dto.zipCode = order.zipCode;
    dto.gstin = order.gstin;
    dto.paymentMethod = order.paymentMethod;
    dto.paymentStatus = order.paymentStatus;
    dto.orderStatus = order.orderStatus;
    dto.productAmount = order.productAmount;
    dto.deliveryCharge = order.deliveryCharge;
    dto.totalAmount = order.totalAmount;
    dto.items = (order.items ?? []).map(OrderItemResponseDto.from);
    dto.createdAt = order.createdAt;
    dto.updatedAt = order.updatedAt;
    dto.cancelReason = order.cancelReason ?? null;
    dto.cancelledAt = order.cancelledAt ?? null;
    dto.cancelledBy = order.cancelledBy ?? null;
    return dto;
  }
}
