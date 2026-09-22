import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { QueryInventoryDto } from './dto/query-inventory.dto';
import { ImportStockDto } from './dto/import-stock.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { QueryLedgerDto } from './dto/query-ledger.dto';
import { Prisma, StockRefType } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryInventoryDto) {
    const { branchId, belowMin, skip, take } = query;

    const where: Prisma.InventoryWhereInput = {};
    if (branchId) {
      where.branchId = branchId;
    }
    // belowMin logic has to be handled custom if we need currentStock < minStock in Prisma directly
    // Unfortunately Prisma doesn't support field-to-field comparison in `where` (like `currentStock: { lt: prisma.inventory.fields.minStock }`)
    // so we can't easily filter belowMin using standard Prisma where without raw queries or filtering post-fetch.
    // However, if we just use raw SQL for everything it's hard. Let's do a trick: we'll get alerts using a separate endpoint for `currentStock < minStock`.
    // Wait, let's just fetch and if belowMin is true, we can either filter in JS (bad for pagination) or use queryRaw.
    // Actually, for getAlerts we definitely use raw or Prisma. Let's filter belowMin with a raw query if it's true, or fetch all then filter?
    // Wait, the prompt says: "belowMin (IsOptional, IsBoolean) — filter items below min_stock"
    // Let's implement it using raw SQL if belowMin is provided, or just fetch all and filter in JS if it's acceptable, but pagination makes JS filtering bad.
    // Actually, let's use Prisma query where we can. Prisma preview feature `fieldReference` supports this, but we don't know if it's enabled.
    // Let's use Prisma `queryRaw` for `findAll` if belowMin is true, or just use `findMany` and ignore field reference if we can't.
    // Actually, I'll just write it.

    // Better: let's just do findMany and if belowMin is true, we add a raw query filter if possible, but let's just use Prisma raw query for everything if belowMin is true to ensure correct pagination.
    if (belowMin) {
        // Just return alerts essentially.
        // Wait, I can use `findMany` and for belowMin we might just fetch and return, but let's stick to simple where if not belowMin.
        // I will use Prisma's `where` and if belowMin is true, we will just use a raw query or fetch all and filter (bad but safe if fieldRef not enabled).
        // Let's assume we can't do field comparison easily, I will use raw query for belowMin true.
    }
    
    // I will write it simply first.
    let items;
    let total;

    if (belowMin) {
       // use query raw
       const branchCondition = branchId ? Prisma.sql`AND i.branch_id = ${branchId}` : Prisma.empty;
       const countResult: any = await this.prisma.$queryRaw`
         SELECT COUNT(*)::int as count 
         FROM inventories i 
         WHERE i.current_stock < i.min_stock ${branchCondition}
       `;
       total = countResult[0].count;

       items = await this.prisma.$queryRaw`
         SELECT i.*, p.name as "materialName", b.name as "branchName"
         FROM inventories i
         JOIN products p ON i.material_id = p.id
         JOIN branches b ON i.branch_id = b.id
         WHERE i.current_stock < i.min_stock ${branchCondition}
         ORDER BY i.updated_at DESC
         LIMIT ${take} OFFSET ${skip}
       `;
    } else {
       total = await this.prisma.inventory.count({ where });
       items = await this.prisma.inventory.findMany({
         where,
         include: {
           material: { select: { name: true } },
           branch: { select: { name: true } },
         },
         skip,
         take,
         orderBy: { updatedAt: 'desc' },
       });
    }

    return {
      data: items,
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
        results.push({ materialId: item.materialId, balanceAfter });
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

      return { success: true, balanceAfter: newStock };
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

      return { success: true, sourceAfter, destAfter };
    });
  }

  async getAlerts(branchId?: string) {
    const branchCondition = branchId ? Prisma.sql`AND i.branch_id = ${branchId}` : Prisma.empty;
    const items = await this.prisma.$queryRaw`
      SELECT i.id, i.branch_id as "branchId", i.material_id as "materialId", 
             i.current_stock as "currentStock", i.min_stock as "minStock", i.unit,
             p.name as "materialName", b.name as "branchName"
      FROM inventories i
      JOIN products p ON i.material_id = p.id
      JOIN branches b ON i.branch_id = b.id
      WHERE i.current_stock < i.min_stock ${branchCondition}
      ORDER BY b.name ASC, p.name ASC
    `;
    return items;
  }

  async getLedger(query: QueryLedgerDto) {
    const { branchId, materialId, refType, startDate, endDate, skip, take } = query;

    const where: Prisma.StockLedgerWhereInput = {};
    if (branchId) where.branchId = branchId;
    if (materialId) where.materialId = materialId;
    if (refType) where.refType = refType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
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
      data: items,
      meta: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / (query.limit ?? 20)),
      },
    };
  }
}
