import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { normalizeVietnamesePhone } from '../../../common/transforms/normalize-phone';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Full name of the customer' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName: string;

  @ApiProperty({ description: 'Phone number of the customer (VN format)' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => normalizeVietnamesePhone(value))
  @Matches(/^0[35789][0-9]{8}$/, { message: 'Invalid Vietnamese phone number' })
  phone: string;

  @ApiPropertyOptional({ description: 'Email address of the customer' })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail()
  @MaxLength(254)
  email?: string;
}
