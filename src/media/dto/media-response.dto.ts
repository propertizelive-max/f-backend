import { Exclude, Expose, Type } from 'class-transformer';
import { Media } from '../entity/media.entity';

@Exclude()
export class MediaResponseDto {
  @Expose() id!: string;
  @Expose() originalName!: string;
  @Expose() mimeType!: string;
  @Expose() @Type(() => Number) size!: number;
  @Expose() url!: string;
  @Expose() storageType!: string;
  @Expose() uploadedById!: string | null;
  @Expose() createdAt!: Date;

  static from(media: Media): MediaResponseDto {
    const dto = new MediaResponseDto();
    Object.assign(dto, media);
    return dto;
  }

  static fromMany(media: Media[]): MediaResponseDto[] {
    return media.map(MediaResponseDto.from);
  }
}
