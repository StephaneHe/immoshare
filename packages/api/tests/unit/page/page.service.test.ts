import { PageService } from '../../../src/modules/page/page.service';
import {
  IPageRepository,
  IPageDataProvider,
  PageRecord,
  SelectedElements,
  MediaForPage,
  BrandingForPage,
  PropertyForPage,
} from '../../../src/modules/page/page.types';
import {
  PageNotFoundError,
  NotPageOwnerError,
  PropertyNotFoundForPageError,
  InvalidSelectedElementsError,
  PageInactiveError,
} from '../../../src/modules/page/page.errors';

// ─── Constants ───

const USER_ID = 'aaaaaaaa-1111-2222-3333-444444444444';
const OTHER_ID = 'bbbbbbbb-1111-2222-3333-444444444444';
const PROP_ID = 'cccccccc-1111-2222-3333-444444444444';
const PAGE_ID = 'dddddddd-1111-2222-3333-444444444444';
const MEDIA_1 = 'eeeeeeee-1111-2222-3333-444444444444';
const MEDIA_2 = 'ffffffff-1111-2222-3333-444444444444';

const selectedElements: SelectedElements = {
  sections: [
    { id: 's1', type: 'info', enabled: true, fields: ['price', 'rooms', 'areaSqm'] },
    { id: 's2', type: 'photos', enabled: true, mediaIds: [MEDIA_1, MEDIA_2] },
    { id: 's3', type: 'description', enabled: true },
    { id: 's4', type: 'contact', enabled: true },
  ],
  order: ['s1', 's2', 's3', 's4'],
};

const samplePage: PageRecord = {
  id: PAGE_ID,
  propertyId: PROP_ID,
  brandingId: null,
  title: 'Beautiful apartment in Tel Aviv',
  selectedElements,
  layout: 'standard',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const sampleProperty: PropertyForPage = {
  id: PROP_ID,
  title: 'Nice apartment',
  description: 'A lovely place',
  propertyType: 'apartment',
  status: 'active',
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
};

const sampleMedia: MediaForPage[] = [
  { id: MEDIA_1, type: 'photo', url: 'https://cdn.example.com/1.jpg', thumbnailUrl: null, caption: null, order: 0 },
  { id: MEDIA_2, type: 'photo', url: 'https://cdn.example.com/2.jpg', thumbnailUrl: null, caption: null, order: 1 },
];

const sampleBranding: BrandingForPage = {
  agentName: 'John Doe',
  agencyName: 'Top Agency',
  logoUrl: null,
  primaryColor: '#C8102E',
  phone: '+972501234567',
  email: 'john@topagency.com',
  locale: 'en',
};

// ─── Mocks ───

function mockRepo(overrides: Partial<IPageRepository> = {}): IPageRepository {
  return {
    create: jest.fn().mockResolvedValue(samplePage),
    findById: jest.fn().mockResolvedValue(null),
    listByProperty: jest.fn().mockResolvedValue([]),
    update: jest.fn().mockResolvedValue(samplePage),
    delete: jest.fn(),
    deactivate: jest.fn(),
    ...overrides,
  };
}

function mockDataProvider(overrides: Partial<IPageDataProvider> = {}): IPageDataProvider {
  return {
    getPropertyForPage: jest.fn().mockResolvedValue(sampleProperty),
    getMediaForPage: jest.fn().mockResolvedValue(sampleMedia),
    getPropertyOwnerId: jest.fn().mockResolvedValue(USER_ID),
    getBrandingForPage: jest.fn().mockResolvedValue(sampleBranding),
    ...overrides,
  };
}

// ─── Tests ───

describe('PageService.create', () => {
  it('should create page with selected elements', async () => {
    const repo = mockRepo();
    const dp = mockDataProvider();
    const service = new PageService(repo, dp);

    const result = await service.create(USER_ID, PROP_ID, {
      title: 'My page',
      selectedElements,
    });

    expect(result.id).toBe(PAGE_ID);
    expect(repo.create).toHaveBeenCalledWith(PROP_ID, expect.objectContaining({
      title: 'My page',
      selectedElements,
    }));
  });

  it('should throw PROPERTY_NOT_FOUND for invalid property', async () => {
    const dp = mockDataProvider({ getPropertyOwnerId: jest.fn().mockResolvedValue(null) });
    const service = new PageService(mockRepo(), dp);

    await expect(service.create(USER_ID, 'bad-id', { selectedElements }))
      .rejects.toThrow(PropertyNotFoundForPageError);
  });

  it('should throw NOT_PAGE_OWNER if user does not own property', async () => {
    const dp = mockDataProvider();
    const service = new PageService(mockRepo(), dp);

    await expect(service.create(OTHER_ID, PROP_ID, { selectedElements }))
      .rejects.toThrow(NotPageOwnerError);
  });

  it('should throw INVALID_SELECTED_ELEMENTS for non-existent mediaIds', async () => {
    const dp = mockDataProvider({
      getMediaForPage: jest.fn().mockResolvedValue([sampleMedia[0]]), // only MEDIA_1 exists
    });
    const service = new PageService(mockRepo(), dp);

    await expect(service.create(USER_ID, PROP_ID, { selectedElements }))
      .rejects.toThrow(InvalidSelectedElementsError);
  });
});

describe('PageService.getById', () => {
  it('should return page for owner', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(samplePage) });
    const service = new PageService(repo, mockDataProvider());

    const result = await service.getById(PAGE_ID, USER_ID);
    expect(result.id).toBe(PAGE_ID);
  });

  it('should throw PAGE_NOT_FOUND when not found', async () => {
    const service = new PageService(mockRepo(), mockDataProvider());
    await expect(service.getById('bad-id', USER_ID)).rejects.toThrow(PageNotFoundError);
  });

  it('should throw NOT_PAGE_OWNER for non-owner', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(samplePage) });
    const dp = mockDataProvider();
    const service = new PageService(repo, dp);

    await expect(service.getById(PAGE_ID, OTHER_ID)).rejects.toThrow(NotPageOwnerError);
  });
});

