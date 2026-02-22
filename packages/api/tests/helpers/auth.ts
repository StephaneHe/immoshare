import * as jwt from 'jsonwebtoken';
import { UserRole } from '@immo-share/shared/constants/enums';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/**
 * Generate a valid JWT access token for testing.
 */
export function generateTestToken(overrides: {
  sub?: string;
  email?: string;
  role?: UserRole;
} = {}): string {
  return jwt.sign(
    {
      sub: overrides.sub ?? 'uuid-test-1',
      email: overrides.email ?? 'test@example.com',
      role: overrides.role ?? UserRole.AGENT,
    },
    JWT_SECRET,
    { expiresIn: '15m' },
  );
}
