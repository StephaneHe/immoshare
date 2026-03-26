import { FastifyInstance } from 'fastify';
import FormData from 'form-data';
import { buildMediaTestApp } from '../../helpers/testApp';
import { generateTestToken } from '../../helpers/auth';
import { UserRole } from '@immo-share/shared/constants/enums';
import { MediaService } from '../../../src/modules/media/media.service';
import { MediaRecord } from '../../../src/modules/property/property.types';
import {
  MediaNotFoundError,
  MediaNotOwnedError,
  UnsupportedFileTypeError,
  FileTooLargeError,
  MediaLimitReachedError,
} from '../../../src/modules/media/media.errors';

// ─── Constants ───

const OWNER_ID    = 'aaaa0001-0000-0000-0000-000000000001';
const OTHER_ID    = 'aaaa0002-0000-0000-0000-000000000002';
const PROPERTY_ID = 'bbbb0001-0000-0000-0000-000000000001';
const MEDIA_ID    = 'cccc0001-0000-0000-0000-000000000001';
const MEDIA_ID_2  = 'cccc0002-0000-0000-0000-000000000002';

function makeMediaRecord(overrides: Partial<MediaRecord> = {}): MediaRecord {
  return {
    id: MEDIA_ID,
    propertyId: PROPERTY_ID,
    type: 'photo',
    url: 'http://localhost:9000/immoshare-media/properties/test/photo/uuid.jpg',
    thumbnailUrl: null,
    mimeType: 'image/jpeg',
    sizeBytes: 1024,
    width: null,
    height: null,
    order: 0,
    caption: null,
    createdAt: new Date(),
    ...overrides,
  };
}

// ─── Mock factory ───

