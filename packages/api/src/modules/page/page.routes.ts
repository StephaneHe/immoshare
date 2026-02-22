import { FastifyInstance } from 'fastify';
import { PageController } from './page.controller';
import { authenticate } from '../../common/middleware/authenticate';

/**
 * Register page routes on a Fastify instance.
 */
export function pageRoutes(app: FastifyInstance, controller: PageController): void {
  const auth = { preHandler: [authenticate] };

  // Property pages CRUD
  app.post('/api/v1/properties/:propertyId/pages', auth, controller.create);
  app.get('/api/v1/properties/:propertyId/pages', auth, controller.listByProperty);

  // Individual page operations
  app.get('/api/v1/pages/:id', auth, controller.getById);
  app.patch('/api/v1/pages/:id', auth, controller.update);
  app.delete('/api/v1/pages/:id', auth, controller.remove);

  // Preview (auth required — owner only)
  app.get('/api/v1/pages/:id/preview', auth, controller.preview);
}
