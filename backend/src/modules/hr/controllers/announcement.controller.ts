import { Controller, Post, Get, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnnouncementService } from '../services/announcement.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { CreateAnnouncementDto } from '../dto/create-announcement.dto';
import { ParseUUIDPipe } from '@nestjs/common';

@ApiTags('HR')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr/announcements')
export class AnnouncementController {
  constructor(private readonly announcementService: AnnouncementService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Create an announcement' })
  create(@Body() dto: CreateAnnouncementDto, @CurrentUser() user: any) {
    return this.announcementService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all active announcements' })
  findAll() {
    return this.announcementService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an announcement by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.announcementService.findOne(id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @ApiOperation({ summary: 'Delete an announcement' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.announcementService.remove(id);
  }
}
