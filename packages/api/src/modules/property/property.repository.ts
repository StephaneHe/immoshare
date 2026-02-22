import { PrismaClient, Prisma } from '@prisma/client';
import {
  IPropertyRepository,
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyRecord,
  PropertyStatus,
  PropertyListFilters,
  PaginatedResult,
} from './property.types';

// ─── Enum mapping helpers ───

const statusToPrisma: Record<string, string> = {
  draft: 'DRAFT', active: 'ACTIVE', under_offer: 'UNDER_OFFER',
  sold: 'SOLD', rented: 'RENTED', archived: 'ARCHIVED',
};

const statusFromPrisma: Record<string, PropertyStatus> = {
  DRAFT: 'draft', ACTIVE: 'active', UNDER_OFFER: 'under_offer',
  SOLD: 'sold', RENTED: 'rented', ARCHIVED: 'archived',
};

const typeToPrisma: Record<string, string> = {
  apartment: 'APARTMENT', house: 'HOUSE', penthouse: 'PENTHOUSE',
  duplex: 'DUPLEX', garden_apartment: 'GARDEN_APARTMENT', studio: 'STUDIO',
  villa: 'VILLA', cottage: 'COTTAGE', land: 'LAND',
  commercial: 'COMMERCIAL', office: 'OFFICE', other: 'OTHER',
};

const typeFromPrisma: Record<string, string> = Object.fromEntries(
  Object.entries(typeToPrisma).map(([k, v]) => [v, k]),
);

function toRecord(p: any): PropertyRecord {
  return {
    ...p,
    propertyType: typeFromPrisma[p.propertyType] || p.propertyType,
    status: statusFromPrisma[p.status] || p.status,
    price: p.price ? Number(p.price) : null,
    areaSqm: p.areaSqm ? Number(p.areaSqm) : null,
    rooms: p.rooms ? Number(p.rooms) : null,
  };
}

export class PrismaPropertyRepository implements IPropertyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreatePropertyInput & { ownerId: string; agencyId: string | null }): Promise<PropertyRecord> {
    const p = await this.prisma.property.create({
      data: {
        ownerId: data.ownerId,
        agencyId: data.agencyId,
        title: data.title,
        description: data.description,
        propertyType: typeToPrisma[data.propertyType] as any,
        price: data.price,
        currency: data.currency,
        address: data.address,
        city: data.city,
        neighborhood: data.neighborhood,
        areaSqm: data.areaSqm,
        rooms: data.rooms,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        floor: data.floor,
        totalFloors: data.totalFloors,
        yearBuilt: data.yearBuilt,
        parking: data.parking,
        elevator: data.elevator,
        balcony: data.balcony,
        garden: data.garden,
        aircon: data.aircon,
        furnished: data.furnished,
        metadata: data.metadata as any,
      },
    });
    return toRecord(p);
  }

  async findById(id: string): Promise<PropertyRecord | null> {
    const p = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
    });
    return p ? toRecord(p) : null;
  }

  async update(id: string, data: UpdatePropertyInput): Promise<PropertyRecord> {
    const prismaData: any = { ...data };
    if (data.propertyType) prismaData.propertyType = typeToPrisma[data.propertyType] as any;
    delete prismaData.propertyType;
    if (data.propertyType) prismaData.propertyType = typeToPrisma[data.propertyType] as any;

    const p = await this.prisma.property.update({ where: { id }, data: prismaData });
    return toRecord(p);
  }

  async updateStatus(id: string, status: PropertyStatus): Promise<PropertyRecord> {
    const p = await this.prisma.property.update({
      where: { id },
      data: { status: statusToPrisma[status] as any },
    });
    return toRecord(p);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.property.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async list(ownerId: string, filters: PropertyListFilters): Promise<PaginatedResult<PropertyRecord>> {
    const where = this.buildWhere({ ...filters, ownerId });
    return this.paginate(where, filters);
  }

  async listByAgency(agencyId: string, filters: PropertyListFilters): Promise<PaginatedResult<PropertyRecord>> {
    const where = this.buildWhere({ ...filters, agencyId });
    return this.paginate(where, filters);
  }

  async duplicate(id: string, newOwnerId: string, newAgencyId: string | null): Promise<PropertyRecord> {
    const original = await this.prisma.property.findUniqueOrThrow({ where: { id } });

    const p = await this.prisma.property.create({
      data: {
        ownerId: newOwnerId,
        agencyId: newAgencyId,
        title: `${original.title} (copy)`,
        description: original.description,
        propertyType: original.propertyType,
        status: 'DRAFT' as any,
        price: original.price,
        currency: original.currency,
        address: original.address,
        city: original.city,
        neighborhood: original.neighborhood,
        areaSqm: original.areaSqm,
        rooms: original.rooms,
        bedrooms: original.bedrooms,
        bathrooms: original.bathrooms,
        floor: original.floor,
        totalFloors: original.totalFloors,
        yearBuilt: original.yearBuilt,
        parking: original.parking,
        elevator: original.elevator,
        balcony: original.balcony,
        garden: original.garden,
        aircon: original.aircon,
        furnished: original.furnished,
        metadata: original.metadata as any,
      },
    });
    return toRecord(p);
  }

  async findUserAgencyId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { agencyId: true },
    });
    return user?.agencyId ?? null;
  }

  // ─── Helpers ───

  private buildWhere(filters: PropertyListFilters & { ownerId?: string; agencyId?: string }): Prisma.PropertyWhereInput {
    const where: Prisma.PropertyWhereInput = { deletedAt: null };

    if (filters.ownerId) where.ownerId = filters.ownerId;
    if (filters.agencyId) where.agencyId = filters.agencyId;
    if (filters.status) where.status = statusToPrisma[filters.status] as any;
    if (filters.propertyType) where.propertyType = typeToPrisma[filters.propertyType] as any;
    if (filters.city) where.city = { contains: filters.city, mode: 'insensitive' };

    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) (where.price as any).gte = filters.minPrice;
      if (filters.maxPrice) (where.price as any).lte = filters.maxPrice;
    }

    if (filters.minArea || filters.maxArea) {
      where.areaSqm = {};
      if (filters.minArea) (where.areaSqm as any).gte = filters.minArea;
      if (filters.maxArea) (where.areaSqm as any).lte = filters.maxArea;
    }

    if (filters.minRooms || filters.maxRooms) {
      where.rooms = {};
      if (filters.minRooms) (where.rooms as any).gte = filters.minRooms;
      if (filters.maxRooms) (where.rooms as any).lte = filters.maxRooms;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async paginate(where: Prisma.PropertyWhereInput, filters: PropertyListFilters): Promise<PaginatedResult<PropertyRecord>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      items: items.map(toRecord),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
