import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AnnouncementService } from '../services/announcement.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../../common/auth/permission-matrix';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CreateAnnouncementDto } from '../dto/create-announcement.dto';
import { ParseUUIDPipe } from '@nestjs/common';
import { AuthenticatedActor } from '../../../common/types/authenticated-actor';
import { AnnouncementResponseDto } from '../dto/hr-response.dto';

@ApiTags('HR')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr/announcements')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENT_WRITE)
  @ApiOperation({ summary: 'Create an announcement' })
  @ApiCreatedResponse({ type: AnnouncementResponseDto })
  create(
    @Body() dto: CreateAnnouncementDto,
    @CurrentUser() actor: AuthenticatedActor,
  ) {
    return this.announcementService.create(dto, actor.userId);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENT_READ)
  @ApiOperation({ summary: 'Get all active announcements' })
  @ApiOkResponse({ type: [AnnouncementResponseDto] })
  findAll() {
    return this.announcementService.findAll();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENT_READ)
  @ApiOperation({ summary: 'Get an announcement by id' })
  @ApiOkResponse({ type: AnnouncementResponseDto })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.announcementService.findOne(id);
  }

  @Delete(':id')
  @RequirePermissions(PERMISSIONS.ANNOUNCEMENT_WRITE)
  @ApiOperation({ summary: 'Delete an announcement' })
  @ApiOkResponse({ type: AnnouncementResponseDto })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.announcementService.remove(id);
  }
}
