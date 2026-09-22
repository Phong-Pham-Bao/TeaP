import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ description: 'The email of the user' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'The password of the user' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'The full name of the user' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiPropertyOptional({ description: 'The phone number of the user' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: Role, description: 'The role of the user', default: Role.CASHIER })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional({ description: 'The ID of the branch the user belongs to' })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
