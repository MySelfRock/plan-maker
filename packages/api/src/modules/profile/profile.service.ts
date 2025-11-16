import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Profile } from '@prisma/client';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<Profile | null> {
    return this.prisma.profile.findUnique({
      where: { userId },
    });
  }

  async create(data: any): Promise<Profile> {
    return this.prisma.profile.create({ data });
  }

  async update(userId: string, data: any): Promise<Profile> {
    return this.prisma.profile.update({
      where: { userId },
      data,
    });
  }

  async upsert(userId: string, tenantId: string, data: any): Promise<Profile> {
    return this.prisma.profile.upsert({
      where: { userId },
      create: { userId, tenantId, ...data },
      update: data,
    });
  }
}
