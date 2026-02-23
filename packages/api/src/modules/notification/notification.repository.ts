import { PrismaClient } from '@prisma/client';
import {
  INotificationRepository,
  ISettingsRepository,
  IPushTokenRepository,
  INotificationDataProvider,
  NotificationRecord,
  NotificationSettingsRecord,
  PushTokenRecord,
  CreateNotificationInput,
  UpdateSettingsInput,
} from './notification.types';

export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateNotificationInput): Promise<NotificationRecord> {
    const r = await this.prisma.notification.create({ data: {
      userId: data.userId, type: data.type as any,
      title: data.title, body: data.body, data: data.data as any,
    }});
    return this.toNotif(r);
  }

  async findById(id: string) {
    const r = await this.prisma.notification.findUnique({ where: { id } });
    return r ? this.toNotif(r) : null;
  }

  async findByUser(userId: string, opts: { limit: number; offset: number; unreadOnly?: boolean }) {
    const where: any = { userId };
    if (opts.unreadOnly) where.isRead = false;
    const rs = await this.prisma.notification.findMany({
      where, orderBy: { createdAt: 'desc' },
      take: opts.limit, skip: opts.offset,
    });
    return rs.map(r => this.toNotif(r));
  }

  async countUnread(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markRead(id: string) {
    const r = await this.prisma.notification.update({ where: { id }, data: { isRead: true } });
    return this.toNotif(r);
  }

  async markAllRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, isRead: false }, data: { isRead: true },
    });
    return result.count;
  }

  async delete(id: string) {
    await this.prisma.notification.delete({ where: { id } });
  }

  async purgeOlderThan(date: Date) {
    const result = await this.prisma.notification.deleteMany({
      where: { createdAt: { lt: date } },
    });
    return result.count;
  }

  private toNotif(r: any): NotificationRecord {
    return {
      id: r.id, userId: r.userId, type: r.type, title: r.title,
      body: r.body, data: r.data as any, isRead: r.isRead, createdAt: r.createdAt,
    };
  }
}

export class PrismaSettingsRepository implements ISettingsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUser(userId: string) {
    const r = await this.prisma.notificationSettings.findUnique({ where: { userId } });
    return r ? this.toSettings(r) : null;
  }

  async upsert(userId: string, data: UpdateSettingsInput) {
    const r = await this.prisma.notificationSettings.upsert({
      where: { userId },
      create: { userId, ...data } as any,
      update: data as any,
    });
    return this.toSettings(r);
  }

  private toSettings(r: any): NotificationSettingsRecord {
    return {
      id: r.id, userId: r.userId,
      pushEnabled: r.pushEnabled, emailEnabled: r.emailEnabled,
      reminderNoOpenDays: r.reminderNoOpenDays, linkExpiryAlertDays: r.linkExpiryAlertDays,
      quietHoursStart: r.quietHoursStart, quietHoursEnd: r.quietHoursEnd,
      disabledTypes: r.disabledTypes,
    };
  }
}

export class PrismaPushTokenRepository implements IPushTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(userId: string, token: string, platform: string) {
    const r = await this.prisma.pushToken.upsert({
      where: { token },
      create: { userId, token, platform },
      update: { userId, platform },
    });
    return this.toToken(r);
  }

  async findByUser(userId: string) {
    const rs = await this.prisma.pushToken.findMany({ where: { userId } });
    return rs.map(r => this.toToken(r));
  }

  async findById(id: string) {
    const r = await this.prisma.pushToken.findUnique({ where: { id } });
    return r ? this.toToken(r) : null;
  }

  async delete(id: string) {
    await this.prisma.pushToken.delete({ where: { id } });
  }

  async deleteByToken(token: string) {
    await this.prisma.pushToken.deleteMany({ where: { token } });
  }

  private toToken(r: any): PushTokenRecord {
    return { id: r.id, userId: r.userId, token: r.token, platform: r.platform, createdAt: r.createdAt };
  }
}

export class PrismaNotificationDataProvider implements INotificationDataProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async findLinksWithoutOpens(daysAgo: number) {
    const threshold = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);
    // Find share links created before threshold, active, with no page_opened events, no reminder sent
    const links = await this.prisma.shareLink.findMany({
      where: {
        isActive: true,
        createdAt: { lt: threshold },
        trackEvents: { none: { eventType: 'PAGE_OPENED' } },
        NOT: { sentAt: null },
      },
      include: {
        contact: { select: { name: true, id: true } },
        page: { include: { property: { select: { id: true, title: true, ownerId: true } } } },
      },
    });

    return links
      .filter(l => !(l as any).metadata?.reminderSent)
      .map(l => ({
        linkId: l.id,
        userId: l.page.property.ownerId,
        contactName: l.contact.name,
        propertyTitle: l.page.property.title,
        propertyId: l.page.property.id,
        contactId: l.contact.id,
      }));
  }

  async findExpiringLinks(withinDays: number) {
    const deadline = new Date(Date.now() + withinDays * 24 * 3600 * 1000);
    const links = await this.prisma.shareLink.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: new Date(), lt: deadline },
      },
      include: {
        contact: { select: { name: true } },
        page: { include: { property: { select: { id: true, title: true, ownerId: true } } } },
      },
    });

    return links
      .filter(l => !(l as any).metadata?.expiryAlertSent)
      .map(l => ({
        linkId: l.id,
        userId: l.page.property.ownerId,
        contactName: l.contact.name,
        propertyTitle: l.page.property.title,
        propertyId: l.page.property.id,
        expiresAt: l.expiresAt,
      }));
  }

  async markReminderSent(_linkId: string) {
    // In a production system, update shareLink.metadata.reminderSent = true
    // For now, this is a stub — the actual metadata update depends on schema support
  }

  async markExpiryAlertSent(_linkId: string) {
    // Stub — same as above
  }
}
