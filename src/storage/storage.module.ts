import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { STORAGE_PROVIDER } from './constants/storage.constants';
import { IStorageProvider } from './interfaces/storage-provider.interface';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { S3StorageProvider } from './providers/s3-storage.provider';
import { StorageService } from './storage.service';

@Module({
  imports: [ConfigModule],
  providers: [
    LocalStorageProvider,
    S3StorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (
        configService: ConfigService,
        local: LocalStorageProvider,
        s3: S3StorageProvider,
      ): IStorageProvider => {
        const type = configService.get<string>('STORAGE_TYPE', 'local');
        return type === 's3' ? s3 : local;
      },
      inject: [ConfigService, LocalStorageProvider, S3StorageProvider],
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
