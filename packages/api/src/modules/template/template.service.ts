import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TemplateService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, params?: { skip?: number; take?: number }) {
    const where = { OR: [{ tenantId }, { isPublic: true }] };

    const [templates, total] = await Promise.all([
      this.prisma.template.findMany({
        where,
        skip: params?.skip || 0,
        take: params?.take || 50,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.template.count({ where }),
    ]);

    return { templates, total, hasMore: (params?.skip || 0) + templates.length < total };
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
