// ─── Domain types for Page module ───

export type PageLayout = 'standard' | 'minimal';

export type SectionType =
  | 'info'
  | 'photos'
  | 'plans'
  | 'video'
  | '3d'
  | 'description'
  | 'location'
  | 'features'
  | 'contact';

export interface SectionConfig {
  id: string;
  type: SectionType;
  enabled: boolean;
  mediaIds?: string[];
  fields?: string[];
  customTitle?: string;
}

export interface SelectedElements {
  sections: SectionConfig[];
  order: string[]; // ordered section ids
}

export interface PageRecord {
  id: string;
  propertyId: string;
  brandingId: string | null;
  title: string | null;
  selectedElements: SelectedElements;
  layout: PageLayout;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePageInput {
  title?: string;
  selectedElements: SelectedElements;
  layout?: PageLayout;
  brandingId?: string;
}

export interface UpdatePageInput {
  title?: string;
  selectedElements?: SelectedElements;
  layout?: PageLayout;
  brandingId?: string | null;
}

// ─── Minimal property snapshot for rendering ───

export interface PropertyForPage {
  id: string;
  title: string;
  description: string | null;
  propertyType: string;
  status: string;
  price: number | null;
  currency: string;
  address: string | null;
  city: string | null;
  neighborhood: string | null;
  areaSqm: number | null;
  rooms: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  totalFloors: number | null;
  yearBuilt: number | null;
  parking: number | null;
  elevator: boolean | null;
  balcony: boolean | null;
  garden: boolean | null;
  aircon: boolean | null;
  furnished: boolean | null;
}

export interface MediaForPage {
  id: string;
  type: string;
  url: string;
  thumbnailUrl: string | null;
  caption: string | null;
  order: number;
}

export interface BrandingForPage {
  agentName: string;
  agencyName: string | null;
  logoUrl: string | null;
  primaryColor: string;
  phone: string | null;
  email: string | null;
  locale: string; // 'he' | 'en' | 'fr'
}

// ─── Repository interfaces ───

export interface IPageRepository {
  create(propertyId: string, data: CreatePageInput): Promise<PageRecord>;
  findById(id: string): Promise<PageRecord | null>;
  listByProperty(propertyId: string): Promise<PageRecord[]>;
  update(id: string, data: UpdatePageInput): Promise<PageRecord>;
  delete(id: string): Promise<void>;
  deactivate(id: string): Promise<void>;
}

export interface IPageDataProvider {
  getPropertyForPage(propertyId: string): Promise<PropertyForPage | null>;
  getMediaForPage(propertyId: string, mediaIds?: string[]): Promise<MediaForPage[]>;
  getPropertyOwnerId(propertyId: string): Promise<string | null>;
  getBrandingForPage(userId: string): Promise<BrandingForPage>;
}
