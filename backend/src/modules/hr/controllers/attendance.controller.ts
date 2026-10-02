import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AttendanceService } from '../services/attendance.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../../common/auth/permission-matrix';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { QueryAttendanceDto } from '../dto/query-attendance.dto';
import { CheckInDto } from '../dto/check-in.dto';
import { AuthenticatedActor } from '../../../common/types/authenticated-actor';
import { resolveBranchScope } from '../../../common/auth/branch-scope';
import { ApiPaginatedResponse } from '../../../common/decorators/api-paginated-response.decorator';
import { AttendanceResponseDto } from '../dto/hr-response.dto';

@ApiTags('HR')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_SELF)
  @ApiOperation({ summary: 'Check in for today' })
  @ApiCreatedResponse({ type: AttendanceResponseDto })
  checkIn(@CurrentUser() actor: AuthenticatedActor, @Body() dto: CheckInDto) {
    return this.attendanceService.checkIn(actor.userId, dto);
  }

  @Post('check-out')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_SELF)
  @ApiOperation({ summary: 'Check out for today' })
  @ApiCreatedResponse({ type: AttendanceResponseDto })
  checkOut(@CurrentUser() actor: AuthenticatedActor, @Body() dto: CheckInDto) {
    return this.attendanceService.checkOut(actor.userId, dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.ATTENDANCE_READ)
  @ApiOperation({ summary: 'Get all attendance records (HR/Manager/Admin)' })
  @ApiPaginatedResponse(AttendanceResponseDto)
  findAll(
    @Query() query: QueryAttendanceDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    query.branchId = resolveBranchScope(actor, query.branchId, [
      Role.SUPER_ADMIN,
      Role.HR,
    ]);
    return this.attendanceService.findAll(query);
  }

  @Get('me')
  @RequirePermissions(PERMISSIONS.ATTENDANCE_SELF)
  @ApiOperation({ summary: 'Get current user attendance records' })
  @ApiOkResponse({ type: [AttendanceResponseDto] })
  getMyAttendance(
    @CurrentUser() actor: AuthenticatedActor,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.attendanceService.getMyAttendance(
      actor.userId,
      month ? +month : undefined,
      year ? +year : undefined,
    );
  }
}
