/**
 * Tests for Page Service (M4)
 * Test plan: M4-01 through M4-06
 */
import { api } from '../../src/services/api';
import { pageService } from '../../src/services/page.service';

jest.mock('../../src/services/api', () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

const fakePage = {
  id: 'pg1', propertyId: 'p1', title: 'Main Page',
  sections: [{ type: 'gallery', order: 0 }],
  locale: 'en', isDefault: true,
  createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
};

beforeEach(() => jest.clearAllMocks());

describe('Page Service', () => {
  // M4-01: List pages for a property
  it('M4-01: listForProperty() calls GET /properties/:id/pages', async () => {
    mockApi.get.mockResolvedValue([fakePage]);
    const result = await pageService.listForProperty('p1');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/properties/p1/pages');
    expect(result).toHaveLength(1);
  });

  // M4-02: Get page detail
  it('M4-02: getById() calls GET /pages/:id', async () => {
    mockApi.get.mockResolvedValue(fakePage);
    const result = await pageService.getById('pg1');
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/pages/pg1');
    expect(result.title).toBe('Main Page');
  });

  // M4-03: Create page
  it('M4-03: create() calls POST /properties/:id/pages', async () => {
    mockApi.post.mockResolvedValue(fakePage);
    await pageService.create('p1', { title: 'Main Page' });
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/properties/p1/pages', { title: 'Main Page' });
  });

  // M4-04: Update page sections
  it('M4-04: update() calls PATCH /pages/:id', async () => {
    mockApi.patch.mockResolvedValue({ ...fakePage, title: 'Updated' });
    await pageService.update('pg1', { title: 'Updated' });
    expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/pages/pg1', { title: 'Updated' });
  });

  // M4-05: Delete page
  it('M4-05: remove() calls DELETE /pages/:id', async () => {
    mockApi.delete.mockResolvedValue(undefined);
    await pageService.remove('pg1');
    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/pages/pg1');
  });

  // M4-06: Preview page
  it('M4-06: getPreviewUrl() returns correct URL', async () => {
    const url = await pageService.getPreviewUrl('pg1');
    expect(url).toBe('/api/v1/pages/pg1/preview');
  });
});
