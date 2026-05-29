import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductStatus } from '../products/enums/product-status.enum';
import { Product } from '../products/entity/product.entity';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartItem } from './entity/cart-item.entity';
import { Cart } from './entity/cart.entity';

const MAX_CART_ITEMS = 10;

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async getCart(userId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    return this.loadCartWithItems(cart.id);
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<Cart> {
    const product = await this.findActiveProduct(dto.productId);

    if (product.stock < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}`,
      );
    }

    const cart = await this.getOrCreateCart(userId);

    const existing = await this.cartItemRepository.findOne({
      where: { cartId: cart.id, productId: dto.productId },
    });

    if (existing) {
      const newQty = existing.quantity + dto.quantity;
      if (newQty > product.stock) {
        throw new BadRequestException(
          `Cannot add ${dto.quantity} more. Available stock: ${product.stock}, already in cart: ${existing.quantity}`,
        );
      }
      existing.quantity = newQty;
      await this.cartItemRepository.save(existing);
      this.logger.log(`Cart item quantity updated: ${existing.id}`);
    } else {
      const itemCount = await this.cartItemRepository.count({
        where: { cartId: cart.id },
      });

      if (itemCount >= MAX_CART_ITEMS) {
        throw new BadRequestException(
          `Cart limit reached. Maximum ${MAX_CART_ITEMS} unique products allowed.`,
        );
      }

      const item = this.cartItemRepository.create({
        cartId: cart.id,
        productId: dto.productId,
        quantity: dto.quantity,
      });
      await this.cartItemRepository.save(item);
      this.logger.log(
        `Cart item added: product ${dto.productId} to cart ${cart.id}`,
      );
    }

    return this.loadCartWithItems(cart.id);
  }

  async updateItemQuantity(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<Cart> {
    const item = await this.findItemAndVerifyOwnership(itemId, userId);
    const product = await this.findActiveProduct(item.productId);

    if (dto.quantity > product.stock) {
      throw new BadRequestException(
        `Quantity exceeds available stock. Available: ${product.stock}`,
      );
    }

    item.quantity = dto.quantity;
    await this.cartItemRepository.save(item);
    this.logger.log(`Cart item ${itemId} quantity updated to ${dto.quantity}`);

    return this.loadCartWithItems(item.cartId);
  }

  async removeItem(userId: string, itemId: string): Promise<Cart> {
    const item = await this.findItemAndVerifyOwnership(itemId, userId);
    const cartId = item.cartId;
    await this.cartItemRepository.delete(item.id);
    this.logger.log(`Cart item ${itemId} removed`);
    return this.loadCartWithItems(cartId);
  }

  async clearCart(userId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(userId);
    await this.cartItemRepository.delete({ cartId: cart.id });
    this.logger.log(`Cart ${cart.id} cleared for user ${userId}`);
    return this.loadCartWithItems(cart.id);
  }

  private async getOrCreateCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({ where: { userId } });
    if (!cart) {
      cart = this.cartRepository.create({ userId });
      cart = await this.cartRepository.save(cart);
      this.logger.log(`Cart created for user ${userId}`);
    }
    return cart;
  }

  private async loadCartWithItems(cartId: string): Promise<Cart> {
    return this.cartRepository.findOne({
      where: { id: cartId },
      relations: { items: { product: true } },
    }) as Promise<Cart>;
  }

  private async findActiveProduct(productId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${productId}" not found.`);
    }

    if (!product.isActive || product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException(
        `Product "${product.title}" is not available for purchase.`,
      );
    }

    return product;
  }

  private async findItemAndVerifyOwnership(
    itemId: string,
    userId: string,
  ): Promise<CartItem> {
    const item = await this.cartItemRepository.findOne({
      where: { id: itemId },
      relations: { cart: true },
    });

    if (!item) {
      throw new NotFoundException(`Cart item with ID "${itemId}" not found.`);
    }

    if (item.cart.userId !== userId) {
      throw new ForbiddenException('You do not have access to this cart item.');
    }

    return item;
  }
}
