import { FastifyInstance } from 'fastify';
import { buildNotificationTestApp } from '../../helpers/testApp';
import { generateTestToken } from '../../helpers/auth';
import { UserRole } from '@immo-share/shared/constants/enums';
import { NotificationService } from '../../../src/modules/notification/notification.service';
import {
  INotificationRepository,
  ISettingsRepository,
  IPushTokenRepository,
  IPushProvider,
  NotificationRecord,
  NotificationSettingsRecord,
  PushTokenRecord,
} from '../../../src/modules/notification/notification.types';

// ─── Constants ───────────────────────────────────────────────────────────────

const USER_ID  = 'aaaaaaaa-0000-0000-0000-000000000001';
const OTHER_ID = 'bbbbbbbb-0000-0000-0000-000000000002';
const NOTIF_ID = 'cccccccc-0000-0000-0000-000000000003';
const TOKEN_ID = 'dddddddd-0000-0000-0000-000000000004';

const userToken  = () => generateTestToken({ sub: USER_ID,  email: 'user@test.com',  role: UserRole.AGENT });
const otherToken = () => generateTestToken({ sub: OTHER_ID, email: 'other@test.com', role: UserRole.AGENT });

// ─── Factories ───────────────────────────────────────────────────────────────

function makeNotif(overrides: Partial<NotificationRecord> = {}): NotificationRecord {
  return {
    id: NOTIF_ID,
    userId: USER_ID,
    type: 'link_opened',
    title: 'A client opened your link',
    body: 'Jean Dupont viewed Villa Bord de Mer',
    data: { linkId: 'link-1', propertyId: 'prop-1' },
    isRead: false,
    createdAt: new Date('2026-03-01T10:00:00Z'),
    ...overrides,
  };
}

function makeSettings(overrides: Partial<NotificationSettingsRecord> = {}): NotificationSettingsRecord {
  return {
    id: 'settings-1',
    userId: USER_ID,
    pushEnabled: true,
    emailEnabled: true,
    reminderNoOpenDays: 3,
    linkExpiryAlertDays: 7,
    quietHoursStart: null,
    quietHoursEnd: null,
    disabledTypes: [],
    ...overrides,
  };
}

function makePushToken(overrides: Partial<PushTokenRecord> = {}): PushTokenRecord {
  return {
    id: TOKEN_ID,
    userId: USER_ID,
    token: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxx]',
    platform: 'ios',
    createdAt: new Date(),
    ...overrides,
  };
}

// ─── Mock factories ───────────────────────────────────────────────────────────

function mockNotifRepo(overrides: Partial<INotificationRepository> = {}): INotificationRepository {
  return {
    create:       jest.fn().mockResolvedValue(makeNotif()),
    findById:     jest.fn().mockResolvedValue(null),
    findByUser:   jest.fn().mockResolvedValue([]),
    countUnread:  jest.fn().mockResolvedValue(0),
    markRead:     jest.fn().mockImplementation(async (id) => makeNotif({ id, isRead: true })),
    markAllRead:  jest.fn().mockResolvedValue(0),
    delete:       jest.fn().mockResolvedValue(undefined),
    purgeOlderThan: jest.fn().mockResolvedValue(0),
    ...overrides,
  };
}

function mockSettingsRepo(overrides: Partial<ISettingsRepository> = {}): ISettingsRepository {
  return {
    findByUser: jest.fn().mockResolvedValue(null),
    upsert:     jest.fn().mockImplementation(async (userId, data) => makeSettings({ userId, ...data })),
    ...overrides,
  };
}

