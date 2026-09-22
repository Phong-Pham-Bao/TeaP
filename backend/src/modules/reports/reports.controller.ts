import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue report' })
  async getRevenueReport(@Query() query: ReportQueryDto) {
    return this.reportsService.getRevenueReport(query);
  }

  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @Get('top-products')
  @ApiOperation({ summary: 'Get top selling products' })
  async getTopProducts(@Query() query: ReportQueryDto) {
    return this.reportsService.getTopProducts(query);
  }

  @Roles(Role.MANAGER, Role.SUPER_ADMIN, Role.WAREHOUSE_STAFF)
  @Get('inventory-summary')
  @ApiOperation({ summary: 'Get inventory summary and status' })
  async getInventorySummary(@Query('branchId') branchId?: string) {
    return this.reportsService.getInventorySummary(branchId);
  }

  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @Get('cashier-performance')
  @ApiOperation({ summary: 'Get cashier performance' })
  async getCashierPerformance(@Query() query: ReportQueryDto) {
    return this.reportsService.getCashierPerformance(query);
  }

  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @Get('dashboard')
  @ApiOperation({ summary: 'Get overall dashboard summary' })
  async getDashboardSummary() {
    return this.reportsService.getDashboardSummary();
  }
}
