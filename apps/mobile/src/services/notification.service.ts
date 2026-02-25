/**
 * Notification Service — API layer for notifications (M8)
 * Endpoints: GET/PATCH/DELETE /api/v1/notifications, POST /push-tokens
 */
import { api } from './api';

export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationListResponse = {
  notifications: Notification[];
  total: number;
  page: number;
  totalPages: number;
};

export type NotificationSettings = {
  emailEnabled: boolean;
  pushEnabled: boolean;
  shareViewed: boolean;
  partnerRequest: boolean;
  systemUpdates: boolean;
};

export const notificationService = {
  async list(page = 1, limit = 20): Promise<NotificationListResponse> {
    return api.get<NotificationListResponse>(
      `/api/v1/notifications?page=${page}&limit=${limit}`
    );
  },

  async getUnreadCount(): Promise<{ count: number }> {
    return api.get<{ count: number }>('/api/v1/notifications/unread-count');
  },

  async markAsRead(id: string): Promise<Notification> {
    return api.patch<Notification>(`/api/v1/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    return api.post<void>('/api/v1/notifications/read-all');
  },

  async remove(id: string): Promise<void> {
    return api.delete<void>(`/api/v1/notifications/${id}`);
  },

  async getSettings(): Promise<NotificationSettings> {
    return api.get<NotificationSettings>('/api/v1/notification-settings');
  },

  async updateSettings(data: Partial<NotificationSettings>): Promise<NotificationSettings> {
    return api.patch<NotificationSettings>('/api/v1/notification-settings', data);
  },

  async registerPushToken(token: string, platform: 'ios' | 'android'): Promise<{ id: string }> {
    return api.post<{ id: string }>('/api/v1/push-tokens', { token, platform });
  },

  async unregisterPushToken(id: string): Promise<void> {
    return api.delete<void>(`/api/v1/push-tokens/${id}`);
  },
};
