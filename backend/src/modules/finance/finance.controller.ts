import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { CreateCashFlowDto } from './dto/create-cash-flow.dto';
import { QueryCashFlowDto } from './dto/query-cash-flow.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/auth/permission-matrix';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { AuthenticatedActor } from '../../common/types/authenticated-actor';
import { resolveBranchScope } from '../../common/auth/branch-scope';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import {
  CashFlowResponseDto,
  CashFlowDateSummaryDto,
  CashFlowSummaryResponseDto,
} from './dto/cash-flow-response.dto';

@ApiTags('Finance')
@ApiExtraModels(CashFlowDateSummaryDto)
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('cash-flows')
  @RequirePermissions(PERMISSIONS.FINANCE_CASH_FLOW_CREATE)
  @ApiOperation({ summary: 'Create a cash flow entry' })
  @ApiCreatedResponse({ type: CashFlowResponseDto })
  create(
    @Body() createCashFlowDto: CreateCashFlowDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    createCashFlowDto.branchId = resolveBranchScope(
      actor,
      createCashFlowDto.branchId,
      [Role.SUPER_ADMIN, Role.ACCOUNTANT],
    ) as string;
    return this.financeService.create(createCashFlowDto, actor.userId);
  }

  @Get('cash-flows')
  @RequirePermissions(PERMISSIONS.FINANCE_CASH_FLOW_READ)
  @ApiOperation({ summary: 'Get all cash flows with filters and pagination' })
  @ApiPaginatedResponse(CashFlowResponseDto)
  findAll(
    @Query() query: QueryCashFlowDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    query.branchId = resolveBranchScope(actor, query.branchId, [
      Role.SUPER_ADMIN,
      Role.ACCOUNTANT,
    ]);
    return this.financeService.findAll(query);
  }

  @Get('summary')
  @RequirePermissions(PERMISSIONS.FINANCE_SUMMARY_READ)
  @ApiOperation({ summary: 'Get financial summary' })
  @ApiOkResponse({ type: CashFlowSummaryResponseDto })
  getSummary(
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.getSummary(branchId, startDate, endDate);
  }
}
