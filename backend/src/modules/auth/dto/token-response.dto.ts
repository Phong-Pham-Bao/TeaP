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
}

export class TokenResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ type: () => UserProfileDto })
  user: UserProfileDto;
}
