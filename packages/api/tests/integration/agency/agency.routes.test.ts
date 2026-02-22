import { FastifyInstance } from 'fastify';
import { AgencyService } from '../../../src/modules/agency/agency.service';
import { AgencyInviteService } from '../../../src/modules/agency/agency-invite.service';
import { buildAgencyTestApp } from '../../helpers/testApp';
import { generateTestToken } from '../../helpers/auth';
import { UserRole } from '@immo-share/shared/constants/enums';
import {
  AgencyNotFoundError,
  AgencyAlreadyExistsError,
  NotAgencyOwnerError,
  ForbiddenRoleError,
  AlreadyInvitedError,
  InviteExpiredError,
  AlreadyInAgencyError,
} from '../../../src/modules/agency/agency.errors';

// ─── Constants ───

const AGENCY_ID = 'aaaaaaaa-1111-2222-3333-444444444444';
const ADMIN_ID = 'bbbbbbbb-1111-2222-3333-444444444444';
const AGENT_ID = 'cccccccc-1111-2222-3333-444444444444';
const INVITE_TOKEN = 'eeeeeeee-1111-2222-3333-444444444444';

const sampleAgency = {
  id: AGENCY_ID,
  name: 'Test Agency',
  address: '123 Main St',
  city: 'Tel Aviv',
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
  id: 'invite-id-1',
  agencyId: AGENCY_ID,
  email: 'newagent@test.com',
  invitedBy: ADMIN_ID,
  status: 'pending' as const,
  token: INVITE_TOKEN,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  resolvedAt: null,
};

// ─── Mock factories ───

function createMockAgencyService(): jest.Mocked<AgencyService> {
  return {
    createAgency: jest.fn().mockResolvedValue(sampleAgency),
    getAgency: jest.fn().mockResolvedValue(sampleAgency),
    updateAgency: jest.fn().mockResolvedValue({ ...sampleAgency, name: 'Updated' }),
    deleteAgency: jest.fn().mockResolvedValue(undefined),
    listAgents: jest.fn().mockResolvedValue([]),
    removeAgent: jest.fn().mockResolvedValue(undefined),
    leaveAgency: jest.fn().mockResolvedValue(undefined),
    transferAdmin: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<AgencyService>;
}

function createMockInviteService(): jest.Mocked<AgencyInviteService> {
  return {
    createInvite: jest.fn().mockResolvedValue(sampleInvite),
    acceptInvite: jest.fn().mockResolvedValue(undefined),
    declineInvite: jest.fn().mockResolvedValue(undefined),
    revokeInvite: jest.fn().mockResolvedValue(undefined),
    listInvites: jest.fn().mockResolvedValue([sampleInvite]),
    listMyPendingInvites: jest.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<AgencyInviteService>;
}

// ─── Setup ───

let app: FastifyInstance;
let agencyService: jest.Mocked<AgencyService>;
let inviteService: jest.Mocked<AgencyInviteService>;

beforeEach(async () => {
  agencyService = createMockAgencyService();
  inviteService = createMockInviteService();
  app = buildAgencyTestApp(
    agencyService as unknown as AgencyService,
    inviteService as unknown as AgencyInviteService,
  );
  await app.ready();
});

afterEach(async () => {
  await app.close();
});

// ─── Helper ───

const adminToken = () => generateTestToken({ sub: ADMIN_ID, role: UserRole.AGENCY_ADMIN });
const agentToken = () => generateTestToken({ sub: AGENT_ID, role: UserRole.AGENT });

// =====================================================================
// POST /api/v1/agencies
// =====================================================================

describe('POST /api/v1/agencies', () => {
  it('should return 201 for agency_admin', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/agencies',
      headers: { authorization: `Bearer ${adminToken()}` },
      payload: { name: 'Test Agency', city: 'Tel Aviv' },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('Test Agency');
  });

  it('should return 403 when service throws FORBIDDEN_ROLE', async () => {
    agencyService.createAgency.mockRejectedValue(new ForbiddenRoleError('agency_admin'));

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/agencies',
      headers: { authorization: `Bearer ${agentToken()}` },
      payload: { name: 'My Agency' },
    });

    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).error.code).toBe('FORBIDDEN_ROLE');
  });

  it('should return 409 when service throws AGENCY_ALREADY_EXISTS', async () => {
    agencyService.createAgency.mockRejectedValue(new AgencyAlreadyExistsError());

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/agencies',
      headers: { authorization: `Bearer ${adminToken()}` },
      payload: { name: 'Another Agency' },
    });

    expect(res.statusCode).toBe(409);
  });

  it('should return 400 on invalid body (empty name)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/agencies',
      headers: { authorization: `Bearer ${adminToken()}` },
      payload: { name: '' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 401 without auth header', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/agencies',
      payload: { name: 'Agency' },
    });

    expect(res.statusCode).toBe(401);
  });
});

// =====================================================================
// GET /api/v1/agencies/:id
// =====================================================================

