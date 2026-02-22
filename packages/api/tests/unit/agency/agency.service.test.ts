import { AgencyService } from '../../../src/modules/agency/agency.service';
import { IAgencyRepository, IAgencyInviteRepository } from '../../../src/modules/agency/agency.types';
import {
  AgencyNotFoundError,
  AgencyAlreadyExistsError,
  NotAgencyOwnerError,
  AgentNotInAgencyError,
  CannotRemoveSelfError,
  AdminCannotLeaveError,
  ForbiddenRoleError,
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
const NEW_ADMIN_ID = 'dddddddd-1111-2222-3333-444444444444';

const sampleAgency = {
  id: AGENCY_ID,
  name: 'Test Agency',
  address: '123 Main St',
  city: 'Tel Aviv',
  phone: '+972501234567',
  email: 'agency@test.com',
  logoUrl: null,
  website: null,
  adminId: ADMIN_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

// ─── Tests ───

describe('AgencyService.createAgency', () => {
  it('should create agency and link to admin user', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyByAdminId: jest.fn().mockResolvedValue(null),
      createAgency: jest.fn().mockResolvedValue(sampleAgency),
    });
    const service = new AgencyService(agencyRepo, mockInviteRepo());

    const result = await service.createAgency(ADMIN_ID, 'agency_admin', {
      name: 'Test Agency',
      address: '123 Main St',
      city: 'Tel Aviv',
    });

    expect(result.id).toBe(AGENCY_ID);
    expect(result.name).toBe('Test Agency');
    expect(result.adminId).toBe(ADMIN_ID);
    expect(agencyRepo.createAgency).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Test Agency', adminId: ADMIN_ID }),
    );
  });

  it('should throw AGENCY_ALREADY_EXISTS if user already owns an agency', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyByAdminId: jest.fn().mockResolvedValue(sampleAgency),
    });
    const service = new AgencyService(agencyRepo, mockInviteRepo());

    await expect(
      service.createAgency(ADMIN_ID, 'agency_admin', { name: 'Another Agency' }),
    ).rejects.toThrow(AgencyAlreadyExistsError);
  });

  it('should throw FORBIDDEN_ROLE if user role is not agency_admin', async () => {
    const service = new AgencyService(mockAgencyRepo(), mockInviteRepo());

    await expect(
      service.createAgency(AGENT_ID, 'agent', { name: 'My Agency' }),
    ).rejects.toThrow(ForbiddenRoleError);
  });
});

describe('AgencyService.updateAgency', () => {
  it('should update agency name', async () => {
    const updated = { ...sampleAgency, name: 'Updated Name' };
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
      updateAgency: jest.fn().mockResolvedValue(updated),
    });
    const service = new AgencyService(agencyRepo, mockInviteRepo());

    const result = await service.updateAgency(AGENCY_ID, ADMIN_ID, { name: 'Updated Name' });

    expect(result.name).toBe('Updated Name');
    expect(agencyRepo.updateAgency).toHaveBeenCalledWith(AGENCY_ID, { name: 'Updated Name' });
  });

  it('should throw NOT_AGENCY_OWNER if user is not agency admin', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
    });
    const service = new AgencyService(agencyRepo, mockInviteRepo());

    await expect(
      service.updateAgency(AGENCY_ID, AGENT_ID, { name: 'Hack' }),
    ).rejects.toThrow(NotAgencyOwnerError);
  });

  it('should throw AGENCY_NOT_FOUND for non-existent agency', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(null),
    });
    const service = new AgencyService(agencyRepo, mockInviteRepo());

    await expect(
      service.updateAgency('nonexistent-id', ADMIN_ID, { name: 'X' }),
    ).rejects.toThrow(AgencyNotFoundError);
  });
});

describe('AgencyService.deleteAgency', () => {
  it('should soft-delete agency', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
    });
    const inviteRepo = mockInviteRepo();
    const service = new AgencyService(agencyRepo, inviteRepo);

    await service.deleteAgency(AGENCY_ID, ADMIN_ID);

    expect(agencyRepo.softDeleteAgency).toHaveBeenCalledWith(AGENCY_ID);
  });

  it('should set agencyId to null for all members', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
    });
    const service = new AgencyService(agencyRepo, mockInviteRepo());

    await service.deleteAgency(AGENCY_ID, ADMIN_ID);

    expect(agencyRepo.removeAllAgentsFromAgency).toHaveBeenCalledWith(AGENCY_ID);
  });

  it('should revoke all pending invites', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
    });
    const inviteRepo = mockInviteRepo();
    const service = new AgencyService(agencyRepo, inviteRepo);

    await service.deleteAgency(AGENCY_ID, ADMIN_ID);

    expect(inviteRepo.revokeAllPendingInvites).toHaveBeenCalledWith(AGENCY_ID);
  });

  it('should throw NOT_AGENCY_OWNER if user is not admin', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
    });
    const service = new AgencyService(agencyRepo, mockInviteRepo());

    await expect(service.deleteAgency(AGENCY_ID, AGENT_ID)).rejects.toThrow(NotAgencyOwnerError);
  });
});

