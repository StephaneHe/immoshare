/**
 * Notification Store — state management for notifications (M8)
 */
import { create } from 'zustand';
import {
  notificationService,
  Notification,
  NotificationSettings,
} from '../services/notification.service';

type NotificationState = {
  notifications: Notification[];
  total: number;
  page: number;
  totalPages: number;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  settings: NotificationSettings | null;

  fetchNotifications: (page?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  fetchSettings: () => Promise<void>;
  updateSettings: (data: Partial<NotificationSettings>) => Promise<void>;
  registerPushToken: (token: string, platform: 'ios' | 'android') => Promise<void>;
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  total: 0,
  page: 1,
  totalPages: 0,
  unreadCount: 0,
  isLoading: false,
  error: null,
  settings: null,

  fetchNotifications: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const result = await notificationService.list(page);
      set({
        notifications:
          page === 1
            ? result.notifications
            : [...get().notifications, ...result.notifications],
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        isLoading: false,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load notifications', isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const { count } = await notificationService.getUnreadCount();
      set({ unreadCount: count });
    } catch {
      // Silent failure for badge count
    }
  },

  markAsRead: async (id: string) => {
    const updated = await notificationService.markAsRead(id);
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? updated : n)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: async () => {
    await notificationService.markAllAsRead();
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },

  deleteNotification: async (id: string) => {
    await notificationService.remove(id);
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
      total: state.total - 1,
    }));
  },

  fetchSettings: async () => {
    const settings = await notificationService.getSettings();
    set({ settings });
  },

  updateSettings: async (data) => {
    const settings = await notificationService.updateSettings(data);
    set({ settings });
  },

  registerPushToken: async (token, platform) => {
    await notificationService.registerPushToken(token, platform);
  },
}));
