import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBranchDto: CreateBranchDto) {
    const existing = await this.prisma.branch.findFirst({
      where: {
        name: { equals: createBranchDto.name.trim(), mode: 'insensitive' },
        isActive: true,
      },
    });
    if (existing) {
      throw new BadRequestException('Tên chi nhánh đã tồn tại');
    }

    return this.prisma.branch.create({
      data: { ...createBranchDto, name: createBranchDto.name.trim() },
    });
  }

  async findAll(branchIds?: string[]) {
    const branches = await this.prisma.branch.findMany({
      where: {
        isActive: true,
        ...(branchIds ? { id: { in: branchIds } } : {}),
      },
      include: {
        _count: {
          select: { users: true, orders: true, inventories: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const uniqueBranches = new Map<string, (typeof branches)[number]>();
    for (const branch of branches) {
      const key = branch.name.trim().toLocaleLowerCase('vi-VN');
      const current = uniqueBranches.get(key);
      const score = branch._count.users + branch._count.orders + branch._count.inventories;
      const currentScore = current
        ? current._count.users + current._count.orders + current._count.inventories
        : -1;
      if (!current || score > currentScore) uniqueBranches.set(key, branch);
    }

    return Array.from(uniqueBranches.values());
  }

  async findOne(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id, isActive: true },
      include: {
        users: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    return branch;
  }

  async update(id: string, updateBranchDto: UpdateBranchDto) {
    await this.findOne(id); // Ensure branch exists

    if (updateBranchDto.name) {
      const duplicate = await this.prisma.branch.findFirst({
        where: {
          id: { not: id },
          name: { equals: updateBranchDto.name.trim(), mode: 'insensitive' },
          isActive: true,
        },
      });
      if (duplicate) throw new BadRequestException('Tên chi nhánh đã tồn tại');
    }

    return this.prisma.branch.update({
      where: { id },
      data: {
        ...updateBranchDto,
        name: updateBranchDto.name?.trim(),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure branch exists

    return this.prisma.branch.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
