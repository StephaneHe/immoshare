/**
 * Tests for Partner Service + Store (M7)
 * Test plan: M7-01 through M7-07
 */
import { api } from '../../src/services/api';
import { partnerService } from '../../src/services/partner.service';
import { usePartnerStore } from '../../src/stores/partner.store';

jest.mock('../../src/services/api', () => ({
  api: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

const fakePartner = {
  inviteId: 'inv1', partnerId: 'u2', partnerName: 'Bob',
  partnerEmail: 'bob@test.com', since: '2026-01-01',
};
const fakeInvite = {
  id: 'inv1', code: 'ABC12345', inviterId: 'u1',
  status: 'pending' as const, expiresAt: '2026-01-03', createdAt: '2026-01-01',
};
const fakeReshare = {
  id: 'rs1', requesterId: 'u2', requesterName: 'Bob',
  propertyId: 'p1', propertyTitle: 'Nice Apt',
  status: 'pending' as const, createdAt: '2026-01-01',
};

beforeEach(() => {
  jest.clearAllMocks();
  usePartnerStore.setState({
    partners: [], invites: [], receivedReshares: [], sentReshares: [],
    catalogProperties: [], isLoading: false, error: null,
  });
});

describe('Partner Service', () => {
  it('listPartners() calls GET /partners', async () => {
    mockApi.get.mockResolvedValue([fakePartner]);
    await partnerService.listPartners();
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/partners');
  });

  it('createInvite() calls POST /partner-invites', async () => {
    mockApi.post.mockResolvedValue(fakeInvite);
    await partnerService.createInvite();
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/partner-invites');
  });

  it('acceptInvite() calls POST /partner-invites/accept', async () => {
    mockApi.post.mockResolvedValue(fakePartner);
    await partnerService.acceptInvite('ABC12345');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/partner-invites/accept', { code: 'ABC12345' });
  });

  it('removePartner() calls DELETE /partners/:inviteId', async () => {
    mockApi.delete.mockResolvedValue(undefined);
    await partnerService.removePartner('inv1');
    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/partners/inv1');
  });

  it('listPartnerProperties() calls GET /partners/:id/properties', async () => {
    mockApi.get.mockResolvedValue([]);
    await partnerService.listPartnerProperties('inv1');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/partners/inv1/properties');
  });

  it('createReshareRequest() calls POST /reshare-requests', async () => {
    mockApi.post.mockResolvedValue(fakeReshare);
    await partnerService.createReshareRequest('p1', 'inv1');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/reshare-requests', { propertyId: 'p1', inviteId: 'inv1' });
  });

  it('approveReshare() calls POST /reshare-requests/:id/approve', async () => {
    mockApi.post.mockResolvedValue({ ...fakeReshare, status: 'approved' });
    await partnerService.approveReshare('rs1');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/reshare-requests/rs1/approve');
  });

  it('rejectReshare() calls POST /reshare-requests/:id/reject', async () => {
    mockApi.post.mockResolvedValue({ ...fakeReshare, status: 'rejected' });
    await partnerService.rejectReshare('rs1');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/reshare-requests/rs1/reject');
  });
});

describe('Partner Store', () => {
  // M7-01: List active partners
  it('M7-01: fetchPartners() populates partners and reshares', async () => {
    mockApi.get
      .mockResolvedValueOnce([fakePartner])      // listPartners
      .mockResolvedValueOnce([fakeReshare])       // receivedReshares
      .mockResolvedValueOnce([]);                 // sentReshares
    await usePartnerStore.getState().fetchPartners();
    const s = usePartnerStore.getState();
    expect(s.partners).toHaveLength(1);
    expect(s.receivedReshares).toHaveLength(1);
  });

  // M7-02: Create partner invite
  it('M7-02: createInvite() adds to invites', async () => {
    mockApi.post.mockResolvedValue(fakeInvite);
    const invite = await usePartnerStore.getState().createInvite();
    expect(invite.code).toBe('ABC12345');
    expect(usePartnerStore.getState().invites).toHaveLength(1);
  });

  // M7-03: Accept invite
  it('M7-03: acceptInvite() adds partner', async () => {
    mockApi.post.mockResolvedValue(fakePartner);
    await usePartnerStore.getState().acceptInvite('ABC12345');
    expect(usePartnerStore.getState().partners).toHaveLength(1);
  });

  // M7-04: Remove partner
  it('M7-04: removePartner() removes from list', async () => {
    usePartnerStore.setState({ partners: [fakePartner] });
    mockApi.delete.mockResolvedValue(undefined);
    await usePartnerStore.getState().removePartner('inv1');
    expect(usePartnerStore.getState().partners).toHaveLength(0);
  });

  // M7-05: List partner's catalog
  it('M7-05: fetchCatalog() populates properties', async () => {
    mockApi.get.mockResolvedValue([{ id: 'p1', title: 'Apt', type: 'apartment', status: 'active', city: 'TLV', price: 1000000 }]);
    await usePartnerStore.getState().fetchCatalog('inv1');
    expect(usePartnerStore.getState().catalogProperties).toHaveLength(1);
  });

  // M7-06: Request reshare
  it('M7-06: createReshareRequest() adds to sent reshares', async () => {
    mockApi.post.mockResolvedValue(fakeReshare);
    await usePartnerStore.getState().createReshareRequest('p1', 'inv1');
    expect(usePartnerStore.getState().sentReshares).toHaveLength(1);
  });

  // M7-07: Approve/reject reshare
  it('M7-07: approveReshare() updates status', async () => {
    usePartnerStore.setState({ receivedReshares: [fakeReshare] });
    mockApi.post.mockResolvedValue({ ...fakeReshare, status: 'approved' });
    await usePartnerStore.getState().approveReshare('rs1');
    expect(usePartnerStore.getState().receivedReshares[0].status).toBe('approved');
  });

  it('rejectReshare() updates status', async () => {
    usePartnerStore.setState({ receivedReshares: [fakeReshare] });
    mockApi.post.mockResolvedValue({ ...fakeReshare, status: 'rejected' });
    await usePartnerStore.getState().rejectReshare('rs1');
    expect(usePartnerStore.getState().receivedReshares[0].status).toBe('rejected');
  });
});
