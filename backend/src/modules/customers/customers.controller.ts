import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '@prisma/client';

@ApiTags('Customers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(Role.CASHIER, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new customer' })
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @Roles(Role.CASHIER, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all customers with pagination and search' })
  findAll(@Query() query: QueryCustomerDto) {
    return this.customersService.findAll(query);
  }

  @Public()
  @Post('lookup')
  @ApiOperation({ summary: 'Lookup customer by phone number (Public for customer portal)' })
  findByPhone(@Body('phone') phone: string) {
    return this.customersService.findByPhone(phone);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new customer from customer portal' })
  register(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Public()
  @Post('redeem')
  @ApiOperation({ summary: 'Redeem points for voucher' })
  redeemPoints(@Body() body: { customerId: string; points: number; rewardTitle: string }) {
    return this.customersService.redeemPoints(body.customerId, body.points, body.rewardTitle);
  }

  @Get(':id')
  @Roles(Role.CASHIER, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get customer by ID with recent orders and point history' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update customer information' })
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Get(':id/points')
  @Roles(Role.CASHIER, Role.MANAGER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get point history for a customer' })
  getPointHistory(@Param('id') id: string, @Query() query: QueryCustomerDto) {
    return this.customersService.getPointHistory(id, query);
  }
}
