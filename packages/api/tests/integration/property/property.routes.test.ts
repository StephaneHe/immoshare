import { FastifyInstance } from 'fastify';
import { PropertyService } from '../../../src/modules/property/property.service';
import { buildPropertyTestApp } from '../../helpers/testApp';
import { generateTestToken } from '../../helpers/auth';
import { UserRole } from '@immo-share/shared/constants/enums';
import {
  PropertyNotFoundError,
  NotPropertyOwnerError,
  InvalidStatusTransitionError,
} from '../../../src/modules/property/property.errors';
import { PropertyRecord, PaginatedResult } from '../../../src/modules/property/property.types';

// ─── Constants ───

const OWNER_ID = 'aaaaaaaa-1111-2222-3333-444444444444';
const OTHER_ID = 'bbbbbbbb-1111-2222-3333-444444444444';
const PROP_ID = 'cccccccc-1111-2222-3333-444444444444';
const AGENCY_ID = 'dddddddd-1111-2222-3333-444444444444';

const sampleProperty: PropertyRecord = {
  id: PROP_ID,
  ownerId: OWNER_ID,
  agencyId: AGENCY_ID,
  title: 'Nice apartment',
  description: 'A lovely place',
  propertyType: 'apartment',
  status: 'draft',
  price: 1500000,
  currency: 'ILS',
  address: '10 Rothschild',
  city: 'Tel Aviv',
  neighborhood: 'Center',
  areaSqm: 85,
  rooms: 3.5,
  bedrooms: 2,
  bathrooms: 1,
  floor: 3,
  totalFloors: 8,
  yearBuilt: 2015,
  parking: 1,
  elevator: true,
  balcony: true,
  garden: false,
  aircon: true,
  furnished: false,
  metadata: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const paginated: PaginatedResult<PropertyRecord> = {
  items: [sampleProperty],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
};

// ─── Mock factory ───

function createMockService(): jest.Mocked<PropertyService> {
  return {
    create: jest.fn().mockResolvedValue(sampleProperty),
    getById: jest.fn().mockResolvedValue(sampleProperty),
    update: jest.fn().mockResolvedValue({ ...sampleProperty, title: 'Updated' }),
    changeStatus: jest.fn().mockResolvedValue({ ...sampleProperty, status: 'active' }),
    delete: jest.fn().mockResolvedValue(undefined),
    duplicate: jest.fn().mockResolvedValue({ ...sampleProperty, id: 'new-id', status: 'draft' }),
    list: jest.fn().mockResolvedValue(paginated),
    listByAgency: jest.fn().mockResolvedValue(paginated),
  } as unknown as jest.Mocked<PropertyService>;
}

// ─── Setup ───

let app: FastifyInstance;
let service: jest.Mocked<PropertyService>;

beforeEach(async () => {
  service = createMockService();
  app = buildPropertyTestApp(service as unknown as PropertyService);
  await app.ready();
});

afterEach(async () => {
  await app.close();
});

const ownerToken = () => generateTestToken({ sub: OWNER_ID, role: UserRole.AGENT });
const adminToken = () => generateTestToken({ sub: OWNER_ID, role: UserRole.AGENCY_ADMIN });

// =====================================================================
// POST /api/v1/properties
// =====================================================================

describe('POST /api/v1/properties', () => {
  it('should return 201 with property data', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/properties',
      headers: { authorization: `Bearer ${ownerToken()}` },
      payload: { title: 'Nice apartment', propertyType: 'apartment', city: 'Tel Aviv' },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.data.title).toBe('Nice apartment');
  });

  it('should return 400 on missing title', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/properties',
      headers: { authorization: `Bearer ${ownerToken()}` },
      payload: { propertyType: 'apartment' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 on invalid propertyType', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/properties',
      headers: { authorization: `Bearer ${ownerToken()}` },
      payload: { title: 'Test', propertyType: 'spaceship' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 401 without auth', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/properties',
      payload: { title: 'Test', propertyType: 'apartment' },
    });

    expect(res.statusCode).toBe(401);
  });
});

// =====================================================================
// GET /api/v1/properties
// =====================================================================

