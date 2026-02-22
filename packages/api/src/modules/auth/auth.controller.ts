import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '@immo-share/shared/validators/auth';
import { ok } from '../../common/utils/apiResponse';
import { UnauthorizedError } from './auth.errors';

/**
 * Auth controller — thin HTTP layer.
 * Validates input with Zod, delegates to AuthService, formats response.
 */
export class AuthController {
  constructor(private readonly service: AuthService) {}

  register = async (request: FastifyRequest, reply: FastifyReply) => {
    const input = RegisterDto.parse(request.body);
    const result = await this.service.register(input);
    reply.status(201).send(ok(result));
  };

  login = async (request: FastifyRequest, reply: FastifyReply) => {
    const input = LoginDto.parse(request.body);
    const result = await this.service.login(input);
    reply.status(200).send(ok(result));
  };

  refresh = async (request: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = RefreshDto.parse(request.body);
    const result = await this.service.refresh(refreshToken);
    reply.status(200).send(ok(result));
  };

  logout = async (request: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = RefreshDto.parse(request.body);
    await this.service.logout(refreshToken);
    reply.status(200).send(ok({ message: 'Logged out successfully' }));
  };

  verifyEmail = async (request: FastifyRequest, reply: FastifyReply) => {
    const { token } = VerifyEmailDto.parse(request.body);
    await this.service.verifyEmail(token);
    reply.status(200).send(ok({ message: 'Email verified successfully' }));
  };

  forgotPassword = async (request: FastifyRequest, reply: FastifyReply) => {
    const { email } = ForgotPasswordDto.parse(request.body);
    await this.service.forgotPassword(email);
    // Always return success to prevent email enumeration
    reply.status(200).send(ok({ message: 'If this email exists, a reset link has been sent' }));
  };

  resetPassword = async (request: FastifyRequest, reply: FastifyReply) => {
    const { token, password } = ResetPasswordDto.parse(request.body);
    await this.service.resetPassword(token, password);
    reply.status(200).send(ok({ message: 'Password reset successfully' }));
  };

  changePassword = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const body = request.body as { currentPassword: string; newPassword: string };
    await this.service.changePassword(request.user.sub, body.currentPassword, body.newPassword);
    reply.status(200).send(ok({ message: 'Password changed successfully' }));
  };
}
