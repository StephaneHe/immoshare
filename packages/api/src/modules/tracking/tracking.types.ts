// ─── Domain types for Tracking module ───

export type TrackEventType = 'page_opened' | 'section_viewed' | 'media_viewed' | 'time_spent' | 'page_closed';

// ─── TrackEvent ───

export interface TrackEventRecord {
  id: string;
  linkId: string;
  eventType: TrackEventType;
  timestamp: Date;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface CreateTrackEventInput {
  token: string;
  eventType: TrackEventType;
  metadata?: Record<string, any>;
}

export interface HeartbeatInput {
  token: string;
  durationSinceLastBeat: number; // seconds
  currentSection?: string;
}

// ─── Analytics ───

export interface ChannelStats {
  channel: string;
  sent: number;
  opened: number;
  openRate: number;
}

export interface ContactStats {
  contactId: string;
  contactName: string;
  channels: string[];
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  totalVisits: number;
  totalTimeSeconds: number;
  sectionsViewed: string[];
}

export interface SectionStats {
  sectionType: string;
  viewCount: number;
  avgTimeSeconds: number;
}

export interface PropertyAnalytics {
  propertyId: string;
  totalLinks: number;
  totalOpened: number;
  totalNotOpened: number;
  openRate: number;
  avgTimeSpentSeconds: number;
  byChannel: ChannelStats[];
  byContact: ContactStats[];
  topSections: SectionStats[];
}

export interface DashboardActivity {
  contactName: string;
  propertyTitle: string;
  channel: string;
  eventType: string;
  timestamp: string;
}

export interface TopProperty {
  propertyId: string;
  title: string;
  openCount: number;
}

export interface Dashboard {
  period: { from: string; to: string };
  totalPropertiesShared: number;
  totalLinksSent: number;
  totalOpens: number;
  overallOpenRate: number;
  recentActivity: DashboardActivity[];
  topProperties: TopProperty[];
}

// ─── Repository interfaces ───

export interface ITrackEventRepository {
  create(data: {
    linkId: string;
    eventType: TrackEventType;
    ipAddress: string | null;
    userAgent: string | null;
    metadata: Record<string, any>;
  }): Promise<TrackEventRecord>;

  findByLinkId(linkId: string): Promise<TrackEventRecord[]>;

  findRecentByTokenAndIp(linkId: string, ipAddress: string, withinMinutes: number): Promise<TrackEventRecord | null>;

  countByType(linkId: string, eventType: TrackEventType): Promise<number>;
}

// ─── Data provider (cross-module reads) ───

export interface ITrackingDataProvider {
  // ShareLink resolution
  resolveLinkByToken(token: string): Promise<{
    id: string;
    pageId: string;
    contactId: string;
    channel: string;
    isActive: boolean;
    expiresAt: Date;
  } | null>;

  // Analytics: get all links for a property (via pages)
  getLinksForProperty(propertyId: string): Promise<Array<{
    id: string;
    contactId: string;
    channel: string;
    sentAt: Date | null;
  }>>;

  // Analytics: get contact name
  getContactName(contactId: string): Promise<string>;

  // Analytics: get property title
  getPropertyTitle(propertyId: string): Promise<string>;

  // Analytics: get all properties with share links for a user
  getUserSharedProperties(userId: string): Promise<Array<{
    propertyId: string;
    title: string;
    linkCount: number;
  }>>;

  // Ownership
  getPropertyOwnerId(propertyId: string): Promise<string | null>;

  // Analytics: events for a set of link IDs
  getEventsForLinks(linkIds: string[]): Promise<TrackEventRecord[]>;
}
