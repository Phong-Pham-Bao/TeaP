import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/auth/permission-matrix';

@ApiTags('Promotions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.PROMOTION_WRITE)
  @ApiOperation({ summary: 'Create a new promotion' })
  create(@Body() createPromotionDto: CreatePromotionDto) {
    return this.promotionsService.create(createPromotionDto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.PROMOTION_READ)
  @ApiOperation({ summary: 'Get all promotions' })
  findAll() {
    return this.promotionsService.findAll();
  }

  @Get('active')
  @RequirePermissions(PERMISSIONS.PROMOTION_ACTIVE_READ)
  @ApiOperation({
    summary: 'Get all active promotions within valid date range',
  })
  findActive() {
    return this.promotionsService.findActive();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PROMOTION_READ)
  @ApiOperation({ summary: 'Get a promotion by ID' })
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.PROMOTION_WRITE)
  @ApiOperation({ summary: 'Update a promotion' })
  update(
    @Param('id') id: string,
    @Body() updatePromotionDto: UpdatePromotionDto,
  ) {
    return this.promotionsService.update(id, updatePromotionDto);
  }

  @Post(':id/deactivate')
  @RequirePermissions(PERMISSIONS.PROMOTION_WRITE)
  @ApiOperation({ summary: 'Deactivate a promotion' })
  deactivate(@Param('id') id: string) {
    return this.promotionsService.deactivate(id);
  }
}
