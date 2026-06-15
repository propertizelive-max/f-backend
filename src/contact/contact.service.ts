import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { Contact } from './entity/contact.entity';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
  ) {}

  async create(dto: CreateContactDto): Promise<Contact> {
    const contact = this.contactRepository.create({
      fullName: dto.fullName,
      email: dto.email,
      phoneNumber: dto.phoneNumber ?? null,
      subject: dto.subject,
      message: dto.message,
      status: 'new',
    });

    const saved = await this.contactRepository.save(contact);
    this.logger.log(`Contact message saved: ${saved.id} from "${saved.email}"`);
    return saved;
  }

  async findAll(query: PaginationDto): Promise<PaginatedResponse<Contact>> {
    const [data, total] = await this.contactRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });

    return { data, total, page: query.page, limit: query.limit };
  }

  async findOne(id: string): Promise<Contact> {
    const contact = await this.contactRepository.findOne({ where: { id } });
    if (!contact) {
      throw new NotFoundException(`Contact message with ID "${id}" not found.`);
    }
    return contact;
  }
}
