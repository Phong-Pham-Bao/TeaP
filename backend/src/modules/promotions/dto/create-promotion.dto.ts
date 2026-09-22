import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PromotionType } from '@prisma/client';

export class CreatePromotionDto {
  @ApiProperty({ description: 'Name of the promotion' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Description of the promotion' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: PromotionType, description: 'Type of promotion' })
  @IsEnum(PromotionType)
  type: PromotionType;

  @ApiProperty({ description: 'Discount value (percentage or fixed amount)' })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ description: 'Minimum order value required for promotion' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderValue?: number;

  @ApiPropertyOptional({ description: 'Maximum discount amount allowed' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @ApiProperty({ description: 'Start date of the promotion' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date of the promotion' })
  @IsDateString()
  endDate: string;
}
