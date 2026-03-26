/**
 * Contact Creation & Property Sharing Flow Tests (M5)
 *
 * End-to-end flow through store + service layers:
 * 1. Create contacts (name, email, phone)
 * 2. Verify contacts appear in the store
 * 3. Share a property page to selected contacts via channels
 * 4. Verify share links are created
 * 5. Verify share history shows the links
 * 6. Update a contact, delete a contact
 * 7. Deactivate a share link
 */
import { api } from '../../src/services/api';
import { contactService } from '../../src/services/contact.service';
import { shareService } from '../../src/services/share.service';
import { useContactStore } from '../../src/stores/contact.store';

jest.mock('../../src/services/api', () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
  ApiError: class extends Error {
    status: number;
    code: string;
    constructor(s: number, c: string, m: string) { super(m); this.status = s; this.code = c; }
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

// ─── Fake data ──────────────────────────────────────────
const contact1 = {
  id: 'c1', userId: 'u1', name: 'Sarah Cohen', email: 'sarah@realty.com',
  phone: '+972501111111', company: 'Best Realty', notes: null,
  createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z',
};

const contact2 = {
  id: 'c2', userId: 'u1', name: 'David Levi', email: 'david@homes.com',
  phone: '+972502222222', company: null, notes: 'VIP buyer',
  createdAt: '2026-03-02T00:00:00Z', updatedAt: '2026-03-02T00:00:00Z',
};

const contact3 = {
  id: 'c3', userId: 'u1', name: 'Rachel Mizrahi', email: null,
  phone: '+972503333333', company: null, notes: null,
  createdAt: '2026-03-03T00:00:00Z', updatedAt: '2026-03-03T00:00:00Z',
};

const shareLink1 = {
  id: 'sl1', token: 'tok-sarah-wa', pageId: 'page1', contactId: 'c1',
  channel: 'whatsapp' as const, isActive: true, expiresAt: '2026-04-01T00:00:00Z',
  viewCount: 0, lastViewedAt: null, createdAt: '2026-03-10T00:00:00Z',
};

const shareLink2 = {
  id: 'sl2', token: 'tok-sarah-em', pageId: 'page1', contactId: 'c1',
  channel: 'email' as const, isActive: true, expiresAt: '2026-04-01T00:00:00Z',
  viewCount: 0, lastViewedAt: null, createdAt: '2026-03-10T00:00:00Z',
};

const shareLink3 = {
  id: 'sl3', token: 'tok-david-wa', pageId: 'page1', contactId: 'c2',
  channel: 'whatsapp' as const, isActive: true, expiresAt: '2026-04-01T00:00:00Z',
  viewCount: 0, lastViewedAt: null, createdAt: '2026-03-10T00:00:00Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  useContactStore.setState({
    contacts: [], total: 0, page: 1, totalPages: 0,
    isLoading: false, error: null, search: '',
  });
});

// ─── 1. CONTACT CREATION ────────────────────────────────
describe('Contact creation flow', () => {
  it('creates a contact with name and email', async () => {
    mockApi.post.mockResolvedValue(contact1);
    const result = await useContactStore.getState().createContact({
      name: 'Sarah Cohen', email: 'sarah@realty.com', phone: '+972501111111', company: 'Best Realty',
    });
    expect(result.id).toBe('c1');
    expect(result.name).toBe('Sarah Cohen');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/contacts', expect.objectContaining({
      name: 'Sarah Cohen', email: 'sarah@realty.com',
    }));
  });

  it('creates a contact with phone only (no email)', async () => {
    mockApi.post.mockResolvedValue(contact3);
    const result = await useContactStore.getState().createContact({
      name: 'Rachel Mizrahi', phone: '+972503333333',
    });
    expect(result.email).toBeNull();
    expect(result.phone).toBe('+972503333333');
  });

  it('adding multiple contacts accumulates in the store', async () => {
    mockApi.post
      .mockResolvedValueOnce(contact1)
      .mockResolvedValueOnce(contact2)
      .mockResolvedValueOnce(contact3);

    await useContactStore.getState().createContact({ name: 'Sarah Cohen' });
    await useContactStore.getState().createContact({ name: 'David Levi' });
    await useContactStore.getState().createContact({ name: 'Rachel Mizrahi' });

    const state = useContactStore.getState();
    expect(state.contacts).toHaveLength(3);
    expect(state.total).toBe(3);
    // Most recent first (prepend)
    expect(state.contacts[0].name).toBe('Rachel Mizrahi');
    expect(state.contacts[2].name).toBe('Sarah Cohen');
  });

  it('rejects duplicate contact creation gracefully', async () => {
    mockApi.post.mockRejectedValue(new Error('Contact with this email already exists'));
    await expect(
      useContactStore.getState().createContact({ name: 'Sarah Cohen', email: 'sarah@realty.com' })
    ).rejects.toThrow('Contact with this email already exists');
    expect(useContactStore.getState().contacts).toHaveLength(0);
  });
});

