import { FastifyReply, FastifyRequest } from 'fastify';
import { PageService } from './page.service';
import { PageRenderer } from './page.renderer';
import {
  createPageSchema,
  updatePageSchema,
  propertyIdParamSchema,
  pageIdParamSchema,
} from './page.schemas';
import { ok } from '../../common/utils/apiResponse';
import { UnauthorizedError } from '../auth/auth.errors';

export class PageController {
  private readonly renderer = new PageRenderer();

  constructor(private readonly service: PageService) {}

  private requireAuth(request: FastifyRequest) {
    if (!request.user) throw new UnauthorizedError('Authentication required');
    return request.user;
  }

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { propertyId } = propertyIdParamSchema.parse(request.params);
    const input = createPageSchema.parse(request.body);
    const page = await this.service.create(user.sub, propertyId, input);
    reply.status(201).send(ok(page));
  };

  listByProperty = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { propertyId } = propertyIdParamSchema.parse(request.params);
    const pages = await this.service.listByProperty(propertyId, user.sub);
    reply.status(200).send(ok(pages));
  };

  getById = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = pageIdParamSchema.parse(request.params);
    const page = await this.service.getById(id, user.sub);
    reply.status(200).send(ok(page));
  };

  update = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = pageIdParamSchema.parse(request.params);
    const input = updatePageSchema.parse(request.body);
    const page = await this.service.update(id, user.sub, input);
    reply.status(200).send(ok(page));
  };

  remove = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = pageIdParamSchema.parse(request.params);
    await this.service.delete(id, user.sub);
    reply.status(200).send(ok({ message: 'Page deleted' }));
  };

  preview = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = pageIdParamSchema.parse(request.params);
    const renderData = await this.service.getRenderData(id, user.sub, true);
    const html = this.renderer.render(renderData);
    reply.status(200).header('content-type', 'text/html; charset=utf-8').send(html);
  };
}
