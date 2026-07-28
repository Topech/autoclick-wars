import { allUpgrades, getUpgradeCost } from './upgrades.js';
const TICK_MS = 100;
let gameState = {
    gnomesScore: 0,
    soldiersScore: 0,
    players: new Map(),
};
let tickCount = 0;
// Buffer passive income per player to aggregate per-second contributions
const passiveBuffer = new Map();
let contributionEvents = [];
export function addContribution(playerId, playerName, team, points) {
    if (points >= 1) {
        contributionEvents.push({ playerId, playerName, team, points });
    }
}
export function getContributions() {
    const events = [...contributionEvents];
    contributionEvents.length = 0;
    return events;
}
export function getGameState() {
    return {
        gnomesScore: gameState.gnomesScore,
        soldiersScore: gameState.soldiersScore,
        playerCount: gameState.players.size,
    };
}
export function getLeaderboardFromMemory(team, limit = 20) {
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
export function getPlayer(playerId) {
    return gameState.players.get(playerId);
}
export function getPlayers() {
    return gameState.players;
}
export function disconnectPlayer(id) {
    const player = gameState.players.get(id);
    if (player) {
        player.lastSeen = 0;
    }
}
export async function joinPlayer(name) {
    const normalizedName = name.toLowerCase().trim();
    // Check if name is already taken by an active connection
    for (const [pid, p] of gameState.players) {
        if (p.name.toLowerCase() === normalizedName && p.lastSeen > 0) {
            return { error: `Player "${name}" is already connected` };
        }
    }
    // Check for disconnected entries in gameState.players with the same name (adopt their data)
    let existingPlayer;
    for (const [pid, p] of gameState.players) {
        if (p.name.toLowerCase() === normalizedName && p.lastSeen === 0) {
            existingPlayer = p;
            break;
        }
    }
    if (existingPlayer) {
        existingPlayer.lastSeen = Date.now();
        recalcScores();
        return { player: existingPlayer };
    }
    // Generate new ID server-side
    const id = crypto.randomUUID();
    // Assign team (balance teams)
    const gnomesCount = [...gameState.players.values()].filter(p => p.team === 'gnomes').length;
    const soldiersCount = [...gameState.players.values()].filter(p => p.team === 'soldiers').length;
    const team = gnomesCount <= soldiersCount ? 'gnomes' : 'soldiers';
    const player = {
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
    recalcScores();
    return { player };
}
export function handlePlayerClick(playerId) {
    const player = gameState.players.get(playerId);
    if (!player)
        return null;
    player.lastSeen = Date.now();
    // Calculate click power
    const clickUpgradeLevel = player.team === 'gnomes' ? (player.upgrades['beer_chug'] || 0) : (player.upgrades['drill_sergeant'] || 0);
    const hatLevel = player.team === 'gnomes' ? (player.upgrades['hat_collection'] || 0) : 0;
    const formationLevel = player.team === 'soldiers' ? (player.upgrades['battle_formation'] || 0) : 0;
    let clickPower = 1 + clickUpgradeLevel;
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
    addContribution(player.id, player.name, player.team, points);
    recalcScores();
    return { playerId, points, isCrit, timestamp: Date.now() };
}
export function buyUpgrade(playerId, upgradeId) {
    const player = gameState.players.get(playerId);
    if (!player)
        return { success: false, cost: 0, newLevel: 0 };
    const upgradeDef = allUpgrades.find(u => u.id === upgradeId);
    if (!upgradeDef || upgradeDef.team !== player.team)
        return { success: false, cost: 0, newLevel: 0 };
    const currentLevel = player.upgrades[upgradeId] || 0;
    const cost = getUpgradeCost(upgradeDef, currentLevel);
    if (player.points < cost)
        return { success: false, cost, newLevel: currentLevel };
    player.points -= cost;
    player.upgrades[upgradeId] = currentLevel + 1;
    recalcScores();
    return { success: true, cost, newLevel: currentLevel + 1 };
}
export function getUpgradeInfo(playerId) {
    const player = gameState.players.get(playerId);
    if (!player)
        return [];
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
export function getClickPower(player) {
    const clickUpgradeLevel = player.team === 'gnomes' ? (player.upgrades['beer_chug'] || 0) : (player.upgrades['drill_sergeant'] || 0);
    const hatLevel = player.team === 'gnomes' ? (player.upgrades['hat_collection'] || 0) : 0;
    const formationLevel = player.team === 'soldiers' ? (player.upgrades['battle_formation'] || 0) : 0;
    let clickPower = 1 + clickUpgradeLevel;
    const teamBonus = 1 + hatLevel * 0.05 + formationLevel * 0.05;
    return clickPower * teamBonus;
}
export function recalcScores() {
    let gnomes = 0;
    let soldiers = 0;
    for (const player of gameState.players.values()) {
        if (player.team === 'gnomes')
            gnomes += player.totalPoints;
        else
            soldiers += player.totalPoints;
    }
    gameState.gnomesScore = gnomes;
    gameState.soldiersScore = soldiers;
}
export async function gameLoop(tickCallback) {
    const interval = setInterval(() => {
        tickCount++;
        // Calculate passive income for each player
        for (const player of gameState.players.values()) {
            let autoClickers = 0;
            if (player.team === 'gnomes') {
                autoClickers += (player.upgrades['mushroom_stool'] || 0);
                autoClickers += (player.upgrades['gnome_army'] || 0) * 50;
            }
            else {
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
            // Buffer passive income to aggregate per-second contributions
            const currentBuffer = passiveBuffer.get(player.id) || 0;
            passiveBuffer.set(player.id, currentBuffer + passivePoints);
        }
        // Flush passive buffer every 11 seconds (every 11 ticks)
        if (tickCount % 11 === 0) {
            for (const [playerId, points] of passiveBuffer.entries()) {
                if (points >= 1) {
                    const player = gameState.players.get(playerId);
                    if (player) {
                        addContribution(player.id, player.name, player.team, points);
                    }
                }
            }
            passiveBuffer.clear();
        }
        recalcScores();
        tickCallback(gameState, tickCount);
    }, TICK_MS);
    return () => clearInterval(interval);
}
