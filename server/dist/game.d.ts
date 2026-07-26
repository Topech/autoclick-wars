import { Player, GameState, ClickEvent } from './types.js';
interface ContributionEvent {
    playerId: string;
    playerName: string;
    team: 'gnomes' | 'soldiers';
    points: number;
}
export declare function addContribution(playerId: string, playerName: string, team: 'gnomes' | 'soldiers', points: number): void;
export declare function getContributions(): ContributionEvent[];
export declare function getGameState(): {
    gnomesScore: number;
    soldiersScore: number;
    playerCount: number;
};
export declare function getLeaderboardFromMemory(team?: 'gnomes' | 'soldiers', limit?: number): any[];
export declare function getPlayer(playerId: string): Player | undefined;
export declare function getPlayers(): Map<string, Player>;
export declare function removePlayer(id: string): void;
export declare function isNameTaken(name: string): boolean;
export declare function joinPlayer(id: string, name: string): Promise<{
    player?: Player;
    error?: string;
}>;
export declare function handlePlayerClick(playerId: string): ClickEvent | null;
export declare function buyUpgrade(playerId: string, upgradeId: string): {
    success: boolean;
    cost: number;
    newLevel: number;
};
export declare function getUpgradeInfo(playerId: string): {
    currentLevel: number;
    nextCost: number;
    id: string;
    name: string;
    description: string;
    team: import("./types.js").Team;
    baseCost: number;
    costMultiplier: number;
    category: "click" | "auto" | "crit" | "team";
}[];
export declare function getAllUpgrades(): {
    id: string;
    name: string;
    description: string;
    team: import("./types.js").Team;
    baseCost: number;
    costMultiplier: number;
    category: "click" | "auto" | "crit" | "team";
}[];
export declare function getClickPower(player: Player): number;
export declare function recalcScores(): void;
export declare function gameLoop(tickCallback: (state: GameState, tickCount: number) => void): Promise<() => void>;
export {};
