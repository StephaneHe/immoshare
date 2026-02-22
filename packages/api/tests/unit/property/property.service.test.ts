import { PropertyService } from '../../../src/modules/property/property.service';
import { IPropertyRepository, PropertyRecord, PropertyListFilters, PaginatedResult } from '../../../src/modules/property/property.types';
import {
  PropertyNotFoundError,
  NotPropertyOwnerError,
  InvalidStatusTransitionError,
} from '../../../src/modules/property/property.errors';

// ─── Constants ───

const OWNER_ID = 'aaaa-1111-2222-3333-444444444444';
const OTHER_ID = 'bbbb-1111-2222-3333-444444444444';
const PROP_ID = 'cccc-1111-2222-3333-444444444444';
const AGENCY_ID = 'dddd-1111-2222-3333-444444444444';

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

// ─── Mock factory ───

function mockRepo(overrides: Partial<IPropertyRepository> = {}): IPropertyRepository {
  return {
    create: jest.fn().mockResolvedValue(sampleProperty),
    findById: jest.fn().mockResolvedValue(null),
    update: jest.fn().mockResolvedValue(sampleProperty),
    updateStatus: jest.fn().mockResolvedValue(sampleProperty),
    softDelete: jest.fn(),
    list: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    listByAgency: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
    duplicate: jest.fn().mockResolvedValue({ ...sampleProperty, id: 'new-id', status: 'draft' }),
    findUserAgencyId: jest.fn().mockResolvedValue(null),
    ...overrides,
  };
}

// ─── Tests ───

describe('PropertyService.create', () => {
  it('should create property with ownerId from authenticated user', async () => {
    const repo = mockRepo();
    const service = new PropertyService(repo);

    await service.create(OWNER_ID, { title: 'Test', propertyType: 'apartment' });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: OWNER_ID, title: 'Test', propertyType: 'apartment' }),
    );
  });

  it('should auto-fill agencyId if user belongs to an agency', async () => {
    const repo = mockRepo({ findUserAgencyId: jest.fn().mockResolvedValue(AGENCY_ID) });
    const service = new PropertyService(repo);

    await service.create(OWNER_ID, { title: 'Test', propertyType: 'house' });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ agencyId: AGENCY_ID }),
    );
  });

  it('should set agencyId to null if user has no agency', async () => {
    const repo = mockRepo({ findUserAgencyId: jest.fn().mockResolvedValue(null) });
    const service = new PropertyService(repo);

    await service.create(OWNER_ID, { title: 'Test', propertyType: 'studio' });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ agencyId: null }),
    );
  });
});

describe('PropertyService.update', () => {
  it('should update property fields', async () => {
    const updated = { ...sampleProperty, title: 'Updated title' };
    const repo = mockRepo({
      findById: jest.fn().mockResolvedValue(sampleProperty),
      update: jest.fn().mockResolvedValue(updated),
    });
    const service = new PropertyService(repo);

    const result = await service.update(PROP_ID, OWNER_ID, { title: 'Updated title' });

    expect(result.title).toBe('Updated title');
    expect(repo.update).toHaveBeenCalledWith(PROP_ID, { title: 'Updated title' });
  });

  it('should throw NOT_PROPERTY_OWNER if user is not the owner', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(sampleProperty) });
    const service = new PropertyService(repo);

    await expect(service.update(PROP_ID, OTHER_ID, { title: 'Hack' }))
      .rejects.toThrow(NotPropertyOwnerError);
  });

  it('should throw PROPERTY_NOT_FOUND for non-existent property', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(null) });
    const service = new PropertyService(repo);

    await expect(service.update('bad-id', OWNER_ID, { title: 'X' }))
      .rejects.toThrow(PropertyNotFoundError);
  });
});

