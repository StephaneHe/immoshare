import {
  ITrackEventRepository,
  ITrackingDataProvider,
  TrackEventRecord,
  CreateTrackEventInput,
  HeartbeatInput,
} from './tracking.types';
import {
  TrackLinkNotFoundError,
  TrackLinkExpiredError,
  TrackLinkDeactivatedError,
  TrackRateLimitedError,
} from './tracking.errors';

const DEDUP_WINDOW_MINUTES = 5;
const RATE_LIMIT_PER_MINUTE = 60;

export interface INotifier {
  notify(userId: string, type: string, title: string, body: string, data?: Record<string, unknown>): Promise<unknown>;
}

export class TrackingService {
  // Simple in-memory rate limiter: token → timestamps[]
  private rateLimits: Map<string, number[]> = new Map();
  private notifier: INotifier | null = null;

  constructor(
    private readonly repo: ITrackEventRepository,
    private readonly dataProvider: ITrackingDataProvider,
  ) {}

  setNotifier(notifier: INotifier): void {
    this.notifier = notifier;
  }

  async recordEvent(input: CreateTrackEventInput, ipAddress: string | null, userAgent: string | null): Promise<TrackEventRecord | null> {
    // Resolve and validate link
    const link = await this.dataProvider.resolveLinkByToken(input.token);
    if (!link) throw new TrackLinkNotFoundError();
    if (!link.isActive) throw new TrackLinkDeactivatedError();
    if (link.expiresAt < new Date()) throw new TrackLinkExpiredError();

    // Rate limit check
    this.checkRateLimit(input.token);

    // Anonymize IP (mask last octet)
    const anonIp = this.anonymizeIp(ipAddress);

    // Dedup page_opened within 5 minutes for same IP + token
    if (input.eventType === 'page_opened' && anonIp) {
      const recent = await this.repo.findRecentByTokenAndIp(link.id, anonIp, DEDUP_WINDOW_MINUTES);
      if (recent) return null; // duplicate, silently skip
    }

    // Determine firstVisit for page_opened
    let metadata = input.metadata || {};
    if (input.eventType === 'page_opened') {
      const previousCount = await this.repo.countByType(link.id, 'page_opened');
      metadata = { ...metadata, firstVisit: previousCount === 0 };
    }

    const event = await this.repo.create({
      linkId: link.id,
      eventType: input.eventType,
      ipAddress: anonIp,
      userAgent: userAgent || null,
      metadata,
    });

    // Notify property owner when their link is opened
    if (this.notifier && input.eventType === 'page_opened' && event) {
      this.notifyLinkOpened(link, metadata).catch(() => {});
    }

    return event;
  }

  private async notifyLinkOpened(
    link: { id: string; pageId: string; contactId: string },
    metadata: Record<string, unknown>,
  ): Promise<void> {
    if (!this.notifier) return;
    const ownerId = await this.dataProvider.getPageOwnerId(link.pageId);
    if (!ownerId) return;
    const contactName = await this.dataProvider.getContactName(link.contactId);
    const isFirst = metadata.firstVisit === true;
    await this.notifier.notify(
      ownerId,
      'link_opened',
      isFirst ? 'New page view' : 'Page viewed again',
      `${contactName || 'Someone'} opened your shared page`,
      { linkId: link.id, pageId: link.pageId, contactId: link.contactId, firstVisit: isFirst },
    );
  }

  async recordHeartbeat(input: HeartbeatInput, ipAddress: string | null, userAgent: string | null): Promise<TrackEventRecord | null> {
    const link = await this.dataProvider.resolveLinkByToken(input.token);
    if (!link) throw new TrackLinkNotFoundError();
    if (!link.isActive) throw new TrackLinkDeactivatedError();
    if (link.expiresAt < new Date()) throw new TrackLinkExpiredError();

    this.checkRateLimit(input.token);

    const anonIp = this.anonymizeIp(ipAddress);

    return this.repo.create({
      linkId: link.id,
      eventType: 'time_spent',
      ipAddress: anonIp,
      userAgent: userAgent || null,
      metadata: {
        durationSeconds: input.durationSinceLastBeat,
        sectionId: input.currentSection || null,
      },
    });
  }

  async getLinkEvents(linkId: string): Promise<TrackEventRecord[]> {
    return this.repo.findByLinkId(linkId);
  }

  // ─── Helpers ───

  private anonymizeIp(ip: string | null): string | null {
    if (!ip) return null;
    // IPv4: mask last octet
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) {
        parts[3] = '0';
        return parts.join('.');
      }
    }
    // IPv6: mask last segment
    if (ip.includes(':')) {
      const parts = ip.split(':');
      parts[parts.length - 1] = '0';
      return parts.join(':');
    }
    return ip;
  }

  private checkRateLimit(token: string): void {
    const now = Date.now();
    const windowMs = 60_000;
    const timestamps = this.rateLimits.get(token) || [];
    const recent = timestamps.filter(t => now - t < windowMs);

    if (recent.length >= RATE_LIMIT_PER_MINUTE) {
      throw new TrackRateLimitedError();
    }

    recent.push(now);
    this.rateLimits.set(token, recent);
  }
}
