import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Base Repository with common CRUD operations
 * Provides abstraction layer over Prisma
 */
@Injectable()
export abstract class BaseRepository<T> {
  constructor(protected readonly prisma: PrismaService) {}

  abstract get model(): any;

  async findAll(where?: any, options?: { skip?: number; take?: number; orderBy?: any }): Promise<T[]> {
    return this.model.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      orderBy: options?.orderBy,
    });
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({ where: { id } });
  }

  async findOne(where: any): Promise<T | null> {
    return this.model.findFirst({ where });
  }

  async create(data: any): Promise<T> {
    return this.model.create({ data });
  }

  async update(id: string, data: any): Promise<T> {
    return this.model.update({ where: { id }, data });
  }

  async delete(id: string): Promise<T> {
    return this.model.delete({ where: { id } });
  }

  async count(where?: any): Promise<number> {
    return this.model.count({ where });
  }

  async exists(where: any): Promise<boolean> {
    const count = await this.model.count({ where });
    return count > 0;
  }

  async findWithPagination(
    where?: any,
    options?: { skip?: number; take?: number; orderBy?: any },
  ): Promise<{ data: T[]; total: number; hasMore: boolean }> {
    const [data, total] = await Promise.all([
      this.findAll(where, options),
      this.count(where),
    ]);

    return {
      data,
      total,
      hasMore: (options?.skip || 0) + data.length < total,
    };
  }
}
