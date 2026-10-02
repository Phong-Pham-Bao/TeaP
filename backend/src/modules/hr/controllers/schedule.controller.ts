import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { ScheduleService } from '../services/schedule.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../../common/auth/permission-matrix';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { QueryScheduleDto } from '../dto/query-schedule.dto';
import { ParseUUIDPipe } from '@nestjs/common';
import { AuthenticatedActor } from '../../../common/types/authenticated-actor';
import { resolveBranchScope } from '../../../common/auth/branch-scope';
import { ApiPaginatedResponse } from '../../../common/decorators/api-paginated-response.decorator';
import { WorkScheduleResponseDto } from '../dto/hr-response.dto';

@ApiTags('HR')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr/schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.SCHEDULE_WRITE)
  @ApiOperation({ summary: 'Create a work schedule' })
  @ApiCreatedResponse({ type: WorkScheduleResponseDto })
  create(
    @Body() dto: CreateScheduleDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    dto.branchId = resolveBranchScope(actor, dto.branchId, [
      Role.SUPER_ADMIN,
      Role.HR,
    ]) as string;
    return this.scheduleService.create(dto);
  }

  @Post('bulk')
  @RequirePermissions(PERMISSIONS.SCHEDULE_WRITE)
  @ApiOperation({ summary: 'Create multiple work schedules' })
  @ApiCreatedResponse({ type: [WorkScheduleResponseDto] })
  createBulk(
    @Body() dtos: CreateScheduleDto[],
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    for (const dto of dtos) {
      dto.branchId = resolveBranchScope(actor, dto.branchId, [
        Role.SUPER_ADMIN,
        Role.HR,
      ]) as string;
    }
    return this.scheduleService.createBulk(dtos);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.SCHEDULE_READ)
  @ApiOperation({ summary: 'Get all schedules' })
  @ApiPaginatedResponse(WorkScheduleResponseDto)
  findAll(
    @Query() query: QueryScheduleDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    query.branchId = resolveBranchScope(actor, query.branchId, [
      Role.SUPER_ADMIN,
      Role.HR,
    ]);
    return this.scheduleService.findAll(query);
  }

  @Get('me')
  @RequirePermissions(PERMISSIONS.SCHEDULE_SELF)
  @ApiOperation({ summary: 'Get my schedules' })
  @ApiOkResponse({ type: [WorkScheduleResponseDto] })
  getMySchedule(
    @CurrentUser() actor: AuthenticatedActor,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.scheduleService.getMySchedule(actor.userId, startDate, endDate);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.SCHEDULE_WRITE)
  @ApiOperation({ summary: 'Delete a schedule' })
  @ApiOkResponse({ type: WorkScheduleResponseDto })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    return this.scheduleService.remove(id, actor);
  }
}
