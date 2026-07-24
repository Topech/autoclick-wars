import { Player, GameState, ClickEvent } from './types.js';
export declare function getGameState(): {
    gnomesScore: number;
    soldiersScore: number;
    playerCount: number;
};
export declare function getPlayer(playerId: string): Player | undefined;
export declare function joinPlayer(id: string, name: string): Promise<Player>;
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
    effect: (level: number) => number;
    category: "click" | "auto" | "crit" | "team";
}[];
export declare function gameLoop(tickCallback: (state: GameState, tickCount: number) => void): Promise<() => void>;
