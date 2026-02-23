import {
  IPartnerInviteRepository,
  IPartnerDataProvider,
} from './partner.types';
import {
  PartnerInviteNotFoundError,
  NotPartnerError,
  PartnerInviteRevokedError,
} from './partner.errors';

export class PartnerCatalogService {
  constructor(
    private readonly inviteRepo: IPartnerInviteRepository,
    private readonly dataProvider: IPartnerDataProvider,
  ) {}

  async listProperties(inviteId: string, userId: string) {
    const invite = await this.inviteRepo.findById(inviteId);
    if (!invite) throw new PartnerInviteNotFoundError();
    if (invite.inviteeId !== userId) throw new NotPartnerError();
    if (invite.status !== 'ACCEPTED') throw new PartnerInviteRevokedError();

    return this.dataProvider.getActivePropertiesByOwner(invite.inviterId);
  }

  async getPropertyDetail(inviteId: string, propertyId: string, userId: string) {
    const invite = await this.inviteRepo.findById(inviteId);
    if (!invite) throw new PartnerInviteNotFoundError();
    if (invite.inviteeId !== userId) throw new NotPartnerError();
    if (invite.status !== 'ACCEPTED') throw new PartnerInviteRevokedError();

    const property = await this.dataProvider.getPropertyDetail(propertyId);
    if (!property) return null;

    // Only show if owned by inviter and status active
    if (property.ownerId !== invite.inviterId || property.status !== 'active') return null;

    return property;
  }
}
