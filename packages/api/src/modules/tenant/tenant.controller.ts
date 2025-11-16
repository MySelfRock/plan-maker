import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Request } from 'express';

@ApiTags('tenants')
@Controller('tenants')
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Get('current')
  @ApiOperation({ summary: 'Get current tenant info based on hostname' })
  async getCurrentTenant(@Req() req: Request) {
    const hostname = req.get('host') || 'localhost';
    const tenant = await this.tenantService.resolveTenantFromHost(hostname);

    // Return only public information
    return {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      theme: tenant.theme,
      customDomain: tenant.customDomain,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all tenants (super admin only)' })
  async findAll() {
    return this.tenantService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get tenant by ID' })
  async findOne(@Param('id') id: string) {
    return this.tenantService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new tenant (super admin only)' })
  async create(@Body() createTenantDto: any) {
    return this.tenantService.create(createTenantDto);
  }
}
