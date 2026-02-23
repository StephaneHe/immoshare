import {
  IReshareRepository,
  IPartnerInviteRepository,
  IPartnerDataProvider,
  ReshareRequestRecord,
} from './partner.types';
import {
  ReshareAlreadyRequestedError,
  NotPartnerError,
  ReshareNotFoundError,
  NotPropertyOwnerError,
} from './partner.errors';

export class ReshareService {
  constructor(
    private readonly reshareRepo: IReshareRepository,
    private readonly inviteRepo: IPartnerInviteRepository,
    private readonly dataProvider: IPartnerDataProvider,
  ) {}

  async request(partnerId: string, propertyId: string, message?: string): Promise<ReshareRequestRecord> {
    // Verify partnership exists
    const ownerId = await this.dataProvider.getPropertyOwnerId(propertyId);
    if (!ownerId) throw new NotPropertyOwnerError();

    const partnership = await this.inviteRepo.findPartnershipByPair(ownerId, partnerId);
    if (!partnership || partnership.status !== 'ACCEPTED') throw new NotPartnerError();

    // Check no pending request
    const existing = await this.reshareRepo.findPending(partnerId, propertyId);
    if (existing) throw new ReshareAlreadyRequestedError();

    return this.reshareRepo.create({ partnerId, propertyId, message });
  }

  async approve(requestId: string, userId: string): Promise<ReshareRequestRecord> {
    const req = await this.reshareRepo.findById(requestId);
    if (!req) throw new ReshareNotFoundError();

    const ownerId = await this.dataProvider.getPropertyOwnerId(req.propertyId);
    if (ownerId !== userId) throw new NotPropertyOwnerError();

    return this.reshareRepo.approve(requestId, userId);
  }

  async reject(requestId: string, userId: string): Promise<ReshareRequestRecord> {
    const req = await this.reshareRepo.findById(requestId);
    if (!req) throw new ReshareNotFoundError();

    const ownerId = await this.dataProvider.getPropertyOwnerId(req.propertyId);
    if (ownerId !== userId) throw new NotPropertyOwnerError();

    return this.reshareRepo.reject(requestId, userId);
  }

  async listReceived(ownerId: string): Promise<ReshareRequestRecord[]> {
    return this.reshareRepo.findByPropertyOwner(ownerId);
  }

  async listSent(partnerId: string): Promise<ReshareRequestRecord[]> {
    return this.reshareRepo.findByPartner(partnerId);
  }
}
