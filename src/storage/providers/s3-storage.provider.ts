import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IStorageProvider, UploadedFile } from '../interfaces/storage-provider.interface';

/**
 * Migration checklist when enabling S3:
 *   1. npm install @aws-sdk/client-s3 @aws-sdk/lib-storage
 *   2. Set STORAGE_TYPE=s3 in .env
 *   3. Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET in .env
 *   4. Uncomment the implementation blocks below
 *
 * DigitalOcean Spaces is S3-compatible — set endpoint accordingly.
 */
@Injectable()
export class S3StorageProvider implements IStorageProvider {
  private readonly logger = new Logger(S3StorageProvider.name);

  // private readonly s3Client: S3Client;
  // private readonly bucketName: string;
  // private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    // this.region = configService.getOrThrow<string>('AWS_REGION');
    // this.bucketName = configService.getOrThrow<string>('AWS_S3_BUCKET');
    // this.s3Client = new S3Client({
    //   region: this.region,
    //   credentials: {
    //     accessKeyId: configService.getOrThrow('AWS_ACCESS_KEY_ID'),
    //     secretAccessKey: configService.getOrThrow('AWS_SECRET_ACCESS_KEY'),
    //   },
    //   // For DigitalOcean Spaces, uncomment:
    //   // endpoint: configService.get('DO_SPACES_ENDPOINT'),
    // });
  }

  async upload(_file: Express.Multer.File): Promise<UploadedFile> {
    // const ext = extname(_file.originalname);
    // const key = `${randomUUID()}${ext}`;
    // const upload = new Upload({
    //   client: this.s3Client,
    //   params: {
    //     Bucket: this.bucketName,
    //     Key: key,
    //     Body: _file.buffer,
    //     ContentType: _file.mimetype,
    //     ACL: 'public-read',
    //   },
    // });
    // await upload.done();
    // this.logger.log(`Uploaded to S3: ${key}`);
    // return { key, url: this.getUrl(key), size: _file.size, mimeType: _file.mimetype, originalName: _file.originalname };
    throw new NotImplementedException('S3StorageProvider is not yet configured — set STORAGE_TYPE=local or complete the migration checklist.');
  }

  async delete(_key: string): Promise<void> {
    // await this.s3Client.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: _key }));
    // this.logger.log(`Deleted from S3: ${_key}`);
    throw new NotImplementedException('S3StorageProvider is not yet configured.');
  }

  getUrl(_key: string): string {
    // return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${_key}`;
    throw new NotImplementedException('S3StorageProvider is not yet configured.');
  }
}
