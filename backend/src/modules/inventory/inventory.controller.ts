import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { ImportStockDto } from './dto/import-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { QueryLedgerDto } from './dto/query-ledger.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Inventory')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @Roles(Role.WAREHOUSE_STAFF, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'List inventory' })
  findAll(@Query() query: QueryInventoryDto) {
    return this.inventoryService.findAll(query);
  }

  @Post('import')
  @Roles(Role.WAREHOUSE_STAFF, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Import stock' })
  importStock(@Body() dto: ImportStockDto, @CurrentUser('id') userId: string) {
    return this.inventoryService.importStock(dto, userId);
  }

  @Post('adjust')
  @Roles(Role.WAREHOUSE_STAFF, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Adjust stock' })
  adjustStock(@Body() dto: AdjustStockDto, @CurrentUser('id') userId: string) {
    return this.inventoryService.adjustStock(dto, userId);
  }

  @Post('transfer')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Transfer stock between branches' })
  transferStock(@Body() dto: TransferStockDto, @CurrentUser('id') userId: string) {
    return this.inventoryService.transferStock(dto, userId);
  }

  @Get('alerts')
  @Roles(Role.WAREHOUSE_STAFF, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get low stock alerts' })
  getAlerts(@Query('branchId') branchId?: string) {
    return this.inventoryService.getAlerts(branchId);
  }

  @Get('ledger')
  @Roles(Role.WAREHOUSE_STAFF, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get stock ledger history' })
  getLedger(@Query() query: QueryLedgerDto) {
    return this.inventoryService.getLedger(query);
  }
}
