import { UserRole } from '@immo-share/shared/constants/enums';
import { buildTrackingTestApp } from '../../helpers/testApp';
import { TrackingService } from '../../../src/modules/tracking/tracking.service';
import { AnalyticsService } from '../../../src/modules/tracking/analytics.service';
import {
  ITrackEventRepository,
  ITrackingDataProvider,
  TrackEventRecord,
} from '../../../src/modules/tracking/tracking.types';
import { generateTestToken } from '../../helpers/auth';

const USER_ID = 'aaaaaaaa-1111-2222-3333-444444444444';
const OTHER_ID = 'bbbbbbbb-1111-2222-3333-444444444444';
const LINK_ID = 'cccccccc-1111-2222-3333-444444444444';
const PAGE_ID = 'dddddddd-1111-2222-3333-444444444444';
const CONTACT_ID = 'eeeeeeee-1111-2222-3333-444444444444';
const TOKEN = 'ffffffff-1111-2222-3333-444444444444';
const PROP_ID = '11111111-1111-2222-3333-444444444444';

const validLink = {
  id: LINK_ID, pageId: PAGE_ID, contactId: CONTACT_ID,
  channel: 'email', isActive: true, expiresAt: new Date(Date.now() + 86400000),
};

const sampleEvent: TrackEventRecord = {
  id: 'evt-1', linkId: LINK_ID, eventType: 'page_opened',
  timestamp: new Date(), ipAddress: '1.2.3.0', userAgent: 'Mozilla/5.0',
  metadata: { firstVisit: true }, createdAt: new Date(),
};

function mockRepo(overrides: Partial<ITrackEventRepository> = {}): ITrackEventRepository {
  return {
    create: jest.fn().mockResolvedValue(sampleEvent),
    findByLinkId: jest.fn().mockResolvedValue([sampleEvent]),
    findRecentByTokenAndIp: jest.fn().mockResolvedValue(null),
    countByType: jest.fn().mockResolvedValue(0),
    ...overrides,
  };
}

function mockDataProvider(overrides: Partial<ITrackingDataProvider> = {}): ITrackingDataProvider {
  return {
    resolveLinkByToken: jest.fn().mockImplementation((t: string) => {
      if (t === TOKEN) return Promise.resolve(validLink);
      return Promise.resolve(null);
    }),
    getLinksForProperty: jest.fn().mockResolvedValue([
      { id: LINK_ID, contactId: CONTACT_ID, channel: 'email', sentAt: new Date() },
    ]),
    getContactName: jest.fn().mockResolvedValue('David'),
    getPropertyTitle: jest.fn().mockResolvedValue('Nice apartment'),
    getUserSharedProperties: jest.fn().mockResolvedValue([
      { propertyId: PROP_ID, title: 'Nice apartment', linkCount: 1 },
    ]),
    getPropertyOwnerId: jest.fn().mockResolvedValue(USER_ID),
    getEventsForLinks: jest.fn().mockResolvedValue([sampleEvent]),
    ...overrides,
  };
}

function setup(repoOverrides?: Partial<ITrackEventRepository>, dpOverrides?: Partial<ITrackingDataProvider>) {
  const repo = mockRepo(repoOverrides);
  const dp = mockDataProvider(dpOverrides);
  const trackingService = new TrackingService(repo, dp);
  const analyticsService = new AnalyticsService(dp);
  const app = buildTrackingTestApp(trackingService, analyticsService);
  const token = generateTestToken({ sub: USER_ID, email: 'user@test.com', role: UserRole.AGENT });
  const otherToken = generateTestToken({ sub: OTHER_ID, email: 'other@test.com', role: UserRole.AGENT });
  return { app, token, otherToken, repo };
}

// ─── POST /api/v1/track/event ───

describe('POST /api/v1/track/event', () => {
  it('should return 200 for valid event', async () => {
    const { app } = setup();
    const res = await app.inject({
      method: 'POST', url: '/api/v1/track/event',
      payload: { token: TOKEN, eventType: 'page_opened' },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.recorded).toBe(true);
  });

  it('should return 404 for invalid token', async () => {
    const { app } = setup();
    const res = await app.inject({
      method: 'POST', url: '/api/v1/track/event',
      payload: { token: '00000000-0000-0000-0000-000000000000', eventType: 'page_opened' },
    });
    expect(res.statusCode).toBe(404);
  });

  it('should return 410 for expired link', async () => {
    const expired = { ...validLink, expiresAt: new Date(Date.now() - 1000) };
    const { app } = setup(undefined, {
      resolveLinkByToken: jest.fn().mockResolvedValue(expired),
    });
    const res = await app.inject({
      method: 'POST', url: '/api/v1/track/event',
      payload: { token: TOKEN, eventType: 'page_opened' },
    });
    expect(res.statusCode).toBe(410);
  });

  it('should return 200 with recorded=false for duplicate', async () => {
    const { app } = setup({
      findRecentByTokenAndIp: jest.fn().mockResolvedValue(sampleEvent),
    });
    const res = await app.inject({
      method: 'POST', url: '/api/v1/track/event',
      payload: { token: TOKEN, eventType: 'page_opened' },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.recorded).toBe(false);
  });
});

// ─── POST /api/v1/track/heartbeat ───

describe('POST /api/v1/track/heartbeat', () => {
  it('should return 200 for valid heartbeat', async () => {
    const { app } = setup();
    const res = await app.inject({
      method: 'POST', url: '/api/v1/track/heartbeat',
      payload: { token: TOKEN, durationSinceLastBeat: 30 },
    });
    expect(res.statusCode).toBe(200);
  });
});

// ─── GET /api/v1/properties/:id/analytics ───

describe('GET /api/v1/properties/:id/analytics', () => {
  it('should return 200 with analytics data', async () => {
    const { app, token } = setup();
    const res = await app.inject({
      method: 'GET', url: `/api/v1/properties/${PROP_ID}/analytics`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.propertyId).toBe(PROP_ID);
    expect(body.data.totalLinks).toBe(1);
  });

  it('should return 403 for non-owner', async () => {
    const { app, otherToken } = setup();
    const res = await app.inject({
      method: 'GET', url: `/api/v1/properties/${PROP_ID}/analytics`,
      headers: { authorization: `Bearer ${otherToken}` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('should return 401 without auth', async () => {
    const { app } = setup();
    const res = await app.inject({
      method: 'GET', url: `/api/v1/properties/${PROP_ID}/analytics`,
    });
    expect(res.statusCode).toBe(401);
  });
});

// ─── GET /api/v1/analytics/dashboard ───

describe('GET /api/v1/analytics/dashboard', () => {
  it('should return 200 with dashboard data', async () => {
    const { app, token } = setup();
    const res = await app.inject({
      method: 'GET', url: '/api/v1/analytics/dashboard',
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.totalPropertiesShared).toBe(1);
    expect(body.data.period).toBeDefined();
  });

  it('should return 401 without auth', async () => {
    const { app } = setup();
    const res = await app.inject({
      method: 'GET', url: '/api/v1/analytics/dashboard',
    });
    expect(res.statusCode).toBe(401);
  });
});

// ─── GET /api/v1/share-links/:id/events ───

describe('GET /api/v1/share-links/:id/events', () => {
  it('should return events for link', async () => {
    const { app, token } = setup();
    const res = await app.inject({
      method: 'GET', url: `/api/v1/share-links/${LINK_ID}/events`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.events).toHaveLength(1);
  });
});
