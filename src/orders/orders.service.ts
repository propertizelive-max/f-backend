import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
    }

    const purchasableStatuses = [ProductStatus.PUBLISHED, ProductStatus.ACTIVE];
    const sortedItems = [...cart.items].sort((a, b) =>
      a.productId.localeCompare(b.productId),
    );

    const order = await this.dataSource.transaction(async (manager) => {
      let productAmount = 0;
      const lockedProductMap = new Map<string, Product>();

      for (const item of sortedItems) {
        const lockedProduct = await manager
          .getRepository(Product)
          .createQueryBuilder('product')
          .setLock('pessimistic_write')
          .leftJoinAndSelect('product.images', 'images')
          .leftJoinAndSelect('product.category', 'category')
          .where('product.id = :id', { id: item.productId })
          .orderBy('images.sortOrder', 'ASC')
          .getOne();

        if (!lockedProduct) {
          throw new ConflictException(
            'One or more cart items reference a deleted product.',
          );
        }

        if (
          !lockedProduct.isActive ||
          !purchasableStatuses.includes(lockedProduct.status)
        ) {
          throw new ConflictException(
            `Product "${lockedProduct.title}" is no longer available for purchase.`,
          );
        }

        if (lockedProduct.stock < item.quantity) {
          throw new ConflictException(
            `Insufficient stock for "${lockedProduct.title}". Available: ${lockedProduct.stock}, Requested: ${item.quantity}.`,
          );
        }

        const unitPrice = lockedProduct.discountPrice ?? lockedProduct.price;
        productAmount += unitPrice * item.quantity;
        lockedProductMap.set(item.productId, lockedProduct);
      }

      const totalAmount = productAmount + this.deliveryCharge;

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

      const orderItems = sortedItems.map((item) => {
        const lockedProduct = lockedProductMap.get(item.productId)!;
        const unitPrice = lockedProduct.discountPrice ?? lockedProduct.price;
        return manager.getRepository(OrderItem).create({
          orderId: savedOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: unitPrice,
          totalPrice: unitPrice * item.quantity,
          productTitle: lockedProduct.title,
          productImage: lockedProduct.images?.[0]?.imageUrl ?? null,
          productSku: lockedProduct.sku,
          productColor: lockedProduct.color,
          productCategoryName: lockedProduct.category?.name ?? null,
        });
      });
      await manager.getRepository(OrderItem).save(orderItems);

      for (const item of sortedItems) {
        const lockedProduct = lockedProductMap.get(item.productId)!;
        lockedProduct.stock -= item.quantity;
        await manager.getRepository(Product).save(lockedProduct);
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
