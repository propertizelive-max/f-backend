import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Order } from '../orders/entity/order.entity';
import { OrderItem } from '../orders/entity/order-item.entity';
import { User } from '../user/entity/user.entity';
import { Product } from '../products/entity/product.entity';
import { PaymentStatus } from '../orders/enums/payment-status.enum';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { SalesFilterDto } from './dto/sales-filter.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getDashboard() {
    const [
      totalRevenueRow,
      todayRevenueRow,
      monthlyRevenueRow,
      orderStatusCounts,
      totalUsers,
      newUsers,
      activeUsersRow,
      repeatCustomersRow,
    ] = await Promise.all([
      this.orderRepository
        .createQueryBuilder('o')
        .select('COALESCE(SUM(o.totalAmount), 0)', 'value')
        .where('o.paymentStatus = :paid', { paid: PaymentStatus.PAID })
        .andWhere('o.orderStatus != :cancelled', {
          cancelled: OrderStatus.CANCELLED,
        })
        .getRawOne<{ value: string }>(),

      this.orderRepository
        .createQueryBuilder('o')
        .select('COALESCE(SUM(o.totalAmount), 0)', 'value')
        .where('o.paymentStatus = :paid', { paid: PaymentStatus.PAID })
        .andWhere('o.orderStatus != :cancelled', {
          cancelled: OrderStatus.CANCELLED,
        })
        .andWhere('DATE(o.createdAt) = CURRENT_DATE')
        .getRawOne<{ value: string }>(),

      this.orderRepository
        .createQueryBuilder('o')
        .select('COALESCE(SUM(o.totalAmount), 0)', 'value')
        .where('o.paymentStatus = :paid', { paid: PaymentStatus.PAID })
        .andWhere('o.orderStatus != :cancelled', {
          cancelled: OrderStatus.CANCELLED,
        })
        .andWhere(
          "DATE_TRUNC('month', o.createdAt) = DATE_TRUNC('month', NOW())",
        )
        .getRawOne<{ value: string }>(),

      this.orderRepository
        .createQueryBuilder('o')
        .select('o.orderStatus', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('o.orderStatus')
        .getRawMany<{ status: string; count: string }>(),

      this.userRepository.count(),

      this.userRepository
        .createQueryBuilder('u')
        .where("u.createdAt >= NOW() - INTERVAL '30 days'")
        .getCount(),

      this.orderRepository
        .createQueryBuilder('o')
        .select('COUNT(DISTINCT o.userId)', 'value')
        .where("o.createdAt >= NOW() - INTERVAL '30 days'")
        .getRawOne<{ value: string }>(),

      this.orderRepository
        .createQueryBuilder('o')
        .select('COUNT(*)', 'value')
        .from(
          (sub) =>
            sub
              .select('o2.userId')
              .from(Order, 'o2')
              .where('o2.paymentStatus = :paid', { paid: PaymentStatus.PAID })
              .andWhere('o2.orderStatus != :cancelled', {
                cancelled: OrderStatus.CANCELLED,
              })
              .groupBy('o2.userId')
              .having('COUNT(*) >= 2'),
          'repeat_buyers',
        )
        .getRawOne<{ value: string }>(),
    ]);

    const [totalOrdersCount, avgOrderValueRow] = await Promise.all([
      this.orderRepository.count(),
      this.orderRepository
        .createQueryBuilder('o')
        .select('COALESCE(AVG(o.totalAmount), 0)', 'value')
        .where('o.paymentStatus = :paid', { paid: PaymentStatus.PAID })
        .andWhere('o.orderStatus != :cancelled', {
          cancelled: OrderStatus.CANCELLED,
        })
        .getRawOne<{ value: string }>(),
    ]);

    const statusMap = Object.values(OrderStatus).reduce<Record<string, number>>(
      (acc, s) => ({ ...acc, [s]: 0 }),
      {},
    );
    for (const row of orderStatusCounts) {
      statusMap[row.status] = parseInt(row.count, 10);
    }

    return {
      sales: {
        totalRevenue: parseFloat(totalRevenueRow?.value ?? '0'),
        todayRevenue: parseFloat(todayRevenueRow?.value ?? '0'),
        monthlyRevenue: parseFloat(monthlyRevenueRow?.value ?? '0'),
        totalOrders: totalOrdersCount,
        averageOrderValue: parseFloat(avgOrderValueRow?.value ?? '0'),
      },
      orders: {
        pending: statusMap[OrderStatus.PENDING],
        processing: statusMap[OrderStatus.PROCESSING],
        shipped: statusMap[OrderStatus.SHIPPED],
        delivered: statusMap[OrderStatus.DELIVERED],
        cancelled: statusMap[OrderStatus.CANCELLED],
      },
      users: {
        totalUsers,
        newUsers,
        activeUsers: parseInt(activeUsersRow?.value ?? '0', 10),
        repeatCustomers: parseInt(repeatCustomersRow?.value ?? '0', 10),
      },
    };
  }

  async getSalesAnalytics(dto: SalesFilterDto) {
    const { fromDate, toDate, range } = dto;

    const qb = this.orderRepository
      .createQueryBuilder('o')
      .select('DATE(o.createdAt)', 'date')
      .addSelect('COALESCE(SUM(o.totalAmount), 0)', 'revenue')
      .addSelect('COUNT(*)', 'orderCount')
      .addSelect('COALESCE(AVG(o.totalAmount), 0)', 'avgOrderValue')
      .where('o.paymentStatus = :paid', { paid: PaymentStatus.PAID })
      .andWhere('o.orderStatus != :cancelled', {
        cancelled: OrderStatus.CANCELLED,
      })
      .groupBy('DATE(o.createdAt)')
      .orderBy('DATE(o.createdAt)', 'ASC');

    if (fromDate && toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      qb.andWhere('o.createdAt BETWEEN :from AND :to', {
        from: new Date(fromDate),
        to,
      });
    } else if (range === 'weekly') {
      qb.andWhere("o.createdAt >= NOW() - INTERVAL '7 days'");
    } else if (range === 'monthly') {
      qb.andWhere("o.createdAt >= NOW() - INTERVAL '30 days'");
    } else if (range === 'daily') {
      qb.andWhere('DATE(o.createdAt) = CURRENT_DATE');
    }

    const trend = await qb.getRawMany<{
      date: string;
      revenue: string;
      orderCount: string;
      avgOrderValue: string;
    }>();

    const totalSales = trend.reduce((sum, r) => sum + parseFloat(r.revenue), 0);

    return {
      revenueTrend: trend.map((r) => ({
        date: r.date,
        revenue: parseFloat(r.revenue),
        orderCount: parseInt(r.orderCount, 10),
        averageOrderValue: parseFloat(r.avgOrderValue),
      })),
      totalSales,
    };
  }

  async getProductAnalytics() {
    const [bestSellingProducts, lowStockProducts, outOfStockProducts] =
      await Promise.all([
        this.orderItemRepository
          .createQueryBuilder('oi')
          .select('oi.productId', 'productId')
          .addSelect('p.title', 'title')
          .addSelect('SUM(oi.quantity)', 'totalSold')
          .addSelect('SUM(oi.totalPrice)', 'revenue')
          .innerJoin('oi.product', 'p')
          .innerJoin('oi.order', 'o')
          .where('o.paymentStatus = :paid', { paid: PaymentStatus.PAID })
          .andWhere('o.orderStatus != :cancelled', {
            cancelled: OrderStatus.CANCELLED,
          })
          .groupBy('oi.productId')
          .addGroupBy('p.title')
          .orderBy('SUM(oi.quantity)', 'DESC')
          .limit(10)
          .getRawMany<{
            productId: string;
            title: string;
            totalSold: string;
            revenue: string;
          }>(),

        this.productRepository.find({ where: { stock: Between(1, 5) } }),

        this.productRepository.find({ where: { stock: 0 } }),
      ]);

    return {
      bestSellingProducts: bestSellingProducts.map((r) => ({
        productId: r.productId,
        title: r.title,
        totalSold: parseInt(r.totalSold, 10),
        revenue: parseFloat(r.revenue),
      })),
      lowStockProducts,
      outOfStockProducts,
    };
  }
}
