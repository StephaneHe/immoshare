import { UserRole } from '@immo-share/shared/constants/enums';
import { buildPartnerTestApp } from '../../helpers/testApp';
import { PartnerInviteService } from '../../../src/modules/partner/partner-invite.service';
import { PartnerCatalogService } from '../../../src/modules/partner/partner-catalog.service';
import { ReshareService } from '../../../src/modules/partner/reshare.service';
import {
  IPartnerInviteRepository,
  IReshareRepository,
  IPartnerDataProvider,
  PartnerInviteRecord,
  ReshareRequestRecord,
} from '../../../src/modules/partner/partner.types';
import { generateTestToken } from '../../helpers/auth';

const USER_A = 'aaaaaaaa-1111-2222-3333-444444444444';
const USER_B = 'bbbbbbbb-1111-2222-3333-444444444444';
const INVITE_ID = 'cccccccc-1111-2222-3333-444444444444';
const PROP_ID = 'dddddddd-1111-2222-3333-444444444444';
const REQ_ID = 'eeeeeeee-1111-2222-3333-444444444444';

const pendingInvite: PartnerInviteRecord = {
  id: INVITE_ID, inviterId: USER_A, inviteeId: null,
  code: 'ABCD1234', status: 'PENDING',
  permissions: { canView: true, canReshare: false },
  expiresAt: new Date(Date.now() + 86400000),
  acceptedAt: null, createdAt: new Date(),
};

const acceptedInvite: PartnerInviteRecord = {
  ...pendingInvite, inviteeId: USER_B, status: 'ACCEPTED', acceptedAt: new Date(),
};

const pendingReq: ReshareRequestRecord = {
  id: REQ_ID, partnerId: USER_B, propertyId: PROP_ID,
  status: 'PENDING', message: null, requestedAt: new Date(),
  resolvedAt: null, resolvedBy: null,
};

const approvedReq: ReshareRequestRecord = {
  ...pendingReq, status: 'APPROVED', resolvedAt: new Date(), resolvedBy: USER_A,
};

const sampleProperty = {
  id: PROP_ID, title: 'Nice apt', propertyType: 'apartment', status: 'active',
  price: 500000, city: 'Tel Aviv', rooms: 3, areaSqm: 80,
  media: [{ url: 'http://img.jpg', type: 'photo', order: 0 }],
};

function mockInviteRepo(overrides: Partial<IPartnerInviteRepository> = {}): IPartnerInviteRepository {
  return {
    create: jest.fn().mockResolvedValue(pendingInvite),
    findByCode: jest.fn().mockImplementation((code: string) =>
      code === 'ABCD1234' ? Promise.resolve(pendingInvite) : Promise.resolve(null)),
    findById: jest.fn().mockResolvedValue(acceptedInvite),
    findByInviter: jest.fn().mockResolvedValue([pendingInvite]),
    findActivePartners: jest.fn().mockResolvedValue([acceptedInvite]),
    findPartnershipByPair: jest.fn().mockResolvedValue(null),
    countActivePartners: jest.fn().mockResolvedValue(0),
    accept: jest.fn().mockResolvedValue(acceptedInvite),
    revoke: jest.fn().mockResolvedValue({ ...pendingInvite, status: 'REVOKED' }),
    ...overrides,
  };
}

function mockReshareRepo(overrides: Partial<IReshareRepository> = {}): IReshareRepository {
  return {
    create: jest.fn().mockResolvedValue(pendingReq),
    findById: jest.fn().mockResolvedValue(pendingReq),
    findPending: jest.fn().mockResolvedValue(null),
    findByPropertyOwner: jest.fn().mockResolvedValue([pendingReq]),
    findByPartner: jest.fn().mockResolvedValue([pendingReq]),
    approve: jest.fn().mockResolvedValue(approvedReq),
    reject: jest.fn().mockResolvedValue({ ...pendingReq, status: 'REJECTED', resolvedBy: USER_A }),
    revokeAllForPartner: jest.fn().mockResolvedValue(0),
    ...overrides,
  };
}

function mockDataProvider(overrides: Partial<IPartnerDataProvider> = {}): IPartnerDataProvider {
  return {
    getActivePropertiesByOwner: jest.fn().mockResolvedValue([sampleProperty]),
    getPropertyDetail: jest.fn().mockResolvedValue({
      ...sampleProperty, description: null, address: null,
      bedrooms: 2, bathrooms: 1, floor: 3, ownerId: USER_A, media: [],
    }),
    getPropertyOwnerId: jest.fn().mockResolvedValue(USER_A),
    getAgencyMemberIds: jest.fn().mockResolvedValue(null),
    deactivatePartnerShareLinks: jest.fn().mockResolvedValue(0),
    ...overrides,
  };
}

