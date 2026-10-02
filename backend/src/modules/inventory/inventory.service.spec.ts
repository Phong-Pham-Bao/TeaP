import { Prisma } from '@prisma/client';
import { InventoryService } from './inventory.service';
import { QueryInventoryDto } from './dto/query-inventory.dto';

describe('InventoryService contracts', () => {
  it('returns the same nested shape for below-minimum and normal inventory rows', async () => {
    const prisma = {
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([{ count: 1 }])
        .mockResolvedValueOnce([
          {
            id: 'inventory-1',
            branchId: 'branch-a',
            materialId: 'material-1',
            currentStock: new Prisma.Decimal(2),
            minStock: new Prisma.Decimal(5),
            unit: 'g',
            updatedAt: new Date('2026-09-27T00:00:00.000Z'),
            materialName: 'Trà đen',
            branchName: 'TeaP A',
          },
        ]),
    };
    const service = new InventoryService(prisma as never);
    const query = Object.assign(new QueryInventoryDto(), {
      branchId: 'branch-a',
      belowMin: true,
      page: 1,
      limit: 20,
    });

    await expect(service.findAll(query)).resolves.toMatchObject({
      data: [
        {
          id: 'inventory-1',
          material: { name: 'Trà đen' },
          branch: { name: 'TeaP A' },
        },
      ],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });
  });
});
