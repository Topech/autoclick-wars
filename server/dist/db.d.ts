import { Player } from './types.js';
export declare function initDB(): Promise<void>;
export declare function savePlayer(player: Player): Promise<void>;
export declare function loadPlayer(id: string): Promise<Player | null>;
export declare function getLeaderboard(team?: 'gnomes' | 'soldiers', limit?: number): Promise<any[]>;
export declare function getTeamScores(): Promise<{
    gnomes: number;
    soldiers: number;
}>;
export declare function cleanupOfflinePlayers(cutoff: number): Promise<void>;
