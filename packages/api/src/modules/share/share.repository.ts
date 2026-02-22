import { PrismaClient } from '@prisma/client';
import {
  IContactRepository,
  IShareLinkRepository,
  IShareBatchRepository,
  IShareDataProvider,
  CreateContactInput,
  UpdateContactInput,
  ContactRecord,
  ContactListFilters,
  ShareLinkRecord,
  ShareLinkListFilters,
  ShareBatchRecord,
  PaginatedResult,
  ShareChannel,
} from './share.types';

// ─── Enum mapping ───

const channelFromPrisma: Record<string, ShareChannel> = {
  WHATSAPP: 'whatsapp', EMAIL: 'email', SMS: 'sms',
};
const channelToPrisma: Record<string, string> = {
  whatsapp: 'WHATSAPP', email: 'EMAIL', sms: 'SMS',
};

// ─── Contact Repository ───

export class PrismaContactRepository implements IContactRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(ownerId: string, data: CreateContactInput): Promise<ContactRecord> {
    const c = await this.prisma.contact.create({
      data: { ownerId, name: data.name, phone: data.phone, email: data.email, tags: data.tags || [], notes: data.notes },
    });
    return c as ContactRecord;
  }

  async findById(id: string): Promise<ContactRecord | null> {
    const c = await this.prisma.contact.findUnique({ where: { id } });
    return c as ContactRecord | null;
  }

  async list(ownerId: string, filters: ContactListFilters): Promise<PaginatedResult<ContactRecord>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { ownerId };
    if (filters.search) {
      where.name = { contains: filters.search, mode: 'insensitive' };
    }
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    const [items, total] = await Promise.all([
      this.prisma.contact.findMany({ where, skip, take: limit, orderBy: { name: 'asc' } }),
      this.prisma.contact.count({ where }),
    ]);

    return {
      items: items as ContactRecord[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, data: UpdateContactInput): Promise<ContactRecord> {
    const c = await this.prisma.contact.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
    return c as ContactRecord;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.contact.delete({ where: { id } });
  }
}

// ─── ShareLink Repository ───

function toLinkRecord(l: any): ShareLinkRecord {
  return {
    id: l.id,
    pageId: l.pageId,
    contactId: l.contactId,
    channel: channelFromPrisma[l.channel] || l.channel,
    token: l.token,
    isActive: l.isActive,
    expiresAt: l.expiresAt,
    sentAt: l.sentAt,
    deliveredAt: l.deliveredAt,
    createdAt: l.createdAt,
  };
}

export class PrismaShareLinkRepository implements IShareLinkRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: {
    pageId: string; contactId: string; channel: ShareChannel; token: string; expiresAt: Date;
  }): Promise<ShareLinkRecord> {
    const l = await this.prisma.shareLink.create({
      data: {
        pageId: data.pageId,
        contactId: data.contactId,
        channel: channelToPrisma[data.channel] as any,
        token: data.token,
        expiresAt: data.expiresAt,
      },
    });
    return toLinkRecord(l);
  }

  async findById(id: string): Promise<ShareLinkRecord | null> {
    const l = await this.prisma.shareLink.findUnique({ where: { id } });
    return l ? toLinkRecord(l) : null;
  }

  async findByToken(token: string): Promise<ShareLinkRecord | null> {
    const l = await this.prisma.shareLink.findUnique({ where: { token } });
    return l ? toLinkRecord(l) : null;
  }

  async list(userId: string, filters: ShareLinkListFilters): Promise<PaginatedResult<ShareLinkRecord>> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      page: { property: { ownerId: userId } },
    };
    if (filters.pageId) where.pageId = filters.pageId;
    if (filters.contactId) where.contactId = filters.contactId;
    if (filters.channel) where.channel = channelToPrisma[filters.channel];
    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.propertyId) {
      where.page = { ...where.page, propertyId: filters.propertyId };
    }

    const [items, total] = await Promise.all([
      this.prisma.shareLink.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.shareLink.count({ where }),
    ]);

    return {
      items: items.map(toLinkRecord),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deactivate(id: string): Promise<void> {
    await this.prisma.shareLink.update({ where: { id }, data: { isActive: false } });
  }

  async deactivateByPageId(pageId: string): Promise<number> {
    const result = await this.prisma.shareLink.updateMany({
      where: { pageId, isActive: true },
      data: { isActive: false },
    });
    return result.count;
  }

  async updateDelivered(id: string, deliveredAt: Date): Promise<void> {
    await this.prisma.shareLink.update({ where: { id }, data: { deliveredAt } });
  }

  async updateSent(id: string, sentAt: Date): Promise<void> {
    await this.prisma.shareLink.update({ where: { id }, data: { sentAt } });
  }
}

// ─── ShareBatch Repository ───

export class PrismaShareBatchRepository implements IShareBatchRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: { userId: string; pageId: string; linkIds: string[]; totalSent: number; totalFailed: number }): Promise<ShareBatchRecord> {
    const b = await this.prisma.shareBatch.create({
      data: {
        userId: data.userId,
        pageId: data.pageId,
        linkIds: data.linkIds,
        totalSent: data.totalSent,
        totalFailed: data.totalFailed,
      },
    });
    return b as ShareBatchRecord;
  }
}

// ─── Data provider ───

export class PrismaShareDataProvider implements IShareDataProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async getPageOwnerId(pageId: string): Promise<string | null> {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      select: { property: { select: { ownerId: true } } },
    });
    return page?.property?.ownerId ?? null;
  }

  async getPagePropertyId(pageId: string): Promise<string | null> {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      select: { propertyId: true },
    });
    return page?.propertyId ?? null;
  }

  async isPageActive(pageId: string): Promise<boolean> {
    const page = await this.prisma.page.findUnique({
      where: { id: pageId },
      select: { isActive: true },
    });
    return page?.isActive ?? false;
  }

  async getPropertyTitle(propertyId: string): Promise<string | null> {
    const p = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
      select: { title: true },
    });
    return p?.title ?? null;
  }

  async getAgentName(userId: string): Promise<string> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    return u?.name || 'Agent';
  }
}