describe('GET /api/v1/properties', () => {
  it('should return paginated list', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/properties',
      headers: { authorization: `Bearer ${ownerToken()}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.total).toBe(1);
  });

  it('should pass filter params to service', async () => {
    await app.inject({
      method: 'GET',
      url: '/api/v1/properties?status=active&city=Tel+Aviv&minPrice=500000',
      headers: { authorization: `Bearer ${ownerToken()}` },
    });

    expect(service.list).toHaveBeenCalledWith(
      OWNER_ID,
      expect.objectContaining({ status: 'active', city: 'Tel Aviv', minPrice: 500000 }),
    );
  });
});

// =====================================================================
// GET /api/v1/properties/:id
// =====================================================================

describe('GET /api/v1/properties/:id', () => {
  it('should return 200 with property', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/properties/${PROP_ID}`,
      headers: { authorization: `Bearer ${ownerToken()}` },
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.id).toBe(PROP_ID);
  });

  it('should return 404 when not found', async () => {
    service.getById.mockRejectedValue(new PropertyNotFoundError());

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/properties/${PROP_ID}`,
      headers: { authorization: `Bearer ${ownerToken()}` },
    });

    expect(res.statusCode).toBe(404);
  });

  it('should return 403 for non-owner', async () => {
    service.getById.mockRejectedValue(new NotPropertyOwnerError());

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/properties/${PROP_ID}`,
      headers: { authorization: `Bearer ${ownerToken()}` },
    });

    expect(res.statusCode).toBe(403);
  });
});

// =====================================================================
// PUT /api/v1/properties/:id
// =====================================================================

describe('PUT /api/v1/properties/:id', () => {
  it('should return 200 on update', async () => {
    const res = await app.inject({
      method: 'PUT',
      url: `/api/v1/properties/${PROP_ID}`,
      headers: { authorization: `Bearer ${ownerToken()}` },
      payload: { title: 'Updated title' },
    });

    expect(res.statusCode).toBe(200);
  });
});

// =====================================================================
// PATCH /api/v1/properties/:id/status
// =====================================================================

describe('PATCH /api/v1/properties/:id/status', () => {
  it('should return 200 on valid transition', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/properties/${PROP_ID}/status`,
      headers: { authorization: `Bearer ${ownerToken()}` },
      payload: { status: 'active' },
    });

    expect(res.statusCode).toBe(200);
    expect(service.changeStatus).toHaveBeenCalledWith(PROP_ID, OWNER_ID, 'active');
  });

  it('should return 400 for invalid status value', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/properties/${PROP_ID}/status`,
      headers: { authorization: `Bearer ${ownerToken()}` },
      payload: { status: 'banana' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('should return 400 for invalid transition', async () => {
    service.changeStatus.mockRejectedValue(new InvalidStatusTransitionError('draft', 'sold'));

    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/properties/${PROP_ID}/status`,
      headers: { authorization: `Bearer ${ownerToken()}` },
      payload: { status: 'sold' },
    });

    expect(res.statusCode).toBe(400);
  });
});

// =====================================================================
// DELETE /api/v1/properties/:id
// =====================================================================

describe('DELETE /api/v1/properties/:id', () => {
  it('should return 200 on soft delete', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/properties/${PROP_ID}`,
      headers: { authorization: `Bearer ${ownerToken()}` },
    });

    expect(res.statusCode).toBe(200);
    expect(service.delete).toHaveBeenCalledWith(PROP_ID, OWNER_ID);
  });
});

// =====================================================================
// POST /api/v1/properties/:id/duplicate
// =====================================================================

describe('POST /api/v1/properties/:id/duplicate', () => {
  it('should return 201 with duplicated property', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/properties/${PROP_ID}/duplicate`,
      headers: { authorization: `Bearer ${ownerToken()}` },
    });

    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).data.status).toBe('draft');
  });
});

// =====================================================================
// GET /api/v1/agencies/:id/properties
// =====================================================================

describe('GET /api/v1/agencies/:id/properties', () => {
  it('should return agency properties', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/agencies/${AGENCY_ID}/properties`,
      headers: { authorization: `Bearer ${adminToken()}` },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.items).toHaveLength(1);
  });
});
