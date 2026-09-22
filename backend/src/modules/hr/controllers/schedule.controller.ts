import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ScheduleService } from '../services/schedule.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { QueryScheduleDto } from '../dto/query-schedule.dto';
import { ParseUUIDPipe } from '@nestjs/common';

@ApiTags('HR')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr/schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.MANAGER, Role.HR)
  @ApiOperation({ summary: 'Create a work schedule' })
  create(@Body() dto: CreateScheduleDto) {
    return this.scheduleService.create(dto);
  }

  @Post('bulk')
  @Roles(Role.SUPER_ADMIN, Role.MANAGER, Role.HR)
  @ApiOperation({ summary: 'Create multiple work schedules' })
  createBulk(@Body() dtos: CreateScheduleDto[]) {
    return this.scheduleService.createBulk(dtos);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.MANAGER, Role.HR)
  @ApiOperation({ summary: 'Get all schedules' })
  findAll(@Query() query: QueryScheduleDto) {
    return this.scheduleService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my schedules' })
  getMySchedule(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.scheduleService.getMySchedule(user.id, startDate, endDate);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.MANAGER, Role.HR)
  @ApiOperation({ summary: 'Delete a schedule' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.scheduleService.remove(id);
  }
}
