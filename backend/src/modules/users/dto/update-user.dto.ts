import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'] as const)) {
  @ApiPropertyOptional({ description: 'The password of the user' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
