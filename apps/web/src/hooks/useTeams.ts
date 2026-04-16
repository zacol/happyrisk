'use client';

import {
  DEFAULT_PAGE_INDEX,
  DEFAULT_PAGE_SIZE,
  type ListResponse,
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
  pageIndex?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

type UseTeamsOptions = Omit<UseQueryOptions<ListResponse<Team>, Error>, 'queryKey' | 'queryFn'>;

export function useTeams(
  params: UseTeamsParams = {},
  options?: UseTeamsOptions,
): UseQueryResult<ListResponse<Team>, Error> {
  const { pageIndex = DEFAULT_PAGE_INDEX, pageSize = DEFAULT_PAGE_SIZE, sortBy, sortDir } = params;

  return useQuery<ListResponse<Team>, Error>({
    queryKey: [...TEAMS_KEY, { pageIndex, pageSize, sortBy, sortDir }],
    queryFn: async () => {
      const { data } = await api.get<ListResponse<Team>>('/teams', {
        params: { pageIndex, pageSize, sortBy, sortDir },
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