// ─── 2. CONTACT UPDATE & DELETE ─────────────────────────
describe('Contact update and delete flow', () => {
  beforeEach(() => {
    useContactStore.setState({ contacts: [contact1, contact2], total: 2 });
  });

  it('updates a contact name in the store', async () => {
    const updated = { ...contact1, name: 'Sarah Cohen-Levy' };
    mockApi.patch.mockResolvedValue(updated);
    await useContactStore.getState().updateContact('c1', { name: 'Sarah Cohen-Levy' });
    expect(useContactStore.getState().contacts[0].name).toBe('Sarah Cohen-Levy');
    expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/contacts/c1', { name: 'Sarah Cohen-Levy' });
  });

  it('updates contact email', async () => {
    const updated = { ...contact2, email: 'new@email.com' };
    mockApi.patch.mockResolvedValue(updated);
    await useContactStore.getState().updateContact('c2', { email: 'new@email.com' });
    expect(useContactStore.getState().contacts[1].email).toBe('new@email.com');
  });

  it('deletes a contact and decrements total', async () => {
    mockApi.delete.mockResolvedValue(undefined);
    await useContactStore.getState().deleteContact('c1');
    const state = useContactStore.getState();
    expect(state.contacts).toHaveLength(1);
    expect(state.contacts[0].id).toBe('c2');
    expect(state.total).toBe(1);
  });

  it('deleting the last contact results in empty list', async () => {
    useContactStore.setState({ contacts: [contact1], total: 1 });
    mockApi.delete.mockResolvedValue(undefined);
    await useContactStore.getState().deleteContact('c1');
    expect(useContactStore.getState().contacts).toHaveLength(0);
    expect(useContactStore.getState().total).toBe(0);
  });
});

// ─── 3. PROPERTY SHARING ────────────────────────────────
describe('Property sharing flow', () => {
  it('shares a page to 1 contact via 2 channels (whatsapp + email)', async () => {
    mockApi.post.mockResolvedValue({
      batch: { id: 'b1', totalLinks: 2, successCount: 2, failureCount: 0 },
      links: [shareLink1, shareLink2],
      warnings: [],
    });

    const result = await shareService.createBatch('page1', {
      contactIds: ['c1'],
      channels: ['whatsapp', 'email'],
    });

    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/pages/page1/share', {
      contactIds: ['c1'],
      channels: ['whatsapp', 'email'],
    });
    expect(result.batch.successCount).toBe(2);
    expect(result.links).toHaveLength(2);
    expect(result.links[0].channel).toBe('whatsapp');
    expect(result.links[1].channel).toBe('email');
  });

  it('shares a page to 2 contacts via 1 channel (whatsapp)', async () => {
    mockApi.post.mockResolvedValue({
      batch: { id: 'b2', totalLinks: 2, successCount: 2, failureCount: 0 },
      links: [shareLink1, shareLink3],
      warnings: [],
    });

    const result = await shareService.createBatch('page1', {
      contactIds: ['c1', 'c2'],
      channels: ['whatsapp'],
    });

    expect(result.batch.totalLinks).toBe(2);
    expect(result.links[0].contactId).toBe('c1');
    expect(result.links[1].contactId).toBe('c2');
  });

  it('shares with custom expiration days', async () => {
    mockApi.post.mockResolvedValue({
      batch: { id: 'b3', totalLinks: 1, successCount: 1, failureCount: 0 },
      links: [shareLink1], warnings: [],
    });

    await shareService.createBatch('page1', {
      contactIds: ['c1'],
      channels: ['whatsapp'],
      expirationDays: 7,
    });

    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/pages/page1/share', expect.objectContaining({
      expirationDays: 7,
    }));
  });

  it('handles partial failures (some links fail)', async () => {
    mockApi.post.mockResolvedValue({
      batch: { id: 'b4', totalLinks: 3, successCount: 2, failureCount: 1 },
      links: [shareLink1, shareLink2],
      warnings: ['Failed to create link for contact c3 via sms: no phone number'],
    });

    const result = await shareService.createBatch('page1', {
      contactIds: ['c1', 'c3'],
      channels: ['whatsapp', 'email', 'sms'],
    });

    expect(result.batch.failureCount).toBe(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('no phone number');
  });

  it('handles API error on share', async () => {
    mockApi.post.mockRejectedValue(new Error('Page not found'));
    await expect(
      shareService.createBatch('nonexistent', { contactIds: ['c1'], channels: ['email'] })
    ).rejects.toThrow('Page not found');
  });
});

