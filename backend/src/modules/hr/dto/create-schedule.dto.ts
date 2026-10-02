import { IsUUID, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsBusinessDate } from '../../../common/validation/is-business-date.decorator';

export class CreateScheduleDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsUUID()
  branchId: string;

  @ApiProperty()
  @IsBusinessDate()
  date: string;

  @ApiProperty()
  @IsString()
  shiftName: string;

  @ApiProperty()
  @IsString()
  startTime: string;

  @ApiProperty()
  @IsString()
  endTime: string;
}
