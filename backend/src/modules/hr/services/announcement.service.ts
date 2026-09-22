import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAnnouncementDto } from '../dto/create-announcement.dto';

@Injectable()
export class AnnouncementService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAnnouncementDto, authorId: string) {
    return this.prisma.announcement.create({
      data: {
        title: dto.title,
        content: dto.content,
        authorId,
      }
    });
  }

  async findAll() {
    return this.prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id, isActive: true }
    });
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }
    return announcement;
  }

  async remove(id: string) {
    const announcement = await this.prisma.announcement.findUnique({ where: { id } });
    if (!announcement) {
      throw new NotFoundException('Announcement not found');
    }
    return this.prisma.announcement.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
