import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, plainToInstance } from 'class-transformer';
import { Contact } from '../entity/contact.entity';

@Exclude()
export class ContactResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'John Doe' })
  @Expose()
  fullName: string;

  @ApiProperty({ example: 'john@example.com' })
  @Expose()
  email: string;

  @ApiPropertyOptional({ example: '9876543210', nullable: true })
  @Expose()
  phoneNumber: string | null;

  @ApiProperty({ example: 'Product Information' })
  @Expose()
  subject: string;

  @ApiProperty({
    example: 'I would like more information about your furniture collection.',
  })
  @Expose()
  message: string;

  @ApiProperty({ example: 'new', enum: ['new', 'in_progress', 'resolved'] })
  @Expose()
  status: string;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  static from(contact: Contact): ContactResponseDto {
    return plainToInstance(ContactResponseDto, contact);
  }

  static fromMany(contacts: Contact[]): ContactResponseDto[] {
    return contacts.map((c) => ContactResponseDto.from(c));
  }
}
