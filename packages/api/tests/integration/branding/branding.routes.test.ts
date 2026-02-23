import { UserRole } from '@immo-share/shared/constants/enums';
import { buildBrandingTestApp } from '../../helpers/testApp';
import { BrandingService } from '../../../src/modules/branding/branding.service';
import {
  IBrandingRepository,
  IBrandingDataProvider,
  BrandingProfileRecord,
  NEUTRAL_DEFAULTS,
} from '../../../src/modules/branding/branding.types';
import { generateTestToken } from '../../helpers/auth';

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

function mockRepo(ov: Partial<IBrandingRepository> = {}): IBrandingRepository {
  return {
    findByUser: jest.fn().mockResolvedValue(sampleBranding),
    findAgencyDefault: jest.fn().mockResolvedValue(null),
    upsert: jest.fn().mockImplementation((_uid, data) => Promise.resolve({ ...sampleBranding, ...data })),
    updateField: jest.fn().mockImplementation((_uid, field, value) => Promise.resolve({ ...sampleBranding, [field]: value })),
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

function setup(rOv?: Partial<IBrandingRepository>, dOv?: Partial<IBrandingDataProvider>) {
  const repo = mockRepo(rOv);
  const dp = mockDataProvider(dOv);
  const service = new BrandingService(repo, dp);
  const app = buildBrandingTestApp(service);
  const tokenA = generateTestToken({ sub: USER_A, email: 'a@test.com', role: UserRole.AGENT });
  return { app, tokenA, repo };
}

// ─── GET /api/v1/branding ───

describe('GET /api/v1/branding', () => {
  it('should return 200 with effective branding', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'GET', url: '/api/v1/branding',
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.primaryColor).toBe('#FF0000');
  });

  it('should return 401 without auth', async () => {
    const { app } = setup();
    const res = await app.inject({ method: 'GET', url: '/api/v1/branding' });
    expect(res.statusCode).toBe(401);
  });

  it('should return neutral defaults when no branding exists', async () => {
    const { app, tokenA } = setup({ findByUser: jest.fn().mockResolvedValue(null) });
    const res = await app.inject({
      method: 'GET', url: '/api/v1/branding',
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.primaryColor).toBe('#1A1A2E');
  });
});

// ─── PUT /api/v1/branding ───

describe('PUT /api/v1/branding', () => {
  it('should return 200 with updated branding', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'PUT', url: '/api/v1/branding',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { primaryColor: '#AABBCC', fontFamily: 'Heebo' },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.primaryColor).toBe('#AABBCC');
  });

  it('should reject invalid hex color', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'PUT', url: '/api/v1/branding',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { primaryColor: 'not-a-color' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('should reject invalid font', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'PUT', url: '/api/v1/branding',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { fontFamily: 'Comic Sans' },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── PATCH /api/v1/branding ───

describe('PATCH /api/v1/branding', () => {
  it('should return 200 with partial update', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'PATCH', url: '/api/v1/branding',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { tagline: 'New tagline' },
    });
    expect(res.statusCode).toBe(200);
  });
});

// ─── POST /api/v1/branding/logo ───

describe('POST /api/v1/branding/logo', () => {
  it('should return 200 with logo URL set', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'POST', url: '/api/v1/branding/logo',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { url: 'https://cdn.example.com/new-logo.png' },
    });
    expect(res.statusCode).toBe(200);
  });
});

// ─── DELETE /api/v1/branding/logo ───

describe('DELETE /api/v1/branding/logo', () => {
  it('should return 200 with logo removed', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'DELETE', url: '/api/v1/branding/logo',
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.logoUrl).toBeNull();
  });
});

// ─── POST /api/v1/branding/photo ───

describe('POST /api/v1/branding/photo', () => {
  it('should return 200 with photo URL set', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'POST', url: '/api/v1/branding/photo',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { url: 'https://cdn.example.com/new-photo.jpg' },
    });
    expect(res.statusCode).toBe(200);
  });
});

// ─── DELETE /api/v1/branding/photo ───

describe('DELETE /api/v1/branding/photo', () => {
  it('should return 200 with photo removed', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'DELETE', url: '/api/v1/branding/photo',
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.photoUrl).toBeNull();
  });
});

// ─── GET /api/v1/branding/preview ───

describe('GET /api/v1/branding/preview', () => {
  it('should return 200 with branding and previewMode', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'GET', url: '/api/v1/branding/preview',
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.previewMode).toBe(true);
  });
});

// ─── GET /api/v1/agencies/:id/branding ───

describe('GET /api/v1/agencies/:id/branding', () => {
  it('should return 200 with agency branding', async () => {
    const agencyBr = { ...sampleBranding, isAgencyDefault: true, agencyId: AGENCY_ID };
    const { app, tokenA } = setup({ findAgencyDefault: jest.fn().mockResolvedValue(agencyBr) });
    const res = await app.inject({
      method: 'GET', url: `/api/v1/agencies/${AGENCY_ID}/branding`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.isAgencyDefault).toBe(true);
  });

  it('should return 200 with null when no agency branding', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'GET', url: `/api/v1/agencies/${AGENCY_ID}/branding`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data).toBeNull();
  });
});

// ─── PUT /api/v1/agencies/:id/branding ───

describe('PUT /api/v1/agencies/:id/branding', () => {
  it('should return 200 with agency branding set', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'PUT', url: `/api/v1/agencies/${AGENCY_ID}/branding`,
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { primaryColor: '#AABB00', displayName: 'Agency Brand' },
    });
    expect(res.statusCode).toBe(200);
  });
});
