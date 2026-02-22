import {
  IPropertyRepository,
  CreatePropertyInput,
  UpdatePropertyInput,
  PropertyRecord,
  PropertyStatus,
  PropertyListFilters,
  PaginatedResult,
  VALID_STATUS_TRANSITIONS,
} from './property.types';
import {
  PropertyNotFoundError,
  NotPropertyOwnerError,
  InvalidStatusTransitionError,
} from './property.errors';

export class PropertyService {
  constructor(private readonly repo: IPropertyRepository) {}

  async create(userId: string, input: CreatePropertyInput): Promise<PropertyRecord> {
    const agencyId = await this.repo.findUserAgencyId(userId);
    return this.repo.create({ ...input, ownerId: userId, agencyId });
  }

  async getById(propertyId: string, userId: string): Promise<PropertyRecord> {
    const property = await this.requireProperty(propertyId);
    this.requireOwner(property, userId);
    return property;
  }

  async update(propertyId: string, userId: string, input: UpdatePropertyInput): Promise<PropertyRecord> {
    const property = await this.requireProperty(propertyId);
    this.requireOwner(property, userId);
    return this.repo.update(propertyId, input);
  }

  async changeStatus(propertyId: string, userId: string, newStatus: PropertyStatus): Promise<PropertyRecord> {
    const property = await this.requireProperty(propertyId);
    this.requireOwner(property, userId);

    const allowed = VALID_STATUS_TRANSITIONS[property.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new InvalidStatusTransitionError(property.status, newStatus);
    }

    return this.repo.updateStatus(propertyId, newStatus);
  }

  async delete(propertyId: string, userId: string): Promise<void> {
    const property = await this.requireProperty(propertyId);
    this.requireOwner(property, userId);
    await this.repo.softDelete(propertyId);
  }

  async list(userId: string, filters: PropertyListFilters): Promise<PaginatedResult<PropertyRecord>> {
    return this.repo.list(userId, filters);
  }

  async listByAgency(agencyId: string, filters: PropertyListFilters): Promise<PaginatedResult<PropertyRecord>> {
    return this.repo.listByAgency(agencyId, filters);
  }

  async duplicate(propertyId: string, userId: string): Promise<PropertyRecord> {
    const property = await this.requireProperty(propertyId);
    this.requireOwner(property, userId);
    const agencyId = await this.repo.findUserAgencyId(userId);
    return this.repo.duplicate(propertyId, userId, agencyId);
  }

  // ─── Helpers ───

  private async requireProperty(id: string): Promise<PropertyRecord> {
    const property = await this.repo.findById(id);
    if (!property) throw new PropertyNotFoundError();
    return property;
  }

  private requireOwner(property: PropertyRecord, userId: string): void {
    if (property.ownerId !== userId) throw new NotPropertyOwnerError();
  }
}
