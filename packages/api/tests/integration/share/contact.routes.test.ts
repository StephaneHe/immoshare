import { UserRole } from '@immo-share/shared/constants/enums';
import { buildShareTestApp } from '../../helpers/testApp';
import { ContactService } from '../../../src/modules/share/contact.service';
import { ShareService } from '../../../src/modules/share/share.service';
import { PageService } from '../../../src/modules/page/page.service';
import { IContactRepository, ContactRecord, PaginatedResult } from '../../../src/modules/share/share.types';
import { generateTestToken } from '../../helpers/auth';
import { FastifyInstance } from 'fastify';

const USER_ID = 'aaaaaaaa-1111-2222-3333-444444444444';
const OTHER_ID = 'bbbbbbbb-1111-2222-3333-444444444444';
const CONTACT_ID = 'cccccccc-1111-2222-3333-444444444444';

const sampleContact: ContactRecord = {
  id: CONTACT_ID, ownerId: USER_ID, name: 'David Cohen',
  phone: '+972501234567', email: 'david@test.com',
  tags: ['buyer'], notes: null, createdAt: new Date(), updatedAt: new Date(),
};

function mockContactRepo(overrides: Partial<IContactRepository> = {}): IContactRepository {
  return {
    create: jest.fn().mockResolvedValue(sampleContact),
    findById: jest.fn().mockResolvedValue(null),
    list: jest.fn().mockResolvedValue({ items: [sampleContact], total: 1, page: 1, limit: 20, totalPages: 1 }),
    update: jest.fn().mockResolvedValue(sampleContact),
    delete: jest.fn(),
    ...overrides,
  };
}

// Minimal mock share/page services (not used for contact routes)
function mockShareService(): ShareService {
  return {} as any;
}
function mockPageService(): PageService {
  return {} as any;
}

function setup(repoOverrides: Partial<IContactRepository> = {}) {
  const repo = mockContactRepo(repoOverrides);
  const contactService = new ContactService(repo);
  const app = buildShareTestApp(contactService, mockShareService(), mockPageService());
  const token = generateTestToken({ sub: USER_ID, email: 'user@test.com', role: UserRole.AGENT });
  const otherToken = generateTestToken({ sub: OTHER_ID, email: 'other@test.com', role: UserRole.AGENT });
  return { app, token, otherToken, repo };
}

describe('POST /api/v1/contacts', () => {
  it('should return 201 with contact data', async () => {
    const { app, token } = setup();
    const res = await app.inject({
      method: 'POST', url: '/api/v1/contacts',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'David Cohen', phone: '+972501234567' },
    });
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).data.name).toBe('David Cohen');
  });

  it('should return 400 without phone or email', async () => {
    const { app, token } = setup();
    const res = await app.inject({
      method: 'POST', url: '/api/v1/contacts',
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'David' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('should return 401 without auth', async () => {
    const { app } = setup();
    const res = await app.inject({
      method: 'POST', url: '/api/v1/contacts',
      payload: { name: 'David', phone: '+972501234567' },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/v1/contacts', () => {
  it('should return paginated list', async () => {
    const { app, token } = setup();
    const res = await app.inject({
      method: 'GET', url: '/api/v1/contacts',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.items).toHaveLength(1);
  });
});

describe('GET /api/v1/contacts/:id', () => {
  it('should return contact for owner', async () => {
    const { app, token } = setup({ findById: jest.fn().mockResolvedValue(sampleContact) });
    const res = await app.inject({
      method: 'GET', url: `/api/v1/contacts/${CONTACT_ID}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
  });

  it('should return 403 for non-owner', async () => {
    const { app, otherToken } = setup({ findById: jest.fn().mockResolvedValue(sampleContact) });
    const res = await app.inject({
      method: 'GET', url: `/api/v1/contacts/${CONTACT_ID}`,
      headers: { authorization: `Bearer ${otherToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('should return 404 when not found', async () => {
    const { app, token } = setup();
    const res = await app.inject({
      method: 'GET', url: `/api/v1/contacts/${CONTACT_ID}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('PATCH /api/v1/contacts/:id', () => {
  it('should return 200 with updated contact', async () => {
    const { app, token } = setup({ findById: jest.fn().mockResolvedValue(sampleContact) });
    const res = await app.inject({
      method: 'PATCH', url: `/api/v1/contacts/${CONTACT_ID}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { name: 'David Updated' },
    });
    expect(res.statusCode).toBe(200);
  });
});

describe('DELETE /api/v1/contacts/:id', () => {
  it('should return 200', async () => {
    const { app, token, repo } = setup({ findById: jest.fn().mockResolvedValue(sampleContact) });
    const res = await app.inject({
      method: 'DELETE', url: `/api/v1/contacts/${CONTACT_ID}`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(repo.delete).toHaveBeenCalledWith(CONTACT_ID);
  });
});
