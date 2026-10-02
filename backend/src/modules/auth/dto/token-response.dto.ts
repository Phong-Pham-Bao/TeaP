import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

class UserProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ required: false })
  branchId?: string;

  @ApiProperty({ type: [String] })
  allowedBranchIds: string[];
}

export class TokenResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  csrfToken: string;

  @ApiProperty({ type: () => UserProfileDto })
  user: UserProfileDto;
}
