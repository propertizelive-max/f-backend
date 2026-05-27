import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { CategoriesService } from './categories.service';
import { categoryImageMulterOptions } from './config/multer-image.config';
import { CategoryQueryDto } from './dto/category-query.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ─── Admin: Create ────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image', categoryImageMulterOptions))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a category (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'Office Chair', maxLength: 150 },
        description: {
          type: 'string',
          example: 'Ergonomic office chairs for modern workspaces',
          maxLength: 1000,
        },
        image: { type: 'string', format: 'binary', description: 'Category image (jpeg/png/webp/gif, max 5 MB)' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Category created successfully', type: CategoryResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error or invalid image' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin role required' })
  @ApiResponse({ status: 409, description: 'Category name already exists' })
  async create(
    @Body() dto: CreateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.create(dto, file);
    return CategoryResponseDto.from(category);
  }

  // ─── Public: List ─────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List categories with pagination, search, and filtering' })
  @ApiResponse({ status: 200, description: 'Paginated list of categories' })
  async findAll(
    @Query() query: CategoryQueryDto,
  ): Promise<PaginatedResponse<CategoryResponseDto>> {
    const result = await this.categoriesService.findAll(query);
    return {
      data: CategoryResponseDto.fromMany(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  // ─── Public: Get one ──────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiResponse({ status: 200, description: 'Category found', type: CategoryResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.findOne(id);
    return CategoryResponseDto.from(category);
  }

  // ─── Admin: Update ────────────────────────────────────────────────────────

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('image', categoryImageMulterOptions))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category (Admin only)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'Ergonomic Chair', maxLength: 150 },
        description: { type: 'string', example: 'Updated description', maxLength: 1000 },
        isActive: { type: 'boolean', example: true },
        image: { type: 'string', format: 'binary', description: 'Replace category image (jpeg/png/webp/gif, max 5 MB)' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Category updated', type: CategoryResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error or invalid image' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin role required' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Category name already exists' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCategoryDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CategoryResponseDto> {
    const category = await this.categoriesService.update(id, dto, file);
    return CategoryResponseDto.from(category);
  }

  // ─── Admin: Delete ────────────────────────────────────────────────────────

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a category (Admin only)' })
  @ApiResponse({ status: 204, description: 'Category deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin role required' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.categoriesService.remove(id);
  }
}
