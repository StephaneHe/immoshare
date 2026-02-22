import { FastifyReply, FastifyRequest } from 'fastify';
import { ShareService } from './share.service';
import { PageService } from '../page/page.service';
import { PageRenderer } from '../page/page.renderer';
import {
  shareRequestSchema,
  pageIdParamSchema,
  shareLinkIdParamSchema,
  shareLinkListQuerySchema,
  tokenParamSchema,
  propertyIdParamSchema,
} from './share.schemas';
import { ok } from '../../common/utils/apiResponse';
import { UnauthorizedError } from '../auth/auth.errors';

export class ShareController {
  private readonly renderer = new PageRenderer();

  constructor(
    private readonly shareService: ShareService,
    private readonly pageService: PageService,
  ) {}

  private requireAuth(request: FastifyRequest) {
    if (!request.user) throw new UnauthorizedError('Authentication required');
    return request.user;
  }

  // POST /api/v1/pages/:pageId/share
  share = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { pageId } = pageIdParamSchema.parse(request.params);
    const input = shareRequestSchema.parse(request.body);
    const result = await this.shareService.share(user.sub, pageId, input);
    reply.status(200).send(ok(result));
  };

  // GET /api/v1/share-links
  listLinks = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const query = shareLinkListQuerySchema.parse(request.query);
    const result = await this.shareService.list(user.sub, query);
    reply.status(200).send(ok(result));
  };

  // GET /api/v1/share-links/:id
  getLinkById = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = shareLinkIdParamSchema.parse(request.params);
    const link = await this.shareService.getById(id, user.sub);
    reply.status(200).send(ok(link));
  };

  // PATCH /api/v1/share-links/:id/deactivate
  deactivateLink = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = shareLinkIdParamSchema.parse(request.params);
    await this.shareService.deactivate(id, user.sub);
    reply.status(200).send(ok({ message: 'Share link deactivated' }));
  };

  // GET /api/v1/properties/:id/share-links
  linksByProperty = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = propertyIdParamSchema.parse(request.params);
    const result = await this.shareService.list(user.sub, { propertyId: id });
    reply.status(200).send(ok(result));
  };

  // GET /api/v1/v/:token — Public page view
  publicView = async (request: FastifyRequest, reply: FastifyReply) => {
    const { token } = tokenParamSchema.parse(request.params);
    const { pageId } = await this.shareService.resolveToken(token);

    // Use a system-level call — no user auth needed for public view
    // getRenderData with isPreview=false doesn't check ownership when page is active
    // We need a special method or pass the owner. Let's use a workaround:
    // get page owner from data provider, then call getRenderData as that user
    const renderData = await this.pageService.getRenderData(pageId, '__public__', false);
    const html = this.renderer.render(renderData);
    reply.status(200).header('content-type', 'text/html; charset=utf-8').send(html);
  };
}
