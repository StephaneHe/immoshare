// ─── Domain types for Share module (Contacts + ShareLinks) ───

export type ShareChannel = 'whatsapp' | 'email' | 'sms';

// ─── Contact ───

export interface ContactRecord {
  id: string;
  ownerId: string;
  name: string;
  phone: string | null;
  email: string | null;
  tags: string[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactInput {
  name: string;
  phone?: string;
  email?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateContactInput {
  name?: string;
  phone?: string | null;
  email?: string | null;
  tags?: string[];
  notes?: string | null;
}

export interface ContactListFilters {
  search?: string;
  tags?: string[];
  page?: number;
  limit?: number;
}

// ─── ShareLink ───

export interface ShareLinkRecord {
  id: string;
  pageId: string;
  contactId: string;
  channel: ShareChannel;
  token: string;
  isActive: boolean;
  expiresAt: Date;
  sentAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
}

export interface ShareBatchRecord {
  id: string;
  userId: string;
  pageId: string;
  linkIds: string[];
  totalSent: number;
  totalFailed: number;
  createdAt: Date;
}

// ─── Share request ───

export interface ShareRecipient {
  contactId: string;
  channels: ShareChannel[];
}

export interface ShareRequest {
  recipients: ShareRecipient[];
  expiresInDays?: number; // default 30
  message?: string;
}

export interface ShareResult {
  batchId: string;
  totalLinks: number;
  totalSent: number;
  totalFailed: number;
  warnings: string[];
  links: ShareLinkRecord[];
}

export interface ShareLinkListFilters {
  pageId?: string;
  propertyId?: string;
  contactId?: string;
  channel?: ShareChannel;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// ─── Paginated ───

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Repository interfaces ───

export interface IContactRepository {
  create(ownerId: string, data: CreateContactInput): Promise<ContactRecord>;
  findById(id: string): Promise<ContactRecord | null>;
  list(ownerId: string, filters: ContactListFilters): Promise<PaginatedResult<ContactRecord>>;
  update(id: string, data: UpdateContactInput): Promise<ContactRecord>;
  delete(id: string): Promise<void>;
}

export interface IShareLinkRepository {
  create(data: {
    pageId: string;
    contactId: string;
    channel: ShareChannel;
    token: string;
    expiresAt: Date;
  }): Promise<ShareLinkRecord>;
  findById(id: string): Promise<ShareLinkRecord | null>;
  findByToken(token: string): Promise<ShareLinkRecord | null>;
  list(userId: string, filters: ShareLinkListFilters): Promise<PaginatedResult<ShareLinkRecord>>;
  deactivate(id: string): Promise<void>;
  deactivateByPageId(pageId: string): Promise<number>;
  updateDelivered(id: string, deliveredAt: Date): Promise<void>;
  updateSent(id: string, sentAt: Date): Promise<void>;
}

export interface IShareBatchRepository {
  create(data: { userId: string; pageId: string; linkIds: string[]; totalSent: number; totalFailed: number }): Promise<ShareBatchRecord>;
}

// ─── Channel adapter interface ───

export interface IChannelAdapter {
  channel: ShareChannel;
  send(params: {
    to: string; // phone or email
    link: string;
    message?: string;
    propertyTitle: string;
    agentName: string;
  }): Promise<{ success: boolean; error?: string }>;
}

// ─── Data provider (cross-module reads) ───

export interface IShareDataProvider {
  getPageOwnerId(pageId: string): Promise<string | null>;
  getPagePropertyId(pageId: string): Promise<string | null>;
  isPageActive(pageId: string): Promise<boolean>;
  getPropertyTitle(propertyId: string): Promise<string | null>;
  getAgentName(userId: string): Promise<string>;
}
