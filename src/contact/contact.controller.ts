import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ContactService } from './contact.service';
import { ContactResponseDto } from './dto/contact-response.dto';
import { CreateContactDto } from './dto/create-contact.dto';

@ApiTags('Contact')
@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  // ─── Public: Submit contact form ──────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a contact form message (Public)' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(
    @Body() dto: CreateContactDto,
  ): Promise<{ success: boolean; message: string }> {
    await this.contactService.create(dto);
    return { success: true, message: 'Your message has been sent successfully.' };
  }

  // ─── Admin: List all messages ─────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all contact messages (Admin only)' })
  @ApiResponse({ status: 200, description: 'Paginated list of contact messages' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin role required' })
  async findAll(
    @Query() query: PaginationDto,
  ): Promise<PaginatedResponse<ContactResponseDto>> {
    const result = await this.contactService.findAll(query);
    return {
      data: ContactResponseDto.fromMany(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
    };
  }

  // ─── Admin: Get single message ────────────────────────────────────────────

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a single contact message by ID (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Contact message found',
    type: ContactResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — Admin role required' })
  @ApiResponse({ status: 404, description: 'Contact message not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContactResponseDto> {
    const contact = await this.contactService.findOne(id);
    return ContactResponseDto.from(contact);
  }
}
