import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../../products/entity/product.entity';
import { Order } from './order.entity';

const decimalTransformer = {
  to: (v: number) => v,
  from: (v: string) => parseFloat(v),
};

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => Order, (order) => order.items, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ type: 'varchar', length: 200, nullable: true })
  productTitle!: string | null;

  @Column({ type: 'text', nullable: true })
  productImage!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  productSku!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  productColor!: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  productCategoryName!: string | null;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  price!: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  totalPrice!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
