import { Player, GameState, ClickEvent } from './types.js';
import { allUpgrades, getUpgradeCost } from './upgrades.js';

const TICK_MS = 100;

let gameState: GameState = {
  gnomesScore: 0,
  soldiersScore: 0,
  players: new Map(),
};

let tickCount = 0;

// Track names currently taken by active connections
const nameToId = new Map<string, string>();

export function getGameState() {
  return {
    gnomesScore: gameState.gnomesScore,
    soldiersScore: gameState.soldiersScore,
    playerCount: gameState.players.size,
  };
}

export function getLeaderboardFromMemory(team?: 'gnomes' | 'soldiers', limit = 20): any[] {
  const players = [...gameState.players.values()];
  const filtered = team ? players.filter(p => p.team === team) : players;
  return filtered
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, limit)
    .map((p, i) => ({
      id: p.id,
      name: p.name,
      team: p.team,
      totalPoints: p.totalPoints,
      totalClicks: p.totalClicks,
      rank: i + 1,
    }));
}

export function getPlayer(playerId: string): Player | undefined {
  return gameState.players.get(playerId);
}

export function getPlayers(): Map<string, Player> {
  return gameState.players;
}

export function removePlayer(id: string) {
  const player = gameState.players.get(id);
  if (player) {
    nameToId.delete(player.name.toLowerCase());
    // Keep player in memory so points/upgrades survive disconnects
    // Only remove the name mapping so others can use that name
  }
}

export function isNameTaken(name: string): boolean {
  return nameToId.has(name.toLowerCase());
}

export async function joinPlayer(id: string, name: string): Promise<{ player?: Player; error?: string }> {
  const normalizedName = name.toLowerCase().trim();

  // Check if name is already taken by an active player
  const existingIdForName = nameToId.get(normalizedName);
  if (existingIdForName) {
    return { error: `Player "${name}" is already connected` };
  }

  // Check if player already exists in memory (rejoin with same ID)
  const existing = gameState.players.get(id);
  if (existing) {
    // Remove old name mapping and add new one
    nameToId.delete(existing.name.toLowerCase());
    existing.name = name;
    existing.lastSeen = Date.now();
    nameToId.set(normalizedName, existing.id);
    recalcScores();
    return { player: existing };
  }

  // Assign team (balance teams)
  const gnomesCount = [...gameState.players.values()].filter(p => p.team === 'gnomes').length;
  const soldiersCount = [...gameState.players.values()].filter(p => p.team === 'soldiers').length;
  const team = gnomesCount <= soldiersCount ? 'gnomes' : 'soldiers';

  const player: Player = {
    id,
    name,
    team,
    points: 0,
    totalPoints: 0,
    totalClicks: 0,
    upgrades: {},
    lastSeen: Date.now(),
    createdAt: Date.now(),
  };

  gameState.players.set(id, player);
  nameToId.set(normalizedName, id);
  recalcScores();
  return { player };
}

export function handlePlayerClick(playerId: string): ClickEvent | null {
  const player = gameState.players.get(playerId);
  if (!player) return null;

  player.lastSeen = Date.now();

  // Calculate click power
  const beerLevel = player.upgrades['beer_chug'] || 0;
  const hatLevel = player.team === 'gnomes' ? (player.upgrades['hat_collection'] || 0) : 0;
  const formationLevel = player.team === 'soldiers' ? (player.upgrades['battle_formation'] || 0) : 0;

  let clickPower = Math.pow(2, beerLevel);
  const teamBonus = 1 + hatLevel * 0.05 + formationLevel * 0.05;
  clickPower *= teamBonus;

  // Check for crit (Epic Fart / Air Horn)
  const fartLevel = player.team === 'gnomes' ? (player.upgrades['epic_fart'] || 0) : 0;
  const airHornLevel = player.team === 'soldiers' ? (player.upgrades['air_horn'] || 0) : 0;
  const critChance = (fartLevel + airHornLevel) * 0.10;
  const isCrit = Math.random() < critChance;

  const points = isCrit ? clickPower * 3 : clickPower;

  player.points += points;
  player.totalPoints += points;
  player.totalClicks++;

  recalcScores();
  return { playerId, points, isCrit, timestamp: Date.now() };
}

export function buyUpgrade(playerId: string, upgradeId: string): { success: boolean; cost: number; newLevel: number } {
  const player = gameState.players.get(playerId);
  if (!player) return { success: false, cost: 0, newLevel: 0 };

  const upgradeDef = allUpgrades.find(u => u.id === upgradeId);
  if (!upgradeDef || upgradeDef.team !== player.team) return { success: false, cost: 0, newLevel: 0 };

  const currentLevel = player.upgrades[upgradeId] || 0;
  const cost = getUpgradeCost(upgradeDef, currentLevel);

  if (player.points < cost) return { success: false, cost, newLevel: currentLevel };

  player.points -= cost;
  player.upgrades[upgradeId] = currentLevel + 1;

  recalcScores();
  return { success: true, cost, newLevel: currentLevel + 1 };
}

export function getUpgradeInfo(playerId: string) {
  const player = gameState.players.get(playerId);
  if (!player) return [];

  const teamUpgrades = allUpgrades.filter(u => u.team === player.team);
  return teamUpgrades.map(upgrade => ({
    ...upgrade,
    currentLevel: player.upgrades[upgrade.id] || 0,
    nextCost: getUpgradeCost(upgrade, player.upgrades[upgrade.id] || 0),
  }));
}

export function getAllUpgrades() {
  return allUpgrades.map(u => ({ ...u }));
}

export function getClickPower(player: Player): number {
  const beerLevel = player.upgrades['beer_chug'] || 0;
  const hatLevel = player.team === 'gnomes' ? (player.upgrades['hat_collection'] || 0) : 0;
  const formationLevel = player.team === 'soldiers' ? (player.upgrades['battle_formation'] || 0) : 0;

  let clickPower = Math.pow(2, beerLevel);
  const teamBonus = 1 + hatLevel * 0.05 + formationLevel * 0.05;
  return clickPower * teamBonus;
}

export function recalcScores(): void {
  let gnomes = 0;
  let soldiers = 0;
  for (const player of gameState.players.values()) {
    if (player.team === 'gnomes') gnomes += player.totalPoints;
    else soldiers += player.totalPoints;
  }
  gameState.gnomesScore = gnomes;
  gameState.soldiersScore = soldiers;
}

export async function gameLoop(tickCallback: (state: GameState, tickCount: number) => void): Promise<() => void> {
  const interval = setInterval(() => {
    tickCount++;

    // Calculate passive income for each player
    for (const player of gameState.players.values()) {
      let autoClickers = 0;

      if (player.team === 'gnomes') {
        autoClickers += (player.upgrades['mushroom_stool'] || 0);
        autoClickers += (player.upgrades['gnome_army'] || 0) * 50;
      } else {
        autoClickers += (player.upgrades['plastic_ruler'] || 0);
        autoClickers += (player.upgrades['tank_division'] || 0) * 50;
      }

      // Apply team bonus to passive income
      const hatLevel = player.team === 'gnomes' ? (player.upgrades['hat_collection'] || 0) : 0;
      const formationLevel = player.team === 'soldiers' ? (player.upgrades['battle_formation'] || 0) : 0;
      const teamBonus = 1 + hatLevel * 0.05 + formationLevel * 0.05;

      const passivePoints = autoClickers * teamBonus * (TICK_MS / 1000);
      player.points += passivePoints;
      player.totalPoints += passivePoints;
    }

    recalcScores();
    tickCallback(gameState, tickCount);
  }, TICK_MS);

  return () => clearInterval(interval);
}
