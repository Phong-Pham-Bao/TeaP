import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CategoryProductCountDto {
  @ApiProperty() products: number;
}

export class CategoryResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional({ type: String, nullable: true }) description?: string | null;
  @ApiProperty() sortOrder: number;
  @ApiProperty() isActive: boolean;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: string;
  @ApiPropertyOptional({ type: CategoryProductCountDto })
  _count?: CategoryProductCountDto;
}
