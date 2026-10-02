import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DecimalQuantityInput,
  decimalQuantityToString,
} from '../../../common/quantity/decimal-quantity';
import { MoneyInput, vndToNumber } from '../../../common/money/vietnamese-dong';

export class HrUserReferenceDto {
  @ApiProperty() id: string;
  @ApiProperty() fullName: string;
  @ApiPropertyOptional({ type: String, nullable: true }) branchId?: string | null;
}

export class HrBranchReferenceDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
}

export class AttendanceResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty({ type: String, format: 'date' }) date: string;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true }) checkIn?: string | null;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true }) checkOut?: string | null;
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: '7.5',
    pattern: '^-?\\d+(?:\\.\\d+)?$',
    description: 'Exact decimal hours',
  })
  hoursWorked?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) note?: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: string;
  @ApiPropertyOptional({ type: HrUserReferenceDto }) user?: HrUserReferenceDto;
}

export class WorkScheduleResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty() branchId: string;
  @ApiProperty({ type: String, format: 'date' }) date: string;
  @ApiProperty() shiftName: string;
  @ApiProperty({ example: '08:00' }) startTime: string;
  @ApiProperty({ example: '16:00' }) endTime: string;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: string;
  @ApiPropertyOptional({ type: HrUserReferenceDto }) user?: HrUserReferenceDto;
  @ApiPropertyOptional({ type: HrBranchReferenceDto }) branch?: HrBranchReferenceDto;
}

export class SalarySlipResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() userId: string;
  @ApiProperty({ minimum: 1, maximum: 12 }) month: number;
  @ApiProperty() year: number;
  @ApiProperty({ type: 'integer', description: 'Whole VND' }) baseSalary: number;
  @ApiProperty({ type: 'integer', description: 'Whole VND' }) bonus: number;
  @ApiProperty({ type: 'integer', description: 'Whole VND' }) deduction: number;
  @ApiProperty({ type: 'integer', description: 'Whole VND' }) netSalary: number;
  @ApiPropertyOptional({ type: String, nullable: true }) note?: string | null;
  @ApiProperty() isPaid: boolean;
  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true }) paidAt?: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: string;
  @ApiPropertyOptional({ type: HrUserReferenceDto }) user?: HrUserReferenceDto;
}

export class AnnouncementResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() title: string;
  @ApiProperty() content: string;
  @ApiProperty() authorId: string;
  @ApiProperty() isActive: boolean;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: string;
}

type AttendanceDecimalShape = { hoursWorked?: DecimalQuantityInput | null };

export function toAttendanceResponse<T extends AttendanceDecimalShape>(attendance: T) {
  return {
    ...attendance,
    hoursWorked:
      attendance.hoursWorked === null || attendance.hoursWorked === undefined
        ? null
        : decimalQuantityToString(attendance.hoursWorked),
  };
}

type SalaryMoneyShape = {
  baseSalary: MoneyInput;
  bonus: MoneyInput;
  deduction: MoneyInput;
  netSalary: MoneyInput;
};

export function toSalarySlipResponse<T extends SalaryMoneyShape>(slip: T) {
  return {
    ...slip,
    baseSalary: vndToNumber(slip.baseSalary),
    bonus: vndToNumber(slip.bonus),
    deduction: vndToNumber(slip.deduction),
    netSalary: vndToNumber(slip.netSalary),
  };
}
