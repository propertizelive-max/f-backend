import { Inject, Injectable } from '@nestjs/common';
import { STORAGE_PROVIDER } from './constants/storage.constants';
import type {
  IStorageProvider,
  UploadedFile,
} from './interfaces/storage-provider.interface';

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly provider: IStorageProvider,
  ) {}

  upload(file: Express.Multer.File, folder?: string): Promise<UploadedFile> {
    return this.provider.upload(file, folder);
  }

  delete(key: string): Promise<void> {
    return this.provider.delete(key);
  }

  getUrl(key: string): string {
    return this.provider.getUrl(key);
  }
}