describe('PageService.listByProperty', () => {
  it('should return pages list for owner', async () => {
    const repo = mockRepo({ listByProperty: jest.fn().mockResolvedValue([samplePage]) });
    const service = new PageService(repo, mockDataProvider());

    const result = await service.listByProperty(PROP_ID, USER_ID);
    expect(result).toHaveLength(1);
  });

  it('should throw NOT_PAGE_OWNER for non-owner', async () => {
    const service = new PageService(mockRepo(), mockDataProvider());
    await expect(service.listByProperty(PROP_ID, OTHER_ID)).rejects.toThrow(NotPageOwnerError);
  });
});

describe('PageService.update', () => {
  it('should update selected elements', async () => {
    const updated = { ...samplePage, title: 'Updated' };
    const repo = mockRepo({
      findById: jest.fn().mockResolvedValue(samplePage),
      update: jest.fn().mockResolvedValue(updated),
    });
    const service = new PageService(repo, mockDataProvider());

    const result = await service.update(PAGE_ID, USER_ID, { title: 'Updated' });
    expect(result.title).toBe('Updated');
  });

  it('should validate mediaIds on update', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(samplePage) });
    const dp = mockDataProvider({
      getMediaForPage: jest.fn().mockResolvedValue([]), // no media exists
    });
    const service = new PageService(repo, dp);

    await expect(service.update(PAGE_ID, USER_ID, { selectedElements }))
      .rejects.toThrow(InvalidSelectedElementsError);
  });

  it('should throw NOT_PAGE_OWNER for non-owner', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(samplePage) });
    const service = new PageService(repo, mockDataProvider());

    await expect(service.update(PAGE_ID, OTHER_ID, { title: 'Hack' }))
      .rejects.toThrow(NotPageOwnerError);
  });
});

describe('PageService.delete', () => {
  it('should delete page', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(samplePage) });
    const service = new PageService(repo, mockDataProvider());

    await service.delete(PAGE_ID, USER_ID);
    expect(repo.delete).toHaveBeenCalledWith(PAGE_ID);
  });

  it('should throw NOT_PAGE_OWNER for non-owner', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(samplePage) });
    const service = new PageService(repo, mockDataProvider());

    await expect(service.delete(PAGE_ID, OTHER_ID)).rejects.toThrow(NotPageOwnerError);
  });
});

describe('PageService.getRenderData', () => {
  it('should return render data for preview', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(samplePage) });
    const dp = mockDataProvider();
    const service = new PageService(repo, dp);

    const data = await service.getRenderData(PAGE_ID, USER_ID, true);

    expect(data.page.id).toBe(PAGE_ID);
    expect(data.property.title).toBe('Nice apartment');
    expect(data.media).toHaveLength(2);
    expect(data.branding.agentName).toBe('John Doe');
    expect(data.isPreview).toBe(true);
  });

  it('should throw PAGE_INACTIVE for deactivated page (non-preview)', async () => {
    const inactivePage = { ...samplePage, isActive: false };
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(inactivePage) });
    const service = new PageService(repo, mockDataProvider());

    await expect(service.getRenderData(PAGE_ID, USER_ID, false))
      .rejects.toThrow(PageInactiveError);
  });

  it('should allow preview of inactive page for owner', async () => {
    const inactivePage = { ...samplePage, isActive: false };
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(inactivePage) });
    const service = new PageService(repo, mockDataProvider());

    const data = await service.getRenderData(PAGE_ID, USER_ID, true);
    expect(data.isPreview).toBe(true);
  });

  it('should include only selected media', async () => {
    const repo = mockRepo({ findById: jest.fn().mockResolvedValue(samplePage) });
    const dp = mockDataProvider();
    const service = new PageService(repo, dp);

    await service.getRenderData(PAGE_ID, USER_ID, true);

    // Should pass mediaIds from selectedElements
    expect(dp.getMediaForPage).toHaveBeenCalledWith(PROP_ID, [MEDIA_1, MEDIA_2]);
  });
});
