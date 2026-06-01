import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { ProductImageType } from '../enums/product-image-type.enum';

@Exclude()
export class ProductImageResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  imageUrl: string;

  @ApiProperty({ enum: ProductImageType })
  @Expose()
  imageType: ProductImageType;

  @ApiProperty()
  @Expose()
  sortOrder: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;
}
