import { PrismaClient } from '@prisma/client';
import {
  IPartnerInviteRepository,
  IReshareRepository,
  IPartnerDataProvider,
  PartnerInviteRecord,
  ReshareRequestRecord,
  CreateReshareInput,
} from './partner.types';

export class PrismaPartnerInviteRepository implements IPartnerInviteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: {
    inviterId: string; code: string; expiresAt: Date;
    permissions: { canView: boolean; canReshare: boolean };
  }): Promise<PartnerInviteRecord> {
    const r = await this.prisma.partnerInvite.create({ data: {
      inviterId: data.inviterId, code: data.code,
      expiresAt: data.expiresAt, permissions: data.permissions as any,
    }});
    return this.toInvite(r);
  }

  async findByCode(code: string) {
    const r = await this.prisma.partnerInvite.findUnique({ where: { code } });
    return r ? this.toInvite(r) : null;
  }

  async findById(id: string) {
    const r = await this.prisma.partnerInvite.findUnique({ where: { id } });
    return r ? this.toInvite(r) : null;
  }

  async findByInviter(inviterId: string) {
    const rs = await this.prisma.partnerInvite.findMany({ where: { inviterId }, orderBy: { createdAt: 'desc' } });
    return rs.map(r => this.toInvite(r));
  }

  async findActivePartners(inviterId: string) {
    const rs = await this.prisma.partnerInvite.findMany({ where: { inviterId, status: 'ACCEPTED' } });
    return rs.map(r => this.toInvite(r));
  }

  async findPartnershipByPair(inviterId: string, inviteeId: string) {
    const r = await this.prisma.partnerInvite.findFirst({
      where: { inviterId, inviteeId, status: 'ACCEPTED' },
    });
    return r ? this.toInvite(r) : null;
  }

  async countActivePartners(userId: string) {
    return this.prisma.partnerInvite.count({ where: { inviterId: userId, status: 'ACCEPTED' } });
  }

  async accept(id: string, inviteeId: string) {
    const r = await this.prisma.partnerInvite.update({
      where: { id }, data: { inviteeId, status: 'ACCEPTED', acceptedAt: new Date() },
    });
    return this.toInvite(r);
  }

  async revoke(id: string) {
    const r = await this.prisma.partnerInvite.update({
      where: { id }, data: { status: 'REVOKED' },
    });
    return this.toInvite(r);
  }

  private toInvite(r: any): PartnerInviteRecord {
    return {
      id: r.id, inviterId: r.inviterId, inviteeId: r.inviteeId,
      code: r.code, status: r.status, permissions: r.permissions as any,
      expiresAt: r.expiresAt, acceptedAt: r.acceptedAt, createdAt: r.createdAt,
    };
  }
}

export class PrismaReshareRepository implements IReshareRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: CreateReshareInput) {
    const r = await this.prisma.reshareRequest.create({ data: {
      partnerId: data.partnerId, propertyId: data.propertyId,
      message: data.message || null,
    }});
    return this.toReshare(r);
  }

  async findById(id: string) {
    const r = await this.prisma.reshareRequest.findUnique({ where: { id } });
    return r ? this.toReshare(r) : null;
  }

  async findPending(partnerId: string, propertyId: string) {
    const r = await this.prisma.reshareRequest.findFirst({
      where: { partnerId, propertyId, status: 'PENDING' },
    });
    return r ? this.toReshare(r) : null;
  }

  async findByPropertyOwner(ownerId: string) {
    const props = await this.prisma.property.findMany({
      where: { ownerId, deletedAt: null }, select: { id: true },
    });
    const propIds = props.map(p => p.id);
    if (propIds.length === 0) return [];
    const rs = await this.prisma.reshareRequest.findMany({
      where: { propertyId: { in: propIds } }, orderBy: { requestedAt: 'desc' },
    });
    return rs.map(r => this.toReshare(r));
  }

  async findByPartner(partnerId: string) {
    const rs = await this.prisma.reshareRequest.findMany({
      where: { partnerId }, orderBy: { requestedAt: 'desc' },
    });
    return rs.map(r => this.toReshare(r));
  }

  async approve(id: string, resolvedBy: string) {
    const r = await this.prisma.reshareRequest.update({
      where: { id }, data: { status: 'APPROVED', resolvedBy, resolvedAt: new Date() },
    });
    return this.toReshare(r);
  }

  async reject(id: string, resolvedBy: string) {
    const r = await this.prisma.reshareRequest.update({
      where: { id }, data: { status: 'REJECTED', resolvedBy, resolvedAt: new Date() },
    });
    return this.toReshare(r);
  }

  async revokeAllForPartner(partnerId: string, _inviterId: string) {
    const result = await this.prisma.reshareRequest.updateMany({
      where: { partnerId, status: { in: ['PENDING', 'APPROVED'] } },
      data: { status: 'REJECTED', resolvedAt: new Date() },
    });
    return result.count;
  }

  private toReshare(r: any): ReshareRequestRecord {
    return {
      id: r.id, partnerId: r.partnerId, propertyId: r.propertyId,
      status: r.status, message: r.message, requestedAt: r.requestedAt,
      resolvedAt: r.resolvedAt, resolvedBy: r.resolvedBy,
    };
  }
}

export class PrismaPartnerDataProvider implements IPartnerDataProvider {
  constructor(private readonly prisma: PrismaClient) {}

  async getActivePropertiesByOwner(ownerId: string) {
    const props = await this.prisma.property.findMany({
      where: { ownerId, status: 'ACTIVE', deletedAt: null },
      include: { media: { orderBy: { order: 'asc' }, take: 5 } },
    });
    return props.map(p => ({
      id: p.id, title: p.title, propertyType: p.propertyType,
      status: p.status, price: p.price ? Number(p.price) : null,
      city: p.city, rooms: p.rooms ? Number(p.rooms) : null,
      areaSqm: p.areaSqm ? Number(p.areaSqm) : null,
      media: p.media.map(m => ({ url: m.url, type: m.type, order: m.order })),
    }));
  }

  async getPropertyDetail(propertyId: string) {
    const p = await this.prisma.property.findUnique({
      where: { id: propertyId },
      include: { media: { orderBy: { order: 'asc' } } },
    });
    if (!p) return null;
    return {
      id: p.id, title: p.title, description: p.description,
      propertyType: p.propertyType, status: p.status,
      price: p.price ? Number(p.price) : null, city: p.city, address: p.address,
      rooms: p.rooms ? Number(p.rooms) : null, bedrooms: p.bedrooms, bathrooms: p.bathrooms,
      areaSqm: p.areaSqm ? Number(p.areaSqm) : null, floor: p.floor, ownerId: p.ownerId,
      media: p.media.map(m => ({ id: m.id, url: m.url, type: m.type, order: m.order, caption: m.caption })),
    };
  }

  async getPropertyOwnerId(propertyId: string) {
    const p = await this.prisma.property.findUnique({ where: { id: propertyId }, select: { ownerId: true } });
    return p?.ownerId || null;
  }

  async getAgencyMemberIds(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { agencyId: true, role: true } });
    if (!user?.agencyId || user.role !== 'AGENCY_ADMIN') return null;
    const members = await this.prisma.user.findMany({
      where: { agencyId: user.agencyId }, select: { id: true },
    });
    return members.map(m => m.id);
  }

  async deactivatePartnerShareLinks(_partnerId: string, _propertyOwnerIds: string[]) {
    // Future: deactivate share links created by partner for given owners' properties
    return 0;
  }
}
