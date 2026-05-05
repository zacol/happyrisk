'use client';

import type { ListResponse, User, UserCreate, UserUpdate } from '@happyrisk/core';

import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
  type UseQueryResult,
} from '@tanstack/react-query';

import { api } from '@/lib/api';

export const USERS_KEY = ['users'] as const;

interface UseUsersParams {
  pageIndex?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

type UseUsersOptions = Omit<UseQueryOptions<ListResponse<User>, Error>, 'queryKey' | 'queryFn'>;

export function useUsers(
  params: UseUsersParams = {},
  options?: UseUsersOptions,
): UseQueryResult<ListResponse<User>, Error> {
  return useQuery<ListResponse<User>, Error>({
    queryKey: [...USERS_KEY, params],
    queryFn: async () => {
      const { data } = await api.get<ListResponse<User>>('/users', {
        params,
      });

      return data;
    },
    ...options,
  });
}

type UseUserOptions = Omit<UseQueryOptions<User, Error>, 'queryKey' | 'queryFn'>;

export function useUser(id: string, options?: UseUserOptions): UseQueryResult<User, Error> {
  return useQuery<User, Error>({
    queryKey: [...USERS_KEY, id],
    queryFn: async () => {
      const { data } = await api.get<User>(`/users/${id}`);

      return data;
    },
    ...options,
  });
}

type UseCreateUserOptions = Omit<UseMutationOptions<User, Error, UserCreate>, 'mutationFn'>;

export function useCreateUser(
  options?: UseCreateUserOptions,
): UseMutationResult<User, Error, UserCreate> {
  const queryClient = useQueryClient();

  return useMutation<User, Error, UserCreate>({
    mutationFn: async (payload) => {
      const { data } = await api.post<User>('/users', payload);

      return data;
    },
    ...options,
    onSuccess: (...args: Parameters<NonNullable<UseCreateUserOptions['onSuccess']>>) => {
      void queryClient.invalidateQueries({ queryKey: USERS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

type UseUpdateUserVariables = { id: string } & UserUpdate;
type UseUpdateUserOptions = Omit<
  UseMutationOptions<User, Error, UseUpdateUserVariables>,
  'mutationFn'
>;

export function useUpdateUser(
  options?: UseUpdateUserOptions,
): UseMutationResult<User, Error, UseUpdateUserVariables> {
  const queryClient = useQueryClient();

  return useMutation<User, Error, UseUpdateUserVariables>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.patch<User>(`/users/${id}`, payload);

      return data;
    },
    ...options,
    onSuccess: (...args: Parameters<NonNullable<UseUpdateUserOptions['onSuccess']>>) => {
      void queryClient.invalidateQueries({ queryKey: USERS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

type UseDeactivateUserOptions = Omit<UseMutationOptions<User, Error, string>, 'mutationFn'>;

export function useDeactivateUser(
  options?: UseDeactivateUserOptions,
): UseMutationResult<User, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<User, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.patch<User>(`/users/${id}/deactivate`);

      return data;
    },
    ...options,
    onSuccess: (...args: Parameters<NonNullable<UseDeactivateUserOptions['onSuccess']>>) => {
      void queryClient.invalidateQueries({ queryKey: USERS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
