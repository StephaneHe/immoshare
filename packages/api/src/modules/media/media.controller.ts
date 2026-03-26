import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { MediaService } from './media.service';
import { ok } from '../../common/utils/apiResponse';
import { UnauthorizedError } from '../auth/auth.errors';
import { MediaType } from '../property/property.types';

const ALLOWED_MEDIA_TYPES: MediaType[] = ['photo', 'floor_plan', 'model_3d', 'video', 'document'];

const mediaIdParamSchema = z.object({ mediaId: z.string().uuid() });
const propertyIdParamSchema = z.object({ propertyId: z.string().uuid() });
const uploadQuerySchema = z.object({
  type: z.enum(['photo', 'floor_plan', 'model_3d', 'video', 'document']).default('photo'),
});
const captionBodySchema = z.object({ caption: z.string().max(500) });
const reorderBodySchema = z.object({
  items: z.array(z.object({ id: z.string().uuid(), order: z.number().int().min(0) })).min(1),
});

export class MediaController {
  constructor(private readonly service: MediaService) {}

  private requireAuth(request: FastifyRequest) {
    if (!request.user) throw new UnauthorizedError('Authentication required');
    return request.user;
  }

  // POST /properties/:propertyId/media?type=photo
  upload = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { propertyId } = propertyIdParamSchema.parse(request.params);
    const { type } = uploadQuerySchema.parse(request.query);

    // Read multipart file via @fastify/multipart
    const file = await (request as any).file();
    if (!file) {
      reply.status(400).send({ error: 'No file provided' });
      return;
    }

    const buffer: Buffer = await file.toBuffer();
    const mimeType: string = file.mimetype;
    const originalName: string = file.filename;
    const sizeBytes: number = buffer.length;

    const media = await this.service.upload({
      propertyId,
      ownerId: user.sub,
      type,
      buffer,
      originalName,
      mimeType,
      sizeBytes,
    });

    reply.status(201).send(ok(media));
  };

  // GET /properties/:propertyId/media
  list = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { propertyId } = propertyIdParamSchema.parse(request.params);
    const items = await this.service.listByProperty(propertyId, user.sub);
    reply.status(200).send(ok(items));
  };

  // PATCH /media/:mediaId/caption
  updateCaption = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { mediaId } = mediaIdParamSchema.parse(request.params);
    const { caption } = captionBodySchema.parse(request.body);
    const media = await this.service.updateCaption(mediaId, caption, user.sub);
    reply.status(200).send(ok(media));
  };

  // PUT /properties/:propertyId/media/order
  reorder = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { propertyId } = propertyIdParamSchema.parse(request.params);
    const { items } = reorderBodySchema.parse(request.body);
    await this.service.reorder(propertyId, user.sub, items);
    reply.status(200).send(ok({ message: 'Order updated' }));
  };

  // DELETE /media/:mediaId
  delete = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { mediaId } = mediaIdParamSchema.parse(request.params);
    await this.service.delete(mediaId, user.sub);
    reply.status(200).send(ok({ message: 'Media deleted' }));
  };
}
