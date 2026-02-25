/**
 * Tests for Notification Service + Store (M8)
 * Test plan: M8-01 through M8-07
 */
import { api } from '../../src/services/api';
import { notificationService } from '../../src/services/notification.service';
import { useNotificationStore } from '../../src/stores/notification.store';

jest.mock('../../src/services/api', () => ({
  api: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

const mockApi = api as jest.Mocked<typeof api>;

const fakeNotif = {
  id: 'n1', userId: 'u1', type: 'share_viewed', title: 'Link viewed',
  body: 'Alice viewed your property', data: null, isRead: false,
  createdAt: '2026-01-01T00:00:00Z',
};

const fakeSettings = {
  emailEnabled: true, pushEnabled: true, shareViewed: true,
  partnerRequest: true, systemUpdates: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  useNotificationStore.setState({
    notifications: [], total: 0, page: 1, totalPages: 0,
    unreadCount: 0, isLoading: false, error: null, settings: null,
  });
});

describe('Notification Service', () => {
  it('list() calls GET /notifications with pagination', async () => {
    mockApi.get.mockResolvedValue({ notifications: [fakeNotif], total: 1, page: 1, totalPages: 1 });
    await notificationService.list(1, 20);
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/notifications?page=1&limit=20');
  });

  it('getUnreadCount() calls GET /notifications/unread-count', async () => {
    mockApi.get.mockResolvedValue({ count: 5 });
    const result = await notificationService.getUnreadCount();
    expect(result.count).toBe(5);
  });

  it('markAsRead() calls PATCH /notifications/:id/read', async () => {
    mockApi.patch.mockResolvedValue({ ...fakeNotif, isRead: true });
    await notificationService.markAsRead('n1');
    expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/notifications/n1/read');
  });

  it('markAllAsRead() calls POST /notifications/read-all', async () => {
    mockApi.post.mockResolvedValue(undefined);
    await notificationService.markAllAsRead();
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/notifications/read-all');
  });

  it('remove() calls DELETE /notifications/:id', async () => {
    mockApi.delete.mockResolvedValue(undefined);
    await notificationService.remove('n1');
    expect(mockApi.delete).toHaveBeenCalledWith('/api/v1/notifications/n1');
  });

  it('getSettings() calls GET /notification-settings', async () => {
    mockApi.get.mockResolvedValue(fakeSettings);
    await notificationService.getSettings();
    expect(mockApi.get).toHaveBeenCalledWith('/api/v1/notification-settings');
  });

  it('updateSettings() calls PATCH /notification-settings', async () => {
    mockApi.patch.mockResolvedValue({ ...fakeSettings, systemUpdates: true });
    await notificationService.updateSettings({ systemUpdates: true });
    expect(mockApi.patch).toHaveBeenCalledWith('/api/v1/notification-settings', { systemUpdates: true });
  });

  it('registerPushToken() calls POST /push-tokens', async () => {
    mockApi.post.mockResolvedValue({ id: 'pt1' });
    await notificationService.registerPushToken('expo-token-abc', 'android');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/push-tokens', { token: 'expo-token-abc', platform: 'android' });
  });
});

describe('Notification Store', () => {
  // M8-01: List notifications with pagination
  it('M8-01: fetchNotifications() populates list', async () => {
    mockApi.get.mockResolvedValue({ notifications: [fakeNotif], total: 1, page: 1, totalPages: 1 });
    await useNotificationStore.getState().fetchNotifications();
    const s = useNotificationStore.getState();
    expect(s.notifications).toHaveLength(1);
    expect(s.total).toBe(1);
  });

  // M8-02: Unread count
  it('M8-02: fetchUnreadCount() updates count', async () => {
    mockApi.get.mockResolvedValue({ count: 3 });
    await useNotificationStore.getState().fetchUnreadCount();
    expect(useNotificationStore.getState().unreadCount).toBe(3);
  });

  // M8-03: Mark as read
  it('M8-03: markAsRead() updates notification and decrements count', async () => {
    useNotificationStore.setState({ notifications: [fakeNotif], unreadCount: 2 });
    mockApi.patch.mockResolvedValue({ ...fakeNotif, isRead: true });
    await useNotificationStore.getState().markAsRead('n1');
    expect(useNotificationStore.getState().notifications[0].isRead).toBe(true);
    expect(useNotificationStore.getState().unreadCount).toBe(1);
  });

  // M8-04: Mark all as read
  it('M8-04: markAllAsRead() marks all and resets count', async () => {
    useNotificationStore.setState({ notifications: [fakeNotif, { ...fakeNotif, id: 'n2' }], unreadCount: 2 });
    mockApi.post.mockResolvedValue(undefined);
    await useNotificationStore.getState().markAllAsRead();
    const s = useNotificationStore.getState();
    expect(s.notifications.every((n) => n.isRead)).toBe(true);
    expect(s.unreadCount).toBe(0);
  });

  // M8-05: Delete notification
  it('M8-05: deleteNotification() removes from list', async () => {
    useNotificationStore.setState({ notifications: [fakeNotif], total: 1 });
    mockApi.delete.mockResolvedValue(undefined);
    await useNotificationStore.getState().deleteNotification('n1');
    expect(useNotificationStore.getState().notifications).toHaveLength(0);
  });

  // M8-06: Get/update settings
  it('M8-06: fetchSettings() populates settings', async () => {
    mockApi.get.mockResolvedValue(fakeSettings);
    await useNotificationStore.getState().fetchSettings();
    expect(useNotificationStore.getState().settings).toEqual(fakeSettings);
  });

  it('M8-06b: updateSettings() updates settings', async () => {
    mockApi.patch.mockResolvedValue({ ...fakeSettings, systemUpdates: true });
    await useNotificationStore.getState().updateSettings({ systemUpdates: true });
    expect(useNotificationStore.getState().settings?.systemUpdates).toBe(true);
  });

  // M8-07: Register push token
  it('M8-07: registerPushToken() calls service', async () => {
    mockApi.post.mockResolvedValue({ id: 'pt1' });
    await useNotificationStore.getState().registerPushToken('expo-token', 'android');
    expect(mockApi.post).toHaveBeenCalledWith('/api/v1/push-tokens', { token: 'expo-token', platform: 'android' });
  });
});
