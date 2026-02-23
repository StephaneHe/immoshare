import { ReshareService } from '../../../src/modules/partner/reshare.service';
import {
  IReshareRepository,
  IPartnerInviteRepository,
  IPartnerDataProvider,
  ReshareRequestRecord,
  PartnerInviteRecord,
} from '../../../src/modules/partner/partner.types';
import {
  ReshareAlreadyRequestedError,
  NotPartnerError,
  ReshareNotFoundError,
  NotPropertyOwnerError,
} from '../../../src/modules/partner/partner.errors';

const USER_A = 'aaaaaaaa-1111-2222-3333-444444444444';
const USER_B = 'bbbbbbbb-1111-2222-3333-444444444444';
const OTHER = 'cccccccc-1111-2222-3333-444444444444';
const PROP_ID = 'dddddddd-1111-2222-3333-444444444444';
const REQ_ID = 'eeeeeeee-1111-2222-3333-444444444444';

const partnership: PartnerInviteRecord = {
  id: 'ff000000-0000-0000-0000-000000000000',
  inviterId: USER_A, inviteeId: USER_B, code: 'ABCD1234',
  status: 'ACCEPTED', permissions: { canView: true, canReshare: false },
  expiresAt: new Date(Date.now() + 86400000), acceptedAt: new Date(), createdAt: new Date(),
};

const pendingReq: ReshareRequestRecord = {
  id: REQ_ID, partnerId: USER_B, propertyId: PROP_ID,
  status: 'PENDING', message: 'Please approve', requestedAt: new Date(),
  resolvedAt: null, resolvedBy: null,
};

const approvedReq: ReshareRequestRecord = {
  ...pendingReq, status: 'APPROVED', resolvedAt: new Date(), resolvedBy: USER_A,
};

const rejectedReq: ReshareRequestRecord = {
  ...pendingReq, status: 'REJECTED', resolvedAt: new Date(), resolvedBy: USER_A,
};

function mockReshareRepo(overrides: Partial<IReshareRepository> = {}): IReshareRepository {
  return {
    create: jest.fn().mockResolvedValue(pendingReq),
    findById: jest.fn().mockResolvedValue(pendingReq),
    findPending: jest.fn().mockResolvedValue(null),
    findByPropertyOwner: jest.fn().mockResolvedValue([pendingReq]),
    findByPartner: jest.fn().mockResolvedValue([pendingReq]),
    approve: jest.fn().mockResolvedValue(approvedReq),
    reject: jest.fn().mockResolvedValue(rejectedReq),
    revokeAllForPartner: jest.fn().mockResolvedValue(0),
    ...overrides,
  };
}

function mockInviteRepo(overrides: Partial<IPartnerInviteRepository> = {}): IPartnerInviteRepository {
  return {
    create: jest.fn(), findByCode: jest.fn(),
    findById: jest.fn(), findByInviter: jest.fn(),
    findActivePartners: jest.fn(),
    findPartnershipByPair: jest.fn().mockResolvedValue(partnership),
    countActivePartners: jest.fn(), accept: jest.fn(), revoke: jest.fn(),
    ...overrides,
  };
}

function mockDataProvider(overrides: Partial<IPartnerDataProvider> = {}): IPartnerDataProvider {
  return {
    getActivePropertiesByOwner: jest.fn().mockResolvedValue([]),
    getPropertyDetail: jest.fn().mockResolvedValue(null),
    getPropertyOwnerId: jest.fn().mockResolvedValue(USER_A),
    getAgencyMemberIds: jest.fn().mockResolvedValue(null),
    deactivatePartnerShareLinks: jest.fn().mockResolvedValue(0),
    ...overrides,
  };
}

function createService(
  rr?: Partial<IReshareRepository>,
  ir?: Partial<IPartnerInviteRepository>,
  dp?: Partial<IPartnerDataProvider>,
) {
  return new ReshareService(mockReshareRepo(rr), mockInviteRepo(ir), mockDataProvider(dp));
}

describe('ReshareService.request', () => {
  it('should create pending request', async () => {
    const service = createService();
    const result = await service.request(USER_B, PROP_ID, 'Please approve');
    expect(result.status).toBe('PENDING');
    expect(result.partnerId).toBe(USER_B);
  });

  it('should throw ALREADY_REQUESTED if pending request exists', async () => {
    const service = createService({ findPending: jest.fn().mockResolvedValue(pendingReq) });
    await expect(service.request(USER_B, PROP_ID)).rejects.toThrow(ReshareAlreadyRequestedError);
  });

  it('should throw NOT_PARTNER if user is not a partner of property owner', async () => {
    const service = createService(
      undefined,
      { findPartnershipByPair: jest.fn().mockResolvedValue(null) },
    );
    await expect(service.request(USER_B, PROP_ID)).rejects.toThrow(NotPartnerError);
  });
});

describe('ReshareService.approve', () => {
  it('should set status to APPROVED and resolvedBy', async () => {
    const service = createService();
    const result = await service.approve(REQ_ID, USER_A);
    expect(result.status).toBe('APPROVED');
    expect(result.resolvedBy).toBe(USER_A);
  });

  it('should throw NOT_OWNER if user is not property owner', async () => {
    const service = createService();
    await expect(service.approve(REQ_ID, OTHER)).rejects.toThrow(NotPropertyOwnerError);
  });
});

describe('ReshareService.reject', () => {
  it('should set status to REJECTED and resolvedBy', async () => {
    const service = createService();
    const result = await service.reject(REQ_ID, USER_A);
    expect(result.status).toBe('REJECTED');
    expect(result.resolvedBy).toBe(USER_A);
  });

  it('should throw NOT_OWNER if user is not property owner', async () => {
    const service = createService();
    await expect(service.reject(REQ_ID, OTHER)).rejects.toThrow(NotPropertyOwnerError);
  });
});
