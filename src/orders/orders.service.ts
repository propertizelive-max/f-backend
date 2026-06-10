import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CartService } from '../cart/cart.service';
import { CartItem } from '../cart/entity/cart-item.entity';
import { Product } from '../products/entity/product.entity';
import { ProductStatus } from '../products/enums/product-status.enum';
import { Role } from '../common/enums/role.enum';
import { Order } from './entity/order.entity';
import { OrderItem } from './entity/order-item.entity';
import { CheckoutDto } from './dto/checkout.dto';
import { OrderStatus } from './enums/order-status.enum';
import { PaymentStatus } from './enums/payment-status.enum';

const CANCELLABLE_STATUSES = [OrderStatus.PENDING, OrderStatus.PROCESSING];

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly deliveryCharge: number;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly cartService: CartService,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.deliveryCharge = this.configService.get<number>('DELIVERY_CHARGE', 99);
  }

  async checkout(
    userId: string,
    email: string,
    dto: CheckoutDto,
  ): Promise<Order> {
    const cart = await this.cartService.getCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException(
        'Your cart is empty. Add items before checking out.',
      );
    }

    for (const item of cart.items) {
      const product = item.product;

      if (!product) {
        throw new BadRequestException(
          'One or more cart items reference a deleted product.',
        );
      }

      if (!product.isActive || product.status !== ProductStatus.ACTIVE) {
        throw new BadRequestException(
          `Product "${product.title}" is no longer available for purchase.`,
        );
      }

      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.title}". Available: ${product.stock}, Requested: ${item.quantity}.`,
        );
      }
    }

    let productAmount = 0;
    for (const item of cart.items) {
      const unitPrice = item.product.discountPrice ?? item.product.price;
      productAmount += unitPrice * item.quantity;
    }
    const totalAmount = productAmount + this.deliveryCharge;

    const productIds = cart.items.map((i) => i.productId);
    const fullProducts = await this.productRepository.find({
      where: { id: In(productIds) },
      relations: { images: true, category: true },
      order: { images: { sortOrder: 'ASC' } },
    });
    const productMap = new Map(fullProducts.map((p) => [p.id, p]));

    const order = await this.dataSource.transaction(async (manager) => {
      const savedOrder = await manager.getRepository(Order).save(
        manager.getRepository(Order).create({
          userId,
          email,
          fullName: dto.fullName,
          phoneNumber: dto.phoneNumber,
          shippingAddress: dto.shippingAddress,
          city: dto.city,
          state: dto.state,
          zipCode: dto.zipCode,
          gstin: dto.gstin ?? null,
          paymentMethod: dto.paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          orderStatus: OrderStatus.PENDING,
          productAmount,
          deliveryCharge: this.deliveryCharge,
          totalAmount,
        }),
      );

      const orderItems = cart.items.map((item) => {
        const unitPrice = item.product.discountPrice ?? item.product.price;
        const full = productMap.get(item.productId);
        return manager.getRepository(OrderItem).create({
          orderId: savedOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: unitPrice,
          totalPrice: unitPrice * item.quantity,
          productTitle: full?.title ?? item.product.title,
          productImage: full?.images?.[0]?.imageUrl ?? null,
          productSku: full?.sku ?? null,
          productColor: full?.color ?? null,
          productCategoryName: full?.category?.name ?? null,
        });
      });
      await manager.getRepository(OrderItem).save(orderItems);

      for (const item of cart.items) {
        await manager
          .getRepository(Product)
          .decrement({ id: item.productId }, 'stock', item.quantity);
      }

      await manager.getRepository(CartItem).delete({ cartId: cart.id });

      return savedOrder;
    });

    this.logger.log(`Order ${order.id} created for user ${userId}`);

    return this.orderRepository.findOne({
      where: { id: order.id },
      relations: { items: { product: true } },
    }) as Promise<Order>;
  }

  async getMyOrders(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId },
      relations: { items: { product: true } },
      order: { createdAt: 'DESC' },
    });
  }

  async getOrderById(
    orderId: string,
    userId: string,
    userRole: Role,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { items: { product: true } },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found.`);
    }

    if (userRole === Role.USER && order.userId !== userId) {
      throw new ForbiddenException('You do not have access to this order.');
    }

    return order;
  }

  async cancelOrder(
    orderId: string,
    userId: string,
    reason: string,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: { items: { product: true } },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found.`);
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('You do not have access to this order.');
    }
    if (!CANCELLABLE_STATUSES.includes(order.orderStatus)) {
      throw new BadRequestException(
        `Order cannot be cancelled in "${order.orderStatus}" status.`,
      );
    }

    await this.dataSource.transaction(async (manager) => {
      order.orderStatus = OrderStatus.CANCELLED;
      order.cancelReason = reason;
      order.cancelledAt = new Date();
      order.cancelledBy = userId;
      await manager.getRepository(Order).save(order);

      for (const item of order.items) {
        await manager
          .getRepository(Product)
          .increment({ id: item.productId }, 'stock', item.quantity);
      }
    });

    this.logger.log(`Order ${orderId} cancelled by user ${userId}`);

    return this.orderRepository.findOne({
      where: { id: orderId },
      relations: { items: { product: true } },
    }) as Promise<Order>;
  }

  // Hook for future payment integration — called by PaymentModule webhook handler
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: PaymentStatus,
    orderStatus: OrderStatus,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID "${orderId}" not found.`);
    }

    order.paymentStatus = paymentStatus;
    order.orderStatus = orderStatus;
    await this.orderRepository.save(order);

    this.logger.log(
      `Order ${orderId} updated — paymentStatus: ${paymentStatus}, orderStatus: ${orderStatus}`,
    );

    return order;
  }
}
