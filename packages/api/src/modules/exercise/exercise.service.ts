import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ExerciseService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    filters?: { niche?: string; level?: string; tags?: string[] },
    params?: { skip?: number; take?: number },
  ) {
    const where = {
      tenantId,
      ...(filters?.niche && { niche: filters.niche }),
      ...(filters?.level && { level: filters.level }),
      ...(filters?.tags && { tags: { hasSome: filters.tags } }),
    };

    const [exercises, total] = await Promise.all([
      this.prisma.exercise.findMany({
        where,
        skip: params?.skip || 0,
        take: params?.take || 50,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.exercise.count({ where }),
    ]);

    return { exercises, total, hasMore: (params?.skip || 0) + exercises.length < total };
  }

  async findById(id: string) {
    return this.prisma.exercise.findUnique({ where: { id } });
  }

  async create(tenantId: string, data: any) {
    return this.prisma.exercise.create({ data: { ...data, tenantId } });
  }

  async update(id: string, data: any) {
    return this.prisma.exercise.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.exercise.delete({ where: { id } });
  }
}
