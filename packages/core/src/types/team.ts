export interface Team {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserTeam {
  id: string;
  teamId: string;
  joinedAt: string;
  team: {
    id: string;
    name: string;
    isActive: boolean;
  };
}
