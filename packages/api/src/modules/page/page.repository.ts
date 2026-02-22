import { PrismaClient } from '@prisma/client';
import {
  IPageRepository,
  IPageDataProvider,
  CreatePageInput,
  UpdatePageInput,
  PageRecord,
  PropertyForPage,
  MediaForPage,
  BrandingForPage,
} from './page.types';

function toRecord(p: any): PageRecord {
  return {
    id: p.id,
    propertyId: p.propertyId,
    brandingId: p.brandingId,
    title: p.title,
    selectedElements: p.selectedElements as any,
    layout: p.layout,
    isActive: p.isActive,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export class PrismaPageRepository implements IPageRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(propertyId: string, data: CreatePageInput): Promise<PageRecord> {
    const p = await this.prisma.page.create({
      data: {
        propertyId,
        title: data.title,
        selectedElements: data.selectedElements as any,
        layout: data.layout || 'standard',
        brandingId: data.brandingId,
      },
    });
    return toRecord(p);
  }

  async findById(id: string): Promise<PageRecord | null> {
    const p = await this.prisma.page.findUnique({ where: { id } });
    return p ? toRecord(p) : null;
  }

  async listByProperty(propertyId: string): Promise<PageRecord[]> {
    const pages = await this.prisma.page.findMany({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
    });
    return pages.map(toRecord);
  }

  async update(id: string, data: UpdatePageInput): Promise<PageRecord> {
    const p = await this.prisma.page.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.selectedElements && { selectedElements: data.selectedElements as any }),
        ...(data.layout && { layout: data.layout }),
        ...(data.brandingId !== undefined && { brandingId: data.brandingId }),
      },
    });
    return toRecord(p);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.page.delete({ where: { id } });
  }

  async deactivate(id: string): Promise<void> {
    await this.prisma.page.update({ where: { id }, data: { isActive: false } });
  }
}

// ─── Data provider: fetches property/media/branding data for rendering ───

const typeFromPrisma: Record<string, string> = {
  APARTMENT: 'apartment', HOUSE: 'house', PENTHOUSE: 'penthouse', DUPLEX: 'duplex',
  GARDEN_APARTMENT: 'garden_apartment', STUDIO: 'studio', VILLA: 'villa', COTTAGE: 'cottage',
  LAND: 'land', COMMERCIAL: 'commercial', OFFICE: 'office', OTHER: 'other',
};
const statusFromPrisma: Record<string, string> = {
  DRAFT: 'draft', ACTIVE: 'active', UNDER_OFFER: 'under_offer', SOLD: 'sold', RENTED: 'rented', ARCHIVED: 'archived',
};
const mediaTypeFromPrisma: Record<string, string> = {
  PHOTO: 'photo', FLOOR_PLAN: 'floor_plan', MODEL_3D: 'model_3d', VIDEO: 'video', DOCUMENT: 'document',
};

export class PrismaPageDataProvider implements IPageDataProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async getPropertyForPage(propertyId: string): Promise<PropertyForPage | null> {
    const p = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
    });
    if (!p) return null;
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      propertyType: typeFromPrisma[p.propertyType] || p.propertyType,
      status: statusFromPrisma[p.status] || p.status,
      price: p.price ? Number(p.price) : null,
      currency: p.currency,
      address: p.address,
      city: p.city,
      neighborhood: p.neighborhood,
      areaSqm: p.areaSqm ? Number(p.areaSqm) : null,
      rooms: p.rooms ? Number(p.rooms) : null,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      floor: p.floor,
      totalFloors: p.totalFloors,
      yearBuilt: p.yearBuilt,
      parking: p.parking,
      elevator: p.elevator,
      balcony: p.balcony,
      garden: p.garden,
      aircon: p.aircon,
      furnished: p.furnished,
    };
  }

  async getMediaForPage(propertyId: string, mediaIds?: string[]): Promise<MediaForPage[]> {
    const where: any = { propertyId };
    if (mediaIds && mediaIds.length > 0) {
      where.id = { in: mediaIds };
    }
    const items = await this.prisma.media.findMany({
      where,
      orderBy: { order: 'asc' },
    });
    return items.map(m => ({
      id: m.id,
      type: mediaTypeFromPrisma[m.type] || m.type,
      url: m.url,
      thumbnailUrl: m.thumbnailUrl,
      caption: m.caption,
      order: m.order,
    }));
  }

  async getPropertyOwnerId(propertyId: string): Promise<string | null> {
    const p = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
      select: { ownerId: true },
    });
    return p?.ownerId ?? null;
  }

  async getBrandingForPage(userId: string): Promise<BrandingForPage> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        phone: true,
        email: true,
        locale: true,
        agency: { select: { name: true, logoUrl: true } },
      },
    });

    return {
      agentName: user?.name || 'Agent',
      agencyName: user?.agency?.name || null,
      logoUrl: user?.agency?.logoUrl || null,
      primaryColor: '#C8102E', // Default — will come from M9 Branding later
      phone: user?.phone || null,
      email: user?.email || null,
      locale: user?.locale || 'en',
    };
  }
}
