import { Controller, Post, Body, Get, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PosService } from './pos.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';

@ApiTags('POS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('orders')
  @Roles(Role.CASHIER, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new POS order' })
  async createOrder(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    return this.posService.createOrder(dto, user.userId || user.id);
  }

  @Post('orders/:id/checkout')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.CASHIER, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Process checkout and payment for an order' })
  async checkout(
    @Param('id') id: string,
    @Body() dto: CheckoutDto,
    @CurrentUser() user: any
  ) {
    return this.posService.checkout(id, dto, user.userId || user.id);
  }

  @Post('orders/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.CASHIER, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Cancel an order and revert inventory/points with a reason' })
  async cancelOrder(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any
  ) {
    return this.posService.cancelOrder(id, user.userId || user.id, reason);
  }

  @Get('orders')
  @Roles(Role.CASHIER, Role.MANAGER, Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get list of POS orders' })
  async findAll(@Query() query: QueryOrderDto) {
    return this.posService.findAll(query);
  }

  @Get('orders/:id')
  @Roles(Role.CASHIER, Role.MANAGER, Role.SUPER_ADMIN, Role.ACCOUNTANT)
  @ApiOperation({ summary: 'Get details of a specific order' })
  async findOne(@Param('id') id: string) {
    return this.posService.findOne(id);
  }

  @Post('orders/:id/add-missing-item')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Store manager adds a missing or compensated item to an existing order' })
  async addMissingItem(
    @Param('id') id: string,
    @Body('item') item: any,
    @Body('note') note: string,
    @CurrentUser() user: any
  ) {
    return this.posService.addMissingItem(id, item, user.userId || user.id, note);
  }
}
