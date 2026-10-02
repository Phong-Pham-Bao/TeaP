import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { normalizeVietnamesePhone } from '../../../common/transforms/normalize-phone';

export class LookupCustomerDto {
  @ApiProperty({ example: '0901234567' })
  @Transform(({ value }) => normalizeVietnamesePhone(value))
  @IsString()
  @Matches(/^0[35789][0-9]{8}$/, {
    message: 'Invalid Vietnamese phone number',
  })
  phone: string;
}
