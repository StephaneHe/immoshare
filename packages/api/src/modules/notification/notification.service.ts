import {
  INotificationRepository,
  ISettingsRepository,
  IPushTokenRepository,
  IPushProvider,
  CreateNotificationInput,
  NotificationRecord,
  NotificationSettingsRecord,
  DEFAULT_SETTINGS,
} from './notification.types';
import {
  NotificationNotFoundError,
  NotificationForbiddenError,
} from './notification.errors';

export class NotificationService {
  constructor(
    private readonly notifRepo: INotificationRepository,
    private readonly settingsRepo: ISettingsRepository,
    private readonly pushTokenRepo: IPushTokenRepository,
    private readonly pushProvider: IPushProvider,
  ) {}

  /**
   * Create a notification and optionally send push.
   * Called by other modules via: notify(userId, type, title, body, data)
   */
  async notify(
    userId: string,
    type: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<NotificationRecord> {
    const settings = await this.getSettings(userId);

    // Create in DB regardless of push/email settings
    const notif = await this.notifRepo.create({
      userId,
      type: type as any,
      title,
      body,
      data,
    });

    // Check if type is disabled
    if (settings.disabledTypes.includes(type)) {
      return notif;
    }

    // Send push if enabled and not in quiet hours
    if (settings.pushEnabled && !this.isQuietHours(settings)) {
      await this.sendPush(userId, title, body, data);
    }

    return notif;
  }

  async list(userId: string, limit: number, offset: number, unreadOnly?: boolean): Promise<NotificationRecord[]> {
    return this.notifRepo.findByUser(userId, { limit, offset, unreadOnly });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notifRepo.countUnread(userId);
  }

  async markRead(notifId: string, userId: string): Promise<NotificationRecord> {
    const notif = await this.notifRepo.findById(notifId);
    if (!notif) throw new NotificationNotFoundError();
    if (notif.userId !== userId) throw new NotificationForbiddenError();
    return this.notifRepo.markRead(notifId);
  }

  async markAllRead(userId: string): Promise<number> {
    return this.notifRepo.markAllRead(userId);
  }

  async deleteNotification(notifId: string, userId: string): Promise<void> {
    const notif = await this.notifRepo.findById(notifId);
    if (!notif) throw new NotificationNotFoundError();
    if (notif.userId !== userId) throw new NotificationForbiddenError();
    await this.notifRepo.delete(notifId);
  }

  async getSettings(userId: string): Promise<NotificationSettingsRecord> {
    const existing = await this.settingsRepo.findByUser(userId);
    if (existing) return existing;
    // Return defaults (not persisted yet)
    return {
      id: '',
      userId,
      ...DEFAULT_SETTINGS,
    };
  }

  // ─── Private helpers ───

  private isQuietHours(settings: NotificationSettingsRecord): boolean {
    if (!settings.quietHoursStart || !settings.quietHoursEnd) return false;

    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentMinutes = hours * 60 + minutes;

    const [startH, startM] = settings.quietHoursStart.split(':').map(Number);
    const [endH, endM] = settings.quietHoursEnd.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes <= endMinutes) {
      // Same day: e.g. 09:00 - 17:00
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Overnight: e.g. 22:00 - 08:00
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  private async sendPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    const tokens = await this.pushTokenRepo.findByUser(userId);
    if (tokens.length === 0) return;

    const tokenStrings = tokens.map(t => t.token);
    const result = await this.pushProvider.send(tokenStrings, { title, body, data });

    // Remove invalid tokens
    for (const failedToken of result.failedTokens) {
      await this.pushTokenRepo.deleteByToken(failedToken);
    }
  }
}
