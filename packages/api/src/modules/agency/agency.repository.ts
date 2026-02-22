import { PrismaClient } from '@prisma/client';
import {
  IAgencyRepository,
  IAgencyInviteRepository,
  CreateAgencyInput,
  UpdateAgencyInput,
  AgencyRecord,
  AgencyMember,
  AgencyInviteRecord,
  AgencyInviteStatus,
} from './agency.types';

// ─── Map Prisma enum to domain string ───

const statusMap: Record<string, AgencyInviteStatus> = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
  REVOKED: 'revoked',
};

const reverseStatusMap: Record<string, string> = {
  pending: 'PENDING',
  accepted: 'ACCEPTED',
  declined: 'DECLINED',
  expired: 'EXPIRED',
  revoked: 'REVOKED',
};

// ─── Agency Repository ───

export class PrismaAgencyRepository implements IAgencyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createAgency(data: CreateAgencyInput & { adminId: string }): Promise<AgencyRecord> {
    const agency = await this.prisma.agency.create({ data });
    return agency as AgencyRecord;
  }

  async findAgencyById(id: string): Promise<AgencyRecord | null> {
    const agency = await this.prisma.agency.findFirst({
      where: { id, deletedAt: null },
    });
    return agency as AgencyRecord | null;
  }

  async findAgencyByAdminId(adminId: string): Promise<AgencyRecord | null> {
    const agency = await this.prisma.agency.findFirst({
      where: { adminId, deletedAt: null },
    });
    return agency as AgencyRecord | null;
  }

  async updateAgency(id: string, data: UpdateAgencyInput): Promise<AgencyRecord> {
    const agency = await this.prisma.agency.update({
      where: { id },
      data,
    });
    return agency as AgencyRecord;
  }

  async softDeleteAgency(id: string): Promise<void> {
    await this.prisma.agency.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async listAgencyMembers(agencyId: string): Promise<AgencyMember[]> {
    const users = await this.prisma.user.findMany({
      where: { agencyId, deletedAt: null },
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
    return users.map((u) => ({
      ...u,
      role: u.role.toLowerCase(),
    }));
  }

  async removeAgentFromAgency(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { agencyId: null },
    });
  }

  async removeAllAgentsFromAgency(agencyId: string): Promise<void> {
    await this.prisma.user.updateMany({
      where: { agencyId },
      data: { agencyId: null },
    });
  }

  async setUserAgency(userId: string, agencyId: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { agencyId },
    });
  }

  async setUserRole(userId: string, role: string): Promise<void> {
    const prismaRole = role.toUpperCase() as any;
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: prismaRole },
    });
  }

  async findUserById(userId: string): Promise<{ id: string; email: string; name: string; role: string; agencyId: string | null } | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, agencyId: true },
    });
    if (!user) return null;
    return { ...user, role: user.role.toLowerCase() };
  }

  async findUserByEmail(email: string): Promise<{ id: string; email: string; name: string; role: string; agencyId: string | null } | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, agencyId: true },
    });
    if (!user) return null;
    return { ...user, role: user.role.toLowerCase() };
  }
}

// ─── Agency Invite Repository ───

export class PrismaAgencyInviteRepository implements IAgencyInviteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createInvite(data: {
    agencyId: string;
    email: string;
    invitedBy: string;
    token: string;
    expiresAt: Date;
  }): Promise<AgencyInviteRecord> {
    const invite = await this.prisma.agencyInvite.create({ data });
    return { ...invite, status: statusMap[invite.status] } as AgencyInviteRecord;
  }

  async findInviteByToken(token: string): Promise<AgencyInviteRecord | null> {
    const invite = await this.prisma.agencyInvite.findUnique({ where: { token } });
    if (!invite) return null;
    return { ...invite, status: statusMap[invite.status] } as AgencyInviteRecord;
  }

  async findInviteById(id: string): Promise<AgencyInviteRecord | null> {
    const invite = await this.prisma.agencyInvite.findUnique({ where: { id } });
    if (!invite) return null;
    return { ...invite, status: statusMap[invite.status] } as AgencyInviteRecord;
  }

  async findPendingInviteByEmail(agencyId: string, email: string): Promise<AgencyInviteRecord | null> {
    const invite = await this.prisma.agencyInvite.findFirst({
      where: { agencyId, email, status: 'PENDING' },
    });
    if (!invite) return null;
    return { ...invite, status: statusMap[invite.status] } as AgencyInviteRecord;
  }

  async listInvitesByAgency(agencyId: string): Promise<AgencyInviteRecord[]> {
    const invites = await this.prisma.agencyInvite.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
    });
    return invites.map((i) => ({ ...i, status: statusMap[i.status] })) as AgencyInviteRecord[];
  }

  async listPendingInvitesByEmail(email: string): Promise<(AgencyInviteRecord & { agencyName: string })[]> {
    const invites = await this.prisma.agencyInvite.findMany({
      where: { email, status: 'PENDING' },
      include: { agency: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return invites.map((i) => ({
      ...i,
      status: statusMap[i.status] as AgencyInviteStatus,
      agencyName: i.agency.name,
    }));
  }

  async updateInviteStatus(id: string, status: AgencyInviteStatus, resolvedAt?: Date): Promise<void> {
    const prismaStatus = reverseStatusMap[status] as any;
    await this.prisma.agencyInvite.update({
      where: { id },
      data: { status: prismaStatus, resolvedAt: resolvedAt ?? null },
    });
  }

  async revokeAllPendingInvites(agencyId: string): Promise<void> {
    await this.prisma.agencyInvite.updateMany({
      where: { agencyId, status: 'PENDING' },
      data: { status: 'REVOKED', resolvedAt: new Date() },
    });
  }
}
