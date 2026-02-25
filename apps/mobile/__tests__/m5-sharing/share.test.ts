/**
 * Tests for Share Service (M5 Sharing - Links)
 * Test plan: M5-06 through M5-09
 */
import { api } from '../../src/services/api';
import { shareService } from '../../src/services/share.service';

jest.mock('../../src/services/api', () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

const fakeLink = {
  id: 'sl1', token: 'abc123', pageId: 'p1', contactId: 'c1',
  channel: 'email' as const, isActive: true, expiresAt: null,
  viewCount: 0, lastViewedAt: null, createdAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => jest.clearAllMocks());

describe('Share Service', () => {
  // M5-06: Create share batch
  it('M5-06: createBatch() calls POST /pages/:pageId/share', async () => {
    mockApi.post.mockResolvedValue({
      batch: { id: 'b1', totalLinks: 2, successCount: 2, failureCount: 0 },
      links: [fakeLink], warnings: [],
    });
    const result = await shareService.createBatch('p1', {
      contactIds: ['c1'], channels: ['email'], expirationDays: 30,
    });
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/pages/p1/share', {
      contactIds: ['c1'], channels: ['email'], expirationDays: 30,
    });
    expect(result.batch.totalLinks).toBe(2);
  });

  // M5-07: List share links
  it('M5-07: listLinks() calls GET /share-links with params', async () => {
    mockApi.get.mockResolvedValue({ shareLinks: [fakeLink], total: 1, page: 1, totalPages: 1 });
    const result = await shareService.listLinks({ page: 1, propertyId: 'prop1' });
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/share-links?page=1&propertyId=prop1');
    expect(result.shareLinks).toHaveLength(1);
  });

  // M5-08: Deactivate share link
  it('M5-08: deactivateLink() calls PATCH /share-links/:id/deactivate', async () => {
    mockApi.patch.mockResolvedValue({ ...fakeLink, isActive: false });
    const result = await shareService.deactivateLink('sl1');
    expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/share-links/sl1/deactivate');
    expect(result.isActive).toBe(false);
  });

  // M5-09: Get share link detail with events
  it('M5-09: getLinkEvents() calls GET /share-links/:id/events', async () => {
    mockApi.get.mockResolvedValue([{ id: 'e1', type: 'page_opened', createdAt: '2026-01-01', metadata: {} }]);
    const events = await shareService.getLinkEvents('sl1');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/share-links/sl1/events');
    expect(events).toHaveLength(1);
  });

  it('getLinkById() calls GET /share-links/:id', async () => {
    mockApi.get.mockResolvedValue(fakeLink);
    await shareService.getLinkById('sl1');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/share-links/sl1');
  });

  it('listPropertyLinks() calls GET /properties/:id/share-links', async () => {
    mockApi.get.mockResolvedValue([fakeLink]);
    await shareService.listPropertyLinks('prop1');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/properties/prop1/share-links');
  });
});
