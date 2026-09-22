import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CheckInDto {
  @ApiPropertyOptional({ description: 'Note for check-in or check-out' })
  @IsOptional()
  @IsString()
  note?: string;
}
