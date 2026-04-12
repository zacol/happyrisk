'use client';

import { CreateTeamDialog } from '@/components/teams/CreateTeamDialog';
import { TeamsTable } from '@/components/teams/TeamsTable';
import { useTeams } from '@/hooks/useTeams';

export default function TeamsPage() {
  const { data: teams, isLoading, isError } = useTeams();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Failed to load teams. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">Manage teams and their status.</p>
        </div>
        <CreateTeamDialog />
      </div>
      <TeamsTable teams={teams ?? []} />
    </div>
  );
}
