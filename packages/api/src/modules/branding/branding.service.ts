import {
  IBrandingRepository,
  IBrandingDataProvider,
  BrandingProfileRecord,
  UpdateBrandingInput,
  NEUTRAL_DEFAULTS,
} from './branding.types';
import { BrandingNotFoundError, NotAgencyAdminError } from './branding.errors';

export class BrandingService {
  constructor(
    private readonly repo: IBrandingRepository,
    private readonly dataProvider: IBrandingDataProvider,
  ) {}

  /**
   * Returns the effective branding: user's own > agency default > neutral defaults.
   */
  async getEffectiveBranding(userId: string): Promise<BrandingProfileRecord | typeof NEUTRAL_DEFAULTS & { id: string; userId: string }> {
    // 1. Check user's own branding
    const own = await this.repo.findByUser(userId);
    if (own) return own;

    // 2. Check agency default
    const agencyId = await this.dataProvider.getUserAgencyId(userId);
    if (agencyId) {
      const agencyDefault = await this.repo.findAgencyDefault(agencyId);
      if (agencyDefault) return agencyDefault;
    }

    // 3. Return neutral defaults
    return {
      id: '',
      userId,
      agencyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...NEUTRAL_DEFAULTS,
    };
  }

  async getBranding(userId: string): Promise<BrandingProfileRecord | null> {
    return this.repo.findByUser(userId);
  }

  async upsertBranding(userId: string, data: UpdateBrandingInput): Promise<BrandingProfileRecord> {
    return this.repo.upsert(userId, data);
  }

  async setLogoUrl(userId: string, url: string): Promise<BrandingProfileRecord> {
    return this.repo.updateField(userId, 'logoUrl', url);
  }

  async removeLogoUrl(userId: string): Promise<BrandingProfileRecord> {
    return this.repo.updateField(userId, 'logoUrl', null);
  }

  async setPhotoUrl(userId: string, url: string): Promise<BrandingProfileRecord> {
    return this.repo.updateField(userId, 'photoUrl', url);
  }

  async removePhotoUrl(userId: string): Promise<BrandingProfileRecord> {
    return this.repo.updateField(userId, 'photoUrl', null);
  }

  // ─── Agency branding ───

  async getAgencyBranding(agencyId: string): Promise<BrandingProfileRecord | null> {
    return this.repo.findAgencyDefault(agencyId);
  }

  async setAgencyBranding(
    agencyId: string,
    adminUserId: string,
    data: UpdateBrandingInput,
  ): Promise<BrandingProfileRecord> {
    return this.repo.upsert(adminUserId, {
      ...data,
      agencyId,
      isAgencyDefault: true,
    });
  }
}
