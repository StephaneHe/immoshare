// ─── Domain types for Notification module ───

export type NotificationType =
  | 'link_opened'
  | 'reshare_requested'
  | 'reshare_approved'
  | 'reshare_rejected'
  | 'partner_joined'
  | 'link_expiring'
  | 'reminder_no_open'
  | 'property_viewed'
  | 'send_failed';

// ─── Notification ───

export interface NotificationRecord {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: Date;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

// ─── Notification Settings ───

export interface NotificationSettingsRecord {
  id: string;
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  reminderNoOpenDays: number;
  linkExpiryAlertDays: number;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  disabledTypes: string[];
}

export interface UpdateSettingsInput {
  pushEnabled?: boolean;
  emailEnabled?: boolean;
  reminderNoOpenDays?: number;
  linkExpiryAlertDays?: number;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  disabledTypes?: string[];
}

// ─── Push Token ───

export interface PushTokenRecord {
  id: string;
  userId: string;
  token: string;
  platform: string;
  createdAt: Date;
}

// ─── Repository interfaces ───

export interface INotificationRepository {
  create(data: CreateNotificationInput): Promise<NotificationRecord>;
  findById(id: string): Promise<NotificationRecord | null>;
  findByUser(userId: string, opts: { limit: number; offset: number; unreadOnly?: boolean }): Promise<NotificationRecord[]>;
  countUnread(userId: string): Promise<number>;
  markRead(id: string): Promise<NotificationRecord>;
  markAllRead(userId: string): Promise<number>;
  delete(id: string): Promise<void>;
  purgeOlderThan(date: Date): Promise<number>;
}

export interface ISettingsRepository {
  findByUser(userId: string): Promise<NotificationSettingsRecord | null>;
  upsert(userId: string, data: UpdateSettingsInput): Promise<NotificationSettingsRecord>;
}

export interface IPushTokenRepository {
  create(userId: string, token: string, platform: string): Promise<PushTokenRecord>;
  findByUser(userId: string): Promise<PushTokenRecord[]>;
  findById(id: string): Promise<PushTokenRecord | null>;
  delete(id: string): Promise<void>;
  deleteByToken(token: string): Promise<void>;
}

// ─── Push Provider (FCM abstraction) ───

export interface IPushProvider {
  send(tokens: string[], payload: { title: string; body: string; data?: Record<string, unknown> }): Promise<{
    successCount: number;
    failedTokens: string[];
  }>;
}

// ─── Notification data provider (cross-module reads) ───

export interface INotificationDataProvider {
  /** Find share links sent > X days ago with no page_opened event and no reminder sent */
  findLinksWithoutOpens(daysAgo: number): Promise<Array<{
    linkId: string;
    userId: string;
    contactName: string;
    propertyTitle: string;
    propertyId: string;
    contactId: string;
  }>>;

  /** Find active share links expiring within X days */
  findExpiringLinks(withinDays: number): Promise<Array<{
    linkId: string;
    userId: string;
    contactName: string;
    propertyTitle: string;
    propertyId: string;
    expiresAt: Date;
  }>>;

  /** Mark a link as reminder-sent (set metadata flag) */
  markReminderSent(linkId: string): Promise<void>;

  /** Mark a link as expiry-alert-sent */
  markExpiryAlertSent(linkId: string): Promise<void>;
}

// ─── Default settings ───

export const DEFAULT_SETTINGS: Omit<NotificationSettingsRecord, 'id' | 'userId'> = {
  pushEnabled: true,
  emailEnabled: true,
  reminderNoOpenDays: 3,
  linkExpiryAlertDays: 7,
  quietHoursStart: null,
  quietHoursEnd: null,
  disabledTypes: [],
};
