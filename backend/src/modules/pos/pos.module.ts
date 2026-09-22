import { Module } from '@nestjs/common';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { BullModule } from '@nestjs/bull';
import { InventoryAlertProcessor } from './processors/inventory-alert.processor';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({
      name: 'inventory-alerts',
    }),
  ],
  controllers: [PosController],
  providers: [PosService, InventoryAlertProcessor],
})
export class PosModule {}
