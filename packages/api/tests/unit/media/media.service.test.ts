import { MediaService, UploadMediaInput, IPropertyOwnershipChecker } from '../../../src/modules/media/media.service';
import { IMediaRepository, MediaRecord, MediaType } from '../../../src/modules/property/property.types';
import { IStorageService, UploadResult } from '../../../src/common/storage/storage.types';
import {
  MediaNotFoundError,
  MediaNotOwnedError,
  UnsupportedFileTypeError,
  FileTooLargeError,
  MediaLimitReachedError,
  StorageUploadError,
} from '../../../src/modules/media/media.errors';

// ─── Constants ───

const PROPERTY_ID = 'aaaa0000-0000-0000-0000-000000000001';
const OWNER_ID    = 'bbbb0000-0000-0000-0000-000000000001';
const OTHER_ID    = 'cccc0000-0000-0000-0000-000000000001';
const MEDIA_ID    = 'dddd0000-0000-0000-0000-000000000001';

const samplePhoto = Buffer.from('fake-image-data');

function makeMediaRecord(overrides: Partial<MediaRecord> = {}): MediaRecord {
  return {
    id: MEDIA_ID, propertyId: PROPERTY_ID,
    type: 'photo', url: 'http://localhost:9000/immoshare-media/properties/test/photo/uuid.jpg',
    thumbnailUrl: null, mimeType: 'image/jpeg', sizeBytes: 1024,
    width: null, height: null, order: 0, caption: null,
    createdAt: new Date(),
    ...overrides,
  };
}

// ─── Mocks ───

function mockMediaRepo(overrides: Partial<IMediaRepository> = {}): IMediaRepository {
  return {
    create: jest.fn().mockResolvedValue(makeMediaRecord()),
    findById: jest.fn().mockResolvedValue(null),
    listByProperty: jest.fn().mockResolvedValue([]),
    updateCaption: jest.fn().mockImplementation(async (id, caption) => makeMediaRecord({ caption })),
    updateOrder: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    countByPropertyAndType: jest.fn().mockResolvedValue(0),
    totalSizeByProperty: jest.fn().mockResolvedValue(0),
    getMaxOrder: jest.fn().mockResolvedValue(-1),
    ...overrides,
  };
}

function mockStorage(overrides: Partial<IStorageService> = {}): IStorageService {
  return {
    upload: jest.fn().mockResolvedValue({
      key: 'properties/test/photo/uuid.jpg',
      url: 'http://localhost:9000/immoshare-media/properties/test/photo/uuid.jpg',
      sizeBytes: 1024,
    } as UploadResult),
    delete: jest.fn().mockResolvedValue(undefined),
    getPublicUrl: jest.fn().mockImplementation((key: string) => `http://localhost:9000/immoshare-media/${key}`),
    ...overrides,
  };
}

function mockOwnership(isOwner = true): IPropertyOwnershipChecker {
  return { isOwner: jest.fn().mockResolvedValue(isOwner) };
}

function createService(
  repoOverrides: Partial<IMediaRepository> = {},
  storageOverrides: Partial<IStorageService> = {},
  isOwner = true,
) {
  return {
    service: new MediaService(
      mockMediaRepo(repoOverrides),
      mockStorage(storageOverrides),
      mockOwnership(isOwner),
    ),
    repo: mockMediaRepo(repoOverrides),
    storage: mockStorage(storageOverrides),
  };
}

function makeUploadInput(overrides: Partial<UploadMediaInput> = {}): UploadMediaInput {
  return {
    propertyId: PROPERTY_ID,
    ownerId: OWNER_ID,
    type: 'photo',
    buffer: samplePhoto,
    originalName: 'house.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: samplePhoto.length,
    ...overrides,
  };
}

// ─── Tests ───

describe('MediaService.upload', () => {
  it('should upload a valid photo and persist in DB', async () => {
    const repo = mockMediaRepo();
    const storage = mockStorage();
    const service = new MediaService(repo, storage, mockOwnership(true));

    const result = await service.upload(makeUploadInput());

    expect(storage.upload).toHaveBeenCalledWith(
      expect.objectContaining({
        body: samplePhoto,
        contentType: 'image/jpeg',
      }),
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        propertyId: PROPERTY_ID,
        type: 'photo',
        mimeType: 'image/jpeg',
      }),
    );
    expect(result.propertyId).toBe(PROPERTY_ID);
  });

  it('should throw MediaNotOwnedError if user does not own property', async () => {
    const service = new MediaService(mockMediaRepo(), mockStorage(), mockOwnership(false));
    await expect(service.upload(makeUploadInput())).rejects.toThrow(MediaNotOwnedError);
  });

  it('should throw UnsupportedFileTypeError for invalid MIME type', async () => {
    const service = new MediaService(mockMediaRepo(), mockStorage(), mockOwnership(true));
    await expect(
      service.upload(makeUploadInput({ type: 'photo', mimeType: 'application/exe' })),
    ).rejects.toThrow(UnsupportedFileTypeError);
  });

  it('should throw FileTooLargeError if file exceeds 10MB', async () => {
    const bigBuffer = Buffer.alloc(11 * 1024 * 1024);
    const service = new MediaService(mockMediaRepo(), mockStorage(), mockOwnership(true));
    await expect(
      service.upload(makeUploadInput({ buffer: bigBuffer, sizeBytes: bigBuffer.length })),
    ).rejects.toThrow(FileTooLargeError);
  });

  it('should throw MediaLimitReachedError when count >= max (30 photos)', async () => {
    const repo = mockMediaRepo({ countByPropertyAndType: jest.fn().mockResolvedValue(30) });
    const service = new MediaService(repo, mockStorage(), mockOwnership(true));
    await expect(service.upload(makeUploadInput())).rejects.toThrow(MediaLimitReachedError);
  });

  it('should throw StorageUploadError if storage.upload throws', async () => {
    const storage = mockStorage({ upload: jest.fn().mockRejectedValue(new Error('S3 down')) });
    const service = new MediaService(mockMediaRepo(), storage, mockOwnership(true));
    await expect(service.upload(makeUploadInput())).rejects.toThrow(StorageUploadError);
  });

  it('should set order to maxOrder + 1', async () => {
    const repo = mockMediaRepo({ getMaxOrder: jest.fn().mockResolvedValue(4) });
    const service = new MediaService(repo, mockStorage(), mockOwnership(true));
    await service.upload(makeUploadInput());
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ order: 5 }),
    );
  });
});

