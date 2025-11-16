import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TemplateService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.template.findMany({
      where: { OR: [{ tenantId }, { isPublic: true }] },
    });
  }

  async findById(id: string) {
    return this.prisma.template.findUnique({ where: { id } });
  }

  async create(tenantId: string, createdBy: string, data: any) {
    return this.prisma.template.create({
      data: { ...data, tenantId, createdBy },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.template.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.template.delete({ where: { id } });
  }
}
