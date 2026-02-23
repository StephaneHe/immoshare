import { FastifyRequest, FastifyReply } from 'fastify';
import { PartnerInviteService } from './partner-invite.service';
import { PartnerCatalogService } from './partner-catalog.service';
import { ReshareService } from './reshare.service';
import { acceptCodeSchema, reshareRequestSchema, inviteIdParam, invitePropertyParam } from './partner.schemas';
import { ok } from '../../common/utils/apiResponse';

export class PartnerController {
  constructor(
    private readonly inviteService: PartnerInviteService,
    private readonly catalogService: PartnerCatalogService,
    private readonly reshareService: ReshareService,
  ) {}

  // ─── Invitations ───

  generateCode = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user!.sub;
    const invite = await this.inviteService.generateCode(userId);
    return reply.status(201).send(ok(invite));
  };

  listInvites = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user!.sub;
    const invites = await this.inviteService.listInvites(userId);
    return reply.send(ok({ invites }));
  };

  revokeInvite = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = inviteIdParam.parse(req.params);
    const userId = req.user!.sub;
    await this.inviteService.revokeInvite(id, userId);
    return reply.send(ok({ revoked: true }));
  };

  acceptCode = async (req: FastifyRequest, reply: FastifyReply) => {
    const { code } = acceptCodeSchema.parse(req.body);
    const userId = req.user!.sub;
    const invite = await this.inviteService.acceptCode(code, userId);
    return reply.send(ok(invite));
  };

  listPartners = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user!.sub;
    const partners = await this.inviteService.listPartners(userId);
    return reply.send(ok({ partners }));
  };

  revokePartner = async (req: FastifyRequest, reply: FastifyReply) => {
    const { inviteId } = (req.params as { inviteId: string });
    const userId = req.user!.sub;
    await this.inviteService.revokeInvite(inviteId, userId);
    return reply.send(ok({ revoked: true }));
  };

  // ─── Catalog ───

  listPartnerProperties = async (req: FastifyRequest, reply: FastifyReply) => {
    const { inviteId } = (req.params as { inviteId: string });
    const userId = req.user!.sub;
    const properties = await this.catalogService.listProperties(inviteId, userId);
    return reply.send(ok({ properties }));
  };

  getPartnerProperty = async (req: FastifyRequest, reply: FastifyReply) => {
    const params = invitePropertyParam.parse(req.params);
    const userId = req.user!.sub;
    const property = await this.catalogService.getPropertyDetail(params.inviteId, params.id, userId);
    if (!property) return reply.status(404).send(ok(null));
    return reply.send(ok(property));
  };

  // ─── Reshare ───

  requestReshare = async (req: FastifyRequest, reply: FastifyReply) => {
    const { propertyId, message } = reshareRequestSchema.parse(req.body);
    const userId = req.user!.sub;
    const request = await this.reshareService.request(userId, propertyId, message);
    return reply.status(201).send(ok(request));
  };

  listReceivedReshares = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user!.sub;
    const requests = await this.reshareService.listReceived(userId);
    return reply.send(ok({ requests }));
  };

  listSentReshares = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user!.sub;
    const requests = await this.reshareService.listSent(userId);
    return reply.send(ok({ requests }));
  };

  approveReshare = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = inviteIdParam.parse(req.params);
    const userId = req.user!.sub;
    const result = await this.reshareService.approve(id, userId);
    return reply.send(ok(result));
  };

  rejectReshare = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = inviteIdParam.parse(req.params);
    const userId = req.user!.sub;
    const result = await this.reshareService.reject(id, userId);
    return reply.send(ok(result));
  };
}
