'use client';

import type { Team, TeamCreate, TeamMemberAdd, TeamUpdate, UserTeam } from '@happyrisk/core';

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

type UseTeamsOptions = Omit<UseQueryOptions<Team[], Error>, 'queryKey' | 'queryFn'>;

export function useTeams(options?: UseTeamsOptions): UseQueryResult<Team[], Error> {
  return useQuery<Team[], Error>({
    queryKey: TEAMS_KEY,
    queryFn: async () => {
      const { data } = await api.get<Team[]>('/teams');

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

export const userTeamsKey = (userId: string) => [...TEAMS_KEY, 'memberships', userId] as const;

type UseUserTeamsOptions = Omit<UseQueryOptions<UserTeam[], Error>, 'queryKey' | 'queryFn'>;

export function useUserTeams(
  userId: string,
  options?: UseUserTeamsOptions,
): UseQueryResult<UserTeam[], Error> {
  return useQuery<UserTeam[], Error>({
    queryKey: userTeamsKey(userId),
    queryFn: async () => {
      const { data } = await api.get<UserTeam[]>(`/users/${userId}/memberships`);

      return data;
    },
    ...options,
  });
}

type AddTeamMemberVariables = { teamId: string } & TeamMemberAdd;
type UseAddTeamMemberOptions = Omit<
  UseMutationOptions<void, Error, AddTeamMemberVariables>,
  'mutationFn'
>;

export function useAddTeamMember(
  userId: string,
  options?: UseAddTeamMemberOptions,
): UseMutationResult<void, Error, AddTeamMemberVariables> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, AddTeamMemberVariables>({
    mutationFn: async ({ teamId, ...payload }) => {
      await api.post(`/teams/${teamId}/members`, payload);
    },
    ...options,
    onSuccess: (...args: Parameters<NonNullable<UseAddTeamMemberOptions['onSuccess']>>) => {
      void queryClient.invalidateQueries({ queryKey: userTeamsKey(userId) });
      options?.onSuccess?.(...args);
    },
  });
}

type RemoveTeamMemberVariables = { teamId: string; userId: string };
type UseRemoveTeamMemberOptions = Omit<
  UseMutationOptions<void, Error, RemoveTeamMemberVariables>,
  'mutationFn'
>;

export function useRemoveTeamMember(
  userId: string,
  options?: UseRemoveTeamMemberOptions,
): UseMutationResult<void, Error, RemoveTeamMemberVariables> {
  const queryClient = useQueryClient();

  return useMutation<void, Error, RemoveTeamMemberVariables>({
    mutationFn: async ({ teamId, userId: memberId }) => {
      await api.delete(`/teams/${teamId}/members/${memberId}`);
    },
    ...options,
    onSuccess: (...args: Parameters<NonNullable<UseRemoveTeamMemberOptions['onSuccess']>>) => {
      void queryClient.invalidateQueries({ queryKey: userTeamsKey(userId) });
      options?.onSuccess?.(...args);
    },
  });
}
