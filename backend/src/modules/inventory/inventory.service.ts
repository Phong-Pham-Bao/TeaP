import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { ImportStockDto } from './dto/import-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { QueryLedgerDto } from './dto/query-ledger.dto';
import { Prisma, StockRefType } from '@prisma/client';
import { businessTimestampRange } from '../../common/time/business-time';
import { decimalQuantityToString } from '../../common/quantity/decimal-quantity';
import {
  toBalanceResponse,
  toInventoryResponse,
  toStockLedgerResponse,
} from './dto/inventory-response.dto';

interface InventoryBelowMinimumRow {
  id: string;
  branchId: string;
  materialId: string;
  currentStock: Prisma.Decimal;
  minStock: Prisma.Decimal;
  unit: string;
  updatedAt: Date;
  materialSku: string;
  materialName: string;
  branchName: string;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryInventoryDto) {
    const { branchId, belowMin, skip, take } = query;

    const where: Prisma.InventoryWhereInput = {};
    if (branchId) {
      where.branchId = branchId;
    }
    let items;
    let total;

    if (belowMin) {
      const branchCondition = branchId
        ? Prisma.sql`AND i.branch_id = ${branchId}`
        : Prisma.empty;
      const countResult = await this.prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*)::int as count
        FROM inventories i
        WHERE i.current_stock < i.min_stock ${branchCondition}
      `;
      total = countResult[0]?.count ?? 0;

      const rows = await this.prisma.$queryRaw<InventoryBelowMinimumRow[]>`
        SELECT i.id,
               i.branch_id AS "branchId",
               i.material_id AS "materialId",
               i.current_stock AS "currentStock",
               i.min_stock AS "minStock",
               i.unit,
               i.updated_at AS "updatedAt",
               p.sku AS "materialSku",
               p.name AS "materialName",
               b.name AS "branchName"
        FROM inventories i
        JOIN products p ON i.material_id = p.id
        JOIN branches b ON i.branch_id = b.id
        WHERE i.current_stock < i.min_stock ${branchCondition}
        ORDER BY i.updated_at DESC
        LIMIT ${take} OFFSET ${skip}
      `;
      items = rows.map(({ materialSku, materialName, branchName, ...inventory }) => ({
        ...inventory,
        material: { sku: materialSku, name: materialName },
        branch: { name: branchName },
      }));
    } else {
       total = await this.prisma.inventory.count({ where });
       items = await this.prisma.inventory.findMany({
         where,
         include: {
           material: { select: { sku: true, name: true } },
           branch: { select: { name: true } },
         },
         skip,
         take,
         orderBy: { updatedAt: 'desc' },
       });
    }

    return {
      data: items.map(toInventoryResponse),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / (query.limit ?? 20)),
      },
    };
  }

  async importStock(dto: ImportStockDto, userId: string) {
    return await this.prisma.$transaction(async (prisma) => {
      const results = [];
      for (const item of dto.items) {
        // Lock or create
        // Wait, Prisma doesn't have true pessimistic lock on upsert. We will use queryRaw for SELECT ... FOR UPDATE
        const existing: any[] = await prisma.$queryRaw`
          SELECT id, current_stock FROM inventories
          WHERE branch_id = ${dto.branchId} AND material_id = ${item.materialId}
          FOR UPDATE
        `;

        let inventoryId;
        let balanceAfter = new Prisma.Decimal(item.quantity);

        if (existing.length > 0) {
          inventoryId = existing[0].id;
          balanceAfter = new Prisma.Decimal(existing[0].current_stock).add(item.quantity);
          
          await prisma.$executeRaw`
            UPDATE inventories 
            SET current_stock = ${balanceAfter}, updated_at = NOW()
            WHERE id = ${inventoryId}
          `;
        } else {
          const created = await prisma.inventory.create({
            data: {
              branchId: dto.branchId,
              materialId: item.materialId,
              currentStock: item.quantity,
              minStock: 0,
              unit: item.unit,
            },
          });
          inventoryId = created.id;
        }

        // Create ledger
        await prisma.stockLedger.create({
          data: {
            branchId: dto.branchId,
            materialId: item.materialId,
            inventoryId,
            changeQty: item.quantity,
            balanceAfter,
            refType: StockRefType.IMPORT,
            note: dto.note,
            createdBy: userId,
          },
        });
        results.push(toBalanceResponse({ materialId: item.materialId, balanceAfter }));
      }
      return results;
    });
  }

  async adjustStock(dto: AdjustStockDto, userId: string) {
    return await this.prisma.$transaction(async (prisma) => {
      const existing: any[] = await prisma.$queryRaw`
        SELECT id, current_stock FROM inventories
        WHERE branch_id = ${dto.branchId} AND material_id = ${dto.materialId}
        FOR UPDATE
      `;

      if (existing.length === 0) {
        throw new NotFoundException('Inventory record not found');
      }

      const currentStock = new Prisma.Decimal(existing[0].current_stock);
      const newStock = new Prisma.Decimal(dto.newStock);
      const changeQty = newStock.sub(currentStock);

      await prisma.$executeRaw`
        UPDATE inventories
        SET current_stock = ${newStock}, updated_at = NOW()
        WHERE id = ${existing[0].id}
      `;

      await prisma.stockLedger.create({
        data: {
          branchId: dto.branchId,
          materialId: dto.materialId,
          inventoryId: existing[0].id,
          changeQty,
          balanceAfter: newStock,
          refType: StockRefType.ADJUSTMENT,
          note: dto.note,
          createdBy: userId,
        },
      });

      return toBalanceResponse({ success: true, balanceAfter: newStock });
    });
  }

  async transferStock(dto: TransferStockDto, userId: string) {
    if (dto.fromBranchId === dto.toBranchId) {
      throw new BadRequestException('Cannot transfer to the same branch');
    }

    return await this.prisma.$transaction(async (prisma) => {
      // Lock both inventories, ordering by branchId to avoid deadlocks
      const branchIds = [dto.fromBranchId, dto.toBranchId].sort();
      
      const records: any[] = await prisma.$queryRaw`
        SELECT id, branch_id, current_stock, unit FROM inventories
        WHERE branch_id IN (${branchIds[0]}, ${branchIds[1]}) 
        AND material_id = ${dto.materialId}
        ORDER BY branch_id
        FOR UPDATE
      `;

      const sourceInv = records.find(r => r.branch_id === dto.fromBranchId);
      const destInv = records.find(r => r.branch_id === dto.toBranchId);

      if (!sourceInv) {
        throw new NotFoundException('Source inventory not found');
      }

      const sourceCurrent = new Prisma.Decimal(sourceInv.current_stock);
      const transferQty = new Prisma.Decimal(dto.quantity);

      if (sourceCurrent.lessThan(transferQty)) {
        throw new BadRequestException('Insufficient stock in source branch');
      }

      const sourceAfter = sourceCurrent.sub(transferQty);
      
      await prisma.$executeRaw`
        UPDATE inventories SET current_stock = ${sourceAfter}, updated_at = NOW()
        WHERE id = ${sourceInv.id}
      `;

      await prisma.stockLedger.create({
        data: {
          branchId: dto.fromBranchId,
          materialId: dto.materialId,
          inventoryId: sourceInv.id,
          changeQty: transferQty.negated(),
          balanceAfter: sourceAfter,
          refType: StockRefType.TRANSFER_OUT,
          note: dto.note,
          createdBy: userId,
        },
      });

      let destAfter;
      if (destInv) {
        const destCurrent = new Prisma.Decimal(destInv.current_stock);
        destAfter = destCurrent.add(transferQty);
        
        await prisma.$executeRaw`
          UPDATE inventories SET current_stock = ${destAfter}, updated_at = NOW()
          WHERE id = ${destInv.id}
        `;
        
        await prisma.stockLedger.create({
          data: {
            branchId: dto.toBranchId,
            materialId: dto.materialId,
            inventoryId: destInv.id,
            changeQty: transferQty,
            balanceAfter: destAfter,
            refType: StockRefType.TRANSFER_IN,
            note: dto.note,
            createdBy: userId,
          },
        });
      } else {
        destAfter = transferQty;
        const newDest = await prisma.inventory.create({
          data: {
            branchId: dto.toBranchId,
            materialId: dto.materialId,
            currentStock: destAfter,
            minStock: 0,
            unit: sourceInv.unit,
          }
        });

        await prisma.stockLedger.create({
          data: {
            branchId: dto.toBranchId,
            materialId: dto.materialId,
            inventoryId: newDest.id,
            changeQty: transferQty,
            balanceAfter: destAfter,
            refType: StockRefType.TRANSFER_IN,
            note: dto.note,
            createdBy: userId,
          },
        });
      }

      return {
        success: true,
        sourceAfter: decimalQuantityToString(sourceAfter),
        destAfter: decimalQuantityToString(destAfter),
      };
    });
  }

  async getAlerts(branchId?: string) {
    const branchCondition = branchId ? Prisma.sql`AND i.branch_id = ${branchId}` : Prisma.empty;
    const items = await this.prisma.$queryRaw`
      SELECT i.id, i.branch_id as "branchId", i.material_id as "materialId", 
             i.current_stock as "currentStock", i.min_stock as "minStock", i.unit,
             i.updated_at as "updatedAt", p.sku as "materialSku",
             p.name as "materialName", b.name as "branchName"
      FROM inventories i
      JOIN products p ON i.material_id = p.id
      JOIN branches b ON i.branch_id = b.id
      WHERE i.current_stock < i.min_stock ${branchCondition}
      ORDER BY b.name ASC, p.name ASC
    `;
    return (items as InventoryBelowMinimumRow[]).map((item) => ({
      id: item.id,
      branchId: item.branchId,
      materialId: item.materialId,
      currentStock: decimalQuantityToString(item.currentStock),
      minStock: decimalQuantityToString(item.minStock),
      unit: item.unit,
      updatedAt: item.updatedAt,
      material: { sku: item.materialSku, name: item.materialName },
      branch: { name: item.branchName },
    }));
  }

  async getLedger(query: QueryLedgerDto) {
    const { branchId, materialId, refType, startDate, endDate, skip, take } = query;

    const where: Prisma.StockLedgerWhereInput = {};
    if (branchId) where.branchId = branchId;
    if (materialId) where.materialId = materialId;
    if (refType) where.refType = refType;
    if (startDate || endDate) {
      where.createdAt = businessTimestampRange(startDate, endDate);
    }

    const total = await this.prisma.stockLedger.count({ where });
    const items = await this.prisma.stockLedger.findMany({
      where,
      include: {
        branch: { select: { name: true } },
        inventory: {
          include: {
            material: { select: { name: true } }
          }
        }
      },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: items.map(toStockLedgerResponse),
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / (query.limit ?? 20)),
      },
    };
  }
}
