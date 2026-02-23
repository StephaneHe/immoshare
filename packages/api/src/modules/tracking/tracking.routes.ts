import { FastifyInstance } from 'fastify';
import { TrackingController } from './tracking.controller';
import { authenticate } from '../../common/middleware/authenticate';

export function trackingRoutes(app: FastifyInstance, controller: TrackingController) {
  // ─── Collection routes (public, no auth) ───
  app.post('/api/v1/track/event', controller.trackEvent);
  app.post('/api/v1/track/heartbeat', controller.heartbeat);

  // ─── Consultation routes (authenticated) ───
  app.get('/api/v1/share-links/:id/events', { preHandler: authenticate }, controller.getLinkEvents);
  app.get('/api/v1/properties/:id/analytics', { preHandler: authenticate }, controller.getPropertyAnalytics);
  app.get('/api/v1/analytics/dashboard', { preHandler: authenticate }, controller.getDashboard);
}
