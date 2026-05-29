import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CancelOrderDto {
  @ApiProperty({ example: 'Ordered by mistake' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
