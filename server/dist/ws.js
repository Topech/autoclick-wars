import { WebSocketServer } from 'ws';
import express from 'express';
import http from 'http';
import { joinPlayer, handlePlayerClick, buyUpgrade, getUpgradeInfo, getGameState } from './game.js';
import { getLeaderboard } from './db.js';
const PORT = process.env.GAME_SERVER_PORT || 3001;
let wss;
export function startServer() {
    const app = express();
    // Serve static client
    app.use(express.static('../client/dist'));
    const httpServer = http.createServer(app);
    wss = new WebSocketServer({ server: httpServer });
    httpServer.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
    wss.on('close', () => {
        console.log('WebSocket server closed');
    });
    wss.on('connection', (wsRaw) => {
        const ws = wsRaw;
        console.log('New WebSocket connection');
        ws.on('message', async (data) => {
            let msg;
            try {
                msg = JSON.parse(data);
            }
            catch {
                return;
            }
            switch (msg.type) {
                case 'join': {
                    const player = await joinPlayer(msg.id, msg.name);
                    ws.playerId = player.id;
                    ws.team = player.team;
                    broadcastToTeam(ws.team, {
                        type: 'player_joined',
                        player: { id: player.id, name: player.name, team: player.team },
                    });
                    ws.send(JSON.stringify({
                        type: 'joined',
                        player: serializePlayer(player),
                        gameState: getGameState(),
                    }));
                    break;
                }
                case 'click': {
                    const result = handlePlayerClick(ws.playerId);
                    if (result) {
                        ws.send(JSON.stringify({
                            type: 'click_result',
                            points: result.points,
                            isCrit: result.isCrit,
                            gameState: getGameState(),
                        }));
                        broadcastToAll({
                            type: 'score_update',
                            gameState: getGameState(),
                        });
                    }
                    break;
                }
                case 'buy_upgrade': {
                    const result = buyUpgrade(ws.playerId, msg.upgradeId);
                    if (result.success) {
                        const upgrades = getUpgradeInfo(ws.playerId);
                        ws.send(JSON.stringify({
                            type: 'upgrade_bought',
                            upgradeId: msg.upgradeId,
                            newLevel: result.newLevel,
                            cost: result.cost,
                            upgrades,
                            gameState: getGameState(),
                        }));
                    }
                    else {
                        ws.send(JSON.stringify({
                            type: 'upgrade_failed',
                            reason: 'insufficient_points',
                        }));
                    }
                    break;
                }
                case 'get_leaderboard': {
                    const lb = await getLeaderboard(ws.team);
                    ws.send(JSON.stringify({
                        type: 'leaderboard',
                        entries: lb.map((e, i) => ({
                            id: e.id,
                            name: e.name,
                            team: e.team,
                            totalPoints: e.total_points,
                            totalClicks: e.total_clicks,
                            rank: i + 1,
                        })),
                    }));
                    break;
                }
                case 'ping': {
                    ws.send(JSON.stringify({ type: 'pong' }));
                    break;
                }
            }
        });
        ws.on('close', () => {
            console.log('WebSocket disconnected');
        });
    });
    return { app, wss };
}
function serializePlayer(player) {
    return {
        id: player.id,
        name: player.name,
        team: player.team,
        points: player.points,
        totalPoints: player.totalPoints,
        totalClicks: player.totalClicks,
        upgrades: player.upgrades,
    };
}
function broadcastToTeam(team, message) {
    const data = JSON.stringify(message);
    for (const ws of wss.clients) {
        if (ws.team === team) {
            ws.send(data);
        }
    }
}
function broadcastToAll(message) {
    const data = JSON.stringify(message);
    for (const ws of wss.clients) {
        ws.send(data);
    }
}
export { wss };
