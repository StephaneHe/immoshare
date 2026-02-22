import {
  IPageRepository,
  IPageDataProvider,
  CreatePageInput,
  UpdatePageInput,
  PageRecord,
  PropertyForPage,
  MediaForPage,
  BrandingForPage,
} from './page.types';
import {
  PageNotFoundError,
  NotPageOwnerError,
  PropertyNotFoundForPageError,
  InvalidSelectedElementsError,
  PageInactiveError,
} from './page.errors';

export interface RenderData {
  page: PageRecord;
  property: PropertyForPage;
  media: MediaForPage[];
  branding: BrandingForPage;
  isPreview: boolean;
}

export class PageService {
  constructor(
    private readonly repo: IPageRepository,
    private readonly dataProvider: IPageDataProvider,
  ) {}

  async create(userId: string, propertyId: string, input: CreatePageInput): Promise<PageRecord> {
    // Verify property exists and user owns it
    const ownerId = await this.dataProvider.getPropertyOwnerId(propertyId);
    if (!ownerId) throw new PropertyNotFoundForPageError();
    if (ownerId !== userId) throw new NotPageOwnerError();

    // Validate mediaIds reference real media for this property
    await this.validateMediaIds(propertyId, input.selectedElements);

    return this.repo.create(propertyId, input);
  }

  async getById(pageId: string, userId: string): Promise<PageRecord> {
    const page = await this.requirePage(pageId);
    await this.requireOwner(page.propertyId, userId);
    return page;
  }

  async listByProperty(propertyId: string, userId: string): Promise<PageRecord[]> {
    const ownerId = await this.dataProvider.getPropertyOwnerId(propertyId);
    if (!ownerId) throw new PropertyNotFoundForPageError();
    if (ownerId !== userId) throw new NotPageOwnerError();
    return this.repo.listByProperty(propertyId);
  }

  async update(pageId: string, userId: string, input: UpdatePageInput): Promise<PageRecord> {
    const page = await this.requirePage(pageId);
    await this.requireOwner(page.propertyId, userId);

    if (input.selectedElements) {
      await this.validateMediaIds(page.propertyId, input.selectedElements);
    }

    return this.repo.update(pageId, input);
  }

  async delete(pageId: string, userId: string): Promise<void> {
    const page = await this.requirePage(pageId);
    await this.requireOwner(page.propertyId, userId);
    await this.repo.delete(pageId);
  }

  async getRenderData(pageId: string, userId: string, isPreview: boolean): Promise<RenderData> {
    const page = await this.requirePage(pageId);

    if (!isPreview && !page.isActive) throw new PageInactiveError();
    if (isPreview) await this.requireOwner(page.propertyId, userId);

    const property = await this.dataProvider.getPropertyForPage(page.propertyId);
    if (!property) throw new PropertyNotFoundForPageError();

    // Collect all mediaIds from selected elements
    const mediaIds = this.extractMediaIds(page);
    const media = await this.dataProvider.getMediaForPage(page.propertyId, mediaIds);

    // Get branding — fallback to defaults
    const ownerId = await this.dataProvider.getPropertyOwnerId(page.propertyId);
    const branding = await this.dataProvider.getBrandingForPage(ownerId!);

    return { page, property, media, branding, isPreview };
  }

  // ─── Helpers ───

  private async requirePage(id: string): Promise<PageRecord> {
    const page = await this.repo.findById(id);
    if (!page) throw new PageNotFoundError();
    return page;
  }

  private async requireOwner(propertyId: string, userId: string): Promise<void> {
    const ownerId = await this.dataProvider.getPropertyOwnerId(propertyId);
    if (ownerId !== userId) throw new NotPageOwnerError();
  }

  private extractMediaIds(page: PageRecord): string[] | undefined {
    const ids: string[] = [];
    for (const section of page.selectedElements.sections) {
      if (section.enabled && section.mediaIds) {
        ids.push(...section.mediaIds);
      }
    }
    return ids.length > 0 ? ids : undefined;
  }

  private async validateMediaIds(propertyId: string, elements: { sections: Array<{ mediaIds?: string[] }> }): Promise<void> {
    const requestedIds: string[] = [];
    for (const section of elements.sections) {
      if (section.mediaIds) requestedIds.push(...section.mediaIds);
    }
    if (requestedIds.length === 0) return;

    const existingMedia = await this.dataProvider.getMediaForPage(propertyId);
    const existingIds = new Set(existingMedia.map(m => m.id));
    const invalid = requestedIds.filter(id => !existingIds.has(id));

    if (invalid.length > 0) {
      throw new InvalidSelectedElementsError(`Media IDs not found for this property: ${invalid.join(', ')}`);
    }
  }
}
