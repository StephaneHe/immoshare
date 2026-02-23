import { FastifyInstance } from 'fastify';
import { PartnerController } from './partner.controller';
import { authenticate } from '../../common/middleware/authenticate';

export function partnerRoutes(app: FastifyInstance, controller: PartnerController) {
  // ─── Invitations ───
  app.post('/api/v1/partner-invites', { preHandler: authenticate }, controller.generateCode);
  app.get('/api/v1/partner-invites', { preHandler: authenticate }, controller.listInvites);
  app.delete('/api/v1/partner-invites/:id', { preHandler: authenticate }, controller.revokeInvite);
  app.post('/api/v1/partner-invites/accept', { preHandler: authenticate }, controller.acceptCode);

  // ─── Partners ───
  app.get('/api/v1/partners', { preHandler: authenticate }, controller.listPartners);
  app.delete('/api/v1/partners/:inviteId', { preHandler: authenticate }, controller.revokePartner);

  // ─── Partner catalog ───
  app.get('/api/v1/partners/:inviteId/properties', { preHandler: authenticate }, controller.listPartnerProperties);
  app.get('/api/v1/partners/:inviteId/properties/:id', { preHandler: authenticate }, controller.getPartnerProperty);

  // ─── Reshare ───
  app.post('/api/v1/reshare-requests', { preHandler: authenticate }, controller.requestReshare);
  app.get('/api/v1/reshare-requests', { preHandler: authenticate }, controller.listReceivedReshares);
  app.get('/api/v1/reshare-requests/sent', { preHandler: authenticate }, controller.listSentReshares);
  app.post('/api/v1/reshare-requests/:id/approve', { preHandler: authenticate }, controller.approveReshare);
  app.post('/api/v1/reshare-requests/:id/reject', { preHandler: authenticate }, controller.rejectReshare);
}
