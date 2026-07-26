export type Team = 'gnomes' | 'soldiers';

export interface Player {
  id: string;
  name: string;
  team: Team;
  points: number;
  totalPoints: number;
  totalClicks: number;
  upgrades: Record<string, number>;
  lastSeen: number;
  createdAt: number;
}

export interface GameState {
  gnomesScore: number;
  soldiersScore: number;
  players: Map<string, Player>;
}

export interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  team: Team;
  baseCost: number;
  costMultiplier: number;
  category: 'click' | 'auto' | 'crit' | 'team';
}

export interface ClickEvent {
  playerId: string;
  points: number;
  isCrit: boolean;
  timestamp: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  team: Team;
  totalPoints: number;
  totalClicks: number;
  rank: number;
}
