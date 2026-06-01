import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../categories/entity/category.entity';
import { ProductImage } from './entity/product-image.entity';
import { Product } from './entity/product.entity';
import { ProductsByCategoryController } from './products-by-category.controller';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductImage, Category])],
  controllers: [ProductsController, ProductsByCategoryController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
