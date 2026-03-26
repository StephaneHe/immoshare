import { PrismaClient } from '@prisma/client';
import {
  ITrackEventRepository,
  ITrackingDataProvider,
  TrackEventRecord,
  TrackEventType,
} from './tracking.types';

export class PrismaTrackEventRepository implements ITrackEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: {
    linkId: string;
    eventType: TrackEventType;
    ipAddress: string | null;
    userAgent: string | null;
    metadata: Record<string, any>;
  }): Promise<TrackEventRecord> {
    // Convert snake_case eventType to UPPER_SNAKE for Prisma enum
    const prismaEventType = data.eventType.toUpperCase();
    const record = await this.prisma.trackEvent.create({
      data: {
        linkId: data.linkId,
        eventType: prismaEventType as any,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        metadata: data.metadata as any,
      },
    });
    return this.toRecord(record);
  }

  async findByLinkId(linkId: string): Promise<TrackEventRecord[]> {
    const records = await this.prisma.trackEvent.findMany({
      where: { linkId },
      orderBy: { timestamp: 'desc' },
    });
    return records.map(r => this.toRecord(r));
  }

  async findRecentByTokenAndIp(linkId: string, ipAddress: string, withinMinutes: number): Promise<TrackEventRecord | null> {
    const since = new Date(Date.now() - withinMinutes * 60 * 1000);
    const record = await this.prisma.trackEvent.findFirst({
      where: {
        linkId,
        ipAddress,
        eventType: 'PAGE_OPENED' as any,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'desc' },
    });
    return record ? this.toRecord(record) : null;
  }

  async countByType(linkId: string, eventType: TrackEventType): Promise<number> {
    return this.prisma.trackEvent.count({
      where: { linkId, eventType: eventType.toUpperCase() as any },
    });
  }

  private toRecord(r: any): TrackEventRecord {
    return {
      id: r.id,
      linkId: r.linkId,
      eventType: r.eventType as TrackEventType,
      timestamp: r.timestamp,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      metadata: (r.metadata as Record<string, any>) || {},
      createdAt: r.createdAt,
    };
  }
}

export class PrismaTrackingDataProvider implements ITrackingDataProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async resolveLinkByToken(token: string) {
    const link = await this.prisma.shareLink.findUnique({ where: { token } });
    if (!link) return null;
    return {
      id: link.id,
      pageId: link.pageId,
      contactId: link.contactId,
      channel: link.channel,
      isActive: link.isActive,
      expiresAt: link.expiresAt,
    };
  }

  async getLinksForProperty(propertyId: string) {
    const pages = await this.prisma.page.findMany({
      where: { propertyId },
      select: { id: true },
    });
    const pageIds = pages.map(p => p.id);
    if (pageIds.length === 0) return [];

    const links = await this.prisma.shareLink.findMany({
      where: { pageId: { in: pageIds } },
      select: { id: true, contactId: true, channel: true, sentAt: true },
    });
    return links;
  }

  async getContactName(contactId: string): Promise<string> {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
      select: { name: true },
    });
    return contact?.name || 'Unknown';
  }

  async getPropertyTitle(propertyId: string): Promise<string> {
    const prop = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { title: true },
    });
    return prop?.title || 'Unknown Property';
  }

  async getUserSharedProperties(userId: string) {
    const properties = await this.prisma.property.findMany({
      where: { ownerId: userId, deletedAt: null },
      select: {
        id: true,
        title: true,
        pages: {
          select: {
            _count: { select: { shareLinks: true } },
          },
        },
      },
    });

    return properties
      .map(p => ({
        propertyId: p.id,
        title: p.title,
        linkCount: p.pages.reduce((sum, page) => sum + page._count.shareLinks, 0),
      }))
      .filter(p => p.linkCount > 0);
  }

  async getPropertyOwnerId(propertyId: string): Promise<string | null> {
    const prop = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });
    return prop?.ownerId || null;
  }

  async getPageOwnerId(pageId: string): Promise<string | null> {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      select: { property: { select: { ownerId: true } } },
    });
    return page?.property?.ownerId || null;
  }

  async getEventsForLinks(linkIds: string[]): Promise<TrackEventRecord[]> {
    if (linkIds.length === 0) return [];
    const records = await this.prisma.trackEvent.findMany({
      where: { linkId: { in: linkIds } },
      orderBy: { timestamp: 'desc' },
    });
    return records.map(r => ({
      id: r.id,
      linkId: r.linkId,
      eventType: r.eventType as TrackEventType,
      timestamp: r.timestamp,
      ipAddress: r.ipAddress,
      userAgent: r.userAgent,
      metadata: (r.metadata as Record<string, any>) || {},
      createdAt: r.createdAt,
    }));
  }
}
