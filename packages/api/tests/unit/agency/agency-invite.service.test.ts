import { AgencyInviteService } from '../../../src/modules/agency/agency-invite.service';
import { IAgencyRepository, IAgencyInviteRepository } from '../../../src/modules/agency/agency.types';
import {
  AgencyNotFoundError,
  NotAgencyOwnerError,
  AlreadyMemberError,
  AlreadyInvitedError,
  AlreadyInAgencyError,
  InviteNotFoundError,
  InviteExpiredError,
  InviteAlreadyResolvedError,
} from '../../../src/modules/agency/agency.errors';

// ─── Mock factories ───

function mockAgencyRepo(overrides: Partial<IAgencyRepository> = {}): IAgencyRepository {
  return {
    createAgency: jest.fn(),
    findAgencyById: jest.fn().mockResolvedValue(null),
    findAgencyByAdminId: jest.fn().mockResolvedValue(null),
    updateAgency: jest.fn(),
    softDeleteAgency: jest.fn(),
    listAgencyMembers: jest.fn().mockResolvedValue([]),
    removeAgentFromAgency: jest.fn(),
    removeAllAgentsFromAgency: jest.fn(),
    setUserAgency: jest.fn(),
    setUserRole: jest.fn(),
    findUserById: jest.fn().mockResolvedValue(null),
    findUserByEmail: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

function mockInviteRepo(overrides: Partial<IAgencyInviteRepository> = {}): IAgencyInviteRepository {
  return {
    createInvite: jest.fn(),
    findInviteByToken: jest.fn().mockResolvedValue(null),
    findInviteById: jest.fn().mockResolvedValue(null),
    findPendingInviteByEmail: jest.fn().mockResolvedValue(null),
    listInvitesByAgency: jest.fn().mockResolvedValue([]),
    listPendingInvitesByEmail: jest.fn().mockResolvedValue([]),
    updateInviteStatus: jest.fn(),
    revokeAllPendingInvites: jest.fn(),
    ...overrides,
  };
}

const AGENCY_ID = 'aaaaaaaa-1111-2222-3333-444444444444';
const ADMIN_ID = 'bbbbbbbb-1111-2222-3333-444444444444';
const AGENT_ID = 'cccccccc-1111-2222-3333-444444444444';
const INVITE_TOKEN = 'eeeeeeee-1111-2222-3333-444444444444';

const sampleAgency = {
  id: AGENCY_ID,
  name: 'Test Agency',
  address: null,
  city: null,
  phone: null,
  email: null,
  logoUrl: null,
  website: null,
  adminId: ADMIN_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const sampleInvite = {
  id: 'invite-id',
  agencyId: AGENCY_ID,
  email: 'newagent@test.com',
  invitedBy: ADMIN_ID,
  status: 'pending' as const,
  token: INVITE_TOKEN,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  createdAt: new Date(),
  resolvedAt: null,
};

// ─── Tests ───

describe('AgencyInviteService.createInvite', () => {
  it('should create invite with token and expiry', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
      findUserByEmail: jest.fn().mockResolvedValue(null), // no existing user
    });
    const inviteRepo = mockInviteRepo({
      findPendingInviteByEmail: jest.fn().mockResolvedValue(null),
      createInvite: jest.fn().mockResolvedValue(sampleInvite),
    });
    const service = new AgencyInviteService(agencyRepo, inviteRepo);

    const result = await service.createInvite(AGENCY_ID, ADMIN_ID, 'newagent@test.com');

    expect(result.token).toBeDefined();
    expect(result.agencyId).toBe(AGENCY_ID);
    expect(inviteRepo.createInvite).toHaveBeenCalledWith(
      expect.objectContaining({
        agencyId: AGENCY_ID,
        email: 'newagent@test.com',
        invitedBy: ADMIN_ID,
      }),
    );
  });

  it('should throw NOT_AGENCY_OWNER if caller is not admin', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
    });
    const service = new AgencyInviteService(agencyRepo, mockInviteRepo());

    await expect(
      service.createInvite(AGENCY_ID, AGENT_ID, 'x@test.com'),
    ).rejects.toThrow(NotAgencyOwnerError);
  });

  it('should throw ALREADY_MEMBER if email belongs to current member', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
      findUserByEmail: jest.fn().mockResolvedValue({ id: AGENT_ID, email: 'existing@test.com', name: 'Agent', role: 'agent', agencyId: AGENCY_ID }),
    });
    const service = new AgencyInviteService(agencyRepo, mockInviteRepo());

    await expect(
      service.createInvite(AGENCY_ID, ADMIN_ID, 'existing@test.com'),
    ).rejects.toThrow(AlreadyMemberError);
  });

  it('should throw ALREADY_INVITED if pending invite exists for email', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
      findUserByEmail: jest.fn().mockResolvedValue(null),
    });
    const inviteRepo = mockInviteRepo({
      findPendingInviteByEmail: jest.fn().mockResolvedValue(sampleInvite),
    });
    const service = new AgencyInviteService(agencyRepo, inviteRepo);

    await expect(
      service.createInvite(AGENCY_ID, ADMIN_ID, 'newagent@test.com'),
    ).rejects.toThrow(AlreadyInvitedError);
  });
});

