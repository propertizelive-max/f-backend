import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entity/user.entity';
import { Order } from '../orders/entity/order.entity';
import { OrderItem } from '../orders/entity/order-item.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Order, OrderItem])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
