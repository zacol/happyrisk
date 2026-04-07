import type { JwtPayload } from '@happyrisk/core';

import { api } from './api';

export async function fetchCurrentUser(): Promise<JwtPayload> {
  const { data } = await api.get<JwtPayload>('/auth/me');

  return data;
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout');
}

export function getGoogleLoginUrl(): string {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  return `${apiBaseUrl}/auth/google`;
}
