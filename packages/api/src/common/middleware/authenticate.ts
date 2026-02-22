import { FastifyReply, FastifyRequest } from 'fastify';
import * as jwt from 'jsonwebtoken';
import { AuthUser } from '../types/request';
import { UnauthorizedError } from '../../modules/auth/auth.errors';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/**
 * Fastify preHandler hook that verifies the JWT access token
 * from the Authorization header and attaches user to request.
 */
export async function authenticate(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  const token = authHeader.slice(7); // Remove 'Bearer '

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthUser;
    request.user = payload;
  } catch (err) {
    throw new UnauthorizedError('Invalid or expired access token');
  }
}
