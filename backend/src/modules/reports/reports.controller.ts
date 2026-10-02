import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/auth/permission-matrix';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedActor } from '../../common/types/authenticated-actor';
import { resolveBranchScope } from '../../common/auth/branch-scope';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @RequirePermissions(PERMISSIONS.REPORT_SALES_READ)
  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue report' })
  async getRevenueReport(
    @Query() query: ReportQueryDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    query.branchId = resolveBranchScope(actor, query.branchId);
    return this.reportsService.getRevenueReport(query);
  }

  @RequirePermissions(PERMISSIONS.REPORT_SALES_READ)
  @Get('top-products')
  @ApiOperation({ summary: 'Get top selling products' })
  async getTopProducts(
    @Query() query: ReportQueryDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    query.branchId = resolveBranchScope(actor, query.branchId);
    return this.reportsService.getTopProducts(query);
  }

  @RequirePermissions(PERMISSIONS.REPORT_INVENTORY_READ)
  @Get('inventory-summary')
  @ApiOperation({ summary: 'Get inventory summary and status' })
  async getInventorySummary(
    @Query('branchId') branchId: string | undefined,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    return this.reportsService.getInventorySummary(
      resolveBranchScope(actor, branchId),
    );
  }

  @RequirePermissions(PERMISSIONS.REPORT_SALES_READ)
  @Get('cashier-performance')
  @ApiOperation({ summary: 'Get cashier performance' })
  async getCashierPerformance(
    @Query() query: ReportQueryDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    query.branchId = resolveBranchScope(actor, query.branchId);
    return this.reportsService.getCashierPerformance(query);
  }

  @RequirePermissions(PERMISSIONS.REPORT_SALES_READ)
  @Get('dashboard')
  @ApiOperation({ summary: 'Get overall dashboard summary' })
  async getDashboardSummary(@CurrentUser() actor: AuthenticatedActor) {
    const branchId = resolveBranchScope(actor);
    return this.reportsService.getDashboardSummary(branchId);
  }
}
