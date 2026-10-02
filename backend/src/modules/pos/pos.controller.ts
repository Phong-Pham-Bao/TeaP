import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiHeader,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { PosService } from './pos.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CheckoutDto } from './dto/checkout.dto';
import { QueryOrderDto } from './dto/query-order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/auth/permission-matrix';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';
import { AuthenticatedActor } from '../../common/types/authenticated-actor';
import { resolveBranchScope } from '../../common/auth/branch-scope';
import { CorrelationId } from '../../common/decorators/correlation-id.decorator';
import { OrderResponseDto } from './dto/order-response.dto';

@ApiTags('POS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pos')
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Post('orders')
  @RequirePermissions(PERMISSIONS.POS_ORDER_CREATE)
  @ApiOperation({ summary: 'Create a new POS order' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiCreatedResponse({ type: OrderResponseDto })
  async createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentUser() actor: AuthenticatedActor,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @CorrelationId() correlationId: string,
  ) {
    dto.branchId = resolveBranchScope(actor, dto.branchId) as string;
    return this.posService.createOrder(
      dto,
      actor,
      idempotencyKey,
      correlationId,
    );
  }

  @Post('orders/:id/checkout')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.POS_ORDER_CHECKOUT)
  @ApiOperation({ summary: 'Process checkout and payment for an order' })
  @ApiHeader({ name: 'Idempotency-Key', required: true })
  @ApiOkResponse({ type: OrderResponseDto })
  async checkout(
    @Param('id') id: string,
    @Body() dto: CheckoutDto,
    @CurrentUser() actor: AuthenticatedActor,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @CorrelationId() correlationId: string,
  ) {
    return this.posService.checkout(
      id,
      dto,
      actor,
      idempotencyKey,
      correlationId,
    );
  }

  @Post('orders/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.POS_ORDER_CANCEL)
  @ApiOperation({
    summary: 'Cancel an order and revert inventory/points with a reason',
  })
  async cancelOrder(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    return this.posService.cancelOrder(id, actor, reason);
  }

  @Get('orders')
  @RequirePermissions(PERMISSIONS.POS_ORDER_READ)
  @ApiOperation({ summary: 'Get list of POS orders' })
  @ApiPaginatedResponse(OrderResponseDto)
  async findAll(
    @Query() query: QueryOrderDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    query.branchId = resolveBranchScope(actor, query.branchId, [
      Role.SUPER_ADMIN,
      Role.ACCOUNTANT,
    ]);
    return this.posService.findAll(query);
  }

  @Get('orders/:id')
  @RequirePermissions(PERMISSIONS.POS_ORDER_READ)
  @ApiOperation({ summary: 'Get details of a specific order' })
  @ApiOkResponse({ type: OrderResponseDto })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    return this.posService.findOne(id, actor);
  }

  @Post('orders/:id/add-missing-item')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(PERMISSIONS.POS_ORDER_COMPENSATE)
  @ApiOperation({
    summary:
      'Store manager adds a missing or compensated item to an existing order',
  })
  async addMissingItem(
    @Param('id') id: string,
    @Body('item') item: any,
    @Body('note') note: string,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    return this.posService.addMissingItem(id, item, actor, note);
  }
}
