import Fastify from 'fastify';
import prisma from './common/prisma';
import { AuthService } from './modules/auth/auth.service';
import { AuthController } from './modules/auth/auth.controller';
import { authRoutes } from './modules/auth/auth.routes';
import { errorHandler } from './common/middleware/errorHandler';
import { PrismaAuthRepository } from './modules/auth/auth.repository';
import './common/types/request'; // augment FastifyRequest

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // Global error handler
  app.setErrorHandler(errorHandler);

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Wire auth module
  const authRepo = new PrismaAuthRepository(prisma);
  const authService = new AuthService(authRepo);
  const authController = new AuthController(authService);
  authRoutes(app, authController);

  // Graceful shutdown
  const shutdown = async () => {
    app.log.info('Shutting down...');
    await app.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Start
  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Server listening on http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
