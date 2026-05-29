import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationDto } from '../common/dto/pagination.dto';
import { StorageService } from '../storage/storage.service';
import { Media } from './entity/media.entity';

@Injectable()
export class MediaService {
  private readonly storageType: string;

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly storageService: StorageService,
    configService: ConfigService,
  ) {
    this.storageType = configService.get<string>('STORAGE_TYPE', 'local');
  }

  async uploadSingle(
    file: Express.Multer.File,
    uploadedById?: string,
  ): Promise<Media> {
    const uploaded = await this.storageService.upload(file);

    const media = this.mediaRepository.create({
      originalName: uploaded.originalName,
      mimeType: uploaded.mimeType,
      size: uploaded.size,
      storageKey: uploaded.key,
      url: uploaded.url,
      storageType: this.storageType,
      uploadedById: uploadedById ?? null,
    });

    return this.mediaRepository.save(media);
  }

  async uploadBulk(
    files: Express.Multer.File[],
    uploadedById?: string,
  ): Promise<Media[]> {
    return Promise.all(
      files.map((file) => this.uploadSingle(file, uploadedById)),
    );
  }

  async findAll(
    pagination: PaginationDto,
  ): Promise<{ data: Media[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.mediaRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: pagination.skip,
      take: pagination.limit,
    });

    return { data, total, page: pagination.page, limit: pagination.limit };
  }

  async findOne(id: string): Promise<Media> {
    const media = await this.mediaRepository.findOne({ where: { id } });
    if (!media) throw new NotFoundException(`Media "${id}" not found`);
    return media;
  }

  async remove(id: string): Promise<void> {
    const media = await this.findOne(id);
    await this.storageService.delete(media.storageKey);
    await this.mediaRepository.remove(media);
  }
}
