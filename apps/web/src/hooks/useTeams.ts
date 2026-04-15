'use client';

import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  type PaginatedResponse,
  type Team,
  type TeamCreate,
  type TeamUpdate,
} from '@happyrisk/core';

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

export const TEAMS_KEY = ['teams'] as const;

interface UseTeamsParams {
  page?: number;
  limit?: number;
}

type UseTeamsOptions = Omit<
  UseQueryOptions<PaginatedResponse<Team>, Error>,
  'queryKey' | 'queryFn'
>;

export function useTeams(
  params: UseTeamsParams = {},
  options?: UseTeamsOptions,
): UseQueryResult<PaginatedResponse<Team>, Error> {
  const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT } = params;

  return useQuery<PaginatedResponse<Team>, Error>({
    queryKey: [...TEAMS_KEY, { page, limit }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Team>>('/teams', {
        params: { page, limit },
      });

      return data;
    },
    ...options,
  });
}

type UseCreateTeamOptions = Omit<UseMutationOptions<Team, Error, TeamCreate>, 'mutationFn'>;

export function useCreateTeam(
  options?: UseCreateTeamOptions,
): UseMutationResult<Team, Error, TeamCreate> {
  const queryClient = useQueryClient();

  return useMutation<Team, Error, TeamCreate>({
    mutationFn: async (payload) => {
      const { data } = await api.post<Team>('/teams', payload);

      return data;
    },
    ...options,
    onSuccess: (...args: Parameters<NonNullable<UseCreateTeamOptions['onSuccess']>>) => {
      void queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

type UseUpdateTeamVariables = { id: string } & TeamUpdate;
type UseUpdateTeamOptions = Omit<
  UseMutationOptions<Team, Error, UseUpdateTeamVariables>,
  'mutationFn'
>;

export function useUpdateTeam(
  options?: UseUpdateTeamOptions,
): UseMutationResult<Team, Error, UseUpdateTeamVariables> {
  const queryClient = useQueryClient();

  return useMutation<Team, Error, UseUpdateTeamVariables>({
    mutationFn: async ({ id, ...payload }) => {
      const { data } = await api.patch<Team>(`/teams/${id}`, payload);

      return data;
    },
    ...options,
    onSuccess: (...args: Parameters<NonNullable<UseUpdateTeamOptions['onSuccess']>>) => {
      void queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}

type UseArchiveTeamOptions = Omit<UseMutationOptions<Team, Error, string>, 'mutationFn'>;

export function useArchiveTeam(
  options?: UseArchiveTeamOptions,
): UseMutationResult<Team, Error, string> {
  const queryClient = useQueryClient();

  return useMutation<Team, Error, string>({
    mutationFn: async (id) => {
      const { data } = await api.patch<Team>(`/teams/${id}/archive`);

      return data;
    },
    ...options,
    onSuccess: (...args: Parameters<NonNullable<UseArchiveTeamOptions['onSuccess']>>) => {
      void queryClient.invalidateQueries({ queryKey: TEAMS_KEY });
      options?.onSuccess?.(...args);
    },
  });
}