function setup(
  irOv?: Partial<IPartnerInviteRepository>,
  rrOv?: Partial<IReshareRepository>,
  dpOv?: Partial<IPartnerDataProvider>,
) {
  const ir = mockInviteRepo(irOv);
  const rr = mockReshareRepo(rrOv);
  const dp = mockDataProvider(dpOv);
  const inviteService = new PartnerInviteService(ir, rr, dp);
  const catalogService = new PartnerCatalogService(ir, dp);
  const reshareService = new ReshareService(rr, ir, dp);
  const app = buildPartnerTestApp(inviteService, catalogService, reshareService);
  const tokenA = generateTestToken({ sub: USER_A, email: 'a@test.com', role: UserRole.AGENT });
  const tokenB = generateTestToken({ sub: USER_B, email: 'b@test.com', role: UserRole.AGENT });
  return { app, tokenA, tokenB };
}

// ─── Partner Invites ───

describe('POST /api/v1/partner-invites', () => {
  it('should return 201 with code', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'POST', url: '/api/v1/partner-invites',
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).data.code).toBeDefined();
  });

  it('should return 401 without auth', async () => {
    const { app } = setup();
    const res = await app.inject({ method: 'POST', url: '/api/v1/partner-invites' });
    expect(res.statusCode).toBe(401);
  });
});

describe('POST /api/v1/partner-invites/accept', () => {
  // Default mock: findPartnershipByPair returns null → not yet partnered
  it('should return 200 and create partnership', async () => {
    const { app, tokenB } = setup();
    const res = await app.inject({
      method: 'POST', url: '/api/v1/partner-invites/accept',
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { code: 'ABCD1234' },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.status).toBe('ACCEPTED');
  });

  it('should return 404 for invalid code', async () => {
    const { app, tokenB } = setup();
    const res = await app.inject({
      method: 'POST', url: '/api/v1/partner-invites/accept',
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { code: 'ZZZZZZZZ' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('should return 410 for expired code', async () => {
    const expired = { ...pendingInvite, expiresAt: new Date(Date.now() - 1000) };
    const { app, tokenB } = setup({
      findByCode: jest.fn().mockResolvedValue(expired),
    });
    const res = await app.inject({
      method: 'POST', url: '/api/v1/partner-invites/accept',
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { code: 'ABCD1234' },
    });
    expect(res.statusCode).toBe(410);
  });
});

// ─── Partner Catalog ───

describe('GET /api/v1/partners/:inviteId/properties', () => {
  it('should return 200 with properties list', async () => {
    const { app, tokenB } = setup();
    const res = await app.inject({
      method: 'GET', url: `/api/v1/partners/${INVITE_ID}/properties`,
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.properties).toHaveLength(1);
  });

  it('should return 403 if not the invitee', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'GET', url: `/api/v1/partners/${INVITE_ID}/properties`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(403);
  });
});

// ─── Reshare (needs findPartnershipByPair → acceptedInvite) ───

describe('POST /api/v1/reshare-requests', () => {
  it('should return 201 with pending request', async () => {
    const { app, tokenB } = setup({
      findPartnershipByPair: jest.fn().mockResolvedValue(acceptedInvite),
    });
    const res = await app.inject({
      method: 'POST', url: '/api/v1/reshare-requests',
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { propertyId: PROP_ID },
    });
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).data.status).toBe('PENDING');
  });

  it('should return 409 if already requested', async () => {
    const { app, tokenB } = setup(
      { findPartnershipByPair: jest.fn().mockResolvedValue(acceptedInvite) },
      { findPending: jest.fn().mockResolvedValue(pendingReq) },
    );
    const res = await app.inject({
      method: 'POST', url: '/api/v1/reshare-requests',
      headers: { authorization: `Bearer ${tokenB}` },
      payload: { propertyId: PROP_ID },
    });
    expect(res.statusCode).toBe(409);
  });
});

describe('POST /api/v1/reshare-requests/:id/approve', () => {
  it('should return 200', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'POST', url: `/api/v1/reshare-requests/${REQ_ID}/approve`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.status).toBe('APPROVED');
  });

  it('should return 403 for non-owner', async () => {
    const { app, tokenB } = setup();
    const res = await app.inject({
      method: 'POST', url: `/api/v1/reshare-requests/${REQ_ID}/approve`,
      headers: { authorization: `Bearer ${tokenB}` },
    });
    expect(res.statusCode).toBe(403);
  });
});
