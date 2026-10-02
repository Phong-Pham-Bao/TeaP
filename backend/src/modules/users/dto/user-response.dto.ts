import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserBranchReferenceDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
}

export class UserBranchAssignmentResponseDto {
  @ApiProperty() branchId: string;
  @ApiProperty() isPrimary: boolean;
  @ApiProperty({ type: UserBranchReferenceDto }) branch: UserBranchReferenceDto;
}

export class UserResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() fullName: string;
  @ApiPropertyOptional({ type: String, nullable: true }) phone?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) avatar?: string | null;
  @ApiProperty({ enum: Role }) role: Role;
  @ApiPropertyOptional({ type: String, nullable: true }) branchId?: string | null;
  @ApiProperty() isActive: boolean;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: string;
  @ApiPropertyOptional({ type: UserBranchReferenceDto, nullable: true }) branch?: UserBranchReferenceDto | null;
  @ApiProperty({ type: [UserBranchAssignmentResponseDto] })
  branchAssignments: UserBranchAssignmentResponseDto[];
}

export class DeletedUserResponseDto {
  @ApiProperty() id: string;
}
