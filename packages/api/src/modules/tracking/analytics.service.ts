import {
  ITrackingDataProvider,
  PropertyAnalytics,
  Dashboard,
  ChannelStats,
  ContactStats,
  SectionStats,
  TrackEventRecord,
} from './tracking.types';
import {
  PropertyNotFoundForAnalyticsError,
  NotPropertyOwnerForAnalyticsError,
} from './tracking.errors';

export class AnalyticsService {
  constructor(private readonly dataProvider: ITrackingDataProvider) {}

  async getPropertyAnalytics(propertyId: string, userId: string): Promise<PropertyAnalytics> {
    // Ownership check
    const ownerId = await this.dataProvider.getPropertyOwnerId(propertyId);
    if (!ownerId) throw new PropertyNotFoundForAnalyticsError();
    if (ownerId !== userId) throw new NotPropertyOwnerForAnalyticsError();

    // Get all links for property
    const links = await this.dataProvider.getLinksForProperty(propertyId);
    if (links.length === 0) {
      return this.emptyAnalytics(propertyId);
    }

    const linkIds = links.map(l => l.id);
    const events = await this.dataProvider.getEventsForLinks(linkIds);

    // Build lookup: linkId → events
    const eventsByLink = new Map<string, TrackEventRecord[]>();
    for (const e of events) {
      const arr = eventsByLink.get(e.linkId) || [];
      arr.push(e);
      eventsByLink.set(e.linkId, arr);
    }

    // Opened links (have at least one page_opened event)
    const openedLinkIds = new Set<string>();
    for (const [linkId, evts] of eventsByLink) {
      if (evts.some(e => e.eventType === 'page_opened')) {
        openedLinkIds.add(linkId);
      }
    }

    const totalLinks = links.length;
    const totalOpened = openedLinkIds.size;
    const totalNotOpened = totalLinks - totalOpened;
    const openRate = totalLinks > 0 ? Math.round((totalOpened / totalLinks) * 100) : 0;

    // Average time spent
    const timeEvents = events.filter(e => e.eventType === 'time_spent');
    const totalTime = timeEvents.reduce((sum, e) => sum + (e.metadata?.durationSeconds || 0), 0);
    const avgTimeSpentSeconds = openedLinkIds.size > 0 ? Math.round(totalTime / openedLinkIds.size) : 0;

    // By channel
    const byChannel = this.aggregateByChannel(links, openedLinkIds);

    // By contact
    const byContact = await this.aggregateByContact(links, eventsByLink);

    // Top sections
    const topSections = this.aggregateTopSections(events);

    return {
      propertyId,
      totalLinks,
      totalOpened,
      totalNotOpened,
      openRate,
      avgTimeSpentSeconds,
      byChannel,
      byContact,
      topSections,
    };
  }

  async getDashboard(userId: string, from: Date, to: Date): Promise<Dashboard> {
    const properties = await this.dataProvider.getUserSharedProperties(userId);

    let totalLinksSent = 0;
    let totalOpens = 0;
    const allEvents: Array<TrackEventRecord & { propertyTitle: string; contactName: string; channel: string }> = [];
    const propertyOpenCounts: Map<string, number> = new Map();

    for (const prop of properties) {
      totalLinksSent += prop.linkCount;
      const links = await this.dataProvider.getLinksForProperty(prop.propertyId);
      const linkIds = links.map(l => l.id);

      if (linkIds.length === 0) continue;

      const events = await this.dataProvider.getEventsForLinks(linkIds);
      const openEvents = events.filter(e =>
        e.eventType === 'page_opened' &&
        e.timestamp >= from &&
        e.timestamp <= to,
      );

      totalOpens += openEvents.length;
      propertyOpenCounts.set(prop.propertyId, openEvents.length);

      // Build recent activity
      for (const event of events.filter(e => e.timestamp >= from && e.timestamp <= to)) {
        const link = links.find(l => l.id === event.linkId);
        if (!link) continue;
        const contactName = await this.dataProvider.getContactName(link.contactId);
        allEvents.push({
          ...event,
          propertyTitle: prop.title,
          contactName,
          channel: link.channel,
        });
      }
    }

    const overallOpenRate = totalLinksSent > 0 ? Math.round((totalOpens / totalLinksSent) * 100) : 0;

    // Recent activity (last 20, sorted desc)
    const recentActivity = allEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20)
      .map(e => ({
        contactName: e.contactName,
        propertyTitle: e.propertyTitle,
        channel: e.channel,
        eventType: e.eventType,
        timestamp: e.timestamp.toISOString(),
      }));

