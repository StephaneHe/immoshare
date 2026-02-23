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
import {
  NotificationNotFoundError,
  NotificationForbiddenError,
} from '../../../src/modules/notification/notification.errors';

const USER_A = 'aaaaaaaa-1111-2222-3333-444444444444';
const USER_B = 'bbbbbbbb-1111-2222-3333-444444444444';
const NOTIF_ID = 'cccccccc-1111-2222-3333-444444444444';

const sampleNotif: NotificationRecord = {
  id: NOTIF_ID, userId: USER_A, type: 'link_opened',
  title: 'Link opened', body: 'John opened your link',
  data: { linkId: 'abc' }, isRead: false, createdAt: new Date(),
};

const defaultSettings: NotificationSettingsRecord = {
  id: 'ss-1', userId: USER_A, ...DEFAULT_SETTINGS,
};

const sampleToken: PushTokenRecord = {
  id: 'pt-1', userId: USER_A, token: 'fcm-token-abc',
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
    upsert: jest.fn().mockResolvedValue(defaultSettings),
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

function mockPushProvider(ov: Partial<IPushProvider> = {}): IPushProvider {
  return {
    send: jest.fn().mockResolvedValue({ successCount: 1, failedTokens: [] }),
    ...ov,
  };
}

function createService(
  nr?: Partial<INotificationRepository>,
  sr?: Partial<ISettingsRepository>,
  ptr?: Partial<IPushTokenRepository>,
  pp?: Partial<IPushProvider>,
) {
  return new NotificationService(
    mockNotifRepo(nr), mockSettingsRepo(sr), mockPushTokenRepo(ptr), mockPushProvider(pp),
  );
}

describe('NotificationService.notify', () => {
  it('should create notification and send push', async () => {
    const pp = mockPushProvider();
    const service = new NotificationService(
      mockNotifRepo(), mockSettingsRepo(), mockPushTokenRepo(), pp,
    );
    const result = await service.notify(USER_A, 'link_opened', 'Title', 'Body');
    expect(result.id).toBe(NOTIF_ID);
    expect(pp.send).toHaveBeenCalledWith(['fcm-token-abc'], expect.objectContaining({ title: 'Title' }));
  });

  it('should skip push if type is in disabledTypes', async () => {
    const pp = mockPushProvider();
    const settings = { ...defaultSettings, disabledTypes: ['link_opened'] };
    const service = new NotificationService(
      mockNotifRepo(),
      mockSettingsRepo({ findByUser: jest.fn().mockResolvedValue(settings) }),
      mockPushTokenRepo(), pp,
    );
    await service.notify(USER_A, 'link_opened', 'Title', 'Body');
    expect(pp.send).not.toHaveBeenCalled();
  });

  it('should skip push if pushEnabled is false', async () => {
    const pp = mockPushProvider();
    const settings = { ...defaultSettings, pushEnabled: false };
    const service = new NotificationService(
      mockNotifRepo(),
      mockSettingsRepo({ findByUser: jest.fn().mockResolvedValue(settings) }),
      mockPushTokenRepo(), pp,
    );
    await service.notify(USER_A, 'link_opened', 'Title', 'Body');
    expect(pp.send).not.toHaveBeenCalled();
  });

  it('should remove failed tokens after push', async () => {
    const ptr = mockPushTokenRepo();
    const pp = mockPushProvider({
      send: jest.fn().mockResolvedValue({ successCount: 0, failedTokens: ['fcm-token-abc'] }),
    });
    const service = new NotificationService(mockNotifRepo(), mockSettingsRepo(), ptr, pp);
    await service.notify(USER_A, 'link_opened', 'Title', 'Body');
    expect(ptr.deleteByToken).toHaveBeenCalledWith('fcm-token-abc');
  });

  it('should return defaults when no settings exist', async () => {
    const service = createService(
      undefined,
      { findByUser: jest.fn().mockResolvedValue(null) },
    );
    const settings = await service.getSettings(USER_A);
    expect(settings.pushEnabled).toBe(true);
    expect(settings.reminderNoOpenDays).toBe(3);
  });
});

describe('NotificationService.list', () => {
  it('should return notifications for user', async () => {
    const service = createService();
    const result = await service.list(USER_A, 20, 0);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('link_opened');
  });
});

describe('NotificationService.markRead', () => {
  it('should mark notification as read', async () => {
    const service = createService();
    const result = await service.markRead(NOTIF_ID, USER_A);
    expect(result.isRead).toBe(true);
  });

  it('should throw NOT_FOUND if notification does not exist', async () => {
    const service = createService({ findById: jest.fn().mockResolvedValue(null) });
    await expect(service.markRead('bad-id', USER_A)).rejects.toThrow(NotificationNotFoundError);
  });

  it('should throw FORBIDDEN if not owner', async () => {
    const service = createService();
    await expect(service.markRead(NOTIF_ID, USER_B)).rejects.toThrow(NotificationForbiddenError);
  });
});

describe('NotificationService.markAllRead', () => {
  it('should return count of marked notifications', async () => {
    const service = createService();
    const count = await service.markAllRead(USER_A);
    expect(count).toBe(5);
  });
});

describe('NotificationService.deleteNotification', () => {
  it('should delete notification', async () => {
    const nr = mockNotifRepo();
    const service = new NotificationService(nr, mockSettingsRepo(), mockPushTokenRepo(), mockPushProvider());
    await service.deleteNotification(NOTIF_ID, USER_A);
    expect(nr.delete).toHaveBeenCalledWith(NOTIF_ID);
  });

  it('should throw FORBIDDEN if not owner', async () => {
    const service = createService();
    await expect(service.deleteNotification(NOTIF_ID, USER_B)).rejects.toThrow(NotificationForbiddenError);
  });
});

describe('NotificationService.getUnreadCount', () => {
  it('should return unread count', async () => {
    const service = createService();
    const count = await service.getUnreadCount(USER_A);
    expect(count).toBe(3);
  });
});
