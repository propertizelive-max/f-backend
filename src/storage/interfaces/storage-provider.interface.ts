export interface UploadedFile {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  originalName: string;
}

export interface IStorageProvider {
  upload(file: Express.Multer.File, folder?: string): Promise<UploadedFile>;
  delete(key: string): Promise<void>;
  getUrl(key: string): string;
}
