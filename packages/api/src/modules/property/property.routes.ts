import { FastifyInstance } from 'fastify';
import { PropertyController } from './property.controller';
import { authenticate } from '../../common/middleware/authenticate';

/**
 * Register property routes on a Fastify instance.
 * All routes require authentication.
 */
export function propertyRoutes(app: FastifyInstance, controller: PropertyController): void {
  const auth = { preHandler: [authenticate] };

  // Property CRUD
  app.post('/api/v1/properties', auth, controller.create);
  app.get('/api/v1/properties', auth, controller.list);
  app.get('/api/v1/properties/:id', auth, controller.getById);
  app.put('/api/v1/properties/:id', auth, controller.update);
  app.patch('/api/v1/properties/:id/status', auth, controller.changeStatus);
  app.delete('/api/v1/properties/:id', auth, controller.remove);
  app.post('/api/v1/properties/:id/duplicate', auth, controller.duplicate);

  // Agency view
  app.get('/api/v1/agencies/:id/properties', auth, controller.listByAgency);
}
