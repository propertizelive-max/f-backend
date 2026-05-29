import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { StorageService } from '../storage/storage.service';
import { CategoryQueryDto } from './dto/category-query.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entity/category.entity';

const CATEGORIES_FOLDER = 'categories';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly storageService: StorageService,
  ) {}

  async create(
    dto: CreateCategoryDto,
    file?: Express.Multer.File,
  ): Promise<Category> {
    await this.assertNameAvailable(dto.name);

    const slug = await this.generateUniqueSlug(dto.name);
    const { imageUrl, imageKey } = await this.uploadImage(file);

    const category = this.categoryRepository.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
      imageUrl,
      imageKey,
    });

    const saved = await this.categoryRepository.save(category);
    this.logger.log(`Category created: ${saved.id} — "${saved.name}"`);
    return saved;
  }

  async findAll(query: CategoryQueryDto): Promise<PaginatedResponse<Category>> {
    const qb = this.categoryRepository.createQueryBuilder('category');

    if (query.search) {
      const term = `%${query.search.toLowerCase()}%`;
      qb.where(
        '(LOWER(category.name) LIKE :term OR LOWER(category.description) LIKE :term)',
        { term },
      );
    }

    if (query.isActive !== undefined) {
      qb.andWhere('category.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    const allowedSortFields: Record<string, string> = {
      name: 'category.name',
      createdAt: 'category.createdAt',
      isActive: 'category.isActive',
    };
    const orderColumn =
      allowedSortFields[query.sortBy ?? 'createdAt'] ?? 'category.createdAt';

    qb.orderBy(orderColumn, query.order ?? 'DESC')
      .skip(query.skip)
      .take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(id: string): Promise<Category> {
    return this.findOneOrFail(id);
  }

  async update(
    id: string,
    dto: UpdateCategoryDto,
    file?: Express.Multer.File,
  ): Promise<Category> {
    const category = await this.findOneOrFail(id);

    if (dto.name && dto.name !== category.name) {
      const conflict = await this.categoryRepository
        .createQueryBuilder('category')
        .where('LOWER(category.name) = LOWER(:name)', { name: dto.name })
        .andWhere('category.id != :id', { id })
        .withDeleted()
        .getOne();

      if (conflict) {
        throw new ConflictException(
          `Category with name "${dto.name}" already exists.`,
        );
      }

      category.slug = await this.generateUniqueSlug(dto.name, id);
      category.name = dto.name;
    }

    if (dto.description !== undefined) category.description = dto.description;
    if (dto.isActive !== undefined) category.isActive = dto.isActive;

    if (file) {
      await this.deleteStoredImage(category.imageKey);
      const uploaded = await this.storageService.upload(
        file,
        CATEGORIES_FOLDER,
      );
      category.imageUrl = uploaded.url;
      category.imageKey = uploaded.key;
    }

    const saved = await this.categoryRepository.save(category);
    this.logger.log(`Category updated: ${saved.id}`);
    return saved;
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOneOrFail(id);
    await this.categoryRepository.softDelete(category.id);
    this.logger.log(`Category soft-deleted: ${category.id}`);
  }

  private async findOneOrFail(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found.`);
    }
    return category;
  }

  private async assertNameAvailable(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const qb = this.categoryRepository
      .createQueryBuilder('category')
      .where('LOWER(category.name) = LOWER(:name)', { name })
      .withDeleted();

    if (excludeId) qb.andWhere('category.id != :excludeId', { excludeId });

    const exists = await qb.getOne();
    if (exists) {
      throw new ConflictException(
        `Category with name "${name}" already exists.`,
      );
    }
  }

  private async generateUniqueSlug(
    name: string,
    excludeId?: string,
  ): Promise<string> {
    const base = this.slugify(name);
    let slug = base;
    let counter = 1;

    while (true) {
      const qb = this.categoryRepository
        .createQueryBuilder('category')
        .where('category.slug = :slug', { slug })
        .withDeleted();

      if (excludeId) qb.andWhere('category.id != :excludeId', { excludeId });

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

  private async uploadImage(
    file?: Express.Multer.File,
  ): Promise<{ imageUrl: string | null; imageKey: string | null }> {
    if (!file) return { imageUrl: null, imageKey: null };
    const uploaded = await this.storageService.upload(file, CATEGORIES_FOLDER);
    return { imageUrl: uploaded.url, imageKey: uploaded.key };
  }

  private async deleteStoredImage(key: string | null): Promise<void> {
    if (!key) return;
    await this.storageService.delete(key).catch((err: unknown) => {
      this.logger.warn(`Failed to delete image key "${key}": ${String(err)}`);
    });
  }
}