describe('AgencyService.listAgents', () => {
  it('should return all agents of the agency', async () => {
    const members = [
      { id: ADMIN_ID, email: 'admin@test.com', name: 'Admin', phone: null, role: 'agency_admin', createdAt: new Date() },
      { id: AGENT_ID, email: 'agent@test.com', name: 'Agent', phone: null, role: 'agent', createdAt: new Date() },
    ];
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
      listAgencyMembers: jest.fn().mockResolvedValue(members),
    });
    const service = new AgencyService(agencyRepo, mockInviteRepo());

    const result = await service.listAgents(AGENCY_ID, ADMIN_ID);

    expect(result).toHaveLength(2);
    expect(result[0].email).toBe('admin@test.com');
  });

  it('should throw AGENCY_NOT_FOUND for non-existent agency', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(null),
    });
    const service = new AgencyService(agencyRepo, mockInviteRepo());

    await expect(service.listAgents('bad-id', ADMIN_ID)).rejects.toThrow(AgencyNotFoundError);
  });
});

describe('AgencyService.removeAgent', () => {
  it('should set agent agencyId to null', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
      findUserById: jest.fn().mockResolvedValue({ id: AGENT_ID, email: 'a@b.com', name: 'Agent', role: 'agent', agencyId: AGENCY_ID }),
    });
    const service = new AgencyService(agencyRepo, mockInviteRepo());

    await service.removeAgent(AGENCY_ID, ADMIN_ID, AGENT_ID);

    expect(agencyRepo.setUserAgency).toHaveBeenCalledWith(AGENT_ID, null);
  });

  it('should throw CANNOT_REMOVE_SELF if admin tries to remove themselves', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
    });
    const service = new AgencyService(agencyRepo, mockInviteRepo());

    await expect(
      service.removeAgent(AGENCY_ID, ADMIN_ID, ADMIN_ID),
    ).rejects.toThrow(CannotRemoveSelfError);
  });

  it('should throw AGENT_NOT_IN_AGENCY if agent is not in agency', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
      findUserById: jest.fn().mockResolvedValue({ id: AGENT_ID, email: 'a@b.com', name: 'Agent', role: 'agent', agencyId: 'other-agency' }),
    });
    const service = new AgencyService(agencyRepo, mockInviteRepo());

    await expect(
      service.removeAgent(AGENCY_ID, ADMIN_ID, AGENT_ID),
    ).rejects.toThrow(AgentNotInAgencyError);
  });

  it('should throw NOT_AGENCY_OWNER if caller is not admin', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
    });
    const service = new AgencyService(agencyRepo, mockInviteRepo());

    await expect(
      service.removeAgent(AGENCY_ID, AGENT_ID, NEW_ADMIN_ID),
    ).rejects.toThrow(NotAgencyOwnerError);
  });
});

describe('AgencyService.leaveAgency', () => {
  it('should set agent agencyId to null', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
      findUserById: jest.fn().mockResolvedValue({ id: AGENT_ID, email: 'a@b.com', name: 'Agent', role: 'agent', agencyId: AGENCY_ID }),
    });
    const service = new AgencyService(agencyRepo, mockInviteRepo());

    await service.leaveAgency(AGENCY_ID, AGENT_ID);

    expect(agencyRepo.setUserAgency).toHaveBeenCalledWith(AGENT_ID, null);
  });

  it('should throw ADMIN_CANNOT_LEAVE if user is agency admin', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
    });
    const service = new AgencyService(agencyRepo, mockInviteRepo());

    await expect(service.leaveAgency(AGENCY_ID, ADMIN_ID)).rejects.toThrow(AdminCannotLeaveError);
  });
});

describe('AgencyService.transferAdmin', () => {
  it('should swap roles between old and new admin', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
      findUserById: jest.fn().mockResolvedValue({ id: NEW_ADMIN_ID, email: 'new@test.com', name: 'New', role: 'agent', agencyId: AGENCY_ID }),
    });
    const service = new AgencyService(agencyRepo, mockInviteRepo());

    await service.transferAdmin(AGENCY_ID, ADMIN_ID, NEW_ADMIN_ID);

    expect(agencyRepo.setUserRole).toHaveBeenCalledWith(ADMIN_ID, 'agent');
    expect(agencyRepo.setUserRole).toHaveBeenCalledWith(NEW_ADMIN_ID, 'agency_admin');
  });

  it('should throw AGENT_NOT_IN_AGENCY if target is not in agency', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
      findUserById: jest.fn().mockResolvedValue({ id: NEW_ADMIN_ID, email: 'new@test.com', name: 'New', role: 'agent', agencyId: 'other-agency' }),
    });
    const service = new AgencyService(agencyRepo, mockInviteRepo());

    await expect(
      service.transferAdmin(AGENCY_ID, ADMIN_ID, NEW_ADMIN_ID),
    ).rejects.toThrow(AgentNotInAgencyError);
  });

  it('should throw NOT_AGENCY_OWNER if caller is not admin', async () => {
    const agencyRepo = mockAgencyRepo({
      findAgencyById: jest.fn().mockResolvedValue(sampleAgency),
    });
    const service = new AgencyService(agencyRepo, mockInviteRepo());

    await expect(
      service.transferAdmin(AGENCY_ID, AGENT_ID, NEW_ADMIN_ID),
    ).rejects.toThrow(NotAgencyOwnerError);
  });
});
