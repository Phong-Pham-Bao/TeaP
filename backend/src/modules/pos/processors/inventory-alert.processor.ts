import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '../../../prisma/prisma.service';

interface AlertJobData {
  branchId: string;
  materialId: string;
  currentStock: number;
  minStock: number;
}

@Processor('inventory-alerts')
export class InventoryAlertProcessor {
  private readonly logger = new Logger(InventoryAlertProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process()
  async handleInventoryAlert(job: Job<AlertJobData>) {
    const { branchId, materialId, currentStock, minStock } = job.data;
    
    // Check real-time just in case
    const inventory = await this.prisma.inventory.findUnique({
      where: {
        branchId_materialId: {
          branchId,
          materialId,
        },
      },
      include: {
        branch: true,
        material: true,
      }
    });

    if (inventory && Number(inventory.currentStock) < Number(inventory.minStock)) {
      this.logger.warn(`[INVENTORY ALERT] Branch ${inventory.branch.name} - Material ${inventory.material.name} is low on stock! Current: ${inventory.currentStock}, Min: ${inventory.minStock}`);
      // In a real application, we might send an email or Telegram notification here.
    }
  }
}
