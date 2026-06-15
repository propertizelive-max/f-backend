import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { User } from './user/entity/user.entity';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { MediaModule } from './media/media.module';
import { Media } from './media/entity/media.entity';
import { CategoriesModule } from './categories/categories.module';
import { Category } from './categories/entity/category.entity';
import { ProductsModule } from './products/products.module';
import { Product } from './products/entity/product.entity';
import { ProductImage } from './products/entity/product-image.entity';
import { CartModule } from './cart/cart.module';
import { Cart } from './cart/entity/cart.entity';
import { CartItem } from './cart/entity/cart-item.entity';
import { OrdersModule } from './orders/orders.module';
import { Order } from './orders/entity/order.entity';
import { OrderItem } from './orders/entity/order-item.entity';
import { AnalyticsModule } from './analytics/analytics.module';
import { ContactModule } from './contact/contact.module';
import { Contact } from './contact/entity/contact.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: +configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [
          User,
          Media,
          Category,
          Product,
          ProductImage,
          Cart,
          CartItem,
          Order,
          OrderItem,
          Contact,
        ],
        synchronize: true, // disable in production
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    AdminModule,
    MediaModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
    OrdersModule,
    AnalyticsModule,
    ContactModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
