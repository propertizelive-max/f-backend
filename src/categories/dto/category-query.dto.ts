import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

export enum CategorySortBy {
  NAME = 'name',
  CREATED_AT = 'createdAt',
  IS_ACTIVE = 'isActive',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class CategoryQueryDto extends PaginationDto {
  @ApiPropertyOptional({ example: 'chair', description: 'Search by name or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: CategorySortBy, default: CategorySortBy.CREATED_AT })
  @IsOptional()
  @IsIn(Object.values(CategorySortBy))
  sortBy?: CategorySortBy = CategorySortBy.CREATED_AT;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({ example: true, description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }: { value: unknown }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  isActive?: boolean;
}