describe('GET /api/v1/agencies/:id', () => {
  it('should return 200 with agency data', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/agencies/${AGENCY_ID}`,
      headers: { authorization: `Bearer ${adminToken()}` },
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.id).toBe(AGENCY_ID);
  });

  it('should return 404 when not found', async () => {
    agencyService.getAgency.mockRejectedValue(new AgencyNotFoundError());

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/agencies/${AGENCY_ID}`,
      headers: { authorization: `Bearer ${adminToken()}` },
    });

    expect(res.statusCode).toBe(404);
  });
});

// =====================================================================
// POST /api/v1/agencies/:id/invites
// =====================================================================

describe('POST /api/v1/agencies/:id/invites', () => {
  it('should return 201 and create invite', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/agencies/${AGENCY_ID}/invites`,
      headers: { authorization: `Bearer ${adminToken()}` },
      payload: { email: 'newagent@test.com' },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.email).toBe('newagent@test.com');
  });

  it('should return 403 for non-admin', async () => {
    inviteService.createInvite.mockRejectedValue(new NotAgencyOwnerError());

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/agencies/${AGENCY_ID}/invites`,
      headers: { authorization: `Bearer ${agentToken()}` },
      payload: { email: 'x@test.com' },
    });

    expect(res.statusCode).toBe(403);
  });

  it('should return 409 for already invited email', async () => {
    inviteService.createInvite.mockRejectedValue(new AlreadyInvitedError());

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/agencies/${AGENCY_ID}/invites`,
      headers: { authorization: `Bearer ${adminToken()}` },
      payload: { email: 'existing@test.com' },
    });

    expect(res.statusCode).toBe(409);
  });
});

// =====================================================================
// POST /api/v1/agency-invites/:token/accept
// =====================================================================

describe('POST /api/v1/agency-invites/:token/accept', () => {
  it('should return 200 and update user agency', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/agency-invites/${INVITE_TOKEN}/accept`,
      headers: { authorization: `Bearer ${agentToken()}` },
    });

    expect(res.statusCode).toBe(200);
    expect(inviteService.acceptInvite).toHaveBeenCalledWith(INVITE_TOKEN, AGENT_ID);
  });

  it('should return 410 for expired token', async () => {
    inviteService.acceptInvite.mockRejectedValue(new InviteExpiredError());

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/agency-invites/${INVITE_TOKEN}/accept`,
      headers: { authorization: `Bearer ${agentToken()}` },
    });

    expect(res.statusCode).toBe(410);
  });

  it('should return 409 if user already in an agency', async () => {
    inviteService.acceptInvite.mockRejectedValue(new AlreadyInAgencyError());

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/agency-invites/${INVITE_TOKEN}/accept`,
      headers: { authorization: `Bearer ${agentToken()}` },
    });

    expect(res.statusCode).toBe(409);
  });
});

// =====================================================================
// GET /api/v1/agencies/:id/agents
// =====================================================================

describe('GET /api/v1/agencies/:id/agents', () => {
  it('should return 200 with list of agents', async () => {
    agencyService.listAgents.mockResolvedValue([
      { id: ADMIN_ID, email: 'admin@test.com', name: 'Admin', phone: null, role: 'agency_admin', createdAt: new Date() },
      { id: AGENT_ID, email: 'agent@test.com', name: 'Agent', phone: null, role: 'agent', createdAt: new Date() },
    ]);

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/agencies/${AGENCY_ID}/agents`,
      headers: { authorization: `Bearer ${adminToken()}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data).toHaveLength(2);
  });

  it('should return 403 for non-member', async () => {
    agencyService.listAgents.mockRejectedValue(new NotAgencyOwnerError());

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/agencies/${AGENCY_ID}/agents`,
      headers: { authorization: `Bearer ${agentToken()}` },
    });

    expect(res.statusCode).toBe(403);
  });
});

// =====================================================================
// PATCH /api/v1/agencies/:id
// =====================================================================

describe('PATCH /api/v1/agencies/:id', () => {
  it('should return 200 on update', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/agencies/${AGENCY_ID}`,
      headers: { authorization: `Bearer ${adminToken()}` },
      payload: { name: 'Updated Name' },
    });

    expect(res.statusCode).toBe(200);
  });

  it('should return 403 for non-owner', async () => {
    agencyService.updateAgency.mockRejectedValue(new NotAgencyOwnerError());

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/agencies/${AGENCY_ID}`,
      headers: { authorization: `Bearer ${agentToken()}` },
      payload: { name: 'Hack' },
    });

    expect(res.statusCode).toBe(403);
  });
});

// =====================================================================
// DELETE /api/v1/agencies/:id
// =====================================================================

describe('DELETE /api/v1/agencies/:id', () => {
  it('should return 200 on soft delete', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/agencies/${AGENCY_ID}`,
      headers: { authorization: `Bearer ${adminToken()}` },
    });

    expect(res.statusCode).toBe(200);
    expect(agencyService.deleteAgency).toHaveBeenCalledWith(AGENCY_ID, ADMIN_ID);
  });
});
