import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { APP_GUARD } from '@nestjs/core';

// Core modules
import { PrismaModule } from './prisma/prisma.module';

// Guards
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BranchesModule } from './modules/branches/branches.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { RecipesModule } from './modules/recipes/recipes.module';
import { PosModule } from './modules/pos/pos.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CustomersModule } from './modules/customers/customers.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { HrModule } from './modules/hr/hr.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    // Environment configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Bull Queue (Redis-based)
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),

    // Core
    PrismaModule,

    // Feature modules
    AuthModule,
    UsersModule,
    BranchesModule,
    CategoriesModule,
    ProductsModule,
    RecipesModule,
    PosModule,
    InventoryModule,
    CustomersModule,
    PromotionsModule,
    HrModule,
    FinanceModule,
    ReportsModule,
  ],
  providers: [
    // Global JWT Auth guard — all routes require auth by default
    // Use @Public() decorator to skip auth for specific routes
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global Roles guard — checks @Roles() decorator
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
