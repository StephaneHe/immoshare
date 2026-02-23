import { PartnerInviteService } from '../../../src/modules/partner/partner-invite.service';
import {
  IPartnerInviteRepository,
  IReshareRepository,
  IPartnerDataProvider,
  PartnerInviteRecord,
} from '../../../src/modules/partner/partner.types';
import {
  PartnerInviteNotFoundError,
  PartnerInviteExpiredError,
  PartnerLimitExceededError,
  AlreadyPartnerError,
  SelfInviteError,
} from '../../../src/modules/partner/partner.errors';

const USER_A = 'aaaaaaaa-1111-2222-3333-444444444444';
const USER_B = 'bbbbbbbb-1111-2222-3333-444444444444';
const INVITE_ID = 'cccccccc-1111-2222-3333-444444444444';

const pendingInvite: PartnerInviteRecord = {
  id: INVITE_ID, inviterId: USER_A, inviteeId: null,
  code: 'ABCD1234', status: 'PENDING',
  permissions: { canView: true, canReshare: false },
  expiresAt: new Date(Date.now() + 86400000),
  acceptedAt: null, createdAt: new Date(),
};

const acceptedInvite: PartnerInviteRecord = {
  ...pendingInvite, inviteeId: USER_B, status: 'ACCEPTED',
  acceptedAt: new Date(),
};

function mockInviteRepo(overrides: Partial<IPartnerInviteRepository> = {}): IPartnerInviteRepository {
  return {
    create: jest.fn().mockResolvedValue(pendingInvite),
    findByCode: jest.fn().mockResolvedValue(pendingInvite),
    findById: jest.fn().mockResolvedValue(pendingInvite),
    findByInviter: jest.fn().mockResolvedValue([]),
    findActivePartners: jest.fn().mockResolvedValue([]),
    findPartnershipByPair: jest.fn().mockResolvedValue(null),
    countActivePartners: jest.fn().mockResolvedValue(0),
    accept: jest.fn().mockResolvedValue(acceptedInvite),
    revoke: jest.fn().mockResolvedValue({ ...pendingInvite, status: 'REVOKED' }),
    ...overrides,
  };
}

function mockReshareRepo(overrides: Partial<IReshareRepository> = {}): IReshareRepository {
  return {
    create: jest.fn(), findById: jest.fn(), findPending: jest.fn(),
    findByPropertyOwner: jest.fn(), findByPartner: jest.fn(),
    approve: jest.fn(), reject: jest.fn(),
    revokeAllForPartner: jest.fn().mockResolvedValue(0),
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
  ir?: Partial<IPartnerInviteRepository>,
  rr?: Partial<IReshareRepository>,
  dp?: Partial<IPartnerDataProvider>,
) {
  return new PartnerInviteService(mockInviteRepo(ir), mockReshareRepo(rr), mockDataProvider(dp));
}

describe('PartnerInviteService.generateCode', () => {
  it('should generate 8-char alphanumeric code', async () => {
    const repo = mockInviteRepo();
    const service = new PartnerInviteService(repo, mockReshareRepo(), mockDataProvider());
    await service.generateCode(USER_A);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        inviterId: USER_A,
        code: expect.stringMatching(/^[A-F0-9]{8}$/),
      }),
    );
  });

  it('should set expiry to 48h from now', async () => {
    const repo = mockInviteRepo();
    const service = new PartnerInviteService(repo, mockReshareRepo(), mockDataProvider());
    await service.generateCode(USER_A);
    const call = (repo.create as jest.Mock).mock.calls[0][0];
    const diff = call.expiresAt.getTime() - Date.now();
    expect(diff).toBeGreaterThan(47 * 3600000);
    expect(diff).toBeLessThan(49 * 3600000);
  });

  it('should link to inviter', async () => {
    const repo = mockInviteRepo();
    const service = new PartnerInviteService(repo, mockReshareRepo(), mockDataProvider());
    await service.generateCode(USER_A);
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ inviterId: USER_A }),
    );
  });

  it('should throw LIMIT_EXCEEDED if 50 partners reached', async () => {
    const service = createService({ countActivePartners: jest.fn().mockResolvedValue(50) });
    await expect(service.generateCode(USER_A)).rejects.toThrow(PartnerLimitExceededError);
  });
});

describe('PartnerInviteService.acceptCode', () => {
  it('should link invitee and set status to ACCEPTED', async () => {
    const repo = mockInviteRepo();
    const service = new PartnerInviteService(repo, mockReshareRepo(), mockDataProvider());
    const result = await service.acceptCode('ABCD1234', USER_B);
    expect(repo.accept).toHaveBeenCalledWith(INVITE_ID, USER_B);
    expect(result.status).toBe('ACCEPTED');
  });

  it('should throw INVITE_NOT_FOUND for invalid code', async () => {
    const service = createService({ findByCode: jest.fn().mockResolvedValue(null) });
    await expect(service.acceptCode('BADCODE1', USER_B)).rejects.toThrow(PartnerInviteNotFoundError);
  });

  it('should throw INVITE_EXPIRED for expired code', async () => {
    const expired = { ...pendingInvite, expiresAt: new Date(Date.now() - 1000) };
    const service = createService({ findByCode: jest.fn().mockResolvedValue(expired) });
    await expect(service.acceptCode('ABCD1234', USER_B)).rejects.toThrow(PartnerInviteExpiredError);
  });

  it('should throw ALREADY_PARTNER if already partnered', async () => {
    const service = createService({
      findPartnershipByPair: jest.fn().mockResolvedValue(acceptedInvite),
    });
    await expect(service.acceptCode('ABCD1234', USER_B)).rejects.toThrow(AlreadyPartnerError);
  });

  it('should throw SELF_INVITE if user tries to accept own code', async () => {
    const service = createService();
    await expect(service.acceptCode('ABCD1234', USER_A)).rejects.toThrow(SelfInviteError);
  });
});

describe('PartnerInviteService.revoke', () => {
  it('should set status to REVOKED', async () => {
    const service = createService({ findById: jest.fn().mockResolvedValue({ ...pendingInvite, inviterId: USER_A }) });
    const result = await service.revokeInvite(INVITE_ID, USER_A);
    expect(result.status).toBe('REVOKED');
  });

  it('should revoke all approved reshare requests', async () => {
    const reshareRepo = mockReshareRepo();
    const invite = { ...pendingInvite, inviterId: USER_A, inviteeId: USER_B };
    const service = new PartnerInviteService(
      mockInviteRepo({ findById: jest.fn().mockResolvedValue(invite) }),
      reshareRepo, mockDataProvider(),
    );
    await service.revokeInvite(INVITE_ID, USER_A);
    expect(reshareRepo.revokeAllForPartner).toHaveBeenCalledWith(USER_B, USER_A);
  });

  it('should deactivate share links created by partner', async () => {
    const dp = mockDataProvider();
    const invite = { ...pendingInvite, inviterId: USER_A, inviteeId: USER_B };
    const service = new PartnerInviteService(
      mockInviteRepo({ findById: jest.fn().mockResolvedValue(invite) }),
      mockReshareRepo(), dp,
    );
    await service.revokeInvite(INVITE_ID, USER_A);
    expect(dp.deactivatePartnerShareLinks).toHaveBeenCalledWith(USER_B, [USER_A]);
  });
});
