import { randomUUID } from 'crypto';
import {
  IShareLinkRepository,
  IShareBatchRepository,
  IContactRepository,
  IShareDataProvider,
  IChannelAdapter,
  ShareRequest,
  ShareResult,
  ShareLinkRecord,
  ShareLinkListFilters,
  PaginatedResult,
  ShareChannel,
} from './share.types';
import {
  ShareLinkNotFoundError,
  ShareLinkExpiredError,
  ShareLinkDeactivatedError,
  NotShareLinkOwnerError,
  PageNotFoundForShareError,
  NoValidRecipientsError,
} from './share.errors';

const BASE_URL = process.env.PUBLIC_URL || 'https://app.immoshare.com';

export interface INotifier {
  notify(userId: string, type: string, title: string, body: string, data?: Record<string, unknown>): Promise<unknown>;
}

export class ShareService {
  private adapters: Map<ShareChannel, IChannelAdapter> = new Map();
  private notifier: INotifier | null = null;

  constructor(
    private readonly linkRepo: IShareLinkRepository,
    private readonly batchRepo: IShareBatchRepository,
    private readonly contactRepo: IContactRepository,
    private readonly dataProvider: IShareDataProvider,
  ) {}

  setNotifier(notifier: INotifier): void {
    this.notifier = notifier;
  }

  registerAdapter(adapter: IChannelAdapter): void {
    this.adapters.set(adapter.channel, adapter);
  }

  async share(userId: string, pageId: string, request: ShareRequest): Promise<ShareResult> {
    // Verify page exists and user owns it
    const ownerId = await this.dataProvider.getPageOwnerId(pageId);
    if (!ownerId) throw new PageNotFoundForShareError();
    if (ownerId !== userId) throw new NotShareLinkOwnerError();

    const propertyId = await this.dataProvider.getPagePropertyId(pageId);
    const propertyTitle = propertyId ? (await this.dataProvider.getPropertyTitle(propertyId)) || 'Property' : 'Property';
    const agentName = await this.dataProvider.getAgentName(userId);

    const expiresInDays = request.expiresInDays || 30;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const links: ShareLinkRecord[] = [];
    const warnings: string[] = [];
    let totalSent = 0;
    let totalFailed = 0;

    for (const recipient of request.recipients) {
      const contact = await this.contactRepo.findById(recipient.contactId);
      if (!contact) {
        warnings.push(`Contact ${recipient.contactId} not found, skipped`);
        continue;
      }

      for (const channel of recipient.channels) {
        // Validate contact has required field for channel
        const to = this.getContactField(contact, channel);
        if (!to) {
          warnings.push(`Contact ${contact.name}: no ${channel === 'email' ? 'email' : 'phone'} for ${channel}, skipped`);
          continue;
        }

        // Create unique link
        const token = randomUUID();
        const link = await this.linkRepo.create({
          pageId,
          contactId: contact.id,
          channel,
          token,
          expiresAt,
        });

        // Send via adapter
        const adapter = this.adapters.get(channel);
        if (adapter) {
          const url = `${BASE_URL}/v/${token}`;
          const result = await adapter.send({
            to,
            link: url,
            message: request.message,
            propertyTitle,
            agentName,
          });

          if (result.success) {
            await this.linkRepo.updateSent(link.id, new Date());
            totalSent++;
          } else {
            warnings.push(`Failed to send to ${contact.name} via ${channel}: ${result.error}`);
            totalFailed++;
          }
        } else {
          // No adapter registered — mark as sent (placeholder)
          await this.linkRepo.updateSent(link.id, new Date());
          totalSent++;
        }

        links.push(link);
      }
    }

    if (links.length === 0) {
      throw new NoValidRecipientsError();
    }

    // Create batch record
    const batch = await this.batchRepo.create({
      userId,
      pageId,
      linkIds: links.map(l => l.id),
      totalSent,
      totalFailed,
    });

    // Notify agent about the share
    if (this.notifier && totalSent > 0) {
      const contactNames = [...new Set(
        await Promise.all(request.recipients.map(async r => {
          const c = await this.contactRepo.findById(r.contactId);
          return c?.name || 'Unknown';
        }))
      )];
      const channels = [...new Set(request.recipients.flatMap(r => r.channels))];
      await this.notifier.notify(
        userId,
        'share_sent',
        'Property shared',
        `${totalSent} link(s) sent to ${contactNames.join(', ')} via ${channels.join(', ')}`,
        { batchId: batch.id, pageId, totalSent, totalFailed },
      ).catch(() => {}); // don't fail share if notification fails
    }

    return {
      batchId: batch.id,
      totalLinks: links.length,
      totalSent,
      totalFailed,
      warnings,
      links,
    };
  }

  async resolveToken(token: string): Promise<{ link: ShareLinkRecord; pageId: string }> {
    const link = await this.linkRepo.findByToken(token);
    if (!link) throw new ShareLinkNotFoundError();
    if (!link.isActive) throw new ShareLinkDeactivatedError();
    if (link.expiresAt < new Date()) throw new ShareLinkExpiredError();
    return { link, pageId: link.pageId };
  }

  async getById(linkId: string, userId: string): Promise<ShareLinkRecord> {
    const link = await this.linkRepo.findById(linkId);
    if (!link) throw new ShareLinkNotFoundError();
    // Ownership check via page owner
    const ownerId = await this.dataProvider.getPageOwnerId(link.pageId);
    if (ownerId !== userId) throw new NotShareLinkOwnerError();
    return link;
  }

  async list(userId: string, filters: ShareLinkListFilters): Promise<PaginatedResult<ShareLinkRecord>> {
    return this.linkRepo.list(userId, filters);
  }

  async deactivate(linkId: string, userId: string): Promise<void> {
    const link = await this.linkRepo.findById(linkId);
    if (!link) throw new ShareLinkNotFoundError();
    const ownerId = await this.dataProvider.getPageOwnerId(link.pageId);
    if (ownerId !== userId) throw new NotShareLinkOwnerError();
    await this.linkRepo.deactivate(linkId);
  }

  async handleDeliveryWebhook(token: string, delivered: boolean): Promise<void> {
    const link = await this.linkRepo.findByToken(token);
    if (!link) return; // silently ignore unknown tokens
    if (delivered) {
      await this.linkRepo.updateDelivered(link.id, new Date());
    }
  }

  // ─── Helpers ───

  private getContactField(contact: { phone: string | null; email: string | null }, channel: ShareChannel): string | null {
    switch (channel) {
      case 'whatsapp':
      case 'sms':
        return contact.phone;
      case 'email':
        return contact.email;
    }
  }
}
