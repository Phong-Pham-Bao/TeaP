import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CreateCashFlowDto } from './dto/create-cash-flow.dto';
import { QueryCashFlowDto } from './dto/query-cash-flow.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Finance')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('cash-flows')
  @Roles(Role.ACCOUNTANT, Role.MANAGER)
  @ApiOperation({ summary: 'Create a cash flow entry' })
  create(
    @Body() createCashFlowDto: CreateCashFlowDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.financeService.create(createCashFlowDto, userId);
  }

  @Get('cash-flows')
  @Roles(Role.ACCOUNTANT, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all cash flows with filters and pagination' })
  findAll(@Query() query: QueryCashFlowDto) {
    return this.financeService.findAll(query);
  }

  @Get('summary')
  @Roles(Role.ACCOUNTANT, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get financial summary' })
  getSummary(
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getSummary(branchId, startDate, endDate);
  }
}
