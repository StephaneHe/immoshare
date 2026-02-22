import { randomUUID } from 'crypto';
import {
  IAgencyRepository,
  IAgencyInviteRepository,
  AgencyInviteRecord,
} from './agency.types';
import {
  AgencyNotFoundError,
  NotAgencyOwnerError,
  AlreadyMemberError,
  AlreadyInvitedError,
  AlreadyInAgencyError,
  InviteNotFoundError,
  InviteExpiredError,
  InviteAlreadyResolvedError,
} from './agency.errors';

const INVITE_EXPIRY_DAYS = 7;

export class AgencyInviteService {
  constructor(
    private readonly agencyRepo: IAgencyRepository,
    private readonly inviteRepo: IAgencyInviteRepository,
  ) {}

  async createInvite(agencyId: string, adminId: string, email: string): Promise<AgencyInviteRecord> {
    const agency = await this.agencyRepo.findAgencyById(agencyId);
    if (!agency) {
      throw new AgencyNotFoundError();
    }
    if (agency.adminId !== adminId) {
      throw new NotAgencyOwnerError();
    }

    // Check if email already belongs to a member of this agency
    const existingUser = await this.agencyRepo.findUserByEmail(email);
    if (existingUser && existingUser.agencyId === agencyId) {
      throw new AlreadyMemberError();
    }

    // Check for pending invite
    const pendingInvite = await this.inviteRepo.findPendingInviteByEmail(agencyId, email);
    if (pendingInvite) {
      throw new AlreadyInvitedError();
    }

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    return this.inviteRepo.createInvite({
      agencyId,
      email,
      invitedBy: adminId,
      token,
      expiresAt,
    });
  }

  async acceptInvite(token: string, userId: string): Promise<void> {
    const invite = await this.inviteRepo.findInviteByToken(token);
    if (!invite) {
      throw new InviteNotFoundError();
    }

    if (invite.status !== 'pending') {
      throw new InviteAlreadyResolvedError();
    }

    if (invite.expiresAt < new Date()) {
      throw new InviteExpiredError();
    }

    const user = await this.agencyRepo.findUserById(userId);
    if (user && user.agencyId) {
      throw new AlreadyInAgencyError();
    }

    await this.agencyRepo.setUserAgency(userId, invite.agencyId);
    await this.inviteRepo.updateInviteStatus(invite.id, 'accepted', new Date());
  }

  async declineInvite(token: string, userId: string): Promise<void> {
    const invite = await this.inviteRepo.findInviteByToken(token);
    if (!invite) {
      throw new InviteNotFoundError();
    }

    if (invite.status !== 'pending') {
      throw new InviteAlreadyResolvedError();
    }

    await this.inviteRepo.updateInviteStatus(invite.id, 'declined', new Date());
  }

  async revokeInvite(inviteId: string, adminId: string, agencyId: string): Promise<void> {
    const agency = await this.agencyRepo.findAgencyById(agencyId);
    if (!agency) {
      throw new AgencyNotFoundError();
    }
    if (agency.adminId !== adminId) {
      throw new NotAgencyOwnerError();
    }

    const invite = await this.inviteRepo.findInviteById(inviteId);
    if (!invite) {
      throw new InviteNotFoundError();
    }

    await this.inviteRepo.updateInviteStatus(invite.id, 'revoked', new Date());
  }

  async listInvites(agencyId: string, adminId: string): Promise<AgencyInviteRecord[]> {
    const agency = await this.agencyRepo.findAgencyById(agencyId);
    if (!agency) {
      throw new AgencyNotFoundError();
    }
    if (agency.adminId !== adminId) {
      throw new NotAgencyOwnerError();
    }

    return this.inviteRepo.listInvitesByAgency(agencyId);
  }

  async listMyPendingInvites(email: string): Promise<(AgencyInviteRecord & { agencyName: string })[]> {
    return this.inviteRepo.listPendingInvitesByEmail(email);
  }
}
