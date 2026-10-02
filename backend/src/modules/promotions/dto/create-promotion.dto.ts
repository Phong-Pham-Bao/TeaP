import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { PromotionType } from '@prisma/client';
import { VND_MAX_AMOUNT } from '../../../common/money/vietnamese-dong';

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
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  value: number;

  @ApiPropertyOptional({
    type: 'integer',
    minimum: 0,
    maximum: VND_MAX_AMOUNT,
    description: 'Minimum order value required for promotion',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(VND_MAX_AMOUNT)
  minOrderValue?: number;

  @ApiPropertyOptional({
    type: 'integer',
    minimum: 0,
    maximum: VND_MAX_AMOUNT,
    description: 'Maximum discount amount allowed',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(VND_MAX_AMOUNT)
  maxDiscount?: number;

  @ApiProperty({ description: 'Start date of the promotion' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date of the promotion' })
  @IsDateString()
  endDate: string;
}
