import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Full name of the customer' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'Phone number of the customer (VN format)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, { message: 'Invalid Vietnamese phone number' })
  phone: string;

  @ApiPropertyOptional({ description: 'Email address of the customer' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
