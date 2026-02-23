import { UserRole } from '@immo-share/shared/constants/enums';
import { buildNotificationTestApp } from '../../helpers/testApp';
import { NotificationService } from '../../../src/modules/notification/notification.service';
import {
  INotificationRepository,
  ISettingsRepository,
  IPushTokenRepository,
  IPushProvider,
  NotificationRecord,
  NotificationSettingsRecord,
  PushTokenRecord,
  DEFAULT_SETTINGS,
} from '../../../src/modules/notification/notification.types';
import { generateTestToken } from '../../helpers/auth';

const USER_A = 'aaaaaaaa-1111-2222-3333-444444444444';
const NOTIF_ID = 'cccccccc-1111-2222-3333-444444444444';
const TOKEN_ID = 'dddddddd-1111-2222-3333-444444444444';

const sampleNotif: NotificationRecord = {
  id: NOTIF_ID, userId: USER_A, type: 'link_opened',
  title: 'Link opened', body: 'John opened your link',
  data: { linkId: 'abc' }, isRead: false, createdAt: new Date(),
};

const defaultSettings: NotificationSettingsRecord = {
  id: 'ss-1', userId: USER_A, ...DEFAULT_SETTINGS,
};

const sampleToken: PushTokenRecord = {
  id: TOKEN_ID, userId: USER_A, token: 'fcm-tok-1',
  platform: 'android', createdAt: new Date(),
};

function mockNotifRepo(ov: Partial<INotificationRepository> = {}): INotificationRepository {
  return {
    create: jest.fn().mockResolvedValue(sampleNotif),
    findById: jest.fn().mockResolvedValue(sampleNotif),
    findByUser: jest.fn().mockResolvedValue([sampleNotif]),
    countUnread: jest.fn().mockResolvedValue(3),
    markRead: jest.fn().mockResolvedValue({ ...sampleNotif, isRead: true }),
    markAllRead: jest.fn().mockResolvedValue(5),
    delete: jest.fn().mockResolvedValue(undefined),
    purgeOlderThan: jest.fn().mockResolvedValue(10),
    ...ov,
  };
}

function mockSettingsRepo(ov: Partial<ISettingsRepository> = {}): ISettingsRepository {
  return {
    findByUser: jest.fn().mockResolvedValue(defaultSettings),
    upsert: jest.fn().mockImplementation((_uid, data) => Promise.resolve({ ...defaultSettings, ...data })),
    ...ov,
  };
}

function mockPushTokenRepo(ov: Partial<IPushTokenRepository> = {}): IPushTokenRepository {
  return {
    create: jest.fn().mockResolvedValue(sampleToken),
    findByUser: jest.fn().mockResolvedValue([sampleToken]),
    findById: jest.fn().mockResolvedValue(sampleToken),
    delete: jest.fn().mockResolvedValue(undefined),
    deleteByToken: jest.fn().mockResolvedValue(undefined),
    ...ov,
  };
}

function mockPushProvider(): IPushProvider {
  return { send: jest.fn().mockResolvedValue({ successCount: 1, failedTokens: [] }) };
}

function setup(
  nrOv?: Partial<INotificationRepository>,
  srOv?: Partial<ISettingsRepository>,
  ptOv?: Partial<IPushTokenRepository>,
) {
  const nr = mockNotifRepo(nrOv);
  const sr = mockSettingsRepo(srOv);
  const pt = mockPushTokenRepo(ptOv);
  const pp = mockPushProvider();
  const service = new NotificationService(nr, sr, pt, pp);
  const app = buildNotificationTestApp(service, sr, pt);
  const tokenA = generateTestToken({ sub: USER_A, email: 'a@test.com', role: UserRole.AGENT });
  return { app, tokenA, nr, sr, pt };
}

// ─── Notifications CRUD ───

describe('GET /api/v1/notifications', () => {
  it('should return 200 with notifications list', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'GET', url: '/api/v1/notifications',
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.notifications).toHaveLength(1);
  });

  it('should return 401 without auth', async () => {
    const { app } = setup();
    const res = await app.inject({ method: 'GET', url: '/api/v1/notifications' });
    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/v1/notifications/unread-count', () => {
  it('should return 200 with count', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'GET', url: '/api/v1/notifications/unread-count',
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.count).toBe(3);
  });
});

describe('PATCH /api/v1/notifications/:id/read', () => {
  it('should return 200 with isRead true', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'PATCH', url: `/api/v1/notifications/${NOTIF_ID}/read`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.isRead).toBe(true);
  });

  it('should return 404 for non-existent notification', async () => {
    const { app, tokenA } = setup({ findById: jest.fn().mockResolvedValue(null) });
    const res = await app.inject({
      method: 'PATCH', url: '/api/v1/notifications/ffffffff-ffff-4fff-bfff-ffffffffffff/read',
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/v1/notifications/read-all', () => {
  it('should return 200 with count', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'POST', url: '/api/v1/notifications/read-all',
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.marked).toBe(5);
  });
});

describe('DELETE /api/v1/notifications/:id', () => {
  it('should return 200 with deleted true', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'DELETE', url: `/api/v1/notifications/${NOTIF_ID}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.deleted).toBe(true);
  });
});

// ─── Settings ───

describe('GET /api/v1/notification-settings', () => {
  it('should return 200 with settings', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'GET', url: '/api/v1/notification-settings',
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.pushEnabled).toBe(true);
  });
});

describe('PATCH /api/v1/notification-settings', () => {
  it('should return 200 with updated settings', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'PATCH', url: '/api/v1/notification-settings',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { pushEnabled: false, reminderNoOpenDays: 5 },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.pushEnabled).toBe(false);
  });
});

// ─── Push Tokens ───

describe('POST /api/v1/push-tokens', () => {
  it('should return 201 with token', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'POST', url: '/api/v1/push-tokens',
      headers: { authorization: `Bearer ${tokenA}` },
      payload: { token: 'new-fcm-token', platform: 'ios' },
    });
    expect(res.statusCode).toBe(201);
    expect(JSON.parse(res.body).data.token).toBe('fcm-tok-1');
  });
});

describe('DELETE /api/v1/push-tokens/:id', () => {
  it('should return 200 with deleted true', async () => {
    const { app, tokenA } = setup();
    const res = await app.inject({
      method: 'DELETE', url: `/api/v1/push-tokens/${TOKEN_ID}`,
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).data.deleted).toBe(true);
  });

  it('should return 404 for non-existent token', async () => {
    const { app, tokenA } = setup(undefined, undefined, {
      findById: jest.fn().mockResolvedValue(null),
    });
    const res = await app.inject({
      method: 'DELETE', url: '/api/v1/push-tokens/ffffffff-ffff-4fff-bfff-ffffffffffff',
      headers: { authorization: `Bearer ${tokenA}` },
    });
    expect(res.statusCode).toBe(404);
  });
});
