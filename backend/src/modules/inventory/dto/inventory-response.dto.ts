import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StockRefType } from '@prisma/client';
import {
  DecimalQuantityInput,
  decimalQuantityToString,
} from '../../../common/quantity/decimal-quantity';

export class InventoryMaterialResponseDto {
  @ApiPropertyOptional() sku?: string;
  @ApiProperty() name: string;
}

export class InventoryBranchResponseDto {
  @ApiPropertyOptional() id?: string;
  @ApiProperty() name: string;
}

export class InventoryResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() branchId: string;
  @ApiProperty() materialId: string;
  @ApiProperty({ type: 'string', example: '1250.5', pattern: '^-?\\d+(?:\\.\\d+)?$' })
  currentStock: string;
  @ApiProperty({ type: 'string', example: '250', pattern: '^-?\\d+(?:\\.\\d+)?$' })
  minStock: string;
  @ApiProperty() unit: string;
  @ApiProperty({ type: String, format: 'date-time' }) updatedAt: string;
  @ApiProperty({ type: InventoryMaterialResponseDto }) material: InventoryMaterialResponseDto;
  @ApiProperty({ type: InventoryBranchResponseDto }) branch: InventoryBranchResponseDto;
}

export class StockLedgerResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() branchId: string;
  @ApiProperty() materialId: string;
  @ApiProperty() inventoryId: string;
  @ApiProperty({ type: 'string', example: '-25.5', pattern: '^-?\\d+(?:\\.\\d+)?$' })
  changeQty: string;
  @ApiProperty({ type: 'string', example: '1225', pattern: '^-?\\d+(?:\\.\\d+)?$' })
  balanceAfter: string;
  @ApiProperty({ enum: StockRefType }) refType: StockRefType;
  @ApiPropertyOptional({ type: String, nullable: true }) refId?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) note?: string | null;
  @ApiPropertyOptional({ type: String, nullable: true }) createdBy?: string | null;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt: string;
  @ApiPropertyOptional({ type: InventoryBranchResponseDto }) branch?: InventoryBranchResponseDto;
}

export class StockMutationItemResponseDto {
  @ApiPropertyOptional() materialId?: string;
  @ApiProperty({ type: 'string', example: '1250.5', pattern: '^-?\\d+(?:\\.\\d+)?$' })
  balanceAfter: string;
}

export class StockAdjustmentResponseDto extends StockMutationItemResponseDto {
  @ApiProperty() success: boolean;
}

export class StockTransferResponseDto {
  @ApiProperty() success: boolean;
  @ApiProperty({ type: 'string', example: '1000', pattern: '^-?\\d+(?:\\.\\d+)?$' })
  sourceAfter: string;
  @ApiProperty({ type: 'string', example: '250.5', pattern: '^-?\\d+(?:\\.\\d+)?$' })
  destAfter: string;
}

type InventoryQuantityShape = {
  currentStock: DecimalQuantityInput;
  minStock: DecimalQuantityInput;
};

export function toInventoryResponse<T extends InventoryQuantityShape>(inventory: T) {
  return {
    ...inventory,
    currentStock: decimalQuantityToString(inventory.currentStock),
    minStock: decimalQuantityToString(inventory.minStock),
  };
}

type LedgerQuantityShape = {
  changeQty: DecimalQuantityInput;
  balanceAfter: DecimalQuantityInput;
};

export function toStockLedgerResponse<T extends LedgerQuantityShape>(entry: T) {
  return {
    ...entry,
    changeQty: decimalQuantityToString(entry.changeQty),
    balanceAfter: decimalQuantityToString(entry.balanceAfter),
  };
}

export function toBalanceResponse<T extends { balanceAfter: DecimalQuantityInput }>(value: T) {
  return { ...value, balanceAfter: decimalQuantityToString(value.balanceAfter) };
}
