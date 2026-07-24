import { Player, GameState, ClickEvent } from './types.js';
import { allUpgrades, getUpgradeCost } from './upgrades.js';
import { savePlayer, loadPlayer, cleanupOfflinePlayers } from './db.js';

const TICK_MS = 100;
const SAVE_INTERVAL_MS = 30000;
const CLEANUP_INTERVAL_MS = 300000;
const OFFLINE_THRESHOLD_MS = 3600000; // 1 hour

let gameState: GameState = {
  gnomesScore: 0,
  soldiersScore: 0,
  players: new Map(),
};

let tickCount = 0;

export function getGameState() {
  return {
    gnomesScore: gameState.gnomesScore,
    soldiersScore: gameState.soldiersScore,
    playerCount: gameState.players.size,
  };
}

export function getPlayer(playerId: string): Player | undefined {
  return gameState.players.get(playerId);
}

export async function joinPlayer(id: string, name: string): Promise<Player> {
  // Try to load existing player from DB
  const existing = await loadPlayer(id);
  if (existing) {
    gameState.players.set(id, existing);
    recalcScores();
    return existing;
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
  await savePlayer(player);
  recalcScores();
  return player;
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

function recalcScores(): void {
  let gnomes = 0;
  let soldiers = 0;
  for (const player of gameState.players.values()) {
    if (player.team === 'gnomes') gnomes += player.points;
    else soldiers += player.points;
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

    // Save every 30 seconds
    if (tickCount % (SAVE_INTERVAL_MS / TICK_MS) === 0) {
      for (const player of gameState.players.values()) {
        savePlayer(player).catch(() => {});
      }
    }

    // Cleanup offline players every 5 minutes
    if (tickCount % (CLEANUP_INTERVAL_MS / TICK_MS) === 0) {
      const cutoff = Date.now() - OFFLINE_THRESHOLD_MS;
      cleanupOfflinePlayers(cutoff).catch(() => {});
      for (const [id, player] of gameState.players) {
        if (player.lastSeen < cutoff) {
          savePlayer(player).catch(() => {});
          gameState.players.delete(id);
        }
      }
      recalcScores();
    }
  }, TICK_MS);

  return () => clearInterval(interval);
}
