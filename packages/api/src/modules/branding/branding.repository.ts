import { PrismaClient } from '@prisma/client';
import { IBrandingRepository, IBrandingDataProvider, BrandingProfileRecord, UpdateBrandingInput } from './branding.types';

// Prisma BrandingProfile matches our record shape exactly, so cast is safe
type PrismaBrandingResult = BrandingProfileRecord;

export class PrismaBrandingRepository implements IBrandingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUser(userId: string): Promise<BrandingProfileRecord | null> {
    const row = await this.prisma.brandingProfile.findUnique({ where: { userId } });
    return row as PrismaBrandingResult | null;
  }

  async findAgencyDefault(agencyId: string): Promise<BrandingProfileRecord | null> {
    const row = await this.prisma.brandingProfile.findFirst({
      where: { agencyId, isAgencyDefault: true },
    });
    return row as PrismaBrandingResult | null;
  }

  async upsert(userId: string, data: UpdateBrandingInput & { agencyId?: string; isAgencyDefault?: boolean }): Promise<BrandingProfileRecord> {
    const row = await this.prisma.brandingProfile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    return row as PrismaBrandingResult;
  }

  async updateField(userId: string, field: string, value: string | null): Promise<BrandingProfileRecord> {
    const row = await this.prisma.brandingProfile.upsert({
      where: { userId },
      create: { userId, [field]: value },
      update: { [field]: value },
    });
    return row as PrismaBrandingResult;
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
