import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, mkdirSync } from 'fs';
import { writeFile, unlink } from 'fs/promises';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import {
  IStorageProvider,
  UploadedFile,
} from '../interfaces/storage-provider.interface';

@Injectable()
export class LocalStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = configService.get<string>('UPLOAD_DIR', './uploads');
    this.baseUrl = configService.get<string>(
      'APP_BASE_URL',
      'http://localhost:3000',
    );
    this.ensureUploadDir();
  }

  private ensureUploadDir(): void {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Created upload directory: ${this.uploadDir}`);
    }
  }

  async upload(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadedFile> {
    const ext = extname(file.originalname);
    const filename = `${randomUUID()}${ext}`;
    const key = folder ? `${folder}/${filename}` : filename;
    const targetDir = folder ? join(this.uploadDir, folder) : this.uploadDir;

    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    const filePath = join(targetDir, filename);
    await writeFile(filePath, file.buffer);
    this.logger.log(`File saved: ${filePath}`);

    return {
      key,
      url: this.getUrl(key),
      size: file.size,
      mimeType: file.mimetype,
      originalName: file.originalname,
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = join(this.uploadDir, key);
    if (existsSync(filePath)) {
      await unlink(filePath);
      this.logger.log(`File deleted: ${filePath}`);
    }
  }

  getUrl(key: string): string {
    return `${this.baseUrl}/uploads/${key}`;
  }
}
