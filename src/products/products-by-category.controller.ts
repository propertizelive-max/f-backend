import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtUser,
} from '../common/decorators/current-user.decorator';
import { Role } from '../common/enums/role.enum';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { ProductQueryDto } from './dto/product-query.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('categories')
export class ProductsByCategoryController {
  constructor(private readonly productsService: ProductsService) {}

  @Get(':categoryId/products')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get products by category' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of products for the category',
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findByCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Query() query: ProductQueryDto,
    @CurrentUser() user: JwtUser | undefined,
  ): Promise<PaginatedResponse<ProductResponseDto>> {
    const isAdmin = user?.role === Role.ADMIN;
    const result = await this.productsService.findByCategory(
      categoryId,
      query,
      isAdmin,
    );
    return {
      data: ProductResponseDto.fromMany(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }
}
