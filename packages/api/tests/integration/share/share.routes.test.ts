import { UserRole } from '@immo-share/shared/constants/enums';
import { buildShareTestApp } from '../../helpers/testApp';
import { ContactService } from '../../../src/modules/share/contact.service';
import { ShareService } from '../../../src/modules/share/share.service';
import { PageService } from '../../../src/modules/page/page.service';
import {
  IContactRepository,
  IShareLinkRepository,
  IShareBatchRepository,
  IShareDataProvider,
  ContactRecord,
  ShareLinkRecord,
} from '../../../src/modules/share/share.types';
import { IPageRepository, IPageDataProvider, PageRecord } from '../../../src/modules/page/page.types';
import { generateTestToken } from '../../helpers/auth';

const USER_ID = 'aaaaaaaa-1111-2222-3333-444444444444';
const OTHER_ID = 'bbbbbbbb-1111-2222-3333-444444444444';
const PAGE_ID = 'cccccccc-1111-2222-3333-444444444444';
const PROP_ID = 'dddddddd-1111-2222-3333-444444444444';
const CONTACT_ID = 'eeeeeeee-1111-2222-3333-444444444444';
const LINK_ID = 'ffffffff-1111-2222-3333-444444444444';
const TOKEN = '11111111-1111-2222-3333-444444444444';
const BATCH_ID = '22222222-1111-2222-3333-444444444444';

const contact: ContactRecord = {
  id: CONTACT_ID, ownerId: USER_ID, name: 'David',
  phone: '+972501234567', email: 'david@test.com',
  tags: [], notes: null, createdAt: new Date(), updatedAt: new Date(),
};

const sampleLink: ShareLinkRecord = {
  id: LINK_ID, pageId: PAGE_ID, contactId: CONTACT_ID,
  channel: 'email', token: TOKEN, isActive: true,
  expiresAt: new Date(Date.now() + 30 * 86400000),
  sentAt: new Date(), deliveredAt: null, createdAt: new Date(),
};

const samplePage: PageRecord = {
  id: PAGE_ID, propertyId: PROP_ID, brandingId: null,
  title: 'Test page', layout: 'standard', isActive: true,
  selectedElements: {
    sections: [{ id: 's1', type: 'description', enabled: true }],
    order: ['s1'],
  },
  createdAt: new Date(), updatedAt: new Date(),
};

let linkCounter = 0;

