import { FastifyInstance } from 'fastify';
import { ContactController } from './contact.controller';
import { ShareController } from './share.controller';
import { authenticate } from '../../common/middleware/authenticate';

export function shareRoutes(
  app: FastifyInstance,
  contactController: ContactController,
  shareController: ShareController,
): void {
  const auth = { preHandler: [authenticate] };

  // Contact CRUD
  app.post('/api/v1/contacts', auth, contactController.create);
  app.get('/api/v1/contacts', auth, contactController.list);
  app.get('/api/v1/contacts/:id', auth, contactController.getById);
  app.patch('/api/v1/contacts/:id', auth, contactController.update);
  app.delete('/api/v1/contacts/:id', auth, contactController.remove);

  // Share operations
  app.post('/api/v1/pages/:pageId/share', auth, shareController.share);
  app.get('/api/v1/share-links', auth, shareController.listLinks);
  app.get('/api/v1/share-links/:id', auth, shareController.getLinkById);
  app.patch('/api/v1/share-links/:id/deactivate', auth, shareController.deactivateLink);
  app.get('/api/v1/properties/:id/share-links', auth, shareController.linksByProperty);

  // Public page view (no auth)
  app.get('/api/v1/v/:token', shareController.publicView);
}