    // Top properties by open count
    const topProperties = properties
      .map(p => ({
        propertyId: p.propertyId,
        title: p.title,
        openCount: propertyOpenCounts.get(p.propertyId) || 0,
      }))
      .sort((a, b) => b.openCount - a.openCount)
      .slice(0, 10);

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      totalPropertiesShared: properties.length,
      totalLinksSent,
      totalOpens,
      overallOpenRate,
      recentActivity,
      topProperties,
    };
  }

  // ─── Helpers ───

  private emptyAnalytics(propertyId: string): PropertyAnalytics {
    return {
      propertyId,
      totalLinks: 0, totalOpened: 0, totalNotOpened: 0, openRate: 0,
      avgTimeSpentSeconds: 0, byChannel: [], byContact: [], topSections: [],
    };
  }

  private aggregateByChannel(
    links: Array<{ id: string; channel: string; sentAt: Date | null }>,
    openedLinkIds: Set<string>,
  ): ChannelStats[] {
    const channelMap = new Map<string, { sent: number; opened: number }>();
    for (const link of links) {
      const stats = channelMap.get(link.channel) || { sent: 0, opened: 0 };
      stats.sent++;
      if (openedLinkIds.has(link.id)) stats.opened++;
      channelMap.set(link.channel, stats);
    }
    return Array.from(channelMap.entries()).map(([channel, stats]) => ({
      channel,
      sent: stats.sent,
      opened: stats.opened,
      openRate: stats.sent > 0 ? Math.round((stats.opened / stats.sent) * 100) : 0,
    }));
  }

  private async aggregateByContact(
    links: Array<{ id: string; contactId: string; channel: string }>,
    eventsByLink: Map<string, TrackEventRecord[]>,
  ): Promise<ContactStats[]> {
    const contactMap = new Map<string, {
      channels: Set<string>;
      firstOpenedAt: Date | null;
      lastOpenedAt: Date | null;
      totalVisits: number;
      totalTimeSeconds: number;
      sectionsViewed: Set<string>;
    }>();

    for (const link of links) {
      const events = eventsByLink.get(link.id) || [];
      let stats = contactMap.get(link.contactId);
      if (!stats) {
        stats = {
          channels: new Set(), firstOpenedAt: null, lastOpenedAt: null,
          totalVisits: 0, totalTimeSeconds: 0, sectionsViewed: new Set(),
        };
        contactMap.set(link.contactId, stats);
      }
      stats.channels.add(link.channel);

      for (const e of events) {
        if (e.eventType === 'page_opened') {
          stats.totalVisits++;
          if (!stats.firstOpenedAt || e.timestamp < stats.firstOpenedAt) stats.firstOpenedAt = e.timestamp;
          if (!stats.lastOpenedAt || e.timestamp > stats.lastOpenedAt) stats.lastOpenedAt = e.timestamp;
        }
        if (e.eventType === 'time_spent') {
          stats.totalTimeSeconds += e.metadata?.durationSeconds || 0;
        }
        if (e.eventType === 'section_viewed' && e.metadata?.sectionType) {
          stats.sectionsViewed.add(e.metadata.sectionType);
        }
      }
    }

    const results: ContactStats[] = [];
    for (const [contactId, stats] of contactMap) {
      const name = await this.dataProvider.getContactName(contactId);
      results.push({
        contactId,
        contactName: name,
        channels: Array.from(stats.channels),
        firstOpenedAt: stats.firstOpenedAt?.toISOString() || null,
        lastOpenedAt: stats.lastOpenedAt?.toISOString() || null,
        totalVisits: stats.totalVisits,
        totalTimeSeconds: stats.totalTimeSeconds,
        sectionsViewed: Array.from(stats.sectionsViewed),
      });
    }
    return results;
  }

  private aggregateTopSections(events: TrackEventRecord[]): SectionStats[] {
    const sectionMap = new Map<string, { viewCount: number; totalTime: number }>();

    for (const e of events) {
      if (e.eventType === 'section_viewed' && e.metadata?.sectionType) {
        const type = e.metadata.sectionType;
        const stats = sectionMap.get(type) || { viewCount: 0, totalTime: 0 };
        stats.viewCount++;
        sectionMap.set(type, stats);
      }
      if (e.eventType === 'time_spent' && e.metadata?.sectionId) {
        const type = e.metadata.sectionId;
        const stats = sectionMap.get(type) || { viewCount: 0, totalTime: 0 };
        stats.totalTime += e.metadata.durationSeconds || 0;
        sectionMap.set(type, stats);
      }
    }

    return Array.from(sectionMap.entries())
      .map(([sectionType, stats]) => ({
        sectionType,
        viewCount: stats.viewCount,
        avgTimeSeconds: stats.viewCount > 0 ? Math.round(stats.totalTime / stats.viewCount) : 0,
      }))
      .sort((a, b) => b.viewCount - a.viewCount);
  }
}
