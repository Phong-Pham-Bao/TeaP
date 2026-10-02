import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { ImportStockDto } from './dto/import-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { QueryLedgerDto } from './dto/query-ledger.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/auth/permission-matrix';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedActor } from '../../common/types/authenticated-actor';
import { resolveBranchScope } from '../../common/auth/branch-scope';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import {
  InventoryResponseDto,
  StockAdjustmentResponseDto,
  StockLedgerResponseDto,
  StockMutationItemResponseDto,
  StockTransferResponseDto,
} from './dto/inventory-response.dto';

@ApiTags('Inventory')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  @ApiOperation({ summary: 'List inventory' })
  @ApiPaginatedResponse(InventoryResponseDto)
  findAll(
    @Query() query: QueryInventoryDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    query.branchId = resolveBranchScope(actor, query.branchId);
    return this.inventoryService.findAll(query);
  }

  @Post('import')
  @RequirePermissions(PERMISSIONS.INVENTORY_RECEIVE)
  @ApiOperation({ summary: 'Import stock' })
  @ApiCreatedResponse({ type: [StockMutationItemResponseDto] })
  importStock(
    @Body() dto: ImportStockDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    dto.branchId = resolveBranchScope(actor, dto.branchId) as string;
    return this.inventoryService.importStock(dto, actor.userId);
  }

  @Post('adjust')
  @RequirePermissions(PERMISSIONS.INVENTORY_ADJUST)
  @ApiOperation({ summary: 'Adjust stock' })
  @ApiCreatedResponse({ type: StockAdjustmentResponseDto })
  adjustStock(
    @Body() dto: AdjustStockDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    dto.branchId = resolveBranchScope(actor, dto.branchId) as string;
    return this.inventoryService.adjustStock(dto, actor.userId);
  }

  @Post('transfer')
  @RequirePermissions(PERMISSIONS.INVENTORY_TRANSFER)
  @ApiOperation({ summary: 'Transfer stock between branches' })
  @ApiCreatedResponse({ type: StockTransferResponseDto })
  transferStock(
    @Body() dto: TransferStockDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    resolveBranchScope(actor, dto.fromBranchId);
    resolveBranchScope(actor, dto.toBranchId);
    return this.inventoryService.transferStock(dto, actor.userId);
  }

  @Get('alerts')
  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  @ApiOperation({ summary: 'Get low stock alerts' })
  @ApiOkResponse({ type: [InventoryResponseDto] })
  getAlerts(
    @Query('branchId') branchId: string | undefined,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    return this.inventoryService.getAlerts(resolveBranchScope(actor, branchId));
  }

  @Get('ledger')
  @RequirePermissions(PERMISSIONS.INVENTORY_READ)
  @ApiOperation({ summary: 'Get stock ledger history' })
  @ApiPaginatedResponse(StockLedgerResponseDto)
  getLedger(
    @Query() query: QueryLedgerDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    query.branchId = resolveBranchScope(actor, query.branchId);
    return this.inventoryService.getLedger(query);
  }
}