// ─── 4. SHARE HISTORY ───────────────────────────────────
describe('Share history flow', () => {
  it('lists all share links', async () => {
    mockApi.get.mockResolvedValue({
      shareLinks: [shareLink1, shareLink2, shareLink3],
      total: 3, page: 1, totalPages: 1,
    });

    const result = await shareService.listLinks({ limit: 50 });
    expect(result.shareLinks).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it('lists links filtered by property', async () => {
    mockApi.get.mockResolvedValue([shareLink1, shareLink2]);

    const links = await shareService.listPropertyLinks('prop1');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/properties/prop1/share-links');
    expect(links).toHaveLength(2);
  });

  it('deactivates a share link', async () => {
    const deactivated = { ...shareLink1, isActive: false };
    mockApi.patch.mockResolvedValue(deactivated);

    const result = await shareService.deactivateLink('sl1');
    expect(result.isActive).toBe(false);
    expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/share-links/sl1/deactivate');
  });

  it('retrieves events for a share link', async () => {
    const events = [
      { id: 'e1', type: 'page_opened', createdAt: '2026-03-11T10:00:00Z', metadata: { ip: '1.2.3.4' } },
      { id: 'e2', type: 'section_viewed', createdAt: '2026-03-11T10:01:00Z', metadata: { section: 'photos' } },
    ];
    mockApi.get.mockResolvedValue(events);

    const result = await shareService.getLinkEvents('sl1');
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('page_opened');
    expect(result[1].type).toBe('section_viewed');
  });
});

// ─── 5. FULL FLOW: CREATE → SHARE → VERIFY ─────────────
describe('Full flow: create contacts, share, check history', () => {
  it('complete sharing workflow', async () => {
    // Step 1: Create 2 contacts
    mockApi.post
      .mockResolvedValueOnce(contact1)
      .mockResolvedValueOnce(contact2);

    await useContactStore.getState().createContact({ name: 'Sarah Cohen', email: 'sarah@realty.com' });
    await useContactStore.getState().createContact({ name: 'David Levi', email: 'david@homes.com' });
    expect(useContactStore.getState().contacts).toHaveLength(2);

    // Step 2: Share page to both contacts via whatsapp + email
    mockApi.post.mockResolvedValueOnce({
      batch: { id: 'b-full', totalLinks: 4, successCount: 4, failureCount: 0 },
      links: [shareLink1, shareLink2, shareLink3, { ...shareLink2, id: 'sl4', contactId: 'c2', channel: 'email' }],
      warnings: [],
    });

    const shareResult = await shareService.createBatch('page1', {
      contactIds: ['c1', 'c2'],
      channels: ['whatsapp', 'email'],
    });
    expect(shareResult.batch.successCount).toBe(4);
    expect(shareResult.links).toHaveLength(4);

    // Step 3: Verify history shows links
    mockApi.get.mockResolvedValueOnce({
      shareLinks: shareResult.links,
      total: 4, page: 1, totalPages: 1,
    });

    const history = await shareService.listLinks({ limit: 50 });
    expect(history.shareLinks).toHaveLength(4);
    expect(history.shareLinks.every((l) => l.isActive)).toBe(true);

    // Step 4: Deactivate one link
    mockApi.patch.mockResolvedValueOnce({ ...shareLink1, isActive: false });
    const deactivated = await shareService.deactivateLink('sl1');
    expect(deactivated.isActive).toBe(false);

    // Step 5: Delete a contact
    mockApi.delete.mockResolvedValue(undefined);
    await useContactStore.getState().deleteContact('c2');
    expect(useContactStore.getState().contacts).toHaveLength(1);
    expect(useContactStore.getState().contacts[0].name).toBe('Sarah Cohen');
  });
});
