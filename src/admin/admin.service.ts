import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/entity/user.entity';
import { Order } from '../orders/entity/order.entity';
import { Role } from '../common/enums/role.enum';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AdminOrderFilterDto } from './dto/admin-order-filter.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { OrderItemsResponseDto } from './dto/order-items-response.dto';
import { AdminOrderDetailDto } from './dto/admin-order-detail.dto';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

export interface PaginatedUsers {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  googleUsers: number;
  emailPasswordUsers: number;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async getAllUsers(paginationDto: PaginationDto): Promise<PaginatedUsers> {
    const { page, limit, skip } = paginationDto;

    const [data, total] = await this.userRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getStats(): Promise<AdminStats> {
    const [totalUsers, totalAdmins, googleUsers, emailPasswordUsers] =
      await Promise.all([
        this.userRepository.count(),
        this.userRepository.count({ where: { role: Role.ADMIN } }),
        this.userRepository.count({ where: { provider: 'google' } }),
        this.userRepository.count({ where: { provider: 'local' } }),
      ]);

    return {
      totalUsers,
      totalAdmins,
      googleUsers,
      emailPasswordUsers,
    };
  }

  async getAllOrders(filterDto: AdminOrderFilterDto) {
    const {
      page,
      limit,
      skip,
      search,
      orderStatus,
      paymentStatus,
      paymentMethod,
      userId,
      fromDate,
      toDate,
    } = filterDto;

    const qb = this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .orderBy('order.createdAt', 'DESC');

    if (orderStatus) {
      qb.andWhere('order.orderStatus = :orderStatus', { orderStatus });
    }
    if (paymentStatus) {
      qb.andWhere('order.paymentStatus = :paymentStatus', { paymentStatus });
    }
    if (paymentMethod) {
      qb.andWhere('order.paymentMethod = :paymentMethod', { paymentMethod });
    }
    if (userId) {
      qb.andWhere('order.userId = :userId', { userId });
    }
    if (fromDate) {
      qb.andWhere('order.createdAt >= :fromDate', {
        fromDate: new Date(fromDate),
      });
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      qb.andWhere('order.createdAt <= :toDate', { toDate: to });
    }
    if (search) {
      qb.andWhere(
        '(LOWER(order.id::text) LIKE :search OR LOWER(user.name) LIKE :search OR LOWER(order.phoneNumber) LIKE :search OR LOWER(order.gstin) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAdminOrderById(id: string): Promise<AdminOrderDetailDto> {
    const order = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .where('order.id = :id', { id })
      .withDeleted()
      .getOne();

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    return AdminOrderDetailDto.from(order);
  }

  async getOrderItems(orderId: string): Promise<OrderItemsResponseDto> {
    const order = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .where('order.id = :orderId', { orderId })
      .withDeleted()
      .getOne();

    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }

    if (!order.items.length) {
      throw new NotFoundException(`No items found for this order`);
    }

    return {
      orderId: order.id,
      totalItems: order.items.length,
      items: order.items.map((item) => ({
        productId: item.productId,
        productTitle: item.productTitle ?? item.product?.title ?? '[Product Deleted]',
        productImage: item.productImage ?? null,
        productSku: item.productSku ?? null,
        productColor: item.productColor ?? item.product?.color ?? null,
        productCategoryName: item.productCategoryName ?? item.product?.category?.name ?? null,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.totalPrice,
      })),
    };
  }

  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.orderRepository.findOne({ where: { id } });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    const allowed = ALLOWED_TRANSITIONS[order.orderStatus];
    if (!allowed.includes(dto.orderStatus)) {
      throw new BadRequestException(
        `Cannot transition order from ${order.orderStatus} to ${dto.orderStatus}`,
      );
    }

    order.orderStatus = dto.orderStatus;
    return this.orderRepository.save(order);
  }
}