describe('AgencyInviteService.acceptInvite', () => {
  it('should set user agencyId and mark invite as accepted', async () => {
    const agencyRepo = mockAgencyRepo({
      findUserById: jest.fn().mockResolvedValue({ id: AGENT_ID, email: 'newagent@test.com', name: 'Agent', role: 'agent', agencyId: null }),
    });
    const inviteRepo = mockInviteRepo({
      findInviteByToken: jest.fn().mockResolvedValue(sampleInvite),
    });
    const service = new AgencyInviteService(agencyRepo, inviteRepo);

    await service.acceptInvite(INVITE_TOKEN, AGENT_ID);

    expect(agencyRepo.setUserAgency).toHaveBeenCalledWith(AGENT_ID, AGENCY_ID);
    expect(inviteRepo.updateInviteStatus).toHaveBeenCalledWith(
      sampleInvite.id,
      'accepted',
      expect.any(Date),
    );
  });

  it('should throw INVITE_EXPIRED for expired invite', async () => {
    const expiredInvite = {
      ...sampleInvite,
      expiresAt: new Date(Date.now() - 1000), // expired
    };
    const inviteRepo = mockInviteRepo({
      findInviteByToken: jest.fn().mockResolvedValue(expiredInvite),
    });
    const service = new AgencyInviteService(mockAgencyRepo(), inviteRepo);

    await expect(service.acceptInvite(INVITE_TOKEN, AGENT_ID)).rejects.toThrow(InviteExpiredError);
  });

  it('should throw ALREADY_IN_AGENCY if user already in an agency', async () => {
    const agencyRepo = mockAgencyRepo({
      findUserById: jest.fn().mockResolvedValue({ id: AGENT_ID, email: 'a@b.com', name: 'Agent', role: 'agent', agencyId: 'other-agency' }),
    });
    const inviteRepo = mockInviteRepo({
      findInviteByToken: jest.fn().mockResolvedValue(sampleInvite),
    });
    const service = new AgencyInviteService(agencyRepo, inviteRepo);

    await expect(service.acceptInvite(INVITE_TOKEN, AGENT_ID)).rejects.toThrow(AlreadyInAgencyError);
  });

  it('should throw INVITE_NOT_FOUND for invalid token', async () => {
    const inviteRepo = mockInviteRepo({
      findInviteByToken: jest.fn().mockResolvedValue(null),
    });
    const service = new AgencyInviteService(mockAgencyRepo(), inviteRepo);

    await expect(service.acceptInvite('bad-token', AGENT_ID)).rejects.toThrow(InviteNotFoundError);
  });

  it('should throw INVITE_ALREADY_RESOLVED if invite is not pending', async () => {
    const resolvedInvite = { ...sampleInvite, status: 'accepted' as const };
    const inviteRepo = mockInviteRepo({
      findInviteByToken: jest.fn().mockResolvedValue(resolvedInvite),
    });
    const service = new AgencyInviteService(mockAgencyRepo(), inviteRepo);

    await expect(service.acceptInvite(INVITE_TOKEN, AGENT_ID)).rejects.toThrow(InviteAlreadyResolvedError);
  });
});

describe('AgencyInviteService.declineInvite', () => {
  it('should mark invite as declined', async () => {
    const inviteRepo = mockInviteRepo({
      findInviteByToken: jest.fn().mockResolvedValue(sampleInvite),
    });
    const service = new AgencyInviteService(mockAgencyRepo(), inviteRepo);

    await service.declineInvite(INVITE_TOKEN, AGENT_ID);

    expect(inviteRepo.updateInviteStatus).toHaveBeenCalledWith(
      sampleInvite.id,
      'declined',
      expect.any(Date),
    );
  });

  it('should not modify user agencyId', async () => {
    const agencyRepo = mockAgencyRepo();
    const inviteRepo = mockInviteRepo({
      findInviteByToken: jest.fn().mockResolvedValue(sampleInvite),
    });
    const service = new AgencyInviteService(agencyRepo, inviteRepo);

    await service.declineInvite(INVITE_TOKEN, AGENT_ID);

    expect(agencyRepo.setUserAgency).not.toHaveBeenCalled();
  });
});

describe('AgencyInviteService.revokeInvite', () => {
  it('should mark invite as revoked', async () => {
    const inviteRepo = mockInviteRepo({
      findInviteById: jest.fn().mockResolvedValue(sampleInvite),
    });
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
    });
    const service = new AgencyInviteService(agencyRepo, inviteRepo);

    await service.revokeInvite(sampleInvite.id, ADMIN_ID, AGENCY_ID);

    expect(inviteRepo.updateInviteStatus).toHaveBeenCalledWith(
      sampleInvite.id,
      'revoked',
      expect.any(Date),
    );
  });

  it('should throw INVITE_NOT_FOUND for invalid invite', async () => {
    const inviteRepo = mockInviteRepo({
      findInviteById: jest.fn().mockResolvedValue(null),
    });
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
    });
    const service = new AgencyInviteService(agencyRepo, inviteRepo);

    await expect(
      service.revokeInvite('bad-id', ADMIN_ID, AGENCY_ID),
    ).rejects.toThrow(InviteNotFoundError);
  });
});