describe('MediaService.listByProperty', () => {
  it('should return media list for owner', async () => {
    const records = [makeMediaRecord(), makeMediaRecord({ id: 'media-2', order: 1 })];
    const repo = mockMediaRepo({ listByProperty: jest.fn().mockResolvedValue(records) });
    const service = new MediaService(repo, mockStorage(), mockOwnership(true));

    const result = await service.listByProperty(PROPERTY_ID, OWNER_ID);
    expect(result).toHaveLength(2);
  });

  it('should throw MediaNotOwnedError for non-owner', async () => {
    const service = new MediaService(mockMediaRepo(), mockStorage(), mockOwnership(false));
    await expect(service.listByProperty(PROPERTY_ID, OTHER_ID)).rejects.toThrow(MediaNotOwnedError);
  });
});

describe('MediaService.updateCaption', () => {
  it('should update caption for owner', async () => {
    const record = makeMediaRecord();
    const repo = mockMediaRepo({ findById: jest.fn().mockResolvedValue(record) });
    const service = new MediaService(repo, mockStorage(), mockOwnership(true));

    await service.updateCaption(MEDIA_ID, 'Living room', OWNER_ID);
    expect(repo.updateCaption).toHaveBeenCalledWith(MEDIA_ID, 'Living room');
  });

  it('should throw MediaNotFoundError if media does not exist', async () => {
    const service = new MediaService(mockMediaRepo(), mockStorage(), mockOwnership(true));
    await expect(service.updateCaption('bad-id', 'test', OWNER_ID)).rejects.toThrow(MediaNotFoundError);
  });

  it('should throw MediaNotOwnedError for non-owner', async () => {
    const record = makeMediaRecord();
    const repo = mockMediaRepo({ findById: jest.fn().mockResolvedValue(record) });
    const service = new MediaService(repo, mockStorage(), mockOwnership(false));
    await expect(service.updateCaption(MEDIA_ID, 'test', OTHER_ID)).rejects.toThrow(MediaNotOwnedError);
  });
});

describe('MediaService.reorder', () => {
  it('should update order for owner', async () => {
    const repo = mockMediaRepo();
    const service = new MediaService(repo, mockStorage(), mockOwnership(true));
    const items = [{ id: MEDIA_ID, order: 0 }, { id: 'media-2', order: 1 }];

    await service.reorder(PROPERTY_ID, OWNER_ID, items);
    expect(repo.updateOrder).toHaveBeenCalledWith(items);
  });

  it('should throw MediaNotOwnedError for non-owner', async () => {
    const service = new MediaService(mockMediaRepo(), mockStorage(), mockOwnership(false));
    await expect(
      service.reorder(PROPERTY_ID, OTHER_ID, [{ id: MEDIA_ID, order: 0 }]),
    ).rejects.toThrow(MediaNotOwnedError);
  });
});

describe('MediaService.delete', () => {
  it('should delete media from storage and DB', async () => {
    const record = makeMediaRecord();
    const repo = mockMediaRepo({ findById: jest.fn().mockResolvedValue(record) });
    const storage = mockStorage();
    const service = new MediaService(repo, storage, mockOwnership(true));

    await service.delete(MEDIA_ID, OWNER_ID);

    expect(storage.delete).toHaveBeenCalled();
    expect(repo.delete).toHaveBeenCalledWith(MEDIA_ID);
  });

  it('should still delete from DB if storage.delete throws (best-effort)', async () => {
    const record = makeMediaRecord();
    const repo = mockMediaRepo({ findById: jest.fn().mockResolvedValue(record) });
    const storage = mockStorage({ delete: jest.fn().mockRejectedValue(new Error('Storage unavailable')) });
    const service = new MediaService(repo, storage, mockOwnership(true));

    await service.delete(MEDIA_ID, OWNER_ID); // should not throw
    expect(repo.delete).toHaveBeenCalledWith(MEDIA_ID);
  });

  it('should throw MediaNotFoundError for unknown id', async () => {
    const service = new MediaService(mockMediaRepo(), mockStorage(), mockOwnership(true));
    await expect(service.delete('bad-id', OWNER_ID)).rejects.toThrow(MediaNotFoundError);
  });

  it('should throw MediaNotOwnedError for non-owner', async () => {
    const record = makeMediaRecord();
    const repo = mockMediaRepo({ findById: jest.fn().mockResolvedValue(record) });
    const service = new MediaService(repo, mockStorage(), mockOwnership(false));
    await expect(service.delete(MEDIA_ID, OTHER_ID)).rejects.toThrow(MediaNotOwnedError);
  });
});
