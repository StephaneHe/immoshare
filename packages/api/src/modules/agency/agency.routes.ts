import { FastifyInstance } from 'fastify';
import { AgencyController } from './agency.controller';
import { authenticate } from '../../common/middleware/authenticate';

/**
 * Register agency routes on a Fastify instance.
 * All routes require authentication.
 */
export function agencyRoutes(app: FastifyInstance, controller: AgencyController): void {
  const auth = { preHandler: [authenticate] };

  // Agency CRUD
  app.post('/api/v1/agencies', auth, controller.create);
  app.get('/api/v1/agencies/:id', auth, controller.getById);
  app.patch('/api/v1/agencies/:id', auth, controller.update);
  app.delete('/api/v1/agencies/:id', auth, controller.remove);

  // Agents management
  app.get('/api/v1/agencies/:id/agents', auth, controller.listAgents);
  app.delete('/api/v1/agencies/:id/agents/:userId', auth, controller.removeAgent);
  app.post('/api/v1/agencies/:id/agents/leave', auth, controller.leave);
  app.post('/api/v1/agencies/:id/transfer-admin', auth, controller.transferAdmin);

  // Invitations (admin side)
  app.post('/api/v1/agencies/:id/invites', auth, controller.createInvite);
  app.get('/api/v1/agencies/:id/invites', auth, controller.listInvites);
  app.delete('/api/v1/agencies/:id/invites/:inviteId', auth, controller.revokeInvite);

  // Invitations (agent side)
  app.post('/api/v1/agency-invites/:token/accept', auth, controller.acceptInvite);
  app.post('/api/v1/agency-invites/:token/decline', auth, controller.declineInvite);
  app.get('/api/v1/users/me/agency-invites', auth, controller.myPendingInvites);
}
