import { FastifyReply, FastifyRequest } from 'fastify';
import { ContactService } from './contact.service';
import {
  createContactSchema,
  updateContactSchema,
  contactIdParamSchema,
  contactListQuerySchema,
} from './share.schemas';
import { ok } from '../../common/utils/apiResponse';
import { UnauthorizedError } from '../auth/auth.errors';

export class ContactController {
  constructor(private readonly service: ContactService) {}

  private requireAuth(request: FastifyRequest) {
    if (!request.user) throw new UnauthorizedError('Authentication required');
    return request.user;
  }

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const input = createContactSchema.parse(request.body);
    const contact = await this.service.create(user.sub, input);
    reply.status(201).send(ok(contact));
  };

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const query = contactListQuerySchema.parse(request.query);
    const filters = {
      search: query.search,
      tags: query.tags ? query.tags.split(',') : undefined,
      page: query.page,
      limit: query.limit,
    };
    const result = await this.service.list(user.sub, filters);
    reply.status(200).send(ok(result));
  };

  getById = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = contactIdParamSchema.parse(request.params);
    const contact = await this.service.getById(id, user.sub);
    reply.status(200).send(ok(contact));
  };

  update = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = contactIdParamSchema.parse(request.params);
    const input = updateContactSchema.parse(request.body);
    const contact = await this.service.update(id, user.sub, input);
    reply.status(200).send(ok(contact));
  };

  remove = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = contactIdParamSchema.parse(request.params);
    await this.service.delete(id, user.sub);
    reply.status(200).send(ok({ message: 'Contact deleted' }));
  };
}
