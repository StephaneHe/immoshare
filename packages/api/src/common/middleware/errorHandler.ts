import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../../modules/auth/auth.errors';
import { fail } from '../utils/apiResponse';

/**
 * Global Fastify error handler.
 * Maps known error types to appropriate HTTP responses.
 */
export function errorHandler(
  error: FastifyError | Error,
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  // AppError — our domain errors
  if (error instanceof AppError) {
    reply.status(error.statusCode).send(fail(error.code, error.message, error.details));
    return;
  }

  // Zod validation error
  if (error instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const path = issue.path.join('.');
      if (!details[path]) details[path] = [];
      details[path].push(issue.message);
    }
    reply.status(400).send(fail('VALIDATION_ERROR', 'Invalid request', details));
    return;
  }

  // Fastify built-in validation errors (e.g., JSON parse errors)
  if ('statusCode' in error && typeof error.statusCode === 'number' && error.statusCode < 500) {
    reply.status(error.statusCode).send(fail('BAD_REQUEST', error.message));
    return;
  }

  // Unexpected error — log and return 500
  console.error('Unhandled error:', error);
  reply.status(500).send(fail('INTERNAL_ERROR', 'Internal server error'));
}
