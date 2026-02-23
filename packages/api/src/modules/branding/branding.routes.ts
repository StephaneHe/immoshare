import { FastifyInstance } from 'fastify';
import { BrandingController } from './branding.controller';
import { authenticate } from '../../common/middleware/authenticate';

export function brandingRoutes(app: FastifyInstance, controller: BrandingController) {
  // Agent branding
  app.get('/api/v1/branding', { preHandler: authenticate }, controller.getMyBranding);
  app.put('/api/v1/branding', { preHandler: authenticate }, controller.replaceBranding);
  app.patch('/api/v1/branding', { preHandler: authenticate }, controller.updateBranding);
  app.post('/api/v1/branding/logo', { preHandler: authenticate }, controller.uploadLogo);
  app.delete('/api/v1/branding/logo', { preHandler: authenticate }, controller.deleteLogo);
  app.post('/api/v1/branding/photo', { preHandler: authenticate }, controller.uploadPhoto);
  app.delete('/api/v1/branding/photo', { preHandler: authenticate }, controller.deletePhoto);
  app.get('/api/v1/branding/preview', { preHandler: authenticate }, controller.preview);

  // Agency branding
  app.get('/api/v1/agencies/:id/branding', { preHandler: authenticate }, controller.getAgencyBranding);
  app.put('/api/v1/agencies/:id/branding', { preHandler: authenticate }, controller.setAgencyBranding);
}
