import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Promotions')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new promotion' })
  create(@Body() createPromotionDto: CreatePromotionDto) {
    return this.promotionsService.create(createPromotionDto);
  }

  @Get()
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all promotions' })
  findAll() {
    return this.promotionsService.findAll();
  }

  @Get('active')
  @Roles(Role.CASHIER, Role.MANAGER)
  @ApiOperation({ summary: 'Get all active promotions within valid date range' })
  findActive() {
    return this.promotionsService.findActive();
  }

  @Get(':id')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get a promotion by ID' })
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a promotion' })
  update(@Param('id') id: string, @Body() updatePromotionDto: UpdatePromotionDto) {
    return this.promotionsService.update(id, updatePromotionDto);
  }

  @Post(':id/deactivate')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Deactivate a promotion' })
  deactivate(@Param('id') id: string) {
    return this.promotionsService.deactivate(id);
  }
}
