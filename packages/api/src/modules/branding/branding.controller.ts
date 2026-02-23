import { FastifyRequest, FastifyReply } from 'fastify';
import { BrandingService } from './branding.service';
import { updateBrandingSchema, uploadUrlSchema, agencyIdParam } from './branding.schemas';
import { ok } from '../../common/utils/apiResponse';

export class BrandingController {
  constructor(private readonly service: BrandingService) {}

  // GET /api/v1/branding — effective branding (user > agency > neutral)
  getMyBranding = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user!.sub;
    const branding = await this.service.getEffectiveBranding(userId);
    return reply.send(ok(branding));
  };

  // PUT /api/v1/branding — create/replace
  replaceBranding = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user!.sub;
    const data = updateBrandingSchema.parse(req.body);
    const branding = await this.service.upsertBranding(userId, data);
    return reply.send(ok(branding));
  };

  // PATCH /api/v1/branding — partial update
  updateBranding = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user!.sub;
    const data = updateBrandingSchema.parse(req.body);
    const branding = await this.service.upsertBranding(userId, data);
    return reply.send(ok(branding));
  };

  // POST /api/v1/branding/logo — set logo URL
  uploadLogo = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user!.sub;
    const { url } = uploadUrlSchema.parse(req.body);
    const branding = await this.service.setLogoUrl(userId, url);
    return reply.send(ok(branding));
  };

  // DELETE /api/v1/branding/logo
  deleteLogo = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user!.sub;
    const branding = await this.service.removeLogoUrl(userId);
    return reply.send(ok(branding));
  };

  // POST /api/v1/branding/photo — set photo URL
  uploadPhoto = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user!.sub;
    const { url } = uploadUrlSchema.parse(req.body);
    const branding = await this.service.setPhotoUrl(userId, url);
    return reply.send(ok(branding));
  };

  // DELETE /api/v1/branding/photo
  deletePhoto = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user!.sub;
    const branding = await this.service.removePhotoUrl(userId);
    return reply.send(ok(branding));
  };

  // GET /api/v1/branding/preview — same as getMyBranding (frontend handles rendering)
  preview = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.user!.sub;
    const branding = await this.service.getEffectiveBranding(userId);
    return reply.send(ok({ branding, previewMode: true }));
  };

  // GET /api/v1/agencies/:id/branding — agency default branding
  getAgencyBranding = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = agencyIdParam.parse(req.params);
    const branding = await this.service.getAgencyBranding(id);
    return reply.send(ok(branding));
  };

  // PUT /api/v1/agencies/:id/branding — set agency default branding
  setAgencyBranding = async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = agencyIdParam.parse(req.params);
    const userId = req.user!.sub;
    const data = updateBrandingSchema.parse(req.body);
    const branding = await this.service.setAgencyBranding(id, userId, data);
    return reply.send(ok(branding));
  };
}
