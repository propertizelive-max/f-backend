import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type, plainToInstance } from 'class-transformer';
import { Product } from '../entity/product.entity';
import { ProductStatus } from '../enums/product-status.enum';

@Exclude()
export class ProductCategoryDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  slug: string;
}

@Exclude()
export class ProductResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  @Expose()
  description: string | null;

  @ApiProperty()
  @Expose()
  price: number;

  @ApiPropertyOptional({ nullable: true })
  @Expose()
  discountPrice: number | null;

  @ApiProperty()
  @Expose()
  stock: number;

  @ApiPropertyOptional({ nullable: true })
  @Expose()
  sku: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Expose()
  material: string | null;

  @ApiProperty({ enum: ProductStatus })
  @Expose()
  status: ProductStatus;

  @ApiPropertyOptional({ nullable: true })
  @Expose()
  color: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Expose()
  dimensions: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Expose()
  weight: number | null;

  @ApiPropertyOptional({ nullable: true })
  @Expose()
  finish: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Expose()
  style: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Expose()
  careInstructions: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Expose()
  warranty: string | null;

  @ApiProperty({
    type: [String],
    example: ['uploads/products/img1.webp', 'uploads/products/img2.webp'],
    description: 'Product image URLs. First image is the thumbnail.',
  })
  @Expose()
  imageUrls: string[];

  @ApiProperty()
  @Expose()
  isFeatured: boolean;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  categoryId: string;

  @ApiPropertyOptional({ type: () => ProductCategoryDto, nullable: true })
  @Expose()
  @Type(() => ProductCategoryDto)
  category: ProductCategoryDto | null;

  @ApiProperty()
  @Expose()
  createdBy: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  static from(product: Product): ProductResponseDto {
    return plainToInstance(ProductResponseDto, product, {
      excludeExtraneousValues: true,
    });
  }

  static fromMany(products: Product[]): ProductResponseDto[] {
    return products.map((p) => ProductResponseDto.from(p));
  }
}
