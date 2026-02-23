import { PrismaClient } from '@prisma/client';
import { IBrandingRepository, IBrandingDataProvider, BrandingProfileRecord, UpdateBrandingInput } from './branding.types';

export class PrismaBrandingRepository implements IBrandingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUser(userId: string): Promise<BrandingProfileRecord | null> {
    return this.prisma.brandingProfile.findUnique({ where: { userId } }) as any;
  }

  async findAgencyDefault(agencyId: string): Promise<BrandingProfileRecord | null> {
    return this.prisma.brandingProfile.findFirst({
      where: { agencyId, isAgencyDefault: true },
    }) as any;
  }

  async upsert(userId: string, data: UpdateBrandingInput & { agencyId?: string; isAgencyDefault?: boolean }): Promise<BrandingProfileRecord> {
    return this.prisma.brandingProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    }) as any;
  }

  async updateField(userId: string, field: string, value: string | null): Promise<BrandingProfileRecord> {
    return this.prisma.brandingProfile.upsert({
      where: { userId },
      create: { userId, [field]: value },
      update: { [field]: value },
    }) as any;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.brandingProfile.delete({ where: { id } });
  }
}

export class PrismaBrandingDataProvider implements IBrandingDataProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async getUserAgencyId(userId: string): Promise<string | null> {
    const member = await this.prisma.agencyMember.findFirst({
      where: { userId, leftAt: null },
      select: { agencyId: true },
    });
    return member?.agencyId ?? null;
  }
}
