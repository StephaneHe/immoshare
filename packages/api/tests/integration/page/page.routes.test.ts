import { FastifyInstance } from 'fastify';
import { PageService, RenderData } from '../../../src/modules/page/page.service';
import { buildPageTestApp } from '../../helpers/testApp';
import { generateTestToken } from '../../helpers/auth';
import { UserRole } from '@immo-share/shared/constants/enums';
import {
  PageNotFoundError,
  NotPageOwnerError,
  PropertyNotFoundForPageError,
  InvalidSelectedElementsError,
  PageInactiveError,
} from '../../../src/modules/page/page.errors';
import { PageRecord, SelectedElements } from '../../../src/modules/page/page.types';

// ─── Constants ───

const OWNER_ID = 'aaaaaaaa-1111-2222-3333-444444444444';
const PROP_ID = 'cccccccc-1111-2222-3333-444444444444';
const PAGE_ID = 'dddddddd-1111-2222-3333-444444444444';

const selectedElements: SelectedElements = {
  sections: [
    { id: 's1', type: 'info', enabled: true, fields: ['price', 'rooms'] },
    { id: 's2', type: 'description', enabled: true },
  ],
  order: ['s1', 's2'],
};

const samplePage: PageRecord = {
  id: PAGE_ID,
  propertyId: PROP_ID,
  brandingId: null,
  title: 'Test page',
  selectedElements,
  layout: 'standard',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sampleRenderData: RenderData = {
  page: samplePage,
  property: {
    id: PROP_ID, title: 'Apartment', description: 'Lovely', propertyType: 'apartment', status: 'active',
    price: 1500000, currency: 'ILS', address: '10 Rothschild', city: 'Tel Aviv', neighborhood: 'Center',
    areaSqm: 85, rooms: 3.5, bedrooms: 2, bathrooms: 1, floor: 3, totalFloors: 8,
    yearBuilt: 2015, parking: 1, elevator: true, balcony: true, garden: false, aircon: true, furnished: false,
  },
  media: [],
  branding: {
    agentName: 'John', agencyName: 'TopAgency', logoUrl: null,
    primaryColor: '#C8102E', phone: '+972501234567', email: 'john@test.com', locale: 'en',
  },
  isPreview: true,
};

// ─── Mock factory ───

function createMockService(): jest.Mocked<PageService> {
  return {
    create: jest.fn().mockResolvedValue(samplePage),
    getById: jest.fn().mockResolvedValue(samplePage),
    listByProperty: jest.fn().mockResolvedValue([samplePage]),
    update: jest.fn().mockResolvedValue({ ...samplePage, title: 'Updated' }),
    delete: jest.fn().mockResolvedValue(undefined),
    getRenderData: jest.fn().mockResolvedValue(sampleRenderData),
  } as unknown as jest.Mocked<PageService>;
}

// ─── Setup ───

let app: FastifyInstance;
let service: jest.Mocked<PageService>;

beforeEach(async () => {
  service = createMockService();
  app = buildPageTestApp(service as unknown as PageService);
  await app.ready();
});

afterEach(async () => {
  await app.close();
});

const ownerToken = () => generateTestToken({ sub: OWNER_ID, role: UserRole.AGENT });

// =====================================================================
// POST /api/v1/properties/:propertyId/pages
// =====================================================================

describe('POST /api/v1/properties/:propertyId/pages', () => {
  it('should return 201 with page data', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/properties/${PROP_ID}/pages`,
      headers: { authorization: `Bearer ${ownerToken()}` },
      payload: { selectedElements },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(PAGE_ID);
  });

  it('should return 400 for invalid selectedElements (empty sections)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/properties/${PROP_ID}/pages`,
      headers: { authorization: `Bearer ${ownerToken()}` },
      payload: { selectedElements: { sections: [], order: [] } },
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 403 for non-owner', async () => {
    service.create.mockRejectedValue(new NotPageOwnerError());

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/properties/${PROP_ID}/pages`,
      headers: { authorization: `Bearer ${ownerToken()}` },
      payload: { selectedElements },
    });

    expect(res.statusCode).toBe(403);
  });

  it('should return 401 without auth', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/properties/${PROP_ID}/pages`,
      payload: { selectedElements },
    });

    expect(res.statusCode).toBe(401);
  });
});

// =====================================================================
// GET /api/v1/properties/:propertyId/pages
// =====================================================================

describe('GET /api/v1/properties/:propertyId/pages', () => {
  it('should return 200 with pages list', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/properties/${PROP_ID}/pages`,
      headers: { authorization: `Bearer ${ownerToken()}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data).toHaveLength(1);
  });
});

// =====================================================================
// GET /api/v1/pages/:id
// =====================================================================

describe('GET /api/v1/pages/:id', () => {
  it('should return 200 with page', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/pages/${PAGE_ID}`,
      headers: { authorization: `Bearer ${ownerToken()}` },
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.id).toBe(PAGE_ID);
  });

  it('should return 404 when not found', async () => {
    service.getById.mockRejectedValue(new PageNotFoundError());

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/pages/${PAGE_ID}`,
      headers: { authorization: `Bearer ${ownerToken()}` },
    });

    expect(res.statusCode).toBe(404);
  });
});

// =====================================================================
// PATCH /api/v1/pages/:id
// =====================================================================

describe('PATCH /api/v1/pages/:id', () => {
  it('should return 200 on update', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/pages/${PAGE_ID}`,
      headers: { authorization: `Bearer ${ownerToken()}` },
      payload: { title: 'Updated title' },
    });

    expect(res.statusCode).toBe(200);
  });

  it('should return 400 for invalid mediaIds in selectedElements', async () => {
    service.update.mockRejectedValue(new InvalidSelectedElementsError('Media IDs not found'));

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/pages/${PAGE_ID}`,
      headers: { authorization: `Bearer ${ownerToken()}` },
      payload: { title: 'Updated' },
    });

    expect(res.statusCode).toBe(400);
  });
});

// =====================================================================
// DELETE /api/v1/pages/:id
// =====================================================================

describe('DELETE /api/v1/pages/:id', () => {
  it('should return 200 on delete', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/pages/${PAGE_ID}`,
      headers: { authorization: `Bearer ${ownerToken()}` },
    });

    expect(res.statusCode).toBe(200);
  });
});

// =====================================================================
// GET /api/v1/pages/:id/preview
// =====================================================================

describe('GET /api/v1/pages/:id/preview', () => {
  it('should return 200 with HTML content', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/pages/${PAGE_ID}/preview`,
      headers: { authorization: `Bearer ${ownerToken()}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.body).toContain('<!DOCTYPE html>');
    expect(res.body).toContain('PREVIEW');
  });

  it('should return 410 for inactive page (non-preview render)', async () => {
    service.getRenderData.mockRejectedValue(new PageInactiveError());

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/pages/${PAGE_ID}/preview`,
      headers: { authorization: `Bearer ${ownerToken()}` },
    });

    expect(res.statusCode).toBe(410);
  });
});
