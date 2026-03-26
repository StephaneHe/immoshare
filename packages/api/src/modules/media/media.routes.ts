import { FastifyInstance } from 'fastify';
import { MediaController } from './media.controller';
import { authenticate } from '../../common/middleware/authenticate';

export function mediaRoutes(app: FastifyInstance, controller: MediaController): void {
  // Upload a file to a property
  app.post(
    '/properties/:propertyId/media',
    { preHandler: [authenticate] },
    controller.upload,
  );

  // List all media for a property
  app.get(
    '/properties/:propertyId/media',
    { preHandler: [authenticate] },
    controller.list,
  );

  // Update caption on a specific media item
  app.patch(
    '/media/:mediaId/caption',
    { preHandler: [authenticate] },
    controller.updateCaption,
  );

  // Reorder media for a property
  app.put(
    '/properties/:propertyId/media/order',
    { preHandler: [authenticate] },
    controller.reorder,
  );

  // Delete a specific media item (also removes from storage)
  app.delete(
    '/media/:mediaId',
    { preHandler: [authenticate] },
    controller.delete,
  );
}
