import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { QueryCustomerDto } from './dto/query-customer.dto';
import { LookupCustomerDto } from './dto/lookup-customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/auth/permission-matrix';

@ApiTags('Customers')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.CUSTOMER_CREATE)
  @ApiOperation({ summary: 'Create a new customer' })
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.CUSTOMER_READ)
  @ApiOperation({ summary: 'Get all customers with pagination and search' })
  findAll(@Query() query: QueryCustomerDto) {
    return this.customersService.findAll(query);
  }

  @Post('lookup')
  @RequirePermissions(PERMISSIONS.CUSTOMER_READ)
  @ApiOperation({
    summary: 'Lookup the minimum customer profile needed at POS',
  })
  findByPhone(@Body() dto: LookupCustomerDto) {
    return this.customersService.findByPhone(dto.phone);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CUSTOMER_READ)
  @ApiOperation({
    summary: 'Get customer by ID with recent orders and point history',
  })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.CUSTOMER_UPDATE)
  @ApiOperation({ summary: 'Update customer information' })
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Get(':id/points')
  @RequirePermissions(PERMISSIONS.CUSTOMER_READ)
  @ApiOperation({ summary: 'Get point history for a customer' })
  getPointHistory(@Param('id') id: string, @Query() query: QueryCustomerDto) {
    return this.customersService.getPointHistory(id, query);
  }
}
