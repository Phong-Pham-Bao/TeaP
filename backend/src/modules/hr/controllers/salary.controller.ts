import { Controller, Post, Get, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SalaryService } from '../services/salary.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CreateSalarySlipDto } from '../dto/create-salary-slip.dto';
import { QuerySalaryDto } from '../dto/query-salary.dto';
import { ParseUUIDPipe } from '@nestjs/common';

@ApiTags('HR')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr/salary-slips')
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Create salary slip' })
  create(@Body() dto: CreateSalarySlipDto) {
    return this.salaryService.create(dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get all salary slips' })
  findAll(@Query() query: QuerySalaryDto) {
    return this.salaryService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my salary slips' })
  getMySlips(@CurrentUser() user: any) {
    return this.salaryService.getMySlips(user.id);
  }

  @Patch(':id/pay')
  @Roles(Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Mark salary slip as paid' })
  markAsPaid(@Param('id', ParseUUIDPipe) id: string) {
    return this.salaryService.markAsPaid(id);
  }
}
