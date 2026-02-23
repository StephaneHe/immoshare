import crypto from 'crypto';
import {
  IPartnerInviteRepository,
  IReshareRepository,
  IPartnerDataProvider,
  PartnerInviteRecord,
} from './partner.types';
import {
  PartnerInviteNotFoundError,
  PartnerInviteExpiredError,
  PartnerLimitExceededError,
  AlreadyPartnerError,
  SelfInviteError,
  PartnerInviteRevokedError,
} from './partner.errors';

const MAX_PARTNERS = 50;
const CODE_LENGTH = 8;
const EXPIRY_HOURS = 48;

export class PartnerInviteService {
  constructor(
    private readonly inviteRepo: IPartnerInviteRepository,
    private readonly reshareRepo: IReshareRepository,
    private readonly dataProvider: IPartnerDataProvider,
  ) {}

  async generateCode(inviterId: string): Promise<PartnerInviteRecord> {
    // Check partner limit
    const count = await this.inviteRepo.countActivePartners(inviterId);
    if (count >= MAX_PARTNERS) throw new PartnerLimitExceededError();

    const code = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, CODE_LENGTH);
    const expiresAt = new Date(Date.now() + EXPIRY_HOURS * 3600 * 1000);

    return this.inviteRepo.create({
      inviterId,
      code,
      expiresAt,
      permissions: { canView: true, canReshare: false },
    });
  }

  async acceptCode(code: string, userId: string): Promise<PartnerInviteRecord> {
    const invite = await this.inviteRepo.findByCode(code);
    if (!invite) throw new PartnerInviteNotFoundError();
    if (invite.status === 'REVOKED') throw new PartnerInviteRevokedError();
    if (invite.expiresAt < new Date()) throw new PartnerInviteExpiredError();
    if (invite.inviterId === userId) throw new SelfInviteError();

    // Check if already partnered
    const existing = await this.inviteRepo.findPartnershipByPair(invite.inviterId, userId);
    if (existing && existing.status === 'ACCEPTED') throw new AlreadyPartnerError();

    return this.inviteRepo.accept(invite.id, userId);
  }

  async listInvites(inviterId: string): Promise<PartnerInviteRecord[]> {
    return this.inviteRepo.findByInviter(inviterId);
  }

  async listPartners(inviterId: string): Promise<PartnerInviteRecord[]> {
    return this.inviteRepo.findActivePartners(inviterId);
  }

  async revokeInvite(inviteId: string, userId: string): Promise<PartnerInviteRecord> {
    const invite = await this.inviteRepo.findById(inviteId);
    if (!invite) throw new PartnerInviteNotFoundError();
    if (invite.inviterId !== userId) throw new PartnerInviteNotFoundError();

    const revoked = await this.inviteRepo.revoke(inviteId);

    // Cascade: revoke all reshare requests from this partner
    if (invite.inviteeId) {
      await this.reshareRepo.revokeAllForPartner(invite.inviteeId, invite.inviterId);
      // Deactivate share links created by partner for this agent's properties
      await this.dataProvider.deactivatePartnerShareLinks(invite.inviteeId, [invite.inviterId]);
    }

    return revoked;
  }
}
