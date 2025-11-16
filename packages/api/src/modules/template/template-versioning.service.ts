import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface TemplateVersion {
  version: number;
  publishedAt: Date;
  publishedBy: string;
  changes: string;
  snapshot: {
    name: string;
    description: string;
    rules: any;
    aiPromptTemplate: string;
    sampleSessions?: any;
  };
}

@Injectable()
export class TemplateVersioningService {
  private readonly logger = new Logger(TemplateVersioningService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new version of a template
   */
  async createVersion(
    templateId: string,
    userId: string,
    changes: string,
  ): Promise<TemplateVersion> {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    // Get current version history
    const versionHistory = (template.metadata as any)?.versions || [];
    const newVersion = versionHistory.length + 1;

    // Create version snapshot
    const version: TemplateVersion = {
      version: newVersion,
      publishedAt: new Date(),
      publishedBy: userId,
      changes,
      snapshot: {
        name: template.name,
        description: template.description,
        rules: template.rules,
        aiPromptTemplate: template.aiPromptTemplate,
        sampleSessions: template.sampleSessions,
      },
    };

    // Update template metadata with new version
    await this.prisma.template.update({
      where: { id: templateId },
      data: {
        metadata: {
          ...(template.metadata as any),
          currentVersion: newVersion,
          versions: [...versionHistory, version],
        },
      },
    });

    this.logger.log(`Created version ${newVersion} for template ${templateId}`);
    return version;
  }

  /**
   * Get all versions of a template
   */
  async getVersions(templateId: string): Promise<TemplateVersion[]> {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
      select: { metadata: true },
    });

    if (!template) {
      throw new NotFoundException(`Template ${templateId} not found`);
    }

    return (template.metadata as any)?.versions || [];
  }

  /**
   * Get a specific version
   */
  async getVersion(templateId: string, version: number): Promise<TemplateVersion | null> {
    const versions = await this.getVersions(templateId);
    return versions.find((v) => v.version === version) || null;
  }

  /**
   * Restore a template to a previous version
   */
  async restoreVersion(templateId: string, version: number, userId: string): Promise<void> {
    const versionData = await this.getVersion(templateId, version);

    if (!versionData) {
      throw new NotFoundException(`Version ${version} not found for template ${templateId}`);
    }

    // Create a new version before restoring (for history)
    await this.createVersion(templateId, userId, `Restored from version ${version}`);

    // Restore template data
    await this.prisma.template.update({
      where: { id: templateId },
      data: {
        name: versionData.snapshot.name,
        description: versionData.snapshot.description,
        rules: versionData.snapshot.rules,
        aiPromptTemplate: versionData.snapshot.aiPromptTemplate,
        sampleSessions: versionData.snapshot.sampleSessions,
      },
    });

    this.logger.log(`Restored template ${templateId} to version ${version}`);
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    templateId: string,
    version1: number,
    version2: number,
  ): Promise<{
    version1: TemplateVersion;
    version2: TemplateVersion;
    changes: string[];
  }> {
    const v1 = await this.getVersion(templateId, version1);
    const v2 = await this.getVersion(templateId, version2);

    if (!v1 || !v2) {
      throw new NotFoundException('One or both versions not found');
    }

    const changes: string[] = [];

    if (v1.snapshot.name !== v2.snapshot.name) {
      changes.push(`Name changed from "${v1.snapshot.name}" to "${v2.snapshot.name}"`);
    }

    if (v1.snapshot.description !== v2.snapshot.description) {
      changes.push('Description changed');
    }

    if (JSON.stringify(v1.snapshot.rules) !== JSON.stringify(v2.snapshot.rules)) {
      changes.push('Rules modified');
    }

    if (v1.snapshot.aiPromptTemplate !== v2.snapshot.aiPromptTemplate) {
      changes.push('AI prompt template changed');
    }

    return { version1: v1, version2: v2, changes };
  }

  /**
   * Get current version number
   */
  async getCurrentVersion(templateId: string): Promise<number> {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
      select: { metadata: true },
    });

    return (template?.metadata as any)?.currentVersion || 0;
  }
}
