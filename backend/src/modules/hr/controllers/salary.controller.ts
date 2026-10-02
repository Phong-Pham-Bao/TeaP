import {
  Controller,
  Post,
  Get,
  Patch,
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
import { SalaryService } from '../services/salary.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../../common/auth/permission-matrix';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CreateSalarySlipDto } from '../dto/create-salary-slip.dto';
import { QuerySalaryDto } from '../dto/query-salary.dto';
import { ParseUUIDPipe } from '@nestjs/common';
import { AuthenticatedActor } from '../../../common/types/authenticated-actor';
import { ApiPaginatedResponse } from '../../../common/decorators/api-paginated-response.decorator';
import { SalarySlipResponseDto } from '../dto/hr-response.dto';

@ApiTags('HR')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr/salary-slips')
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.SALARY_WRITE)
  @ApiOperation({ summary: 'Create salary slip' })
  @ApiCreatedResponse({ type: SalarySlipResponseDto })
  create(@Body() dto: CreateSalarySlipDto) {
    return this.salaryService.create(dto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.SALARY_READ)
  @ApiOperation({ summary: 'Get all salary slips' })
  @ApiPaginatedResponse(SalarySlipResponseDto)
  findAll(@Query() query: QuerySalaryDto) {
    return this.salaryService.findAll(query);
  }

  @Get('me')
  @RequirePermissions(PERMISSIONS.SALARY_SELF)
  @ApiOperation({ summary: 'Get my salary slips' })
  @ApiOkResponse({ type: [SalarySlipResponseDto] })
  getMySlips(@CurrentUser() actor: AuthenticatedActor) {
    return this.salaryService.getMySlips(actor.userId);
  }

  @Patch(':id/pay')
  @RequirePermissions(PERMISSIONS.SALARY_WRITE)
  @ApiOperation({ summary: 'Mark salary slip as paid' })
  @ApiOkResponse({ type: SalarySlipResponseDto })
  markAsPaid(@Param('id', ParseUUIDPipe) id: string) {
    return this.salaryService.markAsPaid(id);
  }
}