function mockMediaService(overrides: Partial<MediaService> = {}): MediaService {
  return {
    upload: jest.fn().mockResolvedValue(makeMediaRecord()),
    listByProperty: jest.fn().mockResolvedValue([makeMediaRecord()]),
    updateCaption: jest.fn().mockImplementation(async (_id: string, caption: string) =>
      makeMediaRecord({ caption }),
    ),
    reorder: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as MediaService;
}

// ─── Helpers ───

function ownerToken() {
  return generateTestToken({ sub: OWNER_ID, role: UserRole.AGENT });
}
function otherToken() {
  return generateTestToken({ sub: OTHER_ID, role: UserRole.AGENT });
}

function buildMultipart(filename: string, content: Buffer, mime: string): FormData {
  const form = new FormData();
  form.append('file', content, { filename, contentType: mime });
  return form;
}

// ─── Tests ───

describe('Media routes integration', () => {
  let app: FastifyInstance;
  let service: MediaService;

  beforeEach(async () => {
    service = mockMediaService();
    app = await buildMediaTestApp(service);
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  // ─────────────────────────────────────────────────────────────────
  // POST /properties/:propertyId/media
  // ─────────────────────────────────────────────────────────────────

  describe('POST /properties/:propertyId/media', () => {
    it('returns 401 when not authenticated', async () => {
      const form = buildMultipart('photo.jpg', Buffer.from('fake'), 'image/jpeg');
      const res = await app.inject({
        method: 'POST',
        url: `/properties/${PROPERTY_ID}/media`,
        headers: form.getHeaders(),
        payload: form.getBuffer(),
      });
      expect(res.statusCode).toBe(401);
    });

    it('uploads a photo and returns 201 with media record', async () => {
      const form = buildMultipart('photo.jpg', Buffer.from('fake-image'), 'image/jpeg');
      const res = await app.inject({
        method: 'POST',
        url: `/properties/${PROPERTY_ID}/media?type=photo`,
        headers: { ...form.getHeaders(), authorization: `Bearer ${ownerToken()}` },
        payload: form.getBuffer(),
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.data).toMatchObject({ id: MEDIA_ID, type: 'photo', propertyId: PROPERTY_ID });
      expect(service.upload).toHaveBeenCalledWith(
        expect.objectContaining({ propertyId: PROPERTY_ID, ownerId: OWNER_ID, type: 'photo' }),
      );
    });

    it('defaults to type=photo when query param is omitted', async () => {
      const form = buildMultipart('img.jpg', Buffer.from('x'), 'image/jpeg');
      const res = await app.inject({
        method: 'POST',
        url: `/properties/${PROPERTY_ID}/media`,
        headers: { ...form.getHeaders(), authorization: `Bearer ${ownerToken()}` },
        payload: form.getBuffer(),
      });
      expect(res.statusCode).toBe(201);
      expect(service.upload).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'photo' }),
      );
    });

    it('returns 400 when no file is attached', async () => {
      const form = new FormData();
      form.append('dummy', 'value');
      const res = await app.inject({
        method: 'POST',
        url: `/properties/${PROPERTY_ID}/media`,
        headers: { ...form.getHeaders(), authorization: `Bearer ${ownerToken()}` },
        payload: form.getBuffer(),
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when file type is not supported', async () => {
      (service.upload as jest.Mock).mockRejectedValue(new UnsupportedFileTypeError('image/bmp'));
      const form = buildMultipart('photo.bmp', Buffer.from('x'), 'image/bmp');
      const res = await app.inject({
        method: 'POST',
        url: `/properties/${PROPERTY_ID}/media?type=photo`,
        headers: { ...form.getHeaders(), authorization: `Bearer ${ownerToken()}` },
        payload: form.getBuffer(),
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 413 when file is too large', async () => {
      (service.upload as jest.Mock).mockRejectedValue(new FileTooLargeError(20 * 1024 * 1024));
      const form = buildMultipart('big.jpg', Buffer.from('x'), 'image/jpeg');
      const res = await app.inject({
        method: 'POST',
        url: `/properties/${PROPERTY_ID}/media?type=photo`,
        headers: { ...form.getHeaders(), authorization: `Bearer ${ownerToken()}` },
        payload: form.getBuffer(),
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 422 when media limit is reached', async () => {
      (service.upload as jest.Mock).mockRejectedValue(new MediaLimitReachedError("photo", 20));
      const form = buildMultipart('photo.jpg', Buffer.from('x'), 'image/jpeg');
      const res = await app.inject({
        method: 'POST',
        url: `/properties/${PROPERTY_ID}/media?type=photo`,
        headers: { ...form.getHeaders(), authorization: `Bearer ${ownerToken()}` },
        payload: form.getBuffer(),
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 403 when uploader does not own the property', async () => {
      (service.upload as jest.Mock).mockRejectedValue(new MediaNotOwnedError());
      const form = buildMultipart('photo.jpg', Buffer.from('x'), 'image/jpeg');
      const res = await app.inject({
        method: 'POST',
        url: `/properties/${PROPERTY_ID}/media?type=photo`,
        headers: { ...form.getHeaders(), authorization: `Bearer ${otherToken()}` },
        payload: form.getBuffer(),
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // GET /properties/:propertyId/media
  // ─────────────────────────────────────────────────────────────────

  describe('GET /properties/:propertyId/media', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await app.inject({ method: 'GET', url: `/properties/${PROPERTY_ID}/media` });
      expect(res.statusCode).toBe(401);
    });

    it('returns 200 with list of media for authenticated owner', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/properties/${PROPERTY_ID}/media`,
        headers: { authorization: `Bearer ${ownerToken()}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.data[0]).toMatchObject({ id: MEDIA_ID, propertyId: PROPERTY_ID });
      expect(service.listByProperty).toHaveBeenCalledWith(PROPERTY_ID, OWNER_ID);
    });

    it('returns 403 when user does not own the property', async () => {
      (service.listByProperty as jest.Mock).mockRejectedValue(new MediaNotOwnedError());
      const res = await app.inject({
        method: 'GET',
        url: `/properties/${PROPERTY_ID}/media`,
        headers: { authorization: `Bearer ${otherToken()}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // PATCH /media/:mediaId/caption
  // ─────────────────────────────────────────────────────────────────

  describe('PATCH /media/:mediaId/caption', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/media/${MEDIA_ID}/caption`,
        payload: { caption: 'A nice view' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('updates caption and returns 200', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/media/${MEDIA_ID}/caption`,
        headers: { authorization: `Bearer ${ownerToken()}` },
        payload: { caption: 'A nice view' },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toMatchObject({ caption: 'A nice view' });
      expect(service.updateCaption).toHaveBeenCalledWith(MEDIA_ID, 'A nice view', OWNER_ID);
    });

    it('returns 400 when caption is too long', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/media/${MEDIA_ID}/caption`,
        headers: { authorization: `Bearer ${ownerToken()}` },
        payload: { caption: 'x'.repeat(501) },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 404 when media does not exist', async () => {
      (service.updateCaption as jest.Mock).mockRejectedValue(new MediaNotFoundError());
      const res = await app.inject({
        method: 'PATCH',
        url: `/media/${MEDIA_ID}/caption`,
        headers: { authorization: `Bearer ${ownerToken()}` },
        payload: { caption: 'Test' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 403 when user does not own the media', async () => {
      (service.updateCaption as jest.Mock).mockRejectedValue(new MediaNotOwnedError());
      const res = await app.inject({
        method: 'PATCH',
        url: `/media/${MEDIA_ID}/caption`,
        headers: { authorization: `Bearer ${otherToken()}` },
        payload: { caption: 'Test' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // PUT /properties/:propertyId/media/order
  // ─────────────────────────────────────────────────────────────────

  describe('PUT /properties/:propertyId/media/order', () => {
    const orderPayload = {
      items: [
        { id: MEDIA_ID, order: 0 },
        { id: MEDIA_ID_2, order: 1 },
      ],
    };

    it('returns 401 when not authenticated', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/properties/${PROPERTY_ID}/media/order`,
        payload: orderPayload,
      });
      expect(res.statusCode).toBe(401);
    });

    it('reorders media and returns 200', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/properties/${PROPERTY_ID}/media/order`,
        headers: { authorization: `Bearer ${ownerToken()}` },
        payload: orderPayload,
      });
      expect(res.statusCode).toBe(200);
      expect(service.reorder).toHaveBeenCalledWith(PROPERTY_ID, OWNER_ID, orderPayload.items);
    });

    it('returns 400 when items array is empty', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: `/properties/${PROPERTY_ID}/media/order`,
        headers: { authorization: `Bearer ${ownerToken()}` },
        payload: { items: [] },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 403 when user does not own the property', async () => {
      (service.reorder as jest.Mock).mockRejectedValue(new MediaNotOwnedError());
      const res = await app.inject({
        method: 'PUT',
        url: `/properties/${PROPERTY_ID}/media/order`,
        headers: { authorization: `Bearer ${otherToken()}` },
        payload: orderPayload,
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // DELETE /media/:mediaId
  // ─────────────────────────────────────────────────────────────────

  describe('DELETE /media/:mediaId', () => {
    it('returns 401 when not authenticated', async () => {
      const res = await app.inject({ method: 'DELETE', url: `/media/${MEDIA_ID}` });
      expect(res.statusCode).toBe(401);
    });

    it('deletes media and returns 200', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: `/media/${MEDIA_ID}`,
        headers: { authorization: `Bearer ${ownerToken()}` },
      });
      expect(res.statusCode).toBe(200);
      expect(service.delete).toHaveBeenCalledWith(MEDIA_ID, OWNER_ID);
    });

    it('returns 404 when media does not exist', async () => {
      (service.delete as jest.Mock).mockRejectedValue(new MediaNotFoundError());
      const res = await app.inject({
        method: 'DELETE',
        url: `/media/${MEDIA_ID}`,
        headers: { authorization: `Bearer ${ownerToken()}` },
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 403 when user does not own the media', async () => {
      (service.delete as jest.Mock).mockRejectedValue(new MediaNotOwnedError());
      const res = await app.inject({
        method: 'DELETE',
        url: `/media/${MEDIA_ID}`,
        headers: { authorization: `Bearer ${otherToken()}` },
      });
      expect(res.statusCode).toBe(403);
    });
  });
});
