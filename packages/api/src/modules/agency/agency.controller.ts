import { FastifyReply, FastifyRequest } from 'fastify';
import { AgencyService } from './agency.service';
import { AgencyInviteService } from './agency-invite.service';
import {
  createAgencySchema,
  updateAgencySchema,
  inviteAgentSchema,
  agencyIdParamSchema,
  agentRemoveParamSchema,
  inviteIdParamSchema,
  inviteTokenParamSchema,
  transferAdminSchema,
} from './agency.schemas';
import { ok } from '../../common/utils/apiResponse';
import { UnauthorizedError } from '../auth/auth.errors';

/**
 * Agency controller — thin HTTP layer.
 * Validates input with Zod, delegates to services, formats response.
 */
export class AgencyController {
  constructor(
    private readonly agencyService: AgencyService,
    private readonly inviteService: AgencyInviteService,
  ) {}

  private requireAuth(request: FastifyRequest) {
    if (!request.user) throw new UnauthorizedError('Authentication required');
    return request.user;
  }

  // ─── Agency CRUD ───

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const input = createAgencySchema.parse(request.body);
    const agency = await this.agencyService.createAgency(user.sub, user.role, input);
    reply.status(201).send(ok(agency));
  };

  getById = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = agencyIdParamSchema.parse(request.params);
    const agency = await this.agencyService.getAgency(id, user.sub);
    reply.status(200).send(ok(agency));
  };

  update = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = agencyIdParamSchema.parse(request.params);
    const input = updateAgencySchema.parse(request.body);
    const agency = await this.agencyService.updateAgency(id, user.sub, input);
    reply.status(200).send(ok(agency));
  };

  remove = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = agencyIdParamSchema.parse(request.params);
    await this.agencyService.deleteAgency(id, user.sub);
    reply.status(200).send(ok({ message: 'Agency deleted' }));
  };

  // ─── Agents management ───

  listAgents = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = agencyIdParamSchema.parse(request.params);
    const agents = await this.agencyService.listAgents(id, user.sub);
    reply.status(200).send(ok(agents));
  };

  removeAgent = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id, userId } = agentRemoveParamSchema.parse(request.params);
    await this.agencyService.removeAgent(id, user.sub, userId);
    reply.status(200).send(ok({ message: 'Agent removed' }));
  };

  leave = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = agencyIdParamSchema.parse(request.params);
    await this.agencyService.leaveAgency(id, user.sub);
    reply.status(200).send(ok({ message: 'Left agency' }));
  };

  transferAdmin = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = agencyIdParamSchema.parse(request.params);
    const { newAdminId } = transferAdminSchema.parse(request.body);
    await this.agencyService.transferAdmin(id, user.sub, newAdminId);
    reply.status(200).send(ok({ message: 'Admin transferred' }));
  };

  // ─── Invitations ───

  createInvite = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = agencyIdParamSchema.parse(request.params);
    const { email } = inviteAgentSchema.parse(request.body);
    const invite = await this.inviteService.createInvite(id, user.sub, email);
    reply.status(201).send(ok(invite));
  };

  listInvites = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = agencyIdParamSchema.parse(request.params);
    const invites = await this.inviteService.listInvites(id, user.sub);
    reply.status(200).send(ok(invites));
  };

  revokeInvite = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id, inviteId } = inviteIdParamSchema.parse(request.params);
    await this.inviteService.revokeInvite(inviteId, user.sub, id);
    reply.status(200).send(ok({ message: 'Invite revoked' }));
  };

  acceptInvite = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { token } = inviteTokenParamSchema.parse(request.params);
    await this.inviteService.acceptInvite(token, user.sub);
    reply.status(200).send(ok({ message: 'Invite accepted' }));
  };

  declineInvite = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { token } = inviteTokenParamSchema.parse(request.params);
    await this.inviteService.declineInvite(token, user.sub);
    reply.status(200).send(ok({ message: 'Invite declined' }));
  };

  myPendingInvites = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const invites = await this.inviteService.listMyPendingInvites(user.email);
    reply.status(200).send(ok(invites));
  };
}
