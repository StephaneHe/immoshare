// ─── Domain types for Property module ───

export type PropertyType =
  | 'apartment'
  | 'house'
  | 'penthouse'
  | 'duplex'
  | 'garden_apartment'
  | 'studio'
  | 'villa'
  | 'cottage'
  | 'land'
  | 'commercial'
  | 'office'
  | 'other';

export type PropertyStatus = 'draft' | 'active' | 'under_offer' | 'sold' | 'rented' | 'archived';

export type MediaType = 'photo' | 'floor_plan' | 'model_3d' | 'video' | 'document';

export interface PropertyRecord {
  id: string;
  ownerId: string;
  agencyId: string | null;
  title: string;
  description: string | null;
  propertyType: PropertyType;
  status: PropertyStatus;
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
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface MediaRecord {
  id: string;
  propertyId: string;
  type: MediaType;
  url: string;
  thumbnailUrl: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  order: number;
  caption: string | null;
  createdAt: Date;
}

export interface CreatePropertyInput {
  title: string;
  description?: string;
  propertyType: PropertyType;
  price?: number;
  currency?: string;
  address?: string;
  city?: string;
  neighborhood?: string;
  areaSqm?: number;
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;
  floor?: number;
  totalFloors?: number;
  yearBuilt?: number;
  parking?: number;
  elevator?: boolean;
  balcony?: boolean;
  garden?: boolean;
  aircon?: boolean;
  furnished?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdatePropertyInput extends Partial<CreatePropertyInput> {}

export interface PropertyListFilters {
  status?: PropertyStatus;
  propertyType?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  minArea?: number;
  maxArea?: number;
  minRooms?: number;
  maxRooms?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Status transition map ───

export const VALID_STATUS_TRANSITIONS: Record<PropertyStatus, PropertyStatus[]> = {
  draft: ['active', 'archived'],
  active: ['under_offer', 'sold', 'rented', 'archived'],
  under_offer: ['active', 'sold', 'rented', 'archived'],
  sold: ['archived'],
  rented: ['active', 'archived'],
  archived: ['draft'],
};

// ─── Repository interfaces ───

export interface IPropertyRepository {
  create(data: CreatePropertyInput & { ownerId: string; agencyId: string | null }): Promise<PropertyRecord>;
  findById(id: string): Promise<PropertyRecord | null>;
  update(id: string, data: UpdatePropertyInput): Promise<PropertyRecord>;
  updateStatus(id: string, status: PropertyStatus): Promise<PropertyRecord>;
  softDelete(id: string): Promise<void>;
  list(ownerId: string, filters: PropertyListFilters): Promise<PaginatedResult<PropertyRecord>>;
  listByAgency(agencyId: string, filters: PropertyListFilters): Promise<PaginatedResult<PropertyRecord>>;
  duplicate(id: string, newOwnerId: string, newAgencyId: string | null): Promise<PropertyRecord>;
  findUserAgencyId(userId: string): Promise<string | null>;
}

export interface IMediaRepository {
  create(data: Omit<MediaRecord, 'id' | 'createdAt'>): Promise<MediaRecord>;
  findById(id: string): Promise<MediaRecord | null>;
  listByProperty(propertyId: string): Promise<MediaRecord[]>;
  updateCaption(id: string, caption: string): Promise<MediaRecord>;
  updateOrder(items: { id: string; order: number }[]): Promise<void>;
  delete(id: string): Promise<void>;
  countByPropertyAndType(propertyId: string, type: MediaType): Promise<number>;
  totalSizeByProperty(propertyId: string): Promise<number>;
  getMaxOrder(propertyId: string): Promise<number>;
}
