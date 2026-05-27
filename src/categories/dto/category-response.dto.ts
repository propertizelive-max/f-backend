import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { Category } from '../entity/category.entity';

@Exclude()
export class CategoryResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Office Chair' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'office-chair' })
  @Expose()
  slug: string;

  @ApiPropertyOptional({ example: 'Ergonomic office chairs for modern workspaces', nullable: true })
  @Expose()
  description: string | null;

  @ApiPropertyOptional({ example: 'http://localhost:3000/uploads/categories/abc.jpg', nullable: true })
  @Expose()
  imageUrl: string | null;

  @ApiProperty({ example: true })
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  static from(category: Category): CategoryResponseDto {
    return plainToInstance(CategoryResponseDto, category);
  }

  static fromMany(categories: Category[]): CategoryResponseDto[] {
    return categories.map((c) => CategoryResponseDto.from(c));
  }
}
