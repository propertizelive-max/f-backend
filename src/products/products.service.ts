import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../categories/entity/category.entity';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductImageDto } from './dto/product-image.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductImage } from './entity/product-image.entity';
import { Product } from './entity/product.entity';
import { ProductImageType } from './enums/product-image-type.enum';
import { ProductStatus } from './enums/product-status.enum';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(ProductImage)
    private readonly imageRepo: Repository<ProductImage>,
  ) {}

  async create(dto: CreateProductDto, adminId: string): Promise<Product> {
    await this.assertCategoryExists(dto.categoryId);
    if (dto.sku) await this.assertSkuAvailable(dto.sku);
    if (dto.discountPrice !== undefined && dto.discountPrice >= dto.price) {
      throw new BadRequestException('discountPrice must be less than price.');
    }

    const slug = await this.generateUniqueSlug(dto.title);

    const product = this.productRepo.create({
      title: dto.title,
      slug,
      description: dto.description ?? null,
      price: dto.price,
      discountPrice: dto.discountPrice ?? null,
      stock: dto.stock ?? 0,
      sku: dto.sku ?? null,
      material: dto.material ?? null,
      status: dto.status ?? ProductStatus.DRAFT,
      color: dto.color ?? null,
      dimensions: dto.dimensions ?? null,
      weight: dto.weight ?? null,
      finish: dto.finish ?? null,
      style: dto.style ?? null,
      careInstructions: dto.careInstructions ?? null,
      warranty: dto.warranty ?? null,
      categoryId: dto.categoryId,
      createdBy: adminId,
    });

    const saved = await this.productRepo.save(product);

    const imageEntities = this.buildImageEntities(saved.id, dto.images);
    await this.imageRepo.save(imageEntities);

    this.logger.log(`Product created: ${saved.id} — "${saved.title}"`);
    return this.findOneOrFail(saved.id);
  }

  async findAll(
    query: ProductQueryDto,
    isAdmin = false,
  ): Promise<PaginatedResponse<Product>> {
    const baseQb = this.productRepo.createQueryBuilder('product');

    if (!isAdmin) {
      baseQb
        .andWhere('product.isActive = true')
        .andWhere('product.status IN (:...statuses)', {
          statuses: [ProductStatus.PUBLISHED, ProductStatus.ACTIVE],
        });
    } else {
      if (query.isActive !== undefined) {
        baseQb.andWhere('product.isActive = :isActive', {
          isActive: query.isActive,
        });
      }
      if (query.status) {
        baseQb.andWhere('product.status = :status', { status: query.status });
      }
    }

    if (query.search) {
      const term = `%${query.search.toLowerCase()}%`;
      baseQb.andWhere(
        '(LOWER(product.title) LIKE :term OR LOWER(product.description) LIKE :term)',
        { term },
      );
    }

    if (query.categoryId) {
      baseQb.andWhere('product.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.isFeatured !== undefined) {
      baseQb.andWhere('product.isFeatured = :isFeatured', {
        isFeatured: query.isFeatured,
      });
    }

    if (query.minPrice !== undefined) {
      baseQb.andWhere('product.price >= :minPrice', {
        minPrice: query.minPrice,
      });
    }

    if (query.maxPrice !== undefined) {
      baseQb.andWhere('product.price <= :maxPrice', {
        maxPrice: query.maxPrice,
      });
    }

    const sortFields: Record<string, string> = {
      title: 'product.title',
      price: 'product.price',
      createdAt: 'product.createdAt',
      stock: 'product.stock',
      status: 'product.status',
    };
    const orderColumn =
      sortFields[query.sortBy ?? 'createdAt'] ?? 'product.createdAt';

    // Step 1 & 4: get total count and paginated IDs on products only (no join)
    const total = await baseQb.getCount();

    const paginatedIds = await baseQb
      .clone()
      .select('product.id', 'id')
      .orderBy(orderColumn, query.order ?? 'DESC')
      .skip(query.skip)
      .take(query.limit)
      .getRawMany<{ id: string }>();

    if (paginatedIds.length === 0) {
      return { data: [], total, page: query.page, limit: query.limit };
    }

    const ids = paginatedIds.map((row) => row.id);

    // Step 3: fetch full products with relations for the resolved IDs only
    const products = await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .where('product.id IN (:...ids)', { ids })
      .orderBy(orderColumn, query.order ?? 'DESC')
      .addOrderBy('images.sortOrder', 'ASC')
      .getMany();

    // Preserve the paginated order returned by the ID query
    const orderMap = new Map(ids.map((id, i) => [id, i]));
    products.sort(
      (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
    );

    return { data: products, total, page: query.page, limit: query.limit };
  }

  async findOne(id: string, isAdmin = false): Promise<Product> {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .orderBy('images.sortOrder', 'ASC')
      .where('product.id = :id', { id });

    if (!isAdmin) {
      qb.andWhere('product.isActive = true').andWhere(
        'product.status IN (:...statuses)',
        { statuses: [ProductStatus.PUBLISHED, ProductStatus.ACTIVE] },
      );
    }

    const product = await qb.getOne();
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found.`);
    }
    return product;
  }

  async findByCategory(
    categoryId: string,
    query: ProductQueryDto,
    isAdmin = false,
  ): Promise<PaginatedResponse<Product>> {
    await this.assertCategoryExists(categoryId);
    query.categoryId = categoryId;
    return this.findAll(query, isAdmin);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOneOrFail(id);

    if (dto.discountPrice !== undefined && dto.discountPrice !== null) {
      const effectivePrice = dto.price ?? product.price;
      if (dto.discountPrice >= effectivePrice) {
        throw new BadRequestException('discountPrice must be less than price.');
      }
    }

    if (dto.sku !== undefined && dto.sku !== product.sku && dto.sku !== null) {
      await this.assertSkuAvailable(dto.sku, id);
    }

    if (dto.categoryId && dto.categoryId !== product.categoryId) {
      await this.assertCategoryExists(dto.categoryId);
    }

    if (dto.title && dto.title !== product.title) {
      product.slug = await this.generateUniqueSlug(dto.title, id);
      product.title = dto.title;
    }

    if (dto.description !== undefined)
      product.description = dto.description ?? null;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.discountPrice !== undefined)
      product.discountPrice = dto.discountPrice ?? null;
    if (dto.stock !== undefined) product.stock = dto.stock;
    if (dto.sku !== undefined) product.sku = dto.sku ?? null;
    if (dto.material !== undefined) product.material = dto.material ?? null;
    if (dto.status !== undefined) product.status = dto.status;
    if (dto.color !== undefined) product.color = dto.color ?? null;
    if (dto.dimensions !== undefined)
      product.dimensions = dto.dimensions ?? null;
    if (dto.weight !== undefined) product.weight = dto.weight ?? null;
    if (dto.finish !== undefined) product.finish = dto.finish ?? null;
    if (dto.style !== undefined) product.style = dto.style ?? null;
    if (dto.careInstructions !== undefined)
      product.careInstructions = dto.careInstructions ?? null;
    if (dto.warranty !== undefined) product.warranty = dto.warranty ?? null;
    if (dto.categoryId !== undefined) product.categoryId = dto.categoryId;

    const saved = await this.productRepo.save(product);

    if (dto.images !== undefined) {
      await this.imageRepo.delete({ productId: saved.id });
      const imageEntities = this.buildImageEntities(saved.id, dto.images);
      await this.imageRepo.save(imageEntities);
    }

    this.logger.log(`Product updated: ${saved.id}`);
    return this.findOneOrFail(saved.id);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOneOrFail(id);
    await this.productRepo.softDelete(product.id);
    this.logger.log(`Product soft-deleted: ${product.id}`);
  }

  async toggleFeatured(id: string): Promise<Product> {
    const product = await this.findOneOrFail(id);
    product.isFeatured = !product.isFeatured;
    await this.productRepo.save(product);
    this.logger.log(
      `Product ${product.id} isFeatured → ${String(product.isFeatured)}`,
    );
    return this.findOneOrFail(id);
  }

  async toggleActive(id: string): Promise<Product> {
    const product = await this.findOneOrFail(id);
    product.isActive = !product.isActive;
    await this.productRepo.save(product);
    this.logger.log(
      `Product ${product.id} isActive → ${String(product.isActive)}`,
    );
    return this.findOneOrFail(id);
  }

  private buildImageEntities(
    productId: string,
    dtos: ProductImageDto[],
  ): ProductImage[] {
    const seen = new Set<string>();
    const deduped = dtos.filter((img) => {
      if (seen.has(img.imageUrl)) return false;
      seen.add(img.imageUrl);
      return true;
    });

    const diagramCount = deduped.filter(
      (img) => img.imageType === ProductImageType.DIAGRAM,
    ).length;
    if (diagramCount > 1) {
      throw new BadRequestException(
        'A product may have at most one DIAGRAM image.',
      );
    }

    return deduped.map((img, index) =>
      this.imageRepo.create({
        productId,
        imageUrl: img.imageUrl,
        imageType: img.imageType,
        sortOrder: img.sortOrder ?? index,
      }),
    );
  }

  private async findOneOrFail(id: string): Promise<Product> {
    const product = await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.images', 'images')
      .orderBy('images.sortOrder', 'ASC')
      .where('product.id = :id', { id })
      .getOne();
    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found.`);
    }
    return product;
  }

  private async assertSkuAvailable(
    sku: string,
    excludeId?: string,
  ): Promise<void> {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .where('product.sku = :sku', { sku })
      .withDeleted();
    if (excludeId) qb.andWhere('product.id != :excludeId', { excludeId });
    const exists = await qb.getOne();
    if (exists) {
      throw new ConflictException(`Product with SKU "${sku}" already exists.`);
    }
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const category = await this.categoryRepo.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException(
        `Category with ID "${categoryId}" not found.`,
      );
    }
  }

  private async generateUniqueSlug(
    title: string,
    excludeId?: string,
  ): Promise<string> {
    const base = this.slugify(title);
    let slug = base;
    let counter = 1;

    while (true) {
      const qb = this.productRepo
        .createQueryBuilder('product')
        .where('product.slug = :slug', { slug })
        .withDeleted();
      if (excludeId) qb.andWhere('product.id != :excludeId', { excludeId });
      const conflict = await qb.getOne();
      if (!conflict) break;
      slug = `${base}-${counter++}`;
    }

    return slug;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