function mockContactRepo(): IContactRepository {
  return {
    create: jest.fn().mockResolvedValue(contact),
    findById: jest.fn().mockResolvedValue(contact),
    list: jest.fn().mockResolvedValue({ items: [contact], total: 1, page: 1, limit: 20, totalPages: 1 }),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

function mockLinkRepo(overrides: Partial<IShareLinkRepository> = {}): IShareLinkRepository {
  return {
    create: jest.fn().mockImplementation(() => Promise.resolve({
      ...sampleLink, id: `link-${++linkCounter}`, token: `tok-${linkCounter}`,
    })),
    findById: jest.fn().mockResolvedValue(sampleLink),
    findByToken: jest.fn().mockResolvedValue(sampleLink),
    list: jest.fn().mockResolvedValue({ items: [sampleLink], total: 1, page: 1, limit: 20, totalPages: 1 }),
    deactivate: jest.fn(),
    deactivateByPageId: jest.fn().mockResolvedValue(0),
    updateDelivered: jest.fn(),
    updateSent: jest.fn(),
    ...overrides,
  };
}

function mockBatchRepo(): IShareBatchRepository {
  return {
    create: jest.fn().mockResolvedValue({
      id: BATCH_ID, userId: USER_ID, pageId: PAGE_ID,
      linkIds: [], totalSent: 0, totalFailed: 0, createdAt: new Date(),
    }),
  };
}

function mockShareDataProvider(): IShareDataProvider {
  return {
    getPageOwnerId: jest.fn().mockResolvedValue(USER_ID),
    getPagePropertyId: jest.fn().mockResolvedValue(PROP_ID),
    isPageActive: jest.fn().mockResolvedValue(true),
    getPropertyTitle: jest.fn().mockResolvedValue('Nice apartment'),
    getAgentName: jest.fn().mockResolvedValue('John Agent'),
  };
}

function mockPageRepo(): IPageRepository {
  return {
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue(samplePage),
    listByProperty: jest.fn().mockResolvedValue([]),
    update: jest.fn(),
    delete: jest.fn(),
    deactivate: jest.fn(),
  };
}

function mockPageDataProvider(): IPageDataProvider {
  return {
    getPropertyForPage: jest.fn().mockResolvedValue({
      id: PROP_ID, title: 'Nice apartment', description: 'A place',
      propertyType: 'apartment', status: 'active', price: 1500000, currency: 'ILS',
      address: '10 Rothschild', city: 'Tel Aviv', neighborhood: null,
      areaSqm: 85, rooms: 3.5, bedrooms: 2, bathrooms: 1,
      floor: 3, totalFloors: 8, yearBuilt: 2015, parking: 1,
      elevator: true, balcony: true, garden: false, aircon: true, furnished: false,
    }),
    getMediaForPage: jest.fn().mockResolvedValue([]),
    getPropertyOwnerId: jest.fn().mockResolvedValue(USER_ID),
    getBrandingForPage: jest.fn().mockResolvedValue({
      agentName: 'John', agencyName: 'Top', logoUrl: null,
      primaryColor: '#C8102E', phone: '+972501234567', email: 'john@test.com', locale: 'en',
    }),
  };
}

function setup(linkRepoOverrides: Partial<IShareLinkRepository> = {}) {
  const contactRepo = mockContactRepo();
  const contactService = new ContactService(contactRepo);
  const linkRepo = mockLinkRepo(linkRepoOverrides);
  const shareService = new ShareService(linkRepo, mockBatchRepo(), contactRepo, mockShareDataProvider());
  const pageService = new PageService(mockPageRepo(), mockPageDataProvider());
  const app = buildShareTestApp(contactService, shareService, pageService);
  const token = generateTestToken({ sub: USER_ID, email: 'user@test.com', role: UserRole.AGENT });
  const otherToken = generateTestToken({ sub: OTHER_ID, email: 'other@test.com', role: UserRole.AGENT });
  return { app, token, otherToken, linkRepo };
}

beforeEach(() => { linkCounter = 0; });

describe('POST /api/v1/pages/:pageId/share', () => {
  it('should return 200 with batch summary', async () => {
    const { app, token } = setup();
    const res = await app.inject({
      method: 'POST', url: `/api/v1/pages/${PAGE_ID}/share`,
      headers: { authorization: `Bearer ${token}` },
      payload: {
        recipients: [{ contactId: CONTACT_ID, channels: ['email'] }],
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.batchId).toBe(BATCH_ID);
    expect(body.data.totalLinks).toBe(1);
  });

  it('should return 403 for non-owner', async () => {
    const { app, otherToken } = setup();
    const res = await app.inject({
      method: 'POST', url: `/api/v1/pages/${PAGE_ID}/share`,
      headers: { authorization: `Bearer ${otherToken}` },
      payload: {
        recipients: [{ contactId: CONTACT_ID, channels: ['email'] }],
      },
    });
    expect(res.statusCode).toBe(403);
  });

  it('should return 401 without auth', async () => {
    const { app } = setup();
    const res = await app.inject({
      method: 'POST', url: `/api/v1/pages/${PAGE_ID}/share`,
      payload: { recipients: [{ contactId: CONTACT_ID, channels: ['email'] }] },
    });
    expect(res.statusCode).toBe(401);
  });

  it('should create correct number of share links', async () => {
    const { app, token, linkRepo } = setup();
    await app.inject({
      method: 'POST', url: `/api/v1/pages/${PAGE_ID}/share`,
      headers: { authorization: `Bearer ${token}` },
      payload: {
        recipients: [{ contactId: CONTACT_ID, channels: ['email', 'whatsapp'] }],
      },
    });
    expect(linkRepo.create).toHaveBeenCalledTimes(2);
  });
});

describe('GET /api/v1/share-links', () => {
  it('should return paginated history', async () => {
    const { app, token } = setup();
    const res = await app.inject({
      method: 'GET', url: '/api/v1/share-links',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.items).toHaveLength(1);
  });
});

describe('GET /api/v1/share-links/:id', () => {
  it('should return link details', async () => {
    const { app, token } = setup();
    const res = await app.inject({
      method: 'GET', url: `/api/v1/share-links/${LINK_ID}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
  });
});

describe('PATCH /api/v1/share-links/:id/deactivate', () => {
  it('should return 200', async () => {
    const { app, token, linkRepo } = setup();
    const res = await app.inject({
      method: 'PATCH', url: `/api/v1/share-links/${LINK_ID}/deactivate`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(linkRepo.deactivate).toHaveBeenCalledWith(LINK_ID);
  });
});

describe('GET /api/v1/v/:token (public page)', () => {
  it('should return 200 with HTML', async () => {
    const { app } = setup();
    const res = await app.inject({
      method: 'GET', url: `/api/v1/v/${TOKEN}`,
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.body).toContain('<!DOCTYPE html>');
  });

  it('should return 410 for deactivated link', async () => {
    const deactivated = { ...sampleLink, isActive: false };
    const { app } = setup({ findByToken: jest.fn().mockResolvedValue(deactivated) });
    const res = await app.inject({
      method: 'GET', url: `/api/v1/v/${TOKEN}`,
    });
    expect(res.statusCode).toBe(410);
  });

  it('should return 410 for expired link', async () => {
    const expired = { ...sampleLink, expiresAt: new Date(Date.now() - 1000) };
    const { app } = setup({ findByToken: jest.fn().mockResolvedValue(expired) });
    const res = await app.inject({
      method: 'GET', url: `/api/v1/v/${TOKEN}`,
    });
    expect(res.statusCode).toBe(410);
  });

  it('should return 404 for invalid token', async () => {
    const { app } = setup({ findByToken: jest.fn().mockResolvedValue(null) });
    const res = await app.inject({
      method: 'GET', url: `/api/v1/v/${TOKEN}`,
    });
    expect(res.statusCode).toBe(404);
  });
});
