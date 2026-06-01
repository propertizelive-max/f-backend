import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ProductImageType } from '../enums/product-image-type.enum';

export class ProductImageDto {
  @ApiProperty({ example: 'uploads/products/chair-1.webp' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({ enum: ProductImageType, example: ProductImageType.GALLERY })
  @IsEnum(ProductImageType)
  imageType: ProductImageType;

  @ApiPropertyOptional({
    example: 0,
    description: 'Display order (0-based). Defaults to array position.',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}
