import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BranchCountResponseDto {
  @ApiPropertyOptional() users?: number;
  @ApiPropertyOptional() orders?: number;
  @ApiPropertyOptional() inventories?: number;
}

export class BranchUserReferenceDto {
  @ApiProperty() id: string;
  @ApiProperty() fullName: string;
  @ApiProperty() email: string;
  @ApiProperty() role: string;
}

export class BranchResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() address: string;
  @ApiPropertyOptional({ type: String, nullable: true }) phone?: string | null;
  @ApiProperty() isActive: boolean;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: string;
  @ApiPropertyOptional({ type: BranchCountResponseDto }) _count?: BranchCountResponseDto;
  @ApiPropertyOptional({ type: [BranchUserReferenceDto] }) users?: BranchUserReferenceDto[];
}
