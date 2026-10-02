import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/auth/permission-matrix';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedActor } from '../../common/types/authenticated-actor';
import {
  assertBranchScope,
  getAssignedBranchIds,
} from '../../common/auth/branch-scope';
import { BranchResponseDto } from './dto/branch-response.dto';

@ApiTags('Branches')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @RequirePermissions(PERMISSIONS.BRANCH_WRITE)
  @Post()
  @ApiCreatedResponse({ type: BranchResponseDto })
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @RequirePermissions(PERMISSIONS.BRANCH_READ)
  @Get()
  @ApiOkResponse({ type: [BranchResponseDto] })
  findAll(@CurrentUser() actor: AuthenticatedActor) {
    return this.branchesService.findAll(
      actor.role === Role.SUPER_ADMIN ? undefined : getAssignedBranchIds(actor),
    );
  }

  @RequirePermissions(PERMISSIONS.BRANCH_READ)
  @Get(':id')
  @ApiOkResponse({ type: BranchResponseDto })
  findOne(@Param('id') id: string, @CurrentUser() actor: AuthenticatedActor) {
    assertBranchScope(actor, id);
    return this.branchesService.findOne(id);
  }

  @RequirePermissions(PERMISSIONS.BRANCH_WRITE)
  @Patch(':id')
  @ApiOkResponse({ type: BranchResponseDto })
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @RequirePermissions(PERMISSIONS.BRANCH_WRITE)
  @Delete(':id')
  @ApiOkResponse({ type: BranchResponseDto })
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }
}
