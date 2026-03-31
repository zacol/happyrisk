import type { UserRole } from './enums';

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}
