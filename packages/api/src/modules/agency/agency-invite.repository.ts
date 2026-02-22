import { PrismaClient } from '@prisma/client';
import {
  IAgencyInviteRepository,
  AgencyInviteRecord,
  AgencyInviteStatus,
} from './agency.types';

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
    return this.toRecord(invite);
  }

  async findInviteByToken(token: string): Promise<AgencyInviteRecord | null> {
    const invite = await this.prisma.agencyInvite.findUnique({ where: { token } });
    return invite ? this.toRecord(invite) : null;
  }

  async findInviteById(id: string): Promise<AgencyInviteRecord | null> {
    const invite = await this.prisma.agencyInvite.findUnique({ where: { id } });
    return invite ? this.toRecord(invite) : null;
  }

  async findPendingInviteByEmail(agencyId: string, email: string): Promise<AgencyInviteRecord | null> {
    const invite = await this.prisma.agencyInvite.findFirst({
      where: { agencyId, email, status: 'PENDING' },
    });
    return invite ? this.toRecord(invite) : null;
  }

  async listInvitesByAgency(agencyId: string): Promise<AgencyInviteRecord[]> {
    const invites = await this.prisma.agencyInvite.findMany({
      where: { agencyId },
      orderBy: { createdAt: 'desc' },
    });
    return invites.map((i) => this.toRecord(i));
  }

  async listPendingInvitesByEmail(email: string): Promise<(AgencyInviteRecord & { agencyName: string })[]> {
    const invites = await this.prisma.agencyInvite.findMany({
      where: { email, status: 'PENDING' },
      include: { agency: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return invites.map((i) => ({
      ...this.toRecord(i),
      agencyName: i.agency.name,
    }));
  }

  async updateInviteStatus(id: string, status: AgencyInviteStatus, resolvedAt?: Date): Promise<void> {
    const statusMap: Record<string, any> = {
      pending: 'PENDING',
      accepted: 'ACCEPTED',
      declined: 'DECLINED',
      expired: 'EXPIRED',
      revoked: 'REVOKED',
    };
    await this.prisma.agencyInvite.update({
      where: { id },
      data: { status: statusMap[status], resolvedAt: resolvedAt || null },
    });
  }

  async revokeAllPendingInvites(agencyId: string): Promise<void> {
    await this.prisma.agencyInvite.updateMany({
      where: { agencyId, status: 'PENDING' },
      data: { status: 'REVOKED', resolvedAt: new Date() },
    });
  }

  private toRecord(invite: any): AgencyInviteRecord {
    return {
      ...invite,
      status: invite.status.toLowerCase(),
    };
  }
}
