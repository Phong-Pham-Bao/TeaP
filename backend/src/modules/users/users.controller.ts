import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/auth/permission-matrix';
import { ApiPaginatedResponse } from '../../common/decorators/api-paginated-response.decorator';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedActor } from '../../common/types/authenticated-actor';
import {
  DeletedUserResponseDto,
  UserResponseDto,
} from './dto/user-response.dto';
import { CorrelationId } from '../../common/decorators/correlation-id.decorator';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.USER_WRITE)
  @ApiCreatedResponse({ type: UserResponseDto })
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() actor: AuthenticatedActor,
    @CorrelationId() correlationId: string,
  ) {
    return this.usersService.create(createUserDto, actor, correlationId);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.USER_READ)
  @ApiPaginatedResponse(UserResponseDto)
  findAll(
    @Query() queryUserDto: QueryUserDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    return this.usersService.findAll(queryUserDto, actor);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.USER_READ)
  @ApiOkResponse({ type: UserResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedActor) {
    return this.usersService.findOne(id, actor);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.USER_WRITE)
  @ApiOkResponse({ type: UserResponseDto })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() actor: AuthenticatedActor,
    @CorrelationId() correlationId: string,
  ) {
    return this.usersService.update(id, updateUserDto, actor, correlationId);
  }

  @RequirePermissions(PERMISSIONS.USER_DELETE)
  @Delete(':id')
  @ApiOkResponse({ type: DeletedUserResponseDto })
  remove(
    @Param('id') id: string,
    @CurrentUser() actor: AuthenticatedActor,
    @CorrelationId() correlationId: string,
  ) {
    return this.usersService.remove(id, actor, correlationId);
  }
}