function mockPushTokenRepo(overrides: Partial<IPushTokenRepository> = {}): IPushTokenRepository {
  return {
    create:        jest.fn().mockResolvedValue(makePushToken()),
    findByUser:    jest.fn().mockResolvedValue([]),
    findById:      jest.fn().mockResolvedValue(null),
    delete:        jest.fn().mockResolvedValue(undefined),
    deleteByToken: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function mockPushProvider(overrides: Partial<IPushProvider> = {}): IPushProvider {
  return {
    send: jest.fn().mockResolvedValue({ successCount: 0, failedTokens: [] }),
    ...overrides,
  };
}

// ─── App builder ─────────────────────────────────────────────────────────────

function buildApp(opts: {
  notifRepo?: Partial<INotificationRepository>;
  settingsRepo?: Partial<ISettingsRepository>;
  pushTokenRepo?: Partial<IPushTokenRepository>;
  pushProvider?: Partial<IPushProvider>;
} = {}): FastifyInstance {
  const notifRepo    = mockNotifRepo(opts.notifRepo);
  const settingsRepo = mockSettingsRepo(opts.settingsRepo);
  const pushRepo     = mockPushTokenRepo(opts.pushTokenRepo);
  const provider     = mockPushProvider(opts.pushProvider);
  const service      = new NotificationService(notifRepo, settingsRepo, pushRepo, provider);
  return buildNotificationTestApp(service, settingsRepo, pushRepo);
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Notification routes integration', () => {

  // ── GET /api/v1/notifications ─────────────────────────────────────────────
  describe('GET /api/v1/notifications', () => {
    it('returns 401 when not authenticated', async () => {
      const app = buildApp();
      const res = await app.inject({ method: 'GET', url: '/api/v1/notifications' });
      expect(res.statusCode).toBe(401);
    });

    it('returns empty list by default', async () => {
      const app = buildApp();
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications',
        headers: { authorization: `Bearer ${userToken()}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.notifications).toEqual([]);
    });

    it('returns paginated notifications', async () => {
      const notifs = [makeNotif(), makeNotif({ id: 'other-id', isRead: true })];
      const app = buildApp({ notifRepo: { findByUser: jest.fn().mockResolvedValue(notifs) } });
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications?limit=5&offset=0',
        headers: { authorization: `Bearer ${userToken()}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.notifications).toHaveLength(2);
    });

    it('filters unread notifications with ?unread=true', async () => {
      const findByUser = jest.fn().mockResolvedValue([makeNotif()]);
      const app = buildApp({ notifRepo: { findByUser } });
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications?unread=true',
        headers: { authorization: `Bearer ${userToken()}` },
      });
      expect(res.statusCode).toBe(200);
      expect(findByUser).toHaveBeenCalledWith(USER_ID, expect.objectContaining({ unreadOnly: true }));
    });
  });

  // ── GET /api/v1/notifications/unread-count ────────────────────────────────
  describe('GET /api/v1/notifications/unread-count', () => {
    it('returns 401 when not authenticated', async () => {
      const app = buildApp();
      const res = await app.inject({ method: 'GET', url: '/api/v1/notifications/unread-count' });
      expect(res.statusCode).toBe(401);
    });

    it('returns zero when no unread notifications', async () => {
      const app = buildApp();
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications/unread-count',
        headers: { authorization: `Bearer ${userToken()}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.count).toBe(0);
    });

    it('returns the correct unread count', async () => {
      const app = buildApp({ notifRepo: { countUnread: jest.fn().mockResolvedValue(5) } });
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/notifications/unread-count',
        headers: { authorization: `Bearer ${userToken()}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.count).toBe(5);
    });
  });

  // ── PATCH /api/v1/notifications/:id/read ─────────────────────────────────
  describe('PATCH /api/v1/notifications/:id/read', () => {
    it('returns 401 when not authenticated', async () => {
      const app = buildApp();
      const res = await app.inject({ method: 'PATCH', url: `/api/v1/notifications/${NOTIF_ID}/read` });
      expect(res.statusCode).toBe(401);
    });

    it('marks notification as read and returns 200', async () => {
      const notif = makeNotif();
      const app = buildApp({
        notifRepo: {
          findById: jest.fn().mockResolvedValue(notif),
          markRead: jest.fn().mockResolvedValue({ ...notif, isRead: true }),
        },
      });
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/notifications/${NOTIF_ID}/read`,
        headers: { authorization: `Bearer ${userToken()}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.isRead).toBe(true);
    });

    it('returns 404 when notification does not exist', async () => {
      const app = buildApp({ notifRepo: { findById: jest.fn().mockResolvedValue(null) } });
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/notifications/${NOTIF_ID}/read`,
        headers: { authorization: `Bearer ${userToken()}` },
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 403 when notification belongs to another user', async () => {
      const app = buildApp({
        notifRepo: { findById: jest.fn().mockResolvedValue(makeNotif({ userId: OTHER_ID })) },
      });
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/notifications/${NOTIF_ID}/read`,
        headers: { authorization: `Bearer ${userToken()}` },
      });
      expect(res.statusCode).toBe(403);
    });

    it('returns 400 when id is not a valid UUID', async () => {
      const app = buildApp();
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/notifications/not-a-uuid/read',
        headers: { authorization: `Bearer ${userToken()}` },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ── POST /api/v1/notifications/read-all ───────────────────────────────────
  describe('POST /api/v1/notifications/read-all', () => {
    it('returns 401 when not authenticated', async () => {
      const app = buildApp();
      const res = await app.inject({ method: 'POST', url: '/api/v1/notifications/read-all' });
      expect(res.statusCode).toBe(401);
    });

    it('marks all notifications as read and returns count', async () => {
      const app = buildApp({ notifRepo: { markAllRead: jest.fn().mockResolvedValue(7) } });
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/notifications/read-all',
        headers: { authorization: `Bearer ${userToken()}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.marked).toBe(7);
    });
  });

  // ── DELETE /api/v1/notifications/:id ─────────────────────────────────────
  describe('DELETE /api/v1/notifications/:id', () => {
    it('returns 401 when not authenticated', async () => {
      const app = buildApp();
      const res = await app.inject({ method: 'DELETE', url: `/api/v1/notifications/${NOTIF_ID}` });
      expect(res.statusCode).toBe(401);
    });

    it('deletes notification and returns 200', async () => {
      const app = buildApp({
        notifRepo: {
          findById: jest.fn().mockResolvedValue(makeNotif()),
          delete:   jest.fn().mockResolvedValue(undefined),
        },
      });
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/notifications/${NOTIF_ID}`,
        headers: { authorization: `Bearer ${userToken()}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.deleted).toBe(true);
    });

    it('returns 404 when notification does not exist', async () => {
      const app = buildApp({ notifRepo: { findById: jest.fn().mockResolvedValue(null) } });
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/notifications/${NOTIF_ID}`,
        headers: { authorization: `Bearer ${userToken()}` },
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 403 when notification belongs to another user', async () => {
      const app = buildApp({
        notifRepo: { findById: jest.fn().mockResolvedValue(makeNotif({ userId: OTHER_ID })) },
      });
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/notifications/${NOTIF_ID}`,
        headers: { authorization: `Bearer ${userToken()}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── GET /api/v1/notification-settings ────────────────────────────────────
  describe('GET /api/v1/notification-settings', () => {
    it('returns 401 when not authenticated', async () => {
      const app = buildApp();
      const res = await app.inject({ method: 'GET', url: '/api/v1/notification-settings' });
      expect(res.statusCode).toBe(401);
    });

    it('returns default settings when none exist', async () => {
      const app = buildApp({ settingsRepo: { findByUser: jest.fn().mockResolvedValue(null) } });
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/notification-settings',
        headers: { authorization: `Bearer ${userToken()}` },
      });
      expect(res.statusCode).toBe(200);
      const settings = res.json().data;
      expect(settings.pushEnabled).toBe(true);
      expect(settings.emailEnabled).toBe(true);
      expect(settings.reminderNoOpenDays).toBe(3);
      expect(settings.linkExpiryAlertDays).toBe(7);
    });

    it('returns persisted settings when they exist', async () => {
      const saved = makeSettings({ pushEnabled: false, reminderNoOpenDays: 5 });
      const app = buildApp({ settingsRepo: { findByUser: jest.fn().mockResolvedValue(saved) } });
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/notification-settings',
        headers: { authorization: `Bearer ${userToken()}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.pushEnabled).toBe(false);
      expect(res.json().data.reminderNoOpenDays).toBe(5);
    });
  });

  // ── PATCH /api/v1/notification-settings ──────────────────────────────────
  describe('PATCH /api/v1/notification-settings', () => {
    it('returns 401 when not authenticated', async () => {
      const app = buildApp();
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/notification-settings',
        payload: { pushEnabled: false },
      });
      expect(res.statusCode).toBe(401);
    });

    it('updates settings and returns 200', async () => {
      const upsert = jest.fn().mockResolvedValue(makeSettings({ pushEnabled: false }));
      const app = buildApp({ settingsRepo: { upsert } });
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/notification-settings',
        headers: { authorization: `Bearer ${userToken()}`, 'content-type': 'application/json' },
        payload: JSON.stringify({ pushEnabled: false }),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.pushEnabled).toBe(false);
    });

    it('updates quiet hours setting', async () => {
      const upsert = jest.fn().mockResolvedValue(
        makeSettings({ quietHoursStart: '22:00', quietHoursEnd: '08:00' }),
      );
      const app = buildApp({ settingsRepo: { upsert } });
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/notification-settings',
        headers: { authorization: `Bearer ${userToken()}`, 'content-type': 'application/json' },
        payload: JSON.stringify({ quietHoursStart: '22:00', quietHoursEnd: '08:00' }),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.quietHoursStart).toBe('22:00');
    });

    it('returns 400 when quiet hours format is invalid', async () => {
      const app = buildApp();
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/notification-settings',
        headers: { authorization: `Bearer ${userToken()}`, 'content-type': 'application/json' },
        payload: JSON.stringify({ quietHoursStart: '9:00' }), // missing leading zero
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when reminderNoOpenDays is out of range', async () => {
      const app = buildApp();
      const res = await app.inject({
        method: 'PATCH',
        url: '/api/v1/notification-settings',
        headers: { authorization: `Bearer ${userToken()}`, 'content-type': 'application/json' },
        payload: JSON.stringify({ reminderNoOpenDays: 99 }),
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ── POST /api/v1/push-tokens ──────────────────────────────────────────────
  describe('POST /api/v1/push-tokens', () => {
    it('returns 401 when not authenticated', async () => {
      const app = buildApp();
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/push-tokens',
        payload: { token: 'abc', platform: 'ios' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('registers a push token and returns 201', async () => {
      const app = buildApp();
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/push-tokens',
        headers: { authorization: `Bearer ${userToken()}`, 'content-type': 'application/json' },
        payload: JSON.stringify({ token: 'ExponentPushToken[xxxxxx]', platform: 'ios' }),
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().data.platform).toBe('ios');
    });

    it('accepts android and web platforms', async () => {
      for (const platform of ['android', 'web'] as const) {
        const app = buildApp({
          pushTokenRepo: { create: jest.fn().mockResolvedValue(makePushToken({ platform })) },
        });
        const res = await app.inject({
          method: 'POST',
          url: '/api/v1/push-tokens',
          headers: { authorization: `Bearer ${userToken()}`, 'content-type': 'application/json' },
          payload: JSON.stringify({ token: 'tok-' + platform, platform }),
        });
        expect(res.statusCode).toBe(201);
        expect(res.json().data.platform).toBe(platform);
      }
    });

    it('returns 400 when platform is invalid', async () => {
      const app = buildApp();
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/push-tokens',
        headers: { authorization: `Bearer ${userToken()}`, 'content-type': 'application/json' },
        payload: JSON.stringify({ token: 'tok', platform: 'windows' }),
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when token is missing', async () => {
      const app = buildApp();
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/push-tokens',
        headers: { authorization: `Bearer ${userToken()}`, 'content-type': 'application/json' },
        payload: JSON.stringify({ platform: 'ios' }),
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ── DELETE /api/v1/push-tokens/:id ───────────────────────────────────────
  describe('DELETE /api/v1/push-tokens/:id', () => {
    it('returns 401 when not authenticated', async () => {
      const app = buildApp();
      const res = await app.inject({ method: 'DELETE', url: `/api/v1/push-tokens/${TOKEN_ID}` });
      expect(res.statusCode).toBe(401);
    });

    it('deletes push token and returns 200', async () => {
      const app = buildApp({
        pushTokenRepo: {
          findById: jest.fn().mockResolvedValue(makePushToken()),
          delete:   jest.fn().mockResolvedValue(undefined),
        },
      });
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/push-tokens/${TOKEN_ID}`,
        headers: { authorization: `Bearer ${userToken()}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it('returns 404 when push token does not exist', async () => {
      const app = buildApp({ pushTokenRepo: { findById: jest.fn().mockResolvedValue(null) } });
      const res = await app.inject({
        method: 'DELETE',
        url: `/api/v1/push-tokens/${TOKEN_ID}`,
        headers: { authorization: `Bearer ${userToken()}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