describe('PropertyService.changeStatus', () => {
  it('should transition from draft to active', async () => {
    const draftProp = { ...sampleProperty, status: 'draft' as const };
    const activeProp = { ...draftProp, status: 'active' as const };
    const repo = mockRepo({
      findById: jest.fn().mockResolvedValue(draftProp),
      updateStatus: jest.fn().mockResolvedValue(activeProp),
    });
    const service = new PropertyService(repo);

    const result = await service.changeStatus(PROP_ID, OWNER_ID, 'active');

    expect(result.status).toBe('active');
    expect(repo.updateStatus).toHaveBeenCalledWith(PROP_ID, 'active');
  });

  it('should transition from active to under_offer', async () => {
    const activeProp = { ...sampleProperty, status: 'active' as const };
    const repo = mockRepo({
      findById: jest.fn().mockResolvedValue(activeProp),
      updateStatus: jest.fn().mockResolvedValue({ ...activeProp, status: 'under_offer' }),
    });
    const service = new PropertyService(repo);

    const result = await service.changeStatus(PROP_ID, OWNER_ID, 'under_offer');
    expect(result.status).toBe('under_offer');
  });

  it('should transition from active to sold', async () => {
    const activeProp = { ...sampleProperty, status: 'active' as const };
    const repo = mockRepo({
      findById: jest.fn().mockResolvedValue(activeProp),
      updateStatus: jest.fn().mockResolvedValue({ ...activeProp, status: 'sold' }),
    });
    const service = new PropertyService(repo);

    const result = await service.changeStatus(PROP_ID, OWNER_ID, 'sold');
    expect(result.status).toBe('sold');
  });

  it('should allow archived from any status', async () => {
    for (const fromStatus of ['draft', 'active', 'under_offer', 'sold', 'rented'] as const) {
      const prop = { ...sampleProperty, status: fromStatus };
      const repo = mockRepo({
        findById: jest.fn().mockResolvedValue(prop),
        updateStatus: jest.fn().mockResolvedValue({ ...prop, status: 'archived' }),
      });
      const service = new PropertyService(repo);

      const result = await service.changeStatus(PROP_ID, OWNER_ID, 'archived');
      expect(result.status).toBe('archived');
    }
  });

  it('should throw INVALID_STATUS_TRANSITION for illegal transitions', async () => {
    const draftProp = { ...sampleProperty, status: 'draft' as const };
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(draftProp) });
    const service = new PropertyService(repo);

    // draft → sold is not allowed (must go through active)
    await expect(service.changeStatus(PROP_ID, OWNER_ID, 'sold'))
      .rejects.toThrow(InvalidStatusTransitionError);
  });

  it('should throw NOT_PROPERTY_OWNER for non-owner', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(sampleProperty) });
    const service = new PropertyService(repo);

    await expect(service.changeStatus(PROP_ID, OTHER_ID, 'active'))
      .rejects.toThrow(NotPropertyOwnerError);
  });
});

describe('PropertyService.list', () => {
  it('should return paginated results for user', async () => {
    const paginated: PaginatedResult<PropertyRecord> = {
      items: [sampleProperty],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };
    const repo = mockRepo({ list: jest.fn().mockResolvedValue(paginated) });
    const service = new PropertyService(repo);

    const result = await service.list(OWNER_ID, {});

    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(repo.list).toHaveBeenCalledWith(OWNER_ID, {});
  });

  it('should pass filters to repository', async () => {
    const filters: PropertyListFilters = { status: 'active', city: 'Tel Aviv', minPrice: 1000000 };
    const repo = mockRepo();
    const service = new PropertyService(repo);

    await service.list(OWNER_ID, filters);

    expect(repo.list).toHaveBeenCalledWith(OWNER_ID, filters);
  });
});

describe('PropertyService.delete', () => {
  it('should soft-delete property', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(sampleProperty) });
    const service = new PropertyService(repo);

    await service.delete(PROP_ID, OWNER_ID);

    expect(repo.softDelete).toHaveBeenCalledWith(PROP_ID);
  });

  it('should throw NOT_PROPERTY_OWNER if user is not the owner', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(sampleProperty) });
    const service = new PropertyService(repo);

    await expect(service.delete(PROP_ID, OTHER_ID)).rejects.toThrow(NotPropertyOwnerError);
  });

  it('should throw PROPERTY_NOT_FOUND for non-existent property', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(null) });
    const service = new PropertyService(repo);

    await expect(service.delete('bad-id', OWNER_ID)).rejects.toThrow(PropertyNotFoundError);
  });
});

describe('PropertyService.duplicate', () => {
  it('should create a copy via repository', async () => {
    const repo = mockRepo({
      findById: jest.fn().mockResolvedValue(sampleProperty),
      findUserAgencyId: jest.fn().mockResolvedValue(AGENCY_ID),
      duplicate: jest.fn().mockResolvedValue({ ...sampleProperty, id: 'new-id', status: 'draft' as const }),
    });
    const service = new PropertyService(repo);

    const result = await service.duplicate(PROP_ID, OWNER_ID);

    expect(result.id).toBe('new-id');
    expect(result.status).toBe('draft');
    expect(repo.duplicate).toHaveBeenCalledWith(PROP_ID, OWNER_ID, AGENCY_ID);
  });

  it('should throw NOT_PROPERTY_OWNER for non-owner', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(sampleProperty) });
    const service = new PropertyService(repo);

    await expect(service.duplicate(PROP_ID, OTHER_ID)).rejects.toThrow(NotPropertyOwnerError);
  });
});

describe('PropertyService.getById', () => {
  it('should return property for owner', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(sampleProperty) });
    const service = new PropertyService(repo);

    const result = await service.getById(PROP_ID, OWNER_ID);
    expect(result.id).toBe(PROP_ID);
  });

  it('should throw NOT_PROPERTY_OWNER for non-owner', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(sampleProperty) });
    const service = new PropertyService(repo);

    await expect(service.getById(PROP_ID, OTHER_ID)).rejects.toThrow(NotPropertyOwnerError);
  });

  it('should throw PROPERTY_NOT_FOUND when not found', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(null) });
    const service = new PropertyService(repo);

    await expect(service.getById('bad', OWNER_ID)).rejects.toThrow(PropertyNotFoundError);
  });
});
