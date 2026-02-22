import { FastifyReply, FastifyRequest } from 'fastify';
import { PropertyService } from './property.service';
import {
  createPropertySchema,
  updatePropertySchema,
  changeStatusSchema,
  propertyIdParamSchema,
  propertyListQuerySchema,
  agencyIdParamSchema,
} from './property.schemas';
import { ok } from '../../common/utils/apiResponse';
import { UnauthorizedError } from '../auth/auth.errors';

/**
 * Property controller — thin HTTP layer.
 */
export class PropertyController {
  constructor(private readonly service: PropertyService) {}

  private requireAuth(request: FastifyRequest) {
    if (!request.user) throw new UnauthorizedError('Authentication required');
    return request.user;
  }

  // ─── Property CRUD ───

  create = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const input = createPropertySchema.parse(request.body);
    const property = await this.service.create(user.sub, input);
    reply.status(201).send(ok(property));
  };

  getById = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = propertyIdParamSchema.parse(request.params);
    const property = await this.service.getById(id, user.sub);
    reply.status(200).send(ok(property));
  };

  update = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = propertyIdParamSchema.parse(request.params);
    const input = updatePropertySchema.parse(request.body);
    const property = await this.service.update(id, user.sub, input);
    reply.status(200).send(ok(property));
  };

  changeStatus = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = propertyIdParamSchema.parse(request.params);
    const { status } = changeStatusSchema.parse(request.body);
    const property = await this.service.changeStatus(id, user.sub, status);
    reply.status(200).send(ok(property));
  };

  remove = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = propertyIdParamSchema.parse(request.params);
    await this.service.delete(id, user.sub);
    reply.status(200).send(ok({ message: 'Property deleted' }));
  };

  duplicate = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const { id } = propertyIdParamSchema.parse(request.params);
    const property = await this.service.duplicate(id, user.sub);
    reply.status(201).send(ok(property));
  };

  // ─── Listing ───

  list = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = this.requireAuth(request);
    const filters = propertyListQuerySchema.parse(request.query);
    const result = await this.service.list(user.sub, filters);
    reply.status(200).send(ok(result));
  };

  listByAgency = async (request: FastifyRequest, reply: FastifyReply) => {
    this.requireAuth(request);
    const { id } = agencyIdParamSchema.parse(request.params);
    const filters = propertyListQuerySchema.parse(request.query);
    const result = await this.service.listByAgency(id, filters);
    reply.status(200).send(ok(result));
  };
}
