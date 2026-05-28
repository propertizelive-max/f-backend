import { IsEnum, IsNotEmpty } from 'class-validator';
import { OrderStatus } from '../../orders/enums/order-status.enum';

export class UpdateOrderStatusDto {
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  orderStatus: OrderStatus;
}
