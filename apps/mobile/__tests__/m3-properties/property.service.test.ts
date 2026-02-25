/**
 * Tests for PropertyService (services/property.service.ts)
 * Test plan: M3-01 through M3-08
 */
import { propertyService } from '../../src/services/property.service';
import { api } from '../../src/services/api';

jest.mock('../../src/services/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  ApiError: class extends Error {
    status: number;
    code: string;
    constructor(s: number, c: string, m: string) { super(m); this.status = s; this.code = c; }
  },
}));

const mockApi = api as jest.Mocked<typeof api>;

beforeEach(() => jest.clearAllMocks());

describe('PropertyService', () => {
  // M3-01
  it('M3-01: list() calls GET /properties with pagination params', async () => {
    mockApi.get.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 });

    await propertyService.list({ page: 2, limit: 10 });

    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/properties?page=2&limit=10');
  });

  // M3-02
  it('M3-02: list() applies filters (status, type, search)', async () => {
    mockApi.get.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 });

    await propertyService.list({ status: 'active', propertyType: 'apartment', search: 'tel aviv' });

    const url = mockApi.get.mock.calls[0][0];
    expect(url).toContain('status=active');
    expect(url).toContain('propertyType=apartment');
    expect(url).toContain('search=tel+aviv');
  });

  // M3-03
  it('M3-03: getById(id) calls GET /properties/:id', async () => {
    mockApi.get.mockResolvedValue({ id: 'p1', title: 'Apt' });

    await propertyService.getById('p1');

    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/properties/p1');
  });

  // M3-04
  it('M3-04: create(data) calls POST /properties', async () => {
    const input = { title: 'New Apt', propertyType: 'apartment' as const };
    mockApi.post.mockResolvedValue({ id: 'p2', ...input });

    await propertyService.create(input);

    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/properties', input);
  });

  // M3-05
  it('M3-05: update(id, data) calls PUT /properties/:id', async () => {
    const input = { title: 'Updated' };
    mockApi.put.mockResolvedValue({ id: 'p1', title: 'Updated' });

    await propertyService.update('p1', input);

    expect(mockApi.put).toHaveBeenCalledWith('/api/v1/properties/p1', input);
  });

  // M3-06
  it('M3-06: remove(id) calls DELETE /properties/:id', async () => {
    mockApi.delete.mockResolvedValue(undefined);

    await propertyService.remove('p1');

    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/properties/p1');
  });

  // M3-07
  it('M3-07: duplicate(id) calls POST /properties/:id/duplicate', async () => {
    mockApi.post.mockResolvedValue({ id: 'p3', title: 'Copy' });

    await propertyService.duplicate('p1');

    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/properties/p1/duplicate');
  });

  // M3-08
  it('M3-08: changeStatus(id, status) calls PATCH /properties/:id/status', async () => {
    mockApi.patch.mockResolvedValue({ id: 'p1', status: 'active' });

    await propertyService.changeStatus('p1', 'active');

    expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/properties/p1/status', { status: 'active' });
  });
});
