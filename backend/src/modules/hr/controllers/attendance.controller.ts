import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AttendanceService } from '../services/attendance.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { QueryAttendanceDto } from '../dto/query-attendance.dto';
import { CheckInDto } from '../dto/check-in.dto';

@ApiTags('HR')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @ApiOperation({ summary: 'Check in for today' })
  checkIn(@CurrentUser() user: any, @Body() dto: CheckInDto) {
    return this.attendanceService.checkIn(user.id, dto);
  }

  @Post('check-out')
  @ApiOperation({ summary: 'Check out for today' })
  checkOut(@CurrentUser() user: any, @Body() dto: CheckInDto) {
    return this.attendanceService.checkOut(user.id, dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.MANAGER, Role.HR)
  @ApiOperation({ summary: 'Get all attendance records (HR/Manager/Admin)' })
  findAll(@Query() query: QueryAttendanceDto) {
    return this.attendanceService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user attendance records' })
  getMyAttendance(
    @CurrentUser() user: any,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.attendanceService.getMyAttendance(user.id, month ? +month : undefined, year ? +year : undefined);
  }
}
