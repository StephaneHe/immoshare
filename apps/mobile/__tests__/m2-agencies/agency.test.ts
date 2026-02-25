/**
 * Tests for Agency Service (M2)
 * Test plan: M2-01 through M2-05
 */
import { api } from '../../src/services/api';
import { agencyService } from '../../src/services/agency.service';

jest.mock('../../src/services/api', () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

const fakeAgency = {
  id: 'a1', name: 'Top Agency', logoUrl: null, address: null,
  phone: null, email: null, adminId: 'u1',
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};

const fakeMember = { id: 'u1', email: 'admin@test.com', name: 'Admin', role: 'agency_admin', joinedAt: '2026-01-01' };
const fakeInvite = { id: 'ai1', email: 'new@test.com', token: 'tok123', status: 'pending' as const, expiresAt: '2026-01-03', createdAt: '2026-01-01' };

beforeEach(() => jest.clearAllMocks());

describe('Agency Service', () => {
  // M2-01: Fetch current user's agency
  it('M2-01: getById() calls GET /agencies/:id', async () => {
    mockApi.get.mockResolvedValue(fakeAgency);
    await agencyService.getById('a1');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/agencies/a1');
  });

  // M2-02: List agency members
  it('M2-02: listMembers() calls GET /agencies/:id/agents', async () => {
    mockApi.get.mockResolvedValue([fakeMember]);
    const result = await agencyService.listMembers('a1');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/agencies/a1/agents');
    expect(result).toHaveLength(1);
  });

  // M2-03: Create agency invitation
  it('M2-03: createInvite() calls POST /agencies/:id/invites', async () => {
    mockApi.post.mockResolvedValue(fakeInvite);
    await agencyService.createInvite('a1', 'new@test.com');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/agencies/a1/invites', { email: 'new@test.com' });
  });

  // M2-04: Accept/decline agency invite
  it('M2-04: acceptInvite() calls POST /agency-invites/:token/accept', async () => {
    mockApi.post.mockResolvedValue(undefined);
    await agencyService.acceptInvite('tok123');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/agency-invites/tok123/accept');
  });

  it('declineInvite() calls POST /agency-invites/:token/decline', async () => {
    mockApi.post.mockResolvedValue(undefined);
    await agencyService.declineInvite('tok123');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/agency-invites/tok123/decline');
  });

  // M2-05: Leave agency
  it('M2-05: leave() calls POST /agencies/:id/agents/leave', async () => {
    mockApi.post.mockResolvedValue(undefined);
    await agencyService.leave('a1');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/agencies/a1/agents/leave');
  });

  it('create() calls POST /agencies', async () => {
    mockApi.post.mockResolvedValue(fakeAgency);
    await agencyService.create({ name: 'New Agency' });
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/agencies', { name: 'New Agency' });
  });

  it('update() calls PATCH /agencies/:id', async () => {
    mockApi.patch.mockResolvedValue({ ...fakeAgency, name: 'Updated' });
    await agencyService.update('a1', { name: 'Updated' } as any);
    expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/agencies/a1', { name: 'Updated' });
  });

  it('removeMember() calls DELETE /agencies/:id/agents/:userId', async () => {
    mockApi.delete.mockResolvedValue(undefined);
    await agencyService.removeMember('a1', 'u2');
    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/agencies/a1/agents/u2');
  });

  it('revokeInvite() calls DELETE /agencies/:id/invites/:inviteId', async () => {
    mockApi.delete.mockResolvedValue(undefined);
    await agencyService.revokeInvite('a1', 'ai1');
    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/agencies/a1/invites/ai1');
  });

  it('transferAdmin() calls POST /agencies/:id/transfer-admin', async () => {
    mockApi.post.mockResolvedValue(undefined);
    await agencyService.transferAdmin('a1', 'u2');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/agencies/a1/transfer-admin', { newAdminId: 'u2' });
  });

  it('listMyInvites() calls GET /users/me/agency-invites', async () => {
    mockApi.get.mockResolvedValue([fakeInvite]);
    await agencyService.listMyInvites();
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/users/me/agency-invites');
  });
});
