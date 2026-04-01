'use client';

import type { JwtPayload } from '@happyrisk/core';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { fetchCurrentUser, logout } from '@/lib/auth';

const AUTH_KEY = ['auth', 'me'] as const;

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: user,
    isLoading,
    isError,
  } = useQuery<JwtPayload>({
    queryKey: AUTH_KEY,
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 10 * 60 * 1000,
  });

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      queryClient.clear();
      router.replace('/login');
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !isError,
    logout: handleLogout,
  };
}
