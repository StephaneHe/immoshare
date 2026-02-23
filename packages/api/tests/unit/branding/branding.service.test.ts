import { BrandingService } from '../../../src/modules/branding/branding.service';
import {
  IBrandingRepository,
  IBrandingDataProvider,
  BrandingProfileRecord,
  NEUTRAL_DEFAULTS,
} from '../../../src/modules/branding/branding.types';

const USER_A = 'aaaaaaaa-1111-2222-3333-444444444444';
const AGENCY_ID = 'eeeeeeee-1111-2222-3333-444444444444';
const BRANDING_ID = 'bbbbbbbb-1111-2222-3333-444444444444';

const now = new Date();
const sampleBranding: BrandingProfileRecord = {
  id: BRANDING_ID, userId: USER_A, agencyId: null,
  isAgencyDefault: false,
  logoUrl: 'https://cdn.example.com/logo.png',
  photoUrl: 'https://cdn.example.com/photo.jpg',
  primaryColor: '#FF0000', secondaryColor: '#00FF00',
  accentColor: '#0000FF', textColor: '#111111',
  fontFamily: 'Rubik', displayName: 'Agent A',
  tagline: 'Your dream home', contactPhone: '+972501234567',
  contactEmail: 'a@test.com', contactWebsite: 'https://agent-a.com',
  contactWhatsapp: '+972501234567',
  socialFacebook: null, socialInstagram: null, socialLinkedin: null,
  locale: 'he', createdAt: now, updatedAt: now,
};

const agencyBranding: BrandingProfileRecord = {
  ...sampleBranding, id: 'agency-br-1', userId: 'admin-1',
  agencyId: AGENCY_ID, isAgencyDefault: true,
  logoUrl: 'https://cdn.example.com/agency-logo.png',
  displayName: 'Agency Default',
};

function mockRepo(ov: Partial<IBrandingRepository> = {}): IBrandingRepository {
  return {
    findByUser: jest.fn().mockResolvedValue(sampleBranding),
    findAgencyDefault: jest.fn().mockResolvedValue(null),
    upsert: jest.fn().mockResolvedValue(sampleBranding),
    updateField: jest.fn().mockResolvedValue(sampleBranding),
    delete: jest.fn().mockResolvedValue(undefined),
    ...ov,
  };
}

function mockDataProvider(ov: Partial<IBrandingDataProvider> = {}): IBrandingDataProvider {
  return {
    getUserAgencyId: jest.fn().mockResolvedValue(null),
    ...ov,
  };
}

function createService(rOv?: Partial<IBrandingRepository>, dOv?: Partial<IBrandingDataProvider>) {
  return new BrandingService(mockRepo(rOv), mockDataProvider(dOv));
}

// ─── getEffectiveBranding ───

describe('BrandingService.getEffectiveBranding', () => {
  it('should return user branding when it exists', async () => {
    const service = createService();
    const result = await service.getEffectiveBranding(USER_A);
    expect(result.id).toBe(BRANDING_ID);
    expect(result.primaryColor).toBe('#FF0000');
  });

  it('should fallback to agency default when user has no branding', async () => {
    const service = createService(
      { findByUser: jest.fn().mockResolvedValue(null), findAgencyDefault: jest.fn().mockResolvedValue(agencyBranding) },
      { getUserAgencyId: jest.fn().mockResolvedValue(AGENCY_ID) },
    );
    const result = await service.getEffectiveBranding(USER_A);
    expect(result.displayName).toBe('Agency Default');
    expect(result.isAgencyDefault).toBe(true);
  });

  it('should return neutral defaults when neither user nor agency branding exists', async () => {
    const service = createService(
      { findByUser: jest.fn().mockResolvedValue(null) },
    );
    const result = await service.getEffectiveBranding(USER_A);
    expect(result.primaryColor).toBe(NEUTRAL_DEFAULTS.primaryColor);
    expect(result.fontFamily).toBe('Assistant');
    expect(result.logoUrl).toBeNull();
  });

  it('should return neutral defaults when user has no agency', async () => {
    const service = createService(
      { findByUser: jest.fn().mockResolvedValue(null) },
      { getUserAgencyId: jest.fn().mockResolvedValue(null) },
    );
    const result = await service.getEffectiveBranding(USER_A);
    expect(result.primaryColor).toBe('#1A1A2E');
  });
});

// ─── upsertBranding ───

describe('BrandingService.upsertBranding', () => {
  it('should upsert branding data', async () => {
    const repo = mockRepo();
    const service = new BrandingService(repo, mockDataProvider());
    await service.upsertBranding(USER_A, { primaryColor: '#AABBCC' });
    expect(repo.upsert).toHaveBeenCalledWith(USER_A, { primaryColor: '#AABBCC' });
  });
});

// ─── Logo/Photo management ───

describe('BrandingService.setLogoUrl', () => {
  it('should update logo URL', async () => {
    const repo = mockRepo();
    const service = new BrandingService(repo, mockDataProvider());
    await service.setLogoUrl(USER_A, 'https://cdn.example.com/new-logo.png');
    expect(repo.updateField).toHaveBeenCalledWith(USER_A, 'logoUrl', 'https://cdn.example.com/new-logo.png');
  });
});

describe('BrandingService.removeLogoUrl', () => {
  it('should set logo URL to null', async () => {
    const repo = mockRepo();
    const service = new BrandingService(repo, mockDataProvider());
    await service.removeLogoUrl(USER_A);
    expect(repo.updateField).toHaveBeenCalledWith(USER_A, 'logoUrl', null);
  });
});

describe('BrandingService.setPhotoUrl', () => {
  it('should update photo URL', async () => {
    const repo = mockRepo();
    const service = new BrandingService(repo, mockDataProvider());
    await service.setPhotoUrl(USER_A, 'https://cdn.example.com/photo.jpg');
    expect(repo.updateField).toHaveBeenCalledWith(USER_A, 'photoUrl', 'https://cdn.example.com/photo.jpg');
  });
});

describe('BrandingService.removePhotoUrl', () => {
  it('should set photo URL to null', async () => {
    const repo = mockRepo();
    const service = new BrandingService(repo, mockDataProvider());
    await service.removePhotoUrl(USER_A);
    expect(repo.updateField).toHaveBeenCalledWith(USER_A, 'photoUrl', null);
  });
});

// ─── Agency branding ───

describe('BrandingService.getAgencyBranding', () => {
  it('should return agency default branding', async () => {
    const service = createService({ findAgencyDefault: jest.fn().mockResolvedValue(agencyBranding) });
    const result = await service.getAgencyBranding(AGENCY_ID);
    expect(result?.isAgencyDefault).toBe(true);
  });

  it('should return null when no agency branding exists', async () => {
    const service = createService();
    const result = await service.getAgencyBranding(AGENCY_ID);
    expect(result).toBeNull();
  });
});

describe('BrandingService.setAgencyBranding', () => {
  it('should upsert with agencyId and isAgencyDefault', async () => {
    const repo = mockRepo();
    const service = new BrandingService(repo, mockDataProvider());
    await service.setAgencyBranding(AGENCY_ID, 'admin-1', { primaryColor: '#AABB00' });
    expect(repo.upsert).toHaveBeenCalledWith('admin-1', {
      primaryColor: '#AABB00',
      agencyId: AGENCY_ID,
      isAgencyDefault: true,
    });
  });
});
