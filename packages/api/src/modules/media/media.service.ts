import { randomUUID } from 'crypto';
import { IMediaRepository, MediaRecord, MediaType } from '../property/property.types';
import { IStorageService } from '../../common/storage/storage.types';
import {
  MediaNotFoundError,
  MediaNotOwnedError,
  UnsupportedFileTypeError,
  FileTooLargeError,
  MediaLimitReachedError,
  StorageUploadError,
} from './media.errors';

// ─── Config ───

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES: Record<MediaType, string[]> = {
  photo: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  floor_plan: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  model_3d: ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
  document: ['application/pdf', 'application/msword',
             'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

const MAX_COUNT_PER_TYPE: Record<MediaType, number> = {
  photo: 30,
  floor_plan: 5,
  model_3d: 2,
  video: 5,
  document: 10,
};

export interface UploadMediaInput {
  propertyId: string;
  ownerId: string;
  type: MediaType;
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

export interface IPropertyOwnershipChecker {
  isOwner(propertyId: string, userId: string): Promise<boolean>;
}

export class MediaService {
  constructor(
    private readonly mediaRepo: IMediaRepository,
    private readonly storage: IStorageService,
    private readonly ownershipChecker: IPropertyOwnershipChecker,
  ) {}

  async upload(input: UploadMediaInput): Promise<MediaRecord> {
    // Validate ownership
    const isOwner = await this.ownershipChecker.isOwner(input.propertyId, input.ownerId);
    if (!isOwner) throw new MediaNotOwnedError();

    // Validate file type
    const allowed = ALLOWED_MIME_TYPES[input.type] ?? [];
    if (!allowed.includes(input.mimeType)) {
      throw new UnsupportedFileTypeError(input.mimeType);
    }

    // Validate file size
    if (input.sizeBytes > MAX_FILE_SIZE_BYTES) {
      throw new FileTooLargeError(MAX_FILE_SIZE_BYTES / 1024 / 1024);
    }

    // Check count limit
    const count = await this.mediaRepo.countByPropertyAndType(input.propertyId, input.type);
    const max = MAX_COUNT_PER_TYPE[input.type];
    if (count >= max) {
      throw new MediaLimitReachedError(input.type, max);
    }

    // Build storage key: properties/{propertyId}/{type}/{uuid}.ext
    const ext = this.mimeToExt(input.mimeType) || this.extFromName(input.originalName);
    const key = `properties/${input.propertyId}/${input.type}/${randomUUID()}.${ext}`;

    // Upload to storage
    let uploadResult;
    try {
      uploadResult = await this.storage.upload({
        key,
        body: input.buffer,
        contentType: input.mimeType,
        contentLength: input.sizeBytes,
        metadata: {
          propertyId: input.propertyId,
          ownerId: input.ownerId,
          originalName: input.originalName,
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new StorageUploadError(msg);
    }

    // Determine order (append after existing)
    const maxOrder = await this.mediaRepo.getMaxOrder(input.propertyId);

    // Persist in DB
    return this.mediaRepo.create({
      propertyId: input.propertyId,
      type: input.type,
      url: uploadResult.url,
      thumbnailUrl: null, // thumbnails are a future enhancement
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      width: input.width ?? null,
      height: input.height ?? null,
      order: maxOrder + 1,
      caption: null,
    });
  }

  async listByProperty(propertyId: string, userId: string): Promise<MediaRecord[]> {
    const isOwner = await this.ownershipChecker.isOwner(propertyId, userId);
    if (!isOwner) throw new MediaNotOwnedError();
    return this.mediaRepo.listByProperty(propertyId);
  }

  async updateCaption(mediaId: string, caption: string, userId: string): Promise<MediaRecord> {
    const media = await this.mediaRepo.findById(mediaId);
    if (!media) throw new MediaNotFoundError();

    const isOwner = await this.ownershipChecker.isOwner(media.propertyId, userId);
    if (!isOwner) throw new MediaNotOwnedError();

    return this.mediaRepo.updateCaption(mediaId, caption);
  }

  async reorder(propertyId: string, userId: string, items: { id: string; order: number }[]): Promise<void> {
    const isOwner = await this.ownershipChecker.isOwner(propertyId, userId);
    if (!isOwner) throw new MediaNotOwnedError();
    await this.mediaRepo.updateOrder(items);
  }

  async delete(mediaId: string, userId: string): Promise<void> {
    const media = await this.mediaRepo.findById(mediaId);
    if (!media) throw new MediaNotFoundError();

    const isOwner = await this.ownershipChecker.isOwner(media.propertyId, userId);
    if (!isOwner) throw new MediaNotOwnedError();

    // Extract key from URL: everything after the bucket in the path
    const key = this.urlToKey(media.url);

    // Delete from storage (best-effort — don't block DB delete on storage failure)
    try {
      await this.storage.delete({ key });
    } catch (err) {
      console.warn('[MediaService] Storage delete failed, proceeding with DB delete:', err);
    }

    await this.mediaRepo.delete(mediaId);
  }

  // ─── Helpers ───

  private mimeToExt(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
      'image/heic': 'heic', 'video/mp4': 'mp4', 'video/quicktime': 'mov',
      'video/webm': 'webm', 'application/pdf': 'pdf',
    };
    return map[mime] || '';
  }

  private extFromName(name: string): string {
    const parts = name.split('.');
    return parts.length > 1 ? parts[parts.length - 1] : 'bin';
  }

  private urlToKey(url: string): string {
    // URL format: http://host:port/bucket/key
    // Extract everything after /bucket/
    const bucket = process.env.STORAGE_BUCKET || 'immoshare-media';
    const idx = url.indexOf(`/${bucket}/`);
    if (idx === -1) return url;
    return url.slice(idx + bucket.length + 2);
  }
}
