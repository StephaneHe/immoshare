import { UserRole } from '../constants/enums';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  agencyId: string | null;
  locale: string;
  emailVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponseDto {
  user: UserDto;
  accessToken: string;
  refreshToken: string;
}
